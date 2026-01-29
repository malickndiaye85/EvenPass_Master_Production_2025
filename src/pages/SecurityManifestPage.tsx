import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Printer, Download, Users, Calendar } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import DynamicLogo from '../components/DynamicLogo';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../firebase';
import { exportToCSV } from '../lib/financialReports';

interface Passenger {
  booking_number: string;
  passenger_name: string;
  passenger_phone: string;
  passenger_category: 'adult' | 'child' | 'baby';
  seat_number?: string;
  departure_date: string;
  departure_time: string;
  origin: string;
  destination: string;
  service_type: string;
}

interface ManifestStats {
  total: number;
  adults: number;
  children: number;
  babies: number;
}

const SecurityManifestPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [stats, setStats] = useState<ManifestStats>({ total: 0, adults: 0, children: 0, babies: 0 });
  const [loading, setLoading] = useState(false);

  const [selectedService, setSelectedService] = useState('lmdg');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('');

  const services = {
    lmdg: 'LMDG',
    cosama: 'COSAMA',
    interregional: 'Interrégional'
  };

  const origins = ['Dakar', 'Thiès', 'Mbour', 'Kaolack', 'Saint-Louis'];

  const loadManifest = async () => {
    if (!selectedDate || !selectedTime || !selectedOrigin || !selectedDestination) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      const bookingsRef = ref(db, 'transport/pass/bookings');
      const bookingsSnapshot = await get(bookingsRef);

      if (bookingsSnapshot.exists()) {
        const bookings = bookingsSnapshot.val();
        const filteredPassengers: Passenger[] = [];

        Object.values(bookings).forEach((booking: any) => {
          if (
            booking.payment_status === 'paid' &&
            booking.service_type === selectedService &&
            booking.departure_date === selectedDate &&
            booking.departure_time === selectedTime &&
            booking.origin === selectedOrigin &&
            booking.destination === selectedDestination
          ) {
            if (booking.passengers && Array.isArray(booking.passengers)) {
              booking.passengers.forEach((passenger: any) => {
                filteredPassengers.push({
                  booking_number: booking.booking_number,
                  passenger_name: passenger.name,
                  passenger_phone: passenger.phone || booking.phone,
                  passenger_category: passenger.category || 'adult',
                  seat_number: passenger.seat_number,
                  departure_date: booking.departure_date,
                  departure_time: booking.departure_time,
                  origin: booking.origin,
                  destination: booking.destination,
                  service_type: booking.service_type
                });
              });
            }
          }
        });

        const newStats: ManifestStats = {
          total: filteredPassengers.length,
          adults: filteredPassengers.filter(p => p.passenger_category === 'adult').length,
          children: filteredPassengers.filter(p => p.passenger_category === 'child').length,
          babies: filteredPassengers.filter(p => p.passenger_category === 'baby').length
        };

        setPassengers(filteredPassengers);
        setStats(newStats);
      }
    } catch (error) {
      console.error('Error loading manifest:', error);
      alert('Erreur lors du chargement du manifeste');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (passengers.length === 0) return;

    const data = passengers.map(p => ({
      numero_reservation: p.booking_number,
      nom: p.passenger_name,
      telephone: p.passenger_phone,
      categorie: p.passenger_category === 'adult' ? 'Adulte' : p.passenger_category === 'child' ? 'Enfant' : 'Bébé',
      siege: p.seat_number || 'N/A',
      depart: `${p.departure_date} ${p.departure_time}`,
      trajet: `${p.origin} → ${p.destination}`
    }));

    exportToCSV(data, `manifeste_${selectedService}_${selectedDate}_${selectedTime.replace(':', 'h')}`);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[#F8FAFC]'}`}>
      <nav className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-xl border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} print:hidden`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
              <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'} group-hover:translate-x-[-4px] transition-transform`} />
              <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Accueil
              </span>
            </button>

            <div className="flex items-center gap-3">
              <DynamicLogo size="sm" mode="transport" />
              <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Manifeste de Sécurité</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 print:hidden">
            <h1 className={`text-4xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Manifeste de Sécurité
            </h1>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Liste des passagers pour remise au Commandant
            </p>
          </div>

          <div className={`rounded-2xl p-6 mb-8 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg print:hidden`}>
            <div className="flex items-center gap-2 mb-6">
              <FileText className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
              <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Sélection de la rotation
              </span>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Service
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className={`w-full p-3 rounded-xl border-2 ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:border-cyan-500`}
                >
                  {Object.entries(services).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date de départ
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={`w-full p-3 rounded-xl border-2 ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:border-cyan-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Heure de départ
                </label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className={`w-full p-3 rounded-xl border-2 ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:border-cyan-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Origine
                </label>
                <select
                  value={selectedOrigin}
                  onChange={(e) => setSelectedOrigin(e.target.value)}
                  className={`w-full p-3 rounded-xl border-2 ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:border-cyan-500`}
                >
                  <option value="">Sélectionnez...</option>
                  {origins.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Destination
                </label>
                <select
                  value={selectedDestination}
                  onChange={(e) => setSelectedDestination(e.target.value)}
                  className={`w-full p-3 rounded-xl border-2 ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:border-cyan-500`}
                >
                  <option value="">Sélectionnez...</option>
                  {origins.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={loadManifest}
                  disabled={loading}
                  className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : isDark
                        ? 'bg-gradient-to-r from-cyan-500 to-[#0A7EA3] hover:from-cyan-600 hover:to-[#006B8C]'
                        : 'bg-gradient-to-r from-[#0A7EA3] to-[#005975] hover:from-[#006B8C] hover:to-[#00475E]'
                  }`}
                >
                  {loading ? 'Chargement...' : 'Charger'}
                </button>
              </div>
            </div>

            {passengers.length > 0 && (
              <div className="flex gap-3">
                <button
                  onClick={handlePrint}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                    isDark
                      ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                >
                  <Printer className="w-5 h-5" />
                  Imprimer
                </button>

                <button
                  onClick={handleExportCSV}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                    isDark
                      ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                      : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
                  }`}
                >
                  <Download className="w-5 h-5" />
                  Export CSV
                </button>
              </div>
            )}
          </div>

          {passengers.length > 0 && (
            <>
              <div className={`rounded-2xl p-6 mb-8 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-cyan-500/20' : 'bg-cyan-50'}`}>
                    <div className={`text-3xl font-black mb-1 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                      {stats.total}
                    </div>
                    <div className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
                    <div className={`text-3xl font-black mb-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      {stats.adults}
                    </div>
                    <div className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Adultes (H)
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-green-500/20' : 'bg-green-50'}`}>
                    <div className={`text-3xl font-black mb-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                      {stats.children}
                    </div>
                    <div className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Enfants (E)
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-purple-500/20' : 'bg-purple-50'}`}>
                    <div className={`text-3xl font-black mb-1 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                      {stats.babies}
                    </div>
                    <div className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Bébés (B)
                    </div>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg print:shadow-none`}>
                <div className="mb-6 print:mb-4">
                  <div className="text-center mb-4 hidden print:block">
                    <div className="text-2xl font-black mb-2">MANIFESTE DE SÉCURITÉ</div>
                    <div className="text-lg font-bold mb-1">
                      {services[selectedService as keyof typeof services]} - {selectedOrigin} → {selectedDestination}
                    </div>
                    <div className="text-md">
                      Date : {new Date(selectedDate).toLocaleDateString('fr-FR')} - Heure : {selectedTime}
                    </div>
                    <div className="text-sm mt-2">
                      Total : {stats.total} passagers (H: {stats.adults}, E: {stats.children}, B: {stats.babies})
                    </div>
                  </div>

                  <h2 className={`text-2xl font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'} print:hidden`}>
                    Liste des passagers
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`border-b-2 ${isDark ? 'border-gray-700' : 'border-gray-200'} print:border-black`}>
                        <th className={`text-left py-3 px-2 font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'} print:text-black`}>
                          N°
                        </th>
                        <th className={`text-left py-3 px-2 font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'} print:text-black`}>
                          Nom complet
                        </th>
                        <th className={`text-left py-3 px-2 font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'} print:text-black`}>
                          Téléphone
                        </th>
                        <th className={`text-center py-3 px-2 font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'} print:text-black`}>
                          Cat.
                        </th>
                        <th className={`text-center py-3 px-2 font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'} print:text-black`}>
                          Siège
                        </th>
                        <th className={`text-left py-3 px-2 font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'} print:text-black`}>
                          Réservation
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {passengers.map((passenger, index) => (
                        <tr
                          key={index}
                          className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-100'} print:border-gray-300`}
                        >
                          <td className={`py-3 px-2 font-bold ${isDark ? 'text-white' : 'text-gray-900'} print:text-black`}>
                            {index + 1}
                          </td>
                          <td className={`py-3 px-2 ${isDark ? 'text-white' : 'text-gray-900'} print:text-black`}>
                            {passenger.passenger_name}
                          </td>
                          <td className={`py-3 px-2 font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'} print:text-black`}>
                            {passenger.passenger_phone}
                          </td>
                          <td className={`py-3 px-2 text-center font-bold ${
                            passenger.passenger_category === 'adult'
                              ? isDark ? 'text-blue-400' : 'text-blue-600'
                              : passenger.passenger_category === 'child'
                                ? isDark ? 'text-green-400' : 'text-green-600'
                                : isDark ? 'text-purple-400' : 'text-purple-600'
                          } print:text-black`}>
                            {passenger.passenger_category === 'adult' ? 'H' : passenger.passenger_category === 'child' ? 'E' : 'B'}
                          </td>
                          <td className={`py-3 px-2 text-center ${isDark ? 'text-gray-300' : 'text-gray-700'} print:text-black`}>
                            {passenger.seat_number || '-'}
                          </td>
                          <td className={`py-3 px-2 font-mono text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} print:text-black`}>
                            {passenger.booking_number}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 pt-6 border-t-2 hidden print:block border-gray-300">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <div className="font-bold mb-2">Agent de quai</div>
                      <div className="border-b-2 border-gray-400 pb-1 mb-1">Signature :</div>
                      <div className="text-sm text-gray-600">Date : ___/___/______</div>
                    </div>
                    <div>
                      <div className="font-bold mb-2">Commandant de bord</div>
                      <div className="border-b-2 border-gray-400 pb-1 mb-1">Signature :</div>
                      <div className="text-sm text-gray-600">Date : ___/___/______</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {!loading && passengers.length === 0 && (
            <div className={`rounded-2xl p-12 text-center ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <Users className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Aucun passager trouvé
              </div>
              <div className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Sélectionnez une rotation et cliquez sur "Charger"
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityManifestPage;
