import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MockAuthProvider, useAuth } from './context/MockAuthContext';
import { ThemeProvider } from './context/ThemeContext';
import HomePageNew from './pages/HomePageNew';
import EventDetailPage from './pages/EventDetailPage';
import SuccessPage from './pages/SuccessPage';
import ErrorPage from './pages/ErrorPage';
import OrganizerDashboardPage from './pages/OrganizerDashboardPage';
import OrganizerSignupPage from './pages/OrganizerSignupPage';
import OrganizerLoginPage from './pages/OrganizerLoginPage';
import AdminFinancePage from './pages/AdminFinancePage';
import AdminFinanceLoginPage from './pages/AdminFinanceLoginPage';
import OpsManagerPage from './pages/OpsManagerPage';
import OpsManagerLoginPage from './pages/OpsManagerLoginPage';
import EPscanPage from './pages/EPscanPage';
import EPscanLoginPage from './pages/EPscanLoginPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF7A00] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
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

      <Route path="/organizer/signup" element={<OrganizerSignupPage />} />
      <Route path="/organizer/login" element={<OrganizerLoginPage />} />
      <Route
        path="/organizer/dashboard"
        element={
          <ProtectedRoute>
            <OrganizerDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route path="/admin/finance/login" element={<AdminFinanceLoginPage />} />
      <Route
        path="/admin/finance"
        element={
          <ProtectedRoute>
            <AdminFinancePage />
          </ProtectedRoute>
        }
      />

      <Route path="/admin/ops/login" element={<OpsManagerLoginPage />} />
      <Route
        path="/admin/ops"
        element={
          <ProtectedRoute>
            <OpsManagerPage />
          </ProtectedRoute>
        }
      />

      <Route path="/scan/login" element={<EPscanLoginPage />} />
      <Route path="/scan" element={<EPscanPage />} />
      <Route path="/scan/activate/:activationToken" element={<EPscanPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <MockAuthProvider>
          <AppRoutes />
        </MockAuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
