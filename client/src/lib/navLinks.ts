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
} from 'lucide-react'

export interface NavLink {
  to: string
  label: string
  icon: LucideIcon
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
export const roleNavLinks: Record<Role, NavLink[]> = {
  SuperAdmin: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/orders/manage', label: 'Manage Orders', icon: ClipboardList },
    { to: '/boq', label: 'BOQ', icon: FileText },
    { to: '/requisitions', label: 'Requisitions', icon: FileCheck2 },
    { to: '/requisitions/process', label: 'Process Requisitions', icon: FileCheck2 },
    { to: '/quotations', label: 'Make Quotation', icon: FileSpreadsheet },
    { to: '/memos', label: 'Memos', icon: StickyNote },
    { to: '/task-calendar', label: 'Office Task Calendar', icon: CalendarClock },
    { to: '/quotations/process', label: 'Process Quotations', icon: FileSpreadsheet },
    { to: '/design-jobs/assign', label: 'Assign Design Job', icon: Palette },
    { to: '/categories', label: 'Categories', icon: Tag },
    { to: '/brands', label: 'Brands', icon: Bookmark },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/store', label: 'Store', icon: Store },
    { to: '/reports/issued-products', label: 'Issued Products Report', icon: BarChart3 },
    { to: '/vehicles', label: 'Vehicles', icon: Truck },
    { to: '/fuel-logs', label: 'Fuel Log', icon: Fuel },
    { to: '/maintenance-logs', label: 'Maintenance Log', icon: Wrench },
    { to: '/trip-logbook', label: 'Trip Logbook', icon: Route },
    { to: '/vehicle-documents', label: 'Vehicle Documents', icon: FileBadge2 },
    { to: '/tracking', label: 'Tracking', icon: MapPin },
    { to: '/users', label: 'Manage Users', icon: Users },
  ],
  StoresAdmin: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/categories', label: 'Categories', icon: Tag },
    { to: '/brands', label: 'Brands', icon: Bookmark },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/store', label: 'Store', icon: Store },
    { to: '/reports/issued-products', label: 'Issued Products Report', icon: BarChart3 },
    { to: '/trip-logbook', label: 'Trip Logbook', icon: Route },
    { to: '/task-calendar', label: 'Office Task Calendar', icon: CalendarClock },
  ],
  ProjectManager: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/orders/manage', label: 'Manage Orders', icon: ClipboardList },
    { to: '/boq', label: 'BOQ', icon: FileText },
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
    { to: '/store', label: 'Store', icon: Store },
    { to: '/reports/issued-products', label: 'Issued Products Report', icon: BarChart3 },
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
