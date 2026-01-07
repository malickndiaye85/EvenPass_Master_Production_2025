import { CheckCircle, Phone, Mail, Clock } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  details?: string[];
  contactInfo?: boolean;
  isDark?: boolean;
}

export default function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  details = [],
  contactInfo = false,
  isDark = true
}: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn">
      <div
        className={`${isDark ? 'bg-[#0F0F0F]' : 'bg-white'} max-w-lg w-full rounded-2xl border-2 ${isDark ? 'border-green-600/50' : 'border-green-500'} shadow-2xl transform transition-all animate-scaleIn`}
        style={{ boxShadow: '0 0 60px rgba(16, 185, 129, 0.4)' }}
      >
        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-b-2 border-green-600/50 p-8 rounded-t-2xl text-center">
          <div className="inline-block p-6 bg-white rounded-full mb-4 shadow-xl">
            <CheckCircle className="w-16 h-16 text-green-600" strokeWidth={2.5} />
          </div>
          <h2 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>{title}</h2>
        </div>

        <div className="p-8">
          <p className={`text-base ${isDark ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-6 text-center`}>
            {message}
          </p>

          {details.length > 0 && (
            <div className={`${isDark ? 'bg-[#1F1F1F] border-[#2A2A2A]' : 'bg-gray-50 border-gray-200'} border-2 rounded-xl p-6 mb-6`}>
              <ul className="space-y-3">
                {details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm leading-relaxed`}>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {contactInfo && (
            <div className={`bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border-2 ${isDark ? 'border-cyan-600/50' : 'border-blue-500/50'} rounded-xl p-6 mb-6`}>
              <div className="flex items-center gap-2 mb-4">
                <Clock className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                <p className={`text-sm font-bold ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>
                  En attente de validation (24h max)
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${isDark ? 'bg-cyan-600' : 'bg-blue-600'} rounded-lg flex items-center justify-center`}>
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className={`text-xs ${isDark ? 'text-[#B5B5B5]' : 'text-gray-600'}`}>Appelez le support</p>
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>+221 77 139 29 26</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${isDark ? 'bg-purple-600' : 'bg-purple-600'} rounded-lg flex items-center justify-center`}>
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className={`text-xs ${isDark ? 'text-[#B5B5B5]' : 'text-gray-600'}`}>Envoyez un email</p>
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>support@evenpass.sn</p>
                  </div>
                </div>
              </div>
              <p className={`text-xs ${isDark ? 'text-[#B5B5B5]' : 'text-gray-600'} mt-4 text-center italic`}>
                Si aucune réponse après 24h, n'hésitez pas à nous contacter
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-black rounded-xl transition-all shadow-lg hover:scale-105 text-lg"
          >
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  );
}
