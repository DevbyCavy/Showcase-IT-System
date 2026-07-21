import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/types/auth'

// Equivalent of requireRole($role) in auth_guard.php: unauthenticated -> login (was index.php),
// wrong role -> access-denied (was index.php?error=AccessDenied).
export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return null
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/access-denied" replace />

  return <Outlet />
}
