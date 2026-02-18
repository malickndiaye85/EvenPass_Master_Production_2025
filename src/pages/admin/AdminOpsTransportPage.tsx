import React, { useState, useEffect } from 'react';
import { Bus, Calendar, Users, Shield, AlertTriangle, MapPin, Clock } from 'lucide-react';
import { useAuth } from '../../context/FirebaseAuthContext';
import { ref, onValue } from 'firebase/database';
import { db } from '../../firebase';

interface Shuttle {
  id: string;
  vehicle_number: string;
  capacity: number;
  route: string;
  status: 'active' | 'maintenance' | 'inactive';
  current_trips: number;
}

interface Subscriber {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  subscription_type: string;
  subscription_status: 'active' | 'suspended' | 'expired';
  total_trips: number;
  suspicious_activity: boolean;
  last_trip_date: string;
}

const AdminOpsTransportPage: React.FC = () => {
  const { user } = useAuth();
  const [shuttles, setShuttles] = useState<Shuttle[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;

    const shuttlesRef = ref(db, 'shuttles');
    const subscribersRef = ref(db, 'pass_subscribers');

    const unsubShuttles = onValue(shuttlesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const shuttlesArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setShuttles(shuttlesArray);
      } else {
        setShuttles([]);
      }
      setLoading(false);
    });

    const unsubSubscribers = onValue(subscribersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const subscribersArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setSubscribers(subscribersArray);
      } else {
        setSubscribers([]);
      }
    });

    return () => {
      unsubShuttles();
      unsubSubscribers();
    };
  }, []);

  const activeShuttles = shuttles.filter(s => s.status === 'active').length;
  const totalSubscribers = subscribers.length;
  const activeSubscribers = subscribers.filter(s => s.subscription_status === 'active').length;
  const suspiciousAccounts = subscribers.filter(s => s.suspicious_activity).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A8A] via-[#3B82F6] to-[#FBBF24] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Ops Transport - DEM-DEM Express</h1>
          <p className="text-blue-100">Gestion de la flotte et des abonnés</p>
          <div className="mt-2 inline-block bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
            <span className="text-blue-100 text-sm">Silo: <span className="font-bold text-white">VOYAGE</span></span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <Bus className="text-green-300" size={24} />
              <span className="text-2xl font-bold text-white">{activeShuttles}</span>
            </div>
            <p className="text-blue-100 text-sm">Navettes actives</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <Users className="text-blue-300" size={24} />
              <span className="text-2xl font-bold text-white">{activeSubscribers}</span>
            </div>
            <p className="text-blue-100 text-sm">Abonnés actifs</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="text-yellow-300" size={24} />
              <span className="text-2xl font-bold text-white">{totalSubscribers}</span>
            </div>
            <p className="text-blue-100 text-sm">Total abonnés</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="text-red-300" size={24} />
              <span className="text-2xl font-bold text-white">{suspiciousAccounts}</span>
            </div>
            <p className="text-blue-100 text-sm">Activités suspectes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
            <div className="p-6 border-b border-white/20">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Bus className="mr-3" size={28} />
                Flotte de Navettes
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              ) : shuttles.length === 0 ? (
                <p className="text-blue-200 text-center py-8">Aucune navette enregistrée</p>
              ) : (
                shuttles.map((shuttle) => (
                  <div
                    key={shuttle.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <Bus className="text-blue-300" size={24} />
                        <div>
                          <div className="text-white font-bold">{shuttle.vehicle_number}</div>
                          <div className="text-blue-200 text-sm">{shuttle.route}</div>
                        </div>
                      </div>
                      {shuttle.status === 'active' ? (
                        <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium border border-green-500/30">
                          Actif
                        </span>
                      ) : shuttle.status === 'maintenance' ? (
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-medium border border-yellow-500/30">
                          Maintenance
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-medium border border-red-500/30">
                          Inactif
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm text-blue-200 mt-3">
                      <span>Capacité: {shuttle.capacity} places</span>
                      <span>Trajets: {shuttle.current_trips || 0}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
            <div className="p-6 border-b border-white/20">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Shield className="mr-3" size={28} />
                Outils Anti-Fraude
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {suspiciousAccounts === 0 ? (
                <div className="text-center py-8">
                  <Shield className="inline-block text-green-300 mb-3" size={48} />
                  <p className="text-green-300 font-medium">Aucune activité suspecte détectée</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {subscribers
                    .filter(s => s.suspicious_activity)
                    .map((subscriber) => (
                      <div
                        key={subscriber.id}
                        className="bg-red-500/10 border border-red-500/30 rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <AlertTriangle className="text-red-300" size={20} />
                            <div>
                              <div className="text-white font-medium">{subscriber.full_name}</div>
                              <div className="text-red-200 text-sm">{subscriber.phone}</div>
                            </div>
                          </div>
                        </div>
                        <div className="text-red-300 text-sm mt-2">
                          Activité inhabituelle détectée - À vérifier
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-white/20">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Users className="mr-3" size={28} />
              Base de Données des Abonnés
            </h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            ) : subscribers.length === 0 ? (
              <div className="p-12 text-center text-blue-200">
                Aucun abonné enregistré
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-100">Abonné</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-100">Contact</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-100">Type abonnement</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-100">Statut</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-100">Trajets</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-100">Dernier trajet</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-100">Alerte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {subscribers.map((subscriber) => (
                    <tr key={subscriber.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{subscriber.full_name}</td>
                      <td className="px-6 py-4">
                        <div className="text-blue-200 text-sm">{subscriber.email}</div>
                        <div className="text-blue-200 text-sm">{subscriber.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-white">{subscriber.subscription_type}</td>
                      <td className="px-6 py-4">
                        {subscriber.subscription_status === 'active' ? (
                          <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium border border-green-500/30">
                            Actif
                          </span>
                        ) : subscriber.subscription_status === 'suspended' ? (
                          <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-xs font-medium border border-orange-500/30">
                            Suspendu
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-medium border border-red-500/30">
                            Expiré
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-white">{subscriber.total_trips || 0}</td>
                      <td className="px-6 py-4 text-blue-200 text-sm">
                        {subscriber.last_trip_date
                          ? new Date(subscriber.last_trip_date).toLocaleDateString('fr-FR')
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {subscriber.suspicious_activity && (
                          <AlertTriangle className="text-red-400" size={20} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOpsTransportPage;
