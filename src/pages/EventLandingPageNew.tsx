/**
 * EVENT LANDING PAGE (NOUVEAU DESIGN PROPRE)
 * Univers DEM ÉVÉNEMENT - Design clair, SANS badges [EVEN]
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, MapPin } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  price: number;
  image: string;
  category: string;
}

const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Festival Jazz à Saint-Louis',
    date: '15 Mars 2026',
    location: 'Place Faidherbe',
    price: 15000,
    image: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=600',
    category: 'Concert'
  },
  {
    id: '2',
    title: 'Théâtre National: Kocc Barma',
    date: '20 Mars 2026',
    location: 'Théâtre Daniel Sorano',
    price: 8000,
    image: 'https://images.pexels.com/photos/3662770/pexels-photo-3662770.jpeg?auto=compress&cs=tinysrgb&w=600',
    category: 'Théâtre'
  },
  {
    id: '3',
    title: 'Tournoi de Lutte: Bombardier vs Eumeu',
    date: '25 Mars 2026',
    location: 'Arène Nationale',
    price: 25000,
    image: 'https://images.pexels.com/photos/163403/box-sport-men-training-163403.jpeg?auto=compress&cs=tinysrgb&w=600',
    category: 'Sport'
  },
  {
    id: '4',
    title: 'Concert Youssou N\'Dour',
    date: '30 Mars 2026',
    location: 'Grand Théâtre',
    price: 20000,
    image: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=600',
    category: 'Concert'
  }
];

export const EventLandingPageNew: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div
            className="text-2xl font-display font-bold text-gray-900 cursor-pointer"
            onClick={() => navigate('/')}
          >
            DEM⇄DEM
          </div>

          <div className="flex items-center gap-4">
            <div className="px-3 py-1.5 border border-gray-300 rounded-full text-sm text-gray-600">
              Nouvelle expérience
            </div>
            <button
              className="text-gray-600 hover:text-orange-600 font-medium text-sm transition-colors"
              onClick={() => navigate('/organizer/login')}
            >
              Organisateur ?
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un événement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-4 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-orange-500 transition-colors shadow-sm"
            />
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            Événements à Découvrir
          </h1>
          <p className="text-gray-600">
            Trouvez et réservez vos billets pour les meilleurs événements au Sénégal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_EVENTS.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-xl overflow-hidden border border-gray-200 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg group"
              onClick={() => navigate(`/even/event/${event.id}`)}
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                  {event.title}
                </h3>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar size={16} />
                    <span>{event.date}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin size={16} />
                    <span>{event.location}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xl font-bold text-orange-600">
                    {event.price.toLocaleString()} FCFA
                  </span>
                  <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {event.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-gray-50 rounded-2xl p-8 text-center border border-gray-200">
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
            Vous organisez un événement ?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Créez, vendez et gérez vos billets en quelques clics. Tableau de bord en temps réel, paiements sécurisés.
          </p>
          <button
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
            onClick={() => navigate('/organisateur')}
          >
            Devenir Organisateur →
          </button>
        </div>
      </div>
    </div>
  );
};
