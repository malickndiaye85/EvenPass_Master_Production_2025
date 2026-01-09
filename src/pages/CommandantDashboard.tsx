import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ship, Download, Users, Package, FileText, LogOut, Calendar, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/FirebaseAuthContext';
import { useTheme } from '../context/ThemeContext';
import { getTicketsByVessel, getCargoByVessel, generateManifest, getMaritimeUser, VESSELS } from '../lib/maritimeData';
import type { Manifest, PassTicket, Cargo } from '../types/maritime';
import DynamicLogo from '../components/DynamicLogo';

export default function CommandantDashboard() {
  const navigate = useNavigate();
  const { user, logout, firebaseUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [vesselId, setVesselId] = useState('');
  const [vesselName, setVesselName] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [passengers, setPassengers] = useState<PassTicket[]>([]);
  const [cargo, setCargo] = useState<Cargo[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [firebaseUser]);

  const loadUserData = async () => {
    try {
      if (!firebaseUser) {
        navigate('/');
        return;
      }

      const maritimeUser = await getMaritimeUser(firebaseUser.uid);

      if (!maritimeUser || maritimeUser.role !== 'commandant') {
        alert('Accès refusé. Réservé aux commandants.');
        navigate('/');
        return;
      }

      if (!maritimeUser.vessel_id) {
        alert('Aucun navire assigné. Contactez l\'administrateur.');
        navigate('/');
        return;
      }

      setVesselId(maritimeUser.vessel_id);
      setVesselName(maritimeUser.vessel_name || '');
      loadVoyageData(maritimeUser.vessel_id, selectedDate);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVoyageData = async (vId: string, date: string) => {
    try {
      const [ticketsData, cargoData] = await Promise.all([
        getTicketsByVessel(vId, date),
        getCargoByVessel(vId, date)
      ]);

      setPassengers(ticketsData);
      setCargo(cargoData);
    } catch (error) {
      console.error('Error loading voyage data:', error);
    }
  };

  const handleGenerateManifest = async () => {
    setGenerating(true);
    try {
      const manifestData = await generateManifest(vesselId, selectedDate, selectedTime);
      if (manifestData) {
        setManifest(manifestData);
        alert('Manifeste généré avec succès!');
      } else {
        alert('Erreur lors de la génération du manifeste');
      }
    } catch (error) {
      console.error('Error generating manifest:', error);
      alert('Erreur lors de la génération du manifeste');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportPDF = () => {
    if (!manifest) return;

    const printContent = `
      <html>
        <head>
          <title>Manifeste - ${manifest.vessel_name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #0A7EA3; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #0A7EA3; color: white; }
            .header { margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MANIFESTE PASSAGERS</h1>
            <p><strong>Navire:</strong> ${manifest.vessel_name}</p>
            <p><strong>Route:</strong> ${manifest.route}</p>
            <p><strong>Date:</strong> ${manifest.departure_date}</p>
            <p><strong>Heure:</strong> ${manifest.departure_time}</p>
            <p><strong>Total Passagers:</strong> ${manifest.total_passengers}</p>
            <p><strong>Total Fret:</strong> ${manifest.total_cargo_weight} kg</p>
          </div>

          <h2>Liste des Passagers</h2>
          <table>
            <thead>
              <tr>
                <th>N° Billet</th>
                <th>Nom</th>
                <th>Téléphone</th>
                <th>CNI/Passeport</th>
                <th>Catégorie</th>
              </tr>
            </thead>
            <tbody>
              ${manifest.passengers.map(p => `
                <tr>
                  <td>${p.ticket_number}</td>
                  <td>${p.passenger_name}</td>
                  <td>${p.passenger_phone}</td>
                  <td>${p.passenger_cni || p.passenger_passport || 'N/A'}</td>
                  <td>${p.category}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2>Fret et Véhicules</h2>
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Description</th>
                <th>Poids (kg)</th>
                <th>Passager</th>
              </tr>
            </thead>
            <tbody>
              ${manifest.cargo.map(c => `
                <tr>
                  <td>${c.cargo_type === 'vehicle' ? 'Véhicule' : 'Marchandise'}</td>
                  <td>${c.vehicle_registration || c.merchandise_description || 'N/A'}</td>
                  <td>${c.weight_kg}</td>
                  <td>${c.passenger_name || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="margin-top: 40px;">
            <p>Signature du Commandant: ___________________</p>
            <p>Date: ${new Date().toLocaleDateString('fr-FR')}</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleLogout = () => {
    if (confirm('Déconnexion?')) {
      logout();
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-white'} flex items-center justify-center`}>
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const vessel = VESSELS.find(v => v.id === vesselId);
  const totalCargoWeight = cargo.reduce((sum, c) => sum + c.weight_kg, 0);
  const vehiclesCount = cargo.filter(c => c.cargo_type === 'vehicle').length;
  const fillRate = vessel ? (passengers.length / vessel.capacity_passengers) * 100 : 0;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[#F8FAFC]'}`}>
      <nav className={`${isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'} backdrop-blur-xl border-b`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <DynamicLogo />
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className={`p-3 rounded-xl transition-all ${
                  isDark
                    ? 'bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-400'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-[#0A7EA3] flex items-center justify-center">
              <Ship className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Smart Manifest System
              </h1>
              <p className={`text-lg ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                {vesselName}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <Users className={`w-8 h-8 mb-2 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Passagers</p>
            <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{passengers.length}</p>
          </div>

          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <Package className={`w-8 h-8 mb-2 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Fret Total</p>
            <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{(totalCargoWeight / 1000).toFixed(1)}t</p>
          </div>

          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <Ship className={`w-8 h-8 mb-2 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Véhicules</p>
            <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{vehiclesCount}</p>
          </div>

          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <Users className={`w-8 h-8 mb-2 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Taux de Remplissage</p>
            <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{fillRate.toFixed(0)}%</p>
          </div>
        </div>

        <div className={`p-6 rounded-2xl mb-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <h2 className={`text-xl font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Calendar className="w-5 h-5 inline mr-2" />
            Sélectionner la Traversée
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Date de Départ
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  loadVoyageData(vesselId, e.target.value);
                }}
                className={`w-full px-4 py-3 rounded-xl border ${
                  isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Heure de Départ
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${
                  isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleGenerateManifest}
                disabled={generating || passengers.length === 0}
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-[#0A7EA3] text-white font-bold rounded-xl hover:from-cyan-600 hover:to-[#006B8C] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    Générer Manifeste
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {manifest && (
          <div className={`p-6 rounded-2xl mb-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Manifeste Généré
              </h2>
              <button
                onClick={handleExportPDF}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Exporter PDF
              </button>
            </div>

            <div className={`p-4 rounded-xl ${isDark ? 'bg-cyan-900/20 border-cyan-800/30' : 'bg-cyan-50 border-cyan-200'} border mb-4`}>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Route</p>
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{manifest.route}</p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Départ</p>
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {manifest.departure_date} à {manifest.departure_time}
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <th className={`px-4 py-3 text-left text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Billet</th>
                    <th className={`px-4 py-3 text-left text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Nom</th>
                    <th className={`px-4 py-3 text-left text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Téléphone</th>
                    <th className={`px-4 py-3 text-left text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>CNI/Passeport</th>
                    <th className={`px-4 py-3 text-left text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Catégorie</th>
                  </tr>
                </thead>
                <tbody>
                  {manifest.passengers.map((passenger, index) => (
                    <tr key={passenger.id} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{passenger.ticket_number}</td>
                      <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{passenger.passenger_name}</td>
                      <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{passenger.passenger_phone}</td>
                      <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {passenger.passenger_cni || passenger.passenger_passport || 'N/A'}
                      </td>
                      <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{passenger.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
