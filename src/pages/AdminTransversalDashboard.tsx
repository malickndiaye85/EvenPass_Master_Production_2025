import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Calendar, Ticket, Bus, CreditCard, Download, FileText, Users, Settings, LogOut, Shield, Clock, Ship, Car, Navigation2, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/FirebaseAuthContext';
import DynamicLogo from '../components/DynamicLogo';
import Logo from '../components/Logo';
import AdminLandingBackgroundsManager from '../components/AdminLandingBackgroundsManager';
import StaffManagementTab from '../components/StaffManagementTab';
import AccessDenied from '../components/AccessDenied';
import OrganizerVerificationTab from '../components/OrganizerVerificationTab';
import DriversVerificationTab from '../components/DriversVerificationTab';
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
  const { user, loading: authLoading, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'voyage' | 'staff' | 'settings'>('overview');
  const [eventsSubTab, setEventsSubTab] = useState<'validation' | 'billetterie' | 'litiges' | 'finance'>('validation');
  const [voyageSubTab, setVoyageSubTab] = useState<'validation' | 'trajets' | 'flotte' | 'finance' | 'services'>('services');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'pending_docs' | 'verified'>('all');
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
      { categorie: 'VOYAGE - Allo Dakar', montant: 0 },
      { categorie: 'VOYAGE - DemDem Express', montant: summary.pass_subscriptions_revenue },
      { categorie: 'VOYAGE - DEM Ziguinchor (COSAMA)', montant: summary.pass_cosama_revenue },
      { categorie: 'TOTAL VOYAGE', montant: summary.total_pass_revenue },
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

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/admin/finance/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B]">
        <div className="w-12 h-12 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || (user.role !== 'super_admin' && user.id !== 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')) {
    return (
      <AccessDenied
        title="Accès Réservé Super Admin"
        message="Vous devez être Super Admin pour accéder au Dashboard Transversal."
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0B]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
              <ArrowLeft className="w-5 h-5 text-[#10B981] group-hover:translate-x-[-4px] transition-transform" />
              <span className="font-medium text-white/80">
                Accueil
              </span>
            </button>

            <div className="flex items-center gap-6">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all bg-red-500/20 text-red-400 hover:bg-red-500/30"
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-black mb-2 text-white">
              Vue Transversale Admin
            </h1>
            <p className="text-lg text-white/60">
              Chiffre d'affaires EVEN & PASS
            </p>
          </div>

          <div className="rounded-2xl p-6 mb-8 bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-[#10B981]" />
              <span className="font-bold text-white">Filtres</span>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-white/80">
                  Date de début
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-3 rounded-xl border bg-white/5 border-white/10 text-white focus:outline-none focus:border-[#10B981]/50 focus:bg-white/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-white/80">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-3 rounded-xl border bg-white/5 border-white/10 text-white focus:outline-none focus:border-[#10B981]/50 focus:bg-white/10 transition-all"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleFilter}
                  className="w-full py-3 rounded-xl font-bold bg-[#10B981] text-black hover:bg-[#059669] transition-all"
                >
                  Appliquer
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-2 mb-8 bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-[#10B981] text-black'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <TrendingUp className="w-5 h-5 inline-block mr-2" />
              Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all whitespace-nowrap ${
                activeTab === 'events'
                  ? 'bg-[#10B981] text-black'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Ticket className="w-5 h-5 inline-block mr-2" />
              EVEN
            </button>
            <button
              onClick={() => setActiveTab('voyage')}
              className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all whitespace-nowrap ${
                activeTab === 'voyage'
                  ? 'bg-[#10B981] text-black'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Bus className="w-5 h-5 inline-block mr-2" />
              DEM-DEM
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all whitespace-nowrap ${
                activeTab === 'staff'
                  ? 'bg-[#10B981] text-black'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Shield className="w-5 h-5 inline-block mr-2" />
              Staff
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-[#10B981] text-black'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Settings className="w-5 h-5 inline-block mr-2" />
              Paramètres
            </button>
          </div>

          {activeTab === 'overview' && summary && (
            <>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="rounded-2xl p-6 bg-white/5 backdrop-blur-sm border border-orange-500/20 shadow-2xl transform hover:scale-105 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-orange-500/20">
                      <Ticket className="w-6 h-6 text-orange-400" />
                    </div>
                    <span className="text-lg font-bold text-white">
                      EVEN
                    </span>
                  </div>
                  <div className="text-3xl font-black text-orange-400">
                    {formatCurrency(summary.even_revenue)}
                  </div>
                  <div className="text-sm mt-2 text-white/60">
                    Événements & Billetterie
                  </div>
                </div>

                <div className="rounded-2xl p-6 bg-white/5 backdrop-blur-sm border border-cyan-500/20 shadow-2xl transform hover:scale-105 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-cyan-500/20">
                      <Bus className="w-6 h-6 text-cyan-400" />
                    </div>
                    <span className="text-lg font-bold text-white">
                      DEM-DEM
                    </span>
                  </div>
                  <div className="text-3xl font-black text-cyan-400">
                    {formatCurrency(summary.total_pass_revenue)}
                  </div>
                  <div className="text-sm mt-2 text-white/60">
                    Transport & Abonnements
                  </div>
                </div>

                <div className="rounded-2xl p-6 bg-white/5 backdrop-blur-sm border border-[#10B981]/20 shadow-2xl transform hover:scale-105 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-[#10B981]/20">
                      <TrendingUp className="w-6 h-6 text-[#10B981]" />
                    </div>
                    <span className="text-lg font-bold text-white">
                      TOTAL
                    </span>
                  </div>
                  <div className="text-3xl font-black text-[#10B981]">
                    {formatCurrency(summary.total_revenue)}
                  </div>
                  <div className="text-sm mt-2 text-white/60">
                    Chiffre d'affaires global
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-6 mb-8 bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-white">
                    Détails DEM-DEM
                  </h2>
                  <button
                    onClick={handleExportSummary}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all bg-[#10B981]/20 text-[#10B981] hover:bg-[#10B981]/30"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-sm font-semibold mb-1 text-white/60">
                      Allo Dakar
                    </div>
                    <div className="text-xl font-black text-[#10B981]">
                      0 FCFA
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-sm font-semibold mb-1 text-white/60">
                      DemDem Express
                    </div>
                    <div className="text-xl font-black text-blue-400">
                      0 FCFA
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-sm font-semibold mb-1 text-white/60">
                      DEM Ziguinchor (COSAMA)
                    </div>
                    <div className="text-xl font-black text-cyan-400">
                      {formatCurrency(summary.pass_cosama_revenue)}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                    <div className="text-sm font-semibold mb-1 text-purple-400">
                      Abonnements
                    </div>
                    <div className="text-xl font-black text-purple-300">
                      {formatCurrency(summary.pass_subscriptions_revenue)}
                    </div>
                    <div className="text-xs text-white/50 mt-1">
                      GENAA & GAAW
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-6 bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-white">
                    Rapports Partenaires
                  </h2>
                  <button
                    onClick={handleExportPartners}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all bg-[#10B981]/20 text-[#10B981] hover:bg-[#10B981]/30"
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
            <div className="rounded-2xl p-6 bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <Ticket className="w-8 h-8 text-purple-400" />
                <h2 className="text-2xl font-black text-white">
                  Gestion des Événements (EVEN)
                </h2>
              </div>

              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                <button
                  onClick={() => setEventsSubTab('validation')}
                  className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                    eventsSubTab === 'validation'
                      ? 'bg-[#10B981] text-black'
                      : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                  }`}
                >
                  Validation KYC
                </button>
                <button
                  onClick={() => setEventsSubTab('billetterie')}
                  className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                    eventsSubTab === 'billetterie'
                      ? 'bg-[#10B981] text-black'
                      : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                  }`}
                >
                  Suivi Billetterie
                </button>
                <button
                  onClick={() => setEventsSubTab('litiges')}
                  className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                    eventsSubTab === 'litiges'
                      ? 'bg-[#10B981] text-black'
                      : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                  }`}
                >
                  Litiges
                </button>
                <button
                  onClick={() => setEventsSubTab('finance')}
                  className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                    eventsSubTab === 'finance'
                      ? 'bg-[#10B981] text-black'
                      : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                  }`}
                >
                  Finance
                </button>
              </div>

              {eventsSubTab === 'validation' && (
                <OrganizerVerificationTab />
              )}

              {eventsSubTab === 'finance' && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Finance EVEN</h3>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm font-semibold text-purple-400">Chiffre d'affaires Total</div>
                        <TrendingUp className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="text-4xl font-black text-white mb-2">
                        {summary ? formatCurrency(summary.even_revenue) : '0 FCFA'}
                      </div>
                      <div className="text-xs text-white/50">Toutes ventes confondues</div>
                    </div>

                    <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm font-semibold text-green-400">Commissions Encaissées</div>
                        <CreditCard className="w-6 h-6 text-green-400" />
                      </div>
                      <div className="text-4xl font-black text-white mb-2">
                        {summary ? formatCurrency(summary.even_revenue * 0.05) : '0 FCFA'}
                      </div>
                      <div className="text-xs text-white/50">5% de commission platform</div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm font-semibold text-cyan-400">⚡ Fonds Libérés VIP (70%)</div>
                        <CheckCircle className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div className="text-4xl font-black text-white mb-2">
                        {summary ? formatCurrency(summary.even_revenue * 0.70 * 0.1) : '0 FCFA'}
                      </div>
                      <div className="text-xs text-white/50">Reversement immédiat événements VIP Fast Track</div>
                    </div>

                    <div className="p-6 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm font-semibold text-orange-400">Encours Séquestre</div>
                        <Shield className="w-6 h-6 text-orange-400" />
                      </div>
                      <div className="text-4xl font-black text-white mb-2">
                        {summary ? formatCurrency(summary.even_revenue * 0.85) : '0 FCFA'}
                      </div>
                      <div className="text-xs text-white/50">Fonds en attente de libération après scan</div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-xs font-semibold mb-1 text-white/60">Événements Standard</div>
                      <div className="text-xl font-bold text-white">95% séquestre</div>
                      <div className="text-xs text-white/50 mt-1">Libéré après scan</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-xs font-semibold mb-1 text-white/60">Événements VIP (≥2000)</div>
                      <div className="text-xl font-bold text-cyan-400">70% immédiat</div>
                      <div className="text-xs text-white/50 mt-1">+ 25% séquestre</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-xs font-semibold mb-1 text-white/60">Frais de Service</div>
                      <div className="text-xl font-bold text-green-400">Max 2500 FCFA</div>
                      <div className="text-xs text-white/50 mt-1">Plafond par billet</div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm">
                    <AlertCircle className="w-5 h-5 inline-block mr-2" />
                    <strong>Modèle VIP Fast Track :</strong> Les événements ≥2000 places avec Accord Exclusivité bénéficient du reversement automatique de 70% du CA après chaque vente
                  </div>
                </div>
              )}

              {eventsSubTab === 'billetterie' && (
                <div className="text-center py-12 text-white/60">
                  <Ticket className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Interface de suivi billetterie en développement</p>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="mt-4 px-4 py-2 rounded-xl font-bold bg-[#10B981] text-black hover:bg-[#059669] transition-all"
                  >
                    Accéder au Dashboard Admin
                  </button>
                </div>
              )}

              {eventsSubTab === 'litiges' && (
                <div className="text-center py-12 text-white/60">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Interface de gestion des litiges en développement</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'voyage' && (
            <div className="rounded-2xl p-6 bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <Bus className="w-8 h-8 text-cyan-400" />
                <h2 className="text-2xl font-black text-white">
                  Gestion Transport & Voyage (DEM-DEM)
                </h2>
              </div>

              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                <button
                  onClick={() => setVoyageSubTab('services')}
                  className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                    voyageSubTab === 'services'
                      ? 'bg-[#10B981] text-black'
                      : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                  }`}
                >
                  Services
                </button>
                <button
                  onClick={() => setVoyageSubTab('validation')}
                  className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                    voyageSubTab === 'validation'
                      ? 'bg-[#10B981] text-black'
                      : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                  }`}
                >
                  Validation Chauffeurs
                </button>
                <button
                  onClick={() => setVoyageSubTab('trajets')}
                  className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                    voyageSubTab === 'trajets'
                      ? 'bg-[#10B981] text-black'
                      : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                  }`}
                >
                  Suivi Trajets
                </button>
                <button
                  onClick={() => setVoyageSubTab('flotte')}
                  className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                    voyageSubTab === 'flotte'
                      ? 'bg-[#10B981] text-black'
                      : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                  }`}
                >
                  Gestion Flotte Express
                </button>
                <button
                  onClick={() => setVoyageSubTab('finance')}
                  className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                    voyageSubTab === 'finance'
                      ? 'bg-[#10B981] text-black'
                      : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                  }`}
                >
                  Finance
                </button>
              </div>

              {voyageSubTab === 'services' && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Détails DEM-DEM</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <button
                      onClick={() => navigate('/transport/allodakar')}
                      className="p-6 rounded-xl border-2 border-[#10B981]/30 bg-[#10B981]/10 text-left transition-all hover:scale-105 hover:border-[#10B981]/50"
                    >
                      <Car className="w-10 h-10 mb-4 text-[#10B981]" />
                      <h3 className="text-xl font-bold mb-2 text-white">
                        Allo Dakar
                      </h3>
                      <p className="text-sm text-white/70">
                        Covoiturage urbain et interurbain
                      </p>
                      <div className="mt-3 text-xs text-white/50">
                        Trajets 72h • Commission 5%
                      </div>
                    </button>

                    <button
                      onClick={() => navigate('/transport/demdem-express')}
                      className="p-6 rounded-xl border-2 border-blue-500/30 bg-blue-500/10 text-left transition-all hover:scale-105 hover:border-blue-500/50"
                    >
                      <Navigation2 className="w-10 h-10 mb-4 text-blue-400" />
                      <h3 className="text-xl font-bold mb-2 text-white">
                        DemDem Express
                      </h3>
                      <p className="text-sm text-white/70">
                        Navettes express programmées
                      </p>
                      <div className="mt-3 text-xs text-white/50">
                        Lignes fixes • Abonnements
                      </div>
                    </button>

                    <button
                      onClick={() => navigate('/pass/cosama')}
                      className="p-6 rounded-xl border-2 border-cyan-500/30 bg-cyan-500/10 text-left transition-all hover:scale-105 hover:border-cyan-500/50"
                    >
                      <Ship className="w-10 h-10 mb-4 text-cyan-400" />
                      <h3 className="text-xl font-bold mb-2 text-white">
                        DEM Ziguinchor
                      </h3>
                      <p className="text-sm text-white/70">
                        Réservation maritime COSAMA
                      </p>
                      <div className="mt-3 text-xs text-white/50">
                        Dakar ↔ Ziguinchor
                      </div>
                    </button>
                  </div>

                  <div className="mt-6 p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-2 border-blue-500/30">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <Navigation2 className="w-7 h-7 text-blue-400" />
                        <h4 className="text-xl font-bold text-white">Configuration DEM-DEM Express</h4>
                      </div>
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-bold">
                        Tarification Navettes
                      </span>
                    </div>

                    <div className="bg-blue-900/20 rounded-xl p-5 mb-4 border border-blue-500/20">
                      <div className="flex items-start gap-3 mb-4">
                        <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-blue-400 mb-1">
                            Prix des Abonnements Navettes
                          </p>
                          <p className="text-xs text-gray-400">
                            Configurez les tarifs pour les différentes formules d'abonnement aux navettes express. Ces prix s'appliquent aux lignes fixes programmées.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold text-white/70">Abonnement Journalier</span>
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-bold">1 jour</span>
                        </div>
                        <input
                          type="number"
                          placeholder="2000"
                          defaultValue="2000"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-lg font-bold placeholder-gray-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 mb-2"
                        />
                        <p className="text-xs text-gray-400">Prix en FCFA</p>
                      </div>

                      <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold text-white/70">Abonnement Hebdomadaire</span>
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-bold">7 jours</span>
                        </div>
                        <input
                          type="number"
                          placeholder="12000"
                          defaultValue="12000"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-lg font-bold placeholder-gray-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 mb-2"
                        />
                        <p className="text-xs text-gray-400">Prix en FCFA</p>
                      </div>

                      <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold text-white/70">Abonnement Mensuel</span>
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-bold">30 jours</span>
                        </div>
                        <input
                          type="number"
                          placeholder="40000"
                          defaultValue="40000"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-lg font-bold placeholder-gray-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 mb-2"
                        />
                        <p className="text-xs text-gray-400">Prix en FCFA</p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                        <Settings className="w-5 h-5" />
                        Enregistrer les tarifs
                      </button>
                      <button className="bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-xl font-bold transition-all">
                        Annuler
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 p-6 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="text-lg font-bold text-white mb-4">Statistiques Globales</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20">
                        <div className="text-sm font-semibold mb-1 text-white/60">Allo Dakar</div>
                        <div className="text-2xl font-black text-[#10B981]">0 FCFA</div>
                      </div>
                      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <div className="text-sm font-semibold mb-1 text-white/60">DemDem Express</div>
                        <div className="text-2xl font-black text-blue-400">
                          {summary ? formatCurrency(summary.pass_subscriptions_revenue) : '0 FCFA'}
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                        <div className="text-sm font-semibold mb-1 text-white/60">DEM Ziguinchor</div>
                        <div className="text-2xl font-black text-cyan-400">
                          {summary ? formatCurrency(summary.pass_cosama_revenue) : '0 FCFA'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {voyageSubTab === 'validation' && (
                <DriversVerificationTab />
              )}

              {voyageSubTab === 'finance' && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Finance VOYAGE</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                      <div className="text-sm font-semibold mb-2 text-cyan-400">Revenus Totaux</div>
                      <div className="text-3xl font-black text-white">
                        {summary ? formatCurrency(summary.total_pass_revenue) : '0 FCFA'}
                      </div>
                    </div>
                    <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/20">
                      <div className="text-sm font-semibold mb-2 text-green-400">Commission Platform (5%)</div>
                      <div className="text-3xl font-black text-white">
                        {summary ? formatCurrency(summary.total_pass_revenue * 0.05) : '0 FCFA'}
                      </div>
                      <div className="text-xs mt-2 text-white/60">Prélevé via PayDunya</div>
                    </div>
                    <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20">
                      <div className="text-sm font-semibold mb-2 text-orange-400">Séquestre Chauffeurs (95%)</div>
                      <div className="text-3xl font-black text-white">
                        {summary ? formatCurrency(summary.total_pass_revenue * 0.95) : '0 FCFA'}
                      </div>
                      <div className="text-xs mt-2 text-white/60">En attente de reversement</div>
                    </div>
                  </div>
                  <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm">
                    <AlertCircle className="w-5 h-5 inline-block mr-2" />
                    Les 95% restants sont reversés aux chauffeurs/compagnies après validation des trajets effectués
                  </div>
                </div>
              )}

              {voyageSubTab === 'trajets' && (
                <div className="text-center py-12 text-white/60">
                  <Bus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Interface de suivi des trajets en développement</p>
                </div>
              )}

              {voyageSubTab === 'flotte' && (
                <div className="text-center py-12 text-white/60">
                  <Navigation2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Interface de gestion de flotte en développement</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="rounded-2xl p-8 bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl">
              <StaffManagementTab isDark={isDark} superAdminId={user?.id || ''} />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className={`rounded-2xl p-8 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <AdminLandingBackgroundsManager isDark={isDark} userId={user?.id || ''} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTransversalDashboard;
