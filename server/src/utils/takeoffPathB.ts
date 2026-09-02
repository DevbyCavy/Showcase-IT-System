// Path B of the AI Takeoff / BOQ Generator pipeline (see design doc §3.2) — rasterizes each PDF
// page and asks a vision-capable Claude model to (1) transcribe any visible labels the text layer
// missed and (2) predict unlabeled furniture/electrical items. Always runs alongside Path A (see
// takeoffExtraction.service.ts) since it's the only source of predicted items; every item this
// produces is source: 'Predicted' or 'Inferred', never 'Extracted'.

import fs from 'node:fs/promises'
import Anthropic from '@anthropic-ai/sdk'
import { env } from '../config/env'
import type { TakeoffExtractedItem } from '../types/takeoff.types'
import type { TakeoffItemCategory, TakeoffItemConfidence } from '#prisma-client'

// pdfjs-dist v6 ships ESM-only while the server is CommonJS — same dynamic-import treatment as
// takeoffPathA.ts / pdfBrowser.ts, and same `legacy` build requirement (see takeoffPathA.ts for
// why — the default build throws under plain Node). Rasterization needs no explicit canvas
// wiring: pdfjs-dist detects it's running under Node and defaults its internal CanvasFactory to
// NodeCanvasFactory, which is backed by @napi-rs/canvas — that's the entire reason @napi-rs/canvas
// is a dependency here at all (chosen over the design doc's node-canvas — see the implementation
// plan).
const loadPdfjs = () => import('pdfjs-dist/legacy/build/pdf.mjs')

const RENDER_SCALE = 1.5

const CATEGORIES: TakeoffItemCategory[] = ['Structure', 'Cladding', 'Electrical', 'Furniture', 'Other']
const CONFIDENCES: TakeoffItemConfidence[] = ['High', 'Medium', 'Low']

const SYSTEM_PROMPT = `You are assisting a quantity surveyor by reading a page from an exhibition stand / shopfitting design PDF.

Respond with ONLY a JSON array (no markdown code fences, no commentary before or after it). Each element must have exactly these fields:
{
  "description": string,
  "category": "Structure" | "Cladding" | "Electrical" | "Furniture" | "Other",
  "material": string or null,
  "widthMm": number or null,
  "heightMm": number or null,
  "lengthMm": number or null,
  "unit": "m2" | "linear_m" | "each",
  "quantity": number,
  "source": "predicted" | "inferred",
  "confidence": "high" | "medium" | "low",
  "notes": string or null
}

Rules:
- Use "inferred" for a surface/structure whose material you can identify by visual appearance alone (no text label on the page) — e.g. a panel that looks like it's Dibond or Supawood.
- Use "predicted" for furniture and electrical items visible in the render that have no callout at all (chairs, counters, spotlights, power points, TVs, etc.) — estimate quantity and, where a scale reference in the drawing makes it inferable, approximate size.
- Do NOT include items that already have a clear printed dimension/material label on the page — those are handled separately from the text layer.
- If nothing qualifies, return an empty array: []
- Every "notes" field must briefly say what visual cue led to the guess.`

function loadImageContentBlock(png: Buffer): Anthropic.Messages.ImageBlockParam {
  return {
    type: 'image',
    source: { type: 'base64', media_type: 'image/png', data: png.toString('base64') },
  }
}

function coerceCategory(value: unknown): TakeoffItemCategory {
  const match = CATEGORIES.find((c) => c.toLowerCase() === String(value).toLowerCase())
  return match ?? 'Other'
}

function coerceConfidence(value: unknown): TakeoffItemConfidence {
  const match = CONFIDENCES.find((c) => c.toLowerCase() === String(value).toLowerCase())
  return match ?? 'Low'
}

function parseItems(rawText: string): TakeoffExtractedItem[] {
  // Models are instructed not to wrap the response in markdown fences, but strip them
  // defensively — fence-wrapped JSON is still a common enough response shape to guard against.
  const cleaned = rawText.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed
    .filter((raw): raw is Record<string, unknown> => typeof raw === 'object' && raw !== null)
    .map((raw) => ({
      description: String(raw.description ?? 'Predicted item'),
      category: coerceCategory(raw.category),
      material: raw.material == null ? null : String(raw.material),
      widthMm: typeof raw.widthMm === 'number' ? raw.widthMm : null,
      heightMm: typeof raw.heightMm === 'number' ? raw.heightMm : null,
      lengthMm: typeof raw.lengthMm === 'number' ? raw.lengthMm : null,
      unit: typeof raw.unit === 'string' ? raw.unit : 'each',
      quantity: typeof raw.quantity === 'number' && raw.quantity > 0 ? raw.quantity : 1,
      // Path B never produces 'Extracted' — coerce anything unexpected to 'predicted' rather than
      // let a malformed response silently claim text-layer-grade certainty.
      source: String(raw.source).toLowerCase() === 'inferred' ? ('Inferred' as const) : ('Predicted' as const),
      confidence: coerceConfidence(raw.confidence),
      notes: raw.notes == null ? null : String(raw.notes),
    }))
}

export async function extractPathB(pdfPath: string): Promise<TakeoffExtractedItem[]> {
  if (!env.ANTHROPIC_API_KEY) {
    // Not an error — Path A alone still produces a usable (if less complete) result. The design
    // is marked Ready either way; see takeoffExtraction.service.ts.
    return []
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  const pdfjs = await loadPdfjs()
  const buffer = await fs.readFile(pdfPath)
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) })
  const doc = await loadingTask.promise

  const items: TakeoffExtractedItem[] = []

  try {
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum)
      const viewport = page.getViewport({ scale: RENDER_SCALE })
      // doc.canvasFactory is pdfjs-dist's internal NodeCanvasFactory (backed by @napi-rs/canvas —
      // see the module comment above); its create()/destroy() aren't in pdfjs-dist's public
      // types, and the canvas/context objects it returns aren't the DOM types pdfjs-dist's own
      // RenderParameters type expects either (no "dom" lib here, this is a server process) — cast
      // loosely at this boundary rather than fight two mismatched ambient type sets for objects
      // that are duck-typed at runtime regardless.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const canvasFactory = doc.canvasFactory as any
      const canvasAndContext = canvasFactory.create(viewport.width, viewport.height)

      try {
        await page.render({
          canvasContext: canvasAndContext.context,
          canvas: canvasAndContext.canvas,
          viewport,
        }).promise

        // @napi-rs/canvas's Canvas (not a DOM HTMLCanvasElement) — toBuffer is its API, not the
        // browser Canvas API's toDataURL/toBlob.
        const png = (canvasAndContext.canvas as { toBuffer(mime: 'image/png'): Buffer }).toBuffer('image/png')

        const response = await client.messages.create({
          model: env.ANTHROPIC_MODEL,
          max_tokens: 8000,
          thinking: { type: 'adaptive' },
          output_config: { effort: 'medium' },
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: [loadImageContentBlock(png), { type: 'text', text: `Page ${pageNum} of ${doc.numPages}.` }],
            },
          ],
        })

        const textBlock = response.content.find((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
        if (textBlock) {
          items.push(...parseItems(textBlock.text))
        }
      } finally {
        canvasFactory.destroy(canvasAndContext)
      }
    }
  } finally {
    await loadingTask.destroy()
  }

  return items
}
