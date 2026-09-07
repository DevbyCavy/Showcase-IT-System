const fs = require('node:fs')
const path = require('node:path')

const src = path.resolve(__dirname, '../../client/dist')
const dest = path.resolve(__dirname, '../dist/public')

if (!fs.existsSync(src)) {
  console.error(`Client build not found at ${src}. Did the client build step run first?`)
  process.exit(1)
}

fs.rmSync(dest, { recursive: true, force: true })
fs.cpSync(src, dest, { recursive: true })
console.log(`Copied client build from ${src} to ${dest}`)

// Bundle the logo into dist/ too, so PDF rendering (see utils/logo.ts) doesn't depend on the
// repo-root images/ directory surviving whatever the deploy target actually ships (some hosts
// deploy only the server/ subtree).
const imagesSrc = path.resolve(__dirname, '../../images')
const imagesDest = path.resolve(__dirname, '../dist/images')
if (fs.existsSync(imagesSrc)) {
  fs.rmSync(imagesDest, { recursive: true, force: true })
  fs.cpSync(imagesSrc, imagesDest, { recursive: true })
  console.log(`Copied images from ${imagesSrc} to ${imagesDest}`)
} else {
  console.error(`images/ not found at ${imagesSrc} — PDF logos will be missing.`)
}
