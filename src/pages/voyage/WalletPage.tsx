import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Calendar, Zap, ShieldCheck, AlertCircle, Check } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useAuth } from '../../context/FirebaseAuthContext';
import { CustomModal } from '../../components/CustomModal';
import { samaPassService, SamaPassSubscription } from '../../lib/samaPassFirebase';

const SUBSCRIPTION_PRICES = {
  weekly: 5000,
  monthly: 15000
};

export const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SamaPassSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'info' as 'success' | 'error' | 'info' | 'confirm',
    title: '',
    message: '',
    onConfirm: undefined as (() => void) | undefined
  });

  useEffect(() => {
    loadSubscription();
  }, [user]);

  const loadSubscription = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const localData = samaPassService.loadFromLocalStorage(user.uid);
      if (localData) {
        setSubscription(localData);
        setLoading(false);
        return;
      }

      const activeSub = await samaPassService.getActiveSubscription(user.uid);
      if (activeSub) {
        setSubscription(activeSub);
        samaPassService.saveToLocalStorage(user.uid, activeSub);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (type: 'weekly' | 'monthly') => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Confirmer l\'achat',
      message: `Vous allez acheter un abonnement ${type === 'weekly' ? 'Hebdomadaire' : 'Mensuel'} pour ${SUBSCRIPTION_PRICES[type].toLocaleString()} FCFA. Continuer ?`,
      onConfirm: () => processPurchase(type)
    });
  };

  const processPurchase = async (type: 'weekly' | 'monthly') => {
    if (!user) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Non connecté',
        message: 'Vous devez être connecté pour acheter un abonnement'
      });
      return;
    }

    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newSub = await samaPassService.createSubscription(user.uid, type);

      if (!newSub) {
        throw new Error('Failed to create subscription');
      }

      samaPassService.saveToLocalStorage(user.uid, newSub);
      setSubscription(newSub);

      setModal({
        isOpen: true,
        type: 'success',
        title: 'Abonnement activé',
        message: 'Votre SAMA PASS est maintenant actif. Bon voyage !'
      });
    } catch (error) {
      console.error('Purchase error:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Erreur de paiement',
        message: 'Une erreur est survenue. Veuillez réessayer.'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDaysRemaining = () => {
    if (!subscription) return 0;
    const remaining = Math.ceil((subscription.endDate - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, remaining);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#1a2942] to-[#0A1628] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#1a2942] to-[#0A1628]">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/voyage')}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Retour</span>
        </button>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <CreditCard className="w-10 h-10 text-[#10B981]" />
              <h1 className="text-4xl font-bold text-white">SAMA PASS</h1>
            </div>
            <p className="text-white/70">
              Votre carte d'abonnement pour les navettes DEM-DEM Express
            </p>
          </div>

          {subscription ? (
            <div className="space-y-6">
              <div className="relative bg-gradient-to-br from-[#10B981] via-[#059669] to-[#047857] rounded-3xl p-8 shadow-2xl border border-white/10">
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-white text-xs font-semibold">VIP</span>
                </div>

                <div className="flex items-start justify-between mb-8">
                  <div>
                    <p className="text-white/80 text-sm mb-1">SAMA PASS</p>
                    <h2 className="text-white text-2xl font-bold">
                      {subscription.type === 'weekly' ? 'Hebdomadaire' : 'Mensuel'}
                    </h2>
                  </div>
                  <ShieldCheck className="w-8 h-8 text-white/90" />
                </div>

                <div className="bg-white rounded-2xl p-6 mb-6">
                  <div className="flex justify-center mb-3">
                    <QRCode
                      value={subscription.qrCode}
                      size={180}
                      level="H"
                      className="rounded-lg"
                    />
                  </div>
                  <p className="text-center text-xs text-gray-600 font-medium">
                    Code: {subscription.id}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-white">
                  <div>
                    <p className="text-white/70 text-xs mb-1">Début</p>
                    <p className="font-semibold">{formatDate(subscription.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-white/70 text-xs mb-1">Fin</p>
                    <p className="font-semibold">{formatDate(subscription.endDate)}</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-white/80" />
                      <span className="text-white font-medium">
                        {getDaysRemaining()} jour{getDaysRemaining() > 1 ? 's' : ''} restant{getDaysRemaining() > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="px-3 py-1 bg-white/20 rounded-full">
                      <span className="text-white text-xs font-bold">ACTIF</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-white/80 text-sm leading-relaxed">
                    <p className="font-semibold text-white mb-2">Informations importantes</p>
                    <ul className="space-y-1">
                      <li>• Pass strictement personnel - Non transférable</li>
                      <li>• Valide uniquement sur le réseau DEM-DEM Express</li>
                      <li>• Présentez votre QR Code au contrôleur lors de la montée</li>
                      <li>• Accessible hors ligne après chargement</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 text-center">
                <div className="w-20 h-20 bg-[#10B981]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CreditCard className="w-10 h-10 text-[#10B981]" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  Devenez Abonné
                </h2>
                <p className="text-white/70 mb-8">
                  Voyagez en toute liberté avec un abonnement illimité sur les navettes DEM-DEM Express
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl p-6 text-left hover:shadow-xl transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-[#10B981]/10 rounded-xl flex items-center justify-center">
                        <Zap className="w-6 h-6 text-[#10B981]" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Hebdomadaire</h3>
                        <p className="text-sm text-gray-500">7 jours</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-4xl font-bold text-gray-900">5 000</span>
                        <span className="text-gray-500">FCFA</span>
                      </div>

                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-[#10B981]" />
                          Trajets illimités 7j/7
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-[#10B981]" />
                          Toutes les lignes Express
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-[#10B981]" />
                          Pass numérique
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={() => handlePurchase('weekly')}
                      disabled={loading}
                      className="w-full py-3 bg-[#10B981] text-white rounded-xl font-semibold hover:bg-[#0D9668] transition-all disabled:opacity-50"
                    >
                      Souscrire
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-[#10B981] to-[#059669] rounded-2xl p-6 text-left hover:shadow-xl transition-all border-2 border-amber-400/50 relative">
                    <div className="absolute -top-3 right-4 bg-amber-400 px-3 py-1 rounded-full">
                      <span className="text-xs font-bold text-gray-900">POPULAIRE</span>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Mensuel</h3>
                        <p className="text-sm text-white/80">30 jours</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-4xl font-bold text-white">15 000</span>
                        <span className="text-white/80">FCFA</span>
                      </div>
                      <p className="text-xs text-white/70 mb-4">Économisez 5 000 FCFA</p>

                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm text-white">
                          <Check className="w-4 h-4 text-white" />
                          Trajets illimités 30j
                        </li>
                        <li className="flex items-center gap-2 text-sm text-white">
                          <Check className="w-4 h-4 text-white" />
                          Toutes les lignes Express
                        </li>
                        <li className="flex items-center gap-2 text-sm text-white">
                          <Check className="w-4 h-4 text-white" />
                          Pass numérique + Support prioritaire
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={() => handlePurchase('monthly')}
                      disabled={loading}
                      className="w-full py-3 bg-white text-[#10B981] rounded-xl font-semibold hover:bg-white/90 transition-all disabled:opacity-50"
                    >
                      Souscrire
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#10B981] mt-0.5 flex-shrink-0" />
                  <div className="text-white/80 text-sm leading-relaxed">
                    <p className="font-semibold text-white mb-2">Avantages du SAMA PASS</p>
                    <ul className="space-y-1">
                      <li>• Accès illimité aux navettes DEM-DEM Express</li>
                      <li>• Montée rapide sans paiement à chaque trajet</li>
                      <li>• Économies importantes sur vos déplacements quotidiens</li>
                      <li>• Pass accessible même sans connexion internet</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <CustomModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false, onConfirm: undefined })}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        confirmText={modal.type === 'confirm' ? 'Confirmer' : 'OK'}
      />
    </div>
  );
};
