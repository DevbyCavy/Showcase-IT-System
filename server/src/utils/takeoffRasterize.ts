// Renders every page of a PDF to a PNG buffer — shared by takeoffExtraction.service.ts to build
// the image list Path B sends to Claude. Split out from takeoffPathB.ts in v0.2 so the same
// rasterized pages can be reused across the first extraction pass and the finalization pass
// without duplicating the pdfjs-dist wiring.

import fs from 'node:fs/promises'
import path from 'node:path'
import type { TakeoffPageImage } from './takeoffPathB'

// pdfjs-dist v6 ships ESM-only while the server is CommonJS, same reason pdfBrowser.ts dynamic-
// imports puppeteer-core. Uses the `legacy` build specifically — the default (browser-targeted)
// build throws `hashOriginal.toHex is not a function` under plain Node.
const loadPdfjs = () => import('pdfjs-dist/legacy/build/pdf.mjs')

// pdfjs-dist ships its own cmaps/standard_fonts/wasm asset folders (used for CJK text, non-
// embedded font substitution, and the WASM JBIG2/OpenJPEG codecs respectively) but doesn't know
// where to find them at runtime unless told — left unset, it silently fails to decode anything
// that needs them (confirmed live: a JPEG2000-encoded embedded image renders as blank space, with
// only "JpxError: OpenJPEG failed to initialize" / "Ensure that the `wasmUrl` API parameter is
// provided" in the console — no thrown error, so nothing surfaces this to the caller). Resolved
// via require.resolve rather than a relative path so this doesn't break if pdfjs-dist's install
// location ever changes (e.g. hoisting).
function pdfjsAssetUrl(subdir: 'cmaps' | 'standard_fonts' | 'wasm'): string {
  const pdfjsRoot = path.dirname(require.resolve('pdfjs-dist/package.json'))
  // pdfjs-dist builds asset URLs via plain string concatenation (`${baseUrl}${filename}`), not
  // path.join, so the trailing slash is required here.
  return `${path.join(pdfjsRoot, subdir)}/`
}

const RENDER_SCALE = 3.0

// Claude's API hard-rejects any image over 8000px on either dimension (400 invalid_request_error:
// "At least one of the image dimensions exceed max allowed size: 8000 pixels") — confirmed live
// against a large-format exhibition stand PDF (an A0/A1-scale sheet) once RENDER_SCALE went from
// 1.5 to 3.0. A0 at 3.0x is ~7150x10100px, comfortably over the limit. Rather than lowering
// RENDER_SCALE back down for every design (losing the fine-detail resolution bump this was for),
// cap the *effective* per-page scale so it backs off only on pages large enough to need it.
const MAX_IMAGE_DIMENSION_PX = 8000

export async function rasterizePdf(pdfPath: string): Promise<TakeoffPageImage[]> {
  const pdfjs = await loadPdfjs()
  const buffer = await fs.readFile(pdfPath)
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    cMapUrl: pdfjsAssetUrl('cmaps'),
    cMapPacked: true,
    standardFontDataUrl: pdfjsAssetUrl('standard_fonts'),
    wasmUrl: pdfjsAssetUrl('wasm'),
  })
  const doc = await loadingTask.promise

  const images: TakeoffPageImage[] = []

  try {
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum)
      const basePageSize = page.getViewport({ scale: 1 })
      const scale = Math.min(
        RENDER_SCALE,
        MAX_IMAGE_DIMENSION_PX / basePageSize.width,
        MAX_IMAGE_DIMENSION_PX / basePageSize.height,
      )
      const viewport = page.getViewport({ scale })
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
