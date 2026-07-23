import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import * as ordersApi from '@/api/orders'
import type { Order } from '@/api/orders'

const badgeClass: Record<Order['status'], string> = {
  New: 'bg-blue-600',
  Assigned: 'bg-sky-500',
  OnGoing: 'bg-amber-500',
  Completed: 'bg-green-600',
}

// Translated from php_action/order_card.php's inline countdown IIFE + orders.php's shared
// orderUpdateStatus(). New/Assigned counts down to the deadline (auto-flips to OnGoing at zero);
// OnGoing counts down 24h from ongoingSince (auto-flips to Completed at zero) — mirrors the
// server's own lazy-cron in order.repository.ts#autoTransition, just responsive without a reload.
export function OrderCard({ order }: { order: Order }) {
  const queryClient = useQueryClient()
  const [countdown, setCountdown] = useState('')
  const firedRef = useRef(false)

  const statusMutation = useMutation({
    mutationFn: (status: Order['status']) => ordersApi.updateStatus(order.id, status),
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

    if (deadline === null) {
      setCountdown('')
      return
    }

    const tick = () => {
      const dist = deadline! - Date.now()
      if (dist <= 0) {
        setCountdown(order.status === 'OnGoing' ? 'Completing…' : 'Deadline passed')
        if (!firedRef.current) {
          firedRef.current = true
          onZero?.()
        }
        return
      }
      const d = Math.floor(dist / 86400000)
      const h = Math.floor((dist % 86400000) / 3600000)
      const m = Math.floor((dist % 3600000) / 60000)
      const s = Math.floor((dist % 60000) / 1000)
      setCountdown(order.status === 'OnGoing' ? `${h}h ${m}m ${s}s` : `${d}d ${h}h ${m}m ${s}s`)
    }

    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.status, order.ongoingSince, order.deadlineDatetime])

  return (
    <div className="flex h-full flex-col rounded-2xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <div className="text-lg font-bold">Order #{order.orderNumber}</div>
          <div className="font-semibold">{order.orderName}</div>
          {order.description && <div className="text-muted-foreground text-sm">{order.description}</div>}
        </div>
        <div className="text-right">
          {order.status === 'Completed' ? (
            <span className="font-bold text-green-600">Done</span>
          ) : (
            <>
              <div className="text-muted-foreground text-xs">
                {order.status === 'OnGoing' ? 'Completes in' : 'Time Left'}
              </div>
              <div className="font-bold">{countdown}</div>
            </>
          )}
        </div>
      </div>

      <hr className="my-2" />
      <p className="mb-2 text-sm">{order.location}</p>
      <p className="mb-3">
        <span className={`rounded px-2 py-0.5 text-xs font-medium text-white ${badgeClass[order.status]}`}>
          {order.status === 'OnGoing' ? 'On Going' : order.status}
        </span>
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-2">
        {order.boqFile ? (
          <a href={order.boqFile} target="_blank" rel="noreferrer" className="text-xs underline">
            B.O.Q
          </a>
        ) : (
          <span className="text-muted-foreground text-xs">No B.O.Q</span>
        )}
        {order.artworkFile ? (
          <a href={order.artworkFile} target="_blank" rel="noreferrer" className="text-xs underline">
            Artwork
          </a>
        ) : (
          <span className="text-muted-foreground text-xs">No Artwork</span>
        )}
        <span className="text-xs">
          Team: {order.assignedUsers.map((u) => `${u.name} ${u.surname}`).join(', ') || 'None'}
        </span>

        {order.status === 'OnGoing' && (
          <Button
            size="sm"
            variant="secondary"
            className="ml-auto"
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
