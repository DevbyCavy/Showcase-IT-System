import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import * as ordersApi from '@/api/orders'
import * as usersApi from '@/api/users'
import { useAuth } from '@/hooks/useAuth'
import type { Order, OrderFormInput } from '@/api/orders'

// Translated from manageOrder.php + manageOrderP.php, which are identical apart from nav chrome —
// consolidated into one page per MIGRATION_PLAN.md's AppShell plan. "Edit Order" is newly built
// (the legacy link went to a page that never existed); "View Order" is fixed to actually query
// order_assignments (the legacy version referenced a column that doesn't exist and always showed empty).
// Rebuilt on the shared Card/PageHeader primitives as part of the full-app redesign sweep (see
// MIGRATION_PLAN.md §10.11).
export default function ManageOrders() {
  const [tab, setTab] = useState<'add' | 'edit' | 'view'>('add')
  const { user } = useAuth()
  const { data: orders } = useQuery({ queryKey: ['orders'], queryFn: ordersApi.list })

  const myOrders = orders?.filter((o) => o.assignedUsers.some((u) => u.id === user?.id)) ?? []

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <PageHeader title="Manage Orders" />

      <div className="mb-5 flex gap-0.5 rounded-full bg-secondary p-1 w-fit">
        {(['add', 'edit', 'view'] as const).map((t) => (
          <button
            key={t}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              tab === t ? 'bg-brand-orange text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setTab(t)}
          >
            {t === 'add' ? 'Add New Order' : t === 'edit' ? 'Edit Order' : 'View Order'}
          </button>
        ))}
      </div>

      {tab === 'add' && (
        <Card>
          <CardContent>
            <OrderForm mode="add" />
          </CardContent>
        </Card>
      )}

      {tab === 'edit' && (
        <div className="space-y-3">
          <h2 className="font-semibold">Edit Orders</h2>
          {(orders ?? []).map((o) => (
            <EditableOrderRow key={o.id} order={o} />
          ))}
        </div>
      )}

      {tab === 'view' && (
        <div className="space-y-3">
          <h2 className="font-semibold">Orders Assigned to You</h2>
          {myOrders.length === 0 && <p className="text-muted-foreground text-sm">No orders assigned to you.</p>}
          {myOrders.map((o) => (
            <div key={o.id} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="font-semibold">
                #{o.orderNumber} — {o.orderName}
              </div>
              <div className="text-muted-foreground text-sm">{o.location}</div>
              <div className="text-sm">Status: {o.status === 'OnGoing' ? 'On Going' : o.status}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EditableOrderRow({ order }: { order: Order }) {
  const [editing, setEditing] = useState(false)
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">
            #{order.orderNumber} — {order.orderName}
          </div>
          <div className="text-muted-foreground text-sm">{order.location}</div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setEditing((v) => !v)}>
          {editing ? 'Close' : 'Edit'}
        </Button>
      </div>
      {editing && (
        <div className="mt-3 border-t pt-3">
          <OrderForm mode="edit" order={order} onSaved={() => setEditing(false)} />
        </div>
      )}
    </div>
  )
}

function toDatetimeLocal(value: string | null) {
  if (!value) return ''
  const d = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function OrderForm({ mode, order, onSaved }: { mode: 'add' | 'edit'; order?: Order; onSaved?: () => void }) {
  const queryClient = useQueryClient()
  const { data: users } = useQuery({ queryKey: ['users', 'assignable'], queryFn: usersApi.listAssignable })

  const [form, setForm] = useState({
    orderName: order?.orderName ?? '',
    description: order?.description ?? '',
    location: order?.location ?? '',
    deadlineDatetime: toDatetimeLocal(order?.deadlineDatetime ?? null),
    assignedUserIds: order?.assignedUsers.map((u) => u.id) ?? ([] as number[]),
  })
  const [boqFile, setBoqFile] = useState<File | null>(null)
  const [artworkFile, setArtworkFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => {
      const input: OrderFormInput = {
        orderName: form.orderName,
        description: form.description || undefined,
        location: form.location,
        deadlineDatetime: form.deadlineDatetime,
        assignedUserIds: form.assignedUserIds,
        boqFile: boqFile ?? undefined,
        artworkFile: artworkFile ?? undefined,
      }
      return mode === 'add' ? ordersApi.create(input) : ordersApi.update(order!.id, input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      if (mode === 'add') {
        setForm({ orderName: '', description: '', location: '', deadlineDatetime: '', assignedUserIds: [] })
        setSuccess('Order created successfully!')
      } else {
        onSaved?.()
      }
    },
    onError: (err) => {
      setError(isAxiosError(err) ? (err.response?.data?.error ?? 'Failed to save order') : 'Failed to save order')
    },
  })

  return (
    <div className="space-y-3">
      {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
      {success && <div className="rounded-md bg-primary/10 px-3 py-2 text-sm">{success}</div>}

      <div className="space-y-1">
        <label className="text-sm font-medium">Order Name</label>
        <Input value={form.orderName} onChange={(e) => setForm({ ...form, orderName: e.target.value })} />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Description</label>
        <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Location</label>
        <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Deadline (Date &amp; Time)</label>
        <Input
          type="datetime-local"
          value={form.deadlineDatetime}
          onChange={(e) => setForm({ ...form, deadlineDatetime: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Assign People</label>
        <select
          multiple
          size={5}
          className="w-full rounded-md border border-input bg-background p-2 text-sm shadow-sm"
          value={form.assignedUserIds.map(String)}
          onChange={(e) =>
            setForm({
              ...form,
              assignedUserIds: Array.from(e.target.selectedOptions).map((o) => Number(o.value)),
            })
          }
        >
          {users?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} {u.surname}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">
          B.O.Q File <span className="text-muted-foreground text-xs">(optional)</span>
        </label>
        <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => setBoqFile(e.target.files?.[0] ?? null)} />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">
          Artwork File <span className="text-muted-foreground text-xs">(optional)</span>
        </label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.ai,.eps,.svg"
          onChange={(e) => setArtworkFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving…' : mode === 'add' ? 'Add Order' : 'Save Changes'}
      </Button>
    </div>
  )
}
