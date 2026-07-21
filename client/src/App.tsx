import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import ManageUsers from '@/pages/ManageUsers'
import Categories from '@/pages/Categories'
import Brands from '@/pages/Brands'
import Products from '@/pages/Products'
import Store from '@/pages/Store'
import IssuedProductsReport from '@/pages/IssuedProductsReport'
import OrdersKanban from '@/pages/OrdersKanban'
import ManageOrders from '@/pages/ManageOrders'
import BOQ from '@/pages/BOQ'
import Requisitions from '@/pages/Requisitions'
import ProcessRequisitions from '@/pages/ProcessRequisitions'
import Vehicles from '@/pages/Vehicles'
import FuelLogs from '@/pages/FuelLogs'
import MaintenanceLogs from '@/pages/MaintenanceLogs'
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
        <Route path="/brands" element={<Brands />} />
        <Route path="/products" element={<Products />} />
        <Route path="/store" element={<Store />} />
        <Route path="/reports/issued-products" element={<IssuedProductsReport />} />
        <Route path="/orders" element={<OrdersKanban />} />
        <Route path="/orders/manage" element={<ManageOrders />} />
        <Route path="/boq" element={<BOQ />} />
        <Route path="/requisitions" element={<Requisitions />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/fuel-logs" element={<FuelLogs />} />
        <Route path="/maintenance-logs" element={<MaintenanceLogs />} />
      </Route>

      <Route element={<ProtectedRoute roles={['SuperAdmin']} />}>
        <Route path="/dashboard/super-admin" element={<DashboardPlaceholder title="Super Admin Dashboard" />} />
        <Route path="/users" element={<ManageUsers />} />
        <Route path="/requisitions/process" element={<ProcessRequisitions />} />
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
