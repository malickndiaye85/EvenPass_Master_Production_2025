import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scan, QrCode, CheckCircle, XCircle, Activity, Wifi, WifiOff,
  Clock, LogOut, TrendingUp, Shield, AlertTriangle
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { getControllerSession, clearControllerSession } from '../../lib/controllerAuthService';
import { recordScan, getEvent } from '../../lib/opsEventsFirebase';
import { firestore } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

interface ScanStats {
  validated: number;
  rejected: number;
  total: number;
}

interface ScanResult {
  type: 'validated' | 'rejected';
  message: string;
  details?: {
    name: string;
    email?: string;
    phone?: string;
    category?: string;
    price?: string;
  };
}

const ControllerEventsScanner: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [eventName, setEventName] = useState<string>('');
  const [stats, setStats] = useState<ScanStats>({ validated: 0, rejected: 0, total: 0 });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const currentSession = getControllerSession();
    if (!currentSession) {
      console.warn('[CONTROLLER SCANNER] Pas de session - redirection');
      navigate('/controller/login');
      return;
    }

    setSession(currentSession);
    console.log('[CONTROLLER SCANNER] Session chargée:', currentSession);

    // Charger le nom de l'événement
    loadEventName(currentSession.eventId);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      stopScanner();
    };
  }, []);

  const loadEventName = async (eventId: string) => {
    try {
      const event = await getEvent(eventId);
      if (event) {
        setEventName(event.name);
      }
    } catch (error) {
      console.error('[CONTROLLER SCANNER] Erreur chargement événement:', error);
    }
  };

  const vibrateDevice = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const flashScreen = (type: 'success' | 'error') => {
    const flashDiv = document.createElement('div');
    flashDiv.style.position = 'fixed';
    flashDiv.style.top = '0';
    flashDiv.style.left = '0';
    flashDiv.style.width = '100vw';
    flashDiv.style.height = '100vh';
    flashDiv.style.pointerEvents = 'none';
    flashDiv.style.zIndex = '9999';
    flashDiv.style.transition = 'opacity 0.3s ease-out';

    if (type === 'success') {
      flashDiv.style.backgroundColor = 'rgba(34, 197, 94, 0.4)';
    } else {
      flashDiv.style.backgroundColor = 'rgba(239, 68, 68, 0.4)';
    }

    document.body.appendChild(flashDiv);

    setTimeout(() => {
      flashDiv.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(flashDiv);
      }, 300);
    }, 200);
  };

  const handleScan = async (decodedText: string) => {
    try {
      console.log('[CONTROLLER SCANNER] Scan détecté:', decodedText);

      // Récupérer le billet depuis Firestore
      const ticketRef = doc(firestore, 'tickets', decodedText);
      const ticketSnap = await getDoc(ticketRef);

      if (!ticketSnap.exists()) {
        setStats(prev => ({ ...prev, rejected: prev.rejected + 1, total: prev.total + 1 }));
        setLastScanResult({
          type: 'rejected',
          message: 'Billet introuvable'
        });
        await recordScan(
          session.controllerId,
          session.controllerName,
          session.eventId,
          decodedText,
          true
        );
        flashScreen('error');
        vibrateDevice([100, 50, 100]);
        setTimeout(() => setLastScanResult(null), 3000);
        return;
      }

      const ticket = ticketSnap.data();

      // Vérifier l'événement
      if (ticket.eventId && ticket.eventId !== session.eventId) {
        setStats(prev => ({ ...prev, rejected: prev.rejected + 1, total: prev.total + 1 }));
        setLastScanResult({
          type: 'rejected',
          message: 'Billet pour un autre événement'
        });
        await recordScan(
          session.controllerId,
          session.controllerName,
          session.eventId,
          decodedText,
          true
        );
        flashScreen('error');
        vibrateDevice([100, 50, 100]);
        setTimeout(() => setLastScanResult(null), 3000);
        return;
      }

      // Vérifier si déjà scanné
      if (ticket.scanned) {
        const scannedDate = new Date(ticket.scannedAt).toLocaleString('fr-FR');
        setStats(prev => ({ ...prev, rejected: prev.rejected + 1, total: prev.total + 1 }));
        setLastScanResult({
          type: 'rejected',
          message: `Déjà scanné le ${scannedDate} par ${ticket.scannedBy}`
        });
        await recordScan(
          session.controllerId,
          session.controllerName,
          session.eventId,
          decodedText,
          true
        );
        flashScreen('error');
        vibrateDevice([100, 50, 100, 50, 100]);
        setTimeout(() => setLastScanResult(null), 3000);
        return;
      }

      // Billet valide - marquer comme scanné
      await updateDoc(ticketRef, {
        scanned: true,
        scannedAt: new Date().toISOString(),
        scannedBy: session.controllerName
      });

      // Enregistrer dans OPS Events
      await recordScan(
        session.controllerId,
        session.controllerName,
        session.eventId,
        decodedText,
        false,
        ticket.category || 'Standard',
        ticket.holderName || ticket.buyerName || 'N/A'
      );

      setStats(prev => ({ ...prev, validated: prev.validated + 1, total: prev.total + 1 }));
      setLastScanResult({
        type: 'validated',
        message: 'Accès Autorisé - Bienvenue',
        details: {
          name: ticket.holderName || ticket.buyerName || 'N/A',
          email: ticket.buyerEmail,
          phone: ticket.buyerPhone,
          category: ticket.category,
          price: ticket.price ? `${ticket.price.toLocaleString()} FCFA` : undefined
        }
      });

      flashScreen('success');
      vibrateDevice(200);
      setTimeout(() => setLastScanResult(null), 3000);

    } catch (error) {
      console.error('[CONTROLLER SCANNER] Erreur scan:', error);
      setStats(prev => ({ ...prev, rejected: prev.rejected + 1, total: prev.total + 1 }));
      setLastScanResult({
        type: 'rejected',
        message: 'Erreur système'
      });
      flashScreen('error');
      vibrateDevice([100, 50, 100, 50, 100]);
      setTimeout(() => setLastScanResult(null), 3000);
    }
  };

  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 300, height: 300 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          handleScan(decodedText);
        },
        () => {}
      );

      setIsScannerActive(true);
    } catch (err) {
      console.error('[CONTROLLER SCANNER] Erreur démarrage scanner:', err);
      alert('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        setIsScannerActive(false);
      } catch (err) {
        console.error('[CONTROLLER SCANNER] Erreur arrêt scanner:', err);
      }
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md border border-white/20 shadow-2xl">
          <Activity className="text-white mx-auto mb-4 animate-spin" size={48} />
          <p className="text-white text-center font-medium">
            Chargement de la session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B]" style={{ maxWidth: '375px', margin: '0 auto' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Shield className="text-white" size={24} />
            </div>
            <div>
              <div className="text-white font-black text-lg">
                {eventName || 'Chargement...'}
              </div>
              <div className="text-orange-100 text-sm font-medium">
                {session.controllerName} - {session.position}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (confirm('Voulez-vous vous déconnecter ?')) {
                  clearControllerSession();
                  navigate('/controller/login');
                }
              }}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
              title="Déconnexion"
            >
              <LogOut size={16} className="text-white" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-white text-xs bg-white/10 rounded-lg p-2">
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <>
                <Wifi size={14} className="text-green-300" />
                <span className="font-bold">En ligne</span>
              </>
            ) : (
              <>
                <WifiOff size={14} className="text-red-300" />
                <span className="font-bold">Hors ligne</span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Clock size={14} />
            <span className="font-bold">
              {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div
          id="qr-reader"
          className="w-full bg-black rounded-3xl overflow-hidden border-4 border-orange-500 scanner-glow"
          style={{ height: '420px' }}
        ></div>

        {!isScannerActive && (
          <button
            onClick={startScanner}
            className="w-full py-5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-lg rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-xl transform active:scale-95"
          >
            <Scan size={32} />
            <span>DÉMARRER LE SCANNER</span>
          </button>
        )}

        {isScannerActive && (
          <button
            onClick={stopScanner}
            className="w-full py-5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-black text-lg rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-xl transform active:scale-95"
          >
            <XCircle size={32} />
            <span>ARRÊTER LE SCANNER</span>
          </button>
        )}

        {lastScanResult && (
          <div
            className={`p-5 rounded-2xl border-4 ${
              lastScanResult.type === 'validated'
                ? 'bg-green-500/30 border-green-400'
                : 'bg-red-500/30 border-red-400'
            } animate-pulse shadow-2xl`}
          >
            <div className="flex items-center justify-center space-x-3 mb-3">
              {lastScanResult.type === 'validated' ? (
                <CheckCircle className="text-green-300" size={36} />
              ) : (
                <XCircle className="text-red-300" size={36} />
              )}
              <span
                className={`font-black text-2xl ${
                  lastScanResult.type === 'validated' ? 'text-green-100' : 'text-red-100'
                }`}
              >
                {lastScanResult.message}
              </span>
            </div>
            {lastScanResult.details && (
              <div className="bg-black/30 rounded-xl p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">Nom:</span>
                  <span className="text-white font-bold">{lastScanResult.details.name}</span>
                </div>
                {lastScanResult.details.category && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Catégorie:</span>
                    <span className="text-white font-bold">{lastScanResult.details.category}</span>
                  </div>
                )}
                {lastScanResult.details.price && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Prix:</span>
                    <span className="text-white font-bold">{lastScanResult.details.price}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-4 border-green-400 rounded-2xl p-5 text-center">
            <CheckCircle className="mx-auto text-green-400 mb-3" size={32} />
            <div className="text-green-300 text-xs font-black uppercase mb-2">Validé</div>
            <div className="text-green-100 text-5xl font-black">{stats.validated}</div>
          </div>

          <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 border-4 border-red-400 rounded-2xl p-5 text-center">
            <XCircle className="mx-auto text-red-400 mb-3" size={32} />
            <div className="text-red-300 text-xs font-black uppercase mb-2">Refusé</div>
            <div className="text-red-100 text-5xl font-black">{stats.rejected}</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-4 border-orange-400 rounded-2xl p-5 text-center">
            <TrendingUp className="mx-auto text-orange-400 mb-3" size={32} />
            <div className="text-orange-300 text-xs font-black uppercase mb-2">Total</div>
            <div className="text-orange-100 text-5xl font-black">{stats.total}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControllerEventsScanner;
