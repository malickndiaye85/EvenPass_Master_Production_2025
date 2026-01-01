import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  CheckCircle,
  XCircle,
  Shield,
  MapPin,
  AlertTriangle,
  Activity,
  User,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  Keyboard,
  Camera,
  X,
  Wifi,
  WifiOff,
  Loader2,
  Info
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ScanResult {
  success: boolean;
  message: string;
  ticket_reference: string;
  timestamp: string;
  zone_name: string | null;
  zone_color: string | null;
  access_gate: string | null;
  holder_name: string | null;
  holder_phone: string | null;
  holder_email: string | null;
  first_scan_time: string | null;
  price_paid: number | null;
  event_title: string | null;
  scan_location?: string | null;
}

interface ScanStats {
  totalScans: number;
  validScans: number;
  invalidScans: number;
}

export default function EPscanPage() {
  const [loading, setLoading] = useState(true);
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera');
  const [scanInput, setScanInput] = useState('');
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [showFlash, setShowFlash] = useState<'success' | 'error' | null>(null);
  const [showArbitrationModal, setShowArbitrationModal] = useState(false);
  const [scanStats, setScanStats] = useState<ScanStats>({ totalScans: 0, validScans: 0, invalidScans: 0 });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [currentGate, setCurrentGate] = useState<string>('Gate A');
  const [isProcessingScan, setIsProcessingScan] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastScanTimeRef = useRef<number>(0);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializePage();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (scanMode === 'camera') {
      setTimeout(() => startCamera(), 500);
    } else {
      stopCamera();
    }
  }, [scanMode]);

  const initializePage = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const eventId = params.get('eventId') || localStorage.getItem('epscan_event_id');
      const gate = params.get('gate') || localStorage.getItem('epscan_gate') || 'Gate A';

      if (eventId) {
        localStorage.setItem('epscan_event_id', eventId);
        localStorage.setItem('epscan_gate', gate);

        const { data: event } = await supabase
          .from('events')
          .select('*')
          .eq('event_id', eventId)
          .maybeSingle();

        if (event) {
          setCurrentEvent(event);
        }
      }

      setCurrentGate(gate);
      loadStats();
    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = () => {
    const saved = localStorage.getItem('epscan_stats');
    if (saved) {
      try {
        setScanStats(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading stats:', e);
      }
    }
  };

  const saveStats = (stats: ScanStats) => {
    localStorage.setItem('epscan_stats', JSON.stringify(stats));
    setScanStats(stats);
  };

  const startCamera = async () => {
    try {
      setCameraError(null);

      if (!scannerContainerRef.current) {
        console.error('Scanner container not found');
        return;
      }

      if (html5QrCodeRef.current) {
        await stopCamera();
      }

      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          if (isProcessingScan) {
            return;
          }
          const now = Date.now();
          if (now - lastScanTimeRef.current < 2000) {
            return;
          }
          lastScanTimeRef.current = now;
          handleScan(decodedText);
        },
        undefined
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError('Erreur caméra. Veuillez autoriser l\'accès ou utiliser le mode manuel.');
      setIsScanning(false);
    }
  };

  const stopCamera = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      }
      html5QrCodeRef.current = null;
      setIsScanning(false);
    } catch (err) {
      console.error('Error stopping camera:', err);
    }
  };

  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const playSound = (frequency: number, duration: number, count: number = 1) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      for (let i = 0; i < count; i++) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        const startTime = audioContext.currentTime + (i * (duration + 100) / 1000);
        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration / 1000);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration / 1000);
      }
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  const handleScan = async (qrCode: string) => {
    if (!qrCode.trim() || isProcessingScan) return;

    setIsProcessingScan(true);
    const startTime = Date.now();
    const trimmedCode = qrCode.trim();

    try {
      const eventId = localStorage.getItem('epscan_event_id');

      if (!eventId) {
        showError('Événement non configuré');
        return;
      }

      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          *,
          ticket_types (
            type_name,
            zone_name,
            zone_color,
            access_gate,
            ticket_price
          ),
          events (
            event_title,
            event_date,
            venue
          )
        `)
        .eq('qr_code', trimmedCode)
        .eq('event_id', eventId)
        .maybeSingle();

      if (ticketError || !ticket) {
        processScanResult({
          success: false,
          message: 'Billet introuvable',
          ticket_reference: trimmedCode,
          timestamp: new Date().toISOString(),
          zone_name: null,
          zone_color: null,
          access_gate: null,
          holder_name: null,
          holder_phone: null,
          holder_email: null,
          first_scan_time: null,
          price_paid: null,
          event_title: null,
        }, startTime);
        return;
      }

      const { data: existingScan } = await supabase
        .from('ticket_scans')
        .select('*')
        .eq('ticket_id', ticket.ticket_id)
        .order('scanned_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (existingScan) {
        processScanResult({
          success: false,
          message: 'Billet déjà scanné',
          ticket_reference: ticket.ticket_number || trimmedCode,
          timestamp: new Date().toISOString(),
          zone_name: ticket.ticket_types?.zone_name || null,
          zone_color: ticket.ticket_types?.zone_color || null,
          access_gate: ticket.ticket_types?.access_gate || null,
          holder_name: ticket.buyer_name || null,
          holder_phone: ticket.buyer_phone || null,
          holder_email: ticket.buyer_email || null,
          first_scan_time: existingScan.scanned_at,
          price_paid: ticket.ticket_types?.ticket_price || null,
          event_title: ticket.events?.event_title || null,
          scan_location: existingScan.scan_location || null,
        }, startTime);
        return;
      }

      const { error: scanError } = await supabase
        .from('ticket_scans')
        .insert({
          ticket_id: ticket.ticket_id,
          scan_location: currentGate,
          scanned_at: new Date().toISOString(),
        });

      if (scanError) {
        console.error('Scan insert error:', scanError);
        showError('Erreur lors de l\'enregistrement du scan');
        return;
      }

      processScanResult({
        success: true,
        message: 'Billet valide',
        ticket_reference: ticket.ticket_number || trimmedCode,
        timestamp: new Date().toISOString(),
        zone_name: ticket.ticket_types?.zone_name || null,
        zone_color: ticket.ticket_types?.zone_color || null,
        access_gate: ticket.ticket_types?.access_gate || null,
        holder_name: ticket.buyer_name || null,
        holder_phone: ticket.buyer_phone || null,
        holder_email: ticket.buyer_email || null,
        first_scan_time: null,
        price_paid: ticket.ticket_types?.ticket_price || null,
        event_title: ticket.events?.event_title || null,
      }, startTime);

    } catch (error) {
      console.error('Scan error:', error);
      showError('Erreur de validation');
    } finally {
      setTimeout(() => setIsProcessingScan(false), 2000);
    }
  };

  const showError = (message: string) => {
    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current);
    }

    setLastScanResult({
      success: false,
      message,
      ticket_reference: '',
      timestamp: new Date().toISOString(),
      zone_name: null,
      zone_color: null,
      access_gate: null,
      holder_name: null,
      holder_phone: null,
      holder_email: null,
      first_scan_time: null,
      price_paid: null,
      event_title: null,
    });
    setShowFlash('error');
    vibrate([300, 100, 300]);
    playSound(400, 200, 2);
    flashTimeoutRef.current = setTimeout(() => {
      setShowFlash(null);
      flashTimeoutRef.current = null;
    }, 1500);
  };

  const processScanResult = (result: ScanResult, startTime: number) => {
    const scanDuration = Date.now() - startTime;
    console.log(`⚡ Scan completed in ${scanDuration}ms`);

    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current);
    }

    const newStats: ScanStats = {
      totalScans: scanStats.totalScans + 1,
      validScans: scanStats.validScans + (result.success ? 1 : 0),
      invalidScans: scanStats.invalidScans + (result.success ? 0 : 1),
    };
    saveStats(newStats);

    setLastScanResult(result);
    setScanInput('');

    if (result.success) {
      setShowFlash('success');
      vibrate(200);
      playSound(1200, 100);
      flashTimeoutRef.current = setTimeout(() => {
        setShowFlash(null);
        flashTimeoutRef.current = null;
      }, 1500);
      setTimeout(() => setLastScanResult(null), 5000);
    } else {
      setShowFlash('error');
      vibrate([300, 100, 300]);
      playSound(400, 200, 2);
      flashTimeoutRef.current = setTimeout(() => {
        setShowFlash(null);
        flashTimeoutRef.current = null;
      }, 1500);
      setTimeout(() => setLastScanResult(null), 8000);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scanInput.trim()) {
      handleScan(scanInput);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (showFlash) {
    return (
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ${
          showFlash === 'success' ? 'bg-green-500' : 'bg-red-600'
        }`}
      >
        <div className="text-center animate-pulse">
          {showFlash === 'success' ? (
            <CheckCircle className="w-32 h-32 text-white mx-auto mb-6" strokeWidth={3} />
          ) : (
            <XCircle className="w-32 h-32 text-white mx-auto mb-6" strokeWidth={3} />
          )}
          <h1 className="text-5xl font-black text-white">
            {showFlash === 'success' ? 'VALIDÉ' : 'REFUSÉ'}
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-4 py-4 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
              isOnline
                ? 'bg-green-500/20 border border-green-400/50'
                : 'bg-yellow-500/20 border border-yellow-400/50'
            }`}
          >
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-yellow-400" />
            )}
            <span className="text-xs text-white font-bold">
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs text-white/90 font-medium">
              {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <button
              onClick={() => {
                if (confirm('Voulez-vous terminer votre session de scan ?')) {
                  localStorage.removeItem('epscan_event_id');
                  localStorage.removeItem('epscan_gate');
                  window.location.href = '/';
                }
              }}
              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-400/50 rounded-full transition-all"
              title="Terminer la session"
            >
              <span className="text-xs text-white font-bold">OFF</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-black text-white tracking-tight">EPscan</h1>
          <div className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/30">
            <span className="text-sm font-bold text-white">{currentGate}</span>
          </div>
        </div>

        {currentEvent && (
          <p className="text-sm text-white/95 font-medium">
            {currentEvent.event_title} • {currentEvent.venue} • {new Date(currentEvent.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </p>
        )}
      </div>

      <div className="px-4 py-6 grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur-sm border-2 border-green-500 rounded-2xl p-4 text-center shadow-lg shadow-green-500/20">
          <div className="text-4xl font-bold text-green-500 mb-1">{scanStats.validScans}</div>
          <div className="text-xs text-green-400 font-bold uppercase tracking-wide">Validés</div>
        </div>

        <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 backdrop-blur-sm border-2 border-red-500 rounded-2xl p-4 text-center shadow-lg shadow-red-500/20">
          <div className="text-4xl font-bold text-red-500 mb-1">{scanStats.invalidScans}</div>
          <div className="text-xs text-red-400 font-bold uppercase tracking-wide">Refusés</div>
        </div>

        <div className="bg-gradient-to-br from-gray-500/20 to-gray-600/10 backdrop-blur-sm border-2 border-gray-500 rounded-2xl p-4 text-center shadow-lg shadow-gray-500/20">
          <div className="text-4xl font-bold text-gray-400 mb-1">{scanStats.totalScans}</div>
          <div className="text-xs text-gray-400 font-bold uppercase tracking-wide">Total</div>
        </div>
      </div>

      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setScanMode('camera')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
              scanMode === 'camera'
                ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/50'
                : 'bg-gray-900 text-gray-500 hover:bg-gray-800 border border-gray-800'
            }`}
          >
            <Camera className="w-5 h-5" />
            Auto
          </button>

          <button
            onClick={() => setScanMode('manual')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
              scanMode === 'manual'
                ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/50'
                : 'bg-gray-900 text-gray-500 hover:bg-gray-800 border border-gray-800'
            }`}
          >
            <Keyboard className="w-5 h-5" />
            Manuel
          </button>
        </div>
      </div>

      {scanMode === 'camera' && (
        <div className="px-4 mb-6">
          <div className="relative bg-gray-900 border-4 border-orange-500 rounded-3xl overflow-hidden shadow-2xl shadow-orange-500/30">
            <div id="qr-reader" ref={scannerContainerRef} className="w-full aspect-square" />

            {!isScanning && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
                  <p className="text-white font-semibold">Démarrage caméra...</p>
                </div>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-6">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                  <p className="text-white font-semibold mb-4">{cameraError}</p>
                  <button
                    onClick={() => setScanMode('manual')}
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors"
                  >
                    Mode Manuel
                  </button>
                </div>
              </div>
            )}
          </div>

          {isScanning && (
            <p className="text-center text-gray-400 text-sm mt-4 font-medium">
              Positionnez le QR code dans le cadre
            </p>
          )}
        </div>
      )}

      {scanMode === 'manual' && (
        <div className="px-4 mb-6">
          <div className="bg-gray-900 border-2 border-gray-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-orange-500" />
              Saisie Manuelle du Billet
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Pour billets endommagés ou QR code illisible
            </p>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <input
                ref={inputRef}
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Entrez le code du billet..."
                className="w-full px-4 py-3 bg-black border-2 border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 font-mono transition-colors"
                autoFocus
              />
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all shadow-lg shadow-orange-500/30"
              >
                Valider le Scan
              </button>
            </form>
          </div>
        </div>
      )}

      {lastScanResult && (
        <div className="px-4 mb-6">
          <div
            className={`border-2 rounded-2xl overflow-hidden shadow-2xl ${
              lastScanResult.success
                ? 'bg-green-500/10 border-green-500 shadow-green-500/30'
                : 'bg-red-500/10 border-red-500 shadow-red-500/30'
            }`}
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                {lastScanResult.success ? (
                  <CheckCircle className="w-12 h-12 text-green-500 flex-shrink-0" strokeWidth={3} />
                ) : (
                  <XCircle className="w-12 h-12 text-red-500 flex-shrink-0" strokeWidth={3} />
                )}
                <div className="flex-1">
                  <p className={`text-xl font-black ${
                    lastScanResult.success ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {lastScanResult.message.toUpperCase()}
                  </p>
                  <p className="text-gray-400 text-sm mt-1 font-mono">
                    {lastScanResult.ticket_reference}
                  </p>
                </div>
                <button
                  onClick={() => setShowArbitrationModal(true)}
                  className="p-3 bg-gray-900 hover:bg-gray-800 rounded-full transition-colors border border-gray-700"
                  title="Détails / Arbitrage"
                >
                  <Info className="w-5 h-5 text-orange-500" />
                </button>
              </div>

              {lastScanResult.success && lastScanResult.zone_name && (
                <div className="bg-black rounded-xl p-4 border border-gray-800">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white shadow-lg"
                      style={{ backgroundColor: lastScanResult.zone_color || '#F97316' }}
                    />
                    <span className="text-white font-bold text-lg">{lastScanResult.zone_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{lastScanResult.access_gate}</span>
                  </div>
                </div>
              )}

              {lastScanResult.first_scan_time && (
                <div className="mt-4 bg-red-500/20 border border-red-500 rounded-xl p-4">
                  <p className="text-red-400 text-sm font-bold flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    FRAUDE DÉTECTÉE
                  </p>
                  <p className="text-red-300 text-xs">
                    Premier scan: {new Date(lastScanResult.first_scan_time).toLocaleString('fr-FR')}
                  </p>
                  {lastScanResult.scan_location && (
                    <p className="text-red-300 text-xs mt-1">
                      Localisation: {lastScanResult.scan_location}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showArbitrationModal && lastScanResult && (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border-2 border-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-black text-lg flex items-center gap-2">
                <Shield className="w-6 h-6" />
                MODE ARBITRAGE
              </h2>
              <button
                onClick={() => setShowArbitrationModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-orange-500/10 border border-orange-500 rounded-xl p-4">
                <p className="text-xs text-orange-400 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold">
                    Données sensibles - Usage strictement limité à la résolution de litiges sur place (RGPD)
                  </span>
                </p>
              </div>

              <div className="space-y-3">
                {lastScanResult.holder_name && (
                  <div className="flex items-start gap-3 bg-black rounded-xl p-4 border border-gray-800">
                    <User className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">Nom complet</p>
                      <p className="text-white font-bold text-lg">{lastScanResult.holder_name}</p>
                    </div>
                  </div>
                )}

                {lastScanResult.holder_phone && (
                  <div className="flex items-start gap-3 bg-black rounded-xl p-4 border border-gray-800">
                    <Phone className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">Téléphone (Non masqué)</p>
                      <p className="text-orange-500 font-bold text-lg font-mono">
                        {lastScanResult.holder_phone}
                      </p>
                    </div>
                  </div>
                )}

                {lastScanResult.holder_email && (
                  <div className="flex items-start gap-3 bg-black rounded-xl p-4 border border-gray-800">
                    <Mail className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">Email</p>
                      <p className="text-white font-semibold break-all text-sm">{lastScanResult.holder_email}</p>
                    </div>
                  </div>
                )}

                {lastScanResult.price_paid && (
                  <div className="flex items-start gap-3 bg-black rounded-xl p-4 border border-gray-800">
                    <CreditCard className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">Montant payé</p>
                      <p className="text-white font-bold text-lg">{lastScanResult.price_paid.toLocaleString()} FCFA</p>
                    </div>
                  </div>
                )}

                {lastScanResult.event_title && (
                  <div className="flex items-start gap-3 bg-black rounded-xl p-4 border border-gray-800">
                    <Activity className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">Événement</p>
                      <p className="text-white font-semibold">{lastScanResult.event_title}</p>
                    </div>
                  </div>
                )}

                {lastScanResult.first_scan_time && (
                  <div className="flex items-start gap-3 bg-red-500/20 border border-red-500 rounded-xl p-4">
                    <Calendar className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-red-400 mb-1 uppercase tracking-wide font-bold">⚠️ Premier scan détecté</p>
                      <p className="text-red-400 font-bold text-lg mb-2">
                        {new Date(lastScanResult.first_scan_time).toLocaleString('fr-FR')}
                      </p>
                      {lastScanResult.scan_location && (
                        <p className="text-red-300 text-sm">
                          Porte: {lastScanResult.scan_location}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-900 border-t-2 border-gray-800 p-4">
              <button
                onClick={() => setShowArbitrationModal(false)}
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
