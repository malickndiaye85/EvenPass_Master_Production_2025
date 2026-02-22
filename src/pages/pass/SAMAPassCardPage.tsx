import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Download, Share2, ArrowLeft, Loader, CheckCircle } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useAuth } from '../../context/FirebaseAuthContext';
import { ref, get } from 'firebase/database';
import { db } from '../../firebase';
import DynamicLogo from '../../components/DynamicLogo';

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
      <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#1a2942] to-[#0A1628] flex items-center justify-center">
        <Loader className="w-12 h-12 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (!subscription) {
    return null;
  }

  const isPrestige = subscription.service_type === 'prestige';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#1a2942] to-[#0A1628]">
      <nav className="bg-blue-950/95 backdrop-blur-xl shadow-lg sticky top-0 z-50 border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <DynamicLogo />
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate('/voyage/express')}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>

          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
              isPrestige ? 'bg-amber-400/20' : 'bg-blue-500/20'
            }`}>
              <CheckCircle className={`w-12 h-12 ${isPrestige ? 'text-amber-400' : 'text-blue-400'}`} />
            </div>
            <h1 className="text-4xl font-black text-white mb-2">Achat Réussi!</h1>
            <p className="text-white/70 text-lg">Votre SAMA PASS est prêt à l'emploi</p>
          </div>

          <div className={`relative rounded-3xl p-8 shadow-2xl border-2 ${
            isPrestige
              ? 'bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-black/80 border-amber-400/30'
              : 'bg-gradient-to-br from-blue-500/20 via-blue-600/10 to-blue-950 border-blue-400/30'
          }`}>
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/5 to-transparent rounded-t-3xl"></div>

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className={`text-sm font-bold mb-2 uppercase tracking-wider ${
                    isPrestige ? 'text-amber-400' : 'text-blue-400'
                  }`}>
                    SAMA PASS
                  </div>
                  <div className="text-4xl font-black text-white flex items-center gap-2">
                    {isPrestige && <span className="text-amber-400">★</span>}
                    {isPrestige ? 'PRESTIGE' : 'ECO'}
                  </div>
                </div>
                <div className={`px-5 py-2 rounded-full font-bold ${
                  isPrestige
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                }`}>
                  {getTierLabel(subscription.tier)}
                </div>
              </div>

              <div className="space-y-5 mb-8">
                <div>
                  <div className="text-white/60 text-sm mb-2">Titulaire</div>
                  <div className="text-white text-xl font-bold">
                    {user?.email?.split('@')[0] || 'Passager'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-white/60 text-sm mb-2">Ligne</div>
                    <div className="text-white font-bold text-lg">{subscription.line_name}</div>
                  </div>
                  <div>
                    <div className="text-white/60 text-sm mb-2">Trajet</div>
                    <div className="text-white font-bold">{subscription.route}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-white/60 text-sm mb-2">Activé le</div>
                    <div className="text-white font-bold">
                      {formatDate(subscription.purchased_at)}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/60 text-sm mb-2">Expire le</div>
                    <div className={`font-bold ${isPrestige ? 'text-amber-400' : 'text-blue-400'}`}>
                      {formatDate(subscription.expires_at)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-8 flex flex-col items-center shadow-xl">
                <QRCode
                  value={qrData}
                  size={220}
                  level="H"
                  fgColor={isPrestige ? '#78350f' : '#1e3a8a'}
                />
                <p className="text-gray-600 text-sm mt-5 text-center font-medium">
                  Présentez ce QR Code au contrôleur
                </p>
              </div>

              {isPrestige && (
                <div className="mt-6 p-5 bg-amber-400/10 border border-amber-400/30 rounded-2xl">
                  <p className="text-amber-300 text-center font-bold flex items-center justify-center gap-2">
                    <span className="text-xl">★</span>
                    Accès exclusif aux bus climatisés premium
                  </p>
                </div>
              )}

              <div className={`mt-6 text-center text-xs font-mono ${
                isPrestige ? 'text-amber-400/70' : 'text-blue-400/70'
              }`}>
                ID: {subscriptionId?.substring(0, 8).toUpperCase()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 hover:from-blue-900 hover:via-blue-800 hover:to-blue-900 text-white rounded-2xl font-bold transition-all border-2 border-white/10 shadow-xl"
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
              className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 hover:from-blue-900 hover:via-blue-800 hover:to-blue-900 text-white rounded-2xl font-bold transition-all border-2 border-white/10 shadow-xl"
            >
              <Share2 className="w-5 h-5" />
              Partager
            </button>
          </div>

          <div className="mt-8 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 rounded-3xl p-8 border-2 border-white/10 shadow-2xl">
            <h3 className="text-white font-bold text-xl mb-6">Comment utiliser votre PASS</h3>
            <ol className="space-y-4 text-white/80">
              <li className="flex gap-4">
                <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isPrestige ? 'bg-amber-400 text-black' : 'bg-blue-400 text-white'
                }`}>1</span>
                <span className="text-lg">
                  Montez dans le bus de votre ligne {isPrestige && <span className="text-amber-400 font-bold">(climatisé premium)</span>}
                </span>
              </li>
              <li className="flex gap-4">
                <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isPrestige ? 'bg-amber-400 text-black' : 'bg-blue-400 text-white'
                }`}>2</span>
                <span className="text-lg">Présentez votre QR Code au contrôleur</span>
              </li>
              <li className="flex gap-4">
                <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isPrestige ? 'bg-amber-400 text-black' : 'bg-blue-400 text-white'
                }`}>3</span>
                <span className="text-lg">Voyagez en illimité pendant toute la durée de validité</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
