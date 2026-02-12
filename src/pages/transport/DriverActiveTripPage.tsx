import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MapPin,
  Navigation,
  QrCode,
  AlertTriangle,
  Clock,
  Users,
  X,
  CheckCircle,
  XCircle,
  Battery,
  Signal
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { TripCancellationManager } from '../../lib/tripCancellationManager';

interface TripData {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  passengers: PassengerData[];
  distance: number;
  earnings: number;
  status: 'pending' | 'started' | 'completed';
}

interface PassengerData {
  id: string;
  name: string;
  phone: string;
  ticketId: string;
  status: 'pending' | 'boarded' | 'arrived';
  scannedAt?: {
    departure?: number;
    arrival?: number;
  };
}

const DriverActiveTripPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [trip, setTrip] = useState<TripData | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanMode, setScanMode] = useState<'departure' | 'arrival'>('departure');
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [gpsWarningTime, setGpsWarningTime] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const gpsCheckInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const mockTrip: TripData = {
      id: 'TRIP-001',
      origin: 'Dakar Plateau',
      destination: 'Thiès Escale',
      departureTime: '10:30',
      distance: 72,
      earnings: 3500,
      status: 'started',
      passengers: [
        {
          id: 'P1',
          name: 'Amadou Diallo',
          phone: '77 123 45 67',
          ticketId: 'TKT-001',
          status: 'pending',
        },
        {
          id: 'P2',
          name: 'Fatou Sall',
          phone: '76 234 56 78',
          ticketId: 'TKT-002',
          status: 'boarded',
          scannedAt: { departure: Date.now() - 300000 },
        },
      ],
    };
    setTrip(mockTrip);

    startGPSMonitoring();

    return () => {
      stopGPSMonitoring();
    };
  }, []);

  const startGPSMonitoring = () => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setGpsEnabled(true);
          setGpsWarningTime(null);
        },
        (error) => {
          console.error('[GPS] Error:', error);
          handleGPSLoss();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );

      gpsCheckInterval.current = setInterval(() => {
        if (!gpsEnabled && gpsWarningTime) {
          const elapsed = Date.now() - gpsWarningTime;
          if (elapsed > 30000) {
            setDriverOffline();
          }
        }
      }, 1000);
    }
  };

  const stopGPSMonitoring = () => {
    if (gpsCheckInterval.current) {
      clearInterval(gpsCheckInterval.current);
    }
  };

  const handleGPSLoss = () => {
    setGpsEnabled(false);
    if (!gpsWarningTime) {
      setGpsWarningTime(Date.now());
    }
  };

  const setDriverOffline = () => {
    console.log('[SECURITY] Driver forcé HORS LIGNE - GPS désactivé > 30s');
    alert('Vous avez été passé HORS LIGNE car votre GPS est désactivé.');
    navigate('/voyage/conducteur/dashboard');
  };

  const openScanner = (mode: 'departure' | 'arrival') => {
    setScanMode(mode);
    setShowScanner(true);
    setScanResult(null);

    setTimeout(() => {
      if (scannerRef.current) return;

      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      html5QrCode
        .start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            handleScan(decodedText, mode);
          },
          () => {}
        )
        .catch((err) => {
          console.error('[SCANNER] Error:', err);
        });
    }, 100);
  };

  const closeScanner = () => {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .then(() => {
          scannerRef.current = null;
          setShowScanner(false);
        })
        .catch((err) => console.error('[SCANNER] Stop error:', err));
    } else {
      setShowScanner(false);
    }
  };

  const handleScan = async (qrData: string, mode: 'departure' | 'arrival') => {
    try {
      const data = JSON.parse(qrData);
      const ticketId = data.ticketId || data.sub;

      if (!trip) return;

      const passenger = trip.passengers.find((p) => p.ticketId === ticketId);

      if (!passenger) {
        setScanResult({
          success: false,
          message: 'Billet non trouvé pour ce trajet',
        });
        return;
      }

      if (mode === 'departure') {
        if (passenger.status === 'boarded') {
          setScanResult({
            success: false,
            message: 'Passager déjà embarqué',
          });
          return;
        }

        passenger.status = 'boarded';
        passenger.scannedAt = { departure: Date.now() };

        setScanResult({
          success: true,
          message: `${passenger.name} embarqué avec succès`,
        });
      } else {
        if (passenger.status !== 'boarded') {
          setScanResult({
            success: false,
            message: "Passager n'est pas encore embarqué",
          });
          return;
        }

        passenger.status = 'arrived';
        passenger.scannedAt = {
          ...passenger.scannedAt,
          arrival: Date.now(),
        };

        await processTripCompletion(passenger);

        setScanResult({
          success: true,
          message: `${passenger.name} arrivé - Paiement traité`,
        });
      }

      setTrip({ ...trip });

      setTimeout(() => {
        closeScanner();
      }, 2000);
    } catch (error) {
      console.error('[SCAN] Error:', error);
      setScanResult({
        success: false,
        message: 'QR Code invalide',
      });
    }
  };

  const processTripCompletion = async (passenger: PassengerData) => {
    if (!trip) return;

    const driverEarnings = trip.earnings * 0.95;
    const platformCommission = trip.earnings * 0.05;

    console.log('[PAYMENT] Driver earnings:', driverEarnings, 'FCFA');
    console.log('[PAYMENT] Platform commission:', platformCommission, 'FCFA');

    alert(`Course terminée !\n+${driverEarnings.toLocaleString()} FCFA ajoutés à votre solde`);
  };

  const handleCancelTrip = async () => {
    const confirmed = window.confirm(
      'Êtes-vous sûr de vouloir annuler ce trajet ?\n\nLes passagers ayant payé seront notifiés et pourront réserver avec un autre chauffeur.'
    );

    if (!confirmed) return;

    try {
      if (!trip) return;

      const driverId = 'DRIVER-001';

      await TripCancellationManager.cancelTrip(trip.id, driverId, 'Driver initiated cancellation');

      alert('Trajet annulé avec succès.\nLes passagers ont été notifiés.');

      navigate('/voyage/conducteur/dashboard');
    } catch (error) {
      console.error('[CANCELLATION] Error:', error);
      alert('Erreur lors de l\'annulation du trajet. Veuillez réessayer.');
    }
  };

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du trajet...</p>
        </div>
      </div>
    );
  }

  const boardedCount = trip.passengers.filter((p) => p.status === 'boarded').length;
  const arrivedCount = trip.passengers.filter((p) => p.status === 'arrived').length;
  const pendingCount = trip.passengers.filter((p) => p.status === 'pending').length;

  return (
    <div className="relative h-screen overflow-hidden bg-gray-50">
      <div className="absolute top-0 left-0 right-0 bg-white shadow-md z-20 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-gray-900 truncate">
              {trip.origin} → {trip.destination}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-600 flex items-center gap-1">
                <Clock size={12} />
                {trip.departureTime}
              </span>
              <span className="text-xs text-gray-600 flex items-center gap-1">
                <Users size={12} />
                {boardedCount + arrivedCount}/{trip.passengers.length}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Battery size={20} className="text-green-600" />
            <Signal size={20} className={gpsEnabled ? 'text-green-600' : 'text-red-600'} />
          </div>
        </div>
      </div>

      {!gpsEnabled && gpsWarningTime && (
        <div className="absolute top-16 left-0 right-0 bg-red-500 text-white px-4 py-3 z-30 animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} />
            <div className="flex-1">
              <p className="text-sm font-bold">GPS DÉSACTIVÉ</p>
              <p className="text-xs">Activez votre GPS ou vous serez mis hors ligne dans {Math.max(0, 30 - Math.floor((Date.now() - gpsWarningTime) / 1000))}s</p>
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-20 left-0 right-0 bottom-60 bg-gray-200 z-10">
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-gray-500">
            <MapPin size={48} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Carte Interactive</p>
            <p className="text-xs">(Mapbox/Google Maps)</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => openScanner('departure')}
        className="absolute bottom-72 right-6 z-30 w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
        style={{
          boxShadow: '0 8px 24px rgba(251, 191, 36, 0.5)',
        }}
      >
        <QrCode size={36} className="text-gray-900" />
      </button>

      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-20 p-6 max-h-64 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-lg font-bold text-gray-900">Trajet en cours</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {trip.distance} km
              </span>
              <span className="flex items-center gap-1">
                💰 {trip.earnings.toLocaleString()} FCFA
              </span>
            </div>
          </div>
          <button
            onClick={() => openScanner('arrival')}
            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors"
          >
            Arrivée
          </button>
        </div>

        <div className="space-y-2 mb-4">
          {trip.passengers.map((passenger) => (
            <div
              key={passenger.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                passenger.status === 'arrived'
                  ? 'bg-green-50 border-green-200'
                  : passenger.status === 'boarded'
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{passenger.name}</p>
                <p className="text-xs text-gray-600">{passenger.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                {passenger.status === 'arrived' ? (
                  <>
                    <CheckCircle size={20} className="text-green-600" />
                    <span className="text-xs font-medium text-green-700">Arrivé</span>
                  </>
                ) : passenger.status === 'boarded' ? (
                  <>
                    <CheckCircle size={20} className="text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">À bord</span>
                  </>
                ) : (
                  <>
                    <Clock size={20} className="text-gray-400" />
                    <span className="text-xs font-medium text-gray-600">En attente</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleCancelTrip}
          className="w-full py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
        >
          <XCircle size={18} />
          Annuler le trajet
        </button>
      </div>

      {showScanner && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 bg-gray-900">
            <div>
              <h3 className="text-white font-bold">
                {scanMode === 'departure' ? 'Scan Départ' : 'Scan Arrivée'}
              </h3>
              <p className="text-gray-400 text-sm">
                {scanMode === 'departure' ? 'Validez la montée du passager' : 'Validez l\'arrivée du passager'}
              </p>
            </div>
            <button
              onClick={closeScanner}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X size={24} className="text-white" />
            </button>
          </div>

          <div className="flex-1 relative">
            <div id="qr-reader" className="w-full h-full"></div>

            {scanResult && (
              <div
                className={`absolute bottom-8 left-4 right-4 p-4 rounded-xl ${
                  scanResult.success
                    ? 'bg-green-500'
                    : 'bg-red-500'
                } text-white shadow-2xl animate-slideUp`}
              >
                <div className="flex items-center gap-3">
                  {scanResult.success ? (
                    <CheckCircle size={24} />
                  ) : (
                    <XCircle size={24} />
                  )}
                  <div>
                    <p className="font-bold">{scanResult.success ? 'Validé' : 'Erreur'}</p>
                    <p className="text-sm">{scanResult.message}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverActiveTripPage;
