import React, { useState, useEffect } from 'react';
import {
  Bus, Calendar, Users, Shield, AlertTriangle, MapPin, Clock,
  TrendingUp, Activity, Radio, Plus, Settings, BarChart3,
  RefreshCw, Zap, Eye, CheckCircle, XCircle, Pause, LogOut, X, UserCheck, Database, Trash2
} from 'lucide-react';
import { useAuth } from '../../context/FirebaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { ref, onValue, push, set, update, get } from 'firebase/database';
import { db, auth, firestore } from '../../firebase';
import { FleetVehicle, LineAnalytics, ScanEvent, AvailabilityMetrics } from '../../types/transport';
import { doc, setDoc } from 'firebase/firestore';
import { autoSyncCurrentUser } from '../../lib/ensureAdminRoleSync';

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

interface VehicleLocation {
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  license_number?: string;
  status: 'available' | 'on_trip' | 'off_duty';
  current_vehicle_id?: string;
}

const AdminOpsTransportPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [scanEvents, setScanEvents] = useState<ScanEvent[]>([]);
  const [lineAnalytics, setLineAnalytics] = useState<LineAnalytics[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showChangeDriverModal, setShowChangeDriverModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<FleetVehicle | null>(null);
  const [vehicleLocation, setVehicleLocation] = useState<VehicleLocation | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastIdCounter, setToastIdCounter] = useState(0);
  const [newVehicleIds, setNewVehicleIds] = useState<Set<string>>(new Set());
  const [vehicleScans, setVehicleScans] = useState<Record<string, number>>({});
  const [totalScansToday, setTotalScansToday] = useState(0);
  const [globalOccupancyRate, setGlobalOccupancyRate] = useState(0);

  const loadData = () => {
    if (!db) return;

    const vehiclesRef = ref(db, 'fleet_vehicles');
    const subscribersRef = ref(db, 'pass_subscribers');
    const scansRef = ref(db, 'ops/transport/live_feed');
    const linesRef = ref(db, 'transport_lines');
    const driversRef = ref(db, 'drivers');

    const unsubVehicles = onValue(vehiclesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const vehiclesArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));

        setVehicles(prevVehicles => {
          const prevIds = new Set(prevVehicles.map(v => v.id));
          const newIds = vehiclesArray
            .filter(v => !prevIds.has(v.id))
            .map(v => v.id);

          if (newIds.length > 0) {
            setNewVehicleIds(prev => new Set([...prev, ...newIds]));
            setTimeout(() => {
              setNewVehicleIds(prev => {
                const updated = new Set(prev);
                newIds.forEach(id => updated.delete(id));
                return updated;
              });
            }, 3000);
          }

          return vehiclesArray;
        });
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
          .map(key => ({
            id: key,
            ...data[key],
            scan_time: data[key].datetime || data[key].timestamp,
            location: data[key].vehicleId || 'Véhicule inconnu',
            route: data[key].lineName || 'Ligne inconnue',
            passenger_count: 1,
            subscription_type: 'SAMA PASS',
            controller_name: 'EPscanT'
          }))
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
        const linesArray = Object.keys(data).map(key => {
          const lineData = data[key];

          // Calculer les passagers par heure depuis passengers_per_hour
          const passengersPerHour = lineData.passengers_per_hour || {};
          const currentHour = new Date().getHours();
          const passengersThisHour = passengersPerHour[currentHour] || 0;

          return {
            route_id: key,
            route_name: lineData.name || lineData.route_name,
            trips_today: lineData.trips_today || 0,
            average_occupancy_rate: lineData.average_occupancy_rate || 0,
            total_revenue: lineData.total_revenue || 0,
            peak_hours: lineData.peak_hours || [],
            active_vehicles: lineData.active_vehicles || 0,
            required_vehicles: lineData.required_vehicles || 0,
            passengers_this_hour: passengersThisHour
          };
        });
        setLineAnalytics(linesArray);
      } else {
        setLineAnalytics([]);
      }
    });

    const unsubDrivers = onValue(driversRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const driversArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setDrivers(driversArray);
      } else {
        setDrivers([]);
      }
    });

    // LISTENER POUR VOYAGE/EXPRESS (ANALYTICS LIGNE C)
    const ligneExpressRef = ref(db, 'voyage/express');
    const unsubLigneExpress = onValue(ligneExpressRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const expressLinesArray = Object.keys(data).map(lineId => {
          const lineData = data[lineId];
          const statsRealtime = lineData.stats?.realtime || {};

          return {
            route_id: lineId,
            route_name: lineId === 'ligne-c' ? 'Ligne C (Dakar ↔ Keur Massar)' : lineId,
            trips_today: statsRealtime.passengers_today || 0,
            average_occupancy_rate: statsRealtime.occupancy_rate || 0,
            total_revenue: statsRealtime.revenue_today || 0,
            peak_hours: [],
            active_vehicles: 0,
            required_vehicles: 0,
            passengers_this_hour: statsRealtime.passengers_today || 0
          };
        });

        setLineAnalytics(prev => {
          const existingIds = new Set(prev.map(l => l.route_id));
          const newLines = expressLinesArray.filter(l => !existingIds.has(l.route_id));
          const updated = prev.map(l => {
            const express = expressLinesArray.find(e => e.route_id === l.route_id);
            return express || l;
          });
          return [...updated, ...newLines];
        });
      }
    });

    // Charger les stats de scans pour chaque véhicule
    const loadVehicleScans = async () => {
      const today = new Date().toISOString().split('T')[0];
      const scansCount: Record<string, number> = {};

      const allVehiclesRef = ref(db, 'fleet_vehicles');
      const vehiclesSnapshot = await get(allVehiclesRef);

      if (vehiclesSnapshot.exists()) {
        const vehiclesData = vehiclesSnapshot.val();

        for (const vehicleId of Object.keys(vehiclesData)) {
          const vehicleScansRef = ref(db, `transport/scans/${vehicleId}`);
          const scansSnapshot = await get(vehicleScansRef);

          if (scansSnapshot.exists()) {
            const allScans = scansSnapshot.val();
            let todayScans = 0;

            Object.values(allScans).forEach((scan: any) => {
              const scanDate = scan.timestamp?.split('T')[0];
              if (scanDate === today && scan.scanStatus === 'valid') {
                todayScans++;
              }
            });

            scansCount[vehicleId] = todayScans;
          } else {
            scansCount[vehicleId] = 0;
          }
        }
      }

      setVehicleScans(scansCount);
    };

    loadVehicleScans();
    const scanInterval = setInterval(loadVehicleScans, 30000); // Refresh toutes les 30s

    // LISTENER POUR LES STATS GLOBALES (SCANS AUJOURD'HUI + TAUX D'OCCUPATION)
    const globalStatsRef = ref(db, 'transport_stats/global');
    const unsubGlobalStats = onValue(globalStatsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const today = new Date().toISOString().split('T')[0];

        // Compteur de scans aujourd'hui depuis scan_events
        const scansToday = data.total_scans_today || 0;
        setTotalScansToday(scansToday);

        // Taux d'occupation global
        const occupancyRate = data.average_occupancy_rate || 0;
        setGlobalOccupancyRate(occupancyRate);
      } else {
        setTotalScansToday(0);
        setGlobalOccupancyRate(0);
      }
    });

    return () => {
      unsubVehicles();
      unsubSubscribers();
      unsubScans();
      unsubLines();
      unsubDrivers();
      unsubLigneExpress();
      unsubGlobalStats();
      clearInterval(scanInterval);
    };
  };

  useEffect(() => {
    const cleanup = loadData();

    // Auto-sync adminRoles au démarrage
    if (user?.uid && user?.email && user?.role) {
      autoSyncCurrentUser(user.uid, user.email, user.role).catch(err => {
        console.error('[ADMIN-OPS-TRANSPORT] Erreur sync adminRoles:', err);
      });
    }

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

  const availableDrivers = drivers.filter(d => d.status === 'available' || d.status === 'off_duty');

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

  const handleDeleteVehicle = async (vehicle: FleetVehicle) => {
    if (!db) return;

    const confirmDelete = window.confirm(
      `⚠️ ATTENTION : Suppression définitive\n\n` +
      `Véhicule: ${vehicle.vehicle_number}\n` +
      `Immatriculation: ${vehicle.license_plate || 'N/A'}\n\n` +
      `Cette action est IRRÉVERSIBLE.\n\n` +
      `Voulez-vous vraiment supprimer ce véhicule ?`
    );

    if (!confirmDelete) return;

    const loadingToastId = showToast('loading', `Suppression de ${vehicle.vehicle_number}...`);

    try {
      const vehicleRef = ref(db, `fleet_vehicles/${vehicle.id}`);
      await set(vehicleRef, null);

      hideToast(loadingToastId);
      showToast('success', `Véhicule ${vehicle.vehicle_number} supprimé avec succès`);
    } catch (error: any) {
      hideToast(loadingToastId);
      showToast('error', `Erreur lors de la suppression: ${error.message}`);
      console.error('Erreur suppression véhicule:', error);
    }
  };

  const handleSetMaintenance = async (vehicle: FleetVehicle) => {
    if (!db) return;

    const loadingToastId = showToast('loading', `Mise à jour du véhicule ${vehicle.vehicle_number}...`);

    try {
      const vehicleRef = ref(db, `fleet_vehicles/${vehicle.id}`);
      const newStatus = vehicle.status === 'en_maintenance' ? 'en_service' : 'en_maintenance';

      await update(vehicleRef, {
        status: newStatus,
        updated_at: new Date().toISOString()
      });

      hideToast(loadingToastId);

      if (newStatus === 'en_maintenance') {
        showToast('success', `✅ Véhicule ${vehicle.vehicle_number} mis en maintenance`);
      } else {
        showToast('success', `✅ Véhicule ${vehicle.vehicle_number} remis en service`);
      }
    } catch (error: any) {
      hideToast(loadingToastId);
      showToast('error', `❌ Erreur: ${error.message}`);
      console.error('Erreur mise en maintenance:', error);
    }
  };

  const handleLocateVehicle = async (vehicle: FleetVehicle) => {
    if (!db) return;

    setSelectedVehicle(vehicle);
    setShowLocationModal(true);
    setVehicleLocation(null);

    const locationRef = ref(db, `live/positions/${vehicle.id}`);

    onValue(locationRef, (snapshot) => {
      if (snapshot.exists()) {
        setVehicleLocation(snapshot.val());
      } else {
        setVehicleLocation(null);
      }
    }, { onlyOnce: true });
  };

  const handleChangeDriver = (vehicle: FleetVehicle) => {
    setSelectedVehicle(vehicle);
    setShowChangeDriverModal(true);
  };

  const handleAssignDriver = async (driverId: string) => {
    if (!db || !selectedVehicle) return;

    const loadingToastId = showToast('loading', 'Changement de chauffeur en cours...');

    try {
      const vehicleRef = ref(db, `fleet_vehicles/${selectedVehicle.id}`);
      const driverRef = ref(db, `drivers/${driverId}`);

      await update(vehicleRef, {
        assigned_driver_id: driverId,
        updated_at: new Date().toISOString()
      });

      await update(driverRef, {
        current_vehicle_id: selectedVehicle.id,
        status: 'on_trip'
      });

      hideToast(loadingToastId);
      showToast('success', `✅ Chauffeur assigné au véhicule ${selectedVehicle.vehicle_number}`);
      setShowChangeDriverModal(false);
      setSelectedVehicle(null);
    } catch (error: any) {
      hideToast(loadingToastId);
      showToast('error', `❌ Erreur: ${error.message}`);
      console.error('Erreur assignation chauffeur:', error);
    }
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

  const handleReEnrollVehicle = async (vehicle: FleetVehicle) => {
    console.log('🔄 [RE-ENROLL] Démarrage ré-enrôlement forcé');
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert('❌ Session expirée. Reconnectez-vous.');
      return;
    }

    const authUID = currentUser.uid;
    const accessCode = vehicle.access_code || vehicle.epscanv_pin;

    if (!accessCode) {
      alert('❌ Aucun code d\'accès trouvé pour ce véhicule !');
      return;
    }

    const confirmed = confirm(`🔄 RÉ-ENRÔLEMENT FORCÉ\n\nVéhicule: ${vehicle.license_plate}\nCode: ${accessCode}\n\nCette action va FORCER l'écriture du code dans:\n• Firestore: access_codes/${accessCode}\n• Realtime DB: fleet_indices/codes/${accessCode}\n• Realtime DB: ops/transport/vehicles/${vehicle.id}\n\nContinuer ?`);

    if (!confirmed) return;

    const loadingToastId = showToast('loading', '🔄 Ré-enrôlement en cours...');

    try {
      // 1. Firestore access_codes
      console.log('📝 [RE-ENROLL] Écriture Firestore access_codes...');
      const accessCodeDoc = doc(firestore, 'access_codes', accessCode);
      await setDoc(accessCodeDoc, {
        code: accessCode,
        type: 'vehicle',
        vehicleId: vehicle.id,
        vehiclePlate: vehicle.license_plate || 'N/A',
        isActive: true,
        createdBy: authUID,
        createdAt: new Date().toISOString(),
        staffName: `Véhicule ${vehicle.vehicle_number || 'N/A'}`,
        usageCount: 0,
        reEnrolledAt: new Date().toISOString()
      });
      console.log('✅ [RE-ENROLL] Firestore OK');

      // 2. Realtime DB fleet_indices
      console.log('📝 [RE-ENROLL] Écriture Realtime DB fleet_indices...');
      const pinIndexRef = ref(db, `fleet_indices/codes/${accessCode}`);
      await set(pinIndexRef, {
        vehicleId: vehicle.id,
        vehiclePlate: vehicle.license_plate || 'N/A',
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: authUID,
        usageCount: 0,
        reEnrolledAt: new Date().toISOString()
      });
      console.log('✅ [RE-ENROLL] Realtime DB index OK');

      // 3. Realtime DB ops/transport/vehicles
      console.log('📝 [RE-ENROLL] Écriture Realtime DB ops/transport/vehicles...');
      const opsVehicleRef = ref(db, `ops/transport/vehicles/${vehicle.id}`);
      await set(opsVehicleRef, {
        access_code: accessCode,
        license_plate: vehicle.license_plate || 'N/A',
        driver_name: vehicle.driver_name || 'N/A',
        vehicle_number: vehicle.vehicle_number || 'N/A',
        line_id: vehicle.route || 'N/A',
        isActive: true,
        createdAt: new Date().toISOString(),
        reEnrolledAt: new Date().toISOString()
      });
      console.log('✅ [RE-ENROLL] Realtime DB ops/transport OK');

      hideToast(loadingToastId);
      showToast('success', `✅ Véhicule ${accessCode} ré-enrôlé avec succès !`, 5000);

      alert(`✅ RÉ-ENRÔLEMENT RÉUSSI\n\nCode: ${accessCode}\n\n✅ Firestore: access_codes/${accessCode}\n✅ Realtime DB: fleet_indices/codes/${accessCode}\n✅ Realtime DB: ops/transport/vehicles/${vehicle.id}\n\nLe véhicule peut maintenant se connecter à EPscanT.`);

    } catch (error: any) {
      console.error('❌ [RE-ENROLL] Échec:', error);
      hideToast(loadingToastId);
      showToast('error', `❌ Échec ré-enrôlement: ${error.message}`, 8000);
      alert(`❌ ÉCHEC RÉ-ENRÔLEMENT\n\nErreur: ${error.code || 'UNKNOWN'}\nMessage: ${error.message}\n\nVérifiez les permissions Firebase.`);
    }
  };

  const handleEnrollVehicle = async (vehicleData: Partial<FleetVehicle>) => {
    console.log('🚀 [ENROLL] Démarrage enrôlement véhicule');

    // 1. MAPPING DIRECT - Source de vérité absolue
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert('❌ ERREUR CRITIQUE: Aucun utilisateur connecté. Veuillez vous reconnecter.');
      console.error('❌ [ENROLL] auth.currentUser est null');
      showToast('error', '❌ Session expirée. Reconnectez-vous.', 5000);
      return;
    }

    const authUID = currentUser.uid;
    const authEmail = currentUser.email || 'unknown';

    console.log('🔐 [ENROLL] UID SOURCE DE VÉRITÉ:', authUID);
    console.log('📧 [ENROLL] Email:', authEmail);
    console.log('👤 [ENROLL] Rôle context:', user?.role);

    // Vérification rôle
    if (user?.role !== 'ops_transport' && user?.role !== 'super_admin' && authUID !== 'Tnq8Isi0fATmidMwEuVrw1SAJkI3') {
      alert(`❌ ACCÈS REFUSÉ\n\nRôle actuel: ${user?.role}\nUID: ${authUID}\n\nVotre rôle n'est pas autorisé à enrôler des véhicules.`);
      showToast('error', `❌ Rôle "${user?.role}" non autorisé`, 5000);
      return;
    }

    const loadingToastId = showToast('loading', '⏳ Enrôlement en cours...');

    try {
      // 2. GÉNÉRATION PIN CLIENT-SIDE
      console.log('🎲 [ENROLL] Génération PIN côté client...');
      const accessCode = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('✅ [ENROLL] PIN généré:', accessCode);

      // 3. CRÉATION RÉFÉRENCE REALTIME DB
      console.log('🔧 [ENROLL] Création référence Realtime DB...');
      const vehiclesRef = ref(db, 'fleet_vehicles');
      const newVehicleRef = push(vehiclesRef);
      const vehicleId = newVehicleRef.key;

      if (!vehicleId) {
        throw new Error('Impossible de générer un ID véhicule');
      }

      console.log('✅ [ENROLL] Vehicle ID:', vehicleId);

      // 4. NETTOYAGE PAYLOAD - Éliminer tous les undefined
      const rawPayload = {
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
        access_code: accessCode,
        epscanv_pin: accessCode,
        created_at: new Date().toISOString(),
        created_by: authUID
      };

      // Sérialisation pour éliminer undefined
      const vehiclePayload = JSON.parse(JSON.stringify(rawPayload));
      console.log('🧹 [ENROLL] Payload nettoyé:', vehiclePayload);

      // 5. DIAGNOSTIC FLASH
      console.log('🔍 [ENROLL] DIAGNOSTIC FLASH:');
      console.log('   📍 Chemin Realtime DB:', `fleet_vehicles/${vehicleId}`);
      console.log('   🆔 UID qui écrit:', authUID);
      console.log('   📊 Payload keys:', Object.keys(vehiclePayload).length);
      console.log('   🔐 PIN généré:', accessCode);

      // 6. ÉCRITURE ATOMIQUE REALTIME DB (Véhicule + PIN intégré)
      console.log('💾 [ENROLL] Écriture Realtime DB (véhicule + PIN)...');
      await set(newVehicleRef, vehiclePayload);
      console.log('✅ [ENROLL] Véhicule écrit dans Realtime DB avec PIN intégré');

      // 7. CRÉATION INDEX PIN pour recherche rapide
      console.log('🔍 [ENROLL] Création index PIN pour recherche rapide...');
      const pinIndexRef = ref(db, `fleet_indices/codes/${accessCode}`);
      const pinIndexPayload = {
        vehicleId: vehicleId,
        vehiclePlate: vehicleData.license_plate || 'N/A',
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: authUID,
        usageCount: 0
      };

      const cleanPinIndexPayload = JSON.parse(JSON.stringify(pinIndexPayload));

      try {
        await set(pinIndexRef, cleanPinIndexPayload);
        console.log('✅ [ENROLL] Index PIN créé dans Realtime DB:', `fleet_indices/codes/${accessCode}`);
      } catch (indexError: any) {
        console.warn('⚠️ [ENROLL] Impossible de créer l\'index PIN (non bloquant):', indexError);
        alert(`⚠️ ALERTE - REALTIME DB INDEX\n\nL'index PIN dans Realtime DB a échoué !\n\nChemin: fleet_indices/codes/${accessCode}\n\nErreur: ${indexError.code || 'UNKNOWN'}\nMessage: ${indexError.message}\n\n⚠️ Le fallback de recherche ne fonctionnera PAS.\n\nVérifiez les règles Realtime Database.`);
        showToast('error', `⚠️ Index Realtime DB échoué pour ${accessCode}`, 8000);
      }

      // 8. TRIPLE ÉCRITURE VERS transport/vehicles ET ops/transport/vehicles pour EPscanT
      console.log('🔄 [ENROLL] Triple écriture vers transport/vehicles pour EPscanT...');

      const transportPayload = {
        pin: accessCode,
        licensePlate: vehicleData.license_plate || 'N/A',
        driverName: vehicleData.driver_name || 'N/A',
        isActive: true,
        vehicleId: vehicleId,
        license_plate: vehicleData.license_plate || 'N/A',
        line_id: vehicleData.route || '',
        vehicle_number: vehicleData.vehicle_number || 'N/A',
        createdAt: new Date().toISOString(),
        syncedFrom: 'fleet_vehicles'
      };

      const cleanTransportPayload = JSON.parse(JSON.stringify(transportPayload));

      // 8A. Écriture dans transport/vehicles/
      const transportVehicleRef = ref(db, `transport/vehicles/${vehicleId}`);
      try {
        await set(transportVehicleRef, cleanTransportPayload);
        console.log('✅ [ENROLL] Véhicule synchronisé vers transport/vehicles');
      } catch (transportError: any) {
        console.warn('⚠️ [ENROLL] Échec synchro transport/vehicles (non bloquant):', transportError);
      }

      // 8B. Écriture dans ops/transport/vehicles/ (requis par EPscanT)
      const opsTransportVehicleRef = ref(db, `ops/transport/vehicles/${vehicleId}`);
      try {
        await set(opsTransportVehicleRef, cleanTransportPayload);
        console.log('✅ [ENROLL] Véhicule synchronisé vers ops/transport/vehicles (EPscanT)');
      } catch (opsError: any) {
        console.error('❌ [ENROLL] ÉCHEC CRITIQUE ops/transport/vehicles:', opsError);
        console.error('⚠️ EPscanT ne pourra PAS trouver ce véhicule !');
      }

      // 9. SYNCHRO FIRESTORE ACCESS_CODES pour EPscanT Login
      console.log('🔄 [ENROLL] Synchronisation vers Firestore access_codes...');
      try {
        const accessCodeDoc = doc(firestore, 'access_codes', accessCode);
        const firestoreAccessCodePayload = {
          code: accessCode,
          type: 'vehicle',
          vehicleId: vehicleId,
          vehiclePlate: vehicleData.license_plate || 'N/A',
          isActive: true,
          createdBy: authUID,
          createdAt: new Date().toISOString(),
          staffName: `Véhicule ${vehicleData.vehicle_number || 'N/A'}`,
          usageCount: 0
        };

        await setDoc(accessCodeDoc, firestoreAccessCodePayload);
        console.log('✅ [ENROLL] Code d\'accès synchronisé vers Firestore:', `access_codes/${accessCode}`);
      } catch (firestoreError: any) {
        console.error('❌ [ENROLL] Échec synchro Firestore access_codes:', firestoreError);
        console.error('⚠️ EPscanT ne pourra pas authentifier ce véhicule !');
        alert(`🚨 ALERTE CRITIQUE - FIRESTORE ACCESS_CODES\n\nL'écriture vers Firestore a ÉCHOUÉ !\n\nCode: ${accessCode}\nVehicle ID: ${vehicleId}\n\nErreur: ${firestoreError.code || 'UNKNOWN'}\nMessage: ${firestoreError.message}\n\n⚠️ EPscanT ne pourra PAS authentifier ce véhicule avec le code ${accessCode}.\n\nVérifiez les règles Firestore ou utilisez le bouton "Ré-enrôler" ci-dessous.`);
        showToast('error', `🚨 Échec Firestore ! Code ${accessCode} non enregistré`, 10000);
      }

      console.log('🎉 [ENROLL] SUCCÈS TOTAL - PIN stocké + Synchro EPscanT + Firestore effectuée');
      hideToast(loadingToastId);
      showToast('success', `✅ Véhicule enrôlé! Code: ${accessCode}`, 5000);
      setShowEnrollModal(false);

      // Recharger les données
      loadData();

    } catch (error: any) {
      console.error('❌ [ENROLL] ÉCHEC CRITIQUE:');
      console.error('   💥 Error:', error);
      console.error('   📝 Message:', error?.message);
      console.error('   🔢 Code:', error?.code);
      console.error('   📚 Stack:', error?.stack);

      // DIAGNOSTIC FLASH EN CAS D'ERREUR
      alert(`❌ ÉCHEC ENRÔLEMENT\n\nUID tentant d'écrire: ${authUID}\nEmail: ${authEmail}\nRôle: ${user?.role}\n\nErreur: ${error?.code || 'UNKNOWN'}\nMessage: ${error?.message || 'Erreur inconnue'}\n\nVérifiez la console pour plus de détails.`);

      hideToast(loadingToastId);
      showToast('error', `❌ Échec: ${error?.message || error?.code || 'Erreur inconnue'}`, 8000);
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
              onClick={() => navigate('/admin/ops/transport/migration')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
              title="Migration véhicules"
            >
              <Database size={16} />
              <span className="text-sm font-medium">Migration</span>
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
                  <span className="text-gray-400 text-xs uppercase">Scans SAMA PASS Aujourd'hui</span>
                  <RefreshCw className="text-[#10B981]" size={16} />
                </div>
                <div className="text-3xl font-black text-white">{totalScansToday}</div>
                <div className="text-gray-500 text-xs mt-1">Abonnés DEM-DEM Express transportés</div>
              </div>

              <div className="bg-[#2A2A2A] rounded-xl p-4 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs uppercase">Taux d'Occupation Moyen</span>
                  <Activity className="text-[#10B981]" size={16} />
                </div>
                <div className="text-3xl font-black text-white">{globalOccupancyRate > 0 ? globalOccupancyRate : avgOccupancyRate.toFixed(0)}%</div>
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
                      <div className="text-gray-400 text-xs mb-1 uppercase">Passagers/Heure</div>
                      <div className="text-2xl font-black text-[#10B981]">{line.passengers_this_hour || 0}</div>
                    </div>
                  </div>

                  {line.peak_hours && line.peak_hours.length > 0 && (
                    <div className="mt-4">
                      <div className="text-gray-400 text-xs mb-2 uppercase">Heures de Pointe</div>
                      <div className="flex items-end space-x-2 h-20">
                        {line.peak_hours.map((hour: any) => (
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
                  )}
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
                <p className="text-gray-500 mb-2 font-medium">Aucun véhicule détecté dans fleet_vehicles</p>
                <p className="text-gray-600 text-sm mb-4">La flotte est vide pour le moment</p>
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
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Scans/Jour</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Occupation</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Dernier Scan</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {vehicles.map((vehicle) => (
                    <tr
                      key={vehicle.id}
                      className={`hover:bg-[#2A2A2A] transition-all duration-500 ${
                        newVehicleIds.has(vehicle.id)
                          ? 'bg-[#10B981]/20 animate-pulse border-l-4 border-[#10B981]'
                          : vehicle.status === 'en_maintenance'
                          ? 'opacity-50 bg-red-500/5'
                          : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div>
                            <div className="font-bold text-white">{vehicle.vehicle_number}</div>
                            <div className="text-gray-500 text-xs">{vehicle.license_plate}</div>
                            {vehicle.access_code && (
                              <div className="text-[#10B981] text-xs font-mono font-bold mt-1">
                                Code: {vehicle.access_code}
                              </div>
                            )}
                          </div>
                          {newVehicleIds.has(vehicle.id) && (
                            <span className="px-2 py-1 bg-[#10B981] text-white text-xs font-bold rounded-full animate-bounce">
                              NOUVEAU
                            </span>
                          )}
                        </div>
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
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-bold text-lg">{vehicleScans[vehicle.id] || 0}</span>
                          {(vehicleScans[vehicle.id] || 0) > 0 && (
                            <span className="px-2 py-1 bg-[#10B981]/20 text-[#10B981] rounded-full text-xs font-bold">
                              SAMA PASS
                            </span>
                          )}
                        </div>
                      </td>
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
                      <td className="px-6 py-4">
                        <div className="relative group">
                          <button className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors border border-gray-700 flex items-center space-x-1">
                            <Settings size={14} />
                            <span>Actions</span>
                          </button>
                          <div className="absolute right-0 top-full mt-2 w-56 bg-[#2A2A2A] border border-gray-700 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                            <div className="py-2">
                              <button
                                onClick={() => handleSetMaintenance(vehicle)}
                                className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 transition-colors flex items-center space-x-2 text-sm"
                              >
                                <Settings size={14} className={vehicle.status === 'en_maintenance' ? 'text-green-400' : 'text-red-400'} />
                                <span>{vehicle.status === 'en_maintenance' ? 'Remettre en Service' : 'Mettre en Maintenance'}</span>
                              </button>
                              <button
                                onClick={() => handleChangeDriver(vehicle)}
                                className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 transition-colors flex items-center space-x-2 text-sm"
                              >
                                <UserCheck size={14} className="text-[#10B981]" />
                                <span>Changer Chauffeur</span>
                              </button>
                              <button
                                onClick={() => handleLocateVehicle(vehicle)}
                                className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 transition-colors flex items-center space-x-2 text-sm"
                              >
                                <MapPin size={14} className="text-yellow-400" />
                                <span>Localiser</span>
                              </button>
                              <div className="border-t border-gray-700 my-1"></div>
                              <button
                                onClick={() => handleReEnrollVehicle(vehicle)}
                                className="w-full px-4 py-2 text-left text-blue-400 hover:bg-blue-900/20 transition-colors flex items-center space-x-2 text-sm"
                              >
                                <Database size={14} className="text-blue-400" />
                                <span>🔄 Ré-enrôler Code</span>
                              </button>
                              <button
                                onClick={() => handleDeleteVehicle(vehicle)}
                                className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-900/20 transition-colors flex items-center space-x-2 text-sm"
                              >
                                <Trash2 size={14} className="text-red-400" />
                                <span>Supprimer</span>
                              </button>
                            </div>
                          </div>
                        </div>
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

      {showLocationModal && selectedVehicle && (
        <LocationModal
          vehicle={selectedVehicle}
          location={vehicleLocation}
          onClose={() => {
            setShowLocationModal(false);
            setSelectedVehicle(null);
            setVehicleLocation(null);
          }}
        />
      )}

      {showChangeDriverModal && selectedVehicle && (
        <ChangeDriverModal
          vehicle={selectedVehicle}
          availableDrivers={availableDrivers}
          onClose={() => {
            setShowChangeDriverModal(false);
            setSelectedVehicle(null);
          }}
          onAssign={handleAssignDriver}
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
    console.log('🚀 [ENROLL MODAL] Tentative de soumission...');
    e.preventDefault();

    console.log('📋 [ENROLL MODAL] Données du formulaire:', formData);
    console.log('✔️ [ENROLL MODAL] Validation:', {
      vehicle_number: formData.vehicle_number.trim() !== '',
      license_plate: formData.license_plate.trim() !== '',
      route: formData.route.trim() !== '',
      isValid: isFormValid()
    });

    if (!isFormValid()) {
      console.log('❌ [ENROLL MODAL] Formulaire invalide:', getValidationMessage());
      alert(getValidationMessage());
      return;
    }

    console.log('✅ [ENROLL MODAL] Formulaire valide, soumission à handleEnrollVehicle...');
    setSubmitting(true);

    try {
      await onSubmit(formData);
      console.log('✅ [ENROLL MODAL] Soumission réussie');
    } catch (error) {
      console.error('❌ [ENROLL MODAL] Erreur lors de l\'enrôlement:', error);
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
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={(e) => {
                console.log('🖱️ [ENROLL MODAL] Bouton cliqué!');
                console.log('📊 [ENROLL MODAL] État actuel:', {
                  submitting,
                  isFormValid: isFormValid(),
                  formData
                });
              }}
            >
              {submitting ? '⏳ Enrôlement...' : '✅ Enrôler le Véhicule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface LocationModalProps {
  vehicle: FleetVehicle;
  location: VehicleLocation | null;
  onClose: () => void;
}

const LocationModal: React.FC<LocationModalProps> = ({ vehicle, location, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#1A1A1B] rounded-2xl border border-yellow-500/30 max-w-2xl w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <MapPin className="text-yellow-400" size={24} />
            <h3 className="text-2xl font-black text-white">Localisation • {vehicle.vehicle_number}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {location ? (
          <div className="space-y-4">
            <div className="bg-[#2A2A2A] rounded-xl p-6 border border-gray-700">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-500 text-xs mb-1">Latitude</p>
                  <p className="text-white font-bold text-lg">{location.latitude.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Longitude</p>
                  <p className="text-white font-bold text-lg">{location.longitude.toFixed(6)}</p>
                </div>
              </div>

              {location.speed !== undefined && (
                <div className="mb-4">
                  <p className="text-gray-500 text-xs mb-1">Vitesse</p>
                  <p className="text-[#10B981] font-bold text-lg">{location.speed} km/h</p>
                </div>
              )}

              <div>
                <p className="text-gray-500 text-xs mb-1">Dernière mise à jour</p>
                <p className="text-gray-300 text-sm">{new Date(location.timestamp).toLocaleString('fr-FR')}</p>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 text-center">
              <MapPin className="inline-block text-yellow-400 mb-3" size={48} />
              <p className="text-gray-400 text-sm mb-2">Carte interactive</p>
              <p className="text-gray-500 text-xs">
                Intégration Mapbox/Leaflet à venir
              </p>
              <a
                href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Ouvrir dans Google Maps
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-8 text-center">
            <AlertTriangle className="inline-block text-yellow-400 mb-3" size={48} />
            <p className="text-yellow-400 font-bold mb-2">Dernière position inconnue</p>
            <p className="text-gray-400 text-sm">
              Aucune donnée GPS disponible pour ce véhicule dans /live/positions/{vehicle.id}
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

interface ChangeDriverModalProps {
  vehicle: FleetVehicle;
  availableDrivers: Driver[];
  onClose: () => void;
  onAssign: (driverId: string) => void;
}

const ChangeDriverModal: React.FC<ChangeDriverModalProps> = ({ vehicle, availableDrivers, onClose, onAssign }) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDriverId) {
      onAssign(selectedDriverId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#1A1A1B] rounded-2xl border border-[#10B981]/30 max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <UserCheck className="text-[#10B981]" size={24} />
            <h3 className="text-xl font-black text-white">Changer le Chauffeur</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="bg-[#2A2A2A] rounded-lg p-4 border border-gray-700 mb-6">
          <p className="text-gray-500 text-xs mb-1">Véhicule</p>
          <p className="text-white font-bold">{vehicle.vehicle_number}</p>
          <p className="text-gray-400 text-sm">{vehicle.license_plate}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Chauffeur Disponible</label>
            {availableDrivers.length === 0 ? (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
                <p className="text-yellow-400 text-sm">Aucun chauffeur disponible</p>
              </div>
            ) : (
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:border-[#10B981] focus:outline-none"
                required
              >
                <option value="">Sélectionner un chauffeur</option>
                {availableDrivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} • {driver.phone} • {driver.status === 'available' ? 'Disponible' : 'Hors service'}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={!selectedDriverId}
              className="flex-1 py-3 bg-[#10B981] hover:bg-[#059669] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
            >
              Assigner le Chauffeur
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminOpsTransportPage;
