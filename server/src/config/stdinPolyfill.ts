// Hostinger's Node hosting sandbox throws EEXIST the first time anything touches
// process.stdin's lazily-constructed Socket — this surfaces as Node's ESM loader crashing
// while building a facade for the `node:process` builtin, which happens the first time we
// dynamically import() an ESM-only package (puppeteer ships ESM-only; see boqPdf.ts/
// quotationPdf.ts). Resolving it once, safely, before any such import runs avoids that.
try {
  void process.stdin
} catch {
  Object.defineProperty(process, 'stdin', { value: undefined, configurable: true, enumerable: true })
}
