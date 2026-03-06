import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bus, MapPin, Clock, TestTube } from 'lucide-react';
import DynamicLogo from '../../components/DynamicLogo';
import DemDemPurchaseTunnel, { UserIdentity } from '../../components/DemDemPurchaseTunnel';
import FirebaseDiagnostic from '../../components/FirebaseDiagnostic';
import { getActiveTransportLines, BusRouteDisplay } from '../../lib/transportLinesService';
import { generateTestSAMAPass, type TestSAMAPass } from '../../lib/testPassGenerator';
import QRCode from 'react-qr-code';

type SubscriptionDuration = 'weekly' | 'monthly' | 'quarterly';
type SubscriptionTier = 'eco' | 'prestige';

interface PurchaseSelection {
  route: BusRouteDisplay;
  tier: SubscriptionTier;
  duration: SubscriptionDuration;
}

export default function DemDemExpressPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [routes, setRoutes] = useState<BusRouteDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseSelection, setPurchaseSelection] = useState<PurchaseSelection | null>(null);
  const [generatedTestPass, setGeneratedTestPass] = useState<TestSAMAPass | null>(null);
  const [generatingTestPass, setGeneratingTestPass] = useState(false);

  const showDevTools = searchParams.get('dev') === 'true' || import.meta.env.DEV;

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    console.log('[DEBUG-ROUTES] Starting to load routes...');
    setLoading(true);
    try {
      const data = await getActiveTransportLines();
      console.log('[DEBUG-ROUTES] Routes loaded successfully:', data);
      setRoutes(data);
    } catch (error) {
      console.error('[DEBUG-ROUTES] Error loading routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionClick = (route: BusRouteDisplay, tier: SubscriptionTier, duration: SubscriptionDuration) => {
    setPurchaseSelection({ route, tier, duration });
  };

  const handlePurchaseConfirm = async (userData: UserIdentity) => {
    if (!purchaseSelection) return;

    try {
      // Simuler le paiement et créer l'abonnement
      const { route, tier, duration } = purchaseSelection;
      const price = route.pricing[tier][duration];

      // Calculer la date d'expiration
      const daysMap = { weekly: 7, monthly: 30, quarterly: 90 };
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + daysMap[duration]);

      // Créer les données d'abonnement
      const subscriptionData = {
        route,
        tier,
        duration,
        price,
        userData,
        purchased_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        status: 'active'
      };

      // Rediriger vers la page de confirmation avec les données
      navigate('/transport/subscription-success', {
        state: subscriptionData
      });
    } catch (error) {
      console.error('Error confirming purchase:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    }
  };

  const getDurationShort = (duration: SubscriptionDuration): string => {
    const labels = {
      weekly: '/sem',
      monthly: '/mois',
      quarterly: '/trim'
    };
    return labels[duration];
  };

  const handleGenerateTestPass = async () => {
    setGeneratingTestPass(true);
    try {
      const testPass = await generateTestSAMAPass();
      setGeneratedTestPass(testPass);
    } catch (error) {
      console.error('Erreur génération pass test:', error);
      alert('Erreur lors de la génération du pass de test');
    } finally {
      setGeneratingTestPass(false);
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
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
              DEM-DEM Express
            </h1>
            <p className="text-xl text-white/70">
              Abonnements transport urbain
            </p>

            {showDevTools && (
              <div className="mt-6">
                <button
                  onClick={handleGenerateTestPass}
                  disabled={generatingTestPass}
                  className="px-6 py-3 bg-green-500/20 hover:bg-green-500/30 border-2 border-green-500 text-green-300 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  <TestTube className="w-5 h-5" />
                  {generatingTestPass ? 'Génération...' : 'Générer Pass de Test'}
                </button>
              </div>
            )}
          </div>

          {generatedTestPass && (
            <div className="mb-8 bg-green-950/30 border-2 border-green-500/50 rounded-2xl p-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-green-400 mb-4">Pass de Test Généré</h3>

                <div className="bg-white p-6 rounded-xl inline-block mb-4">
                  <QRCode value={generatedTestPass.qr_code} size={200} />
                </div>

                <div className="space-y-2 text-left max-w-md mx-auto bg-black/30 rounded-xl p-4">
                  <div className="flex justify-between">
                    <span className="text-white/70">Nom:</span>
                    <span className="text-white font-bold">{generatedTestPass.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Téléphone:</span>
                    <span className="text-white font-mono">{generatedTestPass.subscriber_phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Type:</span>
                    <span className="text-white font-bold">{generatedTestPass.subscription_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Ligne:</span>
                    <span className="text-white">{generatedTestPass.route_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Valide jusqu'au:</span>
                    <span className="text-green-400 font-bold">{generatedTestPass.end_date}</span>
                  </div>
                  <div className="mt-4 p-3 bg-blue-900/30 rounded-lg border border-blue-500/30">
                    <p className="text-xs text-blue-300 font-mono break-all">
                      QR: {generatedTestPass.qr_code}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setGeneratedTestPass(null)}
                  className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold transition-all"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}

{loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-400"></div>
            </div>
          ) : routes.length === 0 ? (
            <>
              <FirebaseDiagnostic />
              <div className="bg-blue-900/30 rounded-3xl p-12 text-center border border-white/10">
                <Bus className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <p className="text-white/70 text-lg mb-4">
                  Aucune ligne disponible pour le moment
                </p>
                <p className="text-white/50 text-sm mb-4">
                  Les lignes doivent être créées via l'interface Admin Transport
                </p>
                <button
                  onClick={loadRoutes}
                  className="bg-amber-400 hover:bg-amber-500 text-blue-950 px-6 py-3 rounded-xl font-bold transition-all"
                >
                  Recharger les lignes
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              {routes.map((route) => {
                if (!route.pricing?.eco) {
                  return null;
                }

                return (
                  <div
                    key={route.id}
                    className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 rounded-3xl shadow-2xl p-6 border-2 border-white/10"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="bg-amber-400 text-blue-950 rounded-full w-12 h-12 flex items-center justify-center font-bold shadow-lg shadow-amber-400/50 text-lg">
                            {route.routeNumber}
                          </div>
                          <h3 className="text-2xl font-bold text-white">
                            {route.origin} ⇄ {route.destination}
                          </h3>
                        </div>

                        <div className="flex items-center space-x-6 text-white/70 mb-6">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-5 h-5 text-amber-400" />
                            <span>{route.distance} km • {route.duration} minutes</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-5 h-5 text-amber-400" />
                            <span>Premier départ: {route.schedule.firstDeparture}</span>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {route.pricing.eco.weekly > 0 && (
                              <button
                                onClick={() => handleSubscriptionClick(route, 'eco', 'weekly')}
                                className="bg-blue-500/20 hover:bg-blue-500/30 backdrop-blur-sm rounded-2xl px-4 py-3 border-2 border-blue-400/50 hover:border-blue-400 transition-all text-left"
                              >
                                <span className="text-xs text-blue-300 font-semibold block mb-1">ECO</span>
                                <p className="text-xl font-bold text-white">
                                  {route.pricing.eco.weekly.toLocaleString()} FCFA{getDurationShort('weekly')}
                                </p>
                              </button>
                            )}
                            {route.pricing.eco.monthly > 0 && (
                              <button
                                onClick={() => handleSubscriptionClick(route, 'eco', 'monthly')}
                                className="bg-blue-500/20 hover:bg-blue-500/30 backdrop-blur-sm rounded-2xl px-4 py-3 border-2 border-blue-400/50 hover:border-blue-400 transition-all text-left"
                              >
                                <span className="text-xs text-blue-300 font-semibold block mb-1">ECO</span>
                                <p className="text-xl font-bold text-white">
                                  {route.pricing.eco.monthly.toLocaleString()} FCFA{getDurationShort('monthly')}
                                </p>
                              </button>
                            )}
                            {route.pricing.eco.quarterly > 0 && (
                              <button
                                onClick={() => handleSubscriptionClick(route, 'eco', 'quarterly')}
                                className="bg-blue-500/20 hover:bg-blue-500/30 backdrop-blur-sm rounded-2xl px-4 py-3 border-2 border-blue-400/50 hover:border-blue-400 transition-all text-left"
                              >
                                <span className="text-xs text-blue-300 font-semibold block mb-1">ECO</span>
                                <p className="text-xl font-bold text-white">
                                  {route.pricing.eco.quarterly.toLocaleString()} FCFA{getDurationShort('quarterly')}
                                </p>
                              </button>
                            )}
                          </div>

                          {route.pricing.prestige && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {route.pricing.prestige.weekly > 0 && (
                                <button
                                  onClick={() => handleSubscriptionClick(route, 'prestige', 'weekly')}
                                  className="bg-amber-500/20 hover:bg-amber-500/30 backdrop-blur-sm rounded-2xl px-4 py-3 border-2 border-amber-400/50 hover:border-amber-400 transition-all text-left"
                                >
                                  <span className="text-xs text-amber-300 font-semibold flex items-center gap-1 mb-1">
                                    <span>★</span> PRESTIGE
                                  </span>
                                  <p className="text-xl font-bold text-white">
                                    {route.pricing.prestige.weekly.toLocaleString()} FCFA{getDurationShort('weekly')}
                                  </p>
                                </button>
                              )}
                              {route.pricing.prestige.monthly > 0 && (
                                <button
                                  onClick={() => handleSubscriptionClick(route, 'prestige', 'monthly')}
                                  className="bg-amber-500/20 hover:bg-amber-500/30 backdrop-blur-sm rounded-2xl px-4 py-3 border-2 border-amber-400/50 hover:border-amber-400 transition-all text-left"
                                >
                                  <span className="text-xs text-amber-300 font-semibold flex items-center gap-1 mb-1">
                                    <span>★</span> PRESTIGE
                                  </span>
                                  <p className="text-xl font-bold text-white">
                                    {route.pricing.prestige.monthly.toLocaleString()} FCFA{getDurationShort('monthly')}
                                  </p>
                                </button>
                              )}
                              {route.pricing.prestige.quarterly > 0 && (
                                <button
                                  onClick={() => handleSubscriptionClick(route, 'prestige', 'quarterly')}
                                  className="bg-amber-500/20 hover:bg-amber-500/30 backdrop-blur-sm rounded-2xl px-4 py-3 border-2 border-amber-400/50 hover:border-amber-400 transition-all text-left"
                                >
                                  <span className="text-xs text-amber-300 font-semibold flex items-center gap-1 mb-1">
                                    <span>★</span> PRESTIGE
                                  </span>
                                  <p className="text-xl font-bold text-white">
                                    {route.pricing.prestige.quarterly.toLocaleString()} FCFA{getDurationShort('quarterly')}
                                  </p>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <Bus className="w-16 h-16 text-amber-400 ml-4 flex-shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {purchaseSelection && (
        <DemDemPurchaseTunnel
          route={purchaseSelection.route}
          tier={purchaseSelection.tier}
          duration={purchaseSelection.duration}
          onClose={() => setPurchaseSelection(null)}
          onConfirm={handlePurchaseConfirm}
        />
      )}
    </div>
  );
}
