import React, { useState } from 'react';
import {
  Ticket,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Smartphone,
  ArrowLeft,
  BarChart3,
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats] = useState({
    totalRevenue: 12500000,
    revenuePercentage: 93.5,
    mobileMoneyFees: 1.5,
    ticketsSold: 458,
    upcomingEvents: 12,
    activeUsers: 1230,
  });

  const StatCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    value: string;
    percentage?: string;
    trend?: 'up' | 'down';
    subtitle?: string;
  }> = ({ icon, title, value, percentage, trend, subtitle }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-orange-500 transition-all shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-500">
          {icon}
        </div>
        {percentage && (
          <div
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
              trend === 'up'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            }`}
          >
            <TrendingUp size={16} />
            {percentage}
          </div>
        )}
      </div>
      <h3 className="text-gray-600 dark:text-gray-400 text-sm font-bold mb-2">{title}</h3>
      <p className="text-3xl font-black text-gray-900 dark:text-white mb-1">{value}</p>
      {subtitle && (
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{subtitle}</p>
      )}
    </div>
  );

  const recentEvents = [
    {
      id: 1,
      name: 'Soirée Afrobeats Premium',
      date: '2025-01-15',
      ticketsSold: 156,
      revenue: 4500000,
    },
    {
      id: 2,
      name: 'Festival de Jazz',
      date: '2025-01-20',
      ticketsSold: 203,
      revenue: 6800000,
    },
    {
      id: 3,
      name: 'Conférence Tech 2025',
      date: '2025-02-01',
      ticketsSold: 99,
      revenue: 5200000,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 mb-8 font-bold transition-colors"
        >
          <ArrowLeft size={20} />
          Retour à l'accueil
        </button>

        <div className="flex items-center gap-4 mb-12">
          <div className="p-3 bg-orange-500 rounded-2xl">
            <Ticket className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white">
              Dashboard <span className="text-orange-500">DemDem Transports & Events</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Vue d'ensemble de vos événements
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <StatCard
            icon={<DollarSign size={24} />}
            title="Revenus Totaux"
            value={`${stats.totalRevenue.toLocaleString()} FCFA`}
            percentage={`${stats.revenuePercentage}%`}
            trend="up"
            subtitle="Part des revenus nets"
          />

          <StatCard
            icon={<Smartphone size={24} />}
            title="Frais Mobile Money"
            value={`${stats.mobileMoneyFees}%`}
            subtitle="Commission sur les transactions"
          />

          <StatCard
            icon={<Ticket size={24} />}
            title="Billets Vendus"
            value={stats.ticketsSold.toString()}
            percentage="+12%"
            trend="up"
            subtitle="Ce mois"
          />

          <StatCard
            icon={<Calendar size={24} />}
            title="Événements à Venir"
            value={stats.upcomingEvents.toString()}
            subtitle="Événements planifiés"
          />

          <StatCard
            icon={<Users size={24} />}
            title="Utilisateurs Actifs"
            value={stats.activeUsers.toLocaleString()}
            percentage="+8%"
            trend="up"
            subtitle="Cette semaine"
          />

          <StatCard
            icon={<BarChart3 size={24} />}
            title="Taux de Conversion"
            value="68%"
            percentage="+5%"
            trend="up"
            subtitle="Visiteurs → Achats"
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-gray-200 dark:border-gray-700 shadow-lg">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">
            Événements Récents
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="text-left py-4 px-4 text-gray-600 dark:text-gray-400 font-bold">
                    Événement
                  </th>
                  <th className="text-left py-4 px-4 text-gray-600 dark:text-gray-400 font-bold">
                    Date
                  </th>
                  <th className="text-left py-4 px-4 text-gray-600 dark:text-gray-400 font-bold">
                    Billets Vendus
                  </th>
                  <th className="text-left py-4 px-4 text-gray-600 dark:text-gray-400 font-bold">
                    Revenus
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="py-4 px-4 font-bold text-gray-900 dark:text-white">
                      {event.name}
                    </td>
                    <td className="py-4 px-4 text-gray-600 dark:text-gray-400 font-medium">
                      {new Date(event.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-4 px-4 text-gray-900 dark:text-white font-bold">
                      {event.ticketsSold}
                    </td>
                    <td className="py-4 px-4 text-orange-500 font-black">
                      {event.revenue.toLocaleString()} FCFA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-black mb-2">Besoin d'aide ?</h3>
              <p className="text-orange-100 font-medium">
                Notre équipe est disponible 24/7 pour vous accompagner
              </p>
            </div>
            <button className="bg-white text-orange-500 hover:bg-gray-100 px-8 py-3 rounded-full font-black transition-all transform hover:scale-105">
              CONTACTER LE SUPPORT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
