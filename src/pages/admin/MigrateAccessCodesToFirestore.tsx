import React, { useState } from 'react';
import { Database, ArrowRight, CheckCircle, XCircle, Loader } from 'lucide-react';
import { ref, get } from 'firebase/database';
import { doc, setDoc, writeBatch, collection, getDocs } from 'firebase/firestore';
import { db, firestore } from '../../firebase';
import { useAuth } from '../../context/FirebaseAuthContext';

interface MigrationResult {
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
}

const MigrateAccessCodesToFirestore: React.FC = () => {
  const { user } = useAuth();
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
    console.log(message);
  };

  const migrateAccessCodes = async () => {
    if (!db || !firestore) {
      alert('Firebase non initialisé');
      return;
    }

    if (!user) {
      alert('Vous devez être authentifié');
      return;
    }

    setMigrating(true);
    setResult(null);
    setLogs([]);

    const stats: MigrationResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    try {
      addLog('🚀 Démarrage de la migration...');

      addLog('📥 Récupération des codes depuis Realtime DB (fleet_indices/codes)...');
      const codesRef = ref(db, 'fleet_indices/codes');
      const codesSnapshot = await get(codesRef);

      if (!codesSnapshot.exists()) {
        addLog('⚠️ Aucun code trouvé dans fleet_indices/codes');
      } else {
        const codes = codesSnapshot.val();
        const codeEntries = Object.entries(codes);
        addLog(`✅ ${codeEntries.length} codes trouvés dans Realtime DB`);

        addLog('🔍 Vérification des codes déjà présents dans Firestore...');
        const firestoreCodesRef = collection(firestore, 'access_codes');
        const firestoreSnapshot = await getDocs(firestoreCodesRef);
        const existingCodes = new Set(firestoreSnapshot.docs.map(doc => doc.id));
        addLog(`📊 ${existingCodes.size} codes déjà présents dans Firestore`);

        addLog('🔄 Migration des codes vers Firestore...');
        const batch = writeBatch(firestore);
        let batchCount = 0;

        for (const [code, codeData] of codeEntries) {
          try {
            if (existingCodes.has(code)) {
              addLog(`⏭️ Code ${code} déjà présent, ignoré`);
              stats.skipped++;
              continue;
            }

            const data = codeData as any;
            const firestorePayload = {
              code: code,
              type: 'vehicle',
              vehicleId: data.vehicleId || '',
              vehiclePlate: data.vehiclePlate || 'N/A',
              isActive: data.isActive !== false,
              createdBy: data.createdBy || 'migration',
              createdAt: data.createdAt || new Date().toISOString(),
              staffName: `Véhicule ${data.vehiclePlate || 'N/A'}`,
              usageCount: data.usageCount || 0
            };

            const docRef = doc(firestore, 'access_codes', code);
            batch.set(docRef, firestorePayload);
            batchCount++;

            if (batchCount >= 500) {
              await batch.commit();
              addLog(`💾 Batch de ${batchCount} codes committé`);
              batchCount = 0;
            }

            stats.success++;
            addLog(`✅ Code ${code} migré vers Firestore`);
          } catch (error: any) {
            stats.failed++;
            const errorMsg = `❌ Erreur pour code ${code}: ${error.message}`;
            stats.errors.push(errorMsg);
            addLog(errorMsg);
          }
        }

        if (batchCount > 0) {
          await batch.commit();
          addLog(`💾 Dernier batch de ${batchCount} codes committé`);
        }
      }

      addLog('📥 Récupération des véhicules depuis fleet_vehicles...');
      const vehiclesRef = ref(db, 'fleet_vehicles');
      const vehiclesSnapshot = await get(vehiclesRef);

      if (!vehiclesSnapshot.exists()) {
        addLog('⚠️ Aucun véhicule trouvé dans fleet_vehicles');
      } else {
        const vehicles = vehiclesSnapshot.val();
        const vehicleEntries = Object.entries(vehicles);
        addLog(`✅ ${vehicleEntries.length} véhicules trouvés`);

        for (const [vehicleId, vehicleData] of vehicleEntries) {
          try {
            const data = vehicleData as any;
            const accessCode = data.access_code || data.epscanv_pin;

            if (!accessCode) {
              addLog(`⚠️ Véhicule ${vehicleId} sans code d'accès, ignoré`);
              continue;
            }

            const docRef = doc(firestore, 'access_codes', accessCode);
            const docSnapshot = await getDocs(collection(firestore, 'access_codes'));
            const exists = docSnapshot.docs.some(d => d.id === accessCode);

            if (exists) {
              addLog(`⏭️ Code ${accessCode} déjà migré, ignoré`);
              stats.skipped++;
              continue;
            }

            const firestorePayload = {
              code: accessCode,
              type: 'vehicle',
              vehicleId: vehicleId,
              vehiclePlate: data.license_plate || 'N/A',
              isActive: data.status !== 'retired',
              createdBy: data.created_by || 'migration',
              createdAt: data.created_at || new Date().toISOString(),
              staffName: `Véhicule ${data.vehicle_number || 'N/A'}`,
              usageCount: 0
            };

            await setDoc(docRef, firestorePayload);
            stats.success++;
            addLog(`✅ Code ${accessCode} du véhicule ${vehicleId} migré`);
          } catch (error: any) {
            stats.failed++;
            const errorMsg = `❌ Erreur pour véhicule ${vehicleId}: ${error.message}`;
            stats.errors.push(errorMsg);
            addLog(errorMsg);
          }
        }
      }

      addLog(`🎉 Migration terminée !`);
      addLog(`✅ Succès: ${stats.success}`);
      addLog(`⏭️ Ignorés: ${stats.skipped}`);
      addLog(`❌ Échecs: ${stats.failed}`);

      setResult(stats);
    } catch (error: any) {
      addLog(`❌ ERREUR CRITIQUE: ${error.message}`);
      stats.errors.push(error.message);
      setResult(stats);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-xl p-6 shadow-2xl border border-gray-700">
          <div className="flex items-center space-x-3 mb-6">
            <Database className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Migration Access Codes</h1>
              <p className="text-gray-400 text-sm">Realtime DB → Firestore</p>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3">⚠️ Objectif</h3>
            <p className="text-gray-300 mb-2">
              Cette migration synchronise tous les codes d'accès véhicules depuis:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-1 mb-3">
              <li><code className="bg-gray-800 px-2 py-1 rounded text-blue-400">fleet_indices/codes</code> (Realtime DB)</li>
              <li><code className="bg-gray-800 px-2 py-1 rounded text-blue-400">fleet_vehicles/*/access_code</code> (Realtime DB)</li>
            </ul>
            <p className="text-gray-300 mb-2">Vers:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li><code className="bg-gray-800 px-2 py-1 rounded text-green-400">access_codes/*</code> (Firestore)</li>
            </ul>
          </div>

          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="bg-orange-500/20 text-orange-400 px-4 py-2 rounded-lg font-medium">
                Realtime DB
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400" />
              <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg font-medium">
                Firestore
              </div>
            </div>
          </div>

          {!result && !migrating && (
            <button
              onClick={migrateAccessCodes}
              disabled={migrating}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-4 rounded-lg transition-colors flex items-center justify-center space-x-3"
            >
              <Database className="w-5 h-5" />
              <span>Démarrer la Migration</span>
            </button>
          )}

          {migrating && (
            <div className="flex items-center justify-center space-x-3 py-4">
              <Loader className="w-6 h-6 text-blue-400 animate-spin" />
              <span className="text-white font-medium">Migration en cours...</span>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-400 font-medium">Succès</span>
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">{result.success}</p>
                </div>

                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-yellow-400 font-medium">Ignorés</span>
                    <ArrowRight className="w-5 h-5 text-yellow-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">{result.skipped}</p>
                </div>

                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-red-400 font-medium">Échecs</span>
                    <XCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">{result.failed}</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <h4 className="text-red-400 font-semibold mb-2">Erreurs:</h4>
                  <div className="space-y-1 text-sm text-gray-300 max-h-40 overflow-y-auto">
                    {result.errors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setResult(null);
                  setLogs([]);
                }}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          )}

          {logs.length > 0 && (
            <div className="mt-6">
              <h3 className="text-white font-semibold mb-3">📋 Logs de Migration</h3>
              <div className="bg-black rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-xs">
                {logs.map((log, index) => (
                  <div key={index} className="text-gray-300 mb-1">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MigrateAccessCodesToFirestore;
