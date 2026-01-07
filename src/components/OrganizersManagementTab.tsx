import { useState, useEffect } from 'react';
import { Users, Ban, Trash2, CheckCircle, XCircle, Eye, Search, Filter } from 'lucide-react';
import { ref, get, update, remove } from 'firebase/database';
import { db } from '../firebase';
import { maskPhoneNumber } from '../lib/phoneUtils';
import ConfirmModal from './ConfirmModal';

interface Organizer {
  uid: string;
  user_id: string;
  organization_name: string;
  organization_type: string;
  description: string | null;
  verification_status: 'pending' | 'verified' | 'rejected' | 'suspended' | 'banned';
  contact_email: string;
  contact_phone: string;
  website: string | null;
  city: string | null;
  total_events_created: number;
  total_tickets_sold: number;
  is_active: boolean;
  created_at: string;
}

type ActionType = 'suspend' | 'activate' | 'ban' | 'delete' | null;

export default function OrganizersManagementTab() {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrganizer, setSelectedOrganizer] = useState<Organizer | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadOrganizers();
  }, []);

  const loadOrganizers = async () => {
    try {
      const organizersSnapshot = await get(ref(db, 'organizers'));
      if (organizersSnapshot.exists()) {
        const organizersData = organizersSnapshot.val();
        const organizersList = Object.entries(organizersData).map(([id, data]: [string, any]) => ({
          uid: id,
          ...data
        }));
        setOrganizers(organizersList);
      }
    } catch (error) {
      console.error('Error loading organizers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (organizer: Organizer, action: ActionType) => {
    setSelectedOrganizer(organizer);
    setActionType(action);
    setShowConfirmModal(true);
  };

  const confirmAction = async () => {
    if (!selectedOrganizer || !actionType) return;

    setProcessing(true);
    try {
      const organizerRef = ref(db, `organizers/${selectedOrganizer.uid}`);

      switch (actionType) {
        case 'suspend':
          await update(organizerRef, {
            verification_status: 'suspended',
            is_active: false,
            updated_at: new Date().toISOString()
          });
          break;
        case 'activate':
          await update(organizerRef, {
            verification_status: 'verified',
            is_active: true,
            updated_at: new Date().toISOString()
          });
          break;
        case 'ban':
          await update(organizerRef, {
            verification_status: 'banned',
            is_active: false,
            updated_at: new Date().toISOString()
          });
          break;
        case 'delete':
          await remove(organizerRef);
          break;
      }

      await loadOrganizers();
    } catch (error) {
      console.error('Error performing action:', error);
      alert('Erreur lors de l\'action. Veuillez réessayer.');
    } finally {
      setProcessing(false);
      setShowConfirmModal(false);
      setSelectedOrganizer(null);
      setActionType(null);
    }
  };

  const filteredOrganizers = organizers.filter(org => {
    const matchesSearch = org.organization_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.contact_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || org.verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-600/20', text: 'text-yellow-400', label: 'En attente' },
      verified: { bg: 'bg-green-600/20', text: 'text-green-400', label: 'Vérifié' },
      rejected: { bg: 'bg-red-600/20', text: 'text-red-400', label: 'Rejeté' },
      suspended: { bg: 'bg-orange-600/20', text: 'text-orange-400', label: 'Suspendu' },
      banned: { bg: 'bg-red-600/20', text: 'text-red-400', label: 'Banni' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-3 py-1 rounded-lg ${badge.bg} ${badge.text} text-xs font-bold`}>
        {badge.label}
      </span>
    );
  };

  const getActionModalContent = () => {
    if (!actionType) return { title: '', message: '', type: 'warning' as const };

    const contents: Record<string, { title: string; message: string; type: 'danger' | 'warning' | 'info' }> = {
      suspend: {
        title: 'Suspendre l\'organisateur',
        message: `Êtes-vous sûr de vouloir suspendre ${selectedOrganizer?.organization_name} ? L'organisateur ne pourra plus créer d'événements.`,
        type: 'warning'
      },
      activate: {
        title: 'Activer l\'organisateur',
        message: `Êtes-vous sûr de vouloir activer ${selectedOrganizer?.organization_name} ? L'organisateur pourra créer des événements.`,
        type: 'info'
      },
      ban: {
        title: 'Bannir l\'organisateur',
        message: `Êtes-vous sûr de vouloir bannir définitivement ${selectedOrganizer?.organization_name} ? Cette action est permanente.`,
        type: 'danger'
      },
      delete: {
        title: 'Supprimer l\'organisateur',
        message: `Êtes-vous sûr de vouloir supprimer ${selectedOrganizer?.organization_name} ? Cette action est irréversible et supprimera toutes les données.`,
        type: 'danger'
      },
    };

    return contents[actionType];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const modalContent = getActionModalContent();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Gestion des Organisateurs</h2>
            <p className="text-[#B5B5B5] text-sm">{organizers.length} organisateurs enregistrés</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#B5B5B5]" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl text-white placeholder-[#B5B5B5] focus:border-cyan-600 focus:outline-none"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#B5B5B5]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-12 pr-8 py-3 bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl text-white focus:border-cyan-600 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="all">Tous les statuts</option>
            <option value="verified">Vérifiés</option>
            <option value="pending">En attente</option>
            <option value="suspended">Suspendus</option>
            <option value="banned">Bannis</option>
            <option value="rejected">Rejetés</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2A2A2A]">
              <th className="text-left py-4 px-4 text-[#B5B5B5] font-bold text-sm">Organisation</th>
              <th className="text-left py-4 px-4 text-[#B5B5B5] font-bold text-sm">Contact</th>
              <th className="text-left py-4 px-4 text-[#B5B5B5] font-bold text-sm">Statut</th>
              <th className="text-left py-4 px-4 text-[#B5B5B5] font-bold text-sm">Événements</th>
              <th className="text-left py-4 px-4 text-[#B5B5B5] font-bold text-sm">Billets vendus</th>
              <th className="text-right py-4 px-4 text-[#B5B5B5] font-bold text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrganizers.map((org) => (
              <tr key={org.uid} className="border-b border-[#2A2A2A] hover:bg-[#1F1F1F] transition-colors">
                <td className="py-4 px-4">
                  <div>
                    <p className="text-white font-bold">{org.organization_name}</p>
                    <p className="text-[#B5B5B5] text-xs">{org.organization_type}</p>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm">
                    <p className="text-white">{org.contact_email}</p>
                    <p className="text-[#B5B5B5]">{maskPhoneNumber(org.contact_phone)}</p>
                  </div>
                </td>
                <td className="py-4 px-4">
                  {getStatusBadge(org.verification_status)}
                </td>
                <td className="py-4 px-4">
                  <p className="text-white font-bold">{org.total_events_created || 0}</p>
                </td>
                <td className="py-4 px-4">
                  <p className="text-white font-bold">{org.total_tickets_sold || 0}</p>
                </td>
                <td className="py-4 px-4">
                  <div className="flex justify-end gap-2">
                    {org.is_active ? (
                      <button
                        onClick={() => handleAction(org, 'suspend')}
                        className="p-2 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 rounded-lg transition-colors"
                        title="Suspendre"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction(org, 'activate')}
                        className="p-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors"
                        title="Activer"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleAction(org, 'ban')}
                      className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                      title="Bannir"
                    >
                      <Ban className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleAction(org, 'delete')}
                      className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredOrganizers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-[#B5B5B5] mx-auto mb-4" />
          <p className="text-[#B5B5B5] text-lg">Aucun organisateur trouvé</p>
        </div>
      )}

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmAction}
        title={modalContent.title}
        message={modalContent.message}
        type={modalContent.type}
        confirmText={processing ? 'Traitement...' : 'Confirmer'}
        cancelText="Annuler"
        isDark={true}
      />
    </div>
  );
}
