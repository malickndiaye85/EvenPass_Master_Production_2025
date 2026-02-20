import React, { useState, useEffect, useRef } from 'react';
import {
  Scan, QrCode, CheckCircle, XCircle, Activity, WifiOff, Wifi,
  MapPin, Battery, Sun, Moon, AlertTriangle, Clock, User, Bus
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { ref, update, push, onValue, get } from 'firebase/database';
import { db } from '../../firebase';
import { useAuth } from '../../context/FirebaseAuthContext';

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

interface ControllerInfo {
  name: string;
  line: string;
  vehicleId: string;
}

const EPscanVPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ScanStats>({ validated: 0, rejected: 0, total: 0 });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingScans, setPendingScans] = useState<PendingScan[]>([]);
  const [lastScanResult, setLastScanResult] = useState<{ type: 'validated' | 'rejected'; message: string } | null>(null);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [brightness, setBrightness] = useState<'high' | 'low'>('high');
  const [controllerInfo, setControllerInfo] = useState<ControllerInfo | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const locationIntervalRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);
  const dbRef = useRef<any>(null);

  useEffect(() => {
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

  useEffect(() => {
    if (user && db) {
      const controllerRef = ref(db, `controllers/${user.uid}`);
      onValue(controllerRef, (snapshot) => {
        if (snapshot.exists()) {
          setControllerInfo(snapshot.val());
        }
      });
    }
  }, [user]);

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

    if (controllerInfo && passData.line !== controllerInfo.line) {
      return { valid: false, reason: `Pass valide pour ${passData.line}, pas ${controllerInfo.line}` };
    }

    const isPassback = await checkPassback(passData.userId);
    if (isPassback) {
      return { valid: false, reason: 'Double scan détecté (Cooldown 2h)' };
    }

    return { valid: true };
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
      } else {
        setStats(prev => ({ validated: prev.validated, rejected: prev.rejected + 1, total: prev.total + 1 }));
        setLastScanResult({ type: 'rejected', message: `❌ ${validation.reason}` });
        playErrorSound();
      }

      if (isOnline && db) {
        await syncScanToFirebase(scanResult);
      } else {
        await savePendingScan(scanResult);
      }

      setTimeout(() => setLastScanResult(null), 3000);
    } catch (error) {
      console.error('Erreur scan:', error);
      setLastScanResult({ type: 'rejected', message: '❌ QR Code invalide' });
      playErrorSound();
      setTimeout(() => setLastScanResult(null), 3000);
    }
  };

  const syncScanToFirebase = async (scan: PendingScan) => {
    if (!db || !controllerInfo) return;

    try {
      const tripsRef = ref(db, 'trips');
      await push(tripsRef, {
        controller_id: user?.uid,
        controller_name: controllerInfo.name,
        vehicle_id: controllerInfo.vehicleId,
        line: controllerInfo.line,
        passenger_id: scan.passData.userId,
        subscription_type: scan.passData.subscriptionType,
        grade: scan.passData.grade,
        result: scan.result,
        reason: scan.reason,
        timestamp: scan.timestamp,
        location: scan.location ? {
          latitude: scan.location.latitude,
          longitude: scan.location.longitude
        } : null
      });

      const statsRef = ref(db, `controller_stats/${user?.uid}/${new Date().toISOString().split('T')[0]}`);
      const statsSnapshot = await get(statsRef);
      const currentStats = statsSnapshot.exists() ? statsSnapshot.val() : { validated: 0, rejected: 0, total: 0 };

      await update(statsRef, {
        validated: currentStats.validated + (scan.result === 'validated' ? 1 : 0),
        rejected: currentStats.rejected + (scan.result === 'rejected' ? 1 : 0),
        total: currentStats.total + 1
      });
    } catch (error) {
      console.error('Erreur sync Firebase:', error);
      await savePendingScan(scan);
    }
  };

  const syncPendingScans = async () => {
    if (!isOnline || pendingScans.length === 0) return;

    console.log(`🔄 Synchronisation de ${pendingScans.length} scans...`);

    for (const scan of pendingScans) {
      try {
        await syncScanToFirebase(scan);
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
    if (!controllerInfo?.vehicleId) return;

    locationIntervalRef.current = window.setInterval(async () => {
      const coords = await getCurrentLocation();

      if (coords && db && controllerInfo) {
        const locationRef = ref(db, `live/positions/${controllerInfo.vehicleId}`);
        try {
          await update(locationRef, {
            latitude: coords.latitude,
            longitude: coords.longitude,
            timestamp: new Date().toISOString(),
            speed: coords.speed || 0,
            controller_id: user?.uid
          });
        } catch (error) {
          console.error('Erreur envoi GPS:', error);
        }
      }
    }, 15000);
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
          qrbox: { width: 250, height: 250 },
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

  return (
    <div
      className={`min-h-screen ${brightness === 'high' ? 'bg-[#0A0A0B]' : 'bg-[#050505]'} transition-colors duration-500`}
      style={{ maxWidth: '375px', margin: '0 auto' }}
    >
      <div className="bg-gradient-to-r from-[#10B981] to-[#059669] p-4 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Bus className="text-white" size={20} />
            <div>
              <div className="text-white font-black text-lg">{controllerInfo?.line || 'Chargement...'}</div>
              <div className="text-green-100 text-xs">{controllerInfo?.name || 'Contrôleur'}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <div className="flex items-center space-x-1 bg-white/20 px-2 py-1 rounded-full">
                <Wifi size={14} className="text-white" />
                <span className="text-white text-xs font-bold">ON</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 bg-red-500/30 px-2 py-1 rounded-full border border-red-500">
                <WifiOff size={14} className="text-red-300" />
                <span className="text-red-300 text-xs font-bold">OFF</span>
              </div>
            )}
            {batteryLevel !== null && (
              <div className="flex items-center space-x-1 bg-white/20 px-2 py-1 rounded-full">
                <Battery size={14} className="text-white" />
                <span className="text-white text-xs font-bold">{Math.round(batteryLevel)}%</span>
              </div>
            )}
          </div>
        </div>

        {pendingScans.length > 0 && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-2 flex items-center space-x-2">
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
          className="w-full aspect-square bg-black rounded-2xl overflow-hidden border-4 border-[#10B981] shadow-2xl"
        ></div>

        {!isScannerActive && (
          <button
            onClick={startScanner}
            className="w-full py-4 bg-[#10B981] hover:bg-[#059669] text-white font-black rounded-2xl flex items-center justify-center space-x-2 transition-colors shadow-lg"
          >
            <Scan size={24} />
            <span>Démarrer le Scanner</span>
          </button>
        )}

        {isScannerActive && (
          <button
            onClick={stopScanner}
            className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl flex items-center justify-center space-x-2 transition-colors shadow-lg"
          >
            <XCircle size={24} />
            <span>Arrêter le Scanner</span>
          </button>
        )}

        {lastScanResult && (
          <div
            className={`p-4 rounded-2xl border-2 ${
              lastScanResult.type === 'validated'
                ? 'bg-green-500/20 border-green-500'
                : 'bg-red-500/20 border-red-500'
            } animate-pulse`}
          >
            <div className="flex items-center space-x-2">
              {lastScanResult.type === 'validated' ? (
                <CheckCircle className="text-green-400" size={24} />
              ) : (
                <XCircle className="text-red-400" size={24} />
              )}
              <span
                className={`font-bold text-lg ${
                  lastScanResult.type === 'validated' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {lastScanResult.message}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-500/10 border-2 border-green-500 rounded-2xl p-4 text-center">
            <CheckCircle className="mx-auto text-green-400 mb-2" size={20} />
            <div className="text-green-400 text-xs font-medium uppercase mb-1">Validé</div>
            <div className="text-green-400 text-5xl font-black">{stats.validated}</div>
          </div>

          <div className="bg-red-500/10 border-2 border-red-500 rounded-2xl p-4 text-center">
            <XCircle className="mx-auto text-red-400 mb-2" size={20} />
            <div className="text-red-400 text-xs font-medium uppercase mb-1">Refusé</div>
            <div className="text-red-400 text-5xl font-black">{stats.rejected}</div>
          </div>

          <div className="bg-blue-500/10 border-2 border-blue-500 rounded-2xl p-4 text-center">
            <Activity className="mx-auto text-blue-400 mb-2" size={20} />
            <div className="text-blue-400 text-xs font-medium uppercase mb-1">Total</div>
            <div className="text-blue-400 text-5xl font-black">{stats.total}</div>
          </div>
        </div>

        <div className="bg-[#1E1E1E] rounded-2xl p-4 border border-gray-800">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="text-yellow-400" size={16} />
            <h3 className="text-white font-bold text-sm">Règles de Validation</h3>
          </div>
          <ul className="space-y-2 text-gray-400 text-xs">
            <li className="flex items-start space-x-2">
              <span className="text-[#10B981]">•</span>
              <span>Le pass ne doit pas être expiré</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-[#10B981]">•</span>
              <span>La ligne doit correspondre ({controllerInfo?.line || 'N/A'})</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-[#10B981]">•</span>
              <span>Cooldown anti-passback: 2 heures</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-[#10B981]">•</span>
              <span>Signature JWT vérifiée localement</span>
            </li>
          </ul>
        </div>

        {brightness === 'low' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex items-center space-x-3">
            <Moon className="text-yellow-400" size={24} />
            <div>
              <div className="text-yellow-400 font-bold text-sm">Mode Économie d'Énergie</div>
              <div className="text-yellow-300 text-xs">Luminosité réduite après 2 min d'inactivité</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EPscanVPage;
