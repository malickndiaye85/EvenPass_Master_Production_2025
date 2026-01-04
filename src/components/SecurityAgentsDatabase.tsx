import { useState, useEffect } from 'react';
import { Plus, Trash2, Users, Shield, Search, Edit2, Check, X } from 'lucide-react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { firestore } from '../firebase';

interface Agent {
  id: string;
  name: string;
  phone: string;
  email: string;
  mobile_pda?: string;
  cni?: string;
  address?: string;
  is_active: boolean;
  is_enrolled: boolean;
  created_at: any;
}

interface SecurityAgentsDatabaseProps {
  isDark: boolean;
  onClose: () => void;
}

export default function SecurityAgentsDatabase({ isDark, onClose }: SecurityAgentsDatabaseProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    mobile_pda: '',
    cni: '',
    address: '',
  });

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const agentsRef = collection(firestore, 'security_agents');
      const agentsSnapshot = await getDocs(agentsRef);
      const loadedAgents = agentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Agent[];
      setAgents(loadedAgents.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await addDoc(collection(firestore, 'security_agents'), {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        mobile_pda: formData.mobile_pda || '',
        cni: formData.cni || '',
        address: formData.address || '',
        is_active: true,
        is_enrolled: false,
        created_at: Timestamp.now(),
      });
      setFormData({ name: '', phone: '', email: '', mobile_pda: '', cni: '', address: '' });
      setShowAddForm(false);
      await loadAgents();
      alert('Agent ajouté avec succès!');
    } catch (error) {
      console.error('Error adding agent:', error);
      alert('Erreur lors de l\'ajout de l\'agent');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateAgent = async (agentId: string) => {
    setProcessing(true);
    try {
      const agentRef = doc(firestore, 'security_agents', agentId);
      await updateDoc(agentRef, {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        mobile_pda: formData.mobile_pda || '',
        cni: formData.cni || '',
        address: formData.address || '',
      });
      setEditingId(null);
      setFormData({ name: '', phone: '', email: '', mobile_pda: '', cni: '', address: '' });
      await loadAgents();
      alert('Agent modifié avec succès!');
    } catch (error) {
      console.error('Error updating agent:', error);
      alert('Erreur lors de la modification');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteAgent = async (agentId: string, agentName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${agentName} ?`)) return;

    setProcessing(true);
    try {
      await deleteDoc(doc(firestore, 'security_agents', agentId));
      await loadAgents();
      alert('Agent supprimé avec succès!');
    } catch (error) {
      console.error('Error deleting agent:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleActive = async (agentId: string, currentStatus: boolean) => {
    setProcessing(true);
    try {
      const agentRef = doc(firestore, 'security_agents', agentId);
      await updateDoc(agentRef, { is_active: !currentStatus });
      await loadAgents();
    } catch (error) {
      console.error('Error toggling agent status:', error);
      alert('Erreur lors de la modification du statut');
    } finally {
      setProcessing(false);
    }
  };

  const handleEnroll = async (agentId: string, agentName: string) => {
    if (!confirm(`✅ Confirmer l'enrôlement de ${agentName} ?`)) return;

    setProcessing(true);
    try {
      const agentRef = doc(firestore, 'security_agents', agentId);
      await updateDoc(agentRef, { is_enrolled: true });
      await loadAgents();
      alert(`✅ ${agentName} enrôlé avec succès !`);
    } catch (error) {
      console.error('Error enrolling agent:', error);
      alert('Erreur lors de l\'enrôlement');
    } finally {
      setProcessing(false);
    }
  };

  const startEdit = (agent: Agent) => {
    setEditingId(agent.id);
    setFormData({
      name: agent.name,
      phone: agent.phone,
      email: agent.email,
      mobile_pda: agent.mobile_pda || '',
      cni: agent.cni || '',
      address: agent.address || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', phone: '', email: '', mobile_pda: '', cni: '', address: '' });
  };

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.phone.includes(searchTerm) ||
    agent.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={`rounded-[32px] max-w-6xl w-full max-h-[95vh] overflow-y-auto border my-8 ${
        isDark
          ? 'bg-gradient-to-br from-slate-950/95 to-slate-900/95 border-slate-800'
          : 'bg-white border-slate-200'
      }`}>
        <div className={`sticky top-0 p-6 border-b flex justify-between items-center z-10 ${
          isDark
            ? 'bg-slate-950/95 backdrop-blur-xl border-slate-800'
            : 'bg-white backdrop-blur-xl border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${
              isDark ? 'bg-gradient-to-br from-blue-600 to-cyan-600' : 'bg-gradient-to-br from-blue-500 to-cyan-500'
            }`}>
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Base de Données Contrôleurs
              </h2>
              <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {agents.length} agent{agents.length > 1 ? 's' : ''} enregistré{agents.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDark
                ? 'hover:bg-slate-800 text-slate-400'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un agent..."
                className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 font-medium transition-colors ${
                  isDark
                    ? 'bg-slate-900/40 border-slate-800 text-white placeholder:text-slate-500 focus:border-blue-600'
                    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500'
                } focus:outline-none`}
              />
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ${
                isDark
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
              }`}
            >
              <Plus className="w-5 h-5" />
              Ajouter un contrôleur
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddAgent} className={`p-6 rounded-2xl border-2 ${
              isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Nouveau Contrôleur
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-xs font-bold mb-2 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border font-medium ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-white border-slate-200 text-slate-900'
                    } focus:outline-none`}
                    placeholder="Mamadou Diallo"
                    required
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-2 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border font-medium ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-white border-slate-200 text-slate-900'
                    } focus:outline-none`}
                    placeholder="+221 77 123 45 67"
                    required
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-2 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border font-medium ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-white border-slate-200 text-slate-900'
                    } focus:outline-none`}
                    placeholder="agent@email.com"
                    required
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-2 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Mobile PDA
                  </label>
                  <input
                    type="text"
                    value={formData.mobile_pda}
                    onChange={(e) => setFormData({ ...formData, mobile_pda: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border font-medium ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-white border-slate-200 text-slate-900'
                    } focus:outline-none`}
                    placeholder="PDA12345"
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-2 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    CNI
                  </label>
                  <input
                    type="text"
                    value={formData.cni}
                    onChange={(e) => setFormData({ ...formData, cni: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border font-medium ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-white border-slate-200 text-slate-900'
                    } focus:outline-none`}
                    placeholder="1234567890123"
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className={`block text-xs font-bold mb-2 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border font-medium ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-white border-slate-200 text-slate-900'
                    } focus:outline-none`}
                    placeholder="Sacré-Cœur 3, Dakar"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  disabled={processing}
                  className="px-6 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold transition-colors disabled:opacity-50"
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ name: '', phone: '', email: '' });
                  }}
                  className={`px-6 py-3 rounded-xl font-bold transition-colors ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }`}
                >
                  Annuler
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                Chargement des agents...
              </p>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-12">
              <Users className={`w-16 h-16 mx-auto mb-4 ${
                isDark ? 'text-slate-700' : 'text-slate-300'
              }`} />
              <p className={`font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {searchTerm ? 'Aucun agent trouvé' : 'Aucun agent enregistré'}
              </p>
            </div>
          ) : (
            <div className={`rounded-2xl border overflow-hidden ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={isDark ? 'bg-slate-900/60' : 'bg-slate-50'}>
                    <tr>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        Agent
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        Téléphone
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        Email
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        Mobile PDA
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        CNI
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        Adresse
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        Statut
                      </th>
                      <th className={`px-6 py-4 text-right text-xs font-bold uppercase tracking-wider ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={isDark ? 'divide-y divide-slate-800' : 'divide-y divide-slate-200'}>
                    {filteredAgents.map((agent) => (
                      <tr key={agent.id} className={isDark ? 'hover:bg-slate-900/40' : 'hover:bg-slate-50'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === agent.id ? (
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className={`w-full px-3 py-2 rounded-lg border font-medium text-sm ${
                                isDark
                                  ? 'bg-slate-900 border-slate-700 text-white'
                                  : 'bg-white border-slate-200 text-slate-900'
                              } focus:outline-none`}
                            />
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                isDark ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-600'
                              }`}>
                                {agent.name.charAt(0).toUpperCase()}
                              </div>
                              <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {agent.name}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === agent.id ? (
                            <input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              className={`w-full px-3 py-2 rounded-lg border font-medium text-sm ${
                                isDark
                                  ? 'bg-slate-900 border-slate-700 text-white'
                                  : 'bg-white border-slate-200 text-slate-900'
                              } focus:outline-none`}
                            />
                          ) : (
                            <span className={`text-sm font-medium ${
                              isDark ? 'text-slate-400' : 'text-slate-600'
                            }`}>
                              {agent.phone}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === agent.id ? (
                            <input
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              className={`w-full px-3 py-2 rounded-lg border font-medium text-sm ${
                                isDark
                                  ? 'bg-slate-900 border-slate-700 text-white'
                                  : 'bg-white border-slate-200 text-slate-900'
                              } focus:outline-none`}
                            />
                          ) : (
                            <span className={`text-sm font-medium ${
                              isDark ? 'text-slate-400' : 'text-slate-600'
                            }`}>
                              {agent.email}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === agent.id ? (
                            <input
                              type="text"
                              value={formData.mobile_pda}
                              onChange={(e) => setFormData({ ...formData, mobile_pda: e.target.value })}
                              className={`w-full px-3 py-2 rounded-lg border font-medium text-sm ${
                                isDark
                                  ? 'bg-slate-900 border-slate-700 text-white'
                                  : 'bg-white border-slate-200 text-slate-900'
                              } focus:outline-none`}
                            />
                          ) : (
                            <span className={`text-sm font-medium ${
                              isDark ? 'text-slate-400' : 'text-slate-600'
                            }`}>
                              {agent.mobile_pda || '-'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === agent.id ? (
                            <input
                              type="text"
                              value={formData.cni}
                              onChange={(e) => setFormData({ ...formData, cni: e.target.value })}
                              className={`w-full px-3 py-2 rounded-lg border font-medium text-sm ${
                                isDark
                                  ? 'bg-slate-900 border-slate-700 text-white'
                                  : 'bg-white border-slate-200 text-slate-900'
                              } focus:outline-none`}
                            />
                          ) : (
                            <span className={`text-sm font-medium ${
                              isDark ? 'text-slate-400' : 'text-slate-600'
                            }`}>
                              {agent.cni || '-'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingId === agent.id ? (
                            <input
                              type="text"
                              value={formData.address}
                              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                              className={`w-full px-3 py-2 rounded-lg border font-medium text-sm ${
                                isDark
                                  ? 'bg-slate-900 border-slate-700 text-white'
                                  : 'bg-white border-slate-200 text-slate-900'
                              } focus:outline-none`}
                            />
                          ) : (
                            <span className={`text-sm font-medium ${
                              isDark ? 'text-slate-400' : 'text-slate-600'
                            }`}>
                              {agent.address || '-'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleActive(agent.id, agent.is_active)}
                            disabled={processing}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                              agent.is_active
                                ? isDark
                                  ? 'bg-green-900/40 text-green-400 hover:bg-green-900/60'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                                : isDark
                                ? 'bg-red-900/40 text-red-400 hover:bg-red-900/60'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {agent.is_active ? 'Actif' : 'Inactif'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {editingId === agent.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleUpdateAgent(agent.id)}
                                disabled={processing}
                                className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className={`p-2 rounded-lg transition-colors ${
                                  isDark
                                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                                    : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                                }`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              {!agent.is_enrolled && (
                                <button
                                  onClick={() => handleEnroll(agent.id, agent.name)}
                                  disabled={processing}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                                    isDark
                                      ? 'bg-green-900/40 hover:bg-green-900/60 text-green-400'
                                      : 'bg-green-100 hover:bg-green-200 text-green-700'
                                  }`}
                                >
                                  Enrôler
                                </button>
                              )}
                              <button
                                onClick={() => startEdit(agent)}
                                className={`p-2 rounded-lg transition-colors ${
                                  isDark
                                    ? 'hover:bg-slate-800 text-blue-400'
                                    : 'hover:bg-slate-100 text-blue-600'
                                }`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteAgent(agent.id, agent.name)}
                                disabled={processing}
                                className={`p-2 rounded-lg transition-colors ${
                                  isDark
                                    ? 'hover:bg-red-900/40 text-red-400'
                                    : 'hover:bg-red-100 text-red-600'
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
