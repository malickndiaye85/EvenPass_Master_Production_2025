import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Phone, Search, Zap, AlertCircle, Loader } from 'lucide-react';
import { passPhoneService, PassSubscription } from '../../lib/passPhoneService';
import { AbonnementCard } from '../../components/AbonnementCard';

export const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [subscription, setSubscription] = useState<PassSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const cachedPhone = localStorage.getItem('demdem_last_phone');
    if (cachedPhone) {
      setPhoneNumber(cachedPhone);
      loadCachedSubscription(cachedPhone);
    }
  }, []);

  const loadCachedSubscription = (phone: string) => {
    const cached = passPhoneService.loadFromCache(phone);
    if (cached) {
      console.log('[WALLET] 💾 Abonnement chargé depuis le cache');
      setSubscription(cached);
      setHasSearched(true);
    }
  };

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length <= 9) {
      setPhoneNumber(cleaned);
      setError('');
      setHasSearched(false);

      if (cleaned.length === 9) {
        handleAutoSubmit(cleaned);
      }
    }
  };

  const handleAutoSubmit = async (phone: string) => {
    console.log('[WALLET] 🔄 Auto-submit déclench�� pour:', phone);
    setLoading(true);
    setError('');
    setSubscription(null);

    try {
      const cached = passPhoneService.loadFromCache(phone);
      if (cached) {
        console.log('[WALLET] 💾 Abonnement trouvé en cache');
        setSubscription(cached);
        localStorage.setItem('demdem_last_phone', phone);
        setHasSearched(true);
        setLoading(false);
        return;
      }

      const sub = await passPhoneService.findSubscriptionByPhone(phone);

      if (sub) {
        console.log('[WALLET] ✅ Abonnement trouvé');
        setSubscription(sub);
        passPhoneService.saveToCache(phone, sub);
        localStorage.setItem('demdem_last_phone', phone);
        setHasSearched(true);
      } else {
        console.log('[WALLET] ❌ Aucun abonnement trouvé');
        setError('Numéro non reconnu. Veuillez utiliser le numéro utilisé lors de l\'achat.');
        setHasSearched(true);
      }
    } catch (err) {
      console.error('[WALLET] ❌ Erreur:', err);
      setError('Erreur de connexion. Veuillez réessayer.');
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = () => {
    if (phoneNumber.length === 9) {
      handleAutoSubmit(phoneNumber);
    } else {
      setError('Veuillez entrer un numéro à 9 chiffres');
    }
  };

  const formatPhoneDisplay = (value: string) => {
    if (value.length <= 2) return value;
    if (value.length <= 5) return `${value.slice(0, 2)} ${value.slice(2)}`;
    if (value.length <= 7) return `${value.slice(0, 2)} ${value.slice(2, 5)} ${value.slice(5)}`;
    return `${value.slice(0, 2)} ${value.slice(2, 5)} ${value.slice(5, 7)} ${value.slice(7)}`;
  };

  return (
    <div className="min-h-screen bg-[#0F1419]">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <button
          onClick={() => navigate('/voyage')}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Retour</span>
        </button>

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#FFC700] to-[#FF8800] rounded-2xl flex items-center justify-center shadow-xl">
              <Zap className="w-8 h-8 text-[#0F1419]" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">MON PASS</h1>
          </div>
          <p className="text-gray-400 font-medium">
            Carte d'abonnement DEM-DEM Express
          </p>
        </div>

        {!subscription && !hasSearched && (
          <div className="bg-[#1A2332] rounded-3xl p-8 border border-gray-800 shadow-2xl mb-8">
            <div className="w-16 h-16 bg-[#FFC700]/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Phone className="w-8 h-8 text-[#FFC700]" />
            </div>

            <h2 className="text-2xl font-bold text-white text-center mb-3">
              Gënaa Gaaw
            </h2>
            <p className="text-gray-400 text-center mb-8 leading-relaxed">
              Entrez votre numéro de téléphone pour accéder à votre Pass digital
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">
                  Numéro de téléphone
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-500 font-medium">+221</span>
                  </div>
                  <input
                    type="tel"
                    value={formatPhoneDisplay(phoneNumber)}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="77 123 45 67"
                    className="w-full pl-24 pr-4 py-4 bg-[#0F1419] border border-gray-800 text-white text-lg font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC700] focus:border-transparent transition-all"
                    disabled={loading}
                  />
                  {loading && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader className="w-5 h-5 text-[#FFC700] animate-spin" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Recherche automatique après 9 chiffres
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400 leading-relaxed">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={handleManualSearch}
                disabled={loading || phoneNumber.length !== 9}
                className="w-full py-4 bg-gradient-to-r from-[#FFC700] to-[#FF8800] text-[#0F1419] rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Recherche en cours...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Accéder à mon Pass
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {!subscription && hasSearched && error && (
          <div className="bg-[#1A2332] rounded-3xl p-8 border border-gray-800 shadow-2xl">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>

            <h2 className="text-2xl font-bold text-white text-center mb-3">
              Aucun abonnement trouvé
            </h2>
            <p className="text-gray-400 text-center mb-8 leading-relaxed">
              Le numéro {formatPhoneDisplay(phoneNumber)} n'est associé à aucun abonnement actif.
            </p>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-300 leading-relaxed">
                  <p className="font-semibold mb-1">Pas encore abonné ?</p>
                  <p>Achetez votre Pass DEM-DEM Express pour voyager en illimité !</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setPhoneNumber('');
                setError('');
                setHasSearched(false);
              }}
              className="w-full py-4 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition-all"
            >
              Réessayer
            </button>
          </div>
        )}

        {subscription && (
          <div className="space-y-6">
            <AbonnementCard subscription={subscription} />

            <div className="bg-[#1A2332] rounded-2xl p-6 border border-gray-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-gray-300 text-sm leading-relaxed">
                  <p className="font-bold text-white mb-2">Accès hors ligne activé</p>
                  <p className="mb-3">
                    Votre Pass a été sauvegardé. Vous pouvez y accéder même sans connexion internet.
                  </p>
                  <p className="text-xs text-gray-500">
                    Numéro enregistré : {formatPhoneDisplay(phoneNumber)}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setPhoneNumber('');
                setSubscription(null);
                setError('');
                setHasSearched(false);
                localStorage.removeItem('demdem_last_phone');
              }}
              className="w-full py-3 bg-gray-700/50 text-gray-400 rounded-xl font-medium hover:bg-gray-700 hover:text-white transition-all"
            >
              Déconnecter ce Pass
            </button>
          </div>
        )}

        {loading && !subscription && !hasSearched && (
          <div className="bg-[#1A2332] rounded-3xl p-12 border border-gray-800 shadow-2xl">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-[#FFC700] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-white font-bold">Recherche en cours...</p>
              <p className="text-gray-400 text-sm mt-2">
                Vérification de votre abonnement
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
