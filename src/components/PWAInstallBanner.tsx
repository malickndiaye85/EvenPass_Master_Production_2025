import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    if (isInstalled) {
      return;
    }

    const userDismissed = localStorage.getItem('pwa_install_dismissed');
    if (userDismissed === 'true') {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA installed');
    } else {
      console.log('PWA installation dismissed');
    }

    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  const handleNeverShowAgain = () => {
    localStorage.setItem('pwa_install_dismissed', 'true');
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-[#10B981] to-[#059669] p-4 shadow-2xl border-t-4 border-green-400">
        <div className="max-w-md mx-auto">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 bg-white/20 rounded-xl">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-black text-sm mb-1">
                  Installer l'app sur votre écran d'accueil
                </h3>
                <p className="text-green-100 text-xs">
                  Accès rapide et fonctionnement offline, même en zone blanche
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/20 rounded-lg transition-all"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex-1 bg-white hover:bg-green-50 text-[#10B981] font-black py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg"
            >
              <Download className="w-4 h-4" />
              Installer maintenant
            </button>
            <button
              onClick={handleNeverShowAgain}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all text-sm"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PWAInstallBanner;
