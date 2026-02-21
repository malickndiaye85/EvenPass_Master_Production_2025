import React, { useState, useEffect, useRef } from 'react';
import {
  Scan, QrCode, CheckCircle, XCircle, Activity, WifiOff, Wifi,
  Battery, AlertTriangle, Clock, Bus, LogOut, TrendingUp
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import {
  getVehicleSession,
  clearVehicleSession,
  recordVehicleScan,
  type VehicleSession
} from '../../lib/vehicleAuthService';

interface ScanStats {
  validated: number;
  rejected: number;
  total: number;
}

interface PendingScan {
  id: string;
  timestamp: string;
  passData: any;
  result: 'validated' | 'rejected';
  reason?: string;
  location?: GeolocationCoordinates;
}

interface PassData {
  userId: string;
  subscriptionType: string;
  line: string;
  grade: string;
  expiresAt: string;
  lastScan?: string;
  signature: string;
}

const EPscanVPage: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<VehicleSession | null>(null);
  const [stats, setStats] = useState<ScanStats>({ validated: 0, rejected: 0, total: 0 });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingScans, setPendingScans] = useState<PendingScan[]>([]);
  const [lastScanResult, setLastScanResult] = useState<{ type: 'validated' | 'rejected'; message: string } | null>(null);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [brightness, setBrightness] = useState<'high' | 'low'>('high');
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const locationIntervalRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);
  const dbRef = useRef<any>(null);

  useEffect(() => {
    const currentSession = getVehicleSession();
    if (!currentSession) {
      console.warn('[EPSCANV] Pas de session véhicule - redirection');
      navigate('/controller/login');
      return;
    }

    setSession(currentSession);
    console.log('[EPSCANV] Session véhicule chargée:', currentSession);

    initializeIndexedDB();
    loadPendingScans();
    requestWakeLock();
    startLocationTracking();
    monitorBattery();

    const handleOnline = () => {
      setIsOnline(true);
      syncPendingScans();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const activityInterval = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity;
      if (timeSinceLastActivity > 120000 && brightness === 'high') {
        setBrightness('low');
      }
    }, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
      clearInterval(activityInterval);
      releaseWakeLock();
      stopScanner();
    };
  }, []);

  const initializeIndexedDB = () => {
    const request = indexedDB.open('EPscanVDB', 1);

    request.onerror = () => console.error('IndexedDB error');

    request.onsuccess = (event: any) => {
      dbRef.current = event.target.result;
      console.log('IndexedDB initialized');
    };

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingScans')) {
        db.createObjectStore('pendingScans', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('scannedPasses')) {
        db.createObjectStore('scannedPasses', { keyPath: 'passId' });
      }
    };
  };

  const loadPendingScans = async () => {
    if (!dbRef.current) return;

    const transaction = dbRef.current.transaction(['pendingScans'], 'readonly');
    const store = transaction.objectStore('pendingScans');
    const request = store.getAll();

    request.onsuccess = () => {
      setPendingScans(request.result);
    };
  };

  const savePendingScan = async (scan: PendingScan) => {
    if (!dbRef.current) return;

    const transaction = dbRef.current.transaction(['pendingScans'], 'readwrite');
    const store = transaction.objectStore('pendingScans');
    store.add(scan);

    setPendingScans(prev => [...prev, scan]);
  };

  const clearPendingScan = async (scanId: string) => {
    if (!dbRef.current) return;

    const transaction = dbRef.current.transaction(['pendingScans'], 'readwrite');
    const store = transaction.objectStore('pendingScans');
    store.delete(scanId);

    setPendingScans(prev => prev.filter(s => s.id !== scanId));
  };

  const checkPassback = async (passId: string): Promise<boolean> => {
    if (!dbRef.current) return false;

    const transaction = dbRef.current.transaction(['scannedPasses'], 'readonly');
    const store = transaction.objectStore('scannedPasses');
    const request = store.get(passId);

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const timeSinceLastScan = Date.now() - new Date(result.lastScan).getTime();
          const cooldownPeriod = 2 * 60 * 60 * 1000;
          resolve(timeSinceLastScan < cooldownPeriod);
        } else {
          resolve(false);
        }
      };

      request.onerror = () => resolve(false);
    });
  };

  const recordPassScan = async (passId: string) => {
    if (!dbRef.current) return;

    const transaction = dbRef.current.transaction(['scannedPasses'], 'readwrite');
    const store = transaction.objectStore('scannedPasses');
    store.put({ passId, lastScan: new Date().toISOString() });
  };

  const validatePass = async (passData: PassData): Promise<{ valid: boolean; reason?: string }> => {
    const now = new Date();
    const expiresAt = new Date(passData.expiresAt);

    if (expiresAt < now) {
      return { valid: false, reason: 'Pass expiré' };
    }

    if (session?.route && passData.line) {
      if (passData.line !== session.route) {
        return { valid: false, reason: `Pass valide pour ${passData.line}, pas ${session.route}` };
      }
    }

    const isPassback = await checkPassback(passData.userId);
    if (isPassback) {
      return { valid: false, reason: 'Double scan détecté (Cooldown 2h)' };
    }

    return { valid: true };
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
      flashDiv.style.backgroundColor = 'rgba(16, 185, 129, 0.4)';
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
    setLastActivity(Date.now());
    if (brightness === 'low') setBrightness('high');

    try {
      const passData: PassData = JSON.parse(decodedText);

      const validation = await validatePass(passData);

      const scanResult: PendingScan = {
        id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        passData,
        result: validation.valid ? 'validated' : 'rejected',
        reason: validation.reason,
        location: await getCurrentLocation()
      };

      if (validation.valid) {
        await recordPassScan(passData.userId);
        setStats(prev => ({ validated: prev.validated + 1, rejected: prev.rejected, total: prev.total + 1 }));
        setLastScanResult({ type: 'validated', message: '✅ Pass Validé' });
        playSuccessSound();
        flashScreen('success');
        vibrateDevice(200);
      } else {
        setStats(prev => ({ validated: prev.validated, rejected: prev.rejected + 1, total: prev.total + 1 }));
        setLastScanResult({ type: 'rejected', message: `❌ ${validation.reason}` });
        playErrorSound();
        flashScreen('error');
        vibrateDevice([100, 50, 100]);
      }

      if (isOnline) {
        await recordVehicleScan({
          passData,
          result: scanResult.result,
          reason: scanResult.reason,
          location: scanResult.location ? {
            latitude: scanResult.location.latitude,
            longitude: scanResult.location.longitude
          } : undefined
        });
        console.log('[EPSCANV] ✅ Scan synchronisé en temps réel');
      } else {
        await savePendingScan(scanResult);
        console.log('[EPSCANV] 💾 Scan sauvegardé localement');
      }

      setTimeout(() => setLastScanResult(null), 3000);
    } catch (error) {
      console.error('Erreur scan:', error);
      setLastScanResult({ type: 'rejected', message: '❌ QR Code invalide' });
      playErrorSound();
      flashScreen('error');
      vibrateDevice([100, 50, 100, 50, 100]);
      setTimeout(() => setLastScanResult(null), 3000);
    }
  };

  const syncPendingScans = async () => {
    if (!isOnline || pendingScans.length === 0) return;

    console.log(`🔄 Synchronisation de ${pendingScans.length} scans...`);

    for (const scan of pendingScans) {
      try {
        await recordVehicleScan({
          passData: scan.passData,
          result: scan.result,
          reason: scan.reason,
          location: scan.location ? {
            latitude: scan.location.latitude,
            longitude: scan.location.longitude
          } : undefined
        });
        await clearPendingScan(scan.id);
      } catch (error) {
        console.error('Erreur sync scan:', scan.id, error);
      }
    }
  };

  const getCurrentLocation = (): Promise<GeolocationCoordinates | undefined> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(undefined);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position.coords),
        () => resolve(undefined),
        { timeout: 5000, enableHighAccuracy: false }
      );
    });
  };

  const startLocationTracking = () => {
    if (!session?.vehicleId) return;

    locationIntervalRef.current = window.setInterval(async () => {
      const coords = await getCurrentLocation();

      if (coords && isOnline) {
        console.log('[EPSCANV] GPS:', coords.latitude, coords.longitude);
      }
    }, 30000);
  };

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        console.log('✅ Wake Lock activé');
      } catch (err) {
        console.error('❌ Wake Lock non disponible:', err);
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  const monitorBattery = async () => {
    if ('getBattery' in navigator) {
      const battery: any = await (navigator as any).getBattery();
      setBatteryLevel(battery.level * 100);

      battery.addEventListener('levelchange', () => {
        setBatteryLevel(battery.level * 100);
      });
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
        (errorMessage) => {
        }
      );

      setIsScannerActive(true);
    } catch (err) {
      console.error('Erreur démarrage scanner:', err);
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
        console.error('Erreur arrêt scanner:', err);
      }
    }
  };

  const playSuccessSound = () => {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  const playErrorSound = () => {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 200;
    oscillator.type = 'sawtooth';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
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
    <div
      className={`min-h-screen ${brightness === 'high' ? 'bg-[#0A0A0B]' : 'bg-[#050505]'} transition-colors duration-500`}
      style={{ maxWidth: '375px', margin: '0 auto' }}
    >
      {/* Header avec informations du véhicule */}
      <div className="bg-gradient-to-r from-[#10B981] to-[#059669] p-4 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Bus className="text-white" size={24} />
            </div>
            <div>
              <div className="text-white font-black text-lg">
                Navette {session.vehicleNumber}
              </div>
              <div className="text-green-100 text-sm font-medium">
                {session.route}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (confirm('Voulez-vous vous déconnecter ?')) {
                  clearVehicleSession();
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
          {batteryLevel !== null && (
            <div className="flex items-center space-x-1">
              <Battery size={14} />
              <span className="font-bold">{Math.round(batteryLevel)}%</span>
            </div>
          )}
        </div>

        {pendingScans.length > 0 && (
          <div className="mt-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-2 flex items-center space-x-2">
            <Clock size={14} className="text-yellow-300" />
            <span className="text-yellow-300 text-xs font-medium">
              {pendingScans.length} scan(s) en attente de sync
            </span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        <div
          id="qr-reader"
          className="w-full bg-black rounded-3xl overflow-hidden border-4 border-[#10B981] scanner-glow"
          style={{ height: '420px' }}
        ></div>

        {!isScannerActive && (
          <button
            onClick={startScanner}
            className="w-full py-5 bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-black text-lg rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-xl transform active:scale-95"
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
            <div className="flex items-center justify-center space-x-3">
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
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-4 border-green-400 rounded-2xl p-5 text-center stat-card-glow">
            <CheckCircle className="mx-auto text-green-400 mb-3 drop-shadow-lg" size={32} />
            <div className="text-green-300 text-xs font-black uppercase tracking-wider mb-2 text-shadow-strong">Validé</div>
            <div className="text-green-100 text-5xl font-black text-shadow-strong">{stats.validated}</div>
          </div>

          <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 border-4 border-red-400 rounded-2xl p-5 text-center stat-card-glow">
            <XCircle className="mx-auto text-red-400 mb-3 drop-shadow-lg" size={32} />
            <div className="text-red-300 text-xs font-black uppercase tracking-wider mb-2 text-shadow-strong">Refusé</div>
            <div className="text-red-100 text-5xl font-black text-shadow-strong">{stats.rejected}</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-4 border-blue-400 rounded-2xl p-5 text-center stat-card-glow">
            <TrendingUp className="mx-auto text-blue-400 mb-3 drop-shadow-lg" size={32} />
            <div className="text-blue-300 text-xs font-black uppercase tracking-wider mb-2 text-shadow-strong">Total</div>
            <div className="text-blue-100 text-5xl font-black text-shadow-strong">{stats.total}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EPscanVPage;
