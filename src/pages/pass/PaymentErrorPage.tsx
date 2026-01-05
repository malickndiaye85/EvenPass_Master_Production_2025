import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, Home, RefreshCw, Phone } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../../components/Logo';

export default function PaymentErrorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const errorMessage = searchParams.get('message') || 'Une erreur est survenue lors du paiement';
  const service = searchParams.get('service');

  const handleRetry = () => {
    if (service) {
      navigate(`/pass/${service}/booking`);
    } else {
      navigate('/pass/services');
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[#F8FAFC]'} flex items-center justify-center p-4 md:p-8`}>
      <div className="max-w-3xl w-full">
        <div className="flex justify-center mb-8">
          <Logo size="md" variant="default" />
        </div>

        <div
          className={`${isDark ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}
          style={{
            borderRadius: '40px 120px 40px 120px',
            border: `3px solid ${isDark ? '#EF4444' : '#DC2626'}`,
            boxShadow: '0 0 60px rgba(239, 68, 68, 0.3)'
          }}
        >
          <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 p-12 text-center relative overflow-hidden">
            <div className="relative inline-block p-6 bg-white rounded-full mb-6">
              <XCircle className="w-20 h-20 text-red-600" strokeWidth={2.5} />
            </div>
            <h1 className="relative text-5xl font-black text-white mb-3">Paiement Échoué</h1>
            <p className="relative text-xl text-white/95 font-medium">
              Désolé, votre paiement n'a pas pu être traité
            </p>
          </div>

          <div className="p-8 md:p-12">
            <div className={`${isDark ? 'bg-red-900/20' : 'bg-red-50'} border ${isDark ? 'border-red-900/50' : 'border-red-200'} rounded-2xl p-6 mb-8`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${isDark ? 'bg-red-500/20' : 'bg-red-100'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <XCircle className={`w-6 h-6 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-lg font-bold mb-2 ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                    Raison de l'échec
                  </p>
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                    {errorMessage}
                  </p>
                </div>
              </div>
            </div>

            <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'} rounded-2xl p-6 mb-8`}>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                Que faire maintenant ?
              </p>
              <ul className={`space-y-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <li className="flex items-start gap-3">
                  <span className={`w-6 h-6 ${isDark ? 'bg-cyan-600' : 'bg-blue-600'} rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs`}>1</span>
                  <span>Vérifiez que vous avez suffisamment de solde dans votre compte mobile money</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className={`w-6 h-6 ${isDark ? 'bg-cyan-600' : 'bg-blue-600'} rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs`}>2</span>
                  <span>Assurez-vous que votre numéro de téléphone est correct</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className={`w-6 h-6 ${isDark ? 'bg-cyan-600' : 'bg-blue-600'} rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs`}>3</span>
                  <span>Réessayez le paiement avec Wave ou Orange Money</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className={`w-6 h-6 ${isDark ? 'bg-cyan-600' : 'bg-blue-600'} rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs`}>4</span>
                  <span>Si le problème persiste, contactez notre support client</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleRetry}
                className={`w-full px-8 py-5 ${isDark ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-2xl transition-all font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] shadow-lg`}
              >
                <RefreshCw className="w-6 h-6" />
                Réessayer le paiement
              </button>

              <button
                onClick={() => navigate('/pass/services')}
                className={`w-full px-8 py-5 ${isDark ? 'bg-gray-900 border-gray-700 hover:border-cyan-600' : 'bg-white border-gray-300 hover:border-blue-600'} border-2 ${isDark ? 'text-white' : 'text-gray-900'} rounded-2xl transition-all font-bold text-lg flex items-center justify-center gap-3`}
              >
                <Home className="w-6 h-6" />
                Retour aux services
              </button>
            </div>

            <div className={`mt-8 bg-gradient-to-r ${isDark ? 'from-yellow-500/10 to-orange-500/10 border-yellow-500/30' : 'from-yellow-500/10 to-orange-500/10 border-yellow-500/30'} border rounded-2xl p-6 text-center`}>
              <p className={`text-lg font-bold ${isDark ? 'text-yellow-300' : 'text-yellow-700'} mb-2`}>
                💡 Besoin d'aide ?
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                Notre équipe support est disponible pour vous aider
              </p>
              <div className={`flex items-center justify-center gap-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <a href="tel:+221771392926" className="flex items-center gap-2 font-bold hover:underline">
                  <Phone className="w-4 h-4" />
                  +221 77 139 29 26
                </a>
                <span>•</span>
                <a href="https://wa.me/221771392926" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-bold hover:underline">
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
