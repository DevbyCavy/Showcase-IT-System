import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as ordersApi from '@/api/orders'
import { OrderCard } from '@/components/OrderCard'
import { WorkLogSheet } from '@/components/WorkLogSheet'
import { PageHeader } from '@/components/ui/page-header'

// Translated from orders.php — the working kanban view embedded on every dashboard in the legacy
// app (distinct from manageOrder.php/manageOrderP.php's separate Add/Edit/View tabs — see /orders/manage).
// Rebuilt on the shared PageHeader primitive as part of the full-app redesign sweep (see
// MIGRATION_PLAN.md §10.11).
export default function OrdersKanban() {
  const { data: orders, isLoading } = useQuery({ queryKey: ['orders'], queryFn: ordersApi.list })
  const [tab, setTab] = useState<'new' | 'ongoing' | 'completed'>('new')

  const groups = {
    new: orders?.filter((o) => o.status === 'New' || o.status === 'Assigned') ?? [],
    ongoing: orders?.filter((o) => o.status === 'OnGoing') ?? [],
    completed: orders?.filter((o) => o.status === 'Completed') ?? [],
  }

  const tabs: { key: typeof tab; label: string }[] = [
    { key: 'new', label: 'New Orders' },
    { key: 'ongoing', label: 'On Going' },
    { key: 'completed', label: 'Completed' },
  ]

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <PageHeader title="Manage Orders" />

      <div className="mb-5 flex w-fit gap-0.5 rounded-full bg-secondary p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              tab === t.key ? 'bg-brand-orange text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setTab(t.key)}
          >
            {t.label} ({groups[t.key].length})
          </button>
        ))}
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      {!isLoading && groups[tab].length === 0 && <p className="text-muted-foreground">No orders here.</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups[tab].map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>

      <div className="mt-8">
        <WorkLogSheet />
      </div>
    </div>
  )
}
