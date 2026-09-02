import type { Role } from '@/types/auth'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  FileCheck2,
  FileSpreadsheet,
  Tag,
  Bookmark,
  Package,
  Store,
  BarChart3,
  Truck,
  Fuel,
  Wrench,
  Route,
  FileBadge2,
  Users,
  StickyNote,
  CalendarClock,
  Palette,
  MapPin,
  Ruler,
  Layers,
} from 'lucide-react'

export interface NavLink {
  to: string
  label: string
  icon: LucideIcon
  // Optional section header shown above this item in the sidebar — only Super Admin's list uses
  // it (see below); every other role's flat list just leaves it undefined and renders unchanged.
  group?: string
}

// Every one of the 7 legacy per-role dashboards turned out to be identical — auth_guard +
// requireRole + a role-specific header include + `require_once 'orders.php'` (the kanban), with
// zero unique stat cards or queries anywhere (confirmed by reading all 7). The *content* is the
// same for every role; only the *nav chrome* differed (5 header*.php variants). Two of those were
// actually bugged — accountsDashboard.php and designDashboard.php both included
// headerProduction.php instead of a dedicated header, so Accountant/Graphic Designer got
// Production's nav links by mistake. This map replaces all of that with genuine role-conditional
// navigation grounded in what each role's pages actually are, since no per-role link list survives
// to translate literally (see MIGRATION_PLAN.md Module 17).
//
// Marketer was reintroduced per MIGRATION_PLAN.md §21. "Make Quotation" and "Memos" are Marketer +
// Super Admin only now (both nav and API), reverting the "open to every role" interim state from
// when Marketer didn't exist. "Office Task Calendar" stays on every role's nav — it's not purely a
// Marketer feature, it's also how any role sees office tasks assigned to them by someone else;
// only the ability to add a new To-Do/Job is Marketer + Super Admin (enforced in the page itself,
// not by hiding the nav link, since view access is still meant for everyone).
//
// "Assign Design Job" (Marketer + Super Admin) / "My Design Jobs" (Graphic Designer + Super
// Admin) added per MIGRATION_PLAN.md §22 — a standalone feature for assigning Artwork/3D Design
// work to a designer, distinct from Manage Orders.
//
// "Tracking" (Logistics + Super Admin) added per MIGRATION_PLAN.md §24 — live GPS map of drivers
// on Active trips, same audience as the rest of the vehicle module.
//
// Super Admin's list is grouped by department per Calvin's request (§26), collapsible with a
// fixed group order (§27): Admin, Marketing, Design, Stores, Logistics, Production — it's the one
// role with every module in its nav, so it's the one that actually benefits from section headers;
// every other role's list is short enough to stay flat. Mapping: Admin catches the genuinely
// cross-departmental/admin-only pages (Requisitions — any role can submit one, regardless of
// department; Office Task Calendar — same; Manage Users — Super Admin-only account
// administration); Marketing owns Orders/Quotations/Memos (§21's Marketer-restricted set); Design
// owns Assign Design Job; Stores owns the catalog/stock pages; Logistics owns the vehicle module;
// Production owns BOQ, plus AI Takeoff / Materials (added alongside the AI Takeoff / BOQ
// Generator feature — see App.tsx) — the first entries to actually use this group.
export const roleNavLinks: Record<Role, NavLink[]> = {
  SuperAdmin: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },

    { to: '/requisitions', label: 'Requisitions', icon: FileCheck2, group: 'Admin' },
    { to: '/requisitions/process', label: 'Process Requisitions', icon: FileCheck2, group: 'Admin' },
    { to: '/task-calendar', label: 'Office Task Calendar', icon: CalendarClock, group: 'Admin' },
    { to: '/users', label: 'Manage Users', icon: Users, group: 'Admin' },

    { to: '/orders/manage', label: 'Manage Orders', icon: ClipboardList, group: 'Marketing' },
    { to: '/quotations', label: 'Make Quotation', icon: FileSpreadsheet, group: 'Marketing' },
    { to: '/quotations/process', label: 'Process Quotations', icon: FileSpreadsheet, group: 'Marketing' },
    { to: '/memos', label: 'Memos', icon: StickyNote, group: 'Marketing' },

    { to: '/design-jobs/assign', label: 'Assign Design Job', icon: Palette, group: 'Design' },

    { to: '/categories', label: 'Categories', icon: Tag, group: 'Stores' },
    { to: '/brands', label: 'Brands', icon: Bookmark, group: 'Stores' },
    { to: '/products', label: 'Products', icon: Package, group: 'Stores' },
    { to: '/store', label: 'Store', icon: Store, group: 'Stores' },
    { to: '/reports/issued-products', label: 'Issued Products Report', icon: BarChart3, group: 'Stores' },

    { to: '/vehicles', label: 'Vehicles', icon: Truck, group: 'Logistics' },
    { to: '/fuel-logs', label: 'Fuel Log', icon: Fuel, group: 'Logistics' },
    { to: '/maintenance-logs', label: 'Maintenance Log', icon: Wrench, group: 'Logistics' },
    { to: '/trip-logbook', label: 'Trip Logbook', icon: Route, group: 'Logistics' },
    { to: '/vehicle-documents', label: 'Vehicle Documents', icon: FileBadge2, group: 'Logistics' },
    { to: '/tracking', label: 'Tracking', icon: MapPin, group: 'Logistics' },

    // Manual BOQ — was missing from Super Admin's nav entirely (present for Stores Admin/Project
    // Manager already; this file's own header comment names 'Production' as owning it, but no
    // entry ever used that slot for Super Admin until now).
    { to: '/boq', label: 'Make BOQ', icon: FileText, group: 'Production' },
    // AI Takeoff / BOQ Generator + its Materials reference table — additive alongside the manual
    // BOQ feature above (see App.tsx).
    { to: '/takeoff-projects', label: 'AI Takeoff', icon: Ruler, group: 'Production' },
    { to: '/materials', label: 'Materials', icon: Layers, group: 'Production' },
  ],
  StoresAdmin: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/task-calendar', label: 'Office Task Calendar', icon: CalendarClock },
    { to: '/boq', label: 'BOQ', icon: FileText },
    { to: '/takeoff-projects', label: 'AI Takeoff', icon: Ruler },
    { to: '/materials', label: 'Materials', icon: Layers },

    { to: '/categories', label: 'Categories', icon: Tag, group: 'Stores' },
    { to: '/brands', label: 'Brands', icon: Bookmark, group: 'Stores' },
    { to: '/products', label: 'Products', icon: Package, group: 'Stores' },
    { to: '/store', label: 'Store', icon: Store, group: 'Stores' },
    { to: '/reports/issued-products', label: 'Issued Products Report', icon: BarChart3, group: 'Stores' },

    { to: '/vehicles', label: 'Vehicles', icon: Truck, group: 'Logistics' },
    { to: '/fuel-logs', label: 'Fuel Log', icon: Fuel, group: 'Logistics' },
    { to: '/maintenance-logs', label: 'Maintenance Log', icon: Wrench, group: 'Logistics' },
    { to: '/trip-logbook', label: 'Trip Logbook', icon: Route, group: 'Logistics' },
    { to: '/vehicle-documents', label: 'Vehicle Documents', icon: FileBadge2, group: 'Logistics' },
    { to: '/tracking', label: 'Tracking', icon: MapPin, group: 'Logistics' },
  ],
  ProjectManager: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/orders/manage', label: 'Manage Orders', icon: ClipboardList },
    { to: '/boq', label: 'BOQ', icon: FileText },
    { to: '/takeoff-projects', label: 'AI Takeoff', icon: Ruler },
    { to: '/materials', label: 'Materials', icon: Layers },
    { to: '/requisitions', label: 'Requisitions', icon: FileCheck2 },
    { to: '/task-calendar', label: 'Office Task Calendar', icon: CalendarClock },
  ],
  Accountant: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/requisitions', label: 'Requisitions', icon: FileCheck2 },
    { to: '/task-calendar', label: 'Office Task Calendar', icon: CalendarClock },
  ],
  GraphicDesigner: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/design-jobs/mine', label: 'My Design Jobs', icon: Palette },
    { to: '/requisitions', label: 'Requisitions', icon: FileCheck2 },
    { to: '/memos', label: 'Memos', icon: StickyNote },
    { to: '/task-calendar', label: 'Office Task Calendar', icon: CalendarClock },
  ],
  ProductionTeam: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/reports/issued-products', label: 'Issued Products Report', icon: BarChart3 },
    { to: '/requisitions', label: 'Requisitions', icon: FileCheck2 },
    { to: '/task-calendar', label: 'Office Task Calendar', icon: CalendarClock },
  ],
  Logistics: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/vehicles', label: 'Vehicles', icon: Truck },
    { to: '/fuel-logs', label: 'Fuel Log', icon: Fuel },
    { to: '/maintenance-logs', label: 'Maintenance Log', icon: Wrench },
    { to: '/trip-logbook', label: 'Trip Logbook', icon: Route },
    { to: '/vehicle-documents', label: 'Vehicle Documents', icon: FileBadge2 },
    { to: '/tracking', label: 'Tracking', icon: MapPin },
    { to: '/task-calendar', label: 'Office Task Calendar', icon: CalendarClock },
  ],
  Marketer: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/orders/manage', label: 'Manage Orders', icon: ClipboardList },
    { to: '/requisitions', label: 'Requisitions', icon: FileCheck2 },
    { to: '/quotations', label: 'Make Quotation', icon: FileSpreadsheet },
    { to: '/memos', label: 'Memos', icon: StickyNote },
    { to: '/design-jobs/assign', label: 'Assign Design Job', icon: Palette },
    { to: '/task-calendar', label: 'Office Task Calendar', icon: CalendarClock },
  ],
}
