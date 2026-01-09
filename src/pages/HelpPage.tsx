import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Mail, Phone, MessageCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function HelpPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <button
          onClick={() => navigate('/')}
          className={`flex items-center gap-2 mb-8 ${
            isDark ? 'text-amber-400 hover:text-amber-300' : 'text-orange-500 hover:text-orange-600'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
          Retour à l'accueil
        </button>

        <div className={`rounded-3xl p-8 ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-xl`}>
          <div className="flex items-center gap-3 mb-6">
            <HelpCircle className={`w-10 h-10 ${isDark ? 'text-amber-400' : 'text-orange-500'}`} />
            <h1 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Centre d'aide
            </h1>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-amber-400' : 'text-orange-500'}`}>
                Questions Fréquentes
              </h2>

              <div className="space-y-4">
                <details className={`p-4 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  <summary className={`font-bold cursor-pointer ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Comment acheter un billet ?
                  </summary>
                  <p className={`mt-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Parcourez les événements disponibles sur la page d'accueil, sélectionnez celui qui vous intéresse,
                    choisissez votre catégorie de billet et procédez au paiement via Wave ou Orange Money.
                  </p>
                </details>

                <details className={`p-4 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  <summary className={`font-bold cursor-pointer ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Comment recevoir mon billet ?
                  </summary>
                  <p className={`mt-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Votre billet sera envoyé par SMS immédiatement après validation du paiement.
                    Vous recevrez un code QR unique à présenter à l'entrée de l'événement.
                  </p>
                </details>

                <details className={`p-4 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  <summary className={`font-bold cursor-pointer ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Puis-je annuler mon billet ?
                  </summary>
                  <p className={`mt-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Les billets sont généralement non remboursables. Consultez les conditions spécifiques de chaque événement
                    ou contactez l'organisateur directement.
                  </p>
                </details>

                <details className={`p-4 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  <summary className={`font-bold cursor-pointer ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Comment devenir organisateur ?
                  </summary>
                  <p className={`mt-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Cliquez sur "Pour les organisateurs" dans le menu et créez votre compte organisateur.
                    Notre équipe validera votre inscription sous 24-48h.
                  </p>
                </details>

                <details className={`p-4 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  <summary className={`font-bold cursor-pointer ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Mes données sont-elles sécurisées ?
                  </summary>
                  <p className={`mt-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Absolument. Nous utilisons les technologies de cryptage les plus avancées et ne stockons jamais
                    vos informations de paiement. Tous les paiements sont traités via des plateformes certifiées.
                  </p>
                </details>
              </div>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-amber-400' : 'text-orange-500'}`}>
                Besoin d'aide supplémentaire ?
              </h2>

              <div className="grid md:grid-cols-3 gap-4">
                <a
                  href="mailto:support@evenpass.sn"
                  className={`p-6 rounded-xl text-center transition-all ${
                    isDark
                      ? 'bg-slate-700 hover:bg-slate-600'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <Mail className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-amber-400' : 'text-orange-500'}`} />
                  <h3 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Email</h3>
                  <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    support@evenpass.sn
                  </p>
                </a>

                <a
                  href="tel:+221771392926"
                  className={`p-6 rounded-xl text-center transition-all ${
                    isDark
                      ? 'bg-slate-700 hover:bg-slate-600'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <Phone className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-amber-400' : 'text-orange-500'}`} />
                  <h3 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Téléphone</h3>
                  <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    +221 77 139 29 26
                  </p>
                </a>

                <a
                  href="https://wa.me/221771392926"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-6 rounded-xl text-center transition-all ${
                    isDark
                      ? 'bg-slate-700 hover:bg-slate-600'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <MessageCircle className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-amber-400' : 'text-orange-500'}`} />
                  <h3 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>WhatsApp</h3>
                  <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    +221 77 139 29 26
                  </p>
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
