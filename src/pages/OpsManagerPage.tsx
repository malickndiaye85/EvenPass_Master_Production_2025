import { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  MapPin,
  CheckCircle,
  XCircle,
  Shield,
  Zap,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/MockAuthContext';
import { mockEvents, mockOpsStats } from '../lib/mockData';

export default function OpsManagerPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FFB800] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      <div className="border-b border-[#2A2A2A] bg-[#0F0F0F]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FFB800] to-[#FF8C00] flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Ops Manager</h1>
                <p className="text-sm text-[#B5B5B5]">Gestion des opérations</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#B5B5B5]">{user?.email}</span>
              <div className="w-8 h-8 rounded-full bg-[#FFB800] flex items-center justify-center">
                <span className="text-xs font-bold text-white">OM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#1A1A1A] rounded-xl p-6 border border-[#2A2A2A]">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-[#FFB800]" />
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">{mockOpsStats.totalEvents}</p>
            <p className="text-sm text-[#B5B5B5]">Total Événements</p>
          </div>

          <div className="bg-[#1A1A1A] rounded-xl p-6 border border-[#2A2A2A]">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-8 h-8 text-green-500" />
              <Activity className="w-4 h-4 text-[#FFB800]" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">{mockOpsStats.activeEvents}</p>
            <p className="text-sm text-[#B5B5B5]">Événements Actifs</p>
          </div>

          <div className="bg-[#1A1A1A] rounded-xl p-6 border border-[#2A2A2A]">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-[#FF7A00]" />
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">{mockOpsStats.verifiedOrganizers}</p>
            <p className="text-sm text-[#B5B5B5]">Organisateurs Vérifiés</p>
          </div>

          <div className="bg-[#1A1A1A] rounded-xl p-6 border border-[#2A2A2A]">
            <div className="flex items-center justify-between mb-2">
              <MapPin className="w-8 h-8 text-blue-500" />
              <span className="text-xs font-semibold text-[#FFB800]">{mockOpsStats.occupancyRate}%</span>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{mockOpsStats.totalTicketsSold}</p>
            <p className="text-sm text-[#B5B5B5]">Billets Vendus</p>
          </div>
        </div>

        <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] overflow-hidden mb-8">
          <div className="p-6 border-b border-[#2A2A2A]">
            <h2 className="text-lg font-bold text-white">Activités Récentes</h2>
          </div>
          <div className="divide-y divide-[#2A2A2A]">
            {mockOpsStats.recentActivities.map((activity, index) => (
              <div key={index} className="p-6 hover:bg-[#2A2A2A]/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#2A2A2A] flex items-center justify-center flex-shrink-0">
                    {activity.action.includes('créé') && <Calendar className="w-5 h-5 text-[#FFB800]" />}
                    {activity.action.includes('vérifié') && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {activity.action.includes('publié') && <Zap className="w-5 h-5 text-[#FF7A00]" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium mb-1">{activity.action}</p>
                    <p className="text-sm text-[#B5B5B5]">
                      {activity.organizer}
                      {activity.event && ` • ${activity.event}`}
                    </p>
                  </div>
                  <span className="text-sm text-[#B5B5B5]">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] overflow-hidden">
          <div className="p-6 border-b border-[#2A2A2A]">
            <h2 className="text-lg font-bold text-white">Événements en Production</h2>
          </div>
          <div className="divide-y divide-[#2A2A2A]">
            {mockEvents.slice(0, 5).map((event) => (
              <div key={event.id} className="p-6 hover:bg-[#2A2A2A]/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-2">{event.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-[#B5B5B5]">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(event.start_date).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.venue_city}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {event.organizer?.organization_name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {event.status === 'published' ? (
                      <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
                        Publié
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-orange-500/10 text-[#FF7A00] text-xs font-medium">
                        Brouillon
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
