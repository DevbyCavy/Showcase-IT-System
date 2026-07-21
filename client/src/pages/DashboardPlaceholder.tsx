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
      <Link to="/orders" className="text-sm underline">
        Orders (Kanban)
      </Link>
      <Link to="/orders/manage" className="text-sm underline">
        Manage Orders
      </Link>
      <Link to="/boq" className="text-sm underline">
        Bill Of Quantities
      </Link>
      <Link to="/requisitions" className="text-sm underline">
        Requisitions
      </Link>
      <Link to="/vehicles" className="text-sm underline">
        Vehicle Register
      </Link>
      <Link to="/fuel-logs" className="text-sm underline">
        Fuel Log
      </Link>
      <Link to="/maintenance-logs" className="text-sm underline">
        Maintenance Log
      </Link>
      <Link to="/trip-logbook" className="text-sm underline">
        Trip Logbook
      </Link>
      {user?.role === 'SuperAdmin' && (
        <>
          <Link to="/users" className="text-sm underline">
            Manage Users
          </Link>
          <Link to="/requisitions/process" className="text-sm underline">
            Process Requisitions
          </Link>
        </>
      )}
      <Button variant="outline" onClick={() => logout()}>
        Sign out
      </Button>
    </div>
  )
}
