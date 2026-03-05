import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, CheckCircle, AlertTriangle, XCircle, Database } from 'lucide-react';
import { migrateVehiclesToTransport, displayMigrationReport, MigrationReport } from '../../lib/migrateVehiclesToTransport';
import { ref, set } from 'firebase/database';
import { db } from '../../firebase';

const MigrationVehiclesPage: React.FC = () => {
  const navigate = useNavigate();
  const [migrating, setMigrating] = useState(false);
  const [report, setReport] = useState<MigrationReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testVehicleCreated, setTestVehicleCreated] = useState(false);
  const [testPIN, setTestPIN] = useState<string>('');

  const handleMigration = async () => {
    setMigrating(true);
    setError(null);
    setReport(null);

    try {
      const migrationReport = await migrateVehiclesToTransport();
      setReport(migrationReport);
      console.log(displayMigrationReport(migrationReport));
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue lors de la migration');
      console.error('Erreur migration:', err);
    } finally {
      setMigrating(false);
    }
  };

  const handleCreateTestVehicle = async () => {
    try {
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      const vehicleId = `test_km_${Date.now()}`;

      // Créer dans fleet_vehicles
      const fleetRef = ref(db, `fleet_vehicles/${vehicleId}`);
      const fleetPayload = {
        vehicle_number: 'KM-Express-01',
        type: 'ndiaga_ndiaye',
        capacity: 25,
        route: 'Keur Massar ↔ Dakar Centre',
        license_plate: 'DK-KM-2026',
        driver_name: 'Modou Diop',
        driver_phone: '77 123 45 67',
        insurance_expiry: '2026-12-31',
        technical_control_expiry: '2026-12-31',
        status: 'en_service',
        current_trips_today: 0,
        total_revenue_today: 0,
        average_occupancy_rate: 0,
        access_code: pin,
        epscanv_pin: pin,
        created_at: new Date().toISOString(),
        created_by: 'migration_script',
        test_vehicle: true
      };

      await set(fleetRef, fleetPayload);

      // Créer dans transport/vehicles
      const transportRef = ref(db, `transport/vehicles/${vehicleId}`);
      const transportPayload = {
        pin: pin,
        licensePlate: 'DK-KM-2026',
        driverName: 'Modou Diop',
        isActive: true,
        vehicleId: vehicleId,
        createdAt: new Date().toISOString(),
        syncedFrom: 'migration_script',
        testVehicle: true
      };

      await set(transportRef, transportPayload);

      setTestPIN(pin);
      setTestVehicleCreated(true);
      alert(`✅ Véhicule test créé!\n\nNavette: KM-Express-01\nRoute: Keur Massar ↔ Dakar Centre\nPIN: ${pin}\n\nUtilisez ce PIN pour vous connecter sur EPscanT`);
    } catch (err: any) {
      alert(`❌ Erreur création véhicule test: ${err.message}`);
      console.error('Erreur création test:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#1A1A1B] to-[#0A0A0B] p-6">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/admin/ops/transport')}
          className="mb-6 flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Retour au Command Center</span>
        </button>

        <div className="bg-[#1E1E1E] rounded-2xl border border-gray-800 p-8 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <Database className="text-[#10B981]" size={32} />
            <div>
              <h1 className="text-3xl font-black text-white uppercase">Migration DEM-DEM Express</h1>
              <p className="text-gray-400 text-sm mt-1">Synchronisation fleet_vehicles → transport/vehicles</p>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-6">
            <h3 className="text-blue-400 font-bold text-lg mb-3">📘 Informations</h3>
            <ul className="text-gray-300 text-sm space-y-2">
              <li>• Cette migration copie tous les véhicules de <code className="text-[#10B981]">fleet_vehicles</code> vers <code className="text-[#10B981]">transport/vehicles</code></li>
              <li>• Seuls les véhicules avec un PIN valide (6 chiffres) et actifs seront migrés</li>
              <li>• Les PINs existants seront préservés</li>
              <li>• Les chauffeurs pourront se connecter immédiatement sur EPscanT après la migration</li>
              <li>• Cette opération est <strong>NON destructive</strong> : les données dans fleet_vehicles restent intactes</li>
            </ul>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleMigration}
              disabled={migrating}
              className="flex-1 py-4 bg-[#10B981] hover:bg-[#059669] disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw size={24} className={migrating ? 'animate-spin' : ''} />
              <span>{migrating ? 'Migration en cours...' : 'Lancer la Migration'}</span>
            </button>

            <button
              onClick={handleCreateTestVehicle}
              disabled={migrating}
              className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-colors"
            >
              Créer Véhicule Test Keur Massar
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <XCircle className="text-red-400" size={24} />
              <h3 className="text-red-400 font-bold text-lg">Erreur</h3>
            </div>
            <p className="text-gray-300">{error}</p>
          </div>
        )}

        {testVehicleCreated && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="text-green-400" size={24} />
              <h3 className="text-green-400 font-bold text-lg">Véhicule Test Créé!</h3>
            </div>
            <div className="bg-[#2A2A2A] rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-xs mb-1">Navette</p>
                  <p className="text-white font-bold">KM-Express-01</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Immatriculation</p>
                  <p className="text-white font-bold">DK-KM-2026</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Route</p>
                  <p className="text-white font-bold">Keur Massar ↔ Dakar Centre</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Chauffeur</p>
                  <p className="text-white font-bold">Modou Diop</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-700">
                <p className="text-gray-500 text-xs mb-1">PIN de Connexion EPscanT</p>
                <p className="text-[#10B981] font-black text-3xl font-mono">{testPIN}</p>
                <p className="text-gray-400 text-sm mt-2">
                  ➜ Utilisez ce PIN pour vous connecter sur <strong>EPscanT Transport</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {report && (
          <div className="bg-[#1E1E1E] rounded-2xl border border-gray-800 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <CheckCircle className="text-[#10B981]" size={32} />
              <h2 className="text-2xl font-black text-white uppercase">Rapport de Migration</h2>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-[#2A2A2A] rounded-xl p-4 border border-gray-800">
                <div className="text-gray-400 text-xs mb-1 uppercase">Total Analysés</div>
                <div className="text-3xl font-black text-white">{report.totalVehicles}</div>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <div className="text-green-400 text-xs mb-1 uppercase">Migrés</div>
                <div className="text-3xl font-black text-green-400">{report.migrated}</div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <div className="text-yellow-400 text-xs mb-1 uppercase">Ignorés</div>
                <div className="text-3xl font-black text-yellow-400">{report.skipped}</div>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <div className="text-red-400 text-xs mb-1 uppercase">Échecs</div>
                <div className="text-3xl font-black text-red-400">{report.failed}</div>
              </div>
            </div>

            {report.details.migrated.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle className="text-green-400" size={20} />
                  <h3 className="text-green-400 font-bold text-lg">Véhicules Migrés avec Succès</h3>
                </div>
                <div className="bg-[#2A2A2A] rounded-xl p-4 max-h-64 overflow-y-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-700">
                      <tr>
                        <th className="text-left text-gray-400 text-xs uppercase py-2">#</th>
                        <th className="text-left text-gray-400 text-xs uppercase py-2">Immatriculation</th>
                        <th className="text-left text-gray-400 text-xs uppercase py-2">PIN</th>
                        <th className="text-left text-gray-400 text-xs uppercase py-2">ID Véhicule</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {report.details.migrated.map((v, i) => (
                        <tr key={v.id}>
                          <td className="py-2 text-gray-400">{i + 1}</td>
                          <td className="py-2 text-white font-medium">{v.licensePlate}</td>
                          <td className="py-2 text-[#10B981] font-mono font-bold">{v.pin}</td>
                          <td className="py-2 text-gray-500 text-sm">{v.id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {report.details.skipped.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <AlertTriangle className="text-yellow-400" size={20} />
                  <h3 className="text-yellow-400 font-bold text-lg">Véhicules Ignorés</h3>
                </div>
                <div className="bg-[#2A2A2A] rounded-xl p-4 max-h-64 overflow-y-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-700">
                      <tr>
                        <th className="text-left text-gray-400 text-xs uppercase py-2">#</th>
                        <th className="text-left text-gray-400 text-xs uppercase py-2">ID Véhicule</th>
                        <th className="text-left text-gray-400 text-xs uppercase py-2">Raison</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {report.details.skipped.map((v, i) => (
                        <tr key={v.id}>
                          <td className="py-2 text-gray-400">{i + 1}</td>
                          <td className="py-2 text-gray-500 text-sm">{v.id}</td>
                          <td className="py-2 text-yellow-400 text-sm">{v.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {report.details.failed.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <XCircle className="text-red-400" size={20} />
                  <h3 className="text-red-400 font-bold text-lg">Échecs</h3>
                </div>
                <div className="bg-[#2A2A2A] rounded-xl p-4 max-h-64 overflow-y-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-700">
                      <tr>
                        <th className="text-left text-gray-400 text-xs uppercase py-2">#</th>
                        <th className="text-left text-gray-400 text-xs uppercase py-2">ID Véhicule</th>
                        <th className="text-left text-gray-400 text-xs uppercase py-2">Erreur</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {report.details.failed.map((v, i) => (
                        <tr key={v.id}>
                          <td className="py-2 text-gray-400">{i + 1}</td>
                          <td className="py-2 text-gray-500 text-sm">{v.id}</td>
                          <td className="py-2 text-red-400 text-sm">{v.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MigrationVehiclesPage;
