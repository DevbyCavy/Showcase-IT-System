import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye, FileDown } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { PaymentStatusBadge } from '@/components/PaymentStatusBadge'
import * as financeApi from '@/api/finance'
import type { InvoicePaymentStatus, ProformaInvoice } from '@/api/finance'
import { formatMoney } from '@/api/finance'

type Tab = 'all' | InvoicePaymentStatus

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'Unpaid', label: 'Unpaid' },
  { key: 'Deposited', label: 'Deposited' },
  { key: 'FullyPaid', label: 'Fully Paid' },
]

// Finance (Accountant) + Super Admin — see MIGRATION_PLAN.md §34. Status filter and search run on
// the server; paging is DataTable's usual client-side paging.
export default function ProformaInvoices() {
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['proforma-invoices', tab, search],
    queryFn: () => financeApi.listInvoices({ status: tab === 'all' ? undefined : tab, search: search || undefined }),
    placeholderData: (prev) => prev,
  })

  const counts = data?.counts
  const tabCount = (t: Tab) => (counts ? (t === 'all' ? counts.Unpaid + counts.Deposited + counts.FullyPaid : counts[t]) : undefined)

  async function handleDownload(inv: ProformaInvoice) {
    setDownloadError(null)
    try {
      await financeApi.downloadInvoicePdf(inv.id, inv.invoiceNumber)
    } catch {
      setDownloadError('Failed to generate the PDF. You can retry, or use View to open the printable version.')
    }
  }

  const columns: DataTableColumn<ProformaInvoice>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      render: (inv) => (
        <Link to={`/finance/proforma-invoices/${inv.id}`} className="font-medium hover:underline">
          {inv.invoiceNumber}
        </Link>
      ),
    },
    { key: 'quotation', header: 'Quotation #', render: (inv) => inv.quotation.quotationNumber },
    {
      key: 'customer',
      header: 'Client / Project',
      render: (inv) => (
        <div>
          <div>{inv.customerName}</div>
          {(inv.projectName || inv.orderNumber) && (
            <div className="text-muted-foreground text-xs">{[inv.projectName, inv.orderNumber && `Order ${inv.orderNumber}`].filter(Boolean).join(' · ')}</div>
          )}
        </div>
      ),
    },
    { key: 'date', header: 'Date', render: (inv) => new Date(inv.issuedAt).toLocaleDateString() },
    { key: 'total', header: 'Total', cellClassName: 'text-right', headerClassName: 'text-right', render: (inv) => formatMoney(inv.total, inv.currency) },
    { key: 'paid', header: 'Paid', cellClassName: 'text-right', headerClassName: 'text-right', render: (inv) => formatMoney(inv.amountPaid, inv.currency) },
    {
      key: 'balance',
      header: 'Balance',
      cellClassName: 'text-right font-medium',
      headerClassName: 'text-right',
      render: (inv) => formatMoney(inv.balanceDue, inv.currency),
    },
    { key: 'status', header: 'Status', render: (inv) => <PaymentStatusBadge status={inv.paymentStatus} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (inv) => (
        <div className="flex gap-1.5">
          <Link to={`/finance/proforma-invoices/${inv.id}`} className={buttonVariants({ size: 'sm', variant: 'outline' })}>
            <Eye className="mr-1.5 h-3.5 w-3.5" /> Open
          </Link>
          <Button size="sm" variant="outline" onClick={() => handleDownload(inv)} aria-label={`Download ${inv.invoiceNumber} PDF`}>
            <FileDown className="mr-1.5 h-3.5 w-3.5" /> PDF
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <PageHeader title="Proforma Invoices" subtitle="Created automatically when a quotation is confirmed as client-approved." />

      <div className="mb-5 flex w-fit flex-wrap gap-0.5 rounded-full bg-secondary p-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              tab === t.key ? 'bg-brand-orange text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {tabCount(t.key) !== undefined && <span className="ml-1.5 opacity-75">{tabCount(t.key)}</span>}
          </button>
        ))}
      </div>

      {downloadError && <div className="mb-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{downloadError}</div>}
      {isError && <div className="mb-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">Failed to load invoices.</div>}

      <DataTable
        columns={columns}
        data={data?.invoices ?? []}
        keyExtractor={(inv) => inv.id}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search invoice, quotation, client…"
        isLoading={isLoading}
        emptyMessage={search || tab !== 'all' ? 'No invoices match this filter.' : 'No proforma invoices yet.'}
      />
    </div>
  )
}
