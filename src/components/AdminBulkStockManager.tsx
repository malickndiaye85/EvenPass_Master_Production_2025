import { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { firestore } from '../firebase';
import { collection, query, onSnapshot, where, getDocs } from 'firebase/firestore';

interface BulkStock {
  id: string;
  organizer_name: string;
  event_title: string;
  quantity_allocated: number;
  quantity_sold: number;
  unit_price: number;
  total_value: number;
  status: string;
}

export default function AdminBulkStockManager() {
  const [bulkStocks, setBulkStocks] = useState<BulkStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bulkSalesRef = collection(firestore, 'bulk_sales');
    const bulkQuery = query(bulkSalesRef, where('status', '==', 'active'));

    const unsubscribe = onSnapshot(bulkQuery, async (snapshot) => {
      const stocks: BulkStock[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();

        const ticketsRef = collection(firestore, 'tickets');
        const ticketsQuery = query(
          ticketsRef,
          where('bulk_sale_id', '==', doc.id),
          where('status', '==', 'active')
        );
        const ticketsSnapshot = await getDocs(ticketsQuery);
        const soldCount = ticketsSnapshot.size;

        stocks.push({
          id: doc.id,
          organizer_name: data.organizer_name || '',
          event_title: data.event_title || '',
          quantity_allocated: data.quantity_allocated || 0,
          quantity_sold: soldCount,
          unit_price: data.unit_price || 0,
          total_value: data.total_value || 0,
          status: data.status || 'active',
        });
      }

      setBulkStocks(stocks);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const calculatePercentage = (sold: number, allocated: number): number => {
    if (allocated === 0) return 0;
    return Math.round((sold / allocated) * 100);
  };

  const getStockStatus = (percentage: number): { color: string; label: string } => {
    if (percentage >= 90) return { color: 'red', label: 'Critique' };
    if (percentage >= 70) return { color: 'yellow', label: 'Attention' };
    return { color: 'green', label: 'Disponible' };
  };

  if (loading) {
    return (
      <div className="bg-[#2A2A2A] p-6 text-center" style={{ borderRadius: '40px 120px 40px 120px' }}>
        <div className="w-12 h-12 border-4 border-[#FF5F05] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-sm">Chargement des stocks...</p>
      </div>
    );
  }

  if (bulkStocks.length === 0) {
    return (
      <div className="bg-[#2A2A2A] border border-[#2A2A2A] p-8 text-center" style={{ borderRadius: '40px 120px 40px 120px' }}>
        <Package className="w-16 h-16 text-[#B5B5B5] mx-auto mb-4 opacity-50" />
        <p className="text-[#B5B5B5] font-bold">Aucun bloc de billets actif</p>
        <p className="text-[#B5B5B5] text-sm mt-2">Créez un bloc pour commencer</p>
      </div>
    );
  }

  return (
    <div className="bg-[#2A2A2A] border border-[#2A2A2A] p-6" style={{ borderRadius: '40px 120px 40px 120px' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-black text-xl flex items-center gap-2">
            <Package className="w-6 h-6 text-[#FF5F05]" />
            Suivi des Stocks de Blocs
          </h3>
          <p className="text-[#B5B5B5] text-sm mt-1">Épuisement en temps réel</p>
        </div>
        <span className="px-4 py-2 bg-[#0F0F0F] text-[#FF5F05] rounded-full text-sm font-bold">
          {bulkStocks.length} Blocs Actifs
        </span>
      </div>

      <div className="space-y-4">
        {bulkStocks.map((stock) => {
          const percentage = calculatePercentage(stock.quantity_sold, stock.quantity_allocated);
          const status = getStockStatus(percentage);
          const remaining = stock.quantity_allocated - stock.quantity_sold;

          return (
            <div
              key={stock.id}
              className="bg-[#0F0F0F] border border-[#2A2A2A] p-4 hover:border-[#FF5F05] transition-all"
              style={{ borderRadius: '20px 8px 20px 8px' }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <p className="text-white font-bold">{stock.event_title}</p>
                  <p className="text-[#B5B5B5] text-sm">{stock.organizer_name}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      status.color === 'red'
                        ? 'bg-red-600'
                        : status.color === 'yellow'
                        ? 'bg-yellow-600'
                        : 'bg-green-600'
                    } text-white`}
                  >
                    {status.label}
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-[#B5B5B5]">
                    {stock.quantity_sold} / {stock.quantity_allocated} vendus
                  </span>
                  <span
                    className={`font-bold ${
                      status.color === 'red'
                        ? 'text-red-400'
                        : status.color === 'yellow'
                        ? 'text-yellow-400'
                        : 'text-green-400'
                    }`}
                  >
                    {percentage}%
                  </span>
                </div>
                <div className="w-full bg-[#2A2A2A] rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      status.color === 'red'
                        ? 'bg-gradient-to-r from-red-600 to-red-500'
                        : status.color === 'yellow'
                        ? 'bg-gradient-to-r from-yellow-600 to-yellow-500'
                        : 'bg-gradient-to-r from-green-600 to-green-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-[#B5B5B5]">Restants</p>
                  <p className="text-white font-bold">{remaining}</p>
                </div>
                <div>
                  <p className="text-[#B5B5B5]">Prix unitaire</p>
                  <p className="text-white font-bold">{stock.unit_price.toLocaleString()} F</p>
                </div>
                <div>
                  <p className="text-[#B5B5B5]">Valeur totale</p>
                  <p className="text-green-400 font-bold">{stock.total_value.toLocaleString()} F</p>
                </div>
              </div>

              {percentage >= 90 && (
                <div className="mt-3 flex items-center gap-2 text-xs text-red-400 bg-red-600/20 px-3 py-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-bold">Stock critique - Réapprovisionnement conseillé</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
