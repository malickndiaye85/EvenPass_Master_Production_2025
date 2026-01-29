import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ModalType = 'success' | 'error' | 'info' | 'confirm';

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: ModalType;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const CustomModal: React.FC<CustomModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Annuler'
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />;
      case 'error':
        return <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />;
      case 'confirm':
        return <Info className="w-16 h-16 text-amber-500 mx-auto mb-4" />;
      default:
        return <Info className="w-16 h-16 text-blue-500 mx-auto mb-4" />;
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          {getIcon()}

          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {title}
          </h3>

          <p className="text-gray-600 mb-6 leading-relaxed">
            {message}
          </p>

          <div className="flex gap-3">
            {type === 'confirm' ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
                >
                  {confirmText}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                {confirmText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
