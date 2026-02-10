import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, FileText, Phone, User, Car, Shield, Clock, X, AlertTriangle, Calendar, Hash, Mail } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../firebase';
import { maskPhoneNumber } from '../lib/phoneUtils';
import DemDemModal from './DemDemModal';
import ConfirmModal from './ConfirmModal';

interface Driver {
  uid: string;
  firstName: string;
  lastName: string;
  phone: string;
  licenseNumber?: string;
  licenseUrl: string;
  insuranceUrl: string;
  carteGriseUrl: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: string;
  vehiclePlateNumber: string;
  vehicleSeats: number;
  vehiclePhotoUrl: string;
  status: string;
  role: string;
  silo: string;
  silo_id: string;
  createdAt: number;
  rejectionReason?: string;
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

  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      console.log('[FIRESTORE] Loading drivers from Firestore...');
      setLoading(true);
      const driversRef = collection(firestore, 'drivers');
      const snapshot = await getDocs(driversRef);

      console.log('[FIRESTORE] Total drivers found:', snapshot.size);

      const driversList: Driver[] = [];

      snapshot.forEach((docSnapshot) => {
        const driver = docSnapshot.data();
        console.log('[FIRESTORE] Driver data:', docSnapshot.id, driver);

        if (driver.verified === false || driver.status === 'pending_verification') {
          driversList.push({
            ...driver,
            uid: docSnapshot.id,
            firstName: driver.firstName || '',
            lastName: driver.lastName || '',
            full_name: driver.full_name || `${driver.firstName || ''} ${driver.lastName || ''}`,
            email: driver.email || '',
            phone: driver.phone || '',
            driver_license: driver.driver_license || driver.licenseUrl || '',
            vehicle_insurance: driver.vehicle_insurance || driver.insuranceUrl || '',
            national_id: driver.national_id || driver.carteGriseUrl || '',
            vehicle_type: driver.vehicle_type || driver.vehicleBrand || '',
            vehicle_model: driver.vehicle_model || driver.vehicleModel || '',
            plate_number: driver.plate_number || driver.vehiclePlateNumber || '',
            status: driver.status || 'pending_verification',
            role: driver.role || 'driver_pending',
            silo: driver.silo || 'voyage',
            silo_id: driver.silo_id || 'voyage',
            createdAt: driver.createdAt || Date.now(),
          } as Driver);
        }
      });

      console.log('[FIRESTORE] Pending drivers found:', driversList.length);

      driversList.sort((a, b) => b.createdAt - a.createdAt);

      setDrivers(driversList);
    } catch (error) {
      console.error('[FIRESTORE] Error loading drivers:', error);
      setDrivers([]);
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
      const driverRef = doc(firestore, 'drivers', driverToApprove.uid);
      await updateDoc(driverRef, {
        verified: true,
        status: 'verified',
        role: 'driver',
        silo_id: 'voyage',
        verified_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      });

      setSuccessModal({
        isOpen: true,
        title: 'Compte Validé avec Succès !',
        message: `${driverToApprove.firstName} ${driverToApprove.lastName} a été approuvé. Le compte chauffeur est maintenant actif sur Allo Dakar.`,
      });

      setSelectedDriver(null);
      setDriverToApprove(null);
      loadDrivers();
    } catch (error: any) {
      console.error('[FIRESTORE] Error approving driver:', error);
      setErrorModal({
        isOpen: true,
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
      setErrorModal({
        isOpen: true,
        title: 'Motif requis',
        message: 'Veuillez préciser le motif du rejet (ex: Photo du permis illisible).',
      });
      return;
    }

    setProcessing(true);
    setRejectionModal({ isOpen: false, driverId: null, driverName: '' });

    try {
      const driverRef = doc(firestore, 'drivers', rejectionModal.driverId);
      await updateDoc(driverRef, {
        verified: false,
        status: 'rejected',
        role: 'driver_rejected',
        rejection_reason: rejectionReason,
        rejected_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      });

      setSuccessModal({
        isOpen: true,
        title: 'Chauffeur rejeté',
        message: `Le compte a été rejeté. Motif: ${rejectionReason}`,
      });

      setSelectedDriver(null);
      setRejectionReason('');
      loadDrivers();
    } catch (error: any) {
      console.error('[FIRESTORE] Error rejecting driver:', error);
      setErrorModal({
        isOpen: true,
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
              Aucune demande en attente pour DemDem
            </h3>
            <p className="text-white/60">
              Toutes les demandes de chauffeurs ont été traitées
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
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleApproveClick(driver)}
                      className="px-6 py-2.5 bg-[#FF6B00] hover:bg-[#E55F00] text-black rounded-lg transition-all font-bold flex items-center justify-center gap-2 shadow-lg whitespace-nowrap"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approuver
                    </button>
                    <button
                      onClick={() => handleRejectClick(driver)}
                      className="px-6 py-2.5 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white rounded-lg transition-all font-bold flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <XCircle className="w-4 h-4" />
                      Rejeter
                    </button>
                    <button
                      onClick={() => setSelectedDriver(driver)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 text-sm whitespace-nowrap"
                    >
                      <Eye className="w-4 h-4" />
                      Détails
                    </button>
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
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

      {/* Modales de succès et erreur */}
      <DemDemModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false, title: '', message: '' })}
        title={successModal.title}
        message={successModal.message}
        type="success"
        confirmText="OK"
      />

      <DemDemModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, title: '', message: '' })}
        title={errorModal.title}
        message={errorModal.message}
        type="error"
        confirmText="OK"
      />
    </>
  );
}
