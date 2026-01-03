import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FirebaseAuthProvider, useAuth } from './context/FirebaseAuthContext';
import { ThemeProvider } from './context/ThemeContext';
import HomePageNew from './pages/HomePageNew';
import EventDetailPage from './pages/EventDetailPage';
import SuccessPage from './pages/SuccessPage';
import ErrorPage from './pages/ErrorPage';
import HowItWorksPage from './pages/HowItWorksPage';
import ForOrganizersPage from './pages/ForOrganizersPage';
import OrganizerDashboardPage from './pages/OrganizerDashboardPage';
import OrganizerSignupPage from './pages/OrganizerSignupPage';
import OrganizerLoginPage from './pages/OrganizerLoginPage';
import PendingVerificationPage from './pages/PendingVerificationPage';
import AdminFinancePage from './pages/AdminFinancePage';
import AdminFinanceLoginPage from './pages/AdminFinanceLoginPage';
import OpsManagerPage from './pages/OpsManagerPage';
import OpsManagerLoginPage from './pages/OpsManagerLoginPage';
import EPscanLoginPage from './pages/EPscanLoginPage';
import PassLandingPage from './pages/pass/PassLandingPage';
import PassServicesPage from './pages/pass/PassServicesPage';
import LMDGBookingPage from './pages/pass/LMDGBookingPage';
import COSAMABookingPage from './pages/pass/COSAMABookingPage';
import InterregionalBookingPage from './pages/pass/InterregionalBookingPage';

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
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/for-organizers" element={<ForOrganizersPage />} />

      <Route path="/organizer/signup" element={<OrganizerSignupPage />} />
      <Route path="/organizer/login" element={<OrganizerLoginPage />} />
      <Route path="/organizer/pending" element={<PendingVerificationPage />} />
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

      <Route path="/pass" element={<PassLandingPage />} />
      <Route path="/pass/services" element={<PassServicesPage />} />
      <Route path="/pass/lmdg" element={<LMDGBookingPage />} />
      <Route path="/pass/cosama" element={<COSAMABookingPage />} />
      <Route path="/pass/interregional" element={<InterregionalBookingPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <FirebaseAuthProvider>
          <AppRoutes />
        </FirebaseAuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
