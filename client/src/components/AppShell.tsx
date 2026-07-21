import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { roleNavLinks } from '@/lib/navLinks'
import { Button } from '@/components/ui/button'

// Replaces the 5 duplicated includes/header*.php variants with one shared shell and genuine
// role-conditional nav (see MIGRATION_PLAN.md Module 17 and navLinks.ts for why nothing here is a
// literal translation — no per-role link list survived in the legacy code to translate).
export function AppShell() {
  const { user, logout } = useAuth()
  const links = user ? roleNavLinks[user.role] : []

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">Showcase IT</span>
          </div>
          <nav className="flex flex-1 flex-wrap justify-center gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="text-right text-xs">
              <div className="font-semibold">
                {user?.name} {user?.surname}
              </div>
              <div className="text-muted-foreground">{user?.role}</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => logout()}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
