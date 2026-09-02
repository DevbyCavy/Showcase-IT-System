// Path A of the AI Takeoff / BOQ Generator pipeline (see design doc §3.2) — reads the PDF's
// embedded text layer directly via pdfjs-dist and regexes it for dimension notations and material
// callouts. No vision model call, no guesswork: every item this produces is source: 'Extracted',
// confidence: 'High', because the numbers came straight from the file.

import fs from 'node:fs/promises'
import type { TakeoffExtractedItem } from '../types/takeoff.types'

// pdfjs-dist v6 ships ESM-only while the server is CommonJS, same reason pdfBrowser.ts dynamic-
// imports puppeteer-core. Uses the `legacy` build specifically — the default (browser-targeted)
// build throws `hashOriginal.toHex is not a function` under plain Node (confirmed by hand:
// pdfjs-dist itself warns "Please use the legacy build in Node.js environments" when the default
// build is loaded here). No GlobalWorkerOptions.workerSrc is configured — pdfjs-dist detects it's
// running under Node and falls back to an in-process "fake worker" automatically (logs a harmless
// warning), which is sufficient here; wiring a real worker thread isn't worth the extra machinery
// for a request-triggered background job like this one.
const loadPdfjs = () => import('pdfjs-dist/legacy/build/pdf.mjs')

// Matches "1200x800x2400", "1200 x 800 x 2400", "W1200 x H800 x L2400", "1200mm x 800mm", with or
// without a third (length) dimension and with or without "mm" units.
const DIMENSION_RE =
  /\b(?:[WwHhLl]\s*)?(\d{2,5})\s*(?:mm)?\s*[x×X]\s*(?:[WwHhLl]\s*)?(\d{2,5})\s*(?:mm)?(?:\s*[x×X]\s*(?:[WwHhLl]\s*)?(\d{2,5})\s*(?:mm)?)?\b/g

function extractDimensions(text: string): { widthMm: number; heightMm: number; lengthMm: number | null }[] {
  const matches: { widthMm: number; heightMm: number; lengthMm: number | null }[] = []
  for (const m of text.matchAll(DIMENSION_RE)) {
    matches.push({
      widthMm: Number(m[1]),
      heightMm: Number(m[2]),
      lengthMm: m[3] ? Number(m[3]) : null,
    })
  }
  return matches
}

function findMaterialMentions(text: string, materialNames: string[]): string[] {
  const lower = text.toLowerCase()
  return materialNames.filter((name) => lower.includes(name.toLowerCase()))
}

// Returns both the reconstructed candidate items and whether any usable text was found at all —
// the latter feeds the design's pdfType classification (Cad/Rendered/Mixed), independent of
// whether the regex passes actually matched anything.
export async function extractPathA(
  pdfPath: string,
  materialNames: string[],
): Promise<{ items: TakeoffExtractedItem[]; textFound: boolean }> {
  const pdfjs = await loadPdfjs()
  const buffer = await fs.readFile(pdfPath)
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) })
  const doc = await loadingTask.promise

  let fullText = ''
  const items: TakeoffExtractedItem[] = []

  try {
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum)
      const content = await page.getTextContent()
      const pageText = content.items.map((it) => ('str' in it ? it.str : '')).join(' ')
      fullText += `\n${pageText}`

      const dimensions = extractDimensions(pageText)
      const materials = findMaterialMentions(pageText, materialNames)

      // Pair each dimension callout on the page with a material mentioned on the same page, by
      // matching order of appearance (dimension i <-> material i) when the counts line up —
      // materially better than always picking materials[0], though still not a true spatial match
      // against the PDF's coordinates (a reasonable v0.1 heuristic; single-callout pages, the
      // common CAD-export case, are unaffected either way).
      dimensions.forEach((dim, i) => {
        const material = materials[i] ?? materials[0] ?? null
        items.push({
          description: material ? `${material} panel` : `Item (page ${pageNum})`,
          category: 'Structure',
          material,
          widthMm: dim.widthMm,
          heightMm: dim.heightMm,
          lengthMm: dim.lengthMm,
          unit: 'each',
          quantity: 1,
          source: 'Extracted',
          confidence: 'High',
          notes: `Extracted from page ${pageNum} text layer.`,
        })
      })

      // A material mentioned on a page with no dimension callout nearby still means something
      // was labeled — worth a line item even without measurements, flagged as such in notes.
      if (dimensions.length === 0) {
        for (const material of materials) {
          items.push({
            description: `${material} (dimensions not labeled)`,
            category: 'Cladding',
            material,
            widthMm: null,
            heightMm: null,
            lengthMm: null,
            unit: 'each',
            quantity: 1,
            source: 'Extracted',
            confidence: 'Medium',
            notes: `Material callout found on page ${pageNum}, no adjacent dimension notation.`,
          })
        }
      }
    }
  } finally {
    await loadingTask.destroy()
  }

  return { items, textFound: fullText.trim().length > 20 }
}
