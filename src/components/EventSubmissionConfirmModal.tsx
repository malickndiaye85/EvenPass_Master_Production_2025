import React from 'react';
import { CheckCircle, X, Phone, Mail, AlertCircle } from 'lucide-react';

interface EventSubmissionConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  processing: boolean;
}

const EventSubmissionConfirmModal: React.FC<EventSubmissionConfirmModalProps> = ({
  onConfirm,
  onCancel,
  processing
}) => {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
      <div className="bg-[#0A0A0B] rounded-3xl border-2 border-[#FF6B00]/30 max-w-lg w-full overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-[#FF6B00]/20 to-orange-600/20 p-6 border-b border-[#FF6B00]/30">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#FF6B00]/20 rounded-2xl flex items-center justify-center border border-[#FF6B00]/40">
                <CheckCircle className="w-6 h-6 text-[#FF6B00]" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">
                  Soumission pour Validation
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Dernière étape avant la publication
                </p>
              </div>
            </div>
            {!processing && (
              <button
                onClick={onCancel}
                className="p-2 rounded-xl transition-colors hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-300 leading-relaxed">
                Votre événement va être transmis à l'équipe <span className="font-bold text-white">DEM-DEM</span> pour vérification.
                Nous nous assurons de la conformité des informations sous <span className="font-bold text-[#FF6B00]">24 heures</span>.
              </div>
            </div>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-300 leading-relaxed">
                Une fois validé, vos <span className="font-bold text-white">ventes de billets</span> seront automatiquement activées et votre événement sera visible sur la plateforme.
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="text-sm font-bold text-gray-400 mb-3">
              Besoin d'aide ?
            </div>
            <div className="space-y-2">
              <a
                href="tel:+221771392926"
                className="flex items-center gap-3 text-white hover:text-[#FF6B00] transition-colors group"
              >
                <div className="w-10 h-10 bg-[#FF6B00]/20 rounded-xl flex items-center justify-center group-hover:bg-[#FF6B00]/30 transition-colors border border-[#FF6B00]/30">
                  <Phone className="w-5 h-5 text-[#FF6B00]" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">Téléphone</div>
                  <div className="font-bold">+221 77 139 29 26</div>
                </div>
              </a>

              <a
                href="mailto:contact@demdem.sn"
                className="flex items-center gap-3 text-white hover:text-[#FF6B00] transition-colors group"
              >
                <div className="w-10 h-10 bg-[#FF6B00]/20 rounded-xl flex items-center justify-center group-hover:bg-[#FF6B00]/30 transition-colors border border-[#FF6B00]/30">
                  <Mail className="w-5 h-5 text-[#FF6B00]" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">Email</div>
                  <div className="font-bold">contact@demdem.sn</div>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white/5 border-t border-white/10 flex gap-3">
          <button
            onClick={onCancel}
            disabled={processing}
            className="flex-1 py-4 px-6 rounded-2xl font-bold transition-all bg-white/10 hover:bg-white/20 text-white border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Modifier encore
          </button>
          <button
            onClick={onConfirm}
            disabled={processing}
            className="flex-1 py-4 px-6 rounded-2xl font-bold transition-all bg-gradient-to-r from-[#FF6B00] to-orange-600 hover:from-[#FF6B00]/90 hover:to-orange-600/90 text-white shadow-lg shadow-[#FF6B00]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Envoi en cours...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Confirmer et Envoyer</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventSubmissionConfirmModal;
