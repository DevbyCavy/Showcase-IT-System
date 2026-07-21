import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

export default function DashboardPlaceholder({ title }: { title: string }) {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground text-sm">
        Signed in as {user?.name} {user?.surname} ({user?.role})
      </p>
      <p className="text-muted-foreground text-xs">
        Real dashboard content lands with Module 17 — this proves login + RBAC end to end.
      </p>
      <Link to="/categories" className="text-sm underline">
        Manage Categories
      </Link>
      <Link to="/brands" className="text-sm underline">
        Manage Brands
      </Link>
      <Link to="/products" className="text-sm underline">
        Manage Products
      </Link>
      <Link to="/store" className="text-sm underline">
        Store (Issue Products)
      </Link>
      <Link to="/reports/issued-products" className="text-sm underline">
        Issued Products Report
      </Link>
      {user?.role === 'SuperAdmin' && (
        <Link to="/users" className="text-sm underline">
          Manage Users
        </Link>
      )}
      <Button variant="outline" onClick={() => logout()}>
        Sign out
      </Button>
    </div>
  )
}
