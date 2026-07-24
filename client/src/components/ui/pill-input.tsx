import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// Icon-prefixed, fully-rounded input/select — the auth pages' pill style, following the same
// icon + rounded-full precedent already used by AppShell's HeaderSearch.
export interface PillInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: LucideIcon
}

export const PillInput = React.forwardRef<HTMLInputElement, PillInputProps>(({ icon: Icon, className, ...props }, ref) => (
  <div className="relative mx-auto w-[85%]">
    <Icon className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
    <input
      ref={ref}
      className={cn(
        'h-9 w-full rounded-full border border-input bg-secondary/50 pr-4 pl-11 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      {...props}
    />
  </div>
))
PillInput.displayName = 'PillInput'

export interface PillSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon: LucideIcon
}

export const PillSelect = React.forwardRef<HTMLSelectElement, PillSelectProps>(
  ({ icon: Icon, className, children, ...props }, ref) => (
    <div className="relative mx-auto w-[85%]">
      <Icon className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
      <select
        ref={ref}
        className={cn(
          'h-9 w-full appearance-none rounded-full border border-input bg-secondary/50 pr-4 pl-11 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  ),
)
PillSelect.displayName = 'PillSelect'
