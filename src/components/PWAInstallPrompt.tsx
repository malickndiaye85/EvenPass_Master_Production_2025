import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroidBanner, setShowAndroidBanner] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;

    setIsIOS(isIOSDevice);
    setIsStandalone(isInStandaloneMode || window.matchMedia('(display-mode: standalone)').matches);

    if (isIOSDevice && !isInStandaloneMode) {
      const hasSeenIOSPrompt = localStorage.getItem('pwa-ios-prompt-dismissed');
      if (!hasSeenIOSPrompt) {
        setTimeout(() => setShowIOSModal(true), 3000);
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      const hasSeenAndroidPrompt = localStorage.getItem('pwa-android-prompt-dismissed');
      if (!hasSeenAndroidPrompt) {
        setShowAndroidBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
    } else {
      console.log('[PWA] User dismissed the install prompt');
    }

    setDeferredPrompt(null);
    setShowAndroidBanner(false);
    localStorage.setItem('pwa-android-prompt-dismissed', 'true');
  };

  const dismissAndroidBanner = () => {
    setShowAndroidBanner(false);
    localStorage.setItem('pwa-android-prompt-dismissed', 'true');
  };

  const dismissIOSModal = () => {
    setShowIOSModal(false);
    localStorage.setItem('pwa-ios-prompt-dismissed', 'true');
  };

  if (isStandalone) {
    return null;
  }

  return (
    <>
      {showAndroidBanner && deferredPrompt && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-lg animate-slideDown">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                <img
                  src="/assets/demdem_icon_pwa.jpg"
                  alt="DemDem"
                  className="w-8 h-8 rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/logo-demdem.png';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">Installer DEM⇄DEM</p>
                <p className="text-xs text-white/90">Accédez rapidement à vos billets même hors-ligne</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleAndroidInstall}
                className="bg-white text-[#10B981] px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Installer
              </button>
              <button
                onClick={dismissAndroidBanner}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showIOSModal && isIOS && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slideUp">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-xl flex items-center justify-center">
                    <img
                      src="/assets/demdem_icon_pwa.jpg"
                      alt="DemDem"
                      className="w-10 h-10 rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/logo-demdem.png';
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Installer DEM⇄DEM</h3>
                    <p className="text-sm text-gray-600">Sur votre iPhone</p>
                  </div>
                </div>
                <button
                  onClick={dismissIOSModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <p className="text-sm text-gray-700">
                  Installez DEM⇄DEM sur votre écran d'accueil pour un accès rapide, même hors-ligne :
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-[#10B981] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        Appuyez sur le bouton Partager
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                          <Share className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-xs text-gray-600">
                          (En bas de votre navigateur Safari)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-[#10B981] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        Sélectionnez "Sur l'écran d'accueil"
                      </p>
                      <p className="text-xs text-gray-600">
                        Faites défiler et trouvez cette option dans le menu
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={dismissIOSModal}
                className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all"
              >
                J'ai compris
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallPrompt;
