import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Edit2, Shield, Eye, EyeOff } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set, get, remove, onValue } from 'firebase/database';
import { auth, db } from '../firebase';

type StaffRole = 'Sub_Admin' | 'Ops_Manager' | 'ops_transport' | 'ops_event' | 'admin_finance_voyage' | 'admin_finance_event' | 'admin_maritime' | 'sub_admin' | 'ops_manager';

interface StaffMember {
  id: string;
  email: string;
  role: StaffRole;
  silo: 'Voyage' | 'Événement' | 'voyage' | 'événement';
  silo_id?: string;
  created_at: string;
  created_by: string;
}

interface Props {
  isDark: boolean;
  superAdminId: string;
}

const StaffManagementTab: React.FC<Props> = ({ isDark, superAdminId }) => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'ops_event' as StaffRole,
    silo: 'Événement' as 'Voyage' | 'Événement'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!db) return;

    setLoading(true);
    const staffRef = ref(db, 'staff');

    const unsubscribe = onValue(staffRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const members: StaffMember[] = Object.entries(data).map(([id, value]: [string, any]) => ({
            id,
            email: value.email,
            role: value.role,
            silo: value.silo,
            silo_id: value.silo_id || value.silo?.toLowerCase(),
            created_at: value.created_at,
            created_by: value.created_by
          }));
          setStaffMembers(members);
        } else {
          setStaffMembers([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du staff:', error);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Erreur onValue staff:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setCreating(true);

    try {
      if (!auth || !db) {
        throw new Error('Firebase non configuré');
      }

      if (formData.password.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères');
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const newStaffId = userCredential.user.uid;

      const silo_id = formData.silo.toLowerCase();

      const staffData: StaffMember = {
        id: newStaffId,
        email: formData.email,
        role: formData.role,
        silo: formData.silo,
        silo_id: silo_id,
        created_at: new Date().toISOString(),
        created_by: superAdminId
      };

      await set(ref(db, `staff/${newStaffId}`), staffData);

      await set(ref(db, `users/${newStaffId}`), {
        email: formData.email,
        role: formData.role,
        silo: silo_id,
        silo_id: silo_id,
        created_at: new Date().toISOString()
      });

      setSuccess(`Compte créé avec succès pour ${formData.email}`);
      setFormData({
        email: '',
        password: '',
        role: 'ops_event',
        silo: 'Événement'
      });
      setShowCreateModal(false);

      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      let errorMessage = 'Erreur lors de la création du compte';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Cet email est déjà utilisé';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email invalide';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Mot de passe trop faible';
      }

      setError(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre du staff ?')) {
      return;
    }

    try {
      if (!db) return;

      await remove(ref(db, `staff/${staffId}`));
      await remove(ref(db, `users/${staffId}`));

      setSuccess('Membre supprimé avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setError('Erreur lors de la suppression');
    }
  };

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; color: string }> = {
      'Sub_Admin': { label: 'Sous-Admin', color: 'purple' },
      'sub_admin': { label: 'Sous-Admin', color: 'purple' },
      'Ops_Manager': { label: 'Ops Manager', color: 'blue' },
      'ops_manager': { label: 'Ops Manager', color: 'blue' },
      'ops_transport': { label: 'Ops Transport', color: 'cyan' },
      'ops_event': { label: 'Ops Event', color: 'orange' },
      'admin_finance_voyage': { label: 'Admin Finance Voyage', color: 'green' },
      'admin_finance_event': { label: 'Admin Finance Event', color: 'pink' },
      'admin_maritime': { label: 'Admin Maritime', color: 'indigo' }
    };

    const roleInfo = roleMap[role] || { label: role, color: 'gray' };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold bg-${roleInfo.color}-500/20 text-${roleInfo.color}-400`}>
        {roleInfo.label}
      </span>
    );
  };

  const getSiloBadge = (silo: string) => {
    if (silo === 'Voyage') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-400">
          🚢 Voyage
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400">
        🎫 Événement
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-[#10B981]" />
          <div>
            <h2 className="text-2xl font-black text-white">
              Gestion du Staff
            </h2>
            <p className="text-sm text-white/60">
              Créez et gérez les comptes Sous-Admins et Ops Managers
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setShowCreateModal(true);
            setError('');
            setSuccess('');
          }}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-[#10B981] text-black hover:bg-[#059669] transition-all"
        >
          <Plus className="w-5 h-5" />
          Nouveau compte
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400">
          {success}
        </div>
      )}

      <div className="rounded-2xl p-6 bg-white/5 backdrop-blur-sm border border-white/10">
        {staffMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">Aucun membre du staff créé</p>
            <p className="text-sm text-white/40 mt-2">
              Cliquez sur "Nouveau compte" pour créer un compte
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 font-bold text-white/80">Email</th>
                  <th className="text-left py-3 px-4 font-bold text-white/80">Rôle</th>
                  <th className="text-left py-3 px-4 font-bold text-white/80">Silo</th>
                  <th className="text-left py-3 px-4 font-bold text-white/80">Silo ID</th>
                  <th className="text-left py-3 px-4 font-bold text-white/80">Créé le</th>
                  <th className="text-right py-3 px-4 font-bold text-white/80">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffMembers.map((member) => (
                  <tr key={member.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{member.email}</td>
                    <td className="py-3 px-4">{getRoleBadge(member.role)}</td>
                    <td className="py-3 px-4">{getSiloBadge(member.silo)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded bg-white/10 text-white/60 text-xs font-mono">
                        {member.silo_id || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/60 text-sm">
                      {new Date(member.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteStaff(member.id)}
                        className="px-3 py-2 rounded-lg font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl p-8 bg-[#0A0A0B] border border-white/10 shadow-2xl">
            <h3 className="text-2xl font-black mb-6 text-white">
              Créer un nouveau compte
            </h3>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-white/80">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3 rounded-xl border bg-white/5 border-white/10 text-white focus:outline-none focus:border-[#10B981]/50 focus:bg-white/10 transition-all"
                  placeholder="exemple@demdem.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-white/80">
                  Mot de passe *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-3 rounded-xl border bg-white/5 border-white/10 text-white focus:outline-none focus:border-[#10B981]/50 focus:bg-white/10 transition-all pr-12"
                    placeholder="Minimum 6 caractères"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-white/80">
                  Silo *
                </label>
                <select
                  value={formData.silo}
                  onChange={(e) => setFormData({ ...formData, silo: e.target.value as 'Voyage' | 'Événement' })}
                  className="w-full p-3 rounded-xl border bg-white/5 border-white/10 text-white focus:outline-none focus:border-[#10B981]/50 focus:bg-white/10 transition-all"
                  required
                >
                  <option value="Événement">🎫 Événement (EVEN)</option>
                  <option value="Voyage">🚢 Voyage (DEM-DEM)</option>
                </select>
                <p className="text-xs text-white/40 mt-1">
                  Le silo détermine l'accès aux données (séparation stricte)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-white/80">
                  Rôle *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as StaffRole })}
                  className="w-full p-3 rounded-xl border bg-white/5 border-white/10 text-white focus:outline-none focus:border-[#10B981]/50 focus:bg-white/10 transition-all"
                  required
                >
                  <optgroup label="Rôles Événement">
                    <option value="ops_event">🎫 Ops Event (gestion événements)</option>
                    <option value="admin_finance_event">💰 Admin Finance Event</option>
                  </optgroup>
                  <optgroup label="Rôles Voyage">
                    <option value="ops_transport">🚗 Ops Transport (chauffeurs, navettes)</option>
                    <option value="admin_maritime">🚢 Admin Maritime (LMDG, COSAMA)</option>
                    <option value="admin_finance_voyage">💳 Admin Finance Voyage</option>
                  </optgroup>
                  <optgroup label="Rôles Transversaux">
                    <option value="sub_admin">👑 Sous-Admin (accès étendu)</option>
                    <option value="ops_manager">⚙️ Ops Manager (accès limité)</option>
                  </optgroup>
                </select>
                <p className="text-xs text-white/40 mt-1">
                  Le rôle détermine les permissions et l'accès aux fonctionnalités
                </p>
              </div>

              <div className="rounded-xl p-4 bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-yellow-400">
                  <strong>Important :</strong> Ces comptes ne peuvent pas s'auto-créer. Seul le Super Admin peut les créer.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setError('');
                  }}
                  className="flex-1 py-3 rounded-xl font-bold bg-white/10 text-white hover:bg-white/20 transition-all"
                  disabled={creating}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-bold bg-[#10B981] text-black hover:bg-[#059669] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={creating}
                >
                  {creating ? 'Création...' : 'Créer le compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagementTab;
