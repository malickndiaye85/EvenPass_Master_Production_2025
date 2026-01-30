import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Users,
  Navigation,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../context/FirebaseAuthContext';
import { ref, push, set, get } from 'firebase/database';
import { db } from '../../firebase';
import { CustomModal } from '../../components/CustomModal';

interface DriverProfile {
  uid: string;
  firstName: string;
  lastName: string;
  vehicleSeats: number;
  status: string;
  isOnline: boolean;
}

interface TripFormData {
  departure: string;
  destination: string;
  date: string;
  time: string;
  price: string;
  availableSeats: string;
}

const SENEGAL_CITIES = [
  'Dakar',
  'Thiès',
  'Saint-Louis',
  'Kaolack',
  'Ziguinchor',
  'Touba',
  'Mbour',
  'Rufisque',
  'Diourbel',
  'Louga',
  'Tambacounda',
  'Kolda',
  'Richard-Toll',
  'Sédhiou',
  'Matam',
  'Kédougou',
  'Fatick',
  'Nioro du Rip',
  'Foundiougne',
  'Linguère'
];

export default function PublishTripPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<TripFormData>({
    departure: '',
    destination: '',
    date: '',
    time: '',
    price: '',
    availableSeats: ''
  });

  const [modal, setModal] = useState({
    isOpen: false,
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: ''
  });

  useEffect(() => {
    loadDriverData();
  }, [user]);

  const loadDriverData = async () => {
    if (!user) {
      navigate('/transport/driver/login');
      return;
    }

    try {
      const driverRef = ref(db, `drivers/${user.uid}`);
      const snapshot = await get(driverRef);

      if (snapshot.exists()) {
        const driverData = snapshot.val() as DriverProfile;

        if (driverData.status !== 'verified') {
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Accès refusé',
            message: 'Votre compte doit être vérifié pour publier des trajets.'
          });
          setTimeout(() => navigate('/voyage/chauffeur/dashboard'), 2000);
          return;
        }

        setDriver(driverData);
        setFormData({ ...formData, availableSeats: driverData.vehicleSeats.toString() });
      } else {
        navigate('/voyage/chauffeur/signup');
      }
    } catch (error) {
      console.error('Error loading driver data:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de charger vos données'
      });
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const today = new Date();
    const maxDate = new Date(today.setMonth(today.getMonth() + 3));
    return maxDate.toISOString().split('T')[0];
  };

  const validateForm = (): string | null => {
    if (!formData.departure) return 'Veuillez sélectionner un point de départ';
    if (!formData.destination) return 'Veuillez sélectionner une destination';
    if (formData.departure === formData.destination) return 'Le départ et la destination doivent être différents';
    if (!formData.date) return 'Veuillez sélectionner une date';
    if (!formData.time) return 'Veuillez sélectionner une heure';
    if (!formData.price || parseInt(formData.price) < 500) return 'Le prix doit être au minimum 500 FCFA';
    if (!formData.availableSeats || parseInt(formData.availableSeats) < 1) return 'Le nombre de places doit être au minimum 1';
    if (driver && parseInt(formData.availableSeats) > driver.vehicleSeats) {
      return `Votre véhicule a ${driver.vehicleSeats} places maximum`;
    }

    const selectedDate = new Date(formData.date + 'T' + formData.time);
    const now = new Date();
    if (selectedDate <= now) return 'La date et l\'heure doivent être dans le futur';

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Erreur de validation',
        message: validationError
      });
      return;
    }

    if (!user || !driver) return;

    setSubmitting(true);

    try {
      const tripsRef = ref(db, `trips/${user.uid}`);
      const newTripRef = push(tripsRef);

      const tripData = {
        driverId: user.uid,
        driverName: `${driver.firstName} ${driver.lastName}`,
        departure: formData.departure,
        destination: formData.destination,
        date: formData.date,
        time: formData.time,
        price: parseInt(formData.price),
        availableSeats: parseInt(formData.availableSeats),
        totalSeats: parseInt(formData.availableSeats),
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await set(newTripRef, tripData);

      setModal({
        isOpen: true,
        type: 'success',
        title: 'Trajet publié !',
        message: 'Votre trajet a été publié avec succès. Les passagers peuvent maintenant le voir.'
      });

      setTimeout(() => {
        navigate('/voyage/chauffeur/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Error publishing trip:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de publier le trajet. Veuillez réessayer.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#1a2942] to-[#0A1628] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!driver) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#10B981] to-[#059669] text-white p-4 shadow-lg sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/voyage/chauffeur/dashboard')}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Publier un trajet</h1>
            <p className="text-sm opacity-90">Proposez un nouveau trajet</p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="p-4 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Départ */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Point de départ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={formData.departure}
                onChange={(e) => setFormData({ ...formData, departure: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10B981] focus:border-transparent text-gray-900"
                required
              >
                <option value="">Sélectionner la ville de départ</option>
                {SENEGAL_CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Destination */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destination <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Navigation className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10B981] focus:border-transparent text-gray-900"
                required
              >
                <option value="">Sélectionner la ville de destination</option>
                {SENEGAL_CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date et Heure */}
          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10B981] focus:border-transparent text-gray-900"
                  required
                />
              </div>
            </div>

            {/* Heure */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heure <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10B981] focus:border-transparent text-gray-900"
                  required
                />
              </div>
            </div>
          </div>

          {/* Prix et Places */}
          <div className="grid grid-cols-2 gap-4">
            {/* Prix */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix / place <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10B981] focus:border-transparent text-gray-900"
                  placeholder="5000"
                  min="500"
                  step="100"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Min: 500 FCFA</p>
            </div>

            {/* Places disponibles */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Places <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.availableSeats}
                  onChange={(e) => setFormData({ ...formData, availableSeats: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10B981] focus:border-transparent text-gray-900"
                  placeholder="4"
                  min="1"
                  max={driver.vehicleSeats}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Max: {driver.vehicleSeats}</p>
            </div>
          </div>

          {/* Récapitulatif */}
          {formData.departure && formData.destination && formData.date && formData.time && formData.price && formData.availableSeats && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-blue-900 mb-2">Récapitulatif</p>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p><span className="font-medium">Trajet :</span> {formData.departure} → {formData.destination}</p>
                    <p><span className="font-medium">Date :</span> {new Date(formData.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p><span className="font-medium">Heure :</span> {formData.time}</p>
                    <p><span className="font-medium">Prix :</span> {parseInt(formData.price).toLocaleString()} FCFA / place</p>
                    <p><span className="font-medium">Places :</span> {formData.availableSeats} disponibles</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Informations importantes */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Informations importantes</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Assurez-vous d'être disponible à la date et l'heure indiquées</li>
                  <li>Le prix est par place passager</li>
                  <li>Vous pouvez annuler le trajet avant le départ</li>
                  <li>Les passagers seront notifiés immédiatement</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="space-y-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-4 bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all ${
                submitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Publication en cours...</span>
                </div>
              ) : (
                'Publier le trajet'
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/voyage/chauffeur/dashboard')}
              className="w-full py-4 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>

      <CustomModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        type={modal.type}
        title={modal.title}
        message={modal.message}
      />
    </div>
  );
}
