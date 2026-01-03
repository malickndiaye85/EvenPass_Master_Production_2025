import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, WifiOff, Check, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import Logo from '../components/Logo';
import QRCode from 'react-qr-code';
import {
  getSubscriptionByNumber,
  getLocalSubscriptionByNumber,
  isSubscriptionValid,
  saveSubscriptionToLocalStorage,
  type Subscription
} from '../lib/subscriptionFirebase';

const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [inputNumber, setInputNumber] = useState('');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleNumberClick = (num: string) => {
    if (inputNumber.length < 13) {
      setInputNumber(inputNumber + num);
    }
  };

  const handleDelete = () => {
    setInputNumber(inputNumber.slice(0, -1));
  };

  const handleClear = () => {
    setInputNumber('');
    setSubscription(null);
    setError('');
  };

  const handleSearch = async () => {
    if (inputNumber.length < 10) {
      setError('Le numéro doit contenir au moins 10 caractères');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let foundSubscription: Subscription | null = null;

      if (isOffline) {
        foundSubscription = getLocalSubscriptionByNumber(inputNumber);
      } else {
        foundSubscription = await getSubscriptionByNumber(inputNumber);

        if (foundSubscription) {
          saveSubscriptionToLocalStorage(foundSubscription);
        }
      }

      if (foundSubscription) {
        if (!isSubscriptionValid(foundSubscription)) {
          setError('Cet abonnement a expiré');
          setSubscription(null);
        } else {
          setSubscription(foundSubscription);
        }
      } else {
        setError('Aucun abonnement trouvé avec ce numéro');
        setSubscription(null);
      }
    } catch (err) {
      setError('Erreur lors de la recherche');
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const keypadButtons = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    'C', '0', '←'
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[#F8FAFC]'}`}>
      <nav className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-xl border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/pass/services')} className="flex items-center gap-2 group">
              <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'} group-hover:translate-x-[-4px] transition-transform`} />
              <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Services PASS
              </span>
            </button>

            <div className="flex items-center gap-3">
              <Logo size="sm" variant="default" />
              <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Gënaa Gaaw</span>
            </div>

            {isOffline && (
              <div className="flex items-center gap-2 bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                <WifiOff className="w-4 h-4" />
                Mode Hors ligne
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {!subscription ? (
            <div className="grid md:grid-cols-2 gap-8">
              <div className={`rounded-3xl p-8 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
                <div className="text-center mb-8">
                  <Wallet className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                  <h2 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Mon Pass
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Entrez votre numéro d'abonnement
                  </p>
                </div>

                <div className={`mb-6 p-6 rounded-2xl text-center font-mono text-3xl font-bold min-h-[80px] flex items-center justify-center ${
                  isDark ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <span className={isDark ? 'text-white' : 'text-gray-900'}>
                    {inputNumber || '___________'}
                  </span>
                </div>

                {error && (
                  <div className="mb-4 p-4 rounded-xl bg-red-500/20 border-2 border-red-500 text-red-500 text-center font-semibold">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSearch}
                  disabled={loading || inputNumber.length < 10}
                  className={`w-full mb-6 py-4 rounded-xl font-bold text-white transition-all ${
                    loading || inputNumber.length < 10
                      ? 'bg-gray-400 cursor-not-allowed'
                      : isDark
                        ? 'bg-gradient-to-r from-cyan-500 to-[#0A7EA3] hover:from-cyan-600 hover:to-[#006B8C]'
                        : 'bg-gradient-to-r from-[#0A7EA3] to-[#005975] hover:from-[#006B8C] hover:to-[#00475E]'
                  }`}
                >
                  {loading ? 'Recherche...' : 'Rechercher mon Pass'}
                </button>
              </div>

              <div className={`rounded-3xl p-8 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
                <div className="text-center mb-6">
                  <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Clavier
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {keypadButtons.map((btn) => (
                    <button
                      key={btn}
                      onClick={() => {
                        if (btn === 'C') handleClear();
                        else if (btn === '←') handleDelete();
                        else handleNumberClick(btn);
                      }}
                      className={`h-24 rounded-2xl font-bold text-3xl transition-all ${
                        btn === 'C' || btn === '←'
                          ? isDark
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                          : isDark
                            ? 'bg-gray-700 text-white hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      {btn}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className={`max-w-2xl mx-auto rounded-3xl p-8 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
              <div className="flex items-center justify-between mb-8">
                <h2 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Mon Pass Gënaa Gaaw
                </h2>
                <button
                  onClick={handleClear}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                    isDark
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Fermer
                </button>
              </div>

              <div className={`mb-6 p-6 rounded-2xl ${
                isSubscriptionValid(subscription)
                  ? isDark ? 'bg-green-900/30 border-2 border-green-700' : 'bg-green-50 border-2 border-green-300'
                  : isDark ? 'bg-red-900/30 border-2 border-red-700' : 'bg-red-50 border-2 border-red-300'
              }`}>
                <div className="flex items-center gap-3">
                  {isSubscriptionValid(subscription) ? (
                    <Check className={`w-8 h-8 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  ) : (
                    <X className={`w-8 h-8 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                  )}
                  <div>
                    <div className={`font-bold text-xl ${
                      isSubscriptionValid(subscription)
                        ? isDark ? 'text-green-400' : 'text-green-800'
                        : isDark ? 'text-red-400' : 'text-red-800'
                    }`}>
                      {isSubscriptionValid(subscription) ? 'Abonnement Valide' : 'Abonnement Expiré'}
                    </div>
                    <div className={`text-sm ${
                      isSubscriptionValid(subscription)
                        ? isDark ? 'text-green-300' : 'text-green-700'
                        : isDark ? 'text-red-300' : 'text-red-700'
                    }`}>
                      Valable jusqu'au {new Date(subscription.end_date).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <div className="mb-6">
                    <img
                      src={subscription.photo_url}
                      alt="Photo d'identité"
                      className="w-full h-80 object-cover rounded-2xl border-4 border-cyan-500"
                    />
                  </div>

                  <div className={`p-4 rounded-xl mb-3 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Titulaire
                    </div>
                    <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {subscription.holder_name}
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl mb-3 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      CNI
                    </div>
                    <div className={`text-lg font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {subscription.holder_cni}
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Trajet
                    </div>
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {subscription.route.replace('_', ' → ').toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className={`p-6 rounded-2xl mb-4 ${isDark ? 'bg-white' : 'bg-white'}`}>
                    <QRCode value={subscription.qr_code} size={280} />
                  </div>

                  <div className={`text-center p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Numéro d'abonnement
                    </div>
                    <div className={`text-2xl font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                      {subscription.subscription_number}
                    </div>
                  </div>
                </div>
              </div>

              {isOffline && (
                <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-amber-900/30 border-2 border-amber-700' : 'bg-amber-50 border-2 border-amber-300'}`}>
                  <div className="flex items-center justify-center gap-2">
                    <WifiOff className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    <span className={`font-semibold ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
                      Pass chargé en Mode Hors ligne
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
