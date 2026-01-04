import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Send, Copy, CheckCircle, Users, Shield } from 'lucide-react';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { firestore } from '../firebase';

interface Agent {
  id: string;
  name: string;
  phone: string;
  email: string;
  is_active: boolean;
  created_at: any;
}

interface AgentManagementModalProps {
  isDark: boolean;
  eventId: string;
  eventTitle: string;
  onClose: () => void;
}

export default function AgentManagementModal({
  isDark,
  eventId,
  eventTitle,
  onClose,
}: AgentManagementModalProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<Map<string, string>>(new Map());
  const [showNewAgentForm, setShowNewAgentForm] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: '',
    phone: '',
    email: '',
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
      setAgents(loadedAgents.filter(a => a.is_active));
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAccessCode = (agentId: string, agentName: string): string => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    const code = `${eventId.substring(0, 6)}-${agentId.substring(0, 6)}-${timestamp}-${random}`.toUpperCase();
    return code;
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const agentData = {
        name: newAgent.name,
        phone: newAgent.phone,
        email: newAgent.email,
        is_active: true,
        created_at: Timestamp.now(),
      };
      await addDoc(collection(firestore, 'security_agents'), agentData);
      setNewAgent({ name: '', phone: '', email: '' });
      setShowNewAgentForm(false);
      await loadAgents();
      alert('Agent ajouté avec succès!');
    } catch (error) {
      console.error('Error adding agent:', error);
      alert('Erreur lors de l\'ajout de l\'agent');
    } finally {
      setProcessing(false);
    }
  };

  const toggleAgentSelection = (agentId: string) => {
    const newSelected = new Set(selectedAgents);
    if (newSelected.has(agentId)) {
      newSelected.delete(agentId);
    } else {
      newSelected.add(agentId);
    }
    setSelectedAgents(newSelected);
  };

  const handleGenerateCodes = async () => {
    if (selectedAgents.size === 0) {
      alert('Veuillez sélectionner au moins un agent');
      return;
    }

    setProcessing(true);
    try {
      const codes = new Map<string, string>();

      for (const agentId of selectedAgents) {
        const agent = agents.find(a => a.id === agentId);
        if (agent) {
          const code = generateAccessCode(agentId, agent.name);
          codes.set(agentId, code);

          await addDoc(collection(firestore, 'agent_access_codes'), {
            agent_id: agentId,
            agent_name: agent.name,
            event_id: eventId,
            event_title: eventTitle,
            access_code: code,
            is_active: true,
            scans_count: 0,
            created_at: Timestamp.now(),
            expires_at: null,
          });
        }
      }

      setGeneratedCodes(codes);
      alert(`${codes.size} code(s) généré(s) avec succès!`);
    } catch (error) {
      console.error('Error generating codes:', error);
      alert('Erreur lors de la génération des codes');
    } finally {
      setProcessing(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Code copié!');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={`rounded-[32px] max-w-5xl w-full max-h-[95vh] overflow-y-auto border my-8 ${
        isDark
          ? 'bg-gradient-to-br from-slate-950/95 to-slate-900/95 border-slate-800'
          : 'bg-white border-slate-200'
      }`}>
        <div className={`sticky top-0 p-6 border-b flex justify-between items-center z-10 ${
          isDark
            ? 'bg-slate-950/95 backdrop-blur-xl border-slate-800'
            : 'bg-white backdrop-blur-xl border-slate-200'
        }`}>
          <div>
            <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Gestion des Agents Contrôleurs
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {eventTitle}
            </p>
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
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Shield className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
              <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Sélectionner les agents ({selectedAgents.size} sélectionné{selectedAgents.size > 1 ? 's' : ''})
              </h3>
            </div>
            <button
              onClick={() => setShowNewAgentForm(!showNewAgentForm)}
              className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                isDark
                  ? 'bg-blue-900/40 hover:bg-blue-900/60 text-blue-300'
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
              }`}
            >
              <Plus className="w-4 h-4" />
              Nouvel agent
            </button>
          </div>

          {showNewAgentForm && (
            <form onSubmit={handleAddAgent} className={`p-6 rounded-2xl border-2 ${
              isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <h4 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Ajouter un nouvel agent
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-xs font-bold mb-2 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border font-medium text-sm ${
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
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={newAgent.phone}
                    onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border font-medium text-sm ${
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
                    Email
                  </label>
                  <input
                    type="email"
                    value={newAgent.email}
                    onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border font-medium text-sm ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-white border-slate-200 text-slate-900'
                    } focus:outline-none`}
                    placeholder="agent@email.com"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-colors disabled:opacity-50"
                >
                  Ajouter
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewAgentForm(false)}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => toggleAgentSelection(agent.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedAgents.has(agent.id)
                      ? isDark
                        ? 'bg-blue-900/40 border-blue-600'
                        : 'bg-blue-50 border-blue-500'
                      : isDark
                      ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users className={`w-5 h-5 ${
                        selectedAgents.has(agent.id)
                          ? isDark ? 'text-blue-400' : 'text-blue-600'
                          : isDark ? 'text-slate-400' : 'text-slate-500'
                      }`} />
                      <h4 className={`font-bold ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {agent.name}
                      </h4>
                    </div>
                    {selectedAgents.has(agent.id) && (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {agent.phone}
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    {agent.email}
                  </p>
                  {generatedCodes.has(agent.id) && (
                    <div className={`mt-3 p-2 rounded-lg ${
                      isDark ? 'bg-slate-800' : 'bg-slate-100'
                    }`}>
                      <div className="flex items-center justify-between">
                        <code className={`text-xs font-mono ${
                          isDark ? 'text-green-400' : 'text-green-600'
                        }`}>
                          {generatedCodes.get(agent.id)}
                        </code>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyCode(generatedCodes.get(agent.id)!);
                          }}
                          className="p-1 rounded hover:bg-slate-700 transition-colors"
                        >
                          <Copy className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {agents.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users className={`w-16 h-16 mx-auto mb-4 ${
                isDark ? 'text-slate-700' : 'text-slate-300'
              }`} />
              <p className={`font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Aucun agent disponible
              </p>
              <p className={`text-sm mt-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                Ajoutez votre premier agent contrôleur
              </p>
            </div>
          )}

          <div className={`p-6 rounded-2xl border-2 ${
            isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <button
              onClick={handleGenerateCodes}
              disabled={processing || selectedAgents.size === 0}
              className={`w-full px-6 py-4 rounded-2xl transition-all font-black text-lg shadow-xl flex items-center justify-center gap-2 ${
                processing || selectedAgents.size === 0 ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                isDark
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
              }`}
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Générer les codes d'accès pour {selectedAgents.size} agent{selectedAgents.size > 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
