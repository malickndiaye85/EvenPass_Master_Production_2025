import { useState, useEffect } from 'react';
import { Scan, CheckCircle, XCircle, AlertTriangle, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/SupabaseAuthContext';
import type { Ticket, Event } from '../types';

export default function EPscanPage() {
  const { user } = useAuth();
  const [qrCode, setQrCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    ticket?: Ticket & { event?: Event };
  } | null>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [stats, setStats] = useState({
    validScans: 0,
    invalidScans: 0,
    totalScans: 0,
  });

  useEffect(() => {
    loadRecentScans();
  }, []);

  const loadRecentScans = async () => {
    try {
      const { data } = await supabase
        .from('ticket_scans')
        .select(`
          *,
          ticket:tickets(
            ticket_number,
            holder_name,
            event:events(title)
          )
        `)
        .eq('scanned_by', user?.id)
        .order('scan_time', { ascending: false })
        .limit(20);

      if (data) {
        setRecentScans(data);

        const valid = data.filter(s => s.is_valid).length;
        const invalid = data.filter(s => !s.is_valid).length;

        setStats({
          validScans: valid,
          invalidScans: invalid,
          totalScans: data.length,
        });
      }
    } catch (error) {
      console.error('Error loading scans:', error);
    }
  };

  const handleScan = async () => {
    if (!qrCode.trim()) {
      alert('Veuillez scanner ou entrer un code QR');
      return;
    }

    setScanning(true);
    setScanResult(null);

    try {
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          *,
          event:events(*),
          booking:bookings(*)
        `)
        .eq('qr_code', qrCode.trim())
        .maybeSingle();

      if (ticketError) throw ticketError;

      if (!ticket) {
        setScanResult({
          success: false,
          message: 'Code QR invalide - Billet non trouvé',
        });

        await logScan(null, false, 'Code QR invalide');
        return;
      }

      if (ticket.status === 'used') {
        setScanResult({
          success: false,
          message: 'Billet déjà utilisé',
          ticket: ticket as any,
        });

        await logScan(ticket.id, false, 'Billet déjà utilisé');
        return;
      }

      if (ticket.status === 'cancelled' || ticket.status === 'refunded') {
        setScanResult({
          success: false,
          message: `Billet ${ticket.status === 'cancelled' ? 'annulé' : 'remboursé'}`,
          ticket: ticket as any,
        });

        await logScan(ticket.id, false, `Billet ${ticket.status}`);
        return;
      }

      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          status: 'used',
          check_in_time: new Date().toISOString(),
          checked_in_by: user?.id,
        })
        .eq('id', ticket.id);

      if (updateError) throw updateError;

      setScanResult({
        success: true,
        message: 'Billet validé avec succès',
        ticket: ticket as any,
      });

      await logScan(ticket.id, true, 'Scan valide');

      setQrCode('');
      loadRecentScans();
    } catch (error) {
      console.error('Scan error:', error);
      setScanResult({
        success: false,
        message: 'Erreur lors du scan',
      });
    } finally {
      setScanning(false);
    }
  };

  const logScan = async (ticketId: string | null, isValid: boolean, rejectionReason: string | null) => {
    if (!ticketId) return;

    try {
      await supabase.from('ticket_scans').insert({
        ticket_id: ticketId,
        event_id: scanResult?.ticket?.event_id,
        scanned_by: user!.id,
        is_valid: isValid,
        rejection_reason: isValid ? null : rejectionReason,
        scan_location: 'Entrée principale',
        device_info: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error logging scan:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Scan className="w-8 h-8 mr-3 text-orange-500" />
            EPscan - Scanner de Billets
          </h1>
          <p className="text-slate-400 mt-1">Contrôle d'accès événements</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold mb-1">{stats.validScans}</p>
            <p className="text-sm opacity-75">Scans valides</p>
          </div>

          <div className="bg-gradient-to-br from-red-600 to-rose-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <XCircle className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold mb-1">{stats.invalidScans}</p>
            <p className="text-sm opacity-75">Scans refusés</p>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Scan className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold mb-1">{stats.totalScans}</p>
            <p className="text-sm opacity-75">Total scans</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Camera className="w-6 h-6 mr-2 text-orange-500" />
                Scanner un billet
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Code QR du billet
                  </label>
                  <input
                    type="text"
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                    placeholder="Scanner ou entrer le code..."
                    className="w-full px-4 py-4 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg font-mono"
                    autoFocus
                    disabled={scanning}
                  />
                </div>

                <button
                  onClick={handleScan}
                  disabled={scanning || !qrCode.trim()}
                  className="w-full px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {scanning ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      Scan en cours...
                    </>
                  ) : (
                    <>
                      <Scan className="w-6 h-6 mr-3" />
                      Scanner
                    </>
                  )}
                </button>
              </div>

              {scanResult && (
                <div
                  className={`mt-6 rounded-xl p-6 border-2 ${
                    scanResult.success
                      ? 'bg-green-500/10 border-green-500'
                      : 'bg-red-500/10 border-red-500'
                  }`}
                >
                  <div className="flex items-start">
                    {scanResult.success ? (
                      <CheckCircle className="w-8 h-8 text-green-400 mr-4 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-400 mr-4 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h3
                        className={`text-xl font-bold mb-2 ${
                          scanResult.success ? 'text-green-300' : 'text-red-300'
                        }`}
                      >
                        {scanResult.message}
                      </h3>

                      {scanResult.ticket && (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Billet:</span>
                            <span className="text-white font-mono">{scanResult.ticket.ticket_number}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Titulaire:</span>
                            <span className="text-white font-medium">{scanResult.ticket.holder_name}</span>
                          </div>
                          {scanResult.ticket.event && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Événement:</span>
                              <span className="text-white font-medium">{(scanResult.ticket.event as any).title}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-300">
                    <p className="font-medium mb-1">Consignes de sécurité</p>
                    <ul className="text-blue-200/80 space-y-1 list-disc list-inside">
                      <li>Vérifiez l'identité du porteur</li>
                      <li>Un billet ne peut être scanné qu'une seule fois</li>
                      <li>En cas de doute, contactez un superviseur</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Historique des scans</h2>

              <div className="space-y-3 max-h-[700px] overflow-y-auto">
                {recentScans.map((scan) => (
                  <div
                    key={scan.id}
                    className={`rounded-lg p-4 border ${
                      scan.is_valid
                        ? 'bg-green-500/5 border-green-500/30'
                        : 'bg-red-500/5 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-start">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                          scan.is_valid ? 'bg-green-600' : 'bg-red-600'
                        }`}
                      >
                        {scan.is_valid ? (
                          <CheckCircle className="w-5 h-5 text-white" />
                        ) : (
                          <XCircle className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium mb-1 ${scan.is_valid ? 'text-green-300' : 'text-red-300'}`}>
                          {scan.is_valid ? 'Scan valide' : 'Scan refusé'}
                        </p>
                        {scan.ticket && (
                          <>
                            <p className="text-sm text-slate-300">{scan.ticket.holder_name}</p>
                            <p className="text-xs text-slate-400 font-mono">{scan.ticket.ticket_number}</p>
                            {scan.ticket.event && (
                              <p className="text-xs text-slate-400 mt-1">{scan.ticket.event.title}</p>
                            )}
                          </>
                        )}
                        {!scan.is_valid && scan.rejection_reason && (
                          <p className="text-xs text-red-300 mt-1">Raison: {scan.rejection_reason}</p>
                        )}
                        <p className="text-xs text-slate-500 mt-2">
                          {new Date(scan.scan_time).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {recentScans.length === 0 && (
                  <div className="text-center py-12">
                    <Scan className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Aucun scan effectué</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
