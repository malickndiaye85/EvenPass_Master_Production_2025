import { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Mail,
  CheckCircle,
  XCircle,
  Shield,
  Zap,
  Layers
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/SupabaseAuthContext';

interface Event {
  id: string;
  title: string;
  start_date: string;
  venue_name: string;
  venue_city: string;
  workflow_status: string;
  organizer?: { organization_name: string };
}

interface Zone {
  id: string;
  event_id: string;
  zone_name: string;
  zone_code: string;
  ticket_type_ids: string[];
  capacity_limit: number | null;
  current_count: number;
  is_active: boolean;
}

interface Controller {
  id: string;
  full_name: string;
  contact_phone: string;
  id_document_number: string;
  equipment_serial: string;
  equipment_hardware_id: string | null;
  email: string | null;
  is_active: boolean;
}

interface ControllerAssignment {
  id: string;
  controller_id: string;
  event_id: string;
  zone_id: string | null;
  activation_token: string;
  activation_link_sent_at: string | null;
  activated_at: string | null;
  is_active: boolean;
  controller?: Controller;
  event?: Event;
  zone?: Zone;
}

export default function OpsManagerPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'events' | 'zones' | 'controllers' | 'assignments'>('events');
  const [events, setEvents] = useState<Event[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [controllers, setControllers] = useState<Controller[]>([]);
  const [assignments, setAssignments] = useState<ControllerAssignment[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showControllerForm, setShowControllerForm] = useState(false);
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);

  const [controllerForm, setControllerForm] = useState({
    full_name: '',
    contact_phone: '',
    id_document_number: '',
    equipment_serial: '',
    email: '',
  });

  const [zoneForm, setZoneForm] = useState({
    zone_name: '',
    zone_code: '',
    capacity_limit: '',
  });

  useEffect(() => {
    loadData();
  }, [selectedEvent]);

  const loadData = async () => {
    try {
      const eventsRes = await supabase
        .from('events')
        .select('*, organizer:organizers(organization_name)')
        .in('workflow_status', ['approved', 'logistics_set', 'ready'])
        .order('start_date');

      if (eventsRes.data) setEvents(eventsRes.data as Event[]);

      if (selectedEvent) {
        const [zonesRes, assignmentsRes] = await Promise.all([
          supabase
            .from('event_zones')
            .select('*')
            .eq('event_id', selectedEvent),
          supabase
            .from('controller_assignments')
            .select('*, controller:controllers(*), event:events(*), zone:event_zones(*)')
            .eq('event_id', selectedEvent)
        ]);

        if (zonesRes.data) setZones(zonesRes.data);
        if (assignmentsRes.data) setAssignments(assignmentsRes.data as ControllerAssignment[]);
      }

      const controllersRes = await supabase
        .from('controllers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (controllersRes.data) setControllers(controllersRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateController = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('controllers').insert({
        ...controllerForm,
        created_by: user?.id,
      });

      if (error) throw error;
      alert('Contrôleur créé avec succès');
      setShowControllerForm(false);
      setControllerForm({
        full_name: '',
        contact_phone: '',
        id_document_number: '',
        equipment_serial: '',
        email: '',
      });
      loadData();
    } catch (error) {
      console.error('Error creating controller:', error);
      alert('Erreur lors de la création');
    }
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    try {
      const { error } = await supabase.from('event_zones').insert({
        event_id: selectedEvent,
        zone_name: zoneForm.zone_name,
        zone_code: zoneForm.zone_code,
        capacity_limit: zoneForm.capacity_limit ? parseInt(zoneForm.capacity_limit) : null,
      });

      if (error) throw error;
      alert('Zone créée avec succès');
      setShowZoneForm(false);
      setZoneForm({ zone_name: '', zone_code: '', capacity_limit: '' });
      loadData();
    } catch (error) {
      console.error('Error creating zone:', error);
      alert('Erreur lors de la création');
    }
  };

  const handleAssignController = async (controllerId: string, zoneId: string | null) => {
    if (!selectedEvent) return;

    const activationToken = Math.random().toString(36).substring(2) + Date.now().toString(36);

    try {
      const { error } = await supabase.from('controller_assignments').insert({
        controller_id: controllerId,
        event_id: selectedEvent,
        zone_id: zoneId,
        activation_token: activationToken,
        assigned_by: user?.id,
      });

      if (error) throw error;
      alert('Contrôleur assigné avec succès');
      setShowAssignmentForm(false);
      loadData();
    } catch (error) {
      console.error('Error assigning controller:', error);
      alert('Erreur lors de l\'assignation');
    }
  };

  const handleSendActivationLink = async (assignmentId: string, email: string) => {
    try {
      const assignment = assignments.find(a => a.id === assignmentId);
      if (!assignment) return;

      const activationUrl = `${window.location.origin}/scan/activate/${assignment.activation_token}`;

      const { error } = await supabase
        .from('controller_assignments')
        .update({ activation_link_sent_at: new Date().toISOString() })
        .eq('id', assignmentId);

      if (error) throw error;

      alert(`Lien d'activation:\n${activationUrl}\n\nEnvoyez ce lien à ${email}`);
      loadData();
    } catch (error) {
      console.error('Error sending activation link:', error);
      alert('Erreur lors de l\'envoi');
    }
  };

  const handleMarkEventReady = async () => {
    if (!selectedEvent) return;

    if (!confirm('Marquer cet événement comme prêt pour le scan ?')) return;

    try {
      const { error } = await supabase
        .from('events')
        .update({ workflow_status: 'ready' })
        .eq('id', selectedEvent);

      if (error) throw error;
      alert('Événement marqué comme prêt!');
      loadData();
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white">Ops Manager</h1>
          <p className="text-slate-400 mt-1">Gestion logistique et contrôleurs</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Sélectionner un événement</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedEvent === event.id
                    ? 'border-blue-500 bg-blue-900/30'
                    : 'border-slate-700 bg-slate-700/30 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-white">{event.title}</h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      event.workflow_status === 'approved' ? 'bg-yellow-600' :
                      event.workflow_status === 'logistics_set' ? 'bg-blue-600' :
                      'bg-green-600'
                    } text-white`}
                  >
                    {event.workflow_status}
                  </span>
                </div>
                <div className="text-sm text-slate-400 space-y-1">
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-2" />
                    {new Date(event.start_date).toLocaleDateString('fr-FR')}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-3 h-3 mr-2" />
                    {event.venue_city}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedEvent && (
          <>
            <div className="flex space-x-2 mb-6">
              <button
                onClick={() => setActiveTab('zones')}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${
                  activeTab === 'zones'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Layers className="w-5 h-5 inline mr-2" />
                Zones ({zones.length})
              </button>
              <button
                onClick={() => setActiveTab('controllers')}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${
                  activeTab === 'controllers'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Users className="w-5 h-5 inline mr-2" />
                Contrôleurs ({controllers.length})
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${
                  activeTab === 'assignments'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Shield className="w-5 h-5 inline mr-2" />
                Assignations ({assignments.length})
              </button>

              {zones.length > 0 && assignments.length > 0 && (
                <button
                  onClick={handleMarkEventReady}
                  className="ml-auto px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-black transition-all shadow-lg shadow-green-500/30 flex items-center"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  ÉVÉNEMENT PRÊT
                </button>
              )}
            </div>

            {activeTab === 'zones' && (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">Zones d'Entrée</h2>
                  <button
                    onClick={() => setShowZoneForm(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle Zone
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {zones.map((zone) => (
                    <div key={zone.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-white">{zone.zone_name}</h3>
                          <p className="text-sm text-slate-400">Code: {zone.zone_code}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          zone.is_active ? 'bg-green-600' : 'bg-gray-600'
                        } text-white`}>
                          {zone.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      {zone.capacity_limit && (
                        <div className="mt-2 text-sm">
                          <div className="flex justify-between text-slate-400 mb-1">
                            <span>Capacité</span>
                            <span>{zone.current_count} / {zone.capacity_limit}</span>
                          </div>
                          <div className="w-full bg-slate-600 rounded-full h-2">
                            <div
                              className="bg-blue-500 rounded-full h-2"
                              style={{
                                width: `${Math.min((zone.current_count / zone.capacity_limit) * 100, 100)}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'controllers' && (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">Contrôleurs</h2>
                  <button
                    onClick={() => setShowControllerForm(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau Contrôleur
                  </button>
                </div>

                <div className="space-y-3">
                  {controllers.map((controller) => (
                    <div key={controller.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-white">{controller.full_name}</h3>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-slate-400">
                            <div>Téléphone: {controller.contact_phone}</div>
                            <div>ID: {controller.id_document_number}</div>
                            <div>Équipement: {controller.equipment_serial}</div>
                            {controller.email && <div>Email: {controller.email}</div>}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setShowAssignmentForm(true);
                          }}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-bold"
                        >
                          Assigner
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'assignments' && (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">Assignations de Contrôleurs</h2>
                </div>

                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-white">{assignment.controller?.full_name}</h3>
                          <p className="text-sm text-slate-400 mt-1">
                            Zone: {assignment.zone?.zone_name || 'Non assigné'}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-sm">
                            {assignment.activated_at ? (
                              <span className="flex items-center text-green-400">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Activé le {new Date(assignment.activated_at).toLocaleDateString('fr-FR')}
                              </span>
                            ) : (
                              <span className="flex items-center text-yellow-400">
                                <XCircle className="w-4 h-4 mr-1" />
                                Non activé
                              </span>
                            )}
                            {assignment.activation_link_sent_at && (
                              <span className="text-blue-400 text-xs">
                                Lien envoyé le {new Date(assignment.activation_link_sent_at).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </div>
                        </div>
                        {!assignment.activated_at && assignment.controller?.email && (
                          <button
                            onClick={() => handleSendActivationLink(assignment.id, assignment.controller!.email!)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold flex items-center"
                          >
                            <Mail className="w-4 h-4 mr-1" />
                            Envoyer Activation
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showControllerForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-2xl w-full border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white">Nouveau Contrôleur</h2>
            </div>
            <form onSubmit={handleCreateController} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nom Complet</label>
                <input
                  type="text"
                  required
                  value={controllerForm.full_name}
                  onChange={(e) => setControllerForm({ ...controllerForm, full_name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Téléphone</label>
                <input
                  type="tel"
                  required
                  value={controllerForm.contact_phone}
                  onChange={(e) => setControllerForm({ ...controllerForm, contact_phone: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Numéro Pièce d'Identité</label>
                <input
                  type="text"
                  required
                  value={controllerForm.id_document_number}
                  onChange={(e) => setControllerForm({ ...controllerForm, id_document_number: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Numéro de Série Équipement</label>
                <input
                  type="text"
                  required
                  value={controllerForm.equipment_serial}
                  onChange={(e) => setControllerForm({ ...controllerForm, equipment_serial: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email (optionnel)</label>
                <input
                  type="email"
                  value={controllerForm.email}
                  onChange={(e) => setControllerForm({ ...controllerForm, email: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowControllerForm(false)}
                  className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-bold"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showZoneForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-lg w-full border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white">Nouvelle Zone</h2>
            </div>
            <form onSubmit={handleCreateZone} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nom de la Zone</label>
                <input
                  type="text"
                  required
                  value={zoneForm.zone_name}
                  onChange={(e) => setZoneForm({ ...zoneForm, zone_name: e.target.value })}
                  placeholder="Ex: Entrée VIP"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Code Zone</label>
                <input
                  type="text"
                  required
                  value={zoneForm.zone_code}
                  onChange={(e) => setZoneForm({ ...zoneForm, zone_code: e.target.value })}
                  placeholder="Ex: VIP-A"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Capacité Maximale (optionnel)</label>
                <input
                  type="number"
                  value={zoneForm.capacity_limit}
                  onChange={(e) => setZoneForm({ ...zoneForm, capacity_limit: e.target.value })}
                  placeholder="Ex: 500"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowZoneForm(false)}
                  className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-bold"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignmentForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-lg w-full border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white">Assigner un Contrôleur</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Sélectionner un Contrôleur</label>
                <select
                  id="controller-select"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                >
                  <option value="">Choisir...</option>
                  {controllers.map((controller) => (
                    <option key={controller.id} value={controller.id}>
                      {controller.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Zone Assignée (optionnel)</label>
                <select
                  id="zone-select"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                >
                  <option value="">Aucune zone spécifique</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.zone_name} ({zone.zone_code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignmentForm(false)}
                  className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-bold"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const controllerSelect = document.getElementById('controller-select') as HTMLSelectElement;
                    const zoneSelect = document.getElementById('zone-select') as HTMLSelectElement;
                    handleAssignController(controllerSelect.value, zoneSelect.value || null);
                  }}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-bold"
                >
                  Assigner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
