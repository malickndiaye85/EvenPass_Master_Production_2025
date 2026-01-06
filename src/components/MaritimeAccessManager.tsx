import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Key, Ship, Eye, EyeOff } from 'lucide-react';
import { firestore } from '../firebase';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

interface MaritimeUser {
  id: string;
  email: string;
  name: string;
  role: 'accueil' | 'commandant' | 'commercial';
  vessel_id: string;
  vessel_name: string;
  created_at?: any;
  is_active: boolean;
}

const VESSELS = [
  { id: 'aguene', name: 'Aguène' },
  { id: 'diarama', name: 'Diarama' },
  { id: 'coumba_castel', name: 'Coumba Castel' }
];

export default function MaritimeAccessManager() {
  const [users, setUsers] = useState<MaritimeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<MaritimeUser | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'accueil' as 'accueil' | 'commandant' | 'commercial',
    vessel_id: '',
    vessel_name: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(firestore, 'maritime_users');
      const snapshot = await getDocs(usersRef);

      const loadedUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MaritimeUser[];

      setUsers(loadedUsers);
    } catch (error) {
      console.error('Error loading maritime users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.vessel_id) {
      alert('⚠️ Veuillez remplir tous les champs');
      return;
    }

    if (formData.password.length < 6) {
      alert('⚠️ Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setProcessing(true);
    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

      const vessel = VESSELS.find(v => v.id === formData.vessel_id);

      const userData = {
        firebase_uid: userCredential.user.uid,
        email: formData.email,
        name: formData.name,
        role: formData.role,
        vessel_id: formData.vessel_id,
        vessel_name: vessel?.name || '',
        is_active: true,
        created_at: Timestamp.now(),
        created_by: auth.currentUser?.uid || 'admin'
      };

      await addDoc(collection(firestore, 'maritime_users'), userData);

      alert(`✅ Utilisateur créé avec succès!\n\nEmail: ${formData.email}\nMot de passe: ${formData.password}\n\nConservez ces informations en lieu sûr.`);

      setShowModal(false);
      setFormData({ name: '', email: '', password: '', role: 'accueil', vessel_id: '', vessel_name: '' });
      await loadUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      if (error.code === 'auth/email-already-in-use') {
        alert('❌ Cet email est déjà utilisé');
      } else {
        alert('❌ Erreur lors de la création: ' + error.message);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`❌ Supprimer l'accès pour ${email}?\n\nCette action est irréversible.`)) {
      return;
    }

    try {
      await deleteDoc(doc(firestore, 'maritime_users', userId));
      alert('✅ Utilisateur supprimé');
      await loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'accueil':
        return <span className="px-3 py-1 bg-cyan-600/20 text-cyan-400 text-xs font-bold rounded-full">👋 Accueil</span>;
      case 'commandant':
        return <span className="px-3 py-1 bg-amber-600/20 text-amber-400 text-xs font-bold rounded-full">⚓ Commandant</span>;
      case 'commercial':
        return <span className="px-3 py-1 bg-emerald-600/20 text-emerald-400 text-xs font-bold rounded-full">📊 Commercial</span>;
      default:
        return <span className="px-3 py-1 bg-gray-600/20 text-gray-400 text-xs font-bold rounded-full">{role}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white">🔑 Gestion des Accès Maritimes</h2>
          <p className="text-[#B5B5B5] mt-1">Créer et gérer les identifiants pour les dashboards maritimes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Nouvel Accès
        </button>
      </div>

      {users.length === 0 ? (
        <div className="bg-[#0F0F0F] border-2 border-[#2A2A2A] rounded-2xl p-12 text-center">
          <Key className="w-16 h-16 text-[#B5B5B5] mx-auto mb-4" />
          <p className="text-[#B5B5B5] text-lg mb-2">Aucun accès créé</p>
          <p className="text-[#B5B5B5] text-sm">Cliquez sur "Nouvel Accès" pour créer un identifiant</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-2xl p-6 hover:border-cyan-600/50 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">{user.name}</h3>
                      <p className="text-sm text-[#B5B5B5]">{user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-[#B5B5B5] mb-1">Rôle</p>
                      {getRoleBadge(user.role)}
                    </div>
                    <div>
                      <p className="text-xs text-[#B5B5B5] mb-1">Navire</p>
                      <div className="flex items-center gap-2">
                        <Ship className="w-4 h-4 text-cyan-400" />
                        <span className="text-white font-bold">{user.vessel_name}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-[#B5B5B5] mb-1">Statut</p>
                      {user.is_active ? (
                        <span className="px-3 py-1 bg-green-600/20 text-green-400 text-xs font-bold rounded-full">✅ Actif</span>
                      ) : (
                        <span className="px-3 py-1 bg-red-600/20 text-red-400 text-xs font-bold rounded-full">❌ Inactif</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(user.id, user.email)}
                  className="ml-4 p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#2A2A2A] max-w-2xl w-full rounded-2xl border border-[#2A2A2A]">
            <div className="p-6 border-b border-[#0F0F0F]">
              <h2 className="text-2xl font-black text-white">🔑 Créer un Nouvel Accès Maritime</h2>
              <p className="text-[#B5B5B5] text-sm mt-1">Générer des identifiants pour un membre du personnel</p>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Moussa Diop"
                  disabled={processing}
                  className="w-full px-4 py-3 bg-[#0F0F0F] border-2 border-[#2A2A2A] text-white rounded-xl focus:border-cyan-600 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  Email (utilisé comme identifiant) <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ex: moussa.diop@evenpass.com"
                  disabled={processing}
                  className="w-full px-4 py-3 bg-[#0F0F0F] border-2 border-[#2A2A2A] text-white rounded-xl focus:border-cyan-600 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 6 caractères"
                    disabled={processing}
                    className="w-full px-4 py-3 bg-[#0F0F0F] border-2 border-[#2A2A2A] text-white rounded-xl focus:border-cyan-600 focus:outline-none disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B5B5B5] hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-[#B5B5B5] mt-2">⚠️ Notez bien ce mot de passe, il ne sera plus visible après création</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Rôle <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    disabled={processing}
                    className="w-full px-4 py-3 bg-[#0F0F0F] border-2 border-[#2A2A2A] text-white rounded-xl focus:border-cyan-600 focus:outline-none disabled:opacity-50"
                  >
                    <option value="accueil">👋 Accueil (Boarding)</option>
                    <option value="commandant">⚓ Commandant</option>
                    <option value="commercial">📊 Commercial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Navire assigné <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.vessel_id}
                    onChange={(e) => {
                      const vessel = VESSELS.find(v => v.id === e.target.value);
                      setFormData({
                        ...formData,
                        vessel_id: e.target.value,
                        vessel_name: vessel?.name || ''
                      });
                    }}
                    disabled={processing}
                    className="w-full px-4 py-3 bg-[#0F0F0F] border-2 border-[#2A2A2A] text-white rounded-xl focus:border-cyan-600 focus:outline-none disabled:opacity-50"
                  >
                    <option value="">Sélectionner un navire</option>
                    {VESSELS.map(vessel => (
                      <option key={vessel.id} value={vessel.id}>{vessel.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-2 border-cyan-600/50 p-4 rounded-xl">
                <p className="text-sm text-cyan-400 font-bold mb-2">ℹ️ Accès selon le rôle :</p>
                <ul className="space-y-1 text-xs text-[#B5B5B5]">
                  <li>• <span className="text-cyan-400">Accueil</span> : Accès au Boarding Dashboard (/pass/boarding)</li>
                  <li>• <span className="text-amber-400">Commandant</span> : Accès au Commandant Dashboard (/pass/commandant)</li>
                  <li>• <span className="text-emerald-400">Commercial</span> : Accès au Commercial Dashboard (/pass/commercial)</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ name: '', email: '', password: '', role: 'accueil', vessel_id: '', vessel_name: '' });
                  }}
                  disabled={processing}
                  className="flex-1 px-6 py-3 bg-[#0F0F0F] hover:bg-[#1F1F1F] text-white font-bold rounded-xl transition-all border border-[#2A2A2A] disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreate}
                  disabled={processing || !formData.name || !formData.email || !formData.password || !formData.vessel_id}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-black rounded-xl transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Création...
                    </>
                  ) : (
                    <>
                      <Key className="w-5 h-5" />
                      Créer l'Accès
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
