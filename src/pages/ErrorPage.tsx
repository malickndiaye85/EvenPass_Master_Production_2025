import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCcw } from 'lucide-react';

export default function ErrorPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-rose-600 p-8 text-center">
            <div className="inline-block p-4 bg-white/20 rounded-full mb-4">
              <XCircle className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Erreur de paiement</h1>
            <p className="text-lg text-white/90">Gënaa Gaaw! Une erreur s'est produite</p>
          </div>

          <div className="p-8">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-300 mb-2">
                Nous n'avons pas pu traiter votre paiement.
              </p>
              <p className="text-sm text-red-200/70">
                Cela peut être dû à:
              </p>
              <ul className="text-sm text-red-200/70 mt-2 space-y-1 list-disc list-inside">
                <li>Solde insuffisant</li>
                <li>Problème de connexion</li>
                <li>Timeout de la transaction</li>
                <li>Billets épuisés</li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate(-1)}
                className="w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center"
              >
                <RefreshCcw className="w-5 h-5 mr-2" />
                Réessayer
              </button>

              <button
                onClick={() => navigate('/')}
                className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Retour à l'accueil
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">
                Besoin d'aide? Contactez notre support
              </p>
              <a href="mailto:support@evenpass.sn" className="text-sm text-orange-400 hover:text-orange-300 transition-colors">
                support@evenpass.sn
              </a>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-slate-400">
            Gënaa Gaaw! Nous sommes désolés pour ce désagrément
          </p>
        </div>
      </div>
    </div>
  );
}
