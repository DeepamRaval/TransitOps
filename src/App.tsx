import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';

// Import TransitOps Page Modules
import { OwnerDashboard } from './pages/owner/Dashboard';
import { BusinessProfile } from './pages/owner/BusinessProfile';
import { Workers } from './pages/owner/Workers';
import { Trips } from './pages/owner/Trips';
import { Maintenance } from './pages/owner/Maintenance';
import { Revenue } from './pages/owner/Revenue';
import { Reports } from './pages/owner/Reports';
import { Settings } from './pages/owner/Settings';
import { DashboardLayout } from './components/layout/DashboardLayout';

function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <AuthProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />

            {/* Role Home Redirect Paths */}
            <Route
              path="/fleet"
              element={
                <ProtectedRoute roles={['Fleet Manager']}>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver"
              element={
                <ProtectedRoute roles={['Driver']}>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/safety"
              element={
                <ProtectedRoute roles={['Safety Officer']}>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance"
              element={
                <ProtectedRoute roles={['Financial Analyst']}>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              }
            />

            {/* Dashboard Sub-routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute roles={['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst']}>
                  <DashboardLayout>
                    <OwnerDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/profile"
              element={
                <ProtectedRoute roles={['Fleet Manager']}>
                  <DashboardLayout>
                    <BusinessProfile />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/workers"
              element={
                <ProtectedRoute roles={['Fleet Manager', 'Safety Officer']}>
                  <DashboardLayout>
                    <Workers />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/trips"
              element={
                <ProtectedRoute roles={['Fleet Manager', 'Driver']}>
                  <DashboardLayout>
                    <Trips />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/maintenance"
              element={
                <ProtectedRoute roles={['Fleet Manager']}>
                  <DashboardLayout>
                    <Maintenance />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/revenue"
              element={
                <ProtectedRoute roles={['Financial Analyst']}>
                  <DashboardLayout>
                    <Revenue />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/reports"
              element={
                <ProtectedRoute roles={['Financial Analyst']}>
                  <DashboardLayout>
                    <Reports />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <ProtectedRoute roles={['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst']}>
                  <DashboardLayout>
                    <Settings />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </DataProvider>
    </ThemeProvider>
  );
}

export default App;
