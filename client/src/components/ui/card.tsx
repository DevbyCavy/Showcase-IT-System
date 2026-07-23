import * as React from 'react'
import { cn } from '@/lib/utils'

// Formalizes the `rounded-2xl border bg-card p-5 shadow-sm` pattern already used ad-hoc across the
// post-migration modern-UI pages (SuperAdminDashboard, WorkLogSheet, TaskCalendar, etc.) into one
// component, so the full-app redesign sweep has a single place to keep every card visually
// consistent instead of copy-pasted className strings drifting apart page by page.
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('rounded-2xl border bg-card shadow-sm', className)} {...props} />
))
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('mb-4 flex flex-wrap items-center justify-between gap-3', className)} {...props} />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h2 ref={ref} className={cn('text-base font-bold', className)} {...props} />
))
CardTitle.displayName = 'CardTitle'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-5 md:p-6', className)} {...props} />
))
CardContent.displayName = 'CardContent'

export { Card, CardHeader, CardTitle, CardContent }
