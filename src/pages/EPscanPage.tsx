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
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/MockAuthContext';
import { mockScanStats } from '../lib/mockData';

const zoneColors = ['#22C55E', '#EAB308', '#EF4444'];
const zoneNames = ['VIP Premium', 'Tribune Honneur', 'Pelouse Populaire'];
const accessGates = ['Entrée VIP Nord', 'Porte Tribune Est', 'Porte Pelouse Sud'];

export default function EPscanPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scanInput, setScanInput] = useState('');
  const [lastScanResult, setLastScanResult] = useState<any>(null);
  const [showFullScreenZone, setShowFullScreenZone] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    const isValid = Math.random() > 0.2;
    const zoneIndex = Math.floor(Math.random() * 3);

    const result = {
      success: isValid,
      message: isValid ? 'Billet valide' : 'Billet invalide',
      ticket_reference: scanInput,
      timestamp: new Date().toISOString(),
      zone_name: isValid ? zoneNames[zoneIndex] : null,
      zone_color: isValid ? zoneColors[zoneIndex] : null,
      access_gate: isValid ? accessGates[zoneIndex] : null,
      holder_name: isValid ? 'Client Test' : null
    };

    setLastScanResult(result);
    setScanInput('');

    if (isValid) {
      setShowFullScreenZone(true);
      setTimeout(() => {
        setShowFullScreenZone(false);
        setTimeout(() => setLastScanResult(null), 2000);
      }, 3000);
    } else {
      setTimeout(() => setLastScanResult(null), 5000);
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
          <div className="flex items-center justify-between">
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
              <span className="text-sm text-[#B5B5B5]">{user?.email}</span>
              <div className="w-8 h-8 rounded-full bg-[#FF0000] flex items-center justify-center">
                <span className="text-xs font-bold text-white">EP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#1A1A1A] rounded-xl p-6 border border-[#2A2A2A]">
            <div className="flex items-center justify-between mb-2">
              <Scan className="w-8 h-8 text-[#FF0000]" />
              <Activity className="w-4 h-4 text-[#FF7A00]" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">{mockScanStats.totalScans}</p>
            <p className="text-sm text-[#B5B5B5]">Total Scans</p>
          </div>

          <div className="bg-[#1A1A1A] rounded-xl p-6 border border-[#2A2A2A]">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <span className="text-xs font-semibold text-green-500">
                {((mockScanStats.validScans / mockScanStats.totalScans) * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{mockScanStats.validScans}</p>
            <p className="text-sm text-[#B5B5B5]">Scans Valides</p>
          </div>

          <div className="bg-[#1A1A1A] rounded-xl p-6 border border-[#2A2A2A]">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-8 h-8 text-red-500" />
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">{mockScanStats.invalidScans}</p>
            <p className="text-sm text-[#B5B5B5]">Scans Invalides</p>
          </div>

          <div className="bg-[#1A1A1A] rounded-xl p-6 border border-[#2A2A2A]">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-[#FFB800]" />
              <Shield className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">{mockScanStats.scansToday}</p>
            <p className="text-sm text-[#B5B5B5]">Scans Aujourd'hui</p>
          </div>
        </div>

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
            <div className={`mt-6 p-6 rounded-lg border-2 ${
              lastScanResult.success
                ? 'bg-green-500/10 border-green-500'
                : 'bg-red-500/10 border-red-500'
            }`}>
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
                          style={{ backgroundColor: lastScanResult.zone_color }}
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
