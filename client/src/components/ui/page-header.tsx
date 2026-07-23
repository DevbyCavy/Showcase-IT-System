import type { ReactNode } from 'react'

// Consistent page title + primary-action slot, used across the full-app redesign sweep so every
// module's header (title, optional badge/count, optional action button) looks the same.
export function PageHeader({ title, action, subtitle }: { title: string; action?: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-0.5 text-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
