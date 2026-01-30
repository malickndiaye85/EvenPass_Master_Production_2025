import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, FileText, Phone, Mail, User, Car, Shield, Clock, X, AlertTriangle } from 'lucide-react';
import { ref, get, update } from 'firebase/database';
import { db } from '../firebase';
import { maskPhoneNumber } from '../lib/phoneUtils';
import AlertModal from './AlertModal';
import ConfirmModal from './ConfirmModal';

interface Driver {
  uid: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  driver_license: string;
  vehicle_insurance: string;
  national_id: string;
  vehicle_type?: string;
  vehicle_model?: string;
  plate_number?: string;
  verification_status: string;
  silo_id: string;
  created_at: string;
}

interface RejectionModalState {
  isOpen: boolean;
  driverId: string | null;
  driverName: string;
}

export default function DriversVerificationTab() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [processing, setProcessing] = useState(false);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [driverToApprove, setDriverToApprove] = useState<Driver | null>(null);

  const [rejectionModal, setRejectionModal] = useState<RejectionModalState>({
    isOpen: false,
    driverId: null,
    driverName: '',
  });
  const [rejectionReason, setRejectionReason] = useState('');

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const driversRef = ref(db, 'drivers');
      const snapshot = await get(driversRef);

      if (snapshot.exists()) {
        const driversData = snapshot.val();
        const driversList: Driver[] = [];

        for (const userId in driversData) {
          const driver = driversData[userId];

          if (driver.verification_status === 'pending' && driver.role === 'driver_pending') {
            const userRef = ref(db, `users/${userId}`);
            const userSnapshot = await get(userRef);
            const userData = userSnapshot.val();

            driversList.push({
              ...driver,
              uid: userId,
              full_name: userData?.full_name || driver.full_name || '',
              email: userData?.email || driver.email || '',
              phone: userData?.phone || driver.phone || '',
              silo_id: 'voyage',
            });
          }
        }

        driversList.sort((a, b) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        setDrivers(driversList);
      } else {
        setDrivers([]);
      }
    } catch (error) {
      console.error('[FIREBASE] Error loading drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (driver: Driver) => {
    setDriverToApprove(driver);
    setShowApproveModal(true);
  };

  const handleApproveConfirm = async () => {
    if (!driverToApprove) return;

    setProcessing(true);
    setShowApproveModal(false);

    try {
      const driverRef = ref(db, `drivers/${driverToApprove.uid}`);
      await update(driverRef, {
        verification_status: 'verified',
        role: 'driver',
        is_active: true,
        silo_id: 'voyage',
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const userRef = ref(db, `users/${driverToApprove.uid}`);
      await update(userRef, {
        role: 'driver',
        silo_id: 'voyage',
      });

      setAlertModal({
        isOpen: true,
        type: 'success',
        title: 'Chauffeur approuvé',
        message: `${driverToApprove.full_name} a été approuvé avec succès. Il peut maintenant accéder à l'espace chauffeur DEM-DEM Express.`,
      });

      setSelectedDriver(null);
      setDriverToApprove(null);
      loadDrivers();
    } catch (error: any) {
      console.error('[FIREBASE] Error approving driver:', error);
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Erreur',
        message: error.message || 'Une erreur est survenue lors de l\'approbation.',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectClick = (driver: Driver) => {
    setRejectionModal({
      isOpen: true,
      driverId: driver.uid,
      driverName: driver.full_name,
    });
    setRejectionReason('');
  };

  const handleRejectConfirm = async () => {
    if (!rejectionModal.driverId) return;

    if (!rejectionReason.trim()) {
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Motif requis',
        message: 'Veuillez préciser le motif du rejet (ex: Photo du permis illisible).',
      });
      return;
    }

    setProcessing(true);
    setRejectionModal({ isOpen: false, driverId: null, driverName: '' });

    try {
      const driverRef = ref(db, `drivers/${rejectionModal.driverId}`);
      await update(driverRef, {
        verification_status: 'rejected',
        role: 'driver_rejected',
        rejection_reason: rejectionReason,
        rejected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const userRef = ref(db, `users/${rejectionModal.driverId}`);
      await update(userRef, {
        role: 'driver_rejected',
      });

      setAlertModal({
        isOpen: true,
        type: 'success',
        title: 'Chauffeur rejeté',
        message: `Le compte a été rejeté. Motif: ${rejectionReason}`,
      });

      setSelectedDriver(null);
      setRejectionReason('');
      loadDrivers();
    } catch (error: any) {
      console.error('[FIREBASE] Error rejecting driver:', error);
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Erreur',
        message: error.message || 'Une erreur est survenue lors du rejet.',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white mb-2">
              🚗 Validation des Chauffeurs (SILO VOYAGE)
            </h2>
            <p className="text-white/60">
              {drivers.length} chauffeur{drivers.length !== 1 ? 's' : ''} en attente de validation KYC
            </p>
          </div>
        </div>

        {drivers.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
            <CheckCircle className="w-16 h-16 text-[#10B981] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              Aucun chauffeur en attente
            </h3>
            <p className="text-white/60">
              Tous les chauffeurs ont été traités
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {drivers.map((driver) => (
              <div
                key={driver.uid}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#10B981]/20 flex items-center justify-center">
                      <Car className="w-6 h-6 text-[#10B981]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        {driver.full_name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {driver.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {maskPhoneNumber(driver.phone)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm font-semibold flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      En attente
                    </span>
                  </div>
                </div>

                {selectedDriver?.uid === driver.uid && (
                  <div className="border-t border-white/10 pt-4 mt-4 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-white/80 mb-2">
                          Type de véhicule
                        </label>
                        <p className="text-white">
                          {driver.vehicle_type || 'Non spécifié'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-white/80 mb-2">
                          Modèle
                        </label>
                        <p className="text-white">
                          {driver.vehicle_model || 'Non spécifié'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-white/80 mb-2">
                          Plaque d'immatriculation
                        </label>
                        <p className="text-white">
                          {driver.plate_number || 'Non spécifié'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-white/80">Documents KYC</h4>
                      <div className="grid md:grid-cols-3 gap-3">
                        {driver.driver_license && (
                          <a
                            href={driver.driver_license}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-3 bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] rounded-xl transition-all"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="text-sm font-semibold">Permis de conduire</span>
                          </a>
                        )}
                        {driver.vehicle_insurance && (
                          <a
                            href={driver.vehicle_insurance}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-3 bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] rounded-xl transition-all"
                          >
                            <Shield className="w-4 h-4" />
                            <span className="text-sm font-semibold">Assurance</span>
                          </a>
                        )}
                        {driver.national_id && (
                          <a
                            href={driver.national_id}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-3 bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] rounded-xl transition-all"
                          >
                            <User className="w-4 h-4" />
                            <span className="text-sm font-semibold">CNI</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => handleApproveClick(driver)}
                        disabled={processing}
                        className="flex-1 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Approuver
                      </button>
                      <button
                        onClick={() => handleRejectClick(driver)}
                        disabled={processing}
                        className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-5 h-5" />
                        Rejeter
                      </button>
                      <button
                        onClick={() => setSelectedDriver(null)}
                        className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {!selectedDriver && (
                  <button
                    onClick={() => setSelectedDriver(driver)}
                    className="w-full mt-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Voir les détails et valider
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modale de confirmation d'approbation */}
      {showApproveModal && driverToApprove && (
        <ConfirmModal
          title="Approuver ce chauffeur ?"
          message={`Êtes-vous sûr de vouloir approuver ${driverToApprove.full_name} ? Il pourra accéder à l'espace chauffeur DEM-DEM Express immédiatement.`}
          onConfirm={handleApproveConfirm}
          onCancel={() => {
            setShowApproveModal(false);
            setDriverToApprove(null);
          }}
          confirmText="Approuver"
          confirmColor="bg-[#10B981] hover:bg-[#059669]"
        />
      )}

      {/* Modale de rejet avec motif */}
      {rejectionModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Rejeter ce chauffeur</h3>
                <p className="text-sm text-white/60">{rejectionModal.driverName}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-white/80 mb-2">
                Motif du rejet *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Photo du permis illisible, documents expirés, informations incohérentes..."
                rows={4}
                className="w-full px-4 py-3 bg-[#1E293B] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-red-500/50 transition-all resize-none"
              />
              <p className="text-xs text-white/50 mt-2">
                Ce motif sera enregistré et pourra être consulté par le chauffeur.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRejectConfirm}
                disabled={processing || !rejectionReason.trim()}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Traitement...' : 'Confirmer le rejet'}
              </button>
              <button
                onClick={() => {
                  setRejectionModal({ isOpen: false, driverId: null, driverName: '' });
                  setRejectionReason('');
                }}
                disabled={processing}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale d'alerte */}
      {alertModal.isOpen && (
        <AlertModal
          type={alertModal.type}
          title={alertModal.title}
          message={alertModal.message}
          onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        />
      )}
    </>
  );
}
