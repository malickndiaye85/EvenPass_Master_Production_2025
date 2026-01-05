import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Trash2, Pause, Play, Edit2, Search, Filter, Eye, Users } from 'lucide-react';
import { firestore } from '../firebase';
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc, Timestamp, orderBy } from 'firebase/firestore';

interface Event {
  id: string;
  title: string;
  start_date: any;
  venue_name: string;
  venue_city: string;
  status: string;
  event_image_url?: string;
  organizer_id: string;
  total_capacity?: number;
  created_at?: any;
}

export default function AdminEventsManager() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'suspended' | 'draft'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventsRef = collection(firestore, 'events');
      const q = query(eventsRef, orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);

      const loadedEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];

      setEvents(loadedEvents);
      console.log('[ADMIN EVENTS] Loaded events:', loadedEvents.length);
    } catch (error) {
      console.error('[ADMIN EVENTS] Error loading events:', error);
      alert('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (eventId: string) => {
    if (!confirm('⚠️ Suspendre cet événement ? Les ventes seront bloquées.')) {
      return;
    }

    setProcessing(true);
    try {
      const eventRef = doc(firestore, 'events', eventId);
      await updateDoc(eventRef, {
        status: 'suspended',
        updated_at: Timestamp.now()
      });
      alert('⏸️ Événement suspendu avec succès!');
      await loadEvents();
    } catch (error) {
      console.error('[ADMIN EVENTS] Error suspending event:', error);
      alert('❌ Erreur lors de la suspension');
    } finally {
      setProcessing(false);
    }
  };

  const handleActivate = async (eventId: string) => {
    if (!confirm('✅ Activer cet événement ? Les ventes seront réactivées.')) {
      return;
    }

    setProcessing(true);
    try {
      const eventRef = doc(firestore, 'events', eventId);
      await updateDoc(eventRef, {
        status: 'published',
        updated_at: Timestamp.now()
      });
      alert('✅ Événement activé avec succès!');
      await loadEvents();
    } catch (error) {
      console.error('[ADMIN EVENTS] Error activating event:', error);
      alert('❌ Erreur lors de l\'activation');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('❌ ATTENTION : Supprimer définitivement cet événement et tous ses billets ?\n\nCette action est IRRÉVERSIBLE!')) {
      return;
    }

    const confirmation = prompt('Tapez "SUPPRIMER" pour confirmer:');
    if (confirmation !== 'SUPPRIMER') {
      alert('Suppression annulée');
      return;
    }

    setProcessing(true);
    try {
      const ticketTypesRef = collection(firestore, 'ticket_types');
      const ticketTypesQuery = query(ticketTypesRef, where('event_id', '==', eventId));
      const ticketTypesSnapshot = await getDocs(ticketTypesQuery);

      for (const ticketDoc of ticketTypesSnapshot.docs) {
        await deleteDoc(doc(firestore, 'ticket_types', ticketDoc.id));
      }

      const eventRef = doc(firestore, 'events', eventId);
      await deleteDoc(eventRef);

      alert('🗑️ Événement et billets supprimés avec succès!');
      await loadEvents();
    } catch (error) {
      console.error('[ADMIN EVENTS] Error deleting event:', error);
      alert('❌ Erreur lors de la suppression');
    } finally {
      setProcessing(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedEvent || !newDate) {
      alert('Veuillez sélectionner une nouvelle date');
      return;
    }

    setProcessing(true);
    try {
      const eventRef = doc(firestore, 'events', selectedEvent.id);
      await updateDoc(eventRef, {
        start_date: newDate,
        updated_at: Timestamp.now()
      });
      alert('📅 Événement reprogrammé avec succès!');
      setShowRescheduleModal(false);
      setSelectedEvent(null);
      setNewDate('');
      await loadEvents();
    } catch (error) {
      console.error('[ADMIN EVENTS] Error rescheduling event:', error);
      alert('❌ Erreur lors de la reprogrammation');
    } finally {
      setProcessing(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesFilter = filter === 'all' || event.status === filter;
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.venue_city.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full">✅ ACTIF</span>;
      case 'suspended':
        return <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full">⏸️ SUSPENDU</span>;
      case 'draft':
        return <span className="px-3 py-1 bg-yellow-600 text-white text-xs font-bold rounded-full">📝 BROUILLON</span>;
      default:
        return <span className="px-3 py-1 bg-gray-600 text-white text-xs font-bold rounded-full">{status}</span>;
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'Date non définie';
    try {
      if (date.toDate) {
        return date.toDate().toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FF5F05] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#B5B5B5]">Chargement des événements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#B5B5B5]" />
          <input
            type="text"
            placeholder="Rechercher un événement..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#0F0F0F] border-2 border-[#2A2A2A] text-white rounded-xl focus:border-[#FF5F05] focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              filter === 'all'
                ? 'bg-[#FF5F05] text-white'
                : 'bg-[#0F0F0F] text-[#B5B5B5] hover:text-white'
            }`}
          >
            Tous ({events.length})
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              filter === 'published'
                ? 'bg-green-600 text-white'
                : 'bg-[#0F0F0F] text-[#B5B5B5] hover:text-white'
            }`}
          >
            Actifs ({events.filter(e => e.status === 'published').length})
          </button>
          <button
            onClick={() => setFilter('suspended')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              filter === 'suspended'
                ? 'bg-red-600 text-white'
                : 'bg-[#0F0F0F] text-[#B5B5B5] hover:text-white'
            }`}
          >
            Suspendus ({events.filter(e => e.status === 'suspended').length})
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              filter === 'draft'
                ? 'bg-yellow-600 text-white'
                : 'bg-[#0F0F0F] text-[#B5B5B5] hover:text-white'
            }`}
          >
            Brouillons ({events.filter(e => e.status === 'draft').length})
          </button>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-[#B5B5B5] mx-auto mb-4" />
          <p className="text-[#B5B5B5] text-lg">Aucun événement trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-2xl overflow-hidden hover:border-[#FF5F05] transition-all"
            >
              <div className="flex flex-col md:flex-row">
                <div className="relative w-full md:w-48 h-48 md:h-auto bg-[#2A2A2A]">
                  {event.event_image_url ? (
                    <img
                      src={event.event_image_url}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar className="w-16 h-16 text-[#B5B5B5]" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(event.status)}
                  </div>
                </div>

                <div className="flex-1 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-white mb-2">{event.title}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-[#B5B5B5]">
                          <Calendar className="w-4 h-4 mr-2 text-[#FF5F05]" />
                          {formatDate(event.start_date)}
                        </div>
                        <div className="flex items-center text-[#B5B5B5]">
                          <MapPin className="w-4 h-4 mr-2 text-[#FF5F05]" />
                          {event.venue_name} - {event.venue_city}
                        </div>
                        {event.total_capacity && (
                          <div className="flex items-center text-[#B5B5B5]">
                            <Users className="w-4 h-4 mr-2 text-[#FF5F05]" />
                            Capacité: {event.total_capacity} places
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {event.status === 'published' && (
                      <button
                        onClick={() => handleSuspend(event.id)}
                        disabled={processing}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        <Pause className="w-4 h-4" />
                        Suspendre
                      </button>
                    )}

                    {event.status === 'suspended' && (
                      <button
                        onClick={() => handleActivate(event.id)}
                        disabled={processing}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Activer
                      </button>
                    )}

                    {event.status === 'draft' && (
                      <button
                        onClick={() => handleActivate(event.id)}
                        disabled={processing}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Publier
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedEvent(event);
                        setNewDate(event.start_date);
                        setShowRescheduleModal(true);
                      }}
                      disabled={processing}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Reprogrammer
                    </button>

                    <button
                      onClick={() => handleDelete(event.id)}
                      disabled={processing}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>

                    <a
                      href={`/event/${event.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white font-bold rounded-lg transition-all flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Voir
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showRescheduleModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#2A2A2A] max-w-md w-full rounded-2xl border border-[#2A2A2A]">
            <div className="p-6 border-b border-[#0F0F0F]">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Calendar className="w-6 h-6 text-[#FF5F05]" />
                Reprogrammer l'événement
              </h2>
              <p className="text-[#B5B5B5] text-sm mt-2">{selectedEvent.title}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  Date actuelle
                </label>
                <div className="px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-[#B5B5B5]">
                  {formatDate(selectedEvent.start_date)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  Nouvelle date <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  disabled={processing}
                  className="w-full px-4 py-3 bg-[#0F0F0F] border-2 border-[#2A2A2A] text-white rounded-lg focus:border-[#FF5F05] focus:outline-none disabled:opacity-50"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowRescheduleModal(false);
                    setSelectedEvent(null);
                    setNewDate('');
                  }}
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-[#0F0F0F] hover:bg-[#1F1F1F] text-white font-bold rounded-lg transition-all disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReschedule}
                  disabled={processing || !newDate}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-[#FF5F05] to-red-600 hover:from-[#FF5F05]/90 hover:to-red-600/90 text-white font-bold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Traitement...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      Confirmer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
