import { useEffect } from 'react'
import { X, CheckCircle2, XCircle, Bell } from 'lucide-react'

export interface ToastItem {
  id: number
  message: string
  tone: 'success' | 'info' | 'error'
}

// Minimal toast stack — no library, matches the app's existing rounded-card/colored-icon-badge
// aesthetic (see OrderCard's status icon). Used for real-time quotation alerts (see
// MIGRATION_PLAN.md): "New quotation submitted" for Super Admin, "Your quotation was approved"
// for Marketer.
export function ToastStack({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: number) => void }) {
  if (items.length === 0) return null
  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {items.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(item.id), 6000)
    return () => clearTimeout(timer)
  }, [item.id, onDismiss])

  const Icon = item.tone === 'success' ? CheckCircle2 : item.tone === 'error' ? XCircle : Bell

  return (
    <div className="flex items-start gap-2.5 rounded-xl border bg-card p-3 text-sm shadow-lg">
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${
          item.tone === 'success' ? 'bg-green-600' : item.tone === 'error' ? 'bg-destructive' : 'bg-brand-orange'
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="flex-1 pt-0.5">{item.message}</span>
      <button onClick={() => onDismiss(item.id)} className="text-muted-foreground shrink-0 hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
