/**
 * Script de Migration DEM-DEM Express
 *
 * Objectif : Migrer tous les véhicules de fleet_vehicles vers transport/vehicles
 * pour permettre la connexion immédiate des chauffeurs sur EPscanT via PIN
 *
 * Date : 2026-03-05
 */

import { ref, get, set } from 'firebase/database';
import { db } from '../firebase';

export interface MigrationReport {
  totalVehicles: number;
  migrated: number;
  skipped: number;
  failed: number;
  details: {
    migrated: Array<{ id: string; licensePlate: string; pin: string }>;
    skipped: Array<{ id: string; reason: string }>;
    failed: Array<{ id: string; error: string }>;
  };
}

/**
 * Migre tous les véhicules de fleet_vehicles vers transport/vehicles
 */
export async function migrateVehiclesToTransport(): Promise<MigrationReport> {
  console.log('🚀 [MIGRATION] Démarrage migration fleet_vehicles → transport/vehicles');

  const report: MigrationReport = {
    totalVehicles: 0,
    migrated: 0,
    skipped: 0,
    failed: 0,
    details: {
      migrated: [],
      skipped: [],
      failed: []
    }
  };

  try {
    // 1. Lire tous les véhicules de fleet_vehicles
    const fleetRef = ref(db, 'fleet_vehicles');
    const snapshot = await get(fleetRef);

    if (!snapshot.exists()) {
      console.log('⚠️ [MIGRATION] Aucun véhicule trouvé dans fleet_vehicles');
      return report;
    }

    const fleetData = snapshot.val();
    const vehicleIds = Object.keys(fleetData);
    report.totalVehicles = vehicleIds.length;

    console.log(`📊 [MIGRATION] ${vehicleIds.length} véhicules détectés dans fleet_vehicles`);

    // 2. Pour chaque véhicule
    for (const vehicleId of vehicleIds) {
      const vehicle = fleetData[vehicleId];

      // Vérification : véhicule a un PIN valide
      if (!vehicle.access_code || vehicle.access_code.length !== 6) {
        report.skipped++;
        report.details.skipped.push({
          id: vehicleId,
          reason: 'Pas de PIN valide (access_code manquant ou invalide)'
        });
        console.log(`⏭️ [MIGRATION] Skip ${vehicleId}: Pas de PIN valide`);
        continue;
      }

      // Vérification : véhicule n'est pas inactif
      if (vehicle.status === 'inactif') {
        report.skipped++;
        report.details.skipped.push({
          id: vehicleId,
          reason: 'Véhicule inactif'
        });
        console.log(`⏭️ [MIGRATION] Skip ${vehicleId}: Véhicule inactif`);
        continue;
      }

      // 3. Créer payload pour transport/vehicles
      const transportPayload = {
        pin: vehicle.access_code,
        licensePlate: vehicle.license_plate || 'N/A',
        driverName: vehicle.driver_name || 'N/A',
        isActive: vehicle.status !== 'en_maintenance',
        vehicleId: vehicleId,
        createdAt: vehicle.created_at || new Date().toISOString(),
        migratedAt: new Date().toISOString(),
        syncedFrom: 'fleet_vehicles'
      };

      try {
        // 4. Écrire dans transport/vehicles
        const transportRef = ref(db, `transport/vehicles/${vehicleId}`);
        await set(transportRef, transportPayload);

        report.migrated++;
        report.details.migrated.push({
          id: vehicleId,
          licensePlate: transportPayload.licensePlate,
          pin: transportPayload.pin
        });

        console.log(`✅ [MIGRATION] Migré ${vehicleId} (${transportPayload.licensePlate}) - PIN: ${transportPayload.pin}`);

      } catch (error: any) {
        report.failed++;
        report.details.failed.push({
          id: vehicleId,
          error: error.message || 'Erreur inconnue'
        });
        console.error(`❌ [MIGRATION] Échec ${vehicleId}:`, error);
      }
    }

    console.log('🎉 [MIGRATION] Migration terminée!');
    console.log(`📊 [MIGRATION] Rapport: ${report.migrated} migrés, ${report.skipped} ignorés, ${report.failed} échecs`);

    return report;

  } catch (error: any) {
    console.error('❌ [MIGRATION] Erreur critique:', error);
    throw error;
  }
}

/**
 * Affiche un rapport de migration formaté
 */
export function displayMigrationReport(report: MigrationReport): string {
  let output = '\n========================================\n';
  output += '📋 RAPPORT DE MIGRATION DEM-DEM EXPRESS\n';
  output += '========================================\n\n';

  output += `📊 Total véhicules analysés : ${report.totalVehicles}\n`;
  output += `✅ Véhicules migrés         : ${report.migrated}\n`;
  output += `⏭️  Véhicules ignorés        : ${report.skipped}\n`;
  output += `❌ Échecs                   : ${report.failed}\n\n`;

  if (report.details.migrated.length > 0) {
    output += '✅ VÉHICULES MIGRÉS AVEC SUCCÈS:\n';
    output += '────────────────────────────────\n';
    report.details.migrated.forEach((v, i) => {
      output += `${i + 1}. ${v.licensePlate} - PIN: ${v.pin} (ID: ${v.id})\n`;
    });
    output += '\n';
  }

  if (report.details.skipped.length > 0) {
    output += '⏭️  VÉHICULES IGNORÉS:\n';
    output += '────────────────────────────────\n';
    report.details.skipped.forEach((v, i) => {
      output += `${i + 1}. ${v.id} - Raison: ${v.reason}\n`;
    });
    output += '\n';
  }

  if (report.details.failed.length > 0) {
    output += '❌ ÉCHECS:\n';
    output += '────────────────────────────────\n';
    report.details.failed.forEach((v, i) => {
      output += `${i + 1}. ${v.id} - Erreur: ${v.error}\n`;
    });
    output += '\n';
  }

  output += '========================================\n';

  return output;
}
