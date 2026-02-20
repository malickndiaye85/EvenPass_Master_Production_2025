import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scan, AlertCircle, Bus, Check, Delete, MessageCircle } from 'lucide-react';
import { authenticateWithPIN, vibrateDevice, openWhatsAppSupport } from '../../lib/pinAuthService';
import PWAInstallBanner from '../../components/PWAInstallBanner';

const ControllerLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (pin.length === 6) {
      handlePinSubmit();
    }
  }, [pin]);

  const handlePinSubmit = async () => {
    setError('');
    setLoading(true);

    const result = await authenticateWithPIN(pin);

    if (result.success) {
      setSuccess(true);
      vibrateDevice([50, 100, 50]);

      setTimeout(() => {
        navigate('/controller-epscanv');
      }, 800);
    } else {
      setError(result.error || 'Code incorrect');
      setShake(true);
      vibrateDevice([100, 50, 100, 50, 100]);

      setTimeout(() => setShake(false), 500);
      setTimeout(() => {
        setPin('');
        setError('');
        setLoading(false);
      }, 1500);
    }
  };

  const handleNumberClick = (num: number) => {
    if (pin.length < 6 && !loading) {
      setPin(pin + num);
    }
  };

  const handleDelete = () => {
    if (!loading) {
      setPin(pin.slice(0, -1));
      setError('');
    }
  };

  const handleClear = () => {
    if (!loading) {
      setPin('');
      setError('');
    }
  };

  const handleForgotCode = () => {
    openWhatsAppSupport();
  };

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-controller.js', { scope: '/controller/' })
        .then(reg => console.log('[EPscanV] Service Worker registered:', reg))
        .catch(err => console.error('[EPscanV] Service Worker registration failed:', err));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#1A1A1B] to-[#0A0A0B] flex items-center justify-center px-4">
      <PWAInstallBanner />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-6 shadow-2xl transition-all duration-300 ${
            success
              ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/50 scale-110'
              : 'bg-gradient-to-br from-[#10B981] to-[#059669] shadow-[#10B981]/30'
          }`}>
            {success ? (
              <Check className="w-12 h-12 text-white animate-bounce" />
            ) : (
              <Scan className="w-12 h-12 text-white" />
            )}
          </div>
          <h1 className="text-4xl font-black text-white mb-2">
            EPscanV
          </h1>
          <p className="text-gray-400 text-sm">
            Contrôleur Transport • DEM-DEM Express
          </p>
        </div>

        <div className={`bg-[#1E1E1E] rounded-3xl p-8 shadow-2xl border border-gray-800 transition-all duration-300 ${
          shake ? 'animate-shake' : ''
        }`}>
          <div className="mb-6">
            <label className="block text-center text-sm font-bold text-white mb-4">
              Code d'accès à 6 chiffres
            </label>

            <div className="flex justify-center gap-3 mb-6">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div
                  key={index}
                  className={`w-12 h-14 rounded-xl flex items-center justify-center text-2xl font-black transition-all duration-200 ${
                    success
                      ? 'bg-green-500/20 border-2 border-green-500 text-green-400'
                      : error && pin.length > index
                      ? 'bg-red-500/20 border-2 border-red-500 text-red-400'
                      : pin.length > index
                      ? 'bg-[#10B981]/20 border-2 border-[#10B981] text-[#10B981]'
                      : 'bg-[#2A2A2A] border-2 border-gray-700 text-gray-600'
                  }`}
                >
                  {pin.length > index ? '●' : ''}
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-500 font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2 animate-fadeIn">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <p className="text-xs text-green-500 font-medium">Code valide ! Redirection...</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num)}
                disabled={loading || success}
                className="h-16 bg-[#2A2A2A] hover:bg-[#3A3A3A] active:bg-[#10B981] border border-gray-700 rounded-2xl text-white text-2xl font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-lg"
              >
                {num}
              </button>
            ))}

            <button
              onClick={handleClear}
              disabled={loading || success || pin.length === 0}
              className="h-16 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 border border-red-500/30 rounded-2xl text-red-500 text-sm font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
            >
              <span className="text-xs">CLEAR</span>
            </button>

            <button
              onClick={() => handleNumberClick(0)}
              disabled={loading || success}
              className="h-16 bg-[#2A2A2A] hover:bg-[#3A3A3A] active:bg-[#10B981] border border-gray-700 rounded-2xl text-white text-2xl font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-lg"
            >
              0
            </button>

            <button
              onClick={handleDelete}
              disabled={loading || success || pin.length === 0}
              className="h-16 bg-[#2A2A2A] hover:bg-[#3A3A3A] active:bg-orange-500/20 border border-gray-700 rounded-2xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center hover:scale-105 active:scale-95"
            >
              <Delete className="w-6 h-6" />
            </button>
          </div>

          <button
            onClick={handleForgotCode}
            disabled={loading || success}
            className="w-full bg-gray-800/50 hover:bg-gray-800 border border-gray-700 text-gray-300 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            <MessageCircle className="w-4 h-4" />
            Code oublié ? Contactez le superviseur
          </button>
        </div>

        <div className="mt-6 bg-[#10B981]/10 border border-[#10B981]/30 rounded-2xl p-4">
          <div className="flex items-start space-x-3">
            <Bus className="text-[#10B981] flex-shrink-0 mt-0.5" size={20} />
            <div>
              <div className="text-white font-bold text-sm mb-1">Mode Offline-First</div>
              <div className="text-gray-400 text-xs">
                Le scanner fonctionne sans connexion Internet. Authentification et scans hors ligne.
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ControllerLoginPage;
