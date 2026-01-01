import { useState, useEffect } from 'react';
import {
  Scan,
  CheckCircle,
  XCircle,
  Shield,
  Clock,
  MapPin,
  AlertTriangle,
  Activity,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  User,
  Phone,
  Mail,
  CreditCard,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/MockAuthContext';
import { mockScanStats } from '../lib/mockData';
import { ScanCache } from '../lib/scanCache';
import { formatPhoneNumber } from '../lib/phoneUtils';

const zoneColors = ['#22C55E', '#EAB308', '#EF4444'];
const zoneNames = ['VIP Premium', 'Tribune Honneur', 'Pelouse Populaire'];
const accessGates = ['Entrée VIP Nord', 'Porte Tribune Est', 'Porte Pelouse Sud'];

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
  const [scanInput, setScanInput] = useState('');
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [showFullScreenZone, setShowFullScreenZone] = useState(false);
  const [showArbitrationDetails, setShowArbitrationDetails] = useState(false);
  const [scanStats, setScanStats] = useState(ScanCache.getStats());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    const startTime = Date.now();
    const qrCode = scanInput.trim();

    let cachedTicket = ScanCache.getTicket(qrCode);

    if (cachedTicket) {
      const result: ScanResult = {
        success: cachedTicket.status === 'valid',
        message: cachedTicket.status === 'valid' ? 'Billet valide' : 'Billet invalide',
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

    const isValid = Math.random() > 0.2;
    const zoneIndex = Math.floor(Math.random() * 3);

    const mockTicket = {
      ticket_id: `ticket-${Date.now()}`,
      ticket_number: qrCode,
      qr_code: qrCode,
      holder_name: 'Amadou Diallo',
      holder_email: 'amadou.diallo@example.com',
      holder_phone: '+221771234567',
      zone_name: isValid ? zoneNames[zoneIndex] : '',
      zone_color: isValid ? zoneColors[zoneIndex] : '',
      access_gate: isValid ? accessGates[zoneIndex] : '',
      event_title: 'Concert Youssou Ndour 2026',
      status: isValid ? 'valid' : 'used',
      check_in_time: isValid ? null : new Date(Date.now() - 3600000).toISOString(),
      price_paid: 50000,
      cached_at: Date.now(),
    };

    if (isValid) {
      ScanCache.saveTicket(mockTicket);
    }

    const result: ScanResult = {
      success: isValid,
      message: isValid ? 'Billet valide' : 'Billet déjà scanné',
      ticket_reference: qrCode,
      timestamp: new Date().toISOString(),
      zone_name: isValid ? zoneNames[zoneIndex] : null,
      zone_color: isValid ? zoneColors[zoneIndex] : null,
      access_gate: isValid ? accessGates[zoneIndex] : null,
      holder_name: 'Amadou Diallo',
      holder_phone: '+221771234567',
      holder_email: 'amadou.diallo@example.com',
      first_scan_time: isValid ? null : new Date(Date.now() - 3600000).toISOString(),
      price_paid: 50000,
      event_title: 'Concert Youssou Ndour 2026',
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
    setShowArbitrationDetails(false);

    if (result.success) {
      setShowFullScreenZone(true);
      setTimeout(() => {
        setShowFullScreenZone(false);
        setTimeout(() => setLastScanResult(null), 2000);
      }, 3000);
    } else {
      setTimeout(() => setLastScanResult(null), 8000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF0000] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (showFullScreenZone && lastScanResult?.zone_color) {
    return (
      <div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-8 animate-pulse"
        style={{ backgroundColor: lastScanResult.zone_color }}
      >
        <CheckCircle className="w-32 h-32 text-white mb-8 drop-shadow-2xl animate-bounce" />
        <h1 className="text-6xl md:text-8xl font-black text-white text-center mb-8 drop-shadow-2xl">
          {lastScanResult.zone_name}
        </h1>
        <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-8 border-4 border-white max-w-2xl w-full">
          <div className="flex items-center justify-center gap-4 mb-6">
            <MapPin className="w-12 h-12 text-white" />
            <ArrowRight className="w-12 h-12 text-white animate-pulse" />
            <div className="text-center">
              <p className="text-4xl font-black text-white drop-shadow-lg">
                {lastScanResult.access_gate}
              </p>
            </div>
          </div>
          <p className="text-2xl text-white text-center font-bold mt-4">
            Diriger vers cette entrée →
          </p>
        </div>
        <p className="text-xl text-white mt-8 font-semibold opacity-80">
          Spectateur: {lastScanResult.holder_name}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      <div className="border-b border-[#2A2A2A] bg-[#0F0F0F]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF0000] to-[#CC0000] flex items-center justify-center">
                <Scan className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">EPscan</h1>
                <p className="text-sm text-[#B5B5B5]">Contrôle des billets</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                isOnline
                  ? 'bg-green-500/10 text-green-500 border border-green-500/30'
                  : 'bg-orange-500/10 text-orange-500 border border-orange-500/30'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'} animate-pulse`} />
                {isOnline ? 'En ligne' : 'Mode Offline'}
              </div>
              <span className="text-sm text-[#B5B5B5]">{user?.email}</span>
              <div className="w-8 h-8 rounded-full bg-[#FF0000] flex items-center justify-center">
                <span className="text-xs font-bold text-white">EP</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-[#1A1A1A]/50 rounded-lg p-3 border border-[#2A2A2A]">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-[#FF7A00]" />
                <span className="text-xs text-[#B5B5B5]">Total</span>
              </div>
              <p className="text-2xl font-black text-white">{scanStats.totalScans}</p>
            </div>

            <div className="bg-[#1A1A1A]/50 rounded-lg p-3 border border-[#2A2A2A]">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-xs text-[#B5B5B5]">Valides</span>
              </div>
              <p className="text-2xl font-black text-green-500">{scanStats.validScans}</p>
            </div>

            <div className="bg-[#1A1A1A]/50 rounded-lg p-3 border border-[#2A2A2A]">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-xs text-[#B5B5B5]">Invalides</span>
              </div>
              <p className="text-2xl font-black text-red-500">{scanStats.invalidScans}</p>
            </div>

            <div className="bg-[#1A1A1A]/50 rounded-lg p-3 border border-[#2A2A2A]">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-[#FFB800]" />
                <span className="text-xs text-[#B5B5B5]">Aujourd'hui</span>
              </div>
              <p className="text-2xl font-black text-[#FFB800]">{scanStats.scansToday}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-8 mb-8">
          <h2 className="text-lg font-bold text-white mb-6">Scanner un Billet</h2>
          <form onSubmit={handleScan} className="space-y-4">
            <input
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="Scanner le QR code ou entrer la référence..."
              className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white placeholder-[#B5B5B5] focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
              autoFocus
            />
            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-[#FF0000] to-[#CC0000] text-white font-semibold rounded-lg hover:opacity-90 transition-all"
            >
              Scanner
            </button>
          </form>

          {lastScanResult && !showFullScreenZone && (
            <div className={`mt-6 rounded-lg border-2 overflow-hidden ${
              lastScanResult.success
                ? 'bg-green-500/10 border-green-500'
                : 'bg-red-500/10 border-red-500'
            }`}>
              <div className="p-6">
                <div className="flex items-center gap-3">
                  {lastScanResult.success ? (
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-500" />
                  )}
                  <div className="flex-1">
                    <p className={`font-bold text-lg ${
                      lastScanResult.success ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {lastScanResult.message}
                    </p>
                    <p className="text-sm text-[#B5B5B5] mt-1">
                      Référence: {lastScanResult.ticket_reference}
                    </p>
                    {lastScanResult.success && lastScanResult.zone_name && (
                      <div className="mt-3 pt-3 border-t border-[#3A3A3A]">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-4 h-4 rounded-full border-2 border-white"
                            style={{ backgroundColor: lastScanResult.zone_color || undefined }}
                          />
                          <p className="text-white font-bold">{lastScanResult.zone_name}</p>
                        </div>
                        <div className="flex items-center gap-2 text-[#B5B5B5]">
                          <MapPin className="w-4 h-4" />
                          <p className="text-sm">{lastScanResult.access_gate}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowArbitrationDetails(!showArbitrationDetails)}
                className="w-full px-6 py-3 bg-[#2A2A2A] hover:bg-[#3A3A3A] transition-colors flex items-center justify-between text-white font-semibold border-t border-[#3A3A3A]"
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#FF7A00]" />
                  Détails Arbitrage (RGPD)
                </span>
                {showArbitrationDetails ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              {showArbitrationDetails && lastScanResult.holder_name && (
                <div className="bg-[#1A1A1A] p-6 border-t border-[#3A3A3A]">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Informations Complètes (Arbitrage uniquement)
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-[#B5B5B5] mt-0.5" />
                      <div>
                        <p className="text-xs text-[#B5B5B5] mb-1">Nom complet</p>
                        <p className="text-white font-semibold">{lastScanResult.holder_name}</p>
                      </div>
                    </div>

                    {lastScanResult.holder_phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-[#B5B5B5] mt-0.5" />
                        <div>
                          <p className="text-xs text-[#B5B5B5] mb-1">Téléphone (Non masqué)</p>
                          <p className="text-white font-semibold font-mono">
                            {formatPhoneNumber(lastScanResult.holder_phone)}
                          </p>
                        </div>
                      </div>
                    )}

                    {lastScanResult.holder_email && (
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-[#B5B5B5] mt-0.5" />
                        <div>
                          <p className="text-xs text-[#B5B5B5] mb-1">Email</p>
                          <p className="text-white font-semibold">{lastScanResult.holder_email}</p>
                        </div>
                      </div>
                    )}

                    {lastScanResult.price_paid && (
                      <div className="flex items-start gap-3">
                        <CreditCard className="w-5 h-5 text-[#B5B5B5] mt-0.5" />
                        <div>
                          <p className="text-xs text-[#B5B5B5] mb-1">Montant payé</p>
                          <p className="text-white font-semibold">{lastScanResult.price_paid.toLocaleString()} FCFA</p>
                        </div>
                      </div>
                    )}

                    {lastScanResult.first_scan_time && (
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-orange-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-orange-500 mb-1">Premier scan</p>
                          <p className="text-orange-400 font-semibold">
                            {new Date(lastScanResult.first_scan_time).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    )}

                    {lastScanResult.event_title && (
                      <div className="flex items-start gap-3">
                        <Activity className="w-5 h-5 text-[#B5B5B5] mt-0.5" />
                        <div>
                          <p className="text-xs text-[#B5B5B5] mb-1">Événement</p>
                          <p className="text-white font-semibold">{lastScanResult.event_title}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <p className="text-xs text-orange-400 flex items-start gap-2">
                      <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>Ces informations sont confidentielles et doivent être utilisées uniquement pour la résolution de litiges. Conformité RGPD.</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] overflow-hidden">
          <div className="p-6 border-b border-[#2A2A2A]">
            <h2 className="text-lg font-bold text-white">Scans Récents</h2>
          </div>
          <div className="divide-y divide-[#2A2A2A]">
            {mockScanStats.recentScans.map((scan, index) => (
              <div key={index} className="p-6 hover:bg-[#2A2A2A]/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    scan.status === 'valid' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {scan.status === 'valid' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium mb-1">{scan.ticket_reference}</p>
                    <div className="flex items-center gap-4 text-sm text-[#B5B5B5]">
                      <span>{scan.event}</span>
                      <span>•</span>
                      <span>{scan.type}</span>
                      <span>•</span>
                      <span>{new Date(scan.scanned_at).toLocaleTimeString('fr-FR')}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    scan.status === 'valid'
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-red-500/10 text-red-500'
                  }`}>
                    {scan.status === 'valid' ? 'Valide' : 'Invalide'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
