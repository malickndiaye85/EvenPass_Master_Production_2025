import React, { useState } from 'react';
import { ref, set, get, push } from 'firebase/database';
import { db } from '../firebase';
import { X, Phone, User, AlertCircle } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
  totalAmount: number;
  ticketCounts: {
    standard: number;
    vip: number;
    vvip: number;
  };
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  eventId,
  eventName,
  totalAmount,
  ticketCounts,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const checkPhoneBlocked = async (phone: string): Promise<boolean> => {
    try {
      const blockedRef = ref(db, `evenpass/blocked_phones/${phone.replace(/\s/g, '')}`);
      const snapshot = await get(blockedRef);
      return snapshot.exists();
    } catch (error) {
      console.error('Error checking phone:', error);
      return false;
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cleanPhone = phoneNumber.replace(/\s/g, '');

      if (cleanPhone.length < 9) {
        setError('Numéro de téléphone invalide');
        setLoading(false);
        return;
      }

      const isBlocked = await checkPhoneBlocked(cleanPhone);
      if (isBlocked) {
        setError('Ce numéro a déjà effectué un achat pour cet événement. Maximum 3 billets par personne.');
        setLoading(false);
        return;
      }

      const totalTickets = ticketCounts.standard + ticketCounts.vip + ticketCounts.vvip;

      const ordersRef = ref(db, 'evenpass/orders');
      const newOrderRef = push(ordersRef);

      const orderData = {
        eventId,
        eventName,
        customerName: fullName,
        customerPhone: cleanPhone,
        amount: totalAmount,
        quantity: totalTickets,
        ticketCounts,
        status: 'completed',
        paymentMethod: 'mobile_money',
        createdAt: Date.now(),
      };

      await set(newOrderRef, orderData);

      await set(ref(db, `evenpass/blocked_phones/${cleanPhone}`), {
        eventId,
        orderId: newOrderRef.key,
        blockedAt: Date.now(),
      });

      const ticketsRef = ref(db, 'evenpass/tickets');
      const ticketPromises = [];

      for (let i = 0; i < totalTickets; i++) {
        const newTicketRef = push(ticketsRef);
        ticketPromises.push(
          set(newTicketRef, {
            orderId: newOrderRef.key,
            eventId,
            eventName,
            customerName: fullName,
            customerPhone: cleanPhone,
            ticketId: newTicketRef.key,
            scanned: false,
            createdAt: Date.now(),
            category: i < ticketCounts.standard ? 'standard' : i < ticketCounts.standard + ticketCounts.vip ? 'vip' : 'vvip',
            price: totalAmount / totalTickets,
          })
        );
      }

      await Promise.all(ticketPromises);

      alert(`✓ Paiement réussi ! ${totalTickets} billet(s) acheté(s).\n\nVos billets QR seront envoyés par SMS au ${cleanPhone}.`);
      onClose();
      setPhoneNumber('');
      setFullName('');
    } catch (error: any) {
      console.error('Payment error:', error);
      setError('Erreur lors du paiement. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
          Paiement Mobile Money
        </h2>

        <div className="flex items-center justify-center gap-8 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center bg-white rounded-xl p-4 shadow-lg">
            <img src="/Wave.svg" alt="Wave" className="h-16 w-auto" />
          </div>
          <div className="flex items-center justify-center bg-white rounded-xl p-4 shadow-lg">
            <img src="/Orange-Money.svg" alt="Orange Money" className="h-16 w-auto" />
          </div>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-6 flex items-start gap-2">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-6">
          <p className="text-sm text-orange-800 dark:text-orange-200 font-medium">
            <strong>Limite:</strong> Maximum 3 billets par numéro de téléphone
          </p>
        </div>

        <form onSubmit={handlePayment} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Nom complet *
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Votre nom complet"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Numéro de téléphone *
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="77 123 45 67"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Les billets QR seront envoyés à ce numéro
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Événement:</span>
              <span className="text-gray-900 dark:text-white font-bold">{eventName}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Billets:</span>
              <span className="text-gray-900 dark:text-white font-bold">
                {ticketCounts.standard + ticketCounts.vip + ticketCounts.vvip}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-900 dark:text-white font-black">Total:</span>
              <span className="text-2xl text-orange-500 font-black">
                {totalAmount.toLocaleString()} FCFA
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white hover:bg-orange-600 py-4 rounded-xl font-black text-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'TRAITEMENT...' : 'PAYER MAINTENANT'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
