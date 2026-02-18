import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, DollarSign, Calendar, Users, TrendingUp, FileText } from 'lucide-react';
import { useAuth } from '../../context/FirebaseAuthContext';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../../firebase';
import { securityLogger } from '../../lib/securityLogger';

interface Event {
  id: string;
  title: string;
  organizer_name: string;
  organizer_email: string;
  total_revenue?: number;
  commission_demdem?: number;
  organizer_share?: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const AdminFinanceEventPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    if (!db) return;

    const eventsRef = ref(db, 'events');
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const eventsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setEvents(eventsArray);
      } else {
        setEvents([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (eventId: string, eventTitle: string) => {
    if (!db || !user) return;

    try {
      await update(ref(db, `events/${eventId}`), {
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.email
      });

      if (user.email && user.id && user.role) {
        await securityLogger.log({
          event_type: 'finance_access',
          user_email: user.email,
          user_id: user.id,
          user_role: user.role,
          action: `Event approved: ${eventTitle}`,
          success: true,
          metadata: { event_id: eventId, event_title: eventTitle }
        });
      }

      alert('Événement approuvé avec succès');
    } catch (error) {
      console.error('Error approving event:', error);
      alert('Erreur lors de l\'approbation');
    }
  };

  const handleReject = async (eventId: string, eventTitle: string) => {
    const reason = prompt('Raison du rejet (optionnel):');

    if (!db || !user) return;

    try {
      await update(ref(db, `events/${eventId}`), {
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: user.email,
        rejection_reason: reason || 'Non spécifié'
      });

      if (user.email && user.id && user.role) {
        await securityLogger.log({
          event_type: 'finance_access',
          user_email: user.email,
          user_id: user.id,
          user_role: user.role,
          action: `Event rejected: ${eventTitle}`,
          success: true,
          metadata: { event_id: eventId, event_title: eventTitle, reason }
        });
      }

      alert('Événement rejeté');
    } catch (error) {
      console.error('Error rejecting event:', error);
      alert('Erreur lors du rejet');
    }
  };

  const handleRequestModification = async (eventId: string, eventTitle: string) => {
    const modifications = prompt('Modifications demandées:');

    if (!modifications || !db || !user) return;

    try {
      await update(ref(db, `events/${eventId}`), {
        modification_requested: true,
        modification_message: modifications,
        modification_requested_at: new Date().toISOString(),
        modification_requested_by: user.email
      });

      alert('Demande de modification envoyée à l\'organisateur');
    } catch (error) {
      console.error('Error requesting modification:', error);
      alert('Erreur lors de l\'envoi de la demande');
    }
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    return event.status === filter;
  });

  const pendingCount = events.filter(e => e.status === 'pending').length;
  const approvedCount = events.filter(e => e.status === 'approved').length;
  const totalRevenue = events.reduce((sum, e) => sum + (e.total_revenue || 0), 0);
  const totalCommission = events.reduce((sum, e) => sum + (e.commission_demdem || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6366F1] via-[#8B5CF6] to-[#A855F7] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Finance Événements</h1>
          <p className="text-purple-100">Validation et comptabilité des événements</p>
          <div className="mt-2 inline-block bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
            <span className="text-purple-100 text-sm">Silo: <span className="font-bold text-white">ÉVÉNEMENT</span></span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="text-yellow-300" size={24} />
              <span className="text-2xl font-bold text-white">{pendingCount}</span>
            </div>
            <p className="text-purple-100 text-sm">En attente</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="text-green-300" size={24} />
              <span className="text-2xl font-bold text-white">{approvedCount}</span>
            </div>
            <p className="text-purple-100 text-sm">Approuvés</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-blue-300" size={24} />
              <span className="text-2xl font-bold text-white">{totalRevenue.toLocaleString()} F</span>
            </div>
            <p className="text-purple-100 text-sm">CA Total</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="text-green-300" size={24} />
              <span className="text-2xl font-bold text-white">{totalCommission.toLocaleString()} F</span>
            </div>
            <p className="text-purple-100 text-sm">Commission DEM-DEM</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <FileText className="mr-3" size={28} />
                Validation des Événements
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filter === 'all'
                      ? 'bg-white text-purple-600'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filter === 'pending'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  En attente
                </button>
                <button
                  onClick={() => setFilter('approved')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filter === 'approved'
                      ? 'bg-green-500 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Approuvés
                </button>
                <button
                  onClick={() => setFilter('rejected')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filter === 'rejected'
                      ? 'bg-red-500 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Rejetés
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="p-12 text-center text-purple-200">
                Aucun événement à afficher
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-100">Événement</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-100">Organisateur</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-100">CA Total</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-100">Commission</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-100">Reversement</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-100">Statut</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-100">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{event.title}</div>
                        <div className="text-purple-200 text-sm">{new Date(event.created_at).toLocaleDateString('fr-FR')}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white">{event.organizer_name}</div>
                        <div className="text-purple-200 text-sm">{event.organizer_email}</div>
                      </td>
                      <td className="px-6 py-4 text-white font-semibold">{(event.total_revenue || 0).toLocaleString()} F</td>
                      <td className="px-6 py-4 text-green-300 font-semibold">{(event.commission_demdem || 0).toLocaleString()} F</td>
                      <td className="px-6 py-4 text-blue-300 font-semibold">{(event.organizer_share || 0).toLocaleString()} F</td>
                      <td className="px-6 py-4">
                        {event.status === 'pending' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                            <AlertCircle size={14} className="mr-1" />
                            En attente
                          </span>
                        )}
                        {event.status === 'approved' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                            <CheckCircle size={14} className="mr-1" />
                            Approuvé
                          </span>
                        )}
                        {event.status === 'rejected' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                            <XCircle size={14} className="mr-1" />
                            Rejeté
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {event.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApprove(event.id, event.title)}
                              className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                              title="Approuver"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleReject(event.id, event.title)}
                              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                              title="Rejeter"
                            >
                              <XCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleRequestModification(event.id, event.title)}
                              className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                              title="Demander modification"
                            >
                              <AlertCircle size={18} />
                            </button>
                          </div>
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

export default AdminFinanceEventPage;
