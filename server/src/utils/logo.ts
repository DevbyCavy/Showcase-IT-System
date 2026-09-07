import fs from 'node:fs'
import path from 'node:path'

// Shared by boqPdf.ts and quotationPdf.ts so both documents embed the same base64 logo (Puppeteer
// runs against a remote Browserless browser, so the image must be inlined as a data URI rather than
// linked — a relative/absolute file or localhost URL wouldn't resolve on Browserless's end).
export function loadLogoDataUri(): string {
  const candidates = [
    // Bundled into dist/ by scripts/copy-client-dist.js at build time — self-contained, doesn't
    // depend on the repo-root images/ directory surviving whatever the deploy target ships.
    path.join(__dirname, '..', 'images', 'showcaseit_logo.png'),
    // Repo-root images/, three levels up from src/utils or dist/utils — works for local dev
    // (tsx running straight from src/) and for deploy targets that ship the whole monorepo.
    path.join(__dirname, '..', '..', '..', 'images', 'showcaseit_logo.png'),
  ]
  const logoPath = candidates.find((p) => fs.existsSync(p))
  if (!logoPath) return ''
  return `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
}
