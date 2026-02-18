import React, { useState, useEffect } from 'react';
import { Users, UserPlus, UserX, Shield, Activity, Key, QrCode, Eye } from 'lucide-react';
import { useAuth } from '../../context/FirebaseAuthContext';
import { ref, onValue, push, set, remove, get } from 'firebase/database';
import { db } from '../../firebase';
import { securityLogger } from '../../lib/securityLogger';

interface Controller {
  id: string;
  email: string;
  full_name: string;
  access_key?: string;
  is_active: boolean;
  created_at: string;
  assigned_events?: string[];
}

interface ScanActivity {
  id: string;
  controller_email: string;
  event_id: string;
  event_title: string;
  tickets_scanned: number;
  last_scan: string;
}

const AdminOpsEventPage: React.FC = () => {
  const { user } = useAuth();
  const [controllers, setControllers] = useState<Controller[]>([]);
  const [scanActivities, setScanActivities] = useState<ScanActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: ''
  });

  useEffect(() => {
    if (!db) return;

    const controllersRef = ref(db, 'users');
    const unsubscribe = onValue(controllersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const controllersArray = Object.keys(data)
          .filter(key => data[key].role === 'controller')
          .map(key => ({
            id: key,
            ...data[key]
          }));
        setControllers(controllersArray);
      } else {
        setControllers([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const generateAccessKey = () => {
    return `EPSCAN-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  };

  const handleCreateController = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!db || !user) return;

    try {
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);

      let existingUserId: string | null = null;

      if (snapshot.exists()) {
        const users = snapshot.val();
        for (const userId in users) {
          if (users[userId].email === formData.email) {
            existingUserId = userId;
            break;
          }
        }
      }

      const accessKey = generateAccessKey();
      const controllerId = existingUserId || push(ref(db, 'users')).key!;

      const controllerData = {
        email: formData.email,
        full_name: formData.full_name,
        role: 'controller',
        access_key: accessKey,
        is_active: true,
        created_at: new Date().toISOString(),
        created_by: user.email
      };

      await set(ref(db, `users/${controllerId}`), controllerData);

      if (user.email && user.id && user.role) {
        await securityLogger.log({
          event_type: 'staff_created',
          user_email: user.email,
          user_id: user.id,
          user_role: user.role,
          action: `Controller created: ${formData.email}`,
          success: true,
          metadata: { controller_id: controllerId, access_key: accessKey }
        });
      }

      alert(`Contrôleur créé avec succès!\n\nClé d'accès EPscan:\n${accessKey}\n\nCommuniquez cette clé au contrôleur de manière sécurisée.`);

      setFormData({ email: '', full_name: '', password: '' });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating controller:', error);
      alert('Erreur lors de la création du contrôleur');
    }
  };

  const handleRevokeAccess = async (controllerId: string, email: string) => {
    if (!confirm(`Voulez-vous révoquer l'accès de ${email}?`)) return;

    if (!db || !user) return;

    try {
      await set(ref(db, `users/${controllerId}/is_active`), false);
      await set(ref(db, `users/${controllerId}/revoked_at`), new Date().toISOString());
      await set(ref(db, `users/${controllerId}/revoked_by`), user.email);

      if (user.email && user.id && user.role) {
        await securityLogger.log({
          event_type: 'access_denied',
          user_email: user.email,
          user_id: user.id,
          user_role: user.role,
          action: `Controller access revoked: ${email}`,
          success: true,
          target: email
        });
      }

      alert('Accès révoqué avec succès');
    } catch (error) {
      console.error('Error revoking access:', error);
      alert('Erreur lors de la révocation');
    }
  };

  const handleDeleteController = async (controllerId: string, email: string) => {
    if (!confirm(`Voulez-vous supprimer définitivement ${email}?`)) return;

    if (!db || !user) return;

    try {
      await remove(ref(db, `users/${controllerId}`));

      if (user.email && user.id && user.role) {
        await securityLogger.log({
          event_type: 'staff_deleted',
          user_email: user.email,
          user_id: user.id,
          user_role: user.role,
          action: `Controller deleted: ${email}`,
          success: true,
          target: email
        });
      }

      alert('Contrôleur supprimé avec succès');
    } catch (error) {
      console.error('Error deleting controller:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const activeControllers = controllers.filter(c => c.is_active).length;
  const inactiveControllers = controllers.filter(c => !c.is_active).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6366F1] via-[#8B5CF6] to-[#A855F7] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Ops Événements</h1>
          <p className="text-purple-100">Gestion des contrôleurs et monitoring des scans</p>
          <div className="mt-2 inline-block bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
            <span className="text-purple-100 text-sm">Silo: <span className="font-bold text-white">ÉVÉNEMENT</span></span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <Users className="text-green-300" size={24} />
              <span className="text-2xl font-bold text-white">{activeControllers}</span>
            </div>
            <p className="text-purple-100 text-sm">Contrôleurs actifs</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <UserX className="text-red-300" size={24} />
              <span className="text-2xl font-bold text-white">{inactiveControllers}</span>
            </div>
            <p className="text-purple-100 text-sm">Accès révoqués</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <Activity className="text-blue-300" size={24} />
              <span className="text-2xl font-bold text-white">{controllers.length}</span>
            </div>
            <p className="text-purple-100 text-sm">Total contrôleurs</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden mb-8">
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Shield className="mr-3" size={28} />
                Gestion des Contrôleurs
              </h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center transition-all"
              >
                <UserPlus className="mr-2" size={20} />
                Créer un contrôleur
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            ) : controllers.length === 0 ? (
              <div className="p-12 text-center text-purple-200">
                Aucun contrôleur créé
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-100">Contrôleur</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-100">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-100">Clé d'accès</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-100">Statut</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-100">Créé le</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-100">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {controllers.map((controller) => (
                    <tr key={controller.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{controller.full_name}</div>
                      </td>
                      <td className="px-6 py-4 text-purple-200">{controller.email}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <code className="bg-white/10 px-3 py-1 rounded text-green-300 text-xs font-mono">
                            {controller.access_key || 'Non définie'}
                          </code>
                          {controller.access_key && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(controller.access_key!);
                                alert('Clé copiée!');
                              }}
                              className="p-1 bg-white/10 hover:bg-white/20 rounded transition-colors"
                              title="Copier la clé"
                            >
                              <Key size={14} className="text-white" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {controller.is_active ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                            Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                            Révoqué
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-purple-200 text-sm">
                        {new Date(controller.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {controller.is_active ? (
                            <button
                              onClick={() => handleRevokeAccess(controller.id, controller.email)}
                              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                              title="Révoquer l'accès"
                            >
                              <UserX size={18} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeleteController(controller.id, controller.email)}
                              className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <UserX size={18} />
                            </button>
                          )}
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

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1A1B] rounded-2xl p-8 max-w-md w-full border border-[#2A2A2B] shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Créer un contrôleur</h3>
            <form onSubmit={handleCreateController} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nom complet</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2A2A2B] rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2A2A2B] rounded-xl text-white"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold transition-all"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOpsEventPage;
