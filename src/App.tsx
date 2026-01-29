import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { FirebaseAuthProvider, useAuth } from './context/FirebaseAuthContext';

import { ThemeProvider } from './context/ThemeContext';

import { DemDemThemeProvider } from './contexts/DemDemThemeContext';

import ThemeWrapper from './components/ThemeWrapper';

import DemDemLandingPage from './pages/DemDemLandingPage';

import { RootLandingPage } from './pages/RootLandingPage';

import { VoyageLandingPage } from './pages/VoyageLandingPage';

import { EventLandingPageNew } from './pages/EventLandingPageNew';

import HomePageNew from './pages/HomePageNew';

import EventDetailPage from './pages/EventDetailPage';

import SuccessPage from './pages/SuccessPage';

import ErrorPage from './pages/ErrorPage';

import HowItWorksPage from './pages/HowItWorksPage';

import ForOrganizersPage from './pages/ForOrganizersPage';

import HelpPage from './pages/HelpPage';

import TermsPage from './pages/TermsPage';

import OrganizerDashboardPage from './pages/OrganizerDashboardPage';

import OrganizerSignupPage from './pages/OrganizerSignupPage';

import OrganizerLoginPage from './pages/OrganizerLoginPage';

import PendingVerificationPage from './pages/PendingVerificationPage';

import AdminFinancePage from './pages/AdminFinancePage';

import AdminFinanceLoginPage from './pages/AdminFinanceLoginPage';

import OpsManagerPage from './pages/OpsManagerPageNew';

import OpsManagerLoginPage from './pages/OpsManagerLoginPage';

import EPscanLoginPage from './pages/EPscanLoginPage';

import PassLandingPage from './pages/pass/PassLandingPage';

import PassServicesPage from './pages/pass/PassServicesPage';

import LMDGBookingPage from './pages/pass/LMDGBookingPage';

import COSAMABookingPage from './pages/pass/COSAMABookingPage';

import InterregionalBookingPage from './pages/pass/InterregionalBookingPage';

import PaymentSuccessPage from './pages/pass/PaymentSuccessPage';

import PaymentErrorPage from './pages/pass/PaymentErrorPage';

import SubscriptionPage from './pages/SubscriptionPage';

import WalletPage from './pages/WalletPage';

import AdminTransversalDashboard from './pages/AdminTransversalDashboard';

import SecurityManifestPage from './pages/SecurityManifestPage';

import CommandantDashboard from './pages/CommandantDashboard';

import BoardingDashboard from './pages/BoardingDashboard';

import CommercialDashboard from './pages/CommercialDashboard';

import BoardingLoginPage from './pages/pass/BoardingLoginPage';

import CommandantLoginPage from './pages/pass/CommandantLoginPage';

import CommercialLoginPage from './pages/pass/CommercialLoginPage';

import OpsMaritimeManagementPage from './pages/OpsMaritimeManagementPage';

import DemDemExpressPage from './pages/transport/DemDemExpressPage';

import AlloDakarPage from './pages/transport/AlloDakarPage';

import TransportHubPage from './pages/transport/TransportHubPage';

import AdminTransportSetupPage from './pages/AdminTransportSetupPage';

import DriverSignupPage from './pages/transport/DriverSignupPage';

import { DriverLoginPage } from './pages/transport/DriverLoginPage';

