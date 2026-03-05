import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, AlertCircle, Loader, Delete } from 'lucide-react';
import { passPhoneService, PassSubscription } from '../lib/passPhoneService';
import { AbonnementCard } from '../components/AbonnementCard';
import DemDemPassCard from '../components/DemDemPassCard';

const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [subscription, setSubscription] = useState<PassSubscription | null>(null);
  const [demdemPasses, setDemdemPasses] = useState<any[]>([]);
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
      // Vérifier d'abord les passes DEM-DEM dans localStorage
      const allPasses = JSON.parse(localStorage.getItem('demdem_passes') || '[]');
      const formattedPhone = `+221${phone}`;

      const userPasses = allPasses.filter((pass: any) =>
        pass.userData && pass.userData.phone === formattedPhone
      );

      if (userPasses.length > 0) {
        console.log('[WALLET] ✅ Passes DEM-DEM trouvés:', userPasses.length);
        setDemdemPasses(userPasses);
        localStorage.setItem('demdem_last_phone', phone);
        setShowCard(true);
        setLoading(false);
        return;
      }

      // Sinon chercher dans les abonnements SAMA Pass
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
    setDemdemPasses([]);
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
      className="relative aspect-square flex items-center justify-center bg-gradient-to-br from-[#1E2936] to-[#1A2332] border-2 border-gray-700/50 rounded-2xl text-white text-3xl font-black shadow-lg active:scale-95 active:shadow-xl transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed active:from-[#FFC700] active:to-[#FF8800] active:text-[#0F1419] active:border-[#FFC700]"
      style={{
        minHeight: '70px',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      <span className="select-none">{value}</span>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
    </button>
  );

  if (showCard && (subscription || demdemPasses.length > 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#1a2942] to-[#0A1628] overflow-y-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex-shrink-0 mb-6">
            <button
              onClick={() => navigate('/voyage')}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium text-sm">Retour</span>
            </button>
          </div>

          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-black text-white mb-2">Mon Wallet</h1>
              <p className="text-white/70">Vos passes DEM-DEM</p>
            </div>

            {demdemPasses.length > 0 ? (
              <>
                {demdemPasses.map((pass, index) => (
                  <div key={pass.id || index} className="animate-fadeIn">
                    <DemDemPassCard pass={pass} />
                  </div>
                ))}

                <div className="bg-blue-900/30 rounded-xl p-4 border border-white/10">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-white/80 text-sm">
                      <p className="font-bold text-white mb-1">Accès hors ligne activé</p>
                      <p className="text-white/60 text-xs">
                        Numéro: +221 {formatPhoneDisplay(phoneNumber)}
                      </p>
                      <p className="text-white/60 text-xs mt-1">
                        {demdemPasses.length} pass{demdemPasses.length > 1 ? 'es' : ''} trouvé{demdemPasses.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : subscription ? (
              <>
                <div className="animate-fadeIn">
                  <AbonnementCard subscription={subscription} />
                </div>

                <div className="bg-blue-900/30 rounded-xl p-4 border border-white/10">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-white/80 text-sm">
                      <p className="font-bold text-white mb-1">Accès hors ligne activé</p>
                      <p className="text-white/60 text-xs">
                        Numéro: +221 {formatPhoneDisplay(phoneNumber)}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            <button
              onClick={handleDisconnect}
              className="w-full py-4 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-all border border-white/20"
            >
              Déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-[#0A1628] via-[#0F1419] to-[#1a2942] overflow-hidden">
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 px-5 pt-5 pb-3">
          <button
            onClick={() => navigate('/voyage')}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors active:scale-95 p-2 -ml-2 rounded-xl"
            style={{
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="font-bold text-base">Retour</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col px-5 pb-5 overflow-hidden">
          <div className="flex-shrink-0 text-center mb-5">
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-[#FFC700] to-[#FF8800] rounded-2xl flex items-center justify-center shadow-2xl">
                <Zap className="w-8 h-8 text-[#0F1419]" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">MON PASS</h1>
            </div>
            <p className="text-gray-400 text-sm font-semibold">
              Carte d'abonnement DEM-DEM Express
            </p>
          </div>

          <div className="flex-shrink-0 bg-gradient-to-br from-[#1E2936] to-[#1A2332] rounded-3xl p-5 border-2 border-gray-700/50 mb-4 shadow-2xl">
            <h2 className="text-xl font-black text-white text-center mb-1 tracking-tight">
              Gënaa Gaaw
            </h2>
            <p className="text-gray-400 text-center text-sm mb-4 font-medium">
              Entrez votre numéro de téléphone
            </p>

            <div className="relative mb-4">
              <div className="bg-[#0F1419] border-2 border-[#FFC700]/30 rounded-2xl p-5 text-center min-h-[80px] flex items-center justify-center shadow-inner">
                {loading ? (
                  <Loader className="w-8 h-8 text-[#FFC700] animate-spin" />
                ) : (
                  <div className="flex items-baseline justify-center gap-3">
                    <span className="text-gray-500 font-bold text-xl">+221</span>
                    <span className="text-white text-3xl font-black tracking-widest" style={{ fontFamily: 'monospace' }}>
                      {formatPhoneDisplay(phoneNumber) || '_ _ _  _ _ _  _ _  _ _'}
                    </span>
                  </div>
                )}
              </div>
              {phoneNumber.length > 0 && !loading && (
                <div className="absolute -top-3 right-3">
                  <div className="bg-gradient-to-br from-[#FFC700] to-[#FF8800] text-[#0F1419] px-3 py-1 rounded-full shadow-lg">
                    <span className="text-xs font-black">
                      {phoneNumber.length}/9
                    </span>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/20 border-2 border-red-500/40 rounded-2xl p-3 mb-4 animate-shake">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300 leading-snug font-medium">
                    {error}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 py-2 bg-[#FFC700]/10 rounded-full border border-[#FFC700]/30">
              <Zap className="w-4 h-4 text-[#FFC700]" />
              <p className="text-xs text-[#FFC700] font-bold">
                Auto-recherche à 9 chiffres
              </p>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col pb-2">
            <div className="grid grid-cols-3 gap-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <KeypadButton
                  key={digit}
                  value={digit}
                  onClick={() => handleNumberInput(digit)}
                  disabled={loading || phoneNumber.length >= 9}
                />
              ))}
              <div className="aspect-square"></div>
              <KeypadButton
                value="0"
                onClick={() => handleNumberInput('0')}
                disabled={loading || phoneNumber.length >= 9}
              />
              <button
                onClick={handleDelete}
                disabled={loading || phoneNumber.length === 0}
                className="relative aspect-square flex items-center justify-center bg-gradient-to-br from-red-600/90 to-red-700/90 border-2 border-red-500/50 rounded-2xl text-white shadow-lg active:scale-95 active:shadow-xl transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed disabled:from-gray-700 disabled:to-gray-800 disabled:border-gray-600"
                style={{
                  minHeight: '70px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <Delete className="w-7 h-7" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
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

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }

        /* Améliorer le feedback tactile */
        button:active {
          transform: scale(0.95);
        }

        /* Empêcher la sélection de texte lors du tap */
        button {
          -webkit-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
        }
      `}</style>
    </div>
  );
};

export default WalletPage;
