import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, Check, Clock, Zap, ArrowLeft, Loader } from 'lucide-react';
import { useAuth } from '../../context/FirebaseAuthContext';
import { getActiveTransportLines, TransportLine } from '../../lib/transportLinesService';
import { ref, push, set } from 'firebase/database';
import { db } from '../../firebase';

type SubscriptionTier = 'weekly' | 'monthly' | 'quarterly';
type ServiceType = 'eco' | 'prestige';

interface SubscriptionOffer {
  tier: SubscriptionTier;
  label: string;
  duration: string;
  daysCount: number;
  icon: React.ReactNode;
  recommended?: boolean;
}

const subscriptionOffers: SubscriptionOffer[] = [
  {
    tier: 'weekly',
    label: 'Hebdomadaire',
    duration: '7 jours',
    daysCount: 7,
    icon: <Clock className="w-6 h-6" />
  },
  {
    tier: 'monthly',
    label: 'Mensuel',
    duration: '30 jours',
    daysCount: 30,
    icon: <Zap className="w-6 h-6" />,
    recommended: true
  },
  {
    tier: 'quarterly',
    label: 'Trimestriel',
    duration: '90 jours',
    daysCount: 90,
    icon: <CreditCard className="w-6 h-6" />
  }
];

export default function SAMAPassPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [lines, setLines] = useState<TransportLine[]>([]);
  const [selectedLine, setSelectedLine] = useState<TransportLine | null>(null);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('monthly');
  const [selectedService, setSelectedService] = useState<ServiceType>('eco');
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  const lineIdParam = searchParams.get('line');
  const tierParam = searchParams.get('tier') as ServiceType;

  useEffect(() => {
    loadLines();
  }, []);

  useEffect(() => {
    if (tierParam && (tierParam === 'eco' || tierParam === 'prestige')) {
      setSelectedService(tierParam);
    }
  }, [tierParam]);

  const loadLines = async () => {
    setLoading(true);
    try {
      const displayRoutes = await getActiveTransportLines();

      if (!db) return;

      const linesRef = ref(db as any, 'transport_lines');
      const { get } = await import('firebase/database');
      const snapshot = await get(linesRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const linesArray: TransportLine[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));

        const activeLines = linesArray.filter(l => l.is_active);
        setLines(activeLines);

        if (lineIdParam) {
          const preselected = activeLines.find(l => l.id === lineIdParam);
          if (preselected) {
            setSelectedLine(preselected);
          }
        } else if (activeLines.length > 0) {
          setSelectedLine(activeLines[0]);
        }
      }
    } catch (error) {
      console.error('Error loading lines:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (line: TransportLine | null, tier: SubscriptionTier, service: ServiceType): number => {
    if (!line) return 0;

    const isPrestige = service === 'prestige';

    switch (tier) {
      case 'weekly':
        return isPrestige && line.price_weekly_confort ? line.price_weekly_confort : line.price_weekly;
      case 'monthly':
        return isPrestige && line.price_monthly_confort ? line.price_monthly_confort : line.price_monthly;
      case 'quarterly':
        return isPrestige && line.price_quarterly_confort ? line.price_quarterly_confort : line.price_quarterly;
      default:
        return 0;
    }
  };

  const handlePurchase = async () => {
    if (!user || !selectedLine) {
      alert('Veuillez vous connecter pour acheter un pass');
      navigate('/login');
      return;
    }

    setPurchasing(true);

    try {
      const offer = subscriptionOffers.find(o => o.tier === selectedTier);
      if (!offer) throw new Error('Offre invalide');

      const price = getPrice(selectedLine, selectedTier, selectedService);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + offer.daysCount);

      if (!db) throw new Error('Database not initialized');

      const subscriptionsRef = ref(db as any, `user_subscriptions/${user.id}`);
      const newSubRef = push(subscriptionsRef);

      await set(newSubRef, {
        line_id: selectedLine.id,
        line_name: selectedLine.name,
        route: selectedLine.route,
        service_type: selectedService,
        tier: selectedTier,
        price: price,
        purchased_at: new Date().toISOString(),
        expires_at: expiryDate.toISOString(),
        status: 'active'
      });

      navigate(`/pass/card?subscription=${newSubRef.key}`);
    } catch (error) {
      console.error('Error purchasing pass:', error);
      alert('Erreur lors de l\'achat. Veuillez réessayer.');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center">
        <Loader className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  const currentPrice = getPrice(selectedLine, selectedTier, selectedService);
  const canShowPrestige = selectedLine?.has_confort || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/voyage/express')}
          className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour aux lignes
        </button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-2">SAMA PASS</h1>
          <p className="text-blue-200">Voyagez en illimité sur votre ligne préférée</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 mb-6">
          <label className="block text-white font-bold mb-3">Sélectionnez votre ligne</label>
          <select
            value={selectedLine?.id || ''}
            onChange={(e) => {
              const line = lines.find(l => l.id === e.target.value);
              setSelectedLine(line || null);
            }}
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white font-medium focus:outline-none focus:border-white/50"
          >
            {lines.map(line => (
              <option key={line.id} value={line.id} className="bg-blue-900">
                {line.name} - {line.route}
              </option>
            ))}
          </select>
        </div>

        {canShowPrestige && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 mb-6">
            <label className="block text-white font-bold mb-3">Type de service</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedService('eco')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedService === 'eco'
                    ? 'border-blue-400 bg-blue-500/30 text-white'
                    : 'border-white/30 bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <div className="font-bold mb-1">ECO</div>
                <div className="text-sm">Bus standard</div>
              </button>
              <button
                onClick={() => setSelectedService('prestige')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedService === 'prestige'
                    ? 'border-amber-400 bg-amber-500/30 text-white'
                    : 'border-white/30 bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <div className="font-bold mb-1 flex items-center justify-center gap-1">
                  <span>★</span> PRESTIGE
                </div>
                <div className="text-sm">Bus climatisé premium</div>
              </button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {subscriptionOffers.map(offer => {
            const price = getPrice(selectedLine, offer.tier, selectedService);

            return (
              <button
                key={offer.tier}
                onClick={() => setSelectedTier(offer.tier)}
                className={`relative p-6 rounded-2xl border-2 transition-all ${
                  selectedTier === offer.tier
                    ? selectedService === 'prestige'
                      ? 'border-amber-400 bg-amber-500/20'
                      : 'border-blue-400 bg-blue-500/20'
                    : 'border-white/30 bg-white/10 hover:bg-white/20'
                }`}
              >
                {offer.recommended && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold ${
                    selectedService === 'prestige' ? 'bg-amber-500 text-black' : 'bg-blue-500 text-white'
                  }`}>
                    POPULAIRE
                  </div>
                )}

                <div className={`flex justify-center mb-3 ${
                  selectedService === 'prestige' ? 'text-amber-400' : 'text-blue-400'
                }`}>
                  {offer.icon}
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{offer.label}</h3>
                <p className="text-white/70 text-sm mb-4">{offer.duration}</p>
                <div className="text-3xl font-black text-white">
                  {price.toLocaleString()} <span className="text-lg">FCFA</span>
                </div>

                {selectedTier === offer.tier && (
                  <div className={`mt-4 flex items-center justify-center gap-2 ${
                    selectedService === 'prestige' ? 'text-amber-400' : 'text-blue-400'
                  }`}>
                    <Check className="w-5 h-5" />
                    <span className="font-bold">Sélectionné</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 mb-6">
          <h3 className="text-white font-bold mb-4">Récapitulatif</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-white/80">
              <span>Ligne</span>
              <span className="font-bold text-white">{selectedLine?.name}</span>
            </div>
            <div className="flex justify-between text-white/80">
              <span>Trajet</span>
              <span className="font-bold text-white">{selectedLine?.route}</span>
            </div>
            <div className="flex justify-between text-white/80">
              <span>Service</span>
              <span className={`font-bold ${selectedService === 'prestige' ? 'text-amber-400' : 'text-blue-400'}`}>
                {selectedService === 'prestige' ? '★ PRESTIGE' : 'ECO'}
              </span>
            </div>
            <div className="flex justify-between text-white/80">
              <span>Durée</span>
              <span className="font-bold text-white">
                {subscriptionOffers.find(o => o.tier === selectedTier)?.duration}
              </span>
            </div>
            <div className="border-t border-white/20 pt-3 flex justify-between">
              <span className="text-white font-bold text-lg">Total</span>
              <span className={`font-black text-2xl ${selectedService === 'prestige' ? 'text-amber-400' : 'text-blue-400'}`}>
                {currentPrice.toLocaleString()} FCFA
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handlePurchase}
          disabled={purchasing || !selectedLine}
          className={`w-full py-4 rounded-xl font-black text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            selectedService === 'prestige'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black'
              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
          }`}
        >
          {purchasing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader className="w-5 h-5 animate-spin" />
              Traitement en cours...
            </span>
          ) : (
            `Acheter pour ${currentPrice.toLocaleString()} FCFA`
          )}
        </button>

        <p className="text-center text-white/60 text-sm mt-4">
          Paiement sécurisé via PayDunya
        </p>
      </div>
    </div>
  );
}
