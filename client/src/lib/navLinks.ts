import type { Role } from '@/types/auth'

export interface NavLink {
  to: string
  label: string
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
export const roleNavLinks: Record<Role, NavLink[]> = {
  SuperAdmin: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/orders/manage', label: 'Manage Orders' },
    { to: '/boq', label: 'BOQ' },
    { to: '/requisitions', label: 'Requisitions' },
    { to: '/requisitions/process', label: 'Process Requisitions' },
    { to: '/categories', label: 'Categories' },
    { to: '/brands', label: 'Brands' },
    { to: '/products', label: 'Products' },
    { to: '/store', label: 'Store' },
    { to: '/reports/issued-products', label: 'Issued Products Report' },
    { to: '/vehicles', label: 'Vehicles' },
    { to: '/fuel-logs', label: 'Fuel Log' },
    { to: '/maintenance-logs', label: 'Maintenance Log' },
    { to: '/trip-logbook', label: 'Trip Logbook' },
    { to: '/vehicle-documents', label: 'Vehicle Documents' },
    { to: '/users', label: 'Manage Users' },
  ],
  StoresAdmin: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/categories', label: 'Categories' },
    { to: '/brands', label: 'Brands' },
    { to: '/products', label: 'Products' },
    { to: '/store', label: 'Store' },
    { to: '/reports/issued-products', label: 'Issued Products Report' },
  ],
  ProjectManager: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/orders/manage', label: 'Manage Orders' },
    { to: '/boq', label: 'BOQ' },
    { to: '/requisitions', label: 'Requisitions' },
  ],
  Accountant: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/requisitions', label: 'Requisitions' },
  ],
  GraphicDesigner: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/orders/manage', label: 'Manage Orders' },
  ],
  ProductionTeam: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/store', label: 'Store' },
    { to: '/reports/issued-products', label: 'Issued Products Report' },
  ],
  Logistics: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/vehicles', label: 'Vehicles' },
    { to: '/fuel-logs', label: 'Fuel Log' },
    { to: '/maintenance-logs', label: 'Maintenance Log' },
    { to: '/trip-logbook', label: 'Trip Logbook' },
    { to: '/vehicle-documents', label: 'Vehicle Documents' },
  ],
}
