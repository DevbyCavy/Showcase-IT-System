// A single shared headless Chrome instance, reused by both boqPdf.ts and quotationPdf.ts rather
// than one per module. Hostinger's shared-hosting process/thread ceiling is tight enough that even
// a second concurrent Chrome process tree can push it over the edge — surfaced as repeated
// "pthread_create: Resource temporarily unavailable" / GLib thread-creation failures right before
// the launch fails with TargetCloseError. The flags below additionally trim Chrome's own
// background services and process count (site isolation, GPU/software rasterizer, extensions,
// sync, crash reporter, renderer-process cap, etc.) to keep its footprint as small as possible on
// that ceiling. --single-process was tried too, but it's genuinely unstable in modern Chrome — GPU
// context creation fails outright and crashes the connection — so it's deliberately not used here.

// puppeteer v25+ ships ESM-only while the server is CommonJS, so it must be loaded via dynamic import().
const loadPuppeteer = () => import('puppeteer').then((m) => m.default)
type PuppeteerModule = Awaited<ReturnType<typeof loadPuppeteer>>
export type Browser = Awaited<ReturnType<PuppeteerModule['launch']>>

let browserPromise: Promise<Browser> | null = null

export async function getBrowser(): Promise<Browser> {
  // A cached browser can die after a successful launch (e.g. the renderer-process spawn for a
  // newPage() call itself hits the same pthread_create ceiling and takes the connection down).
  // Without this check, every request after that first crash would keep reusing the dead
  // reference and fail immediately with ConnectionClosedError instead of relaunching.
  if (browserPromise) {
    const browser = await browserPromise
    if (!browser.connected) {
      browserPromise = null
    }
  }
  if (!browserPromise) {
    const puppeteer = await loadPuppeteer()
    browserPromise = puppeteer
      .launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--no-zygote',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-dev-shm-usage',
          '--disable-extensions',
          '--disable-component-extensions-with-background-pages',
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-breakpad',
          '--disable-client-side-phishing-detection',
          '--disable-default-apps',
          '--disable-hang-monitor',
          '--disable-ipc-flooding-protection',
          '--disable-popup-blocking',
          '--disable-prompt-on-repost',
          '--disable-sync',
          '--disable-translate',
          '--disable-features=site-per-process,IsolateOrigins,Translate',
          '--renderer-process-limit=1',
          '--metrics-recording-only',
          '--mute-audio',
          '--no-first-run',
          '--no-default-browser-check',
          '--password-store=basic',
          '--use-mock-keychain',
        ],
        dumpio: true,
      })
      .catch((err) => {
        browserPromise = null
        throw err
      })
  }
  return browserPromise
}
