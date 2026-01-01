import { useState, useEffect } from 'react';
import { X, Package, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BulkSalesModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Event {
  id: string;
  title: string;
  ticket_types: TicketType[];
}

interface TicketType {
  id: string;
  name: string;
  price: number;
  quantity_total: number;
  quantity_sold: number;
}

export default function BulkSalesModal({ onClose, onSuccess }: BulkSalesModalProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedTicketType, setSelectedTicketType] = useState<TicketType | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select(`
        id,
        title,
        ticket_types(*)
      `)
      .eq('status', 'published')
      .order('start_date', { ascending: false });

    if (data) setEvents(data as Event[]);
  };

  const handleGenerate = async () => {
    if (!selectedEvent || !selectedTicketType || quantity < 1) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const available = selectedTicketType.quantity_total - selectedTicketType.quantity_sold;
    if (quantity > available) {
      alert(`Stock insuffisant ! Disponible : ${available} billets`);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('generate_bulk_tickets', {
        p_event_id: selectedEvent.id,
        p_ticket_type_id: selectedTicketType.id,
        p_quantity: quantity,
        p_notes: notes || null
      });

      if (error) throw error;

      setBulkResult(data);
      setSuccess(true);
      onSuccess();
    } catch (error: any) {
      console.error('Error:', error);
      alert(`Erreur : ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!bulkResult || !bulkResult.tickets) return;

    const csv = [
      'Numéro de Billet,QR Code,Événement,Catégorie,Prix',
      ...bulkResult.tickets.map((t: any) =>
        `${t.ticket_number},${t.qr_code},${bulkResult.event_title},${bulkResult.ticket_type_name},${selectedTicketType?.price}`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-tickets-${bulkResult.bulk_sale_id}.csv`;
    a.click();
  };

  if (success && bulkResult) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-[#1A1A1A] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-green-500">
          <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 p-6 flex justify-between items-center">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <CheckCircle className="w-7 h-7" />
              Billets Générés avec Succès !
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-white/80 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-[#0F0F0F] rounded-2xl p-6 border border-[#2A2A2A]">
              <h3 className="text-xl font-bold text-white mb-4">Résumé</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#B5B5B5] mb-1">Événement</p>
                  <p className="text-white font-bold">{bulkResult.event_title}</p>
                </div>
                <div>
                  <p className="text-sm text-[#B5B5B5] mb-1">Catégorie</p>
                  <p className="text-white font-bold">{bulkResult.ticket_type_name}</p>
                </div>
                <div>
                  <p className="text-sm text-[#B5B5B5] mb-1">Quantité</p>
                  <p className="text-2xl font-black text-green-400">{bulkResult.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-[#B5B5B5] mb-1">Montant Total</p>
                  <p className="text-2xl font-black text-white">{bulkResult.total_amount.toLocaleString()} FCFA</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-blue-300 mb-2">Important</p>
                  <ul className="text-xs text-[#B5B5B5] space-y-1">
                    <li>• Les billets ont été marqués comme "ADMIN_BULK"</li>
                    <li>• Ils sont immédiatement scannables le jour J</li>
                    <li>• Le stock a été déduit automatiquement</li>
                    <li>• Commission 5% appliquée, Frais passerelle 0%</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={handleDownloadCSV}
              className="w-full px-6 py-4 bg-gradient-to-r from-[#FF5F05] to-[#FF8C42] text-white rounded-2xl font-black text-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
            >
              <Download className="w-6 h-6" />
              Télécharger CSV avec QR Codes
            </button>

            <button
              onClick={onClose}
              className="w-full px-6 py-4 bg-[#0F0F0F] border-2 border-[#2A2A2A] hover:border-[#FF5F05] text-white rounded-2xl font-bold text-lg transition-all"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A1A] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#2A2A2A]">
        <div className="sticky top-0 bg-[#1A1A1A] p-6 border-b border-[#2A2A2A] flex justify-between items-center">
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Package className="w-7 h-7 text-[#FF5F05]" />
            Vente de Bloc / Dotation
          </h2>
          <button
            onClick={onClose}
            className="text-[#B5B5B5] hover:text-white transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-orange-300 mb-1">Accès Restreint - Admin Finance</p>
                <p className="text-xs text-[#B5B5B5]">
                  Cette fonction permet de générer des billets en masse pour des ventes hors-ligne (espèces, chèques, partenaires).
                  Le stock sera déduit immédiatement.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Événement *
            </label>
            <select
              value={selectedEvent?.id || ''}
              onChange={(e) => {
                const event = events.find(ev => ev.id === e.target.value);
                setSelectedEvent(event || null);
                setSelectedTicketType(null);
              }}
              className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#FF5F05]"
              disabled={loading}
            >
              <option value="">Sélectionner un événement</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>

          {selectedEvent && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Catégorie de Billet *
              </label>
              <select
                value={selectedTicketType?.id || ''}
                onChange={(e) => {
                  const ticketType = selectedEvent.ticket_types.find(tt => tt.id === e.target.value);
                  setSelectedTicketType(ticketType || null);
                }}
                className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#FF5F05]"
                disabled={loading}
              >
                <option value="">Sélectionner une catégorie</option>
                {selectedEvent.ticket_types.map(tt => (
                  <option key={tt.id} value={tt.id}>
                    {tt.name} - {tt.price.toLocaleString()} FCFA (Dispo: {tt.quantity_total - tt.quantity_sold})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedTicketType && (
            <>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Quantité * (Max: {selectedTicketType.quantity_total - selectedTicketType.quantity_sold})
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedTicketType.quantity_total - selectedTicketType.quantity_sold}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#FF5F05]"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Dotation équipe X, Partenaire Y..."
                  className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#FF5F05] resize-none"
                  rows={3}
                  disabled={loading}
                />
              </div>

              <div className="bg-[#0F0F0F] rounded-2xl p-4 border border-[#2A2A2A]">
                <h3 className="text-sm font-bold text-white mb-3">Aperçu</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#B5B5B5]">Prix unitaire:</span>
                    <span className="text-white font-bold">{selectedTicketType.price.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#B5B5B5]">Quantité:</span>
                    <span className="text-white font-bold">{quantity}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#2A2A2A]">
                    <span className="text-white font-bold">Total:</span>
                    <span className="text-2xl font-black text-[#FF5F05]">
                      {(selectedTicketType.price * quantity).toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="text-xs text-[#B5B5B5] mt-2">
                    <p>• Commission 5%: {(selectedTicketType.price * quantity * 0.05).toLocaleString()} FCFA</p>
                    <p>• Frais passerelle: 0 FCFA (vente hors-ligne)</p>
                  </div>
                </div>
              </div>
            </>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || !selectedTicketType || quantity < 1}
            className="w-full px-6 py-4 bg-gradient-to-r from-[#FF5F05] to-[#FF8C42] text-white rounded-2xl font-black text-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Package className="w-6 h-6" />
                Générer {quantity} Billet{quantity > 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
