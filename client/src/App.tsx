import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import ManageUsers from '@/pages/ManageUsers'
import Categories from '@/pages/Categories'
import DashboardPlaceholder from '@/pages/DashboardPlaceholder'
import { ProtectedRoute } from '@/components/ProtectedRoute'

function AccessDenied() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <p className="text-muted-foreground">Access denied.</p>
    </div>
  )
}

function NotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <p className="text-muted-foreground">Not found.</p>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/access-denied" element={<AccessDenied />} />

      {/* categories.php requires only a session, no specific role - matches ProtectedRoute with no `roles`. */}
      <Route element={<ProtectedRoute />}>
        <Route path="/categories" element={<Categories />} />
      </Route>

      <Route element={<ProtectedRoute roles={['SuperAdmin']} />}>
        <Route path="/dashboard/super-admin" element={<DashboardPlaceholder title="Super Admin Dashboard" />} />
        <Route path="/users" element={<ManageUsers />} />
      </Route>
      <Route element={<ProtectedRoute roles={['StoresAdmin']} />}>
        <Route path="/dashboard/stores-admin" element={<DashboardPlaceholder title="Stores Admin Dashboard" />} />
      </Route>
      <Route element={<ProtectedRoute roles={['ProjectManager']} />}>
        <Route path="/dashboard/project-manager" element={<DashboardPlaceholder title="Project Manager Dashboard" />} />
      </Route>
      <Route element={<ProtectedRoute roles={['Accountant']} />}>
        <Route path="/dashboard/accountant" element={<DashboardPlaceholder title="Accountant Dashboard" />} />
      </Route>
      <Route element={<ProtectedRoute roles={['GraphicDesigner']} />}>
        <Route path="/dashboard/graphic-designer" element={<DashboardPlaceholder title="Graphic Designer Dashboard" />} />
      </Route>
      <Route element={<ProtectedRoute roles={['ProductionTeam']} />}>
        <Route path="/dashboard/production-team" element={<DashboardPlaceholder title="Production Team Dashboard" />} />
      </Route>
      <Route element={<ProtectedRoute roles={['Logistics']} />}>
        <Route path="/dashboard/logistics" element={<DashboardPlaceholder title="Logistics Dashboard" />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
