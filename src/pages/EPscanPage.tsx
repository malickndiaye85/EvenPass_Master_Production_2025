import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Scan,
  CheckCircle,
  XCircle,
  Shield,
  Clock,
  MapPin,
  AlertTriangle,
  Zap,
  Users,
  Smartphone
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { deviceFingerprintService } from '../lib/deviceFingerprint';

interface ScanSession {
  id: string;
  session_token: string;
  event_id: string;
  zone_id: string | null;
  controller_id: string;
  expires_at: string;
  is_active: boolean;
  event?: {
    title: string;
    start_date: string;
    venue_name: string;
  };
  zone?: {
    zone_name: string;
    zone_code: string;
  };
  controller?: {
    full_name: string;
  };
}

interface ScanResult {
  success: boolean;
  message: string;
  ticketInfo?: any;
}

export default function EPscanPage() {
  const { activationToken } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [session, setSession] = useState<ScanSession | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [stats, setStats] = useState({ totalScans: 0, validScans: 0, deniedScans: 0 });
  const [hardwareId, setHardwareId] = useState('');
  const [deviceInfo, setDeviceInfo] = useState('');

  useEffect(() => {
    initializeDevice();
  }, [activationToken]);

  const initializeDevice = async () => {
    try {
      const fingerprint = await deviceFingerprintService.getDeviceFingerprint();
      const info = deviceFingerprintService.getDeviceInfo();
      setHardwareId(fingerprint);
      setDeviceInfo(info);

      if (activationToken) {
        activateSession(fingerprint);
      } else {
        checkExistingSession(fingerprint);
      }
    } catch (error) {
      console.error('Error initializing device fingerprint:', error);
      alert('Erreur d\'initialisation du périphérique');
      setLoading(false);
    }
  };

  const checkExistingSession = async (fingerprint: string) => {
    const sessionToken = localStorage.getItem('epscan_session_token');
    if (sessionToken) {
      await loadSession(sessionToken, fingerprint);
    } else {
      setLoading(false);
    }
  };

  const loadSession = async (sessionToken: string, fingerprint: string) => {
    try {
      const { data, error } = await supabase
        .from('scan_sessions')
        .select(`
          *,
          event:events(title, start_date, venue_name),
          zone:event_zones(zone_name, zone_code),
          controller:controllers(full_name)
        `)
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        if (data.hardware_id_verified !== fingerprint) {
          alert('Périphérique non autorisé. Cette session a été créée sur un autre appareil.');
          localStorage.removeItem('epscan_session_token');
          setSession(null);
          setLoading(false);
          return;
        }

        if (new Date(data.expires_at) < new Date()) {
          await supabase
            .from('scan_sessions')
            .update({ is_active: false, ended_at: new Date().toISOString() })
            .eq('id', data.id);
          alert('Session expirée');
          localStorage.removeItem('epscan_session_token');
          setSession(null);
        } else {
          setSession(data as ScanSession);
          loadStats(data.id);
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const activateSession = async (fingerprint: string) => {
    setActivating(true);
    try {
      const { data: assignment, error: assignmentError } = await supabase
        .from('controller_assignments')
        .select(`
          *,
          controller:controllers(*),
          event:events(*),
          zone:event_zones(*)
        `)
        .eq('activation_token', activationToken)
        .maybeSingle();

      if (assignmentError || !assignment) {
        alert('Token d\'activation invalide');
        navigate('/');
        return;
      }

      if (assignment.controller.equipment_hardware_id &&
          assignment.controller.equipment_hardware_id !== fingerprint) {
        alert('Équipement non autorisé.\n\nCette activation nécessite l\'appareil déjà enregistré pour ce contrôleur.\n\nUUID Requis: ' + assignment.controller.equipment_hardware_id + '\nUUID Actuel: ' + fingerprint);
        navigate('/');
        return;
      }

      if (!assignment.controller.equipment_hardware_id) {
        await supabase
          .from('controllers')
          .update({ equipment_hardware_id: fingerprint })
          .eq('id', assignment.controller_id);

        alert('Appareil enregistré avec succès!\n\nUUID: ' + fingerprint + '\n\nCet UUID est maintenant lié de manière permanente à ce contrôleur.');
      }

      const eventEndDate = new Date(assignment.event.end_date || assignment.event.start_date);
      eventEndDate.setHours(23, 59, 59);

      const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);

      const { data: newSession, error: sessionError } = await supabase
        .from('scan_sessions')
        .insert({
          assignment_id: assignment.id,
          controller_id: assignment.controller_id,
          event_id: assignment.event_id,
          zone_id: assignment.zone_id,
          session_token: sessionToken,
          hardware_id_verified: fingerprint,
          expires_at: eventEndDate.toISOString(),
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      await supabase
        .from('controller_assignments')
        .update({
          activated_at: new Date().toISOString(),
          is_active: true,
        })
        .eq('id', assignment.id);

      localStorage.setItem('epscan_session_token', sessionToken);
      await loadSession(sessionToken, fingerprint);
    } catch (error) {
      console.error('Error activating session:', error);
      alert('Erreur lors de l\'activation');
    } finally {
      setActivating(false);
    }
  };

  const loadStats = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_scans')
        .select('scan_result')
        .eq('session_id', sessionId);

      if (error) throw error;

      const totalScans = data?.length || 0;
      const validScans = data?.filter(s => s.scan_result === 'success').length || 0;
      const deniedScans = totalScans - validScans;

      setStats({ totalScans, validScans, deniedScans });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !scanInput.trim()) return;

    setScanning(true);
    setLastScanResult(null);

    try {
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          *,
          booking:bookings(*),
          ticket_type:ticket_types(*)
        `)
        .eq('qr_code', scanInput.trim())
        .maybeSingle();

      if (ticketError || !ticket) {
        const result: ScanResult = {
          success: false,
          message: 'Billet invalide ou introuvable',
        };
        setLastScanResult(result);
        await recordScan(null, 'denied_invalid');
        return;
      }

      if (ticket.event_id !== session.event_id) {
        const result: ScanResult = {
          success: false,
          message: 'Ce billet n\'est pas pour cet événement',
        };
        setLastScanResult(result);
        await recordScan(ticket.id, 'denied_invalid');
        return;
      }

      if (ticket.status === 'cancelled') {
        const result: ScanResult = {
          success: false,
          message: 'Billet annulé',
        };
        setLastScanResult(result);
        await recordScan(ticket.id, 'denied_cancelled');
        return;
      }

      if (ticket.status === 'used') {
        const result: ScanResult = {
          success: false,
          message: 'Billet déjà utilisé',
          ticketInfo: ticket,
        };
        setLastScanResult(result);
        await recordScan(ticket.id, 'denied_already_used');
        return;
      }

      await supabase
        .from('tickets')
        .update({
          status: 'used',
          used_at: new Date().toISOString(),
        })
        .eq('id', ticket.id);

      const result: ScanResult = {
        success: true,
        message: 'Entrée autorisée',
        ticketInfo: ticket,
      };
      setLastScanResult(result);
      await recordScan(ticket.id, 'success');
      loadStats(session.id);

    } catch (error) {
      console.error('Error scanning ticket:', error);
      setLastScanResult({
        success: false,
        message: 'Erreur lors du scan',
      });
    } finally {
      setScanning(false);
      setScanInput('');
    }
  };

  const recordScan = async (ticketId: string | null, scanResult: string) => {
    if (!session) return;

    try {
      await supabase.from('ticket_scans').insert({
        ticket_id: ticketId,
        session_id: session.id,
        controller_id: session.controller_id,
        event_id: session.event_id,
        zone_id: session.zone_id,
        scan_result: scanResult,
      });
    } catch (error) {
      console.error('Error recording scan:', error);
    }
  };

  const handleEndSession = async () => {
    if (!session || !confirm('Terminer la session de scan ?')) return;

    try {
      await supabase
        .from('scan_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      localStorage.removeItem('epscan_session_token');
      setSession(null);
      alert('Session terminée');
      navigate('/');
    } catch (error) {
      console.error('Error ending session:', error);
      alert('Erreur lors de la fermeture');
    }
  };

  if (loading || activating) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">{activating ? 'Activation en cours...' : 'Chargement...'}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl border border-slate-700 p-8 text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">EPscan</h1>
          <p className="text-slate-400 mb-6">
            Aucune session active. Veuillez utiliser le lien d'activation fourni par votre superviseur.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-bold"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">EPscan</h1>
              <p className="text-sm text-slate-400">{session.controller?.full_name}</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400 font-bold">ACTIF</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border-2 border-blue-500 rounded-2xl p-6 mb-6">
          <div className="flex items-center mb-4">
            <Zap className="w-6 h-6 text-blue-400 mr-3" />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{session.event?.title}</h2>
              <p className="text-sm text-blue-200">
                {new Date(session.event?.start_date || '').toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center text-slate-300">
              <MapPin className="w-4 h-4 mr-2 text-blue-400" />
              {session.event?.venue_name}
            </div>
            <div className="flex items-center text-slate-300">
              <Clock className="w-4 h-4 mr-2 text-blue-400" />
              {new Date(session.expires_at).toLocaleDateString('fr-FR')}
            </div>
          </div>
          {session.zone && (
            <div className="mt-3 pt-3 border-t border-blue-400/30">
              <p className="text-sm text-blue-200">
                Zone assignée: <span className="font-bold text-white">{session.zone.zone_name}</span> ({session.zone.zone_code})
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white text-center">{stats.totalScans}</p>
            <p className="text-xs text-slate-400 text-center">Total</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-400 text-center">{stats.validScans}</p>
            <p className="text-xs text-slate-400 text-center">Validés</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center justify-center mb-2">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-red-400 text-center">{stats.deniedScans}</p>
            <p className="text-xs text-slate-400 text-center">Refusés</p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 mb-6">
          <form onSubmit={handleScan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Scanner le code QR
              </label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Code QR du billet"
                  autoFocus
                  disabled={scanning}
                  className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={scanning || !scanInput.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-bold flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/30"
                >
                  <Scan className="w-5 h-5 mr-2" />
                  Scanner
                </button>
              </div>
            </div>
          </form>
        </div>

        {lastScanResult && (
          <div
            className={`rounded-2xl border-2 p-6 mb-6 ${
              lastScanResult.success
                ? 'bg-green-900/30 border-green-500'
                : 'bg-red-900/30 border-red-500'
            }`}
          >
            <div className="flex items-start">
              {lastScanResult.success ? (
                <CheckCircle className="w-12 h-12 text-green-400 mr-4 flex-shrink-0" />
              ) : (
                <XCircle className="w-12 h-12 text-red-400 mr-4 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3
                  className={`text-2xl font-bold mb-2 ${
                    lastScanResult.success ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {lastScanResult.message}
                </h3>
                {lastScanResult.ticketInfo && (
                  <div className="space-y-1 text-sm text-slate-300">
                    <p>Type: {lastScanResult.ticketInfo.ticket_type?.name}</p>
                    <p>Client: {lastScanResult.ticketInfo.booking?.customer_name}</p>
                    {lastScanResult.ticketInfo.used_at && (
                      <p className="text-yellow-400 flex items-center mt-2">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Utilisé le {new Date(lastScanResult.ticketInfo.used_at).toLocaleString('fr-FR')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={handleEndSession}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center transition-colors"
          >
            <Shield className="w-5 h-5 mr-2" />
            Terminer la Session
          </button>
        </div>

        <div className="mt-6 space-y-3">
          <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
            <div className="flex items-start">
              <Smartphone className="w-5 h-5 mr-3 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-green-300 mb-1">Périphérique Autorisé</p>
                <p className="text-xs text-green-200/80 font-mono break-all">
                  UUID: {hardwareId}
                </p>
                <p className="text-xs text-green-200/60 mt-2">
                  Cet UUID unique est stocké de manière permanente dans IndexedDB et lie ce contrôleur à cet appareil.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
            <div className="flex items-center text-xs text-slate-400 mb-2">
              <Shield className="w-4 h-4 mr-2" />
              <span className="font-bold">Sécurité Hardware</span>
            </div>
            <details className="text-xs text-slate-500">
              <summary className="cursor-pointer hover:text-slate-400 select-none">
                Informations du périphérique
              </summary>
              <pre className="mt-2 p-2 bg-slate-900/50 rounded text-[10px] overflow-x-auto">
                {deviceInfo}
              </pre>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
