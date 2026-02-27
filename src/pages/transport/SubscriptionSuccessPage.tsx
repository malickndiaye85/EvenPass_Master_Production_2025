import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Download, Bus, Calendar, CreditCard, User, Phone, QrCode, Home, ArrowLeft, Wallet } from 'lucide-react';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
import DynamicLogo from '../../components/DynamicLogo';
import { BusRouteDisplay } from '../../lib/transportLinesService';
import { UserIdentity } from '../../components/DemDemPurchaseTunnel';

interface SubscriptionData {
  route: BusRouteDisplay;
  tier: 'eco' | 'prestige';
  duration: 'weekly' | 'monthly' | 'quarterly';
  price: number;
  userData: UserIdentity;
  purchased_at: string;
  expires_at: string;
  status: string;
}

export default function SubscriptionSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAnimation, setShowAnimation] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const data = location.state as SubscriptionData;
    if (!data) {
      navigate('/voyage/express');
      return;
    }
    setSubscription(data);

    // Sauvegarder dans localStorage pour le Wallet
    saveToWallet(data);

    setTimeout(() => setShowAnimation(true), 100);
  }, [location, navigate]);

  const saveToWallet = (data: SubscriptionData) => {
    const passData = {
      id: `pass_${Date.now()}`,
      type: 'demdem_subscription',
      ...data,
      createdAt: new Date().toISOString()
    };

    // Récupérer les passes existants
    const existingPasses = JSON.parse(localStorage.getItem('demdem_passes') || '[]');

    // Ajouter le nouveau pass
    existingPasses.push(passData);

    // Sauvegarder
    localStorage.setItem('demdem_passes', JSON.stringify(existingPasses));

    console.log('[WALLET] Pass sauvegardé:', passData);
  };

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#1a2942] to-[#0A1628] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  const { route, tier, duration, price, userData, purchased_at, expires_at } = subscription;

  const durationLabels = {
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
    quarterly: 'Trimestriel'
  };

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const qrData = JSON.stringify({
    type: 'demdem_subscription',
    route: `${route.origin} ⇄ ${route.destination}`,
    tier,
    duration,
    user: `${userData.firstName} ${userData.lastName}`,
    phone: userData.phone,
    purchased_at,
    expires_at
  });

  const handleSaveToPhone = async () => {
    if (!cardRef.current) return;

    setIsSaving(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
        useCORS: true
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `SAMA_Pass_DemDem_${userData.firstName}_${userData.lastName}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          alert('✅ SAMA Pass enregistré!\n\nVotre carte a été téléchargée dans votre galerie.');
        }
      }, 'image/png');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#1a2942] to-[#0A1628]">
      <nav className="bg-blue-950/95 backdrop-blur-xl shadow-lg sticky top-0 z-50 border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <DynamicLogo />
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div
            className={`bg-gradient-to-br from-green-600 via-emerald-600 to-green-600 rounded-3xl p-12 text-center mb-8 relative overflow-hidden transition-all duration-500 ${
              showAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
            style={{
              boxShadow: '0 0 60px rgba(16, 185, 129, 0.4)'
            }}
          >
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            <div
              className={`relative inline-block p-6 bg-white rounded-full mb-6 transition-all duration-700 ${
                showAnimation ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
              } shadow-xl`}
            >
              <CheckCircle className="w-20 h-20 text-green-600" strokeWidth={2.5} />
            </div>
            <h1 className="relative text-5xl font-black text-white mb-3">
              Abonnement Activé !
            </h1>
            <p className="relative text-xl text-white/95 font-medium">
              Félicitations! Votre SAMA Pass DEM-DEM Express est prêt
            </p>
          </div>

          {/* SAMA Pass Card - Format Portrait */}
          <div
            ref={cardRef}
            className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 rounded-3xl max-w-lg w-full mx-auto border-2 border-amber-400/30 shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-blue-950">SAMA PASS</h2>
                <Bus className="w-8 h-8 text-blue-950" />
              </div>
            </div>

            <div className="p-8">
              {/* User Info */}
              <div className="flex items-center gap-4 mb-8">
                <img
                  src={userData.photoUrl}
                  alt="Photo"
                  className="w-20 h-20 rounded-full object-cover border-4 border-amber-400"
                />
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {userData.firstName} {userData.lastName}
                  </h3>
                  <p className="text-white/70 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {userData.phone}
                  </p>
                </div>
              </div>

              {/* Subscription Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-blue-900/30 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <Bus className="w-5 h-5 text-amber-400" />
                    <span className="text-sm text-white/70">Ligne</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {route.origin} ⇄ {route.destination}
                  </p>
                </div>

                <div className="bg-blue-900/30 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="w-5 h-5 text-amber-400" />
                    <span className="text-sm text-white/70">Formule</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {tier === 'eco' ? 'ECO' : 'PRESTIGE ★'}
                  </p>
                </div>

                <div className="bg-blue-900/30 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-5 h-5 text-amber-400" />
                    <span className="text-sm text-white/70">Durée</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {durationLabels[duration]}
                  </p>
                </div>

                <div className="bg-blue-900/30 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="w-5 h-5 text-amber-400" />
                    <span className="text-sm text-white/70">Valable jusqu'au</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {formatDate(expires_at)}
                  </p>
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-white rounded-2xl p-8 text-center mb-6">
                <div className="flex justify-center mb-4">
                  <QRCode value={qrData} size={200} />
                </div>
                <p className="text-gray-600 font-semibold flex items-center justify-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Présentez ce QR Code à l'embarquement
                </p>
              </div>

              {/* Price */}
              <div className="text-center bg-gradient-to-r from-amber-400/20 to-amber-500/20 rounded-2xl p-6 border border-amber-400/30">
                <p className="text-white/70 text-sm mb-2">Montant payé</p>
                <p className="text-4xl font-black text-amber-400">
                  {price.toLocaleString()} FCFA
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-900/30 rounded-3xl p-8 border border-white/10 mb-8">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-400" />
              Comment utiliser votre SAMA Pass
            </h3>
            <ul className="space-y-4 text-white/80">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center text-blue-950 font-bold">
                  1
                </span>
                <p>
                  <span className="font-semibold text-white">Sauvegardez cette page</span> ou
                  prenez une capture d'écran de votre QR Code
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center text-blue-950 font-bold">
                  2
                </span>
                <p>
                  <span className="font-semibold text-white">Présentez votre QR Code</span> au
                  conducteur à chaque trajet
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center text-blue-950 font-bold">
                  3
                </span>
                <p>
                  <span className="font-semibold text-white">Voyagez illimité</span> sur votre
                  ligne jusqu'à la date d'expiration
                </p>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 mb-8 max-w-md mx-auto">
            <button
              onClick={handleSaveToPhone}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-blue-950 py-5 rounded-2xl font-bold text-lg hover:from-amber-500 hover:to-amber-600 transition-all shadow-lg shadow-amber-400/50 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="w-6 h-6 border-3 border-blue-950 border-t-transparent rounded-full animate-spin"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Download className="w-6 h-6" />
                  Enregistrer l'image
                </>
              )}
            </button>

            <button
              onClick={() => navigate('/voyage/wallet')}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-5 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg flex items-center justify-center gap-3"
            >
              <Wallet className="w-6 h-6" />
              Voir dans mon Wallet
            </button>

            <button
              onClick={() => navigate('/voyage/express')}
              className="w-full bg-white/10 text-white py-4 rounded-2xl font-semibold hover:bg-white/20 transition-all border border-white/20 flex items-center justify-center gap-3"
            >
              <Bus className="w-6 h-6" />
              Retour aux lignes
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full bg-blue-900/30 text-white py-3 rounded-2xl font-semibold hover:bg-blue-900/50 transition-all border border-white/10 flex items-center justify-center gap-3"
            >
              <Home className="w-6 h-6" />
              Accueil
            </button>
          </div>

          {/* Footer Message */}
          <div className="text-center">
            <p className="text-2xl font-black text-green-400 mb-2">
              🎉 Bon voyage avec DEM-DEM Express!
            </p>
            <p className="text-white/70 text-lg">
              Merci d'avoir choisi nos services de transport
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
