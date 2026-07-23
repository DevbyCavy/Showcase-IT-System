import { useEffect, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Input } from './input'

export interface DataTableColumn<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  headerClassName?: string
  cellClassName?: string
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  keyExtractor: (row: T) => string | number
  search?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  isLoading?: boolean
  emptyMessage?: string
  pageSize?: number
}

// Shared table shell for the full-app redesign sweep: rounded container, uppercase column heads, a
// rounded search pill, hover-highlighted rows, and client-side pagination (every existing table in
// this app rendered its full result set with no paging at all — small enough datasets that it
// never mattered functionally, but the reference design explicitly calls for pagination, so it's
// added here once rather than per-page).
export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  isLoading,
  emptyMessage = 'No records found.',
  pageSize = 10,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))
  const clampedPage = Math.min(page, totalPages)
  const pageData = data.slice((clampedPage - 1) * pageSize, clampedPage * pageSize)

  useEffect(() => {
    setPage(1)
  }, [search, data.length])

  return (
    <div>
      {onSearchChange && (
        <div className="relative mb-4 max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            className="rounded-full pl-9"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`text-muted-foreground px-4 py-3 text-xs font-semibold tracking-wide uppercase ${col.headerClassName ?? ''}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={columns.length} className="text-muted-foreground p-8 text-center">
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && pageData.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="text-muted-foreground p-8 text-center">
                    {emptyMessage}
                  </td>
                </tr>
              )}
              {!isLoading &&
                pageData.map((row) => (
                  <tr key={keyExtractor(row)} className="hover:bg-secondary/40 border-t transition-colors">
                    {columns.map((col) => (
                      <td key={col.key} className={`px-4 py-3 ${col.cellClassName ?? ''}`}>
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-muted-foreground text-xs">
              Page {clampedPage} of {totalPages} · {data.length} total
            </span>
            <div className="flex gap-1.5">
              <button
                className="hover:bg-secondary flex h-7 w-7 items-center justify-center rounded-full border disabled:opacity-40"
                disabled={clampedPage <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                className="hover:bg-secondary flex h-7 w-7 items-center justify-center rounded-full border disabled:opacity-40"
                disabled={clampedPage >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
