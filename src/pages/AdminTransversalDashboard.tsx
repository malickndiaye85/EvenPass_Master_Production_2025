import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Calendar, Ticket, Bus, CreditCard, Download, FileText } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import Logo from '../components/Logo';
import {
  getFinancialSummary,
  getPartnerReports,
  exportToCSV,
  formatCurrency,
  type FinancialSummary,
  type PartnerReport
} from '../lib/financialReports';

const AdminTransversalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [partnerReports, setPartnerReports] = useState<PartnerReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const summaryData = await getFinancialSummary(startDate || undefined, endDate || undefined);
    const reports = await getPartnerReports(startDate || undefined, endDate || undefined);
    setSummary(summaryData);
    setPartnerReports(reports);
    setLoading(false);
  };

  const handleFilter = () => {
    loadData();
  };

  const handleExportSummary = () => {
    if (!summary) return;

    const data = [
      { categorie: 'EVEN - Événements', montant: summary.even_revenue },
      { categorie: 'PASS - LMDG', montant: summary.pass_lmdg_revenue },
      { categorie: 'PASS - COSAMA', montant: summary.pass_cosama_revenue },
      { categorie: 'PASS - Interrégional', montant: summary.pass_interregional_revenue },
      { categorie: 'PASS - Abonnements', montant: summary.pass_subscriptions_revenue },
      { categorie: 'TOTAL PASS', montant: summary.total_pass_revenue },
      { categorie: 'TOTAL GÉNÉRAL', montant: summary.total_revenue }
    ];

    exportToCSV(data, 'resume_financier');
  };

  const handleExportPartners = () => {
    if (partnerReports.length === 0) return;

    const data = partnerReports.map(report => ({
      partenaire: report.partner_name,
      brut: report.gross_amount,
      commission_5: report.commission_5,
      frais_mm_1_5: report.mm_fees_1_5,
      net_partenaire: report.net_partner,
      nombre_transactions: report.transaction_count
    }));

    exportToCSV(data, 'rapport_partenaires');
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-[#F8FAFC]'}`}>
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[#F8FAFC]'}`}>
      <nav className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-xl border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
              <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'} group-hover:translate-x-[-4px] transition-transform`} />
              <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Accueil
              </span>
            </button>

            <div className="flex items-center gap-3">
              <Logo size="sm" variant="default" />
              <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Dashboard Transversal</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className={`text-4xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Vue Transversale Admin
            </h1>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Chiffre d'affaires EVEN & PASS
            </p>
          </div>

          <div className={`rounded-2xl p-6 mb-8 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
              <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Filtres</span>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date de début
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full p-3 rounded-xl border-2 ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:border-cyan-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date de fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full p-3 rounded-xl border-2 ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:border-cyan-500`}
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleFilter}
                  className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
                    isDark
                      ? 'bg-gradient-to-r from-cyan-500 to-[#0A7EA3] hover:from-cyan-600 hover:to-[#006B8C]'
                      : 'bg-gradient-to-r from-[#0A7EA3] to-[#005975] hover:from-[#006B8C] hover:to-[#00475E]'
                  }`}
                >
                  Appliquer
                </button>
              </div>
            </div>
          </div>

          {summary && (
            <>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className={`rounded-2xl p-6 ${isDark ? 'bg-gradient-to-br from-purple-900/50 to-pink-900/50' : 'bg-gradient-to-br from-purple-50 to-pink-50'} border-2 ${isDark ? 'border-purple-700' : 'border-purple-200'} shadow-lg transform hover:scale-105 transition-all`}>
                  <div className="flex items-center gap-3 mb-4">
                    <Ticket className={`w-8 h-8 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                    <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      EVEN
                    </span>
                  </div>
                  <div className={`text-3xl font-black ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                    {formatCurrency(summary.even_revenue)}
                  </div>
                  <div className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Événements & Billetterie
                  </div>
                </div>

                <div className={`rounded-2xl p-6 ${isDark ? 'bg-gradient-to-br from-cyan-900/50 to-blue-900/50' : 'bg-gradient-to-br from-cyan-50 to-blue-50'} border-2 ${isDark ? 'border-cyan-700' : 'border-cyan-200'} shadow-lg transform hover:scale-105 transition-all`}>
                  <div className="flex items-center gap-3 mb-4">
                    <Bus className={`w-8 h-8 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                    <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      PASS
                    </span>
                  </div>
                  <div className={`text-3xl font-black ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                    {formatCurrency(summary.total_pass_revenue)}
                  </div>
                  <div className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Transport & Abonnements
                  </div>
                </div>

                <div className={`rounded-2xl p-6 ${isDark ? 'bg-gradient-to-br from-green-900/50 to-emerald-900/50' : 'bg-gradient-to-br from-green-50 to-emerald-50'} border-2 ${isDark ? 'border-green-700' : 'border-green-200'} shadow-lg transform hover:scale-105 transition-all`}>
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className={`w-8 h-8 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                    <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      TOTAL
                    </span>
                  </div>
                  <div className={`text-3xl font-black ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    {formatCurrency(summary.total_revenue)}
                  </div>
                  <div className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Chiffre d'affaires global
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl p-6 mb-8 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Détails PASS
                  </h2>
                  <button
                    onClick={handleExportSummary}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
                      isDark
                        ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                        : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      LMDG
                    </div>
                    <div className={`text-xl font-black ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                      {formatCurrency(summary.pass_lmdg_revenue)}
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      COSAMA
                    </div>
                    <div className={`text-xl font-black ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                      {formatCurrency(summary.pass_cosama_revenue)}
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Interrégional
                    </div>
                    <div className={`text-xl font-black ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                      {formatCurrency(summary.pass_interregional_revenue)}
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Abonnements
                    </div>
                    <div className={`text-xl font-black ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                      {formatCurrency(summary.pass_subscriptions_revenue)}
                    </div>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Rapports Partenaires
                  </h2>
                  <button
                    onClick={handleExportPartners}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
                      isDark
                        ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                        : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>

                {partnerReports.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`border-b-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                          <th className={`text-left py-3 px-4 font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Partenaire
                          </th>
                          <th className={`text-right py-3 px-4 font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Brut
                          </th>
                          <th className={`text-right py-3 px-4 font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Commission 5%
                          </th>
                          <th className={`text-right py-3 px-4 font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Frais MM 1,5%
                          </th>
                          <th className={`text-right py-3 px-4 font-bold ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                            Net Partenaire
                          </th>
                          <th className={`text-center py-3 px-4 font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Transactions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {partnerReports.map((report, index) => (
                          <tr
                            key={index}
                            className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-100'} hover:bg-opacity-50 ${
                              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                            } transition-colors`}
                          >
                            <td className={`py-3 px-4 font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {report.partner_name}
                            </td>
                            <td className={`py-3 px-4 text-right font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {formatCurrency(report.gross_amount)}
                            </td>
                            <td className={`py-3 px-4 text-right font-mono ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                              -{formatCurrency(report.commission_5)}
                            </td>
                            <td className={`py-3 px-4 text-right font-mono ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                              -{formatCurrency(report.mm_fees_1_5)}
                            </td>
                            <td className={`py-3 px-4 text-right font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                              {formatCurrency(report.net_partner)}
                            </td>
                            <td className={`py-3 px-4 text-center font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {report.transaction_count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Aucun rapport disponible pour la période sélectionnée
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTransversalDashboard;
