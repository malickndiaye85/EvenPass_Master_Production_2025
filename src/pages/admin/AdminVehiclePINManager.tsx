import React, { useState } from 'react';
import { Bus, Plus, Trash2, Download, Upload } from 'lucide-react';

interface LocalVehicle {
  pin: string;
  vehicleId: string;
  vehicle_number: string;
  license_plate: string;
  capacity: number;
  route: string;
  driver_name?: string;
  driver_phone?: string;
}

export default function AdminVehiclePINManager() {
  const [vehicles, setVehicles] = useState<LocalVehicle[]>([
    {
      pin: '435016',
      vehicleId: 'VEHICLE_DK2022S',
      vehicle_number: 'DK-2022-S',
      license_plate: 'DK-2022-S',
      capacity: 32,
      route: 'Ligne 7 - Parcelles Assainies',
      driver_name: 'Boubacar Diallo',
      driver_phone: '+221771234567'
    },
    {
      pin: '411546',
      vehicleId: 'VEHICLE_DK2023T',
      vehicle_number: 'DK-2023-T',
      license_plate: 'DK-2023-T',
      capacity: 35,
      route: 'Ligne 12 - Guédiawaye',
      driver_name: 'Mamadou Sall',
      driver_phone: '+221779876543'
    }
  ]);

  const [newVehicle, setNewVehicle] = useState<LocalVehicle>({
    pin: '',
    vehicleId: '',
    vehicle_number: '',
    license_plate: '',
    capacity: 0,
    route: '',
    driver_name: '',
    driver_phone: ''
  });

  const generatePIN = () => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setNewVehicle({ ...newVehicle, pin });
  };

  const addVehicle = () => {
    if (!newVehicle.pin || !newVehicle.vehicle_number) {
      alert('PIN et numéro de véhicule requis');
      return;
    }

    setVehicles([...vehicles, newVehicle]);
    setNewVehicle({
      pin: '',
      vehicleId: '',
      vehicle_number: '',
      license_plate: '',
      capacity: 0,
      route: '',
      driver_name: '',
      driver_phone: ''
    });
  };

  const removeVehicle = (pin: string) => {
    setVehicles(vehicles.filter(v => v.pin !== pin));
  };

  const exportCode = () => {
    const code = `const LOCAL_VEHICLE_DATABASE: Record<string, {
  vehicleId: string;
  vehicle_number: string;
  license_plate: string;
  capacity: number;
  route: string;
  driver_name?: string;
  driver_phone?: string;
}> = {
${vehicles.map(v => `  '${v.pin}': {
    vehicleId: '${v.vehicleId}',
    vehicle_number: '${v.vehicle_number}',
    license_plate: '${v.license_plate}',
    capacity: ${v.capacity},
    route: '${v.route}',
    driver_name: '${v.driver_name || ''}',
    driver_phone: '${v.driver_phone || ''}'
  }`).join(',\n')}
};`;

    navigator.clipboard.writeText(code);
    alert('Code copié! Collez-le dans src/lib/vehicleAuthService.ts');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bus className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestion des PIN EPscanV
              </h1>
              <p className="text-sm text-gray-600">
                Base de données locale des véhicules autorisés
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              Ajouter un nouveau véhicule
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  PIN (6 chiffres)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newVehicle.pin}
                    onChange={(e) => setNewVehicle({ ...newVehicle, pin: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    maxLength={6}
                  />
                  <button
                    onClick={generatePIN}
                    className="px-3 py-2 bg-gray-200 rounded-lg text-xs"
                  >
                    Générer
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Vehicle ID
                </label>
                <input
                  type="text"
                  value={newVehicle.vehicleId}
                  onChange={(e) => setNewVehicle({ ...newVehicle, vehicleId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="VEHICLE_DK2024X"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Numéro de véhicule
                </label>
                <input
                  type="text"
                  value={newVehicle.vehicle_number}
                  onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="DK-2024-X"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Plaque
                </label>
                <input
                  type="text"
                  value={newVehicle.license_plate}
                  onChange={(e) => setNewVehicle({ ...newVehicle, license_plate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="DK-2024-X"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Capacité
                </label>
                <input
                  type="number"
                  value={newVehicle.capacity}
                  onChange={(e) => setNewVehicle({ ...newVehicle, capacity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Ligne/Trajet
                </label>
                <input
                  type="text"
                  value={newVehicle.route}
                  onChange={(e) => setNewVehicle({ ...newVehicle, route: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ligne 7 - Parcelles"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Chauffeur
                </label>
                <input
                  type="text"
                  value={newVehicle.driver_name}
                  onChange={(e) => setNewVehicle({ ...newVehicle, driver_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Nom du chauffeur"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={newVehicle.driver_phone}
                  onChange={(e) => setNewVehicle({ ...newVehicle, driver_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="+221771234567"
                />
              </div>
            </div>

            <button
              onClick={addVehicle}
              className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Ajouter le véhicule
            </button>
          </div>

          <div className="flex gap-3 mb-4">
            <button
              onClick={exportCode}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-700"
            >
              <Download className="w-5 h-5" />
              Exporter le code TypeScript
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">PIN</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Véhicule</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Plaque</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Capacité</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ligne</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Chauffeur</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.pin} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-blue-600">{vehicle.pin}</span>
                    </td>
                    <td className="px-4 py-3">{vehicle.vehicle_number}</td>
                    <td className="px-4 py-3">{vehicle.license_plate}</td>
                    <td className="px-4 py-3">{vehicle.capacity}</td>
                    <td className="px-4 py-3 text-sm">{vehicle.route}</td>
                    <td className="px-4 py-3 text-sm">{vehicle.driver_name || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => removeVehicle(vehicle.pin)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">
              Instructions de déploiement
            </h4>
            <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
              <li>Cliquez sur "Exporter le code TypeScript"</li>
              <li>Ouvrez le fichier <code className="bg-yellow-100 px-1 rounded">src/lib/vehicleAuthService.ts</code></li>
              <li>Remplacez l'objet <code className="bg-yellow-100 px-1 rounded">LOCAL_VEHICLE_DATABASE</code></li>
              <li>Sauvegardez et redéployez l'application</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
