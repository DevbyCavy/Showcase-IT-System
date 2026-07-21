import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import * as inventoryApi from '@/api/inventory'

// Translated from IssueProductReport.php.
export default function IssuedProductsReport() {
  const { data: issuedTools, isLoading } = useQuery({
    queryKey: ['inventory', 'issued-tools'],
    queryFn: inventoryApi.listIssuedTools,
  })
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!issuedTools) return []
    const q = search.toLowerCase()
    if (!q) return issuedTools
    return issuedTools.filter((t) => [t.collectorName, t.toolName, t.jobName].join(' ').toLowerCase().includes(q))
  }, [issuedTools, search])

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Issued Products Report</h1>
        <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Date of Collection</th>
              <th className="p-3">Collector Name</th>
              <th className="p-3">Product Name</th>
              <th className="p-3">Quantity Issued</th>
              <th className="p-3">Job Name</th>
              <th className="p-3">Date of Return</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-muted-foreground">
                  No issued products found.
                </td>
              </tr>
            )}
            {filtered.map((t, i) => (
              <tr key={t.id} className="border-t">
                <td className="p-3">{i + 1}</td>
                <td className="p-3">{new Date(t.dateOfCollection).toLocaleDateString()}</td>
                <td className="p-3">{t.collectorName}</td>
                <td className="p-3">{t.toolName}</td>
                <td className="p-3">{t.quantityIssued}</td>
                <td className="p-3">{t.jobName}</td>
                <td className="p-3">
                  {t.dateOfReturn ? (
                    new Date(t.dateOfReturn).toLocaleDateString()
                  ) : (
                    <span className="text-muted-foreground">Not Returned</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
