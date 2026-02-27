import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Eye, Clock, XCircle, Calendar, User, Phone, Bus, Image as ImageIcon } from 'lucide-react';
import { ref, onValue, update, remove } from 'firebase/database';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

interface ExpressSubscriber {
  id: string;
  subscription_number: string;
  holder_name: string;
  holder_phone: string;
  photo_url: string;
  subscription_type: 'weekly' | 'monthly' | 'quarterly';
  line_name: string;
  line_id: string;
  bus_type: 'eco' | 'confort';
  start_date: string;
  end_date: string;
  amount_paid: number;
  payment_status: 'pending' | 'paid';
  created_at: number;
  qr_code: string;
  status: 'active' | 'expired' | 'revoked';
}

interface Props {
  transportLines: Array<{
    id: string;
    name: string;
    route: string;
  }>;
}

const ExpressSubscribersManager: React.FC<Props> = ({ transportLines }) => {
  const navigate = useNavigate();
  const [subscribers, setSubscribers] = useState<ExpressSubscriber[]>([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState<ExpressSubscriber[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLine, setSelectedLine] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'revoke' | 'extend';
    subscriberId: string;
    subscriberName: string;
  } | null>(null);

  useEffect(() => {
    loadSubscribers();
  }, []);

  useEffect(() => {
    filterSubscribers();
  }, [subscribers, searchQuery, selectedLine, selectedStatus]);

  const loadSubscribers = () => {
    if (!db) return;

    const subscribersRef = ref(db, 'user_subscriptions');
    const unsubscribe = onValue(subscribersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const subscribersArray: ExpressSubscriber[] = Object.keys(data).map(key => {
          const sub = data[key];
          const status = calculateStatus(sub.end_date, sub.status);
          return {
            id: key,
            ...sub,
            status
          };
        });
        setSubscribers(subscribersArray);
      } else {
        setSubscribers([]);
      }
      setLoading(false);
    });

    return unsubscribe;
  };

  const calculateStatus = (endDate: string, currentStatus?: string): 'active' | 'expired' | 'revoked' => {
    if (currentStatus === 'revoked') return 'revoked';
    const now = new Date();
    const end = new Date(endDate);
    return end >= now ? 'active' : 'expired';
  };

  const getDaysRemaining = (endDate: string): number => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filterSubscribers = () => {
    let filtered = [...subscribers];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sub =>
        sub.holder_name.toLowerCase().includes(query) ||
        sub.holder_phone.includes(query) ||
        sub.subscription_number.toLowerCase().includes(query)
      );
    }

    if (selectedLine !== 'all') {
      filtered = filtered.filter(sub => sub.line_id === selectedLine);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(sub => sub.status === selectedStatus);
    }

    setFilteredSubscribers(filtered);
  };

  const handleRevokeSubscription = async (subscriberId: string) => {
    if (!db) return;

    try {
      const subscriberRef = ref(db, `user_subscriptions/${subscriberId}`);
      await update(subscriberRef, {
        status: 'revoked',
        revoked_at: Date.now()
      });
      setShowConfirmModal(false);
      setConfirmAction(null);
    } catch (error) {
      console.error('Erreur lors de la révocation:', error);
      alert('Erreur lors de la révocation de l\'abonnement');
    }
  };

  const handleExtendSubscription = async (subscriberId: string) => {
    if (!db) return;

    try {
      const subscriber = subscribers.find(s => s.id === subscriberId);
      if (!subscriber) return;

      const currentEndDate = new Date(subscriber.end_date);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + 7);

      const subscriberRef = ref(db, `user_subscriptions/${subscriberId}`);
      await update(subscriberRef, {
        end_date: newEndDate.toISOString().split('T')[0],
        extended_at: Date.now(),
        extension_days: 7
      });
      setShowConfirmModal(false);
      setConfirmAction(null);
    } catch (error) {
      console.error('Erreur lors de la prolongation:', error);
      alert('Erreur lors de la prolongation de l\'abonnement');
    }
  };

  const handleViewCard = (subscriber: ExpressSubscriber) => {
    localStorage.setItem('temp_subscription_view', JSON.stringify(subscriber));
    navigate(`/pass/card?sub=${subscriber.subscription_number}`);
  };

  const getStatusBadge = (status: string, endDate: string) => {
    const daysRemaining = getDaysRemaining(endDate);

    if (status === 'revoked') {
      return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold border border-red-500/30">Révoqué</span>;
    }

    if (status === 'expired') {
      return <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-bold border border-gray-500/30">Expiré</span>;
    }

    if (daysRemaining <= 3) {
      return <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-bold border border-orange-500/30">Expire bientôt ({daysRemaining}j)</span>;
    }

    return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold border border-green-500/30">Actif ({daysRemaining}j)</span>;
  };

  const getSubscriptionTypeLabel = (type: string) => {
    const labels = {
      weekly: 'Hebdo (7j)',
      monthly: 'Mensuel (30j)',
      quarterly: 'Trimestriel (90j)'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getBusTypeLabel = (type: string) => {
    return type === 'confort' ? 'Confort' : 'Eco';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-3">
            <Bus className="w-7 h-7 text-blue-400" />
            Gestion des Abonnés Express
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Liste complète des abonnés DEM-DEM Express
          </p>
        </div>
        <div className="px-4 py-2 bg-blue-500/20 rounded-xl border border-blue-500/30">
          <div className="text-2xl font-bold text-blue-400">{filteredSubscribers.length}</div>
          <div className="text-xs text-gray-400">Abonnés</div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, numéro ou téléphone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#0f172a] border-2 border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <select
            value={selectedLine}
            onChange={(e) => setSelectedLine(e.target.value)}
            className="flex-1 px-4 py-3 bg-[#0f172a] border-2 border-gray-700/50 rounded-xl text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all"
          >
            <option value="all">Toutes les lignes</option>
            {transportLines.map(line => (
              <option key={line.id} value={line.id}>{line.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="flex-1 px-4 py-3 bg-[#0f172a] border-2 border-gray-700/50 rounded-xl text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="expired">Expirés</option>
            <option value="revoked">Révoqués</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-gray-400 mt-4">Chargement des abonnés...</p>
        </div>
      ) : filteredSubscribers.length === 0 ? (
        <div className="text-center py-12 bg-[#0f172a] rounded-xl border border-gray-700/50">
          <Bus className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Aucun abonné trouvé</p>
          <p className="text-sm text-gray-500 mt-2">
            {searchQuery || selectedLine !== 'all' || selectedStatus !== 'all'
              ? 'Essayez de modifier vos filtres'
              : 'Les abonnés DEM-DEM Express apparaîtront ici'}
          </p>
        </div>
      ) : (
        <div className="bg-[#0f172a] rounded-xl border border-gray-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1e293b] border-b border-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Photo</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Offre</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Ligne</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Validité</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filteredSubscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedImage(subscriber.photo_url);
                          setShowImageModal(true);
                        }}
                        className="relative group"
                      >
                        <img
                          src={subscriber.photo_url}
                          alt={subscriber.holder_name}
                          className="w-12 h-12 rounded-lg object-cover border-2 border-gray-700/50 group-hover:border-blue-400 transition-all"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-white" />
                        </div>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-white">{subscriber.holder_name}</div>
                        <div className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" />
                          {subscriber.holder_phone}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">#{subscriber.subscription_number}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-white">{getSubscriptionTypeLabel(subscriber.subscription_type)}</div>
                        <div className="text-sm text-gray-400 mt-1">Bus {getBusTypeLabel(subscriber.bus_type)}</div>
                        <div className="text-xs text-gray-500 mt-1">{subscriber.amount_paid.toLocaleString()} FCFA</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white font-medium">{subscriber.line_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {getStatusBadge(subscriber.status, subscriber.end_date)}
                        <div className="text-xs text-gray-400">
                          Expire le {new Date(subscriber.end_date).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewCard(subscriber)}
                          className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all border border-blue-500/30"
                          title="Afficher la carte"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {subscriber.status === 'active' && (
                          <>
                            <button
                              onClick={() => {
                                setConfirmAction({
                                  type: 'extend',
                                  subscriberId: subscriber.id,
                                  subscriberName: subscriber.holder_name
                                });
                                setShowConfirmModal(true);
                              }}
                              className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all border border-green-500/30"
                              title="Prolonger de 7 jours"
                            >
                              <Clock className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                setConfirmAction({
                                  type: 'revoke',
                                  subscriberId: subscriber.id,
                                  subscriberName: subscriber.holder_name
                                });
                                setShowConfirmModal(true);
                              }}
                              className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all border border-red-500/30"
                              title="Révoquer l'abonnement"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showImageModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowImageModal(false)}>
          <div className="relative max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImage}
              alt="Photo de l'abonné"
              className="max-w-full max-h-[90vh] rounded-xl"
            />
          </div>
        </div>
      )}

      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-xl border-2 border-gray-700/50 p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">
              {confirmAction.type === 'revoke' ? 'Révoquer l\'abonnement' : 'Prolonger l\'abonnement'}
            </h3>
            <p className="text-gray-400 mb-6">
              {confirmAction.type === 'revoke'
                ? `Êtes-vous sûr de vouloir révoquer l'abonnement de ${confirmAction.subscriberName} ? Cette action est irréversible.`
                : `Voulez-vous prolonger l'abonnement de ${confirmAction.subscriberName} de 7 jours supplémentaires ?`
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (confirmAction.type === 'revoke') {
                    handleRevokeSubscription(confirmAction.subscriberId);
                  } else {
                    handleExtendSubscription(confirmAction.subscriberId);
                  }
                }}
                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                  confirmAction.type === 'revoke'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                Confirmer
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                }}
                className="flex-1 py-3 px-4 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-xl font-bold transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpressSubscribersManager;
