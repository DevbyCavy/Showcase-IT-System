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