import DriverDashboard from './pages/transport/DriverDashboard';



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

      <Route path="/" element={<RootLandingPage />} />

      <Route path="/old-landing" element={<DemDemLandingPage />} />



      <Route path="/evenement" element={

        <ThemeWrapper mode="event">

          <HomePageNew />

        </ThemeWrapper>

      } />

      <Route path="/even/:slug" element={

        <ThemeWrapper mode="event">

          <EventDetailPage />

        </ThemeWrapper>

      } />

      <Route path="/event/:slug" element={

        <ThemeWrapper mode="event">

          <EventDetailPage />

        </ThemeWrapper>

      } />



      <Route path="/voyage" element={<VoyageLandingPage />} />

      <Route path="/voyage/hub" element={

        <ThemeWrapper mode="transport">

          <TransportHubPage />

        </ThemeWrapper>

      } />



      <Route path="/voyage/express" element={

        <ThemeWrapper mode="transport">

          <DemDemExpressPage />

        </ThemeWrapper>

      } />

      <Route path="/transport/demdem-express" element={

        <ThemeWrapper mode="transport">

          <DemDemExpressPage />

        </ThemeWrapper>

      } />



      <Route path="/voyage/allo-dakar" element={

        <ThemeWrapper mode="transport">

          <AlloDakarPage />

        </ThemeWrapper>

      } />

      <Route path="/transport/allo-dakar" element={

        <ThemeWrapper mode="transport">

          <AlloDakarPage />

        </ThemeWrapper>

      } />



      <Route path="/voyage/ferry" element={

        <ThemeWrapper mode="transport">

          <COSAMABookingPage />

        </ThemeWrapper>

      } />



      <Route path="/voyage/wallet" element={

        <ThemeWrapper mode="transport">

          <WalletPage />

        </ThemeWrapper>

      } />



      <Route path="/voyage/chauffeur/signup" element={

        <ThemeWrapper mode="transport">

          <DriverSignupPage />

        </ThemeWrapper>

      } />

      <Route path="/voyage/chauffeur/login" element={

        <ThemeWrapper mode="transport">

          <DriverLoginPage />

        </ThemeWrapper>

      } />



      <Route path="/voyage/chauffeur/dashboard" element={

        <ThemeWrapper mode="transport">

          <ProtectedRoute>

            <DriverDashboard />

          </ProtectedRoute>

        </ThemeWrapper>

      } />



      <Route path="/voyage/conducteur/dashboard" element={

        <ThemeWrapper mode="transport">

          <ProtectedRoute>

            <DriverDashboard />

          </ProtectedRoute>

        </ThemeWrapper>

      } />



      <Route path="/success" element={<SuccessPage />} />

      <Route path="/error" element={<ErrorPage />} />

      <Route path="/how-it-works" element={<HowItWorksPage />} />

      <Route path="/comment-ca-marche" element={<HowItWorksPage />} />

      <Route path="/for-organizers" element={<ForOrganizersPage />} />

      <Route path="/organisateur" element={<ForOrganizersPage />} />

      <Route path="/become-organizer" element={<ForOrganizersPage />} />

      <Route path="/help" element={<HelpPage />} />

      <Route path="/terms" element={<TermsPage />} />



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

      <Route

        path="/admin/ops/maritime"

        element={

          <ProtectedRoute>

            <OpsMaritimeManagementPage />

          </ProtectedRoute>

        }

      />



      <Route path="/admin/transport/setup" element={<AdminTransportSetupPage />} />



      <Route path="/scan/login" element={<EPscanLoginPage />} />



      <Route path="/pass/services" element={

        <ThemeWrapper mode="transport">

          <PassServicesPage />

        </ThemeWrapper>

      } />

      <Route path="/pass/lmdg" element={

        <ThemeWrapper mode="transport">

          <LMDGBookingPage />

        </ThemeWrapper>

      } />

      <Route path="/pass/cosama" element={

        <ThemeWrapper mode="transport">

          <COSAMABookingPage />

        </ThemeWrapper>

      } />

      <Route path="/pass/interregional" element={

        <ThemeWrapper mode="transport">

          <InterregionalBookingPage />

        </ThemeWrapper>

      } />

      <Route path="/pass/subscriptions" element={

        <ThemeWrapper mode="transport">

          <SubscriptionPage />

        </ThemeWrapper>

      } />

      <Route path="/pass/wallet" element={

        <ThemeWrapper mode="transport">

          <WalletPage />

        </ThemeWrapper>

      } />

      <Route path="/payment/success" element={

        <ThemeWrapper mode="transport">

          <PaymentSuccessPage />

        </ThemeWrapper>

      } />

      <Route path="/payment/error" element={

        <ThemeWrapper mode="transport">

          <PaymentErrorPage />

        </ThemeWrapper>

      } />



      <Route path="/admin/transversal" element={<AdminTransversalDashboard />} />

      <Route path="/admin/manifest" element={<SecurityManifestPage />} />



      <Route path="/pass/boarding/login" element={<BoardingLoginPage />} />

      <Route path="/pass/commandant/login" element={<CommandantLoginPage />} />

      <Route path="/pass/commercial/login" element={<CommercialLoginPage />} />



      <Route path="/pass/commandant" element={

        <ThemeWrapper mode="transport">

          <ProtectedRoute>

            <CommandantDashboard />

          </ProtectedRoute>

        </ThemeWrapper>

      } />

      <Route path="/pass/boarding" element={

        <ThemeWrapper mode="transport">

          <ProtectedRoute>

            <BoardingDashboard />

          </ProtectedRoute>

        </ThemeWrapper>

      } />

      <Route path="/pass/commercial" element={

        <ThemeWrapper mode="transport">

          <ProtectedRoute>

            <CommercialDashboard />

          </ProtectedRoute>

        </ThemeWrapper>

      } />



      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>

  );

}



export default function App() {

  return (

    <BrowserRouter>

      <DemDemThemeProvider>

        <ThemeProvider>

          <FirebaseAuthProvider>

            <AppRoutes />

          </FirebaseAuthProvider>

        </ThemeProvider>

      </DemDemThemeProvider>

    </BrowserRouter>

  );

}
