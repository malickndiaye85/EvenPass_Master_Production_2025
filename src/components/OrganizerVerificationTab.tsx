import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, FileText, Phone, Mail, Building2, Wallet, Clock, X } from 'lucide-react';
import { ref, get, update, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../firebase';
import { maskPhoneNumber } from '../lib/phoneUtils';

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
  created_at: string;
  full_name?: string;
  email?: string;
  phone?: string;
}

export default function OrganizerVerificationTab() {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrganizer, setSelectedOrganizer] = useState<Organizer | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadOrganizers();
  }, []);

  const loadOrganizers = async () => {
    try {
      const organizersRef = ref(db, 'organizers');
      const snapshot = await get(organizersRef);

      if (snapshot.exists()) {
        const organizersData = snapshot.val();
        const organizersList: Organizer[] = [];

        for (const userId in organizersData) {
          const organizer = organizersData[userId];

          if (organizer.verification_status === 'pending') {
            const userRef = ref(db, `users/${userId}`);
            const userSnapshot = await get(userRef);
            const userData = userSnapshot.val();

            organizersList.push({
              ...organizer,
              uid: userId,
              full_name: userData?.full_name || '',
              email: userData?.email || '',
              phone: userData?.phone || '',
            });
          }
        }

        organizersList.sort((a, b) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        setOrganizers(organizersList);
      } else {
        setOrganizers([]);
      }
    } catch (error) {
      console.error('[FIREBASE] Error loading organizers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (organizerId: string) => {
    if (!confirm('✅ Approuver cet organisateur ? Il pourra créer des événements immédiatement.')) {
      return;
    }

    setProcessing(true);
    try {
      const organizerRef = ref(db, `organizers/${organizerId}`);
      await update(organizerRef, {
        verification_status: 'verified',
        is_active: true,
        updated_at: new Date().toISOString(),
      });

      alert('✅ Organisateur approuvé avec succès!');
      setSelectedOrganizer(null);
      loadOrganizers();
    } catch (error: any) {
      console.error('[FIREBASE] Error approving organizer:', error);
      alert('❌ Erreur: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (organizerId: string) => {
    if (!rejectionReason.trim()) {
      alert('⚠️ Veuillez fournir une raison pour le refus');
      return;
    }

    if (!confirm('❌ Rejeter cet organisateur ? Il sera notifié par email.')) {
      return;
    }

    setProcessing(true);
    try {
      const organizerRef = ref(db, `organizers/${organizerId}`);
      await update(organizerRef, {
        verification_status: 'rejected',
        is_active: false,
        rejection_reason: rejectionReason,
        updated_at: new Date().toISOString(),
      });

      alert('❌ Organisateur rejeté');
      setSelectedOrganizer(null);
      setRejectionReason('');
      loadOrganizers();
    } catch (error: any) {
      console.error('[FIREBASE] Error rejecting organizer:', error);
      alert('❌ Erreur: ' + error.message);
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
        <h3 className="text-xl font-bold text-white mb-2">Aucune demande en attente</h3>
        <p className="text-[#B5B5B5]">Toutes les demandes d'organisateurs ont été traitées</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          Vérification des Organisateurs ({organizers.length})
        </h2>
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

              <button
                onClick={() => setSelectedOrganizer(organizer)}
                className="px-4 py-2 bg-[#FF5F05] hover:bg-[#FF7A00] text-white rounded-lg transition-colors font-bold flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Examiner
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedOrganizer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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

                <div className="space-y-4">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <button
                      onClick={() => handleApprove(selectedOrganizer.uid)}
                      disabled={processing}
                      className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approuver l'organisateur
                    </button>
                    <p className="text-xs text-green-500 mt-2">
                      L'organisateur pourra créer des événements immédiatement
                    </p>
                  </div>

                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Raison du refus (obligatoire)"
                      rows={3}
                      className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-white placeholder-[#B5B5B5] focus:outline-none focus:border-red-500 mb-3"
                    />
                    <button
                      onClick={() => handleReject(selectedOrganizer.uid)}
                      disabled={processing || !rejectionReason.trim()}
                      className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Rejeter la demande
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
