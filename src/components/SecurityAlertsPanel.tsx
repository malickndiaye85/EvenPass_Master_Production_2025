import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, XCircle, Eye, FileText } from 'lucide-react';
import { TripCancellationManager } from '../lib/tripCancellationManager';

interface SecurityAlert {
  id: string;
  type: 'excessive_cancellations';
  driverId: string;
  driverName: string;
  driverPhone: string;
  cancellationCount: number;
  timeframe: string;
  createdAt: any;
  status: 'pending' | 'reviewed' | 'resolved';
  details: {
    cancellations: Array<{
      tripId: string;
      cancelledAt: number;
      origin: string;
      destination: string;
    }>;
  };
}

const SecurityAlertsPanel: React.FC = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('pending');
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const fetchedAlerts = await TripCancellationManager.getSecurityAlerts(
        filter === 'all' ? undefined : filter
      );
      setAlerts(fetchedAlerts as SecurityAlert[]);
    } catch (error) {
      console.error('[SECURITY ALERTS] Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    alertId: string,
    newStatus: 'pending' | 'reviewed' | 'resolved'
  ) => {
    try {
      await TripCancellationManager.updateAlertStatus(alertId, newStatus);
      await loadAlerts();
      setSelectedAlert(null);
      alert(`Alerte mise à jour avec succès: ${newStatus}`);
    } catch (error) {
      console.error('[SECURITY ALERTS] Error updating status:', error);
      alert('Erreur lors de la mise à jour de l\'alerte');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={28} />
            Alertes Sécurité Transport
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Surveillance des comportements suspects des chauffeurs
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Toutes
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            En attente
          </button>
          <button
            onClick={() => setFilter('reviewed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'reviewed'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Examinées
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'resolved'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Résolues
          </button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune alerte</h3>
          <p className="text-gray-600">
            {filter === 'pending'
              ? 'Aucune alerte en attente de traitement'
              : 'Aucune alerte trouvée pour ce filtre'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-xl border-2 p-6 hover:shadow-lg transition-all cursor-pointer ${
                alert.status === 'pending'
                  ? 'border-red-300 bg-red-50'
                  : alert.status === 'reviewed'
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-green-300 bg-green-50'
              }`}
              onClick={() => setSelectedAlert(alert)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      alert.status === 'pending'
                        ? 'bg-red-500'
                        : alert.status === 'reviewed'
                        ? 'bg-blue-500'
                        : 'bg-green-500'
                    }`}
                  >
                    {alert.status === 'pending' ? (
                      <AlertTriangle className="text-white" size={24} />
                    ) : alert.status === 'reviewed' ? (
                      <Eye className="text-white" size={24} />
                    ) : (
                      <CheckCircle className="text-white" size={24} />
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Annulations Excessives
                    </h3>
                    <p className="text-sm text-gray-700 mt-1">
                      <strong>{alert.driverName}</strong> ({alert.driverPhone})
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {alert.cancellationCount} annulations en {alert.timeframe}
                    </p>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(alert.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      alert.status === 'pending'
                        ? 'bg-red-500 text-white'
                        : alert.status === 'reviewed'
                        ? 'bg-blue-500 text-white'
                        : 'bg-green-500 text-white'
                    }`}
                  >
                    {alert.status === 'pending'
                      ? 'EN ATTENTE'
                      : alert.status === 'reviewed'
                      ? 'EXAMINÉE'
                      : 'RÉSOLUE'}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-300 pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {alert.details.cancellations.length} trajets annulés
                  </span>
                  <button className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">
                    <FileText size={16} />
                    Voir détails
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedAlert && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Détails de l'Alerte</h3>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Chauffeur</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm">
                    <strong>Nom:</strong> {selectedAlert.driverName}
                  </p>
                  <p className="text-sm">
                    <strong>Téléphone:</strong> {selectedAlert.driverPhone}
                  </p>
                  <p className="text-sm">
                    <strong>ID:</strong> {selectedAlert.driverId}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Trajets Annulés ({selectedAlert.details.cancellations.length})
                </h4>
                <div className="space-y-2">
                  {selectedAlert.details.cancellations.map((cancellation, index) => (
                    <div
                      key={cancellation.tripId}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500">
                          #{index + 1}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(cancellation.cancelledAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {cancellation.origin} → {cancellation.destination}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        ID: {cancellation.tripId}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                {selectedAlert.status === 'pending' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedAlert.id, 'reviewed')}
                    className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
                  >
                    Marquer comme Examinée
                  </button>
                )}
                {(selectedAlert.status === 'pending' || selectedAlert.status === 'reviewed') && (
                  <button
                    onClick={() => handleUpdateStatus(selectedAlert.id, 'resolved')}
                    className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors"
                  >
                    Marquer comme Résolue
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityAlertsPanel;
