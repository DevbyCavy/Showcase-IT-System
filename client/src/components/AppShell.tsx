import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Menu, X, Mail, LogOut, Search, ChevronDown } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { roleNavLinks } from '@/lib/navLinks'
import { NotificationsBell } from '@/components/NotificationsBell'
import { DashboardSidePanel } from '@/components/DashboardSidePanel'
import { DueMemosReminder } from '@/components/DueMemosReminder'
import { DueReturnsReminder } from '@/components/DueReturnsReminder'
import { LiveTripTracker } from '@/components/LiveTripTracker'
import { Button } from '@/components/ui/button'

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
        <div className="bg-card absolute top-full right-0 left-0 z-50 mt-1.5 overflow-hidden rounded-xl border">
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
// per-role link list survived in the legacy code to translate). Sidebar uses the logo's second
// (purple) color as a solid background, borderless, with the active nav item picked out in
// brand-orange; the header is borderless too and only shows mail + notifications (no avatar/name/
// role) per Calvin's request.
export function AppShell() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const links = user ? roleNavLinks[user.role] : []

  function toggleGroup(group: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  return (
    <div className="flex min-h-svh bg-background">
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <aside
        className={`from-sidebar-from to-sidebar-to fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-gradient-to-b text-white transition-transform lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <span className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <img src="/showcaseit-icon.png" alt="" className="h-8 w-8" />
            Showcase<span className="text-brand-orange">IT</span>
          </span>
          <button className="lg:hidden" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {links.map((link, i) => {
            // Section header whenever the group changes — only Super Admin's list sets `group`,
            // so this (and collapsing) is a no-op for every other role. Clicking the header
            // toggles that group; ungrouped items (Dashboard) are never collapsible.
            const isNewGroup = Boolean(link.group) && link.group !== links[i - 1]?.group
            const isCollapsed = link.group ? collapsedGroups.has(link.group) : false

            return (
              <div key={link.to}>
                {isNewGroup && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(link.group!)}
                    className={`flex w-full items-center justify-between px-3 pb-1 text-[0.68rem] font-bold tracking-wide text-white/50 uppercase hover:text-white/80 ${i === 0 ? '' : 'mt-3'}`}
                  >
                    {link.group}
                    <ChevronDown className={`h-3 w-3 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                  </button>
                )}
                {!isCollapsed && (
                  <NavLink
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive ? 'bg-brand-orange text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    <link.icon className="h-4 w-4 shrink-0" />
                    {link.label}
                  </NavLink>
                )}
              </div>
            )
          })}
        </nav>

        <div className="p-3">
          <button
            onClick={() => setLogoutConfirmOpen(true)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Translated from the legacy "Replace logout browser confirm() with a centered Bootstrap
          modal" pass — same Cancel/Yes confirm-modal pattern used throughout the app (e.g.
          ProcessRequisitions' "Confirm Processing"). */}
      {logoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setLogoutConfirmOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl border bg-card p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2 text-lg font-semibold">Confirm Logout</h2>
            <p className="text-muted-foreground mb-5 text-sm">Are you sure you want to log out?</p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => setLogoutConfirmOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => logout()}>
                <LogOut className="mr-1.5 h-4 w-4" /> Yes, Log Out
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 bg-card px-4 py-3 md:px-6">
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

      {/* Mounted once for the whole authenticated app, not per-page — see DueMemosReminder for why.
          Only Marketer/Super Admin/Graphic Designer can have memos (§21, §22), so it's a no-op for
          every other role — gating the mount just avoids a pointless 403'd poll. */}
      {(user?.role === 'Marketer' || user?.role === 'SuperAdmin' || user?.role === 'GraphicDesigner') && <DueMemosReminder />}

      {/* Mounted app-wide (not per-page) so GPS reporting survives navigation during an Active
          trip — see MIGRATION_PLAN.md §24. Renders nothing unless the current user has one. */}
      <LiveTripTracker />

      {/* Mounted app-wide, not role-gated — anyone can be a collector of a returnable item, and
          renders nothing when there's nothing due. See MIGRATION_PLAN.md §33. */}
      <DueReturnsReminder />
    </div>
  )
}
