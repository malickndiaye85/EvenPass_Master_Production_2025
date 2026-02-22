import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Download, Share2, ArrowLeft, Loader } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useAuth } from '../../context/FirebaseAuthContext';
import { ref, get } from 'firebase/database';
import { db } from '../../firebase';

interface Subscription {
  id: string;
  line_id: string;
  line_name: string;
  route: string;
  service_type: 'eco' | 'prestige';
  tier: 'weekly' | 'monthly' | 'quarterly';
  price: number;
  purchased_at: string;
  expires_at: string;
  status: string;
}

export default function SAMAPassCardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const subscriptionId = searchParams.get('subscription');

  useEffect(() => {
    if (!user || !subscriptionId) {
      navigate('/pass/subscriptions');
      return;
    }

    loadSubscription();
  }, [user, subscriptionId]);

  const loadSubscription = async () => {
    if (!db || !user || !subscriptionId) return;

    try {
      const subRef = ref(db as any, `user_subscriptions/${user.id}/${subscriptionId}`);
      const snapshot = await get(subRef);

      if (snapshot.exists()) {
        setSubscription({
          id: subscriptionId,
          ...snapshot.val()
        });
      } else {
        alert('Abonnement introuvable');
        navigate('/pass/subscriptions');
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      alert('Erreur lors du chargement');
      navigate('/pass/subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'weekly': return 'Hebdomadaire';
      case 'monthly': return 'Mensuel';
      case 'quarterly': return 'Trimestriel';
      default: return tier;
    }
  };

  const qrData = JSON.stringify({
    type: 'sama_pass',
    subscription_id: subscriptionId,
    user_id: user?.id,
    service_type: subscription?.service_type,
    line_id: subscription?.line_id,
    expires_at: subscription?.expires_at
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center">
        <Loader className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  if (!subscription) {
    return null;
  }

  const isPrestige = subscription.service_type === 'prestige';

  return (
    <div className={`min-h-screen ${
      isPrestige
        ? 'bg-gradient-to-br from-amber-900 via-amber-800 to-black'
        : 'bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900'
    }`}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/voyage/express')}
          className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Achat Réussi!</h1>
          <p className="text-white/70">Votre SAMA PASS est prêt à l'emploi</p>
        </div>

        <div className={`relative rounded-3xl p-8 shadow-2xl ${
          isPrestige
            ? 'bg-gradient-to-br from-amber-500 via-amber-600 to-black'
            : 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700'
        }`}>
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/10 to-transparent rounded-t-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className={`text-sm font-bold mb-1 ${isPrestige ? 'text-amber-200' : 'text-blue-200'}`}>
                  SAMA PASS
                </div>
                <div className="text-3xl font-black text-white flex items-center gap-2">
                  {isPrestige && <span className="text-amber-300">★</span>}
                  {isPrestige ? 'PRESTIGE' : 'ECO'}
                </div>
              </div>
              <div className={`px-4 py-2 rounded-full font-bold text-sm ${
                isPrestige ? 'bg-amber-900/50 text-amber-200' : 'bg-blue-900/50 text-blue-200'
              }`}>
                {getTierLabel(subscription.tier)}
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <div className="text-white/70 text-sm mb-1">Titulaire</div>
                <div className="text-white text-lg font-bold">
                  {user?.email?.split('@')[0] || 'Passager'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-white/70 text-sm mb-1">Ligne</div>
                  <div className="text-white font-bold">{subscription.line_name}</div>
                </div>
                <div>
                  <div className="text-white/70 text-sm mb-1">Trajet</div>
                  <div className="text-white font-bold text-sm">{subscription.route}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-white/70 text-sm mb-1">Activé le</div>
                  <div className="text-white font-bold text-sm">
                    {formatDate(subscription.purchased_at)}
                  </div>
                </div>
                <div>
                  <div className="text-white/70 text-sm mb-1">Expire le</div>
                  <div className={`font-bold text-sm ${isPrestige ? 'text-amber-200' : 'text-blue-200'}`}>
                    {formatDate(subscription.expires_at)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 flex flex-col items-center">
              <QRCode
                value={qrData}
                size={200}
                level="H"
                fgColor={isPrestige ? '#78350f' : '#1e3a8a'}
              />
              <p className="text-gray-600 text-xs mt-4 text-center">
                Présentez ce QR Code au contrôleur
              </p>
            </div>

            {isPrestige && (
              <div className="mt-6 p-4 bg-amber-900/30 border border-amber-500/30 rounded-xl">
                <p className="text-amber-200 text-sm text-center font-medium">
                  <span className="text-amber-300">★</span> Accès exclusif aux bus climatisés premium
                </p>
              </div>
            )}

            <div className={`mt-6 text-center text-xs ${isPrestige ? 'text-amber-200/70' : 'text-blue-200/70'}`}>
              ID: {subscriptionId?.substring(0, 8).toUpperCase()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold transition-all"
          >
            <Download className="w-5 h-5" />
            Télécharger
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Mon SAMA PASS',
                  text: `J'ai mon SAMA PASS ${isPrestige ? 'PRESTIGE' : 'ECO'} pour la ligne ${subscription.line_name}`,
                  url: window.location.href
                });
              }
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold transition-all"
          >
            <Share2 className="w-5 h-5" />
            Partager
          </button>
        </div>

        <div className="mt-8 p-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
          <h3 className="text-white font-bold mb-3">Comment utiliser votre PASS</h3>
          <ol className="space-y-2 text-white/80 text-sm">
            <li className="flex gap-3">
              <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                isPrestige ? 'bg-amber-500 text-black' : 'bg-blue-500 text-white'
              }`}>1</span>
              <span>Montez dans le bus de votre ligne {isPrestige && '(climatisé premium)'}</span>
            </li>
            <li className="flex gap-3">
              <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                isPrestige ? 'bg-amber-500 text-black' : 'bg-blue-500 text-white'
              }`}>2</span>
              <span>Présentez votre QR Code au contrôleur</span>
            </li>
            <li className="flex gap-3">
              <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                isPrestige ? 'bg-amber-500 text-black' : 'bg-blue-500 text-white'
              }`}>3</span>
              <span>Voyagez en illimité pendant toute la durée de validité</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
