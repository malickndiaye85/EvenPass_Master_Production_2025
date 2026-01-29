import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, MapPin, DollarSign, Users, TrendingUp, Power, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/FirebaseAuthContext';
import { ref, get, update, onValue, off } from 'firebase/database';
import { db } from '../../firebase';
import DynamicLogo from '../../components/DynamicLogo';

interface DriverProfile {
  uid: string;
  firstName: string;
  lastName: string;
  phone: string;
  licenseUrl: string;
  insuranceUrl: string;
  status: 'pending_verification' | 'active' | 'suspended';
  isOnline: boolean;
  createdAt: number;
  updatedAt: number;
  stats?: {
    totalRides: number;
    totalEarnings: number;
    rating: number;
  };
}

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [switchLoading, setSwitchLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/organizer/login');
      return;
    }

    const driverRef = ref(db, `drivers/${user.uid}`);

    const unsubscribe = onValue(driverRef, (snapshot) => {
      if (snapshot.exists()) {
        setDriver(snapshot.val() as DriverProfile);
      } else {
        navigate('/voyage/chauffeur/signup');
      }
      setLoading(false);
    });

    return () => {
      off(driverRef);
    };
  }, [user, navigate]);

  const handleToggleOnline = async () => {
    if (!user || !driver) return;

    setSwitchLoading(true);
    try {
      const driverRef = ref(db, `drivers/${user.uid}`);
      await update(driverRef, {
        isOnline: !driver.isOnline,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('Error toggling online status:', error);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setSwitchLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (driver?.isOnline) {
      alert('Veuillez passer en mode Offline avant de vous déconnecter');
      return;
    }
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!driver) {
    return null;
  }

  if (driver.status === 'pending_verification') {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <nav className="bg-[#0A1628] shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <DynamicLogo size="md" mode="transport" />
              <button
                onClick={() => navigate('/voyage')}
                className="flex items-center gap-2 text-white hover:text-[#10B981] transition group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:translate-x-[-4px] transition-transform" />
                <span className="font-medium">Retour</span>
              </button>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-16 max-w-md">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>

            <h1 className="text-2xl font-bold text-[#0A1628] mb-3">
              Validation en cours
            </h1>
            <p className="text-gray-600 mb-8">
              Votre profil est en cours de validation par DEM⇄DEM. Nous vous contacterons par WhatsApp sous 24-48h.
            </p>

            <div className="bg-gradient-to-r from-[#0A1628] to-[#10B981] rounded-xl p-6 text-white mb-6">
              <p className="text-sm font-medium mb-2">Informations de contact</p>
              <p className="text-lg font-bold">{driver.phone}</p>
            </div>

            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-[#10B981] rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Dossier soumis</p>
                  <p className="text-xs text-gray-500">
                    {new Date(driver.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Vérification KYC</p>
                  <p className="text-xs text-gray-500">En cours...</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Activation</p>
                  <p className="text-xs text-gray-500">En attente</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Des questions ? Contactez-nous sur WhatsApp au +221 77 123 45 67
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (driver.status === 'suspended') {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <nav className="bg-[#0A1628] shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <DynamicLogo size="md" mode="transport" />
              <button
                onClick={() => navigate('/voyage')}
                className="flex items-center gap-2 text-white hover:text-[#10B981] transition group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:translate-x-[-4px] transition-transform" />
                <span className="font-medium">Retour</span>
              </button>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-16 max-w-md">
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>

            <h1 className="text-2xl font-bold text-[#0A1628] mb-3">
              Compte suspendu
            </h1>
            <p className="text-gray-600 mb-8">
              Votre compte a été temporairement suspendu. Veuillez contacter le support pour plus d'informations.
            </p>

            <button
              onClick={() => navigate('/voyage')}
              className="w-full py-3 bg-[#0A1628] text-white rounded-lg font-semibold hover:bg-[#0A1628]/90 transition"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="bg-[#0A1628] shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <DynamicLogo size="md" mode="transport" />
            <button
              onClick={handleSignOut}
              className="text-white hover:text-[#10B981] transition text-sm font-medium"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 max-w-md">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-[#0A1628] mb-1">
            Bonjour {driver.firstName}
          </h1>
          <p className="text-gray-600">Bienvenue sur votre dashboard</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Statut</p>
              <p className={`text-lg font-bold ${driver.isOnline ? 'text-[#10B981]' : 'text-gray-400'}`}>
                {driver.isOnline ? 'En ligne' : 'Hors ligne'}
              </p>
            </div>
            <button
              onClick={handleToggleOnline}
              disabled={switchLoading}
              className={`relative inline-flex items-center h-12 w-24 rounded-full transition-colors duration-300 ${
                driver.isOnline ? 'bg-[#10B981]' : 'bg-gray-300'
              } ${switchLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block w-10 h-10 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                  driver.isOnline ? 'translate-x-12' : 'translate-x-1'
                }`}
              >
                <Power className="w-5 h-5 text-gray-600 m-auto mt-2.5" />
              </span>
            </button>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              {driver.isOnline
                ? 'Vous êtes visible aux passagers'
                : 'Passez en ligne pour recevoir des courses'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#0A1628] mb-1">
              {driver.stats?.totalRides || 0}
            </p>
            <p className="text-xs text-gray-500">Courses total</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#0A1628] mb-1">
              {driver.stats?.totalEarnings?.toLocaleString('fr-FR') || 0}
            </p>
            <p className="text-xs text-gray-500">FCFA gagnés</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#0A1628] to-[#10B981] rounded-2xl p-6 text-white mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm opacity-90 mb-1">Note moyenne</p>
              <p className="text-3xl font-bold">
                {driver.stats?.rating?.toFixed(1) || '5.0'}
              </p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
          <p className="text-sm opacity-90">
            Excellent travail ! Continuez ainsi.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-[#0A1628] mb-4">Prochaines étapes</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#10B981] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Profil vérifié</p>
                <p className="text-xs text-gray-500">Votre compte est actif</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Users className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Première course</p>
                <p className="text-xs text-gray-500">Passez en ligne pour commencer</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-xs text-blue-900 text-center">
            Besoin d'aide ? WhatsApp : <span className="font-bold">+221 77 123 45 67</span>
          </p>
        </div>
      </div>
    </div>
  );
}
