import React, { useState, useEffect } from 'react';
import {
  Bus, Calendar, Users, Shield, AlertTriangle, MapPin, Clock,
  TrendingUp, Activity, Radio, Plus, Settings, BarChart3,
  RefreshCw, Zap, Eye, CheckCircle, XCircle, Pause, LogOut, X
} from 'lucide-react';
import { useAuth } from '../../context/FirebaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { ref, onValue, push, set } from 'firebase/database';
import { db } from '../../firebase';
import { FleetVehicle, LineAnalytics, ScanEvent, AvailabilityMetrics } from '../../types/transport';

interface Toast {
  id: number;
  type: 'success' | 'error' | 'loading';
  message: string;
}

interface Subscriber {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  subscription_type: string;
  subscription_status: 'active' | 'suspended' | 'expired';
  total_trips: number;
  suspicious_activity: boolean;
  last_trip_date: string;
}

const AdminOpsTransportPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [scanEvents, setScanEvents] = useState<ScanEvent[]>([]);
  const [lineAnalytics, setLineAnalytics] = useState<LineAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastIdCounter, setToastIdCounter] = useState(0);

  const loadData = () => {
    if (!db) return;

    const vehiclesRef = ref(db, 'fleet_vehicles');
    const subscribersRef = ref(db, 'pass_subscribers');
    const scansRef = ref(db, 'scan_events');
    const linesRef = ref(db, 'transport_lines');

    const unsubVehicles = onValue(vehiclesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const vehiclesArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setVehicles(vehiclesArray);
      } else {
        setVehicles([]);
      }
      setLoading(false);
    });

    const unsubSubscribers = onValue(subscribersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const subscribersArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setSubscribers(subscribersArray);
      } else {
        setSubscribers([]);
      }
    });

    const unsubScans = onValue(scansRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const scansArray = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .sort((a, b) => new Date(b.scan_time).getTime() - new Date(a.scan_time).getTime())
          .slice(0, 10);
        setScanEvents(scansArray);
      } else {
        setScanEvents([]);
      }
    });

    const unsubLines = onValue(linesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const linesArray = Object.keys(data).map(key => ({
          route_id: key,
          route_name: data[key].name || data[key].route_name,
          trips_today: data[key].trips_today || 0,
          average_occupancy_rate: data[key].average_occupancy_rate || 0,
          total_revenue: data[key].total_revenue || 0,
          peak_hours: data[key].peak_hours || [],
          active_vehicles: data[key].active_vehicles || 0,
          required_vehicles: data[key].required_vehicles || 0
        }));
        setLineAnalytics(linesArray);
      } else {
        setLineAnalytics([]);
      }
    });

    return () => {
      unsubVehicles();
      unsubSubscribers();
      unsubScans();
      unsubLines();
    };
  };

  useEffect(() => {
    const cleanup = loadData();
    return cleanup;
  }, []);

  const activeSubscribers = subscribers.filter(s => s.subscription_status === 'active').length;
  const estimatedPassengersToday = Math.round(activeSubscribers * 0.7);
  const currentFleetCapacity = vehicles.reduce((sum, v) => sum + (v.status === 'en_service' ? v.capacity : 0), 0);
  const requiredNdiagaNdiaye = Math.ceil(estimatedPassengersToday / 25);
  const requiredBuses = Math.ceil(estimatedPassengersToday / 50);
  const capacityGap = currentFleetCapacity - estimatedPassengersToday;

  const activeVehicles = vehicles.filter(v => v.status === 'en_service').length;
  const pausedVehicles = vehicles.filter(v => v.status === 'en_pause').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'en_maintenance').length;

  const totalRevenueToday = vehicles.reduce((sum, v) => sum + (v.total_revenue_today || 0), 0);
  const avgOccupancyRate = vehicles.length > 0
    ? vehicles.reduce((sum, v) => sum + (v.average_occupancy_rate || 0), 0) / vehicles.length
    : 0;

  const showToast = (type: 'success' | 'error' | 'loading', message: string, duration: number = 3000) => {
    const id = toastIdCounter;
    setToastIdCounter(prev => prev + 1);

    const newToast: Toast = { id, type, message };
    setToasts(prev => [...prev, newToast]);

    if (type !== 'loading') {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  };

  const hideToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleRefresh = () => {
    setLoading(true);
    loadData();
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/admin/ops/login');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  const handleEnrollVehicle = async (vehicleData: Partial<FleetVehicle>) => {
    console.log('🚀 handleEnrollVehicle appelé avec:', vehicleData);

    if (!db) {
      console.error('❌ Firebase DB non initialisé');
      showToast('error', '❌ Erreur: Base de données non disponible');
      return;
    }

    const loadingToastId = showToast('loading', '⏳ Enrôlement en cours...');

    try {
      const vehiclesRef = ref(db, 'fleet_vehicles');
      const newVehicleRef = push(vehiclesRef);

      const vehiclePayload = {
        vehicle_number: vehicleData.vehicle_number || 'N/A',
        type: vehicleData.type || 'ndiaga_ndiaye',
        capacity: vehicleData.capacity || 25,
        route: vehicleData.route || 'N/A',
        license_plate: vehicleData.license_plate || 'N/A',
        driver_name: vehicleData.driver_name || 'N/A',
        driver_phone: vehicleData.driver_phone || 'N/A',
        insurance_expiry: vehicleData.insurance_expiry || 'N/A',
        technical_control_expiry: vehicleData.technical_control_expiry || 'N/A',
        status: 'en_pause',
        current_trips_today: 0,
        total_revenue_today: 0,
        average_occupancy_rate: 0,
        created_at: new Date().toISOString()
      };

      console.log('💾 Enregistrement du véhicule:', vehiclePayload);

      await set(newVehicleRef, vehiclePayload);

      console.log('✅ Véhicule enregistré avec succès!');
      hideToast(loadingToastId);
      showToast('success', '✅ Véhicule enrôlé avec succès!');
      setShowEnrollModal(false);
    } catch (error) {
      console.error('❌ Erreur lors de l\'enrôlement:', error);
      hideToast(loadingToastId);
      showToast('error', `❌ Échec: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#1A1A1B] to-[#0A0A0B] p-4">
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tight">Command Center</h1>
            </div>
            <p className="text-gray-400 text-sm">DEM-DEM Express • Ops Transport • Temps Réel</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center space-x-2 transition-colors border border-gray-700"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span className="text-sm font-medium">Actualiser</span>
            </button>
            <button
              onClick={() => setShowEnrollModal(true)}
              className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus size={16} />
              <span className="text-sm font-medium">Enrôler Véhicule</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center space-x-2 transition-colors"
              title="Déconnexion"
            >
              <LogOut size={16} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
          <div className="xl:col-span-2 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-2xl p-6 border border-[#10B981]/30 shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="text-white" size={24} />
                  <h2 className="text-2xl font-black text-white uppercase">Centre de Disponibilité</h2>
                </div>
                <p className="text-green-100 text-sm">Prestige Flow • Calcul en temps réel</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="text-white" size={20} />
                  <span className="text-white/80 text-xs font-medium uppercase">Abonnés Actifs</span>
                </div>
                <div className="text-4xl font-black text-white">{activeSubscribers}</div>
                <div className="text-green-200 text-xs mt-1">Susceptibles de voyager</div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="text-white" size={20} />
                  <span className="text-white/80 text-xs font-medium uppercase">Demande Estimée</span>
                </div>
                <div className="text-4xl font-black text-white">{estimatedPassengersToday}</div>
                <div className="text-green-200 text-xs mt-1">Passagers attendus aujourd'hui</div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center space-x-2 mb-2">
                  <Bus className="text-white" size={20} />
                  <span className="text-white/80 text-xs font-medium uppercase">Capacité Actuelle</span>
                </div>
                <div className="text-4xl font-black text-white">{currentFleetCapacity}</div>
                <div className="text-green-200 text-xs mt-1">Places disponibles</div>
              </div>
            </div>

            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">Besoin en Flotte</h3>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  capacityGap >= 0 ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {capacityGap >= 0 ? `+${capacityGap} places excédentaires` : `${Math.abs(capacityGap)} places manquantes`}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-white/60 text-xs mb-1 uppercase">Ndiaga Ndiaye Requis</div>
                  <div className="text-3xl font-black text-white">{requiredNdiagaNdiaye}</div>
                  <div className="text-green-200 text-xs mt-1">
                    {estimatedPassengersToday} passagers → {requiredNdiagaNdiaye} véhicules (25 places)
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-white/60 text-xs mb-1 uppercase">Bus Requis (Alternative)</div>
                  <div className="text-3xl font-black text-white">{requiredBuses}</div>
                  <div className="text-green-200 text-xs mt-1">
                    {estimatedPassengersToday} passagers → {requiredBuses} bus (50 places)
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1E1E1E] rounded-2xl p-6 border border-gray-800">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="text-[#10B981]" size={24} />
              <h2 className="text-xl font-black text-white uppercase">KPIs Temps Réel</h2>
            </div>

            <div className="space-y-3">
              <div className="bg-[#2A2A2A] rounded-xl p-4 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs uppercase">Flotte Active</span>
                  <CheckCircle className="text-[#10B981]" size={16} />
                </div>
                <div className="text-3xl font-black text-white">{activeVehicles}</div>
                <div className="text-gray-500 text-xs mt-1">Véhicules en service</div>
              </div>

              <div className="bg-[#2A2A2A] rounded-xl p-4 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs uppercase">Revenus Aujourd'hui</span>
                  <TrendingUp className="text-[#10B981]" size={16} />
                </div>
                <div className="text-3xl font-black text-white">{(totalRevenueToday / 1000).toFixed(0)}k</div>
                <div className="text-gray-500 text-xs mt-1">FCFA</div>
              </div>

              <div className="bg-[#2A2A2A] rounded-xl p-4 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs uppercase">Taux d'Occupation Moyen</span>
                  <Activity className="text-[#10B981]" size={16} />
                </div>
                <div className="text-3xl font-black text-white">{avgOccupancyRate.toFixed(0)}%</div>
                <div className="text-gray-500 text-xs mt-1">Tous véhicules confondus</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#2A2A2A] rounded-xl p-3 border border-gray-800">
                  <div className="flex items-center space-x-1 mb-1">
                    <Pause className="text-yellow-500" size={12} />
                    <span className="text-gray-400 text-xs">Pause</span>
                  </div>
                  <div className="text-xl font-black text-white">{pausedVehicles}</div>
                </div>

                <div className="bg-[#2A2A2A] rounded-xl p-3 border border-gray-800">
                  <div className="flex items-center space-x-1 mb-1">
                    <Settings className="text-red-500" size={12} />
                    <span className="text-gray-400 text-xs">Maintenance</span>
                  </div>
                  <div className="text-xl font-black text-white">{maintenanceVehicles}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
          <div className="bg-[#1E1E1E] rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="text-[#10B981]" size={24} />
                  <h2 className="text-xl font-black text-white uppercase">Analytics de Ligne 360</h2>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              {lineAnalytics.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="inline-block text-gray-600 mb-3" size={48} />
                  <p className="text-gray-500 mb-2">Aucune ligne configurée</p>
                  <p className="text-gray-600 text-sm">Les lignes apparaîtront ici une fois créées dans la configuration</p>
                </div>
              ) : (
                lineAnalytics.map((line) => (
                <div key={line.route_id} className="bg-[#2A2A2A] rounded-xl p-5 border border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-white font-bold text-lg">{line.route_name}</h3>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1">
                          <Bus className="text-[#10B981]" size={14} />
                          <span className="text-gray-400 text-xs">{line.active_vehicles} actifs / {line.required_vehicles} requis</span>
                        </div>
                        {line.active_vehicles < line.required_vehicles && (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium border border-red-500/30">
                            Manque {line.required_vehicles - line.active_vehicles} véhicules
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-white">{line.trips_today}</div>
                      <div className="text-gray-500 text-xs">trajets</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/30 rounded-lg p-3">
                      <div className="text-gray-400 text-xs mb-1 uppercase">Taux d'Occupation</div>
                      <div className="text-2xl font-black text-[#10B981]">{line.average_occupancy_rate}%</div>
                    </div>

                    <div className="bg-black/30 rounded-lg p-3">
                      <div className="text-gray-400 text-xs mb-1 uppercase">Revenus</div>
                      <div className="text-2xl font-black text-[#10B981]">{(line.total_revenue / 1000).toFixed(0)}k</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-gray-400 text-xs mb-2 uppercase">Heures de Pointe</div>
                    <div className="flex items-end space-x-2 h-20">
                      {line.peak_hours.map((hour) => (
                        <div key={hour.hour} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full bg-[#10B981] rounded-t transition-all"
                            style={{ height: `${(hour.demand / 225) * 100}%` }}
                          ></div>
                          <span className="text-gray-500 text-xs mt-1">{hour.hour}h</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
              )}
            </div>
          </div>

          <div className="bg-[#1E1E1E] rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Radio className="text-[#10B981]" size={24} />
                  <h2 className="text-xl font-black text-white uppercase">Vue Terrain • Live Feed</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-400 text-xs">LIVE</span>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-3 max-h-[500px] overflow-y-auto">
              {scanEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Eye className="inline-block text-gray-600 mb-3" size={48} />
                  <p className="text-gray-500">Aucun scan récent</p>
                </div>
              ) : (
                scanEvents.map((scan) => (
                  <div key={scan.id} className="bg-[#2A2A2A] rounded-xl p-4 border border-gray-800 hover:border-[#10B981]/30 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
                        <div>
                          <div className="text-white font-bold text-sm">{scan.location}</div>
                          <div className="text-gray-500 text-xs">{scan.route}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-400 text-xs">
                          {new Date(scan.scan_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Users className="text-[#10B981]" size={14} />
                          <span className="text-white text-sm font-medium">{scan.passenger_count}</span>
                        </div>
                        <div className="text-gray-500 text-xs">{scan.subscription_type}</div>
                      </div>
                      <div className="text-gray-500 text-xs">Par {scan.controller_name}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#1E1E1E] rounded-2xl border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bus className="text-[#10B981]" size={24} />
                <h2 className="text-xl font-black text-white uppercase">Gestion de la Flotte Hybride</h2>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block w-12 h-12 border-4 border-gray-700 border-t-[#10B981] rounded-full animate-spin"></div>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="p-12 text-center">
                <Bus className="inline-block text-gray-600 mb-3" size={48} />
                <p className="text-gray-500 mb-4">Aucun véhicule enrôlé</p>
                <button
                  onClick={() => setShowEnrollModal(true)}
                  className="px-6 py-3 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-medium transition-colors"
                >
                  Enrôler votre premier véhicule
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-[#2A2A2A]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Véhicule</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Ligne</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Capacité</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Trajets/Jour</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Occupation</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Revenus</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Dernier Scan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-[#2A2A2A] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{vehicle.vehicle_number}</div>
                        <div className="text-gray-500 text-xs">{vehicle.license_plate}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300 text-sm capitalize">
                          {vehicle.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white text-sm">{vehicle.route}</td>
                      <td className="px-6 py-4">
                        {vehicle.status === 'en_service' ? (
                          <span className="px-3 py-1 bg-[#10B981]/20 text-[#10B981] rounded-full text-xs font-bold border border-[#10B981]/30 flex items-center space-x-1 w-fit">
                            <CheckCircle size={12} />
                            <span>En Service</span>
                          </span>
                        ) : vehicle.status === 'en_pause' ? (
                          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-bold border border-yellow-500/30 flex items-center space-x-1 w-fit">
                            <Pause size={12} />
                            <span>En Pause</span>
                          </span>
                        ) : vehicle.status === 'en_maintenance' ? (
                          <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold border border-red-500/30 flex items-center space-x-1 w-fit">
                            <Settings size={12} />
                            <span>Maintenance</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-bold border border-gray-500/30 flex items-center space-x-1 w-fit">
                            <XCircle size={12} />
                            <span>Inactif</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-white font-medium">{vehicle.capacity} places</td>
                      <td className="px-6 py-4 text-white font-bold">{vehicle.current_trips_today || 0}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-700 rounded-full h-2 w-16">
                            <div
                              className="bg-[#10B981] h-2 rounded-full transition-all"
                              style={{ width: `${vehicle.average_occupancy_rate || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-white text-sm font-medium">{vehicle.average_occupancy_rate || 0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#10B981] font-bold">{(vehicle.total_revenue_today || 0).toLocaleString()} F</td>
                      <td className="px-6 py-4">
                        {vehicle.last_scan_location ? (
                          <div>
                            <div className="text-gray-300 text-sm">{vehicle.last_scan_location}</div>
                            <div className="text-gray-500 text-xs">
                              {vehicle.last_scan_time ? new Date(vehicle.last_scan_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-600 text-sm">Aucun scan</span>
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

      {showEnrollModal && (
        <EnrollVehicleModal
          onClose={() => setShowEnrollModal(false)}
          onSubmit={handleEnrollVehicle}
        />
      )}

      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border backdrop-blur-sm animate-slide-in-right ${
              toast.type === 'success'
                ? 'bg-green-500/90 border-green-400 text-white'
                : toast.type === 'error'
                ? 'bg-red-500/90 border-red-400 text-white'
                : 'bg-blue-500/90 border-blue-400 text-white'
            }`}
          >
            {toast.type === 'loading' && (
              <RefreshCw className="w-5 h-5 animate-spin" />
            )}
            <span className="font-medium">{toast.message}</span>
            {toast.type !== 'loading' && (
              <button
                onClick={() => hideToast(toast.id)}
                className="ml-2 hover:opacity-70 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

interface EnrollVehicleModalProps {
  onClose: () => void;
  onSubmit: (vehicleData: Partial<FleetVehicle>) => Promise<void>;
}

const EnrollVehicleModal: React.FC<EnrollVehicleModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    vehicle_number: '',
    type: 'ndiaga_ndiaye' as 'ndiaga_ndiaye' | 'bus' | 'minibus',
    capacity: 25,
    route: '',
    license_plate: '',
    driver_name: '',
    driver_phone: '',
    insurance_expiry: '',
    technical_control_expiry: ''
  });

  const [submitting, setSubmitting] = useState(false);

  const isFormValid = () => {
    return formData.vehicle_number.trim() !== '' &&
           formData.license_plate.trim() !== '' &&
           formData.route.trim() !== '';
  };

  const getValidationMessage = () => {
    if (!formData.vehicle_number.trim()) {
      return 'Veuillez remplir le numéro de véhicule';
    }
    if (!formData.license_plate.trim()) {
      return 'Veuillez remplir l\'immatriculation';
    }
    if (!formData.route.trim()) {
      return 'Veuillez renseigner la ligne affectée';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      console.log('❌ Formulaire invalide:', getValidationMessage());
      return;
    }

    console.log('✅ Formulaire valide, soumission...');
    setSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error enrolling vehicle:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E1E1E] rounded-2xl border border-gray-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-black text-white uppercase">Enrôlement Partenaire</h2>
          <p className="text-gray-400 text-sm mt-1">Enregistrer un nouveau véhicule dans la flotte</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">Numéro de Véhicule</label>
              <input
                type="text"
                value={formData.vehicle_number}
                onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#10B981]"
                placeholder="Ex: NN-001"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">Immatriculation</label>
              <input
                type="text"
                value={formData.license_plate}
                onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#10B981]"
                placeholder="Ex: DK-1234-AB"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">Type de Véhicule</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({
                  ...formData,
                  type: e.target.value as 'ndiaga_ndiaye' | 'bus' | 'minibus',
                  capacity: e.target.value === 'ndiaga_ndiaye' ? 25 : e.target.value === 'bus' ? 50 : 15
                })}
                className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#10B981]"
              >
                <option value="ndiaga_ndiaye">Ndiaga Ndiaye (25 places)</option>
                <option value="bus">Bus (50 places)</option>
                <option value="minibus">Minibus (15 places)</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">Capacité</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#10B981]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Ligne Affectée</label>
            <input
              type="text"
              value={formData.route}
              onChange={(e) => setFormData({ ...formData, route: e.target.value })}
              className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#10B981]"
              placeholder="Ex: Ligne A - Dakar → Pikine"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">Nom du Chauffeur</label>
              <input
                type="text"
                value={formData.driver_name}
                onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#10B981]"
                placeholder="Ex: Moussa Diop"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">Téléphone Chauffeur</label>
              <input
                type="tel"
                value={formData.driver_phone}
                onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })}
                className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#10B981]"
                placeholder="Ex: 77 123 45 67"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">Expiration Assurance</label>
              <input
                type="date"
                value={formData.insurance_expiry}
                onChange={(e) => setFormData({ ...formData, insurance_expiry: e.target.value })}
                className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#10B981]"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">Expiration Visite Technique</label>
              <input
                type="date"
                value={formData.technical_control_expiry}
                onChange={(e) => setFormData({ ...formData, technical_control_expiry: e.target.value })}
                className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#10B981]"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Annuler
            </button>
            <div className="flex-1 relative group">
              <button
                type="submit"
                disabled={submitting || !isFormValid()}
                className="w-full px-6 py-3 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={!isFormValid() ? getValidationMessage() : ''}
              >
                {submitting ? 'Enrôlement...' : 'Enrôler le Véhicule'}
              </button>
              {!isFormValid() && (
                <div className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap border border-gray-700 shadow-xl">
                  {getValidationMessage()}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminOpsTransportPage;
