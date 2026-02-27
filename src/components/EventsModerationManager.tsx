import React, { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, Eye, Edit2, Trash2, PauseCircle,
  Calendar, MapPin, Users, DollarSign, Image as ImageIcon,
  Clock, AlertCircle, X, Search, Filter
} from 'lucide-react';
import { firestore } from '../firebase';
import {
  collection, query, where, getDocs, updateDoc, deleteDoc,
  doc, Timestamp, orderBy, onSnapshot
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

interface Event {
  id: string;
  title: string;
  description: string;
  start_date: any;
  end_date: any;
  venue_name: string;
  venue_address: string;
  venue_city: string;
  status: 'pending' | 'active' | 'rejected' | 'suspended' | 'draft';
  event_image_url?: string;
  organizer_id: string;
  organizer_name?: string;
  organizer_email?: string;
  total_capacity?: number;
  ticket_types?: TicketType[];
  created_at?: any;
  updated_at?: any;
  rejection_reason?: string;
  has_sales?: boolean;
  modification_request?: {
    requested_at: number;
    changes: any;
    reason: string;
  };
}

interface TicketType {
  id: string;
  name: string;
  price: number;
  capacity: number;
}

interface Props {
  onPendingCountChange?: (count: number) => void;
}

const EventsModerationManager: React.FC<Props> = ({ onPendingCountChange }) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'rejected' | 'suspended' | 'modification_request'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const eventsRef = collection(firestore, 'events');
    const q = query(eventsRef, orderBy('created_at', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const loadedEvents: Event[] = [];

      for (const docSnap of snapshot.docs) {
        const eventData = docSnap.data() as Event;

        const organizerDoc = await getDocs(
          query(collection(firestore, 'organizers'), where('user_id', '==', eventData.organizer_id))
        );

        let organizerInfo = {};
        if (!organizerDoc.empty) {
          const orgData = organizerDoc.docs[0].data();
          organizerInfo = {
            organizer_name: orgData.company_name || orgData.full_name,
            organizer_email: orgData.email
          };
        }

        const ticketsSnapshot = await getDocs(
          query(collection(firestore, 'ticket_types'), where('event_id', '==', docSnap.id))
        );

        const ticketTypes = ticketsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TicketType[];

        const bookingsSnapshot = await getDocs(
          query(collection(firestore, 'bookings'), where('event_id', '==', docSnap.id))
        );

        loadedEvents.push({
          id: docSnap.id,
          ...eventData,
          ...organizerInfo,
          ticket_types: ticketTypes,
          has_sales: !bookingsSnapshot.empty
        });
      }

      setEvents(loadedEvents);

      const pendingCount = loadedEvents.filter(e =>
        e.status === 'pending' || e.modification_request
      ).length;

      if (onPendingCountChange) {
        onPendingCountChange(pendingCount);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [onPendingCountChange]);

  useEffect(() => {
    filterEvents();
  }, [events, filter, searchQuery]);

  const filterEvents = () => {
    let filtered = [...events];

    if (filter === 'modification_request') {
      filtered = filtered.filter(e => e.modification_request);
    } else if (filter !== 'all') {
      filtered = filtered.filter(e => e.status === filter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(query) ||
        e.organizer_name?.toLowerCase().includes(query) ||
        e.venue_city.toLowerCase().includes(query)
      );
    }

    setFilteredEvents(filtered);
  };

  const handleApprove = async (eventId: string) => {
    if (!confirm('Approuver cet événement ? Il sera visible publiquement.')) {
      return;
    }

    setProcessing(true);
    try {
      const eventRef = doc(firestore, 'events', eventId);
      await updateDoc(eventRef, {
        status: 'active',
        approved_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });
      alert('Événement approuvé avec succès!');
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      alert('Erreur lors de l\'approbation de l\'événement');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedEvent || !rejectReason.trim()) {
      alert('Veuillez saisir un motif de rejet');
      return;
    }

    setProcessing(true);
    try {
      const eventRef = doc(firestore, 'events', selectedEvent.id);
      await updateDoc(eventRef, {
        status: 'rejected',
        rejection_reason: rejectReason,
        rejected_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });
      alert('Événement rejeté');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedEvent(null);
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      alert('Erreur lors du rejet de l\'événement');
    } finally {
      setProcessing(false);
    }
  };

  const handleSuspend = async (eventId: string) => {
    if (!confirm('Suspendre cet événement ? Les ventes seront bloquées.')) {
      return;
    }

    setProcessing(true);
    try {
      const eventRef = doc(firestore, 'events', eventId);
      await updateDoc(eventRef, {
        status: 'suspended',
        suspended_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });
      alert('Événement suspendu');
    } catch (error) {
      console.error('Erreur lors de la suspension:', error);
      alert('Erreur lors de la suspension de l\'événement');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (eventId: string, hasTicketSales: boolean) => {
    if (hasTicketSales) {
      alert('Impossible de supprimer cet événement car des billets ont été vendus.');
      return;
    }

    if (!confirm('ATTENTION: Supprimer définitivement cet événement ? Cette action est irréversible.')) {
      return;
    }

    setProcessing(true);
    try {
      const eventRef = doc(firestore, 'events', eventId);
      await deleteDoc(eventRef);
      alert('Événement supprimé');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de l\'événement');
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveModification = async (eventId: string) => {
    if (!confirm('Approuver les modifications demandées ?')) {
      return;
    }

    setProcessing(true);
    try {
      const event = events.find(e => e.id === eventId);
      if (!event?.modification_request) return;

      const eventRef = doc(firestore, 'events', eventId);
      await updateDoc(eventRef, {
        ...event.modification_request.changes,
        modification_request: null,
        updated_at: Timestamp.now()
      });
      alert('Modifications approuvées');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'approbation des modifications');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectModification = async (eventId: string) => {
    if (!confirm('Rejeter les modifications demandées ?')) {
      return;
    }

    setProcessing(true);
    try {
      const eventRef = doc(firestore, 'events', eventId);
      await updateDoc(eventRef, {
        modification_request: null,
        updated_at: Timestamp.now()
      });
      alert('Modifications rejetées');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du rejet des modifications');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-bold border border-orange-500/30">En attente</span>,
      active: <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold border border-green-500/30">Actif</span>,
      rejected: <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold border border-red-500/30">Rejeté</span>,
      suspended: <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-bold border border-gray-500/30">Suspendu</span>,
      draft: <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold border border-blue-500/30">Brouillon</span>
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingCount = events.filter(e => e.status === 'pending' || e.modification_request).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-3">
            <Calendar className="w-7 h-7 text-blue-400" />
            Modération des Événements
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Gérez l'approbation et la modération des événements EVEN
          </p>
        </div>
        <div className="flex gap-4">
          {pendingCount > 0 && (
            <div className="px-4 py-2 bg-orange-500/20 rounded-xl border border-orange-500/30">
              <div className="text-2xl font-bold text-orange-400">{pendingCount}</div>
              <div className="text-xs text-gray-400">En attente</div>
            </div>
          )}
          <div className="px-4 py-2 bg-blue-500/20 rounded-xl border border-blue-500/30">
            <div className="text-2xl font-bold text-blue-400">{filteredEvents.length}</div>
            <div className="text-xs text-gray-400">Événements</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, organisateur ou ville..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#0f172a] border-2 border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-4 py-3 bg-[#0f172a] border-2 border-gray-700/50 rounded-xl text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all"
        >
          <option value="all">Tous les événements</option>
          <option value="pending">En attente de validation</option>
          <option value="modification_request">Demandes de modification</option>
          <option value="active">Événements actifs</option>
          <option value="rejected">Événements rejetés</option>
          <option value="suspended">Événements suspendus</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-gray-400 mt-4">Chargement des événements...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12 bg-[#0f172a] rounded-xl border border-gray-700/50">
          <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Aucun événement trouvé</p>
          <p className="text-sm text-gray-500 mt-2">
            {filter === 'pending' ? 'Aucun événement en attente de validation' : 'Essayez de modifier vos filtres'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div key={event.id} className="bg-[#0f172a] rounded-xl border border-gray-700/50 overflow-hidden hover:border-blue-500/50 transition-all">
              <div className="relative">
                {event.event_image_url ? (
                  <img
                    src={event.event_image_url}
                    alt={event.title}
                    className="w-full h-48 object-cover cursor-pointer"
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowImageModal(true);
                    }}
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-blue-900/30 to-purple-900/30 flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-gray-600" />
                  </div>
                )}

                <div className="absolute top-3 right-3 flex gap-2">
                  {getStatusBadge(event.status)}
                  {event.modification_request && (
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-bold border border-yellow-500/30">
                      Modification
                    </span>
                  )}
                  {event.has_sales && (
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-bold border border-purple-500/30">
                      Ventes actives
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <h4 className="text-lg font-bold text-white mb-2">{event.title}</h4>
                  <div className="space-y-1 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{event.organizer_name || 'Organisateur inconnu'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(event.start_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{event.venue_name}, {event.venue_city}</span>
                    </div>
                  </div>
                </div>

                {event.ticket_types && event.ticket_types.length > 0 && (
                  <div className="pt-3 border-t border-gray-700/50">
                    <div className="text-xs text-gray-500 mb-2">Tarifs proposés</div>
                    <div className="space-y-1">
                      {event.ticket_types.slice(0, 3).map((ticket) => (
                        <div key={ticket.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">{ticket.name}</span>
                          <span className="text-white font-semibold">{ticket.price.toLocaleString()} FCFA</span>
                        </div>
                      ))}
                      {event.ticket_types.length > 3 && (
                        <div className="text-xs text-gray-500 mt-1">
                          +{event.ticket_types.length - 3} autre(s) type(s)
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {event.rejection_reason && (
                  <div className="pt-3 border-t border-gray-700/50">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-red-400 font-semibold mb-1">Motif de rejet</div>
                          <div className="text-xs text-gray-400">{event.rejection_reason}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {event.modification_request && (
                  <div className="pt-3 border-t border-gray-700/50">
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-yellow-400 font-semibold mb-1">Demande de modification</div>
                          <div className="text-xs text-gray-400">{event.modification_request.reason}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-700/50 flex flex-wrap gap-2">
                  {event.modification_request && (
                    <>
                      <button
                        onClick={() => handleApproveModification(event.id)}
                        disabled={processing}
                        className="flex-1 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all border border-green-500/30 text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Approuver modifs
                      </button>
                      <button
                        onClick={() => handleRejectModification(event.id)}
                        disabled={processing}
                        className="flex-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all border border-red-500/30 text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        <XCircle className="w-3 h-3" />
                        Rejeter modifs
                      </button>
                    </>
                  )}

                  {event.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(event.id)}
                        disabled={processing}
                        className="flex-1 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all border border-green-500/30 text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Approuver
                      </button>
                      <button
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowRejectModal(true);
                        }}
                        disabled={processing}
                        className="flex-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all border border-red-500/30 text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        <XCircle className="w-3 h-3" />
                        Rejeter
                      </button>
                    </>
                  )}

                  {event.status === 'active' && (
                    <button
                      onClick={() => handleSuspend(event.id)}
                      disabled={processing}
                      className="flex-1 px-3 py-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-all border border-gray-500/30 text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <PauseCircle className="w-3 h-3" />
                      Suspendre
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`/event/${event.id}`)}
                    className="px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all border border-blue-500/30 text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Voir
                  </button>

                  {!event.has_sales && (
                    <button
                      onClick={() => handleDelete(event.id, event.has_sales || false)}
                      disabled={processing}
                      className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all border border-red-500/30 text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showImageModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowImageModal(false)}>
          <div className="relative max-w-5xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedEvent.event_image_url}
              alt={selectedEvent.title}
              className="max-w-full max-h-[90vh] rounded-xl"
            />
          </div>
        </div>
      )}

      {showRejectModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-xl border-2 border-gray-700/50 p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <XCircle className="w-6 h-6 text-red-400" />
              Rejeter l'événement
            </h3>
            <p className="text-gray-400 mb-4">
              Événement: <span className="text-white font-semibold">{selectedEvent.title}</span>
            </p>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Motif du rejet *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex: Affiche non conforme, informations incomplètes..."
                rows={4}
                className="w-full px-4 py-3 bg-[#1e293b] border-2 border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/30 transition-all resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={processing || !rejectReason.trim()}
                className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Traitement...' : 'Confirmer le rejet'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedEvent(null);
                }}
                disabled={processing}
                className="flex-1 py-3 px-4 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-xl font-bold transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsModerationManager;
