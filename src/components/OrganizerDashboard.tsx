import React, { useState, useEffect } from 'react';
import { ref, onValue, push, set } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Ticket, Plus, ArrowLeft, DollarSign, Users } from 'lucide-react';

interface OrganizerDashboardProps {
  onNavigate: (page: string) => void;
}

const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({ onNavigate }) => {
  const { currentUser, logout } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    venue: '',
    date: '',
    imageUrl: '',
    description: '',
    standard: '',
    vip: '',
    vvip: ''
  });

  useEffect(() => {
    if (!currentUser) {
      onNavigate('login');
      return;
    }

    const eventsRef = ref(db, 'evenpass/events');
    const ordersRef = ref(db, 'evenpass/orders');

    onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data)
          .map((id) => ({ id, ...data[id] }))
          .filter((event) => event.organizer_id === currentUser.uid);
        setEvents(list);
      }
      setLoading(false);
    });

    onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map((id) => ({ id, ...data[id] }));
        setOrders(list);
      }
    });
  }, [currentUser, onNavigate]);

  const calculateEventRevenue = (eventId: string) => {
    return orders
      .filter((order) => order.eventId === eventId && order.status === 'completed')
      .reduce((sum, order) => sum + (order.amount || 0), 0);
  };

  const calculateEventTickets = (eventId: string) => {
    return orders
      .filter((order) => order.eventId === eventId && order.status === 'completed')
      .reduce((sum, order) => sum + (order.quantity || 0), 0);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const eventsRef = ref(db, 'evenpass/events');
      const newEventRef = push(eventsRef);

      await set(newEventRef, {
        name: formData.name,
        venue: formData.venue,
        date: formData.date,
        imageUrl: formData.imageUrl || 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg',
        description: formData.description,
        standard: parseInt(formData.standard) || 0,
        vip: parseInt(formData.vip) || 0,
        vvip: parseInt(formData.vvip) || 0,
        organizer_id: currentUser.uid,
        status: 'pending',
        createdAt: Date.now()
      });

      setShowCreateForm(false);
      setFormData({
        name: '',
        venue: '',
        date: '',
        imageUrl: '',
        description: '',
        standard: '',
        vip: '',
        vvip: ''
      });

      alert('Événement créé avec succès ! En attente de validation par l\'administrateur.');
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Erreur lors de la création de l\'événement');
    }
  };

  const totalRevenue = events.reduce((sum, event) => sum + calculateEventRevenue(event.id) * 0.935, 0);
  const totalTickets = events.reduce((sum, event) => sum + calculateEventTickets(event.id), 0);

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
              Dashboard <span className="text-orange-500">Organisateur</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              {currentUser.email}
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600 px-6 py-3 rounded-full font-black transition-all"
          >
            <Plus size={20} />
            Créer un Événement
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <DollarSign className="text-green-500" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-bold">Revenus Nets (93.5%)</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {Math.round(totalRevenue).toLocaleString()} FCFA
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                <Ticket className="text-orange-500" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-bold">Billets Vendus</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{totalTickets}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Calendar className="text-blue-500" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-bold">Mes Événements</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{events.length}</p>
              </div>
            </div>
          </div>
        </div>

        {showCreateForm && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-gray-200 dark:border-gray-700 shadow-lg mb-12">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">
              Créer un Nouvel Événement
            </h2>
            <form onSubmit={handleCreateEvent} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Nom de l'événement *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Lieu *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    URL de l'image
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://images.pexels.com/..."
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Prix Standard (FCFA)
                  </label>
                  <input
                    type="number"
                    value={formData.standard}
                    onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Prix VIP (FCFA)
                  </label>
                  <input
                    type="number"
                    value={formData.vip}
                    onChange={(e) => setFormData({ ...formData, vip: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Prix VVIP (FCFA)
                  </label>
                  <input
                    type="number"
                    value={formData.vvip}
                    onChange={(e) => setFormData({ ...formData, vvip: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-orange-500 text-white hover:bg-orange-600 px-8 py-3 rounded-full font-black transition-all"
                >
                  Créer l'Événement
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 px-8 py-3 rounded-full font-black transition-all"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-gray-200 dark:border-gray-700 shadow-lg">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">
            Mes Événements
          </h2>

          {loading ? (
            <p className="text-center text-gray-600 dark:text-gray-400 py-12">Chargement...</p>
          ) : events.length === 0 ? (
            <p className="text-center text-gray-600 dark:text-gray-400 py-12">
              Aucun événement créé. Commencez par créer votre premier événement !
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
                const revenue = calculateEventRevenue(event.id);
                const netRevenue = revenue * 0.935;
                const tickets = calculateEventTickets(event.id);

                return (
                  <div
                    key={event.id}
                    className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-black text-gray-900 dark:text-white">
                        {event.name}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          event.status === 'active'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}
                      >
                        {event.status === 'active' ? 'ACTIF' : 'EN ATTENTE'}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <MapPin size={16} className="text-orange-500" />
                        {event.venue}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar size={16} className="text-orange-500" />
                        {new Date(event.date).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Ticket size={16} className="text-orange-500" />
                        {tickets} billets vendus
                      </div>
                      <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                        <DollarSign size={16} className="text-green-500" />
                        {Math.round(netRevenue).toLocaleString()} FCFA
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
