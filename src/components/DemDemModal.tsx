import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

interface DemDemModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
}

export default function DemDemModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Annuler',
  onConfirm,
  showCancel = false,
}: DemDemModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-12 h-12 text-[#10B981]" />;
      case 'error':
        return <XCircle className="w-12 h-12 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-12 h-12 text-yellow-500" />;
      case 'confirm':
        return <AlertTriangle className="w-12 h-12 text-[#FF6B00]" />;
      default:
        return <Info className="w-12 h-12 text-blue-500" />;
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
      <div className="bg-[#0A0A0B] rounded-2xl max-w-md w-full border border-[#FF6B00]/30 shadow-2xl animate-fadeIn">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-white">DemDem Transports & Events</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col items-center text-center mb-6">
            <div className="mb-4">
              {getIcon()}
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              {title}
            </h3>
            <p className="text-white/70 text-base leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex gap-3">
            {showCancel && (
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white rounded-xl font-bold transition-all"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={handleConfirm}
              className={`${showCancel ? 'flex-1' : 'w-full'} px-6 py-3 rounded-xl font-bold transition-all ${
                type === 'error'
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-[#FF6B00] hover:bg-[#E55F00] text-black'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
