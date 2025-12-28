import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SupabaseAuthProvider, useAuth } from './context/SupabaseAuthContext';
import HomePageNew from './pages/HomePageNew';
import EventDetailPage from './pages/EventDetailPage';
import SuccessPage from './pages/SuccessPage';
import ErrorPage from './pages/ErrorPage';
import OrganizerDashboardPage from './pages/OrganizerDashboardPage';
import AdminFinancePage from './pages/AdminFinancePage';
import OpsManagerPage from './pages/OpsManagerPage';
import EPscanPage from './pages/EPscanPage';

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePageNew />} />
      <Route path="/event/:slug" element={<EventDetailPage />} />
      <Route path="/success" element={<SuccessPage />} />
      <Route path="/error" element={<ErrorPage />} />

      <Route
        path="/organizer/dashboard"
        element={
          <ProtectedRoute requiredRole="organizer">
            <OrganizerDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/finance"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminFinancePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/ops"
        element={
          <ProtectedRoute requiredRole="admin">
            <OpsManagerPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/scan"
        element={
          <ProtectedRoute>
            <EPscanPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SupabaseAuthProvider>
        <AppRoutes />
      </SupabaseAuthProvider>
    </BrowserRouter>
  );
}
