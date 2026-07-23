import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Menu, X, Mail, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { roleNavLinks } from '@/lib/navLinks'
import { NotificationsBell } from '@/components/NotificationsBell'

// Replaces the 5 duplicated includes/header*.php variants with one shared component and genuine
// role-conditional nav — see navLinks.ts for why nothing here is a literal translation (no
// per-role link list survived in the legacy code to translate). Styled white/bordered with black
// text to match the original app's look (Calvin didn't like the dark sidebar from an earlier pass).
export function AppShell() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const links = user ? roleNavLinks[user.role] : []

  return (
    <div className="flex min-h-svh bg-background">
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-card text-foreground transition-transform lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b px-5 py-5">
          <span className="text-lg font-bold tracking-tight">
            Showcase<span className="text-brand-orange">IT</span>
          </span>
          <button className="lg:hidden" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'border-brand-orange bg-brand-orange text-white' : 'border-transparent text-foreground hover:border-input hover:bg-secondary'
                }`
              }
            >
              <link.icon className="h-4 w-4 shrink-0" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t p-3">
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-foreground hover:border-input hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b bg-card px-4 py-3">
          <button className="text-muted-foreground lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <div className="hidden flex-1 lg:block" />
          <div className="flex items-center gap-2">
            {user?.email && (
              <a
                href={`mailto:${user.email}`}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
                title={user.email}
              >
                <Mail className="h-5 w-5" />
              </a>
            )}
            <NotificationsBell />
            <div className="ml-1 text-right text-xs">
              <div className="font-semibold">
                {user?.name} {user?.surname}
              </div>
              <div className="text-muted-foreground">{user?.role}</div>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
