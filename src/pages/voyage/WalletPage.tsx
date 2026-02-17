import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, AlertCircle, Loader, Delete } from 'lucide-react';
import { passPhoneService, PassSubscription } from '../../lib/passPhoneService';
import { AbonnementCard } from '../../components/AbonnementCard';

export const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [subscription, setSubscription] = useState<PassSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCard, setShowCard] = useState(false);

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
      setShowCard(true);
    }
  };

  const handleNumberInput = (digit: string) => {
    if (phoneNumber.length < 9) {
      const newPhone = phoneNumber + digit;
      setPhoneNumber(newPhone);
      setError('');

      if (newPhone.length === 9) {
        handleAutoSubmit(newPhone);
      }
    }
  };

  const handleDelete = () => {
    setPhoneNumber(phoneNumber.slice(0, -1));
    setError('');
  };

  const handleAutoSubmit = async (phone: string) => {
    console.log('[WALLET] 🔄 Auto-submit déclenché pour:', phone);
    setLoading(true);
    setError('');

    try {
      const cached = passPhoneService.loadFromCache(phone);
      if (cached) {
        console.log('[WALLET] 💾 Abonnement trouvé en cache');
        setSubscription(cached);
        localStorage.setItem('demdem_last_phone', phone);
        setShowCard(true);
        setLoading(false);
        return;
      }

      const sub = await passPhoneService.findSubscriptionByPhone(phone);

      if (sub) {
        console.log('[WALLET] ✅ Abonnement trouvé');
        setSubscription(sub);
        passPhoneService.saveToCache(phone, sub);
        localStorage.setItem('demdem_last_phone', phone);
        setShowCard(true);
      } else {
        console.log('[WALLET] ❌ Aucun abonnement trouvé');
        setError('Numéro non reconnu. Veuillez utiliser le numéro utilisé lors de l\'achat.');
      }
    } catch (err) {
      console.error('[WALLET] ❌ Erreur:', err);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setPhoneNumber('');
    setSubscription(null);
    setError('');
    setShowCard(false);
    localStorage.removeItem('demdem_last_phone');
  };

  const formatPhoneDisplay = (value: string) => {
    if (value.length <= 2) return value;
    if (value.length <= 5) return `${value.slice(0, 2)} ${value.slice(2)}`;
    if (value.length <= 7) return `${value.slice(0, 2)} ${value.slice(2, 5)} ${value.slice(5)}`;
    return `${value.slice(0, 2)} ${value.slice(2, 5)} ${value.slice(5, 7)} ${value.slice(7)}`;
  };

  const KeypadButton: React.FC<{ value: string; onClick: () => void; disabled?: boolean }> = ({ value, onClick, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="aspect-square flex items-center justify-center bg-[#1A2332] border border-gray-800 rounded-xl text-white text-2xl font-bold hover:bg-[#2A3342] active:bg-[#FFC700] active:text-[#0F1419] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {value}
    </button>
  );

  if (showCard && subscription) {
    return (
      <div className="h-screen bg-[#0F1419] overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="flex-shrink-0 px-4 pt-4 pb-2">
            <button
              onClick={() => navigate('/voyage')}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium text-sm">Retour</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="animate-fadeIn">
              <AbonnementCard subscription={subscription} />

              <div className="mt-4 bg-[#1A2332] rounded-xl p-4 border border-gray-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-gray-300 text-xs leading-relaxed">
                    <p className="font-bold text-white mb-1">Accès hors ligne activé</p>
                    <p className="text-gray-400 text-xs">
                      Numéro: {formatPhoneDisplay(phoneNumber)}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleDisconnect}
                className="w-full mt-4 py-3 bg-gray-700/50 text-gray-400 rounded-xl font-medium text-sm hover:bg-gray-700 hover:text-white transition-all"
              >
                Déconnecter ce Pass
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0F1419] overflow-hidden">
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 px-4 pt-4 pb-2">
          <button
            onClick={() => navigate('/voyage')}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium text-sm">Retour</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col px-4 pb-4 overflow-hidden">
          <div className="flex-shrink-0 text-center mb-4">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FFC700] to-[#FF8800] rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-[#0F1419]" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">MON PASS</h1>
            </div>
            <p className="text-gray-400 text-xs font-medium">
              Carte d'abonnement DEM-DEM Express
            </p>
          </div>

          <div className="flex-shrink-0 bg-[#1A2332] rounded-2xl p-4 border border-gray-800 mb-3">
            <h2 className="text-lg font-bold text-white text-center mb-1">
              Gënaa Gaaw
            </h2>
            <p className="text-gray-400 text-center text-xs mb-3 leading-relaxed">
              Entrez votre numéro de téléphone
            </p>

            <div className="relative mb-3">
              <div className="bg-[#0F1419] border-2 border-gray-800 rounded-xl p-4 text-center min-h-[60px] flex items-center justify-center">
                {loading ? (
                  <Loader className="w-6 h-6 text-[#FFC700] animate-spin" />
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-gray-500 font-medium text-lg">+221</span>
                    <span className="text-white text-2xl font-bold tracking-wider min-w-[140px]">
                      {formatPhoneDisplay(phoneNumber) || '_ _ _  _ _ _  _ _  _ _'}
                    </span>
                  </div>
                )}
              </div>
              {phoneNumber.length > 0 && !loading && (
                <div className="absolute top-2 right-2">
                  <span className="text-xs text-gray-500 bg-[#1A2332] px-2 py-1 rounded">
                    {phoneNumber.length}/9
                  </span>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 mb-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400 leading-tight">
                    {error}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-1 mb-2">
              <Zap className="w-3 h-3 text-[#FFC700]" />
              <p className="text-xs text-gray-500">
                Auto-recherche à 9 chiffres
              </p>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <KeypadButton
                  key={digit}
                  value={digit}
                  onClick={() => handleNumberInput(digit)}
                  disabled={loading || phoneNumber.length >= 9}
                />
              ))}
              <div></div>
              <KeypadButton
                value="0"
                onClick={() => handleNumberInput('0')}
                disabled={loading || phoneNumber.length >= 9}
              />
              <button
                onClick={handleDelete}
                disabled={loading || phoneNumber.length === 0}
                className="aspect-square flex items-center justify-center bg-[#1A2332] border border-gray-800 rounded-xl text-white hover:bg-red-500/20 hover:border-red-500/30 active:bg-red-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Delete className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};
