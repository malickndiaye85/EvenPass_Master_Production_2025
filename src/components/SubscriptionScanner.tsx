import React, { useState } from 'react';
import { Check, X, User, Calendar, MapPin, AlertCircle } from 'lucide-react';
import { getSubscriptionByNumber, isSubscriptionValid, type Subscription } from '../lib/subscriptionFirebase';

interface SubscriptionScannerProps {
  isDark: boolean;
  onScanComplete?: (subscription: Subscription | null) => void;
}

const SubscriptionScanner: React.FC<SubscriptionScannerProps> = ({ isDark, onScanComplete }) => {
  const [scannedData, setScannedData] = useState<string>('');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScan = async (data: string) => {
    if (data.startsWith('GENAA_GAAW_')) {
      const subscriptionNumber = data.replace('GENAA_GAAW_', '');
      setScannedData(subscriptionNumber);
      setLoading(true);
      setError('');

      try {
        const foundSubscription = await getSubscriptionByNumber(subscriptionNumber);

        if (foundSubscription) {
          setSubscription(foundSubscription);
          if (onScanComplete) {
            onScanComplete(foundSubscription);
          }
        } else {
          setError('Abonnement introuvable');
          setSubscription(null);
        }
      } catch (err) {
        setError('Erreur lors de la vérification');
        setSubscription(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const isValid = subscription && isSubscriptionValid(subscription);

  return (
    <div>
      {subscription ? (
        <div className={`rounded-2xl p-6 ${
          isValid
            ? isDark ? 'bg-green-900/30 border-2 border-green-700' : 'bg-green-50 border-2 border-green-300'
            : isDark ? 'bg-red-900/30 border-2 border-red-700' : 'bg-red-50 border-2 border-red-300'
        }`}>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <img
                src={subscription.photo_url}
                alt="Photo d'identité"
                className="w-full h-64 object-cover rounded-xl border-4 border-cyan-500"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                {isValid ? (
                  <Check className={`w-12 h-12 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                ) : (
                  <X className={`w-12 h-12 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                )}
                <div>
                  <div className={`font-black text-2xl ${
                    isValid
                      ? isDark ? 'text-green-400' : 'text-green-800'
                      : isDark ? 'text-red-400' : 'text-red-800'
                  }`}>
                    {isValid ? 'PASS VALIDE' : 'PASS EXPIRÉ'}
                  </div>
                  <div className={`text-sm ${
                    isValid
                      ? isDark ? 'text-green-300' : 'text-green-700'
                      : isDark ? 'text-red-300' : 'text-red-700'
                  }`}>
                    Expiration : {new Date(subscription.end_date).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-white'}`}>
                  <User className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                  <div>
                    <div className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Titulaire
                    </div>
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {subscription.holder_name}
                    </div>
                  </div>
                </div>

                <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-white'}`}>
                  <AlertCircle className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                  <div>
                    <div className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      CNI
                    </div>
                    <div className={`text-lg font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {subscription.holder_cni}
                    </div>
                  </div>
                </div>

                <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-white'}`}>
                  <MapPin className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                  <div>
                    <div className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Trajet
                    </div>
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {subscription.route.replace('_', ' → ').toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-white'}`}>
                  <Calendar className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                  <div>
                    <div className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Type
                    </div>
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {subscription.subscription_type === 'monthly' ? 'Mensuel' : 'Annuel'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setSubscription(null);
              setScannedData('');
            }}
            className={`w-full mt-6 py-3 rounded-xl font-bold transition-all ${
              isDark
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            }`}
          >
            Scanner un autre Pass
          </button>
        </div>
      ) : (
        <div className={`text-center p-8 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Scannez un QR Code Gënaa Gaaw
          </div>
          {error && (
            <div className="mt-4 p-4 rounded-xl bg-red-500/20 border-2 border-red-500 text-red-500 font-semibold">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubscriptionScanner;
