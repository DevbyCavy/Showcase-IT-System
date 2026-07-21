import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Menu, X, Mail, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { roleNavLinks } from '@/lib/navLinks'
import { NotificationsBell } from '@/components/NotificationsBell'

// Replaces the 5 duplicated includes/header*.php variants (and, per the post-migration UI pass,
// recreates the feature/work-log-sheet branch's dark-sidebar "modern dashboard" shell) with one
// shared component and genuine role-conditional nav — see navLinks.ts for why nothing here is a
// literal translation (no per-role link list survived in the legacy code to translate).
export function AppShell() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const links = user ? roleNavLinks[user.role] : []

  return (
    <div className="flex min-h-svh bg-[var(--bg-page,#f5f6fa)]">
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-gradient-to-b from-ink to-ink-soft text-white transition-transform lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <span className="text-lg font-bold tracking-tight">
            Showcase<span className="text-brand-orange-light">IT</span>
          </span>
          <button className="lg:hidden" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-orange text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <link.icon className="h-4 w-4 shrink-0" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
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
