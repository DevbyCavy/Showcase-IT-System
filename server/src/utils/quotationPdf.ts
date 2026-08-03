// Replaces downloadQuotation.php's DOMPDF rendering with Puppeteer. The HTML/CSS layout is
// preserved exactly (customer block, items table, terms/bank-details split, footer) — only the
// rendering engine changed.

import fs from 'node:fs'
import path from 'node:path'
import type { Quotation, QuotationItem, User } from '#prisma-client'

const loadPuppeteer = () => import('puppeteer').then((m) => m.default)
type PuppeteerModule = Awaited<ReturnType<typeof loadPuppeteer>>
type Browser = Awaited<ReturnType<PuppeteerModule['launch']>>

type QuotationWithRelations = Quotation & { items: QuotationItem[]; submittedBy: User }

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const money = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Trims trailing zeroes off a quantity the same way the legacy's
// `rtrim(rtrim(number_format($q,2),'0'),'.')` did (e.g. "2.00" -> "2", "1.50" -> "1.5").
function formatQuantity(n: number) {
  return n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

function loadLogoDataUri(): string {
  const logoPath = path.join(__dirname, '..', '..', '..', 'images', 'showcaseit_logo.png')
  if (!fs.existsSync(logoPath)) return ''
  return `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
}

function buildHtml(quotation: QuotationWithRelations): string {
  const preparedBy = `${quotation.submittedBy.name} ${quotation.submittedBy.surname}`.trim()
  const logoSrc = loadLogoDataUri()

  const rows = quotation.items
    .map(
      (item) => `
        <tr>
            <td>${escapeHtml(item.description)}</td>
            <td style="text-align:right;">${formatQuantity(Number(item.quantity))}</td>
            <td style="text-align:right;">$${money(Number(item.unitPrice))}</td>
            <td style="text-align:right;">$${money(Number(item.lineTotal))}</td>
        </tr>`,
    )
    .join('')

  return `
<style>
body { font-family: Arial, sans-serif; font-size: 12px; color: #333; }
.header { width: 100%; margin-bottom: 20px; }
.header td { vertical-align: top; }
.header h1 { margin: 0; color: #ff7b00; text-align: right; }
.header .company-info { font-size: 11px; color: #666; }
.customer-block { background: #fff7ef; border-left: 4px solid #ff7b00; padding: 8px 12px; margin-bottom: 15px; }
.customer-block .label { color: #ff7b00; font-weight: bold; font-size: 11px; }
.items-table { width: 100%; border-collapse: collapse; }
.items-table th { background-color: #ff7b00; color: #fff; padding: 8px; border: 1px solid #ddd; }
.items-table td { border: 1px solid #ddd; padding: 6px 8px; }
.totals-row td { font-weight: bold; background: #f8f9fa; }
.bottom-section { width: 100%; margin-top: 20px; }
.bottom-section td { vertical-align: top; }
.footer { margin-top: 30px; text-align: right; font-size: 10px; color: #777; }
</style>

<table class="header">
    <tr>
        <td style="width:55%;">
            ${logoSrc ? `<img src="${logoSrc}" alt="ShowcaseIT Logo" style="height:55px; margin-bottom:8px;">` : ''}
            <div class="company-info">
                32 Jacana Drive, Greystone Park, Harare<br>
                Phone: +263 772 548792<br>
                VAT Number: 220097572<br>
                TIN Number: 2001387234<br>
                Prepared by: ${escapeHtml(preparedBy || '-')}
            </div>
        </td>
        <td style="width:45%;">
            <h1>QUOTATION</h1>
            <table style="width:100%; font-size:11px;">
                <tr><td style="color:#888;">Date</td><td style="text-align:right;">${quotation.quoteDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td></tr>
                <tr><td style="color:#888;">Quotation #</td><td style="text-align:right;">${escapeHtml(quotation.quotationNumber)}</td></tr>
                <tr><td style="color:#888;">Order #</td><td style="text-align:right;">${escapeHtml(quotation.orderNumber || '-')}</td></tr>
                <tr><td style="color:#888;">Customer ID</td><td style="text-align:right;">${escapeHtml(quotation.customerId || '-')}</td></tr>
            </table>
        </td>
    </tr>
</table>

<div class="customer-block">
    <div class="label">CUSTOMER</div>
    <div><strong>${escapeHtml(quotation.customerName)}</strong></div>
    ${quotation.projectName ? `<div>${escapeHtml(quotation.projectName)}</div>` : ''}
</div>

<table class="items-table">
    <thead>
        <tr>
            <th style="width:45%">Description</th>
            <th style="width:15%">Quantity</th>
            <th style="width:20%">Unit Price</th>
            <th style="width:20%">Amount</th>
        </tr>
    </thead>
    <tbody>
${rows}
        <tr class="totals-row">
            <td colspan="3" style="text-align:right;">Subtotal</td>
            <td style="text-align:right;">$${money(Number(quotation.subtotal))}</td>
        </tr>
        <tr class="totals-row">
            <td colspan="3" style="text-align:right;">TOTAL</td>
            <td style="text-align:right;">$${money(Number(quotation.total))}</td>
        </tr>
    </tbody>
</table>

<table class="bottom-section">
    <tr>
        <td style="width:60%;">
            <strong style="color:#ff7b00;">Terms &amp; Conditions</strong>
            <div style="white-space:pre-wrap; font-size:11px; margin-top:4px;">${escapeHtml(quotation.termsConditions)}</div>
        </td>
        <td style="width:40%;">
            <strong style="color:#ff7b00;">Bank Details</strong>
            <table style="width:100%; font-size:11px; margin-top:4px;">
                <tr><td style="color:#888;">Account Name</td><td>-</td></tr>
                <tr><td style="color:#888;">Bank</td><td>-</td></tr>
                <tr><td style="color:#888;">Account Number</td><td>-</td></tr>
                <tr><td style="color:#888;">Branch</td><td>-</td></tr>
                <tr><td style="color:#888;">Type</td><td>-</td></tr>
            </table>
        </td>
    </tr>
</table>

<div class="footer">
    Generated by ShowcaseIT${logoSrc ? ` <img src="${logoSrc}" alt="ShowcaseIT Logo" style="height:16px; vertical-align:middle; margin-left:6px;">` : ''}
</div>
`
}

let browserPromise: Promise<Browser> | null = null

async function getBrowser() {
  if (!browserPromise) {
    const puppeteer = await loadPuppeteer()
    browserPromise = puppeteer.launch({ headless: true })
  }
  return browserPromise
}

export async function renderQuotationPdf(quotation: QuotationWithRelations): Promise<Buffer> {
  const browser = await getBrowser()
  const page = await browser.newPage()
  try {
    await page.setContent(buildHtml(quotation), { waitUntil: 'load' })
    const pdf = await page.pdf({ format: 'a4', printBackground: true })
    return Buffer.from(pdf)
  } finally {
    await page.close()
  }
}
