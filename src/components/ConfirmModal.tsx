import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'success' | 'info';
  confirmText?: string;
  cancelText?: string;
  isDark?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  isDark = true
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="w-12 h-12 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-12 h-12 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'info':
        return <Info className="w-12 h-12 text-blue-500" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          bg: 'from-red-600/20 to-pink-600/20',
          border: 'border-red-600/50',
          button: 'from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700'
        };
      case 'warning':
        return {
          bg: 'from-yellow-600/20 to-orange-600/20',
          border: 'border-yellow-600/50',
          button: 'from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700'
        };
      case 'success':
        return {
          bg: 'from-green-600/20 to-emerald-600/20',
          border: 'border-green-600/50',
          button: 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
        };
      case 'info':
        return {
          bg: 'from-blue-600/20 to-cyan-600/20',
          border: 'border-blue-600/50',
          button: 'from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn">
      <div
        className={`${isDark ? 'bg-[#0F0F0F]' : 'bg-white'} max-w-md w-full rounded-2xl border-2 ${isDark ? 'border-[#2A2A2A]' : 'border-gray-200'} shadow-2xl transform transition-all animate-scaleIn`}
      >
        <div className={`bg-gradient-to-br ${colors.bg} border-b-2 ${colors.border} p-6 rounded-t-2xl`}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="mb-4">{getIcon()}</div>
              <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
            </div>
            <button
              onClick={onClose}
              className={`${isDark ? 'text-[#B5B5B5] hover:text-white' : 'text-gray-400 hover:text-gray-900'} transition-colors`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <p className={`text-base ${isDark ? 'text-[#B5B5B5]' : 'text-gray-700'} leading-relaxed mb-6`}>
            {message}
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`flex-1 px-6 py-3 ${isDark ? 'bg-[#2A2A2A] hover:bg-[#1F1F1F]' : 'bg-gray-200 hover:bg-gray-300'} ${isDark ? 'text-white' : 'text-gray-900'} font-bold rounded-xl transition-all border ${isDark ? 'border-[#2A2A2A]' : 'border-gray-300'}`}
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-6 py-3 bg-gradient-to-r ${colors.button} text-white font-black rounded-xl transition-all shadow-lg hover:scale-105`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
