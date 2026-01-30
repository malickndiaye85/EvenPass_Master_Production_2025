import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, ArrowRight, Phone, Lock } from 'lucide-react';

export default function DriverPendingApprovalPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#1a2942] to-[#0A1628]">
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-32 h-32 mx-auto mb-6 relative">
              <img
                src="/assets/logo-demdemv2.svg"
                alt="DemDem Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="w-32 h-32 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-full flex items-center justify-center"><span class="text-4xl font-bold text-white">D</span></div>';
                  }
                }}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#10B981] to-[#059669] p-8 text-center">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Dossier reçu !</h1>
              <p className="text-white/90">Votre inscription a été enregistrée</p>
            </div>

            <div className="p-8">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
                <div className="flex items-start gap-3">
                  <Clock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-900 font-semibold mb-2">En attente de validation</p>
                    <p className="text-blue-800 text-sm leading-relaxed">
                      Notre équipe examine actuellement vos documents. Vous recevrez une notification par SMS dès que votre compte sera validé.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-[#10B981] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Documents en cours d'examen</p>
                    <p className="text-sm text-gray-600">
                      Permis de conduire, assurance, carte grise et informations du véhicule
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-600 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600 mb-1">Validation du dossier</p>
                    <p className="text-sm text-gray-500">
                      Délai moyen : 24-48 heures ouvrées
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-600 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600 mb-1">Activation du compte</p>
                    <p className="text-sm text-gray-500">
                      Connexion avec votre Numéro + PIN et début de votre activité
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#10B981]/10 to-[#059669]/10 border border-[#10B981]/20 rounded-xl p-5 mb-8">
                <p className="text-center text-gray-900 font-semibold mb-3">
                  Prochaine étape
                </p>
                <p className="text-center text-gray-700 text-sm mb-4">
                  Connectez-vous avec votre Numéro de téléphone + PIN pour suivre l'avancée de votre dossier
                </p>
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-4 h-4 text-[#10B981]" />
                    <span>Votre numéro</span>
                  </div>
                  <span className="text-gray-400">+</span>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Lock className="w-4 h-4 text-[#10B981]" />
                    <span>Votre PIN (4 chiffres)</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/voyage/chauffeur/login')}
                className="w-full py-4 bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <span>Se connecter</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => navigate('/voyage')}
                className="w-full mt-4 py-3 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
              >
                Retour à l'accueil
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-white/70 text-sm mb-2">
              Besoin d'aide ?
            </p>
            <p className="text-white/90 font-semibold">
              Support : +221 77 123 45 67
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
