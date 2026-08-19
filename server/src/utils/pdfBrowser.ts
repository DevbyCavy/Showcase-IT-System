import { ApiError } from '../middleware/errorHandler'
import { env } from '../config/env'

// A single shared Browserless connection, reused by both boqPdf.ts and quotationPdf.ts. Chrome no
// longer runs on this host at all — Hostinger's shared-hosting process/thread ceiling made local
// headless Chrome launches unreliable (repeated "pthread_create: Resource temporarily unavailable"
// the moment a page/renderer process was spawned, and --single-process is a hard dead end: it
// can't create the GPU/Skia context page.pdf() needs, confirmed by reproducing the failure locally
// with no resource pressure at all). Browserless runs Chrome on its own infrastructure; this file
// just holds a WebSocket connection to it via puppeteer-core.

// puppeteer-core v25+ ships ESM-only while the server is CommonJS, so it must be loaded via dynamic import().
const loadPuppeteer = () => import('puppeteer-core').then((m) => m.default)
type PuppeteerModule = Awaited<ReturnType<typeof loadPuppeteer>>
export type Browser = Awaited<ReturnType<PuppeteerModule['connect']>>

let browserPromise: Promise<Browser> | null = null

export async function getBrowser(): Promise<Browser> {
  if (!env.BROWSERLESS_TOKEN) {
    throw new ApiError(500, 'PDF generation is not configured: BROWSERLESS_TOKEN is missing.')
  }

  // A cached connection can die between requests (Browserless enforces its own idle/session
  // limits). Without this check, every request after a drop would keep reusing the dead reference
  // and fail immediately instead of reconnecting.
  if (browserPromise) {
    const browser = await browserPromise
    if (!browser.connected) {
      browserPromise = null
    }
  }
  if (!browserPromise) {
    const puppeteer = await loadPuppeteer()
    browserPromise = puppeteer
      .connect({
        browserWSEndpoint: `${env.BROWSERLESS_WS_ENDPOINT}?token=${env.BROWSERLESS_TOKEN}`,
      })
      .catch((err) => {
        browserPromise = null
        throw err
      })
  }
  return browserPromise
}
