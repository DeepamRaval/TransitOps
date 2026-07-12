import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { RoleDashboard } from './pages/RoleDashboard';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />

            <Route
              path="/fleet"
              element={
                <ProtectedRoute roles={['Fleet Manager']}>
                  <RoleDashboard role="Fleet Manager" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver"
              element={
                <ProtectedRoute roles={['Driver']}>
                  <RoleDashboard role="Driver" />
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
              path="/finance"
              element={
                <ProtectedRoute roles={['Financial Analyst']}>
                  <RoleDashboard role="Financial Analyst" />
                </ProtectedRoute>
              }
            />

            <Route path="/dashboard" element={<Navigate to="/fleet" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
