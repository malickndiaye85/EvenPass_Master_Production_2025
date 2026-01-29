import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Calendar, Ticket, Bus, CreditCard, Download, FileText, Users, Settings } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/FirebaseAuthContext';
import DynamicLogo from '../components/DynamicLogo';
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
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'voyage'>('overview');
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

  if (authLoading || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-[#F8FAFC]'}`}>
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || (user.role !== 'super_admin' && user.id !== 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-[#F8FAFC]'}`}>
        <div className={`rounded-2xl p-8 text-center ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg max-w-md`}>
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-10 h-10 text-red-500" />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Accès Refusé
          </h2>
          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Vous devez être Super Admin pour accéder à cette page.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-[#0A7EA3] text-white rounded-xl font-bold hover:from-cyan-600 hover:to-[#006B8C] transition-all"
          >
            Retour à l'accueil
          </button>
        </div>
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

          <div className={`rounded-2xl p-2 mb-8 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg flex gap-2`}>
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${
                activeTab === 'overview'
                  ? isDark
                    ? 'bg-gradient-to-r from-cyan-500 to-[#0A7EA3] text-white'
                    : 'bg-gradient-to-r from-[#0A7EA3] to-[#005975] text-white'
                  : isDark
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="w-5 h-5 inline-block mr-2" />
              Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${
                activeTab === 'events'
                  ? isDark
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : isDark
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Ticket className="w-5 h-5 inline-block mr-2" />
              Gestion Événements (EVEN)
            </button>
            <button
              onClick={() => setActiveTab('voyage')}
              className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${
                activeTab === 'voyage'
                  ? isDark
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                  : isDark
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Bus className="w-5 h-5 inline-block mr-2" />
              Gestion Voyage (DEM-DEM)
            </button>
          </div>

          {activeTab === 'overview' && summary && (
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

          {activeTab === 'events' && (
            <div className={`rounded-2xl p-8 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <div className="flex items-center gap-3 mb-6">
                <Ticket className={`w-8 h-8 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Gestion des Événements
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <button
                  onClick={() => navigate('/dashboard')}
                  className={`p-6 rounded-xl border-2 text-left transition-all hover:scale-105 ${
                    isDark
                      ? 'bg-purple-900/20 border-purple-700 hover:bg-purple-900/30'
                      : 'bg-purple-50 border-purple-200 hover:bg-purple-100'
                  }`}
                >
                  <Users className={`w-10 h-10 mb-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Dashboard Admin EVEN
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Gestion complète des événements, organisateurs, paiements et billets
                  </p>
                </button>

                <button
                  onClick={() => navigate('/organizer/dashboard')}
                  className={`p-6 rounded-xl border-2 text-left transition-all hover:scale-105 ${
                    isDark
                      ? 'bg-pink-900/20 border-pink-700 hover:bg-pink-900/30'
                      : 'bg-pink-50 border-pink-200 hover:bg-pink-100'
                  }`}
                >
                  <Ticket className={`w-10 h-10 mb-4 ${isDark ? 'text-pink-400' : 'text-pink-600'}`} />
                  <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Espace Organisateurs
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Vue organisateur pour la gestion de leurs événements
                  </p>
                </button>

                <button
                  onClick={() => navigate('/epscan-plus')}
                  className={`p-6 rounded-xl border-2 text-left transition-all hover:scale-105 ${
                    isDark
                      ? 'bg-indigo-900/20 border-indigo-700 hover:bg-indigo-900/30'
                      : 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  <Settings className={`w-10 h-10 mb-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    EPscan Plus
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Scanner de billets et contrôle d'accès aux événements
                  </p>
                </button>

                <div className={`p-6 rounded-xl border-2 ${
                  isDark
                    ? 'bg-gray-900/20 border-gray-700'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <CreditCard className={`w-10 h-10 mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                  <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Statistiques EVEN
                  </h3>
                  <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Chiffre d'affaires total de la section événements
                  </p>
                  <div className={`text-3xl font-black ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                    {summary ? formatCurrency(summary.even_revenue) : '0 FCFA'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'voyage' && (
            <div className={`rounded-2xl p-8 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <div className="flex items-center gap-3 mb-6">
                <Bus className={`w-8 h-8 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Gestion Transport & Voyage
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <button
                  onClick={() => navigate('/pass')}
                  className={`p-6 rounded-xl border-2 text-left transition-all hover:scale-105 ${
                    isDark
                      ? 'bg-cyan-900/20 border-cyan-700 hover:bg-cyan-900/30'
                      : 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100'
                  }`}
                >
                  <Bus className={`w-10 h-10 mb-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                  <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Pass Maritime
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Réservations LMDG, COSAMA et Interrégional
                  </p>
                </button>

                <button
                  onClick={() => navigate('/voyage/wallet')}
                  className={`p-6 rounded-xl border-2 text-left transition-all hover:scale-105 ${
                    isDark
                      ? 'bg-green-900/20 border-green-700 hover:bg-green-900/30'
                      : 'bg-green-50 border-green-200 hover:bg-green-100'
                  }`}
                >
                  <CreditCard className={`w-10 h-10 mb-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    SAMA PASS
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Abonnements navettes DEM-DEM Express
                  </p>
                </button>

                <button
                  onClick={() => navigate('/transport')}
                  className={`p-6 rounded-xl border-2 text-left transition-all hover:scale-105 ${
                    isDark
                      ? 'bg-blue-900/20 border-blue-700 hover:bg-blue-900/30'
                      : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <Bus className={`w-10 h-10 mb-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Transport Hub
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Allo Dakar Taxi & DEM-DEM Express
                  </p>
                </button>

                <div className={`p-6 rounded-xl border-2 ${
                  isDark
                    ? 'bg-gray-900/20 border-gray-700'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <TrendingUp className={`w-10 h-10 mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                  <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Statistiques PASS
                  </h3>
                  <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Chiffre d'affaires total de la section transport
                  </p>
                  <div className={`text-3xl font-black ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                    {summary ? formatCurrency(summary.total_pass_revenue) : '0 FCFA'}
                  </div>
                </div>
              </div>

              {summary && (
                <div className={`mt-6 p-6 rounded-xl ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                  <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Détail des revenus PASS
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className={`text-xs font-semibold mb-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                        LMDG
                      </div>
                      <div className={`text-lg font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                        {formatCurrency(summary.pass_lmdg_revenue)}
                      </div>
                    </div>
                    <div>
                      <div className={`text-xs font-semibold mb-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                        COSAMA
                      </div>
                      <div className={`text-lg font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                        {formatCurrency(summary.pass_cosama_revenue)}
                      </div>
                    </div>
                    <div>
                      <div className={`text-xs font-semibold mb-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                        Interrégional
                      </div>
                      <div className={`text-lg font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                        {formatCurrency(summary.pass_interregional_revenue)}
                      </div>
                    </div>
                    <div>
                      <div className={`text-xs font-semibold mb-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                        Abonnements
                      </div>
                      <div className={`text-lg font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                        {formatCurrency(summary.pass_subscriptions_revenue)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTransversalDashboard;
