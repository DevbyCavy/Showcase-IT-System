import fs from 'node:fs'
import path from 'node:path'

// Shared by boqPdf.ts and quotationPdf.ts so both documents embed the same base64 logo (Puppeteer
// runs against a remote Browserless browser, so the image must be inlined as a data URI rather than
// linked — a relative/absolute file or localhost URL wouldn't resolve on Browserless's end).
export function loadLogoDataUri(): string {
  const logoPath = path.join(__dirname, '..', '..', '..', 'images', 'showcaseit_logo.png')
  if (!fs.existsSync(logoPath)) return ''
  return `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
}
