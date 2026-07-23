import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import * as inventoryApi from '@/api/inventory'
import type { IssuedTool } from '@/api/inventory'

// Translated from IssueProductReport.php. Rebuilt on the shared PageHeader/DataTable primitives as
// part of the full-app redesign sweep (see MIGRATION_PLAN.md §10.11).
export default function IssuedProductsReport() {
  const { data: issuedTools, isLoading } = useQuery({
    queryKey: ['inventory', 'issued-tools'],
    queryFn: inventoryApi.listIssuedTools,
  })
  const [search, setSearch] = useState('')

  const filtered = (issuedTools ?? []).filter((t) =>
    [t.collectorName, t.toolName, t.jobName].join(' ').toLowerCase().includes(search.toLowerCase()),
  )

  const columns: DataTableColumn<IssuedTool>[] = [
    { key: 'date', header: 'Date of Collection', render: (t) => new Date(t.dateOfCollection).toLocaleDateString() },
    { key: 'collector', header: 'Collector Name', render: (t) => t.collectorName },
    { key: 'product', header: 'Product Name', render: (t) => t.toolName },
    { key: 'quantity', header: 'Quantity Issued', render: (t) => t.quantityIssued },
    { key: 'job', header: 'Job Name', render: (t) => t.jobName },
    {
      key: 'return',
      header: 'Date of Return',
      render: (t) =>
        t.dateOfReturn ? new Date(t.dateOfReturn).toLocaleDateString() : <span className="text-muted-foreground">Not Returned</span>,
    },
  ]

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <PageHeader title="Issued Products Report" />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(t) => t.id}
        search={search}
        onSearchChange={setSearch}
        isLoading={isLoading}
        emptyMessage="No issued products found."
      />
    </div>
  )
}
