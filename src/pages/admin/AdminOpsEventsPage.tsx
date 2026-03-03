import React, { useState, useEffect } from 'react';
import { Users, Calendar, Activity, TrendingUp, AlertTriangle, Download, CheckCircle, XCircle, Plus, CreditCard as Edit2, Trash2, Eye } from 'lucide-react';
import {
  getAllEvents,
  getEvent,
  createEvent,
  updateEvent,
  createController,
  getEventControllers,
  deleteController,
  updateController,
  listenToEvent,
  listenToEventControllers,
  listenToEventScans,
  getControllerStats,
  getAffluenceData,
  completeMission,
  generateReportData,
  Event,
  Controller,
  ScanRecord,
  ControllerStats
} from '../../lib/opsEventsFirebase';

export default function AdminOpsEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [controllers, setControllers] = useState<Controller[]>([]);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [stats, setStats] = useState<ControllerStats[]>([]);
  const [affluence, setAffluence] = useState<{ time: string; scans: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'events' | 'dashboard'>('events');

  // Modals
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showAddController, setShowAddController] = useState(false);
  const [showEditController, setShowEditController] = useState(false);
  const [editingController, setEditingController] = useState<Controller | null>(null);

  // Form states
  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    date: '',
    location: '',
    totalTickets: 0
  });

  const [controllerForm, setControllerForm] = useState({
    name: '',
    position: ''
  });

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (!selectedEvent) return;

    const unsubEvent = listenToEvent(selectedEvent.id, (event) => {
      if (event) {
        setSelectedEvent(event);
      }
    });

    const unsubControllers = listenToEventControllers(selectedEvent.id, (controllers) => {
      setControllers(controllers);
    });

    const unsubScans = listenToEventScans(selectedEvent.id, (scans) => {
      setScans(scans);
    });

    loadStats();
    loadAffluence();

    return () => {
      unsubEvent();
      unsubControllers();
      unsubScans();
    };
  }, [selectedEvent?.id]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const allEvents = await getAllEvents();
      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!selectedEvent) return;
    try {
      const controllerStats = await getControllerStats(selectedEvent.id);
      setStats(controllerStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadAffluence = async () => {
    if (!selectedEvent) return;
    try {
      const affluenceData = await getAffluenceData(selectedEvent.id);
      setAffluence(affluenceData);
    } catch (error) {
      console.error('Error loading affluence:', error);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const event = await createEvent(
        eventForm.name,
        eventForm.description,
        new Date(eventForm.date).getTime(),
        eventForm.location,
        eventForm.totalTickets
      );
      setEvents([event, ...events]);
      setShowCreateEvent(false);
      setEventForm({ name: '', description: '', date: '', location: '', totalTickets: 0 });
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Erreur lors de la création de l\'événement');
    }
  };

  const handleAddController = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    try {
      await createController(
        selectedEvent.id,
        controllerForm.name,
        controllerForm.position
      );
      setShowAddController(false);
      setControllerForm({ name: '', position: '' });
    } catch (error) {
      console.error('Error creating controller:', error);
      alert('Erreur lors de l\'ajout du contrôleur');
    }
  };

  const handleUpdateController = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingController) return;

    try {
      await updateController(editingController.id, {
        name: controllerForm.name,
        position: controllerForm.position
      });
      setShowEditController(false);
      setEditingController(null);
      setControllerForm({ name: '', position: '' });
    } catch (error) {
      console.error('Error updating controller:', error);
      alert('Erreur lors de la modification');
    }
  };

  const handleDeleteController = async (controllerId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contrôleur ?')) return;

    try {
      await deleteController(controllerId);
    } catch (error) {
      console.error('Error deleting controller:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleCompleteMission = async () => {
    if (!selectedEvent) return;
    if (!confirm('Terminer la mission ? Tous les codes seront désactivés.')) return;

    try {
      await completeMission(selectedEvent.id);
      alert('Mission terminée avec succès');
    } catch (error) {
      console.error('Error completing mission:', error);
      alert('Erreur lors de la clôture');
    }
  };

  const handleExportReport = async () => {
    if (!selectedEvent) return;

    try {
      const reportData = await generateReportData(selectedEvent.id);

      // Generate CSV
      const csv = generateCSV(reportData);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-${selectedEvent.name.replace(/\s/g, '-')}-${Date.now()}.csv`;
      a.click();
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Erreur lors de l\'export');
    }
  };

  const generateCSV = (data: any): string => {
    let csv = 'RAPPORT D\'ACTIVITÉ OPS EVENTS\n\n';
    csv += `Événement:,${data.event.name}\n`;
    csv += `Date:,${new Date(data.event.date).toLocaleDateString('fr-FR')}\n`;
    csv += `Lieu:,${data.event.location}\n\n`;

    csv += 'RÉSUMÉ\n';
    csv += `Total scans:,${data.summary.totalScans}\n`;
    csv += `Scans valides:,${data.summary.validScans}\n`;
    csv += `Tentatives de fraude:,${data.summary.fraudAttempts}\n`;
    csv += `Contrôleurs actifs:,${data.summary.totalControllers}\n\n`;

    csv += 'PERFORMANCE PAR CONTRÔLEUR\n';
    csv += 'Nom,Position,Scans,Fraudes détectées,Dernier scan\n';
    data.controllers.forEach((c: ControllerStats) => {
      csv += `${c.controllerName},${c.position},${c.totalScans},${c.fraudAttempts},${c.lastScanAt ? new Date(c.lastScanAt).toLocaleString('fr-FR') : 'N/A'}\n`;
    });

    return csv;
  };

  const openEditModal = (controller: Controller) => {
    setEditingController(controller);
    setControllerForm({
      name: controller.name,
      position: controller.position
    });
    setShowEditController(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-orange-500 text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">OPS Manager Events</h1>
          <p className="text-orange-100">Tour de contrôle EPscanV</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('events')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'events'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <Calendar className="w-5 h-5 inline mr-2" />
              Événements
            </button>
            {selectedEvent && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-4 px-2 border-b-2 transition-colors ${
                  activeTab === 'dashboard'
                    ? 'border-orange-500 text-orange-500'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <Activity className="w-5 h-5 inline mr-2" />
                Dashboard Live
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {activeTab === 'events' && (
          <EventsTab
            events={events}
            selectedEvent={selectedEvent}
            setSelectedEvent={setSelectedEvent}
            setShowCreateEvent={setShowCreateEvent}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'dashboard' && selectedEvent && (
          <DashboardTab
            event={selectedEvent}
            controllers={controllers}
            scans={scans}
            stats={stats}
            affluence={affluence}
            onAddController={() => setShowAddController(true)}
            onEditController={openEditModal}
            onDeleteController={handleDeleteController}
            onCompleteMission={handleCompleteMission}
            onExportReport={handleExportReport}
          />
        )}
      </div>

      {/* Modals */}
      {showCreateEvent && (
        <Modal onClose={() => setShowCreateEvent(false)} title="Créer un événement">
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nom de l'événement</label>
              <input
                type="text"
                value={eventForm.name}
                onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date et heure</label>
              <input
                type="datetime-local"
                value={eventForm.date}
                onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Lieu</label>
              <input
                type="text"
                value={eventForm.location}
                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nombre de billets</label>
              <input
                type="number"
                value={eventForm.totalTickets}
                onChange={(e) => setEventForm({ ...eventForm, totalTickets: parseInt(e.target.value) })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                required
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg"
              >
                Créer l'événement
              </button>
              <button
                type="button"
                onClick={() => setShowCreateEvent(false)}
                className="px-6 bg-zinc-700 hover:bg-zinc-600 rounded-lg"
              >
                Annuler
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showAddController && (
        <Modal onClose={() => setShowAddController(false)} title="Ajouter un contrôleur">
          <form onSubmit={handleAddController} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nom du contrôleur</label>
              <input
                type="text"
                placeholder="Ex: Abdoulaye Diop"
                value={controllerForm.name}
                onChange={(e) => setControllerForm({ ...controllerForm, name: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Position / Poste</label>
              <input
                type="text"
                placeholder="Ex: Porte A - Entrée principale"
                value={controllerForm.position}
                onChange={(e) => setControllerForm({ ...controllerForm, position: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                required
              />
            </div>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <p className="text-sm text-orange-300">
                Un code unique de 6 chiffres sera généré automatiquement pour ce contrôleur.
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg"
              >
                Ajouter le contrôleur
              </button>
              <button
                type="button"
                onClick={() => setShowAddController(false)}
                className="px-6 bg-zinc-700 hover:bg-zinc-600 rounded-lg"
              >
                Annuler
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showEditController && editingController && (
        <Modal onClose={() => setShowEditController(false)} title="Modifier le contrôleur">
          <form onSubmit={handleUpdateController} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nom du contrôleur</label>
              <input
                type="text"
                value={controllerForm.name}
                onChange={(e) => setControllerForm({ ...controllerForm, name: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Position / Poste</label>
              <input
                type="text"
                value={controllerForm.position}
                onChange={(e) => setControllerForm({ ...controllerForm, position: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                required
              />
            </div>
            <div className="bg-zinc-800 rounded-lg p-4">
              <p className="text-sm text-zinc-400">
                Code actuel: <span className="text-orange-500 font-mono font-bold">{editingController.code}</span>
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg"
              >
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => setShowEditController(false)}
                className="px-6 bg-zinc-700 hover:bg-zinc-600 rounded-lg"
              >
                Annuler
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// Events Tab Component
function EventsTab({
  events,
  selectedEvent,
  setSelectedEvent,
  setShowCreateEvent,
  setActiveTab
}: any) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Événements</h2>
        <button
          onClick={() => setShowCreateEvent(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Créer un événement
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900 rounded-lg border border-zinc-800">
          <Calendar className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">Aucun événement créé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event: Event) => (
            <EventCard
              key={event.id}
              event={event}
              onSelect={() => {
                setSelectedEvent(event);
                setActiveTab('dashboard');
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Event Card
function EventCard({ event, onSelect }: { event: Event; onSelect: () => void }) {
  const statusColors = {
    upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    ongoing: 'bg-green-500/20 text-green-400 border-green-500/30',
    completed: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
  };

  const statusLabels = {
    upcoming: 'À venir',
    ongoing: 'En cours',
    completed: 'Terminé'
  };

  const progress = event.totalTickets > 0 ? (event.scannedTickets / event.totalTickets) * 100 : 0;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-orange-500/50 transition-colors cursor-pointer"
      onClick={onSelect}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-white">{event.name}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[event.status]}`}>
          {statusLabels[event.status]}
        </span>
      </div>

      <p className="text-zinc-400 text-sm mb-4">{event.description}</p>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-zinc-400">
          <Calendar className="w-4 h-4" />
          {new Date(event.date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
        <div className="flex items-center gap-2 text-zinc-400">
          <Users className="w-4 h-4" />
          {event.scannedTickets} / {event.totalTickets} billets scannés
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-zinc-400 mb-1">
          <span>Progression</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-2">
          <div
            className="bg-orange-500 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      <button className="mt-4 w-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 py-2 rounded-lg font-bold flex items-center justify-center gap-2">
        <Eye className="w-4 h-4" />
        Voir le dashboard
      </button>
    </div>
  );
}

// Dashboard Tab Component
function DashboardTab({
  event,
  controllers,
  scans,
  stats,
  affluence,
  onAddController,
  onEditController,
  onDeleteController,
  onCompleteMission,
  onExportReport
}: any) {
  const validScans = scans.filter((s: ScanRecord) => !s.isFraud).length;
  const fraudAttempts = scans.filter((s: ScanRecord) => s.isFraud).length;
  const progress = event.totalTickets > 0 ? (validScans / event.totalTickets) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{event.name}</h2>
          <p className="text-zinc-400">
            {new Date(event.date).toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onExportReport}
            className="bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Exporter
          </button>
          {event.status !== 'completed' && (
            <button
              onClick={onCompleteMission}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Terminer la mission
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          icon={<CheckCircle />}
          label="Scans valides"
          value={validScans.toString()}
          total={event.totalTickets}
          color="green"
        />
        <KPICard
          icon={<AlertTriangle />}
          label="Tentatives de fraude"
          value={fraudAttempts.toString()}
          color="red"
        />
        <KPICard
          icon={<Users />}
          label="Contrôleurs actifs"
          value={controllers.filter((c: Controller) => c.isActive).length.toString()}
          color="orange"
        />
        <KPICard
          icon={<TrendingUp />}
          label="Taux de remplissage"
          value={`${progress.toFixed(1)}%`}
          color="blue"
        />
      </div>

      {/* Progress Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-zinc-400">Progression globale</span>
          <span className="text-white font-bold">{validScans} / {event.totalTickets}</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-4">
          <div
            className="bg-gradient-to-r from-orange-500 to-orange-400 h-4 rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Controllers Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Gestion du Staff</h3>
          <button
            onClick={onAddController}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter un contrôleur
          </button>
        </div>

        {controllers.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            <Users className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
            <p>Aucun contrôleur assigné</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-3 px-4 text-zinc-400 font-medium">Nom</th>
                  <th className="text-left py-3 px-4 text-zinc-400 font-medium">Position</th>
                  <th className="text-left py-3 px-4 text-zinc-400 font-medium">Code</th>
                  <th className="text-left py-3 px-4 text-zinc-400 font-medium">Statut</th>
                  <th className="text-left py-3 px-4 text-zinc-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {controllers.map((controller: Controller) => (
                  <tr key={controller.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="py-3 px-4 font-medium">{controller.name}</td>
                    <td className="py-3 px-4 text-zinc-400">{controller.position}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-orange-500 font-bold bg-orange-500/10 px-3 py-1 rounded">
                        {controller.code}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {controller.isActive ? (
                        <span className="text-green-400 flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full" />
                          Actif
                        </span>
                      ) : (
                        <span className="text-zinc-500 flex items-center gap-2">
                          <div className="w-2 h-2 bg-zinc-500 rounded-full" />
                          Inactif
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onEditController(controller)}
                          className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteController(controller.id)}
                          className="p-2 hover:bg-red-600/20 rounded-lg text-zinc-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Performance Stats */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-6">Classement Staff (Performance)</h3>

        {stats.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            <Activity className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
            <p>Aucune activité enregistrée</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.map((stat: ControllerStats, index: number) => (
              <div
                key={stat.controllerId}
                className="flex items-center gap-4 bg-zinc-800/50 rounded-lg p-4"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-yellow-500 text-black' :
                  index === 1 ? 'bg-zinc-400 text-black' :
                  index === 2 ? 'bg-orange-600 text-white' :
                  'bg-zinc-700 text-zinc-300'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-bold">{stat.controllerName}</div>
                  <div className="text-sm text-zinc-400">{stat.position}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-400">{stat.totalScans} scans</div>
                  {stat.fraudAttempts > 0 && (
                    <div className="text-sm text-red-400">{stat.fraudAttempts} fraudes détectées</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Affluence Chart */}
      {affluence.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-6">Affluence (Entrées par tranche de 15 min)</h3>
          <div className="h-64 flex items-end gap-2">
            {affluence.map((data, index) => {
              const maxScans = Math.max(...affluence.map(d => d.scans));
              const height = (data.scans / maxScans) * 100;

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="text-xs text-zinc-400">{data.scans}</div>
                  <div
                    className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                  <div className="text-xs text-zinc-500 transform -rotate-45 origin-top-left mt-2">
                    {data.time}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// KPI Card
function KPICard({ icon, label, value, total, color }: any) {
  const colors = {
    green: 'from-green-600 to-green-500',
    red: 'from-red-600 to-red-500',
    orange: 'from-orange-600 to-orange-500',
    blue: 'from-blue-600 to-blue-500'
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-lg p-6 text-white`}>
      <div className="flex items-center justify-between mb-4">
        <div className="opacity-80">{icon}</div>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-90">{label}</div>
      {total && (
        <div className="text-xs opacity-75 mt-1">sur {total}</div>
      )}
    </div>
  );
}

// Modal Component
function Modal({ onClose, title, children }: any) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
