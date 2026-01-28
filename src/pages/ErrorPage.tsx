import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCcw, AlertTriangle, Phone, Mail, Home, HelpCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import DynamicLogo from '../components/DynamicLogo';

export default function ErrorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showAnimation, setShowAnimation] = useState(false);

  const errorCode = searchParams.get('error') || 'unknown';
  const reference = searchParams.get('ref');

  useEffect(() => {
    setShowAnimation(true);
  }, []);

  const errorMessages: Record<string, string> = {
    insufficient_funds: 'Solde insuffisant sur votre compte',
    cancelled: 'Transaction annulée par l\'utilisateur',
    timeout: 'Délai de paiement expiré',
    network_error: 'Erreur de connexion réseau',
    invalid_phone: 'Numéro de téléphone invalide',
    account_blocked: 'Compte temporairement bloqué',
    sold_out: 'Billets épuisés',
    duplicate_purchase: 'Ce numéro a déjà acheté des billets',
    unknown: 'Erreur lors du traitement du paiement'
  };

  const errorMessage = errorMessages[errorCode] || errorMessages.unknown;

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4 md:p-8">
      <div className="max-w-4xl w-full">
        <div className="flex justify-center mb-8">
          <div className="scale-125">
            <DynamicLogo />
          </div>
        </div>

        <div
          className={`bg-[#1A1A1A] overflow-hidden transition-all duration-500 ${showAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
          style={{
            borderRadius: '40px 120px 40px 120px',
            border: '3px solid #EF4444',
            boxShadow: '0 0 60px rgba(239, 68, 68, 0.3)'
          }}
        >
          <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-600 p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            <div className={`relative inline-block p-6 bg-white rounded-full mb-6 transition-all duration-700 ${showAnimation ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}`}>
              <XCircle className="w-20 h-20 text-red-600" strokeWidth={2.5} />
            </div>
            <h1 className="relative text-5xl font-black text-white mb-3">Paiement Échoué</h1>
            <p className="relative text-xl text-white/95 font-medium">
              Gënaa Gaaw! Aucun montant n'a été débité
            </p>
          </div>

          <div className="p-8 md:p-12">
            <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-red-300 mb-2">
                    ⚠️ {errorMessage}
                  </p>
                  {reference && (
                    <p className="text-sm text-[#B5B5B5] mb-3">
                      Référence: <span className="font-mono text-red-400">{reference}</span>
                    </p>
                  )}
                  <p className="text-sm text-[#B5B5B5]">
                    Date/Heure: {new Date().toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#0F0F0F] rounded-2xl p-8 mb-8 border border-[#2A2A2A]">
              <div className="flex items-start gap-3 mb-6">
                <HelpCircle className="w-6 h-6 text-[#FF5F05] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-black text-white mb-3">
                    Raisons possibles
                  </h3>
                  <ul className="space-y-3">
                    {[
                      'Solde Wave ou Orange Money insuffisant',
                      'Transaction annulée par l\'utilisateur',
                      'Erreur de connexion réseau',
                      'Compte temporairement bloqué',
                      'Délai d\'attente expiré',
                      'Limite d\'achat atteinte (1 transaction/numéro)'
                    ].map((reason, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-[#B5B5B5]">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 mb-8">
              <h3 className="text-lg font-bold text-blue-300 mb-4 flex items-center gap-2">
                <RefreshCcw className="w-5 h-5" />
                Que faire maintenant ?
              </h3>
              <div className="space-y-4 text-sm text-[#B5B5B5]">
                <div>
                  <p className="font-bold text-white mb-1">1. Vérifiez votre solde</p>
                  <p>Assurez-vous d'avoir suffisamment de fonds sur votre compte Wave ou Orange Money</p>
                </div>
                <div>
                  <p className="font-bold text-white mb-1">2. Réessayez le paiement</p>
                  <p>Votre panier est toujours disponible, cliquez sur "Réessayer" ci-dessous</p>
                </div>
                <div>
                  <p className="font-bold text-white mb-1">3. Contactez le support</p>
                  <p>Notre équipe est disponible 24/7 pour vous aider</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <button
                onClick={() => navigate(-1)}
                className="w-full px-8 py-5 bg-gradient-to-r from-[#FF5F05] to-[#FF8C42] hover:from-[#FF7A00] hover:to-[#FFA05D] text-white rounded-2xl transition-all font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] shadow-lg shadow-[#FF5F05]/30"
              >
                <RefreshCcw className="w-6 h-6" />
                Réessayer le paiement
              </button>

              <button
                onClick={() => navigate('/')}
                className="w-full px-8 py-5 bg-[#0F0F0F] border-2 border-[#2A2A2A] hover:border-[#FF5F05] text-white rounded-2xl transition-all font-bold text-lg flex items-center justify-center gap-3"
              >
                <Home className="w-6 h-6" />
                Retour à l'accueil
              </button>
            </div>

            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-6 text-center">
              <p className="text-lg font-bold text-purple-300 mb-4">
                Besoin d'aide ? Contactez notre support
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
                <a
                  href="tel:+221771392926"
                  className="flex items-center gap-2 text-white hover:text-[#FF5F05] transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  <span className="font-bold">+221 77 139 29 26</span>
                </a>
                <span className="hidden sm:block text-[#B5B5B5]">•</span>
                <a
                  href="mailto:contact@demdem.sn"
                  className="flex items-center gap-2 text-white hover:text-[#FF5F05] transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  <span className="font-bold">contact@demdem.sn</span>
                </a>
              </div>
              <p className="text-xs text-[#B5B5B5] mt-4">
                Support disponible 24/7 • Réponse en moins de 5 minutes
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-2xl font-black text-red-400 mb-2">
            Gënaa Gaaw! 😔
          </p>
          <p className="text-[#B5B5B5] text-lg">
            Nous sommes désolés pour ce désagrément - Notre équipe est là pour vous aider
          </p>
        </div>
      </div>
    </div>
  );
}
