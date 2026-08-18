// Drives the "Download PDF" button on the standalone quotation view page
// (server/src/utils/quotationPdf.ts#renderQuotationHtml). Loaded as a same-origin <script src>
// rather than inline, since the app's CSP (helmet default) has no 'unsafe-inline' on script-src.
document.addEventListener('DOMContentLoaded', function () {
  var btn = document.getElementById('download-pdf-btn')
  var page = document.querySelector('.page')
  var errorEl = document.getElementById('download-pdf-error')
  if (!btn || !page) return

  btn.addEventListener('click', function () {
    btn.disabled = true
    var originalText = btn.textContent
    btn.textContent = 'Generating…'
    if (errorEl) errorEl.style.display = 'none'

    var filename = (document.title || 'Quotation').replace(/\s+/g, '_') + '.pdf'
    window
      .html2pdf()
      .set({
        filename: filename,
        margin: 0,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(page)
      .save()
      .catch(function (err) {
        console.error('PDF generation failed:', err)
        if (errorEl) errorEl.style.display = 'block'
      })
      .finally(function () {
        btn.disabled = false
        btn.textContent = originalText
      })
  })
})
