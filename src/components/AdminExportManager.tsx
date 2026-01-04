import { useState, useEffect } from 'react';
import { Download, Calendar, Filter, FileText } from 'lucide-react';
import { firestore } from '../firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

type PeriodFilter = 'day' | 'week' | 'month' | 'all';

interface ExportData {
  date: string;
  event_title: string;
  organizer_name: string;
  ticket_price: number;
  platform_commission: number;
  mobile_money_fees: number;
  net_organizer: number;
}

export default function AdminExportManager() {
  const [showModal, setShowModal] = useState(false);
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [organizerFilter, setOrganizerFilter] = useState('');
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadOrganizers();
  }, []);

  const loadOrganizers = async () => {
    try {
      const organizersRef = collection(firestore, 'organizers');
      const organizersQuery = query(organizersRef, where('verification_status', '==', 'verified'));
      const organizersSnapshot = await getDocs(organizersQuery);
      const loadedOrganizers = organizersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrganizers(loadedOrganizers);
    } catch (error) {
      console.error('[EXPORT] Error loading organizers:', error);
    }
  };

  const getDateRange = (): { start: Date; end: Date } => {
    const now = new Date();
    let start = new Date();

    switch (period) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'all':
        start = new Date(2020, 0, 1);
        break;
    }

    return { start, end: now };
  };

  const fetchExportData = async (): Promise<ExportData[]> => {
    const { start, end } = getDateRange();
    const exportData: ExportData[] = [];

    try {
      const ticketsRef = collection(firestore, 'tickets');
      let ticketsQuery = query(
        ticketsRef,
        where('status', '==', 'active'),
        where('purchased_at', '>=', Timestamp.fromDate(start)),
        where('purchased_at', '<=', Timestamp.fromDate(end))
      );

      const ticketsSnapshot = await getDocs(ticketsQuery);

      for (const ticketDoc of ticketsSnapshot.docs) {
        const ticket = ticketDoc.data();

        if (organizerFilter && ticket.organizer_id !== organizerFilter) {
          continue;
        }

        const price = ticket.price || 0;
        const commission = price * 0.05;
        const fees = price * 0.015;
        const net = price * 0.935;

        let eventTitle = 'N/A';
        let organizerName = 'N/A';

        if (ticket.event_id) {
          try {
            const eventDoc = await getDocs(query(collection(firestore, 'events'), where('__name__', '==', ticket.event_id)));
            if (!eventDoc.empty) {
              eventTitle = eventDoc.docs[0].data().title || 'N/A';
            }
          } catch (e) {
            console.log('Event not found');
          }
        }

        if (ticket.organizer_id) {
          try {
            const orgDoc = await getDocs(query(collection(firestore, 'organizers'), where('__name__', '==', ticket.organizer_id)));
            if (!orgDoc.empty) {
              organizerName = orgDoc.docs[0].data().organization_name || 'N/A';
            }
          } catch (e) {
            console.log('Organizer not found');
          }
        }

        exportData.push({
          date: ticket.purchased_at?.toDate?.().toLocaleString('fr-FR') || 'N/A',
          event_title: eventTitle,
          organizer_name: organizerName,
          ticket_price: price,
          platform_commission: commission,
          mobile_money_fees: fees,
          net_organizer: net,
        });
      }
    } catch (error) {
      console.error('[EXPORT] Error fetching data:', error);
    }

    return exportData;
  };

  const exportToCSV = async () => {
    setExporting(true);
    const data = await fetchExportData();

    const headers = [
      'Date',
      'Événement',
      'Organisateur',
      'Prix Billet (FCFA)',
      'Commission EvenPass 5% (FCFA)',
      'Frais Mobile Money 1.5% (FCFA)',
      'Net Organisateur 93.5% (FCFA)',
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        [
          `"${row.date}"`,
          `"${row.event_title}"`,
          `"${row.organizer_name}"`,
          row.ticket_price,
          row.platform_commission.toFixed(0),
          row.mobile_money_fees.toFixed(0),
          row.net_organizer.toFixed(0),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `evenpass_rapport_${period}_${Date.now()}.csv`;
    link.click();

    setExporting(false);
    setShowModal(false);
    alert('✅ Export CSV généré avec succès !');
  };

  const exportToPDF = async () => {
    setExporting(true);
    const data = await fetchExportData();

    const totalRevenue = data.reduce((sum, item) => sum + item.ticket_price, 0);
    const totalCommission = data.reduce((sum, item) => sum + item.platform_commission, 0);
    const totalFees = data.reduce((sum, item) => sum + item.mobile_money_fees, 0);
    const totalNet = data.reduce((sum, item) => sum + item.net_organizer, 0);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 40px; }
          .header img { width: 150px; }
          .header h1 { color: #FF5F05; margin: 20px 0; }
          .summary { background: #f5f5f5; padding: 20px; margin-bottom: 30px; border-radius: 10px; }
          .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
          .summary-item { padding: 10px; }
          .summary-label { font-size: 12px; color: #666; }
          .summary-value { font-size: 20px; font-weight: bold; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #FF5F05; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎫 EvenPass - Rapport Financier</h1>
          <p>Période: ${period === 'day' ? 'Aujourd\'hui' : period === 'week' ? '7 derniers jours' : period === 'month' ? '30 derniers jours' : 'Toutes les données'}</p>
          <p>Généré le: ${new Date().toLocaleString('fr-FR')}</p>
        </div>

        <div class="summary">
          <h2>Récapitulatif Fiscal</h2>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">Chiffre d'affaires total</div>
              <div class="summary-value">${totalRevenue.toLocaleString()} FCFA</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Commission EvenPass (5%)</div>
              <div class="summary-value">${totalCommission.toLocaleString()} FCFA</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Frais Mobile Money (1.5%)</div>
              <div class="summary-value">${totalFees.toLocaleString()} FCFA</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Net Organisateurs (93.5%)</div>
              <div class="summary-value">${totalNet.toLocaleString()} FCFA</div>
            </div>
          </div>
        </div>

        <h2>Détail des Transactions</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Événement</th>
              <th>Organisateur</th>
              <th>Prix</th>
              <th>Commission 5%</th>
              <th>Frais 1.5%</th>
              <th>Net 93.5%</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                <td>${row.date}</td>
                <td>${row.event_title}</td>
                <td>${row.organizer_name}</td>
                <td>${row.ticket_price.toLocaleString()} F</td>
                <td>${row.platform_commission.toFixed(0).toLocaleString()} F</td>
                <td>${row.mobile_money_fees.toFixed(0).toLocaleString()} F</td>
                <td>${row.net_organizer.toFixed(0).toLocaleString()} F</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>© ${new Date().getFullYear()} EvenPass - Plateforme de gestion d'événements</p>
          <p>Document officiel généré automatiquement</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `evenpass_rapport_${period}_${Date.now()}.html`;
    link.click();

    setExporting(false);
    setShowModal(false);
    alert('✅ Export PDF/HTML généré avec succès ! Ouvrez le fichier et imprimez-le en PDF.');
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold transition-all shadow-lg flex items-center gap-2"
        style={{ borderRadius: '40px 8px 40px 8px' }}
      >
        <Download className="w-4 h-4" />
        Exporter les Données
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#2A2A2A] max-w-2xl w-full border border-[#2A2A2A]" style={{ borderRadius: '40px 120px 40px 120px' }}>
            <div className="p-6 border-b border-[#0F0F0F] flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-white">📊 Export de Données</h2>
                <p className="text-[#B5B5B5] text-sm mt-1">Générer un rapport financier détaillé</p>
              </div>
              <button
                onClick={() => !exporting && setShowModal(false)}
                disabled={exporting}
                className="text-[#B5B5B5] hover:text-white transition-colors disabled:opacity-50"
              >
                <Download className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Période
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'day', label: 'Aujourd\'hui' },
                    { value: 'week', label: '7 jours' },
                    { value: 'month', label: '30 jours' },
                    { value: 'all', label: 'Tout' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPeriod(option.value as PeriodFilter)}
                      className={`px-4 py-3 font-bold transition-all ${
                        period === option.value
                          ? 'bg-[#FF5F05] text-white'
                          : 'bg-[#0F0F0F] text-[#B5B5B5] hover:text-white'
                      }`}
                      style={{ borderRadius: '15px 5px 15px 5px' }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Organisateur (Optionnel)
                </label>
                <select
                  value={organizerFilter}
                  onChange={(e) => setOrganizerFilter(e.target.value)}
                  disabled={exporting}
                  className="w-full px-4 py-3 bg-[#0F0F0F] border-2 border-[#2A2A2A] text-white font-medium transition-colors focus:border-[#FF5F05] focus:outline-none disabled:opacity-50"
                  style={{ borderRadius: '20px 8px 20px 8px' }}
                >
                  <option value="">Tous les organisateurs</option>
                  {organizers.map(org => (
                    <option key={org.id} value={org.id}>
                      {org.organization_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-2 border-blue-600 p-4" style={{ borderRadius: '20px 8px 20px 8px' }}>
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-400 mt-1" />
                  <div className="text-sm text-white">
                    <p className="font-bold mb-2">Contenu du rapport :</p>
                    <ul className="space-y-1 text-[#B5B5B5]">
                      <li>• Détail de toutes les transactions</li>
                      <li>• Commission EvenPass (5%)</li>
                      <li>• Frais Mobile Money (1.5%)</li>
                      <li>• Net organisateurs (93.5%)</li>
                      <li>• Logo EvenPass pour rendu officiel</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={exporting}
                  className="flex-1 px-6 py-3 bg-[#0F0F0F] hover:bg-[#2A2A2A] text-white font-bold transition-colors border border-[#2A2A2A] disabled:opacity-50"
                  style={{ borderRadius: '20px 8px 20px 8px' }}
                >
                  Annuler
                </button>
                <button
                  onClick={exportToCSV}
                  disabled={exporting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-black transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
                  style={{ borderRadius: '20px 8px 20px 8px' }}
                >
                  <Download className="w-5 h-5" />
                  CSV
                </button>
                <button
                  onClick={exportToPDF}
                  disabled={exporting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-black transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
                  style={{ borderRadius: '20px 8px 20px 8px' }}
                >
                  <FileText className="w-5 h-5" />
                  PDF/HTML
                </button>
              </div>

              {exporting && (
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-[#FF5F05] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-white text-sm">Génération en cours...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
