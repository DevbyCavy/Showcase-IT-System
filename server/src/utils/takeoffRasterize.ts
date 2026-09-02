// Renders every page of a PDF to a PNG buffer — shared by takeoffExtraction.service.ts to build
// the image list Path B sends to Claude. Split out from takeoffPathB.ts in v0.2 so the same
// rasterized pages can be reused across the first extraction pass and the finalization pass
// without duplicating the pdfjs-dist wiring.

import fs from 'node:fs/promises'
import type { TakeoffPageImage } from './takeoffPathB'

// pdfjs-dist v6 ships ESM-only while the server is CommonJS, same reason pdfBrowser.ts dynamic-
// imports puppeteer-core. Uses the `legacy` build specifically — the default (browser-targeted)
// build throws `hashOriginal.toHex is not a function` under plain Node.
const loadPdfjs = () => import('pdfjs-dist/legacy/build/pdf.mjs')

const RENDER_SCALE = 1.5

export async function rasterizePdf(pdfPath: string): Promise<TakeoffPageImage[]> {
  const pdfjs = await loadPdfjs()
  const buffer = await fs.readFile(pdfPath)
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) })
  const doc = await loadingTask.promise

  const images: TakeoffPageImage[] = []

  try {
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum)
      const viewport = page.getViewport({ scale: RENDER_SCALE })
      // doc.canvasFactory is pdfjs-dist's internal NodeCanvasFactory (backed by @napi-rs/canvas —
      // pdfjs-dist detects it's running under Node and defaults to it automatically); its
      // create()/destroy() aren't in pdfjs-dist's public types, and the canvas/context objects it
      // returns aren't the DOM types pdfjs-dist's own RenderParameters type expects either (no
      // "dom" lib here, this is a server process) — cast loosely at this boundary rather than
      // fight two mismatched ambient type sets for objects that are duck-typed at runtime anyway.
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
        images.push({ data: png, mediaType: 'image/png' })
      } finally {
        canvasFactory.destroy(canvasAndContext)
      }
    }
  } finally {
    await loadingTask.destroy()
  }

  return images
}
