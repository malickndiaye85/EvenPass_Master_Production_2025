import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { Event } from '../types';
import { MapPin, Calendar } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string, eventId?: string) => void;
}

const mockEvents: Event[] = [
  {
    id: 'event1',
    name: 'Soirée Afrobeats Premium',
    venue: 'Dakar Arena',
    date: '2025-01-15',
    imageUrl: 'https://images.pexels.com/photos/3408356/pexels-photo-3408356.jpeg',
    description: 'Une soirée inoubliable avec les meilleurs artistes afrobeats',
    standard: 25000,
    vip: 50000,
    vvip: 100000,
  },
  {
    id: 'event2',
    name: 'Festival de Jazz',
    venue: 'Le Lagon',
    date: '2025-01-20',
    imageUrl: 'https://images.pexels.com/photos/3379934/pexels-photo-3379934.jpeg',
    description: 'Découvrez les meilleurs talents du jazz africain',
    standard: 35000,
    vip: 70000,
    vvip: 120000,
  },
  {
    id: 'event3',
    name: 'Conférence Tech 2025',
    venue: 'Centre de Conférences Diamniadio',
    date: '2025-02-01',
    imageUrl: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg',
    description: 'Le rendez-vous incontournable de la tech en Afrique de l\'Ouest',
    standard: 50000,
    vip: 100000,
    vvip: 200000,
  },
];

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const eventsRef = ref(db, 'evenpass/events');
      onValue(
        eventsRef,
        (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const list = Object.keys(data)
              .map((id) => ({ id, ...data[id] }))
              .filter((event) => event.status === 'active');
            setEvents(list);
          }
          setLoading(false);
        },
        (error) => {
          console.log('Using mock data (Firebase error):', error.message);
          setLoading(false);
        }
      );
    } catch (error) {
      console.log('Firebase initialization:', error);
      setLoading(false);
    }
  }, []);

  const filteredEvents = events.filter((e) =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEventPrice = (event: Event): string => {
    const price = event.standard || event.p1 || event.vip || event.p2 || 0;
    if (!price || isNaN(price)) {
      return '0 FCFA';
    }
    return `${price.toLocaleString()} FCFA`;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <main className="pt-40 px-6 max-w-7xl mx-auto pb-12">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tighter text-gray-900 dark:text-white">
            Gënaa Yomb, Gënaa Wóor, <br />
            <span className="text-orange-500 italic">Gënaa Gaaw</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-12 font-medium">
            Découvrez et réservez vos événements en quelques clics
          </p>

          <div className="mb-16 flex justify-center">
            <input
              type="text"
              placeholder="Rechercher un événement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-2xl px-8 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors text-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => onNavigate('event', event.id)}
                className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 text-left shadow-lg transition-all duration-300 ease-in-out hover:scale-[1.03] hover:border-orange-500 hover:shadow-2xl cursor-pointer group"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={event.imageUrl}
                    className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    alt={event.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-black mb-3 text-gray-900 dark:text-white">
                    {event.name}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2 font-medium text-sm">
                    <MapPin size={18} className="text-orange-500" />
                    {event.venue}
                  </div>
                  {event.date && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-6 font-medium text-sm">
                      <Calendar size={18} className="text-orange-500" />
                      {new Date(event.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-6 border-t-2 border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
                        À partir de
                      </p>
                      <p className="text-3xl font-black text-gray-900 dark:text-white">
                        {getEventPrice(event)}
                      </p>
                    </div>
                    <button className="bg-orange-500 text-white hover:bg-orange-600 px-8 py-3 rounded-full font-black transition-all duration-300 ease-in-out transform hover:scale-105">
                      RÉSERVER
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-20">
              <p className="text-2xl text-gray-600 dark:text-gray-400 font-medium">
                {loading ? 'Chargement des événements...' : 'Aucun événement trouvé'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HomePage;
