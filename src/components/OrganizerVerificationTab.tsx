import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, FileText, Phone, Mail, Building2, Wallet, Clock, X, AlertTriangle } from 'lucide-react';
import { firestore } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { maskPhoneNumber } from '../lib/phoneUtils';
import DemDemModal from './DemDemModal';
import ConfirmModal from './ConfirmModal';

interface Organizer {
  uid: string;
  user_id: string;
  organization_name: string;
  organization_type: string;
  description: string | null;
  verification_status: string;
  verification_documents: any;
  contact_email: string;
  contact_phone: string;
  website: string | null;
  city: string | null;
  bank_account_info: any;
  silo_id: string;
  created_at: string;
  full_name?: string;
  email?: string;
  phone?: string;
}

interface RejectionModalState {
  isOpen: boolean;
  organizerId: string | null;
  organizerName: string;
}

export default function OrganizerVerificationTab() {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrganizer, setSelectedOrganizer] = useState<Organizer | null>(null);
  const [processing, setProcessing] = useState(false);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [organizerToApprove, setOrganizerToApprove] = useState<Organizer | null>(null);

  const [rejectionModal, setRejectionModal] = useState<RejectionModalState>({
    isOpen: false,
    organizerId: null,
    organizerName: '',
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
    loadOrganizers();
  }, []);

  const loadOrganizers = async () => {
    try {
      console.log('[FIRESTORE] Loading organizers from Firestore...');
      const organizersRef = collection(firestore, 'organizers');
      const snapshot = await getDocs(organizersRef);

      console.log('[FIRESTORE] Total organizers found:', snapshot.size);

      const organizersList: Organizer[] = [];

      snapshot.forEach((docSnapshot) => {
        const organizer = docSnapshot.data();
        console.log('[FIRESTORE] Organizer data:', docSnapshot.id, organizer);

        if (organizer.verified === false || organizer.status === 'pending') {
          organizersList.push({
            ...organizer,
            uid: docSnapshot.id,
            user_id: docSnapshot.id,
            organization_name: organizer.organization_name || organizer.contact_name || 'Organisation',
            organization_type: organizer.organization_type || 'Entreprise',
            description: organizer.description || null,
            verification_status: 'pending',
            verification_documents: organizer.verification_documents || {},
            contact_email: organizer.contact_email || organizer.email || '',
            contact_phone: organizer.contact_phone || organizer.phone || '',
            website: organizer.website || null,
            city: organizer.city || organizer.address || null,
            bank_account_info: organizer.bank_account_info || {},
            silo_id: 'evenement',
            created_at: organizer.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
            full_name: organizer.contact_name || organizer.full_name || '',
            email: organizer.email || '',
            phone: organizer.phone || '',
          } as Organizer);
        }
      });

      console.log('[FIRESTORE] Pending organizers found:', organizersList.length);

      organizersList.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setOrganizers(organizersList);
    } catch (error) {
      console.error('[FIRESTORE] Error loading organizers:', error);
      setOrganizers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (organizer: Organizer) => {
    window.alert('🔍 CLIC DÉTECTÉ sur Approuver pour : ' + organizer.organization_name);
    console.log('[DEBUG] Click detected on Approve button', organizer);
    setOrganizerToApprove(organizer);
    setShowApproveModal(true);
  };

  const handleApproveConfirm = async () => {
    console.log('[DEBUG] handleApproveConfirm CALLED');
    window.alert('🚀 CONFIRMATION VALIDÉE - Début du traitement Firestore');

    if (!organizerToApprove) {
      window.alert('❌ ERREUR : Aucun organisateur sélectionné');
      console.error('[ERROR] organizerToApprove is null');
      return;
    }

    console.log('[DEBUG] Setting processing to true');
    setProcessing(true);

    console.log('[DEBUG] Closing approve modal');
    setShowApproveModal(false);

    try {
      console.log('[FIRESTORE] Tentative de mise à jour Firestore pour ID:', organizerToApprove.uid);
      console.log('[FIRESTORE] Firestore instance:', firestore);

      const organizerRef = doc(firestore, 'organizers', organizerToApprove.uid);
      console.log('[FIRESTORE] Document reference created:', organizerRef);

      const updateData = {
        verified: true,
        status: 'active',
        silo_id: 'evenement',
        verified_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      };
      console.log('[FIRESTORE] Update data:', updateData);

      await updateDoc(organizerRef, updateData);

      console.log('[FIRESTORE] ✅ Organizer approved successfully');
      window.alert('✅ SUCCÈS : Organisateur approuvé dans Firestore');

      setSuccessModal({
        isOpen: true,
        title: 'Compte Validé avec Succès !',
        message: `${organizerToApprove.organization_name} a été approuvé. Le compte organisateur est maintenant actif et peut créer des événements.`,
      });

      setSelectedOrganizer(null);
      setOrganizerToApprove(null);
      loadOrganizers();
    } catch (error: any) {
      console.error('[FIRESTORE] ❌ Error approving organizer:', error);
      console.error('[FIRESTORE] Full error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      const errorMessage = `❌ ERREUR FIRESTORE

Code: ${error.code || 'unknown'}
Message: ${error.message || 'Erreur inconnue'}

Vérifiez :
1. Les règles Firestore
2. La connexion Firebase
3. Les permissions du compte

Stack: ${error.stack?.substring(0, 200) || 'N/A'}`;

      window.alert(errorMessage);

      setErrorModal({
        isOpen: true,
        title: 'Erreur Firebase',
        message: errorMessage,
      });
    } finally {
      console.log('[DEBUG] Setting processing to false');
      setProcessing(false);
    }
  };

  const handleRejectClick = (organizer: Organizer) => {
    setRejectionModal({
      isOpen: true,
      organizerId: organizer.uid,
      organizerName: organizer.organization_name,
    });
    setRejectionReason('');
  };

  const handleRejectConfirm = async () => {
    if (!rejectionModal.organizerId) return;

    if (!rejectionReason.trim()) {
      setErrorModal({
        isOpen: true,
        title: 'Motif requis',
        message: 'Veuillez préciser le motif du rejet (ex: Documents incomplets).',
      });
      return;
    }

    setProcessing(true);
    setRejectionModal({ isOpen: false, organizerId: null, organizerName: '' });

    try {
      const organizerRef = doc(firestore, 'organizers', rejectionModal.organizerId);
      await updateDoc(organizerRef, {
        verified: false,
        status: 'rejected',
        rejection_reason: rejectionReason,
        rejected_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      });

      setSuccessModal({
        isOpen: true,
        title: 'Organisateur rejeté',
        message: `Le compte a été rejeté. Motif: ${rejectionReason}`,
      });

      setSelectedOrganizer(null);
      setRejectionReason('');
      loadOrganizers();
    } catch (error: any) {
      console.error('[FIRESTORE] Error rejecting organizer:', error);
      setErrorModal({
        isOpen: true,
        title: 'Erreur',
        message: error.message || 'Une erreur est survenue lors du rejet.',
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-[#FF5F05] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (organizers.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Aucune demande en attente pour DemDem</h3>
        <p className="text-[#B5B5B5]">Toutes les demandes d'organisateurs ont été traitées</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white mb-2">
            🎫 Validation des Organisateurs (SILO ÉVÉNEMENT)
          </h2>
          <p className="text-white/60">
            {organizers.length} organisateur{organizers.length !== 1 ? 's' : ''} en attente de validation
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {organizers.map((organizer) => (
          <div
            key={organizer.uid}
            className="bg-[#0F0F0F] rounded-xl p-6 border border-[#2A2A2A] hover:border-[#FF5F05]/30 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Building2 className="w-5 h-5 text-[#FF5F05]" />
                  <h3 className="text-xl font-bold text-white">{organizer.organization_name}</h3>
                  <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-xs font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    EN ATTENTE
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#B5B5B5]" />
                    <span className="text-[#B5B5B5]">{organizer.contact_email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#B5B5B5]" />
                    <span className="text-[#B5B5B5]">{maskPhoneNumber(organizer.contact_phone)}</span>
                  </div>
                </div>

                <div className="text-sm text-[#B5B5B5]">
                  Type: <span className="text-white font-medium">{organizer.organization_type}</span>
                  {' • '}
                  Demande: <span className="text-white font-medium">{formatDate(organizer.created_at)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleApproveClick(organizer)}
                  disabled={processing}
                  className="px-6 py-2.5 bg-[#FF6B00] hover:bg-[#E55F00] text-black rounded-lg transition-all font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      Validation...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Approuver
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleRejectClick(organizer)}
                  disabled={processing}
                  className="px-6 py-2.5 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white rounded-lg transition-all font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Traitement...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Rejeter
                    </>
                  )}
                </button>
                <button
                  onClick={() => setSelectedOrganizer(organizer)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 text-sm"
                >
                  <Eye className="w-4 h-4" />
                  Détails
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedOrganizer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-[#2A2A2A] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#2A2A2A] border-b border-[#0F0F0F] p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Building2 className="w-6 h-6 text-[#FF5F05]" />
                Vérification Organisateur
              </h2>
              <button
                onClick={() => setSelectedOrganizer(null)}
                className="p-2 hover:bg-[#0F0F0F] rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-[#B5B5B5]" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Informations Organisation</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[#B5B5B5]">Nom de l'organisation</p>
                      <p className="text-white font-medium">{selectedOrganizer.organization_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#B5B5B5]">Type</p>
                      <p className="text-white font-medium">{selectedOrganizer.organization_type}</p>
                    </div>
                  </div>

                  {selectedOrganizer.city && (
                    <div>
                      <p className="text-sm text-[#B5B5B5]">Ville</p>
                      <p className="text-white">{selectedOrganizer.city}</p>
                    </div>
                  )}

                  {selectedOrganizer.description && (
                    <div>
                      <p className="text-sm text-[#B5B5B5]">Description</p>
                      <p className="text-white">{selectedOrganizer.description}</p>
                    </div>
                  )}

                  {selectedOrganizer.website && (
                    <div>
                      <p className="text-sm text-[#B5B5B5]">Site web</p>
                      <a href={selectedOrganizer.website} target="_blank" rel="noopener noreferrer" className="text-[#FF5F05] hover:underline">
                        {selectedOrganizer.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-[#0F0F0F] pt-6">
                <h3 className="text-lg font-bold text-white mb-4">Contact</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[#B5B5B5]">Nom du responsable</p>
                      <p className="text-white font-medium">{selectedOrganizer.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#B5B5B5]">Email</p>
                      <p className="text-white font-medium">{selectedOrganizer.contact_email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[#B5B5B5]">Téléphone</p>
                      <p className="text-white font-medium">{selectedOrganizer.contact_phone}</p>
                      <p className="text-[#B5B5B5] text-xs mt-1">Masqué : {maskPhoneNumber(selectedOrganizer.contact_phone)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#0F0F0F] pt-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[#FF5F05]" />
                  Informations de paiement
                </h3>
                <div className="bg-[#0F0F0F] rounded-lg p-4">
                  <p className="text-sm text-[#B5B5B5] mb-2">Opérateur Mobile Money</p>
                  <p className="text-white font-medium">{selectedOrganizer.bank_account_info?.provider || 'Non renseigné'}</p>
                  <p className="text-sm text-[#B5B5B5] mt-3 mb-2">Numéro Marchand</p>
                  <p className="text-white font-medium">{selectedOrganizer.bank_account_info?.phone || 'Non renseigné'}</p>
                  <p className="text-xs text-[#FF8C42] mt-3">
                    ⚠️ Les reversements se feront sur ce numéro
                  </p>
                </div>
              </div>

              {selectedOrganizer.verification_documents && Object.keys(selectedOrganizer.verification_documents).length > 0 && (
                <div className="border-t border-[#0F0F0F] pt-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#FF5F05]" />
                    Documents KYC
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedOrganizer.verification_documents.cni && (
                      <a
                        href={selectedOrganizer.verification_documents.cni}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 bg-[#0F0F0F] rounded-lg hover:bg-[#0F0F0F]/50 transition-colors flex items-center gap-3"
                      >
                        <FileText className="w-5 h-5 text-[#FF5F05]" />
                        <div>
                          <p className="text-white font-medium">CNI</p>
                          <p className="text-xs text-[#B5B5B5]">Cliquer pour ouvrir</p>
                        </div>
                      </a>
                    )}
                    {selectedOrganizer.verification_documents.registre && (
                      <a
                        href={selectedOrganizer.verification_documents.registre}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 bg-[#0F0F0F] rounded-lg hover:bg-[#0F0F0F]/50 transition-colors flex items-center gap-3"
                      >
                        <FileText className="w-5 h-5 text-[#FF5F05]" />
                        <div>
                          <p className="text-white font-medium">Registre de commerce</p>
                          <p className="text-xs text-[#B5B5B5]">Cliquer pour ouvrir</p>
                        </div>
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t border-[#0F0F0F] pt-6">
                <h3 className="text-lg font-bold text-white mb-4">Actions</h3>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleApproveClick(selectedOrganizer)}
                    disabled={processing}
                    className="flex-1 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approuver
                  </button>
                  <button
                    onClick={() => handleRejectClick(selectedOrganizer)}
                    disabled={processing}
                    className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Rejeter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale de confirmation d'approbation */}
      {showApproveModal && organizerToApprove && (
        <ConfirmModal
          isOpen={true}
          title="Approuver cet organisateur ?"
          message={`Êtes-vous sûr de vouloir approuver ${organizerToApprove.organization_name} ? Il pourra créer des événements immédiatement.`}
          onConfirm={handleApproveConfirm}
          onClose={() => {
            setShowApproveModal(false);
            setOrganizerToApprove(null);
          }}
          confirmText="Approuver"
          type="success"
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
                <h3 className="text-xl font-bold text-white">Rejeter cet organisateur</h3>
                <p className="text-sm text-white/60">{rejectionModal.organizerName}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-white/80 mb-2">
                Motif du rejet *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Documents incomplets, informations incorrectes, NINEA invalide..."
                rows={4}
                className="w-full px-4 py-3 bg-[#1E293B] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-red-500/50 transition-all resize-none"
              />
              <p className="text-xs text-white/50 mt-2">
                Ce motif sera enregistré et pourra être consulté par l'organisateur.
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
                  setRejectionModal({ isOpen: false, organizerId: null, organizerName: '' });
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
    </div>
  );
}
