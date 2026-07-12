import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';

// Import local PostgreSQL-connected views
import { RoleDashboard } from './pages/RoleDashboard';
import { VehiclesPage } from './pages/fleet/VehiclesPage';
import { DriversPage } from './pages/fleet/DriversPage';
import { TripsPage } from './pages/fleet/TripsPage';
import { DriverWorkspace } from './pages/driver/DriverWorkspace';
import { FleetShell } from './components/FleetShell';

// Import remote static Owner views
import { OwnerDashboard } from './pages/owner/Dashboard';
import { BusinessProfile } from './pages/owner/BusinessProfile';
import { Workers } from './pages/owner/Workers';
import { Trips } from './pages/owner/Trips';
import { Maintenance } from './pages/owner/Maintenance';
import { Revenue } from './pages/owner/Revenue';
import { Reports } from './pages/owner/Reports';
import { Settings } from './pages/owner/Settings';
import { DashboardLayout } from './components/layout/DashboardLayout';

interface PlaceholderPageProps {
  title: string;
  desc: string;
}

function PlaceholderPage({ title, desc }: PlaceholderPageProps) {
  return (
    <div className="glass-card rounded-[2rem] p-10 border border-[var(--border)]">
      <h1 className="text-4xl font-black tracking-tight mb-3">{title}</h1>
      <p className="text-[var(--text-muted)] max-w-2xl mb-8">{desc}</p>
      <div className="p-12 border border-dashed border-[var(--border)] rounded-2xl text-center text-[var(--text-muted)] font-medium">
        This feature is planned for the next implementation phase.
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />

              {/* Dynamic PostgreSQL-connected paths */}
              <Route
                path="/fleet"
                element={
                  <ProtectedRoute roles={['Fleet Manager']}>
                    <RoleDashboard role="Fleet Manager" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fleet/vehicles"
                element={
                  <ProtectedRoute roles={['Fleet Manager']}>
                    <VehiclesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fleet/drivers"
                element={
                  <ProtectedRoute roles={['Fleet Manager']}>
                    <DriversPage role="Fleet Manager" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fleet/trips"
                element={
                  <ProtectedRoute roles={['Fleet Manager']}>
                    <TripsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fleet/maintenance"
                element={
                  <ProtectedRoute roles={['Fleet Manager', 'Safety Officer']}>
                    <FleetShell role="Fleet Manager">
                      <Maintenance />
                    </FleetShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fleet/expenses"
                element={
                  <ProtectedRoute roles={['Fleet Manager', 'Financial Analyst']}>
                    <FleetShell role="Fleet Manager">
                      <Revenue />
                    </FleetShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fleet/analytics"
                element={
                  <ProtectedRoute roles={['Fleet Manager', 'Financial Analyst', 'Safety Officer']}>
                    <FleetShell role="Fleet Manager">
                      <Reports />
                    </FleetShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fleet/settings"
                element={
                  <ProtectedRoute roles={['Fleet Manager', 'Safety Officer', 'Financial Analyst', 'Driver']}>
                    <FleetShell role="Fleet Manager">
                      <PlaceholderPage title="Account Settings" desc="Configure your profile, change theme, manage notification settings, and set security rules." />
                    </FleetShell>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/driver"
                element={
                  <ProtectedRoute roles={['Driver']}>
                    <DriverWorkspace />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/safety"
                element={
                  <ProtectedRoute roles={['Safety Officer']}>
                    <RoleDashboard role="Safety Officer" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/safety/drivers"
                element={
                  <ProtectedRoute roles={['Safety Officer']}>
                    <DriversPage role="Safety Officer" />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/finance"
                element={
                  <ProtectedRoute roles={['Financial Analyst']}>
                    <RoleDashboard role="Financial Analyst" />
                  </ProtectedRoute>
                }
              />

              {/* Remote layout sub-routes */}
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
