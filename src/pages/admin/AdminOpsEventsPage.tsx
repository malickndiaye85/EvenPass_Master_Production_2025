import React, { useState, useEffect } from 'react';
import { Users, Calendar, Activity, TrendingUp, AlertTriangle, Download, CheckCircle, XCircle, Plus, Eye, Trash2, Edit2, Copy, Trophy, Medal, Award, Clock, Zap, Shield } from 'lucide-react';
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
  const [view, setView] = useState<'grid' | 'control'>('grid');

  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showAddController, setShowAddController] = useState(false);
  const [newControllerCode, setNewControllerCode] = useState<string | null>(null);

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
      if (event) setSelectedEvent(event);
    });

    const unsubControllers = listenToEventControllers(selectedEvent.id, (controllers) => {
      setControllers(controllers);
    });

    const unsubScans = listenToEventScans(selectedEvent.id, (scans) => {
      setScans(scans);
    });

    loadStats();
    loadAffluence();

    const interval = setInterval(() => {
      loadStats();
      loadAffluence();
    }, 5000);

    return () => {
      unsubEvent();
      unsubControllers();
      unsubScans();
      clearInterval(interval);
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
      const controller = await createController(
        selectedEvent.id,
        controllerForm.name,
        controllerForm.position
      );
      setNewControllerCode(controller.code);
      setControllerForm({ name: '', position: '' });
    } catch (error) {
      console.error('Error creating controller:', error);
      alert('Erreur lors de l\'ajout du contrôleur');
    }
  };

  const handleToggleController = async (controller: Controller) => {
    try {
      await updateController(controller.id, { isActive: !controller.isActive });
    } catch (error) {
      console.error('Error toggling controller:', error);
    }
  };

  const handleDeleteController = async (controllerId: string) => {
    if (!confirm('Désactiver ce contrôleur définitivement ?')) return;
    try {
      await deleteController(controllerId);
    } catch (error) {
      console.error('Error deleting controller:', error);
    }
  };

  const handleCompleteMission = async () => {
    if (!selectedEvent) return;
    if (!confirm('Terminer la mission ? Tous les codes seront désactivés.')) return;

    try {
      await completeMission(selectedEvent.id);
      setView('grid');
      setSelectedEvent(null);
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

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert(`Code ${code} copié !`);
  };

  const getEventStats = (event: Event) => {
    const fillRate = event.totalTickets > 0
      ? Math.round((event.scannedTickets / event.totalTickets) * 100)
      : 0;
    return { fillRate };
  };

  const validScans = scans.filter(s => !s.isFraud).length;
  const frauds = scans.filter(s => s.isFraud).length;
  const activeCount = controllers.filter(c => c.isActive).length;

  const topControllers = [...stats]
    .sort((a, b) => b.totalScans - a.totalScans)
    .slice(0, 3);

  const getTimeRemaining = () => {
    if (!selectedEvent) return 'N/A';
    const now = Date.now();
    const eventDate = selectedEvent.date;
    if (now > eventDate) return 'En cours';
    const diff = eventDate - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-orange-500 text-xl animate-pulse">Chargement du système...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Premium Header - Noir avec liseré orange */}
      <div className="bg-black border-b-2 border-orange-500">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">OPS Manager Events</h1>
              <p className="text-zinc-400">Tour de Contrôle EPscanV</p>
            </div>
            {view === 'control' && selectedEvent && (
              <button
                onClick={() => {
                  setView('grid');
                  setSelectedEvent(null);
                }}
                className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 transition-colors"
              >
                ← Retour aux événements
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid View - Premium Event Cards */}
      {view === 'grid' && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Événements</h2>
              <p className="text-zinc-500">{events.length} événement(s) total</p>
            </div>
            <button
              onClick={() => setShowCreateEvent(true)}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-500 rounded-lg font-semibold transition-all flex items-center gap-2 shadow-lg shadow-orange-600/20"
            >
              <Plus className="w-5 h-5" />
              Nouvel Événement
            </button>
          </div>

          {events.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
              <Calendar className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 text-lg mb-6">Aucun événement créé</p>
              <button
                onClick={() => setShowCreateEvent(true)}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-500 rounded-lg font-semibold transition-colors"
              >
                Créer le premier événement
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
                const { fillRate } = getEventStats(event);
                return (
                  <div
                    key={event.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-orange-500/50 transition-all cursor-pointer group"
                    onClick={() => {
                      setSelectedEvent(event);
                      setView('control');
                    }}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-500 transition-colors">
                            {event.name}
                          </h3>
                          <p className="text-zinc-500 text-sm mb-3">{event.location}</p>
                          <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <Calendar className="w-4 h-4" />
                            {new Date(event.date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          event.status === 'ongoing'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : event.status === 'upcoming'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-zinc-700/50 text-zinc-400 border border-zinc-600'
                        }`}>
                          {event.status === 'ongoing' ? 'En cours' : event.status === 'upcoming' ? 'À venir' : 'Terminé'}
                        </div>
                      </div>

                      <div className="border-t border-zinc-800 pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500 text-sm">Taux de remplissage</span>
                          <span className="text-orange-500 font-bold text-lg">{fillRate}%</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-orange-600 to-orange-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${fillRate}%` }}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <div className="bg-zinc-800/50 rounded-lg p-3">
                            <div className="text-zinc-500 text-xs mb-1">Scans</div>
                            <div className="text-white font-bold text-lg">{event.scannedTickets}</div>
                          </div>
                          <div className="bg-zinc-800/50 rounded-lg p-3">
                            <div className="text-zinc-500 text-xs mb-1">Contrôleurs</div>
                            <div className={`font-bold text-lg ${event.activeControllers > 0 ? 'text-green-400' : 'text-zinc-500'}`}>
                              {event.activeControllers}
                            </div>
                          </div>
                        </div>
                      </div>

                      <button className="w-full mt-4 py-3 bg-zinc-800 hover:bg-orange-600 rounded-lg font-semibold transition-all group-hover:bg-orange-600 flex items-center justify-center gap-2">
                        <Activity className="w-5 h-5" />
                        Ouvrir le Dashboard
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Control Center View - Live Dashboard */}
      {view === 'control' && selectedEvent && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Event Header */}
          <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">{selectedEvent.name}</h2>
                <div className="flex items-center gap-6 text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedEvent.date).toLocaleDateString('fr-FR')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {selectedEvent.location}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleExportReport}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Export
                </button>
                <button
                  onClick={handleCompleteMission}
                  className="px-6 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-semibold transition-colors border border-red-600/30"
                >
                  Clôturer la Mission
                </button>
              </div>
            </div>
          </div>

          {/* Flash Stats - 4 Counters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-zinc-900 border-2 border-green-500/30 rounded-xl p-6 hover:border-green-500/50 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-green-400 text-sm font-semibold">VALIDES</div>
              </div>
              <div className="text-4xl font-bold text-white mb-1">{validScans}</div>
              <div className="text-zinc-500 text-sm">Scans authentiques</div>
            </div>

            <div className="bg-zinc-900 border-2 border-red-500/30 rounded-xl p-6 hover:border-red-500/50 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div className="text-red-400 text-sm font-semibold">FRAUDES</div>
              </div>
              <div className="text-4xl font-bold text-white mb-1">{frauds}</div>
              <div className="text-zinc-500 text-sm">Tentatives bloquées</div>
            </div>

            <div className="bg-zinc-900 border-2 border-blue-500/30 rounded-xl p-6 hover:border-blue-500/50 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-blue-400 text-sm font-semibold">STAFF</div>
              </div>
              <div className="text-4xl font-bold text-white mb-1">{activeCount}</div>
              <div className="text-zinc-500 text-sm">Contrôleurs actifs</div>
            </div>

            <div className="bg-zinc-900 border-2 border-orange-500/30 rounded-xl p-6 hover:border-orange-500/50 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-400" />
                </div>
                <div className="text-orange-400 text-sm font-semibold">TEMPS</div>
              </div>
              <div className="text-4xl font-bold text-white mb-1">{getTimeRemaining()}</div>
              <div className="text-zinc-500 text-sm">Avant l'événement</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Affluence Graph */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-orange-500" />
                Affluence en temps réel
              </h3>
              {affluence.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-zinc-600">
                  Aucune donnée d'affluence
                </div>
              ) : (
                <div className="h-64 flex items-end gap-2">
                  {affluence.map((point, idx) => {
                    const maxScans = Math.max(...affluence.map(p => p.scans), 1);
                    const height = (point.scans / maxScans) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div className="text-xs text-zinc-600 mb-1">{point.scans}</div>
                        <div
                          className="w-full bg-gradient-to-t from-orange-600 to-orange-500 rounded-t transition-all hover:from-orange-500 hover:to-orange-400"
                          style={{ height: `${height}%` }}
                        />
                        <div className="text-xs text-zinc-500 mt-2">{point.time}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top Controllers Leaderboard */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-orange-500" />
                Classement des contrôleurs
              </h3>
              {topControllers.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-zinc-600">
                  Aucun scan enregistré
                </div>
              ) : (
                <div className="space-y-4">
                  {topControllers.map((controller, idx) => {
                    const medals = [
                      { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
                      { icon: Medal, color: 'text-gray-400', bg: 'bg-gray-400/20', border: 'border-gray-400/30' },
                      { icon: Award, color: 'text-orange-600', bg: 'bg-orange-600/20', border: 'border-orange-600/30' }
                    ];
                    const medal = medals[idx] || medals[2];
                    const MedalIcon = medal.icon;

                    return (
                      <div
                        key={controller.controllerId}
                        className={`bg-zinc-800/50 border ${medal.border} rounded-lg p-4 hover:bg-zinc-800 transition-all`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-3 ${medal.bg} rounded-lg`}>
                            <MedalIcon className={`w-6 h-6 ${medal.color}`} />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-white mb-1">{controller.controllerName}</div>
                            <div className="text-zinc-500 text-sm">{controller.position}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-orange-500">{controller.totalScans}</div>
                            <div className="text-zinc-500 text-xs">scans</div>
                          </div>
                        </div>
                        {controller.fraudAttempts > 0 && (
                          <div className="mt-3 pt-3 border-t border-zinc-700 flex items-center gap-2 text-red-400 text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            {controller.fraudAttempts} fraude(s) détectée(s)
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Controllers Management */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-orange-500" />
                Gestion des Contrôleurs
              </h3>
              <button
                onClick={() => setShowAddController(true)}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-500 rounded-lg font-semibold transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Ajouter un Contrôleur
              </button>
            </div>

            {controllers.length === 0 ? (
              <div className="text-center py-12 text-zinc-600">
                Aucun contrôleur assigné à cet événement
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-3 px-4 text-zinc-400 font-semibold">NOM</th>
                      <th className="text-left py-3 px-4 text-zinc-400 font-semibold">POSITION</th>
                      <th className="text-left py-3 px-4 text-zinc-400 font-semibold">CODE</th>
                      <th className="text-left py-3 px-4 text-zinc-400 font-semibold">STATUT</th>
                      <th className="text-left py-3 px-4 text-zinc-400 font-semibold">SCANS</th>
                      <th className="text-right py-3 px-4 text-zinc-400 font-semibold">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {controllers.map((controller) => {
                      const controllerStat = stats.find(s => s.controllerId === controller.id);
                      const isOnline = controller.isActive && controllerStat && controllerStat.lastScanAt && (Date.now() - controllerStat.lastScanAt < 60000);

                      return (
                        <tr key={controller.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                          <td className="py-4 px-4">
                            <div className="font-semibold text-white">{controller.name}</div>
                          </td>
                          <td className="py-4 px-4 text-zinc-400">{controller.position}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <code className="px-3 py-1 bg-zinc-800 rounded font-mono text-orange-400 font-bold">
                                {controller.code}
                              </code>
                              <button
                                onClick={() => copyCode(controller.code)}
                                className="p-2 hover:bg-zinc-700 rounded transition-colors"
                                title="Copier le code"
                              >
                                <Copy className="w-4 h-4 text-zinc-500" />
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {controller.isActive ? (
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`} />
                                <span className={isOnline ? 'text-green-400' : 'text-orange-400'}>
                                  {isOnline ? 'En ligne' : 'Actif'}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-zinc-600" />
                                <span className="text-zinc-500">Inactif</span>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-white font-semibold">{controller.totalScans}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleController(controller)}
                                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                  controller.isActive
                                    ? 'bg-orange-600/20 text-orange-400 hover:bg-orange-600/30'
                                    : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                                }`}
                              >
                                {controller.isActive ? 'Désactiver' : 'Activer'}
                              </button>
                              <button
                                onClick={() => handleDeleteController(controller.id)}
                                className="p-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-white mb-6">Créer un Événement</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-zinc-400 mb-2 font-semibold">Nom de l'événement</label>
                <input
                  type="text"
                  required
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                  placeholder="Ex: Festival Summer 2026"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-2 font-semibold">Description</label>
                <textarea
                  required
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                  rows={3}
                  placeholder="Description de l'événement"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 mb-2 font-semibold">Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-2 font-semibold">Capacité totale</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={eventForm.totalTickets || ''}
                    onChange={(e) => setEventForm({ ...eventForm, totalTickets: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    placeholder="1000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-zinc-400 mb-2 font-semibold">Lieu</label>
                <input
                  type="text"
                  required
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                  placeholder="Ex: Stade LSS, Dakar"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateEvent(false)}
                  className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-semibold transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-500 rounded-lg font-semibold transition-colors"
                >
                  Créer l'événement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Controller Modal */}
      {showAddController && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-lg w-full">
            <h2 className="text-2xl font-bold text-white mb-6">Ajouter un Contrôleur</h2>

            {newControllerCode ? (
              <div className="text-center py-8">
                <div className="mb-6">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-zinc-400 mb-2">Code généré avec succès</p>
                </div>
                <div className="bg-zinc-800 border-2 border-orange-500 rounded-xl p-8 mb-6">
                  <div className="text-zinc-500 text-sm mb-2">CODE D'ACCÈS</div>
                  <div className="text-6xl font-bold text-orange-500 font-mono tracking-wider mb-4">
                    {newControllerCode}
                  </div>
                  <button
                    onClick={() => copyCode(newControllerCode)}
                    className="px-6 py-3 bg-orange-600 hover:bg-orange-500 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Copy className="w-5 h-5" />
                    Copier le code
                  </button>
                </div>
                <p className="text-zinc-500 text-sm mb-6">
                  Transmettez ce code au contrôleur pour qu'il puisse se connecter sur EPscanV
                </p>
                <button
                  onClick={() => {
                    setNewControllerCode(null);
                    setShowAddController(false);
                  }}
                  className="w-full px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-semibold transition-colors"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddController} className="space-y-4">
                <div>
                  <label className="block text-zinc-400 mb-2 font-semibold">Nom du contrôleur</label>
                  <input
                    type="text"
                    required
                    value={controllerForm.name}
                    onChange={(e) => setControllerForm({ ...controllerForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    placeholder="Ex: Moussa Diop"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-2 font-semibold">Position</label>
                  <input
                    type="text"
                    required
                    value={controllerForm.position}
                    onChange={(e) => setControllerForm({ ...controllerForm, position: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    placeholder="Ex: Entrée principale"
                  />
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div className="text-sm text-blue-300">
                      Un code unique à 6 chiffres sera généré automatiquement pour ce contrôleur
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddController(false);
                      setControllerForm({ name: '', position: '' });
                    }}
                    className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-semibold transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-500 rounded-lg font-semibold transition-colors"
                  >
                    Générer le code
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
