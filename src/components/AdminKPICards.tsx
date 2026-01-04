import { DollarSign, TrendingUp, Users, Package, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, query, getDocs, onSnapshot, where } from 'firebase/firestore';

interface KPIData {
  totalRevenue: number;
  eventRevenue: number;
  passRevenue: number;
  lmdgRevenue: number;
  cosamaRevenue: number;
  platformCommission: number;
  payoutFees: number;
  organizerPayouts: number;
}

export default function AdminKPICards() {
  const [kpiData, setKpiData] = useState<KPIData>({
    totalRevenue: 0,
    eventRevenue: 0,
    passRevenue: 0,
    lmdgRevenue: 0,
    cosamaRevenue: 0,
    platformCommission: 0,
    payoutFees: 0,
    organizerPayouts: 0,
  });

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    const ticketsRef = collection(firestore, 'tickets');
    const unsubTickets = onSnapshot(ticketsRef, async () => {
      calculateKPIs();
    });
    unsubscribers.push(unsubTickets);

    calculateKPIs();

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  const calculateKPIs = async () => {
    try {
      const ticketsRef = collection(firestore, 'tickets');
      const ticketsQuery = query(ticketsRef, where('status', '==', 'active'));
      const ticketsSnapshot = await getDocs(ticketsQuery);

      let totalRev = 0;
      let eventRev = 0;
      let passRev = 0;
      let lmdgRev = 0;
      let cosamaRev = 0;

      ticketsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const price = data.price || 0;

        totalRev += price;

        if (data.service_type === 'pass') {
          passRev += price;

          if (data.pass_type === 'lmdg') {
            lmdgRev += price;
          } else if (data.pass_type === 'cosama') {
            cosamaRev += price;
          }
        } else {
          eventRev += price;
        }
      });

      const commission = totalRev * 0.05;
      const fees = totalRev * 0.015;
      const payouts = totalRev * 0.935;

      setKpiData({
        totalRevenue: totalRev,
        eventRevenue: eventRev,
        passRevenue: passRev,
        lmdgRevenue: lmdgRev,
        cosamaRevenue: cosamaRev,
        platformCommission: commission,
        payoutFees: fees,
        organizerPayouts: payouts,
      });
    } catch (error) {
      console.error('[ADMIN KPI] Error calculating KPIs:', error);
    }
  };

  const formatAmount = (amount: number): string => {
    return Math.round(amount).toLocaleString('fr-FR');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-2xl overflow-hidden relative"
        style={{ borderRadius: '40px 8px 40px 8px' }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="p-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8" />
            <span className="text-sm opacity-90 font-bold">100%</span>
          </div>
          <p className="text-3xl font-black mb-1">{formatAmount(kpiData.totalRevenue)} F</p>
          <p className="text-sm opacity-75 mb-3">CA Total Consolidé</p>
          <div className="text-xs opacity-70 space-y-1 pt-3 border-t border-white/20">
            <div className="flex justify-between">
              <span>Événements:</span>
              <span className="font-semibold">{formatAmount(kpiData.eventRevenue)} F</span>
            </div>
            <div className="flex justify-between">
              <span>PASS (LMDG+COSAMA):</span>
              <span className="font-semibold">{formatAmount(kpiData.passRevenue)} F</span>
            </div>
          </div>
        </div>
      </div>

      <div
        className="bg-gradient-to-br from-[#FF5F05] to-red-600 text-white shadow-2xl overflow-hidden relative"
        style={{ borderRadius: '40px 8px 40px 8px' }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="p-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8" />
            <span className="text-sm opacity-90 font-bold">5%</span>
          </div>
          <p className="text-3xl font-black mb-1">{formatAmount(kpiData.platformCommission)} F</p>
          <p className="text-sm opacity-75 mb-3">Commission EvenPass</p>
          <div className="text-xs opacity-70 pt-3 border-t border-white/20">
            <p>Prélevé sur toutes les ventes</p>
            <p className="text-[10px] mt-1">EVEN + PASS (Web + Bloc)</p>
          </div>
        </div>
      </div>

      <div
        className="bg-gradient-to-br from-yellow-600 to-amber-600 text-white shadow-2xl overflow-hidden relative"
        style={{ borderRadius: '40px 8px 40px 8px' }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="p-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8" />
            <span className="text-sm opacity-90 font-bold">1.5%</span>
          </div>
          <p className="text-3xl font-black mb-1">{formatAmount(kpiData.payoutFees)} F</p>
          <p className="text-sm opacity-75 mb-3">Frais Passerelle</p>
          <div className="text-xs opacity-70 pt-3 border-t border-white/20">
            <p>Uniquement sur ventes Web</p>
            <p className="text-[10px] mt-1">(Bloc Admin = 0% frais)</p>
          </div>
        </div>
      </div>

      <div
        className="bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-2xl overflow-hidden relative"
        style={{ borderRadius: '40px 8px 40px 8px' }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="p-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <Zap className="w-8 h-8" />
            <span className="text-sm opacity-90 font-bold">93.5%</span>
          </div>
          <p className="text-3xl font-black mb-1">{formatAmount(kpiData.organizerPayouts)} F</p>
          <p className="text-sm opacity-75 mb-3">Net Organisateurs</p>
          <div className="text-xs opacity-70 pt-3 border-t border-white/20">
            <p>Total - Commission - Frais</p>
          </div>
        </div>
      </div>

      <div
        className="col-span-full bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border-2 border-purple-600 p-6 backdrop-blur-sm"
        style={{ borderRadius: '40px 120px 40px 120px' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-black text-lg mb-2">Répartition PASS</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[#B5B5B5] text-sm">LMDG</p>
                <p className="text-purple-400 font-black text-2xl">{formatAmount(kpiData.lmdgRevenue)} F</p>
              </div>
              <div>
                <p className="text-[#B5B5B5] text-sm">COSAMA</p>
                <p className="text-indigo-400 font-black text-2xl">{formatAmount(kpiData.cosamaRevenue)} F</p>
              </div>
            </div>
          </div>
          <Package className="w-16 h-16 text-purple-400 opacity-50" />
        </div>
      </div>
    </div>
  );
}
