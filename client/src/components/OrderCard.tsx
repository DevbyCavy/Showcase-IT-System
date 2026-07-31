import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Zap, HardHat, CircleCheck, MapPin, Clock, CheckCircle2, XCircle, Users, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import * as ordersApi from '@/api/orders'
import type { Order, OrderStatus } from '@/api/orders'

// Same status → color/icon grouping as SuperAdminDashboard's OrdersCarousel (New/Assigned share
// orange, OnGoing is purple, Completed is green) so a card looks the same whether it's seen on the
// admin dashboard's compact carousel or here — see MIGRATION_PLAN.md (Orders card redesign, per
// Calvin's reference screenshots).
const STATUS_STYLE: Record<OrderStatus, { gradient: string; icon: typeof Zap }> = {
  New: { gradient: 'from-brand-orange to-brand-orange-dark', icon: Zap },
  Assigned: { gradient: 'from-brand-orange to-brand-orange-dark', icon: Zap },
  OnGoing: { gradient: 'from-brand-purple to-brand-purple-dark', icon: HardHat },
  Completed: { gradient: 'from-emerald-500 to-emerald-700', icon: CircleCheck },
}

function FileStatus({ label, href }: { label: string; href: string | null }) {
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
      <CheckCircle2 className="h-3.5 w-3.5" /> {label}
    </a>
  ) : (
    <span className="inline-flex items-center gap-1 opacity-70">
      <XCircle className="h-3.5 w-3.5" /> {label}
    </span>
  )
}

// Translated from php_action/order_card.php's inline countdown IIFE + orders.php's shared
// orderUpdateStatus(), redesigned per Calvin's reference screenshots to match the admin dashboard's
// gradient-tile look: fixed card size regardless of description length (description dropped from
// this compact card — full detail lives on /orders/manage), a static deadline instead of a
// per-second-ticking countdown (still auto-transitions status once, right at the deadline instant,
// via a single scheduled timeout rather than a repeating one — no visual jitter, same eventual
// behavior, and it's also mirrored by the server's own lazy-cron in order.repository.ts#autoTransition
// so nothing is lost if the tab isn't open when the deadline hits), B.O.Q/Artwork as a check/x
// status instead of link-or-muted-text, a Location pin icon, and Team as a disclosure button
// listing assigned members instead of inline comma-separated text.
export function OrderCard({ order }: { order: Order }) {
  const queryClient = useQueryClient()
  const firedRef = useRef(false)

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => ordersApi.updateStatus(order.id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })

  useEffect(() => {
    firedRef.current = false

    let deadline: number | null = null
    let onZero: (() => void) | null = null

    if (order.status === 'OnGoing' && order.ongoingSince) {
      deadline = new Date(order.ongoingSince).getTime() + 24 * 60 * 60 * 1000
      onZero = () => statusMutation.mutate('Completed')
    } else if (order.status !== 'Completed' && order.deadlineDatetime) {
      deadline = new Date(order.deadlineDatetime).getTime()
      onZero = () => statusMutation.mutate('OnGoing')
    }

    if (deadline === null || onZero === null) return

    const msLeft = deadline - Date.now()
    const fire = () => {
      if (firedRef.current) return
      firedRef.current = true
      onZero!()
    }

    if (msLeft <= 0) {
      fire()
      return
    }
    const timer = setTimeout(fire, msLeft)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.status, order.ongoingSince, order.deadlineDatetime])

  const { gradient, icon: StatusIcon } = STATUS_STYLE[order.status]

  return (
    <div className={`flex min-h-[260px] flex-col gap-2.5 rounded-2xl bg-gradient-to-br p-4 text-white ${gradient}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/20">
        <StatusIcon className="h-4 w-4" />
      </div>

      <h3 className="line-clamp-2 text-sm font-bold">{order.orderName}</h3>
      <div className="text-xs opacity-90">Order #{order.orderNumber}</div>

      <div className="flex items-center gap-1 text-xs opacity-90">
        <MapPin className="h-3 w-3 shrink-0" />
        <span className="truncate">{order.location}</span>
      </div>

      <div className="flex items-center gap-1 text-xs opacity-90">
        <Clock className="h-3 w-3 shrink-0" />
        {order.deadlineDatetime
          ? new Date(order.deadlineDatetime).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
          : 'No deadline'}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-90">
        <FileStatus label="B.O.Q" href={order.boqFile} />
        <FileStatus label="Artwork" href={order.artworkFile} />
      </div>

      <details className="relative">
        <summary className="inline-flex list-none items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold [&::-webkit-details-marker]:hidden">
          <Users className="h-3 w-3" /> Team ({order.assignedUsers.length}) <ChevronDown className="h-3 w-3" />
        </summary>
        <div className="text-foreground absolute z-10 mt-1 w-48 rounded-lg bg-white p-2 text-xs shadow-lg">
          {order.assignedUsers.length === 0 ? (
            <div className="text-muted-foreground px-1 py-0.5">No one assigned</div>
          ) : (
            order.assignedUsers.map((u) => (
              <div key={u.id} className="px-1 py-0.5">
                {u.name} {u.surname}
              </div>
            ))
          )}
        </div>
      </details>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <Link to="/orders/manage" className="text-foreground rounded-full bg-white px-3 py-1 text-xs font-bold">
          Manage
        </Link>
        {order.status === 'OnGoing' && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              if (confirm('Mark this order as Completed?')) statusMutation.mutate('Completed')
            }}
          >
            Done
          </Button>
        )}
      </div>
    </div>
  )
}
