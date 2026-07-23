import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Menu, X, Mail, LogOut, Search, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { roleNavLinks } from '@/lib/navLinks'
import { NotificationsBell } from '@/components/NotificationsBell'
import { DashboardSidePanel } from '@/components/DashboardSidePanel'

// Quick "jump to page" search for the header's left-aligned rounded search bar — filters the
// current role's own nav links (no global content-search feature exists anywhere in the legacy app
// to migrate, so this is new but small and self-contained: it only ever navigates, it doesn't
// query any data).
function HeaderSearch() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const links = user ? roleNavLinks[user.role] : []
  const matches = query.trim() ? links.filter((l) => l.label.toLowerCase().includes(query.trim().toLowerCase())) : []

  function go(to: string) {
    navigate(to)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="relative w-full max-w-md">
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
      <input
        className="focus:ring-ring w-full rounded-full border bg-secondary/50 py-2.5 pr-4 pl-11 text-sm outline-none focus:ring-2"
        placeholder="Search pages..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && matches[0]) go(matches[0].to)
        }}
      />
      {open && query.trim() && (
        <div className="bg-card absolute top-full right-0 left-0 z-50 mt-1.5 overflow-hidden rounded-xl border shadow-lg">
          {matches.length === 0 ? (
            <div className="text-muted-foreground px-4 py-3 text-sm">No pages found.</div>
          ) : (
            matches.map((l) => (
              <button
                key={l.to}
                className="hover:bg-secondary flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm"
                onMouseDown={() => go(l.to)}
              >
                <l.icon className="text-muted-foreground h-4 w-4" /> {l.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

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
          <span className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <img src="/showcaseit-icon.png" alt="" className="h-8 w-8" />
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
        <header className="flex items-center justify-between gap-4 border-b bg-card px-4 py-3 md:px-6">
          <button className="text-muted-foreground lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <div className="hidden flex-1 lg:block">
            <HeaderSearch />
          </div>
          <div className="flex items-center gap-1.5">
            {user?.email && (
              <a
                href={`mailto:${user.email}`}
                className="text-muted-foreground hover:bg-secondary flex h-9 w-9 items-center justify-center rounded-full"
                title={user.email}
              >
                <Mail className="h-5 w-5" />
              </a>
            )}
            <NotificationsBell />
            <div className="mx-1 h-6 w-px bg-border" />
            <div className="flex items-center gap-2 pr-1">
              <div className="bg-secondary flex h-9 w-9 items-center justify-center rounded-full">
                <User className="h-[18px] w-[18px]" />
              </div>
              <div className="hidden text-right text-xs sm:block">
                <div className="font-semibold">
                  {user?.name} {user?.surname}
                </div>
                <div className="text-muted-foreground">{user?.role}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-start xl:flex-row">
          {/* Each page owns its own max-width/padding, unchanged — this wrapper just makes room
              for the side panel alongside it. */}
          <div className="min-w-0 w-full flex-1">
            <Outlet />
          </div>
          {/* Profile card + calendar + BOQ list — kept visible on every page per Calvin's request,
              not just the dashboard (see MIGRATION_PLAN.md §10.10). */}
          <div className="w-full shrink-0 p-4 md:p-8 xl:w-auto xl:pl-0">
            <DashboardSidePanel />
          </div>
        </main>
      </div>
    </div>
  )
}
