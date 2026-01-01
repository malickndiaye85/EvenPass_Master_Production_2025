import { useState, useEffect, useRef } from 'react';
import {
  Scan,
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
  X
} from 'lucide-react';
import { useAuth } from '../context/MockAuthContext';
import { ScanCache } from '../lib/scanCache';
import { formatPhoneNumber } from '../lib/phoneUtils';

const zoneColors = ['#22C55E', '#EAB308', '#EF4444'];
const zoneNames = ['VIP Premium', 'Tribune Honneur', 'Pelouse Populaire'];
const accessGates = ['Gate A', 'Gate B', 'Gate C'];

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
}

export default function EPscanPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scanMode, setScanMode] = useState<'auto' | 'manual'>('auto');
  const [scanInput, setScanInput] = useState('');
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [showFlash, setShowFlash] = useState<'green' | 'red' | null>(null);
  const [showArbitrationModal, setShowArbitrationModal] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [scanStats, setScanStats] = useState(ScanCache.getStats());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoScanInputRef = useRef<HTMLInputElement>(null);

  const currentEvent = {
    title: 'Festival Dakar Music 2024',
    venue: 'Stade LSS',
    date: '15 Dec',
    gate: 'Gate A'
  };

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (scanMode === 'auto' && autoScanInputRef.current) {
      autoScanInputRef.current.focus();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [scanMode]);

  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const playSound = (frequency: number, duration: number) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  const handleScan = async (qrCode: string) => {
    if (!qrCode.trim()) return;

    const startTime = Date.now();
    const trimmedCode = qrCode.trim();

    let cachedTicket = ScanCache.getTicket(trimmedCode);

    if (cachedTicket) {
      const result: ScanResult = {
        success: cachedTicket.status === 'valid',
        message: cachedTicket.status === 'valid' ? 'Billet valide' : 'Billet déjà scanné',
        ticket_reference: cachedTicket.ticket_number,
        timestamp: new Date().toISOString(),
        zone_name: cachedTicket.zone_name,
        zone_color: cachedTicket.zone_color,
        access_gate: cachedTicket.access_gate,
        holder_name: cachedTicket.holder_name,
        holder_phone: cachedTicket.holder_phone,
        holder_email: cachedTicket.holder_email,
        first_scan_time: cachedTicket.check_in_time,
        price_paid: cachedTicket.price_paid,
        event_title: cachedTicket.event_title,
      };

      processScanResult(result, startTime);
      return;
    }

    const isValid = Math.random() > 0.3;
    const zoneIndex = Math.floor(Math.random() * 3);

    const mockTicket = {
      ticket_id: `ticket-${Date.now()}`,
      ticket_number: trimmedCode,
      qr_code: trimmedCode,
      holder_name: 'Amadou Diallo',
      holder_email: 'amadou.diallo@example.com',
      holder_phone: '+221771234567',
      zone_name: isValid ? zoneNames[zoneIndex] : '',
      zone_color: isValid ? zoneColors[zoneIndex] : '',
      access_gate: isValid ? accessGates[zoneIndex] : '',
      event_title: currentEvent.title,
      status: isValid ? 'valid' : 'used',
      check_in_time: isValid ? null : new Date(Date.now() - 3600000).toISOString(),
      price_paid: 25000,
      cached_at: Date.now(),
    };

    if (isValid) {
      ScanCache.saveTicket(mockTicket);
    }

    const result: ScanResult = {
      success: isValid,
      message: isValid ? 'Billet valide' : 'Billet déjà scanné',
      ticket_reference: trimmedCode,
      timestamp: new Date().toISOString(),
      zone_name: isValid ? zoneNames[zoneIndex] : null,
      zone_color: isValid ? zoneColors[zoneIndex] : null,
      access_gate: isValid ? accessGates[zoneIndex] : null,
      holder_name: 'Amadou Diallo',
      holder_phone: '+221771234567',
      holder_email: 'amadou.diallo@example.com',
      first_scan_time: isValid ? null : new Date(Date.now() - 3600000).toISOString(),
      price_paid: 25000,
      event_title: currentEvent.title,
    };

    processScanResult(result, startTime);
  };

  const processScanResult = (result: ScanResult, startTime: number) => {
    const scanDuration = Date.now() - startTime;
    console.log(`⚡ Scan completed in ${scanDuration}ms`);

    ScanCache.updateStats(result.success);
    setScanStats(ScanCache.getStats());

    setLastScanResult(result);
    setScanInput('');

    if (result.success) {
      setShowFlash('green');
      vibrate(200);
      playSound(1200, 100);
      setTimeout(() => setShowFlash(null), 1500);
      setTimeout(() => setLastScanResult(null), 5000);
    } else {
      setShowFlash('red');
      vibrate([300, 100, 300]);
      playSound(400, 200);
      setTimeout(() => playSound(400, 200), 300);
      setTimeout(() => setShowFlash(null), 1500);
      setTimeout(() => setLastScanResult(null), 8000);
    }

    if (scanMode === 'auto' && autoScanInputRef.current) {
      setTimeout(() => autoScanInputRef.current?.focus(), 100);
    }
  };

  const handleAutoScanInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (scanInput.trim()) {
      handleScan(scanInput);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scanInput.trim()) {
      handleScan(scanInput);
      setShowManualInput(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a2332] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#22C55E] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (showFlash) {
    return (
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ${
          showFlash === 'green' ? 'bg-[#22C55E]' : 'bg-[#EF4444]'
        }`}
      >
        <div className="text-center animate-pulse">
          {showFlash === 'green' ? (
            <CheckCircle className="w-32 h-32 text-white mx-auto mb-6" strokeWidth={3} />
          ) : (
            <XCircle className="w-32 h-32 text-white mx-auto mb-6" strokeWidth={3} />
          )}
          <h1 className="text-5xl font-black text-white">
            {showFlash === 'green' ? 'VALIDÉ' : 'REFUSÉ'}
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a2332] text-white">
      <div className="bg-[#22C55E] px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white' : 'bg-yellow-400'} animate-pulse`} />
            <span className="text-xs text-white font-medium">
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </span>
          </div>
          <div className="text-xs text-white">{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-black text-white tracking-tight">EVENPASS SCAN</h1>
          <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
            <span className="text-sm font-bold text-white">{currentEvent.gate}</span>
          </div>
        </div>

        <p className="text-sm text-white/90 font-medium">
          {currentEvent.title} • {currentEvent.venue} • {currentEvent.date}
        </p>
      </div>

      <div className="px-4 py-6 grid grid-cols-3 gap-3">
        <div className="bg-[#22C55E]/10 backdrop-blur-sm border-2 border-[#22C55E] rounded-2xl p-4 text-center">
          <div className="text-4xl font-black text-[#22C55E] mb-1">{scanStats.validScans}</div>
          <div className="text-xs text-[#22C55E] font-semibold uppercase tracking-wide">Validés</div>
        </div>

        <div className="bg-[#EF4444]/10 backdrop-blur-sm border-2 border-[#EF4444] rounded-2xl p-4 text-center">
          <div className="text-4xl font-black text-[#EF4444] mb-1">{scanStats.invalidScans}</div>
          <div className="text-xs text-[#EF4444] font-semibold uppercase tracking-wide">Refusés</div>
        </div>

        <div className="bg-[#64748B]/10 backdrop-blur-sm border-2 border-[#64748B] rounded-2xl p-4 text-center">
          <div className="text-4xl font-black text-[#64748B] mb-1">{scanStats.totalScans}</div>
          <div className="text-xs text-[#64748B] font-semibold uppercase tracking-wide">Total</div>
        </div>
      </div>

      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setScanMode('auto');
              setTimeout(() => autoScanInputRef.current?.focus(), 100);
            }}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
              scanMode === 'auto'
                ? 'bg-[#22C55E] text-white shadow-lg shadow-[#22C55E]/30'
                : 'bg-[#2d3748] text-[#64748B] hover:bg-[#374151]'
            }`}
          >
            <Camera className="w-5 h-5" />
            Auto Scan
          </button>

          <button
            onClick={() => setScanMode('manual')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
              scanMode === 'manual'
                ? 'bg-[#F59E0B] text-white shadow-lg shadow-[#F59E0B]/30'
                : 'bg-[#2d3748] text-[#64748B] hover:bg-[#374151]'
            }`}
          >
            <Keyboard className="w-5 h-5" />
            Manuel
          </button>
        </div>
      </div>

      {scanMode === 'auto' && (
        <div className="px-4 mb-6">
          <form onSubmit={handleAutoScanInput} className="relative">
            <input
              ref={autoScanInputRef}
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              className="w-full bg-transparent border-0 outline-none text-transparent caret-transparent"
              autoFocus
              autoComplete="off"
              inputMode="none"
            />
          </form>

          <div className="relative bg-[#0f1621] border-4 border-[#22C55E] rounded-3xl p-8 aspect-square flex items-center justify-center">
            <div className="absolute inset-0 m-8">
              <div className="w-full h-full border-2 border-dashed border-[#22C55E]/30 rounded-2xl animate-pulse" />
            </div>

            <div className="absolute top-6 left-6 w-8 h-8 border-l-4 border-t-4 border-[#22C55E] rounded-tl-lg" />
            <div className="absolute top-6 right-6 w-8 h-8 border-r-4 border-t-4 border-[#22C55E] rounded-tr-lg" />
            <div className="absolute bottom-6 left-6 w-8 h-8 border-l-4 border-b-4 border-[#22C55E] rounded-bl-lg" />
            <div className="absolute bottom-6 right-6 w-8 h-8 border-r-4 border-b-4 border-[#22C55E] rounded-br-lg" />

            <div className="text-center z-10">
              <Scan className="w-16 h-16 text-[#22C55E] mx-auto mb-4 animate-pulse" />
              <p className="text-[#64748B] text-sm font-medium">
                Scannez automatiquement
              </p>
            </div>
          </div>

          <p className="text-center text-[#64748B] text-sm mt-4 font-medium">
            Positionnez le QR code dans le cadre
          </p>
        </div>
      )}

      {scanMode === 'manual' && (
        <div className="px-4 mb-6">
          <div className="bg-[#0f1621] border-2 border-[#2d3748] rounded-2xl p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-[#F59E0B]" />
              Saisie Manuelle
            </h3>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <input
                ref={inputRef}
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Entrez le code du billet..."
                className="w-full px-4 py-3 bg-[#1a2332] border-2 border-[#2d3748] rounded-xl text-white placeholder-[#64748B] focus:outline-none focus:border-[#F59E0B] font-mono"
                autoFocus
              />
              <button
                type="submit"
                className="w-full py-3 bg-[#F59E0B] text-white font-bold rounded-xl hover:bg-[#F59E0B]/90 transition-all shadow-lg"
              >
                Valider
              </button>
            </form>
          </div>
        </div>
      )}

      {lastScanResult && (
        <div className="px-4 mb-6">
          <div
            className={`border-2 rounded-2xl overflow-hidden ${
              lastScanResult.success
                ? 'bg-[#22C55E]/10 border-[#22C55E]'
                : 'bg-[#EF4444]/10 border-[#EF4444]'
            }`}
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                {lastScanResult.success ? (
                  <CheckCircle className="w-12 h-12 text-[#22C55E] flex-shrink-0" strokeWidth={3} />
                ) : (
                  <XCircle className="w-12 h-12 text-[#EF4444] flex-shrink-0" strokeWidth={3} />
                )}
                <div className="flex-1">
                  <p className={`text-xl font-black ${
                    lastScanResult.success ? 'text-[#22C55E]' : 'text-[#EF4444]'
                  }`}>
                    {lastScanResult.message.toUpperCase()}
                  </p>
                  <p className="text-[#64748B] text-sm mt-1 font-mono">
                    {lastScanResult.ticket_reference}
                  </p>
                </div>
              </div>

              {lastScanResult.success && lastScanResult.zone_name && (
                <div className="bg-[#0f1621] rounded-xl p-4 border border-[#2d3748]">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white"
                      style={{ backgroundColor: lastScanResult.zone_color || undefined }}
                    />
                    <span className="text-white font-bold text-lg">{lastScanResult.zone_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#64748B]">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{lastScanResult.access_gate}</span>
                  </div>
                </div>
              )}

              {lastScanResult.first_scan_time && (
                <div className="mt-4 bg-[#EF4444]/10 border border-[#EF4444] rounded-xl p-3">
                  <p className="text-[#EF4444] text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Premier scan: {new Date(lastScanResult.first_scan_time).toLocaleString('fr-FR')}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowArbitrationModal(true)}
              className="w-full py-4 bg-[#2d3748] hover:bg-[#374151] transition-colors flex items-center justify-center gap-2 text-white font-bold border-t-2 border-[#1a2332]"
            >
              <Shield className="w-5 h-5 text-[#F59E0B]" />
              Détails / Arbitrage
            </button>
          </div>
        </div>
      )}

      {showArbitrationModal && lastScanResult && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1a2332] border-2 border-[#2d3748] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#F59E0B] px-6 py-4 flex items-center justify-between">
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
              <div className="bg-[#F59E0B]/10 border border-[#F59E0B] rounded-xl p-4">
                <p className="text-xs text-[#F59E0B] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">
                    Informations confidentielles - Usage restreint à la résolution de litiges (RGPD)
                  </span>
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-[#0f1621] rounded-xl p-4">
                  <User className="w-5 h-5 text-[#64748B] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-[#64748B] mb-1 uppercase tracking-wide">Nom complet</p>
                    <p className="text-white font-bold text-lg">{lastScanResult.holder_name}</p>
                  </div>
                </div>

                {lastScanResult.holder_phone && (
                  <div className="flex items-start gap-3 bg-[#0f1621] rounded-xl p-4">
                    <Phone className="w-5 h-5 text-[#64748B] mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-[#64748B] mb-1 uppercase tracking-wide">Téléphone (Non masqué)</p>
                      <p className="text-[#22C55E] font-bold text-lg font-mono">
                        {formatPhoneNumber(lastScanResult.holder_phone)}
                      </p>
                    </div>
                  </div>
                )}

                {lastScanResult.holder_email && (
                  <div className="flex items-start gap-3 bg-[#0f1621] rounded-xl p-4">
                    <Mail className="w-5 h-5 text-[#64748B] mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-[#64748B] mb-1 uppercase tracking-wide">Email</p>
                      <p className="text-white font-semibold break-all">{lastScanResult.holder_email}</p>
                    </div>
                  </div>
                )}

                {lastScanResult.price_paid && (
                  <div className="flex items-start gap-3 bg-[#0f1621] rounded-xl p-4">
                    <CreditCard className="w-5 h-5 text-[#64748B] mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-[#64748B] mb-1 uppercase tracking-wide">Montant payé</p>
                      <p className="text-white font-bold text-lg">{lastScanResult.price_paid.toLocaleString()} FCFA</p>
                    </div>
                  </div>
                )}

                {lastScanResult.event_title && (
                  <div className="flex items-start gap-3 bg-[#0f1621] rounded-xl p-4">
                    <Activity className="w-5 h-5 text-[#64748B] mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-[#64748B] mb-1 uppercase tracking-wide">Événement</p>
                      <p className="text-white font-semibold">{lastScanResult.event_title}</p>
                    </div>
                  </div>
                )}

                {lastScanResult.first_scan_time && (
                  <div className="flex items-start gap-3 bg-[#EF4444]/10 border border-[#EF4444] rounded-xl p-4">
                    <Calendar className="w-5 h-5 text-[#EF4444] mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-[#EF4444] mb-1 uppercase tracking-wide font-bold">⚠️ Premier scan (Fraude potentielle)</p>
                      <p className="text-[#EF4444] font-bold text-lg">
                        {new Date(lastScanResult.first_scan_time).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-[#1a2332] border-t-2 border-[#2d3748] p-4">
              <button
                onClick={() => setShowArbitrationModal(false)}
                className="w-full py-3 bg-[#2d3748] hover:bg-[#374151] text-white font-bold rounded-xl transition-colors"
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
