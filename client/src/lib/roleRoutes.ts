// Client-side equivalent of the role -> dashboard switch in index.php's login handler.
import type { Role } from '@/types/auth'

export const roleDashboardPath: Record<Role, string> = {
  SuperAdmin: '/dashboard/super-admin',
  StoresAdmin: '/dashboard/stores-admin',
  ProjectManager: '/dashboard/project-manager',
  Accountant: '/dashboard/accountant',
  GraphicDesigner: '/dashboard/graphic-designer',
  ProductionTeam: '/dashboard/production-team',
  Logistics: '/dashboard/logistics',
}
