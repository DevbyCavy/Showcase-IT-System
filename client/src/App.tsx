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
import SuperAdminDashboard from '@/pages/SuperAdminDashboard'
import ManageOrders from '@/pages/ManageOrders'
import BOQ from '@/pages/BOQ'
import Requisitions from '@/pages/Requisitions'
import ProcessRequisitions from '@/pages/ProcessRequisitions'
import MakeQuotation from '@/pages/MakeQuotation'
import ProcessQuotations from '@/pages/ProcessQuotations'
import Memos from '@/pages/Memos'
import AssignDesignJob from '@/pages/AssignDesignJob'
import MyDesignJobs from '@/pages/MyDesignJobs'
import OfficeTaskCalendarPage from '@/pages/OfficeTaskCalendarPage'
import Vehicles from '@/pages/Vehicles'
import FuelLogs from '@/pages/FuelLogs'
import MaintenanceLogs from '@/pages/MaintenanceLogs'
import TripLogbook from '@/pages/TripLogbook'
import VehicleDocuments from '@/pages/VehicleDocuments'
import TrackingDashboard from '@/pages/TrackingDashboard'
import TakeoffProjects from '@/pages/TakeoffProjects'
import TakeoffProjectDetail from '@/pages/TakeoffProjectDetail'
import TakeoffDesignReview from '@/pages/TakeoffDesignReview'
import Materials from '@/pages/Materials'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppShell } from '@/components/AppShell'
import { useAuth } from '@/hooks/useAuth'

// Every role but Super Admin still gets the plain Orders kanban as their dashboard (see
// MIGRATION_PLAN.md Module 17) — only Super Admin's was rebuilt into the full modern dashboard
// (orders carousel, Work Log Sheet, quick-actions, profile/calendar/BOQ side column) per §10.
function Dashboard() {
  const { user } = useAuth()
  return user?.role === 'SuperAdmin' ? <SuperAdminDashboard /> : <OrdersKanban />
}

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

// Every one of the 7 legacy per-role dashboards is auth_guard + requireRole + a role-specific
// header + `require_once 'orders.php'` — the same kanban content for every role (see
// MIGRATION_PLAN.md Module 17). One shared /dashboard route replaces all 7; AppShell supplies the
// role-conditional nav that used to come from 5 duplicated header*.php includes.
function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/access-denied" element={<AccessDenied />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/products" element={<Products />} />
          <Route path="/store" element={<Store />} />
          <Route path="/reports/issued-products" element={<IssuedProductsReport />} />
          <Route path="/orders" element={<OrdersKanban />} />
          <Route path="/orders/manage" element={<ManageOrders />} />
          <Route path="/boq" element={<BOQ />} />
          <Route path="/requisitions" element={<Requisitions />} />
          <Route path="/task-calendar" element={<OfficeTaskCalendarPage />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/fuel-logs" element={<FuelLogs />} />
          <Route path="/maintenance-logs" element={<MaintenanceLogs />} />
          <Route path="/trip-logbook" element={<TripLogbook />} />
          <Route path="/vehicle-documents" element={<VehicleDocuments />} />
          <Route path="/tracking" element={<TrackingDashboard />} />

          <Route element={<ProtectedRoute roles={['SuperAdmin']} />}>
            <Route path="/users" element={<ManageUsers />} />
            <Route path="/requisitions/process" element={<ProcessRequisitions />} />
            <Route path="/quotations/process" element={<ProcessQuotations />} />
          </Route>

          {/* Quotations/Assign Design Job restricted to Marketer + Super Admin (see MIGRATION_PLAN.md §21) */}
          <Route element={<ProtectedRoute roles={['Marketer', 'SuperAdmin']} />}>
            <Route path="/quotations" element={<MakeQuotation />} />
            <Route path="/design-jobs/assign" element={<AssignDesignJob />} />
          </Route>

          {/* Memos: Marketer + Super Admin, plus Graphic Designer per Calvin's request (§22) */}
          <Route element={<ProtectedRoute roles={['Marketer', 'SuperAdmin', 'GraphicDesigner']} />}>
            <Route path="/memos" element={<Memos />} />
          </Route>

          {/* My Design Jobs restricted to Graphic Designer + Super Admin (see MIGRATION_PLAN.md §22) */}
          <Route element={<ProtectedRoute roles={['GraphicDesigner', 'SuperAdmin']} />}>
            <Route path="/design-jobs/mine" element={<MyDesignJobs />} />
          </Route>

          {/* AI Takeoff / BOQ Generator + its Materials reference table — same audience as the
              existing manual BOQ page (Super Admin, Stores Admin, Project Manager). New feature,
              genuinely gated rather than left open like /boq's legacy no-requireRole precedent. */}
          <Route element={<ProtectedRoute roles={['SuperAdmin', 'StoresAdmin', 'ProjectManager']} />}>
            <Route path="/takeoff-projects" element={<TakeoffProjects />} />
            <Route path="/takeoff-projects/:id" element={<TakeoffProjectDetail />} />
            <Route path="/takeoff-projects/:id/designs/:designId" element={<TakeoffDesignReview />} />
            <Route path="/materials" element={<Materials />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
