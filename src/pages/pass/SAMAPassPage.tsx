import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, Check, Clock, Zap, ArrowLeft, Loader, Ticket } from 'lucide-react';
import { useAuth } from '../../context/FirebaseAuthContext';
import { getActiveTransportLines, TransportLine } from '../../lib/transportLinesService';
import { ref, push, set } from 'firebase/database';
import { db } from '../../firebase';
import DynamicLogo from '../../components/DynamicLogo';

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
      const now = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + offer.daysCount);

      if (!db) throw new Error('Database not initialized');

      // Générer le QR Code au format attendu par EPscanT
      const userPhone = user.phoneNumber || user.email?.replace(/[^0-9]/g, '') || '221000000000';
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 100000);
      const qrCode = `SAMAPASS-${userPhone}-${timestamp}${random}`;

      // 1. Sauvegarder dans user_subscriptions (pour l'utilisateur)
      const userSubRef = ref(db as any, `user_subscriptions/${user.id}`);
      const newUserSubRef = push(userSubRef);

      await set(newUserSubRef, {
        line_id: selectedLine.id,
        line_name: selectedLine.name,
        route: selectedLine.route,
        service_type: selectedService,
        tier: selectedTier,
        price: price,
        purchased_at: now.toISOString(),
        expires_at: expiryDate.toISOString(),
        status: 'active',
        qr_code: qrCode,
        user_phone: userPhone
      });

      // 2. Sauvegarder dans abonnements_express (pour EPscanT)
      const abonnementsRef = ref(db as any, 'abonnements_express');
      const newAbonnementRef = push(abonnementsRef);

      await set(newAbonnementRef, {
        qr_code: qrCode,
        full_name: user.email?.split('@')[0] || 'Passager',
        subscriber_phone: userPhone,
        start_date: now.toISOString().split('T')[0],
        end_date: expiryDate.toISOString().split('T')[0],
        status: 'active',
        subscription_type: selectedTier,
        subscription_tier: selectedService,
        route_id: selectedLine.id,
        route_name: selectedLine.route,
        line_name: selectedLine.name,
        created_at: now.toISOString(),
        user_id: user.id,
        isTest: false
      });

      navigate(`/pass/card?subscription=${newUserSubRef.key}`);
    } catch (error) {
      console.error('Error purchasing pass:', error);
      alert('Erreur lors de l\'achat. Veuillez réessayer.');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#1a2942] to-[#0A1628] flex items-center justify-center">
        <Loader className="w-12 h-12 text-amber-400 animate-spin" />
      </div>
    );
  }

  const currentPrice = getPrice(selectedLine, selectedTier, selectedService);
  const canShowPrestige = selectedLine?.has_confort || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#1a2942] to-[#0A1628]">
      <nav className="bg-blue-950/95 backdrop-blur-xl shadow-lg sticky top-0 z-50 border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <DynamicLogo />
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate('/voyage/express')}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour aux lignes
          </button>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-amber-400/20 p-3 rounded-2xl">
                <Ticket className="w-8 h-8 text-amber-400" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                SAMA PASS
              </h1>
            </div>
            <p className="text-white/70 text-lg">
              Voyagez en illimité sur votre ligne préférée
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 rounded-3xl shadow-2xl p-8 border-2 border-white/10 mb-6">
            <label className="block text-white font-bold text-lg mb-4">Sélectionnez votre ligne</label>
            <select
              value={selectedLine?.id || ''}
              onChange={(e) => {
                const line = lines.find(l => l.id === e.target.value);
                setSelectedLine(line || null);
              }}
              className="w-full px-4 py-4 bg-[#0A1628] border-2 border-white/20 rounded-xl text-white font-medium focus:outline-none focus:border-amber-400 transition-colors"
            >
              {lines.map(line => (
                <option key={line.id} value={line.id} className="bg-[#0A1628]">
                  {line.name} - {line.route}
                </option>
              ))}
            </select>
          </div>

          {canShowPrestige && (
            <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 rounded-3xl shadow-2xl p-8 border-2 border-white/10 mb-6">
              <label className="block text-white font-bold text-lg mb-4">Type de service</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedService('eco')}
                  className={`p-6 rounded-2xl border-2 transition-all ${
                    selectedService === 'eco'
                      ? 'border-blue-400 bg-blue-500/30 text-white shadow-lg shadow-blue-500/30'
                      : 'border-white/20 bg-[#0A1628] text-white/70 hover:bg-white/5'
                  }`}
                >
                  <div className="text-2xl font-black mb-2">ECO</div>
                  <div className="text-sm text-white/70">Bus standard</div>
                </button>
                <button
                  onClick={() => setSelectedService('prestige')}
                  className={`p-6 rounded-2xl border-2 transition-all ${
                    selectedService === 'prestige'
                      ? 'border-amber-400 bg-amber-500/30 text-white shadow-lg shadow-amber-500/30'
                      : 'border-white/20 bg-[#0A1628] text-white/70 hover:bg-white/5'
                  }`}
                >
                  <div className="text-2xl font-black mb-2 flex items-center justify-center gap-1">
                    <span className="text-amber-400">★</span> PRESTIGE
                  </div>
                  <div className="text-sm text-white/70">Bus climatisé premium</div>
                </button>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 rounded-3xl shadow-2xl p-8 border-2 border-white/10 mb-6">
            <h2 className="text-2xl font-bold text-white mb-6">Choisissez votre formule</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {subscriptionOffers.map(offer => {
                const price = getPrice(selectedLine, offer.tier, selectedService);

                return (
                  <button
                    key={offer.tier}
                    onClick={() => setSelectedTier(offer.tier)}
                    className={`relative p-6 rounded-2xl border-2 transition-all ${
                      selectedTier === offer.tier
                        ? selectedService === 'prestige'
                          ? 'border-amber-400 bg-amber-500/20 shadow-lg shadow-amber-500/30'
                          : 'border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/30'
                        : 'border-white/20 bg-[#0A1628] hover:bg-white/5'
                    }`}
                  >
                    {offer.recommended && (
                      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold ${
                        selectedService === 'prestige' ? 'bg-amber-400 text-black' : 'bg-blue-400 text-white'
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
                    <p className="text-white/60 text-sm mb-4">{offer.duration}</p>
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
          </div>

          <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 rounded-3xl shadow-2xl p-8 border-2 border-white/10 mb-6">
            <h3 className="text-white font-bold text-xl mb-6">Récapitulatif</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-white/70 text-lg">
                <span>Ligne</span>
                <span className="font-bold text-white">{selectedLine?.name}</span>
              </div>
              <div className="flex justify-between text-white/70 text-lg">
                <span>Trajet</span>
                <span className="font-bold text-white">{selectedLine?.route}</span>
              </div>
              <div className="flex justify-between text-white/70 text-lg">
                <span>Service</span>
                <span className={`font-bold ${selectedService === 'prestige' ? 'text-amber-400' : 'text-blue-400'}`}>
                  {selectedService === 'prestige' ? '★ PRESTIGE' : 'ECO'}
                </span>
              </div>
              <div className="flex justify-between text-white/70 text-lg">
                <span>Durée</span>
                <span className="font-bold text-white">
                  {subscriptionOffers.find(o => o.tier === selectedTier)?.duration}
                </span>
              </div>
              <div className="border-t-2 border-white/20 pt-4 flex justify-between items-center">
                <span className="text-white font-bold text-2xl">Total</span>
                <span className={`font-black text-3xl ${selectedService === 'prestige' ? 'text-amber-400' : 'text-blue-400'}`}>
                  {currentPrice.toLocaleString()} FCFA
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handlePurchase}
            disabled={purchasing || !selectedLine}
            className={`w-full py-5 rounded-2xl font-black text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl ${
              selectedService === 'prestige'
                ? 'bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black shadow-amber-400/50'
                : 'bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white shadow-blue-500/50'
            }`}
          >
            {purchasing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-6 h-6 animate-spin" />
                Traitement en cours...
              </span>
            ) : (
              `Acheter pour ${currentPrice.toLocaleString()} FCFA`
            )}
          </button>

          <p className="text-center text-white/50 text-sm mt-6">
            Paiement sécurisé via PayDunya
          </p>
        </div>
      </div>
    </div>
  );
}
