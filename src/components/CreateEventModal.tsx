import { useState } from 'react';
import { X, CheckCircle, Plus, Trash2, Upload, Image as ImageIcon, Shield, AlertCircle } from 'lucide-react';
import { Timestamp, addDoc, collection } from 'firebase/firestore';
import { firestore } from '../firebase';
import { uploadToCloudinary } from '../lib/cloudinary';
import { VIP_THRESHOLD, isEligibleForVIPFastTrack, formatCurrency } from '../lib/financialModel';
import EventSubmissionConfirmModal from './EventSubmissionConfirmModal';

interface CreateEventModalProps {
  isDark: boolean;
  organizerData: any;
  categories: any[];
  onClose: () => void;
  onSuccess: () => void;
}

interface TicketType {
  name: string;
  price: number;
  quantity: number;
}

export default function CreateEventModal({
  isDark,
  organizerData,
  categories,
  onClose,
  onSuccess,
}: CreateEventModalProps) {
  const [processing, setProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCGUModal, setShowCGUModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [exclusivityAgreement, setExclusivityAgreement] = useState(false);
  const [cguAccepted, setCguAccepted] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'concerts',
    start_date: '',
    end_date: '',
    venue_name: '',
    venue_city: '',
    event_image: null as File | null,
    total_capacity: 0,
  });

  const eventCategories = [
    'Concerts',
    'Lutte Sénégalaise',
    'Sport',
    'Conférence',
    'Culture',
    'Théâtre',
    'Soirée',
    'Festival',
    'Art',
    'Autres'
  ];

  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    { name: 'Standard', price: 5000, quantity: 100 },
  ]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, event_image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addTicketType = () => {
    setTicketTypes([...ticketTypes, { name: '', price: 0, quantity: 0 }]);
  };

  const removeTicketType = (index: number) => {
    if (ticketTypes.length > 1) {
      setTicketTypes(ticketTypes.filter((_, i) => i !== index));
    }
  };

  const updateTicketType = (index: number, field: keyof TicketType, value: string | number) => {
    const updated = [...ticketTypes];
    updated[index] = { ...updated[index], [field]: value };
    setTicketTypes(updated);
  };

  const calculateTotalCapacity = () => {
    return ticketTypes.reduce((sum, t) => sum + Number(t.quantity), 0);
  };

  const handleExclusivityToggle = (checked: boolean) => {
    if (checked) {
      // Si activé, afficher la modale CGU
      setShowCGUModal(true);
    } else {
      // Si désactivé, réinitialiser
      setExclusivityAgreement(false);
      setCguAccepted(false);
    }
  };

  const handleCGUAccept = () => {
    setCguAccepted(true);
    setExclusivityAgreement(true);
    setShowCGUModal(false);
  };

  const handleCGUDecline = () => {
    setCguAccepted(false);
    setExclusivityAgreement(false);
    setShowCGUModal(false);
  };

  const isVIPEligible = calculateTotalCapacity() >= VIP_THRESHOLD && exclusivityAgreement;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizerData || !organizerData.id) {
      alert('Erreur : Profil organisateur non trouvé. Veuillez vous reconnecter.');
      return;
    }

    const validTickets = ticketTypes.filter(t => t.name && t.quantity > 0);
    if (validTickets.length === 0) {
      alert('Veuillez ajouter au moins un type de billet avec un nom et une quantité');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSubmission = async () => {
    setProcessing(true);
    try {
      const slug = formData.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      let event_image_url = 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg';

      if (formData.event_image) {
        try {
          event_image_url = await uploadToCloudinary(formData.event_image, 'event_images');
        } catch (uploadError) {
          console.warn('Failed to upload image, using default:', uploadError);
        }
      }

      const totalCapacity = calculateTotalCapacity();

      const isVIP = isEligibleForVIPFastTrack(totalCapacity, exclusivityAgreement);

      const eventData: any = {
        title: formData.title || 'Sans titre',
        description: formData.description || '',
        category: formData.category || 'concerts',
        start_date: formData.start_date || new Date().toISOString(),
        end_date: formData.end_date || formData.start_date || new Date().toISOString(),
        venue_name: formData.venue_name || '',
        venue_city: formData.venue_city || '',
        organizer_id: organizerData.id,
        slug,
        status: 'pending',
        is_featured: false,
        is_free: false,
        event_image_url: event_image_url,
        total_capacity: totalCapacity,

        // Financial Model VIP & Fast Track (H.3)
        vipThreshold: VIP_THRESHOLD,
        exclusivityAgreement: exclusivityAgreement,
        exclusivityCGUAccepted: cguAccepted,
        fastTrackEnabled: isVIP,
        totalTicketsSold: 0,
        totalRevenue: 0,
        releasedFunds: 0,
        escrowFunds: 0,
        platformCommission: 0,

        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      };

      Object.keys(eventData).forEach(key => {
        if (eventData[key] === undefined) {
          delete eventData[key];
        }
      });

      console.log('[CREATE EVENT] Creating event with data:', eventData);
      const eventRef = await addDoc(collection(firestore, 'events'), eventData);
      console.log('[CREATE EVENT] Event created with ID:', eventRef.id);
      console.log('[CREATE EVENT] Event slug:', slug);

      console.log('[CREATE EVENT] Creating', ticketTypes.length, 'ticket types...');
      let ticketCount = 0;
      for (const ticketType of ticketTypes) {
        if (ticketType.name && ticketType.quantity > 0) {
          const ticketData = {
            event_id: eventRef.id,
            name: ticketType.name,
            price: ticketType.price || 0,
            quantity_total: ticketType.quantity,
            quantity_sold: 0,
            is_active: true,
            created_at: Timestamp.now(),
          };
          console.log(`[CREATE EVENT] Creating ticket ${ticketCount + 1}:`, ticketData);
          const ticketRef = await addDoc(collection(firestore, 'ticket_types'), ticketData);
          console.log(`[CREATE EVENT] Ticket created with ID:`, ticketRef.id);
          ticketCount++;
        }
      }

      console.log(`[CREATE EVENT] ✅ ${ticketCount} billets créés pour l'événement ${eventRef.id}`);
      console.log('[CREATE EVENT] Événement soumis avec status=pending pour modération');
      setShowConfirmModal(false);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('[CREATE EVENT] Error creating event:', error);
      const errorMessage = error?.message || 'Erreur inconnue';
      alert(`Erreur lors de la création de l'événement:\n${errorMessage}\n\nVérifiez votre connexion et réessayez.`);
      setShowConfirmModal(false);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto">
      <div className="rounded-[32px] max-w-4xl w-full max-h-[95vh] overflow-y-auto border border-[#FF6B00]/30 bg-[#0A0A0B] my-8">
        <div className="sticky top-0 p-6 border-b border-[#FF6B00]/30 flex justify-between items-center z-10 bg-[#0A0A0B]/95 backdrop-blur-xl">
          <h2 className="text-2xl font-black text-white">
            Créer un événement
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors hover:bg-white/10 text-[#FF6B00]"
            disabled={processing}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold mb-2 text-[#FF6B00]">
                Affiche de l'événement
              </label>
              <div className="relative border-2 border-dashed rounded-2xl p-6 transition-colors border-white/10 hover:border-[#FF6B00]/40">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData({ ...formData, event_image: null });
                      }}
                      className="absolute top-2 right-2 p-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center cursor-pointer">
                    <ImageIcon className="w-12 h-12 mb-2 text-[#FF6B00]" />
                    <span className="text-sm font-medium text-white">
                      Cliquer pour télécharger une image
                    </span>
                    <span className="text-xs mt-1 text-white/60">
                      PNG, JPG jusqu'à 10MB
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={processing}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold mb-2 text-[#FF6B00]">
                Titre de l'événement
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors bg-white/5 border-white/10 text-white focus:border-[#FF6B00] focus:outline-none placeholder-white/40"
                placeholder="Concert de Youssou N'Dour..."
                required
                disabled={processing}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold mb-2 text-[#FF6B00]">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors bg-white/5 border-white/10 text-white focus:border-[#FF6B00] placeholder-white/40 focus:outline-none"
                placeholder="Décrivez votre événement..."
                rows={4}
                required
                disabled={processing}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-[#FF6B00]">
                Catégorie
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors bg-white/5 border-white/10 text-white focus:border-[#FF6B00] placeholder-white/40 focus:outline-none"
                required
                disabled={processing}
              >
                {eventCategories.map(cat => (
                  <option key={cat} value={cat.toLowerCase()}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-[#FF6B00]">
                Date et heure de début
              </label>
              <input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors bg-white/5 border-white/10 text-white focus:border-[#FF6B00] placeholder-white/40 focus:outline-none"
                required
                disabled={processing}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-[#FF6B00]">
                Date et heure de fin
              </label>
              <input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors bg-white/5 border-white/10 text-white focus:border-[#FF6B00] placeholder-white/40 focus:outline-none"
                placeholder="Optionnel - pour événements longue durée"
                disabled={processing}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-[#FF6B00]">
                Nom du lieu
              </label>
              <input
                type="text"
                value={formData.venue_name}
                onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors bg-white/5 border-white/10 text-white focus:border-[#FF6B00] placeholder-white/40 focus:outline-none"
                placeholder="Stade Demba Diop"
                required
                disabled={processing}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-[#FF6B00]">
                Ville
              </label>
              <input
                type="text"
                value={formData.venue_city}
                onChange={(e) => setFormData({ ...formData, venue_city: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors bg-white/5 border-white/10 text-white focus:border-[#FF6B00] placeholder-white/40 focus:outline-none"
                placeholder="Dakar"
                required
                disabled={processing}
              />
            </div>
          </div>

          <div className="p-6 rounded-2xl border-2 bg-white/5 border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-white">
                Types de billets
              </h3>
              <button
                type="button"
                onClick={addTicketType}
                className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 ${
                  isDark
                    ? 'bg-[#FF6B00]/20 hover:bg-[#FF6B00]/30 text-[#FF6B00]'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
                disabled={processing}
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>

            <div className="space-y-4">
              {ticketTypes.map((ticket, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl border bg-white/5 border-white/10"
                >
                  <div>
                    <label className="block text-xs font-bold mb-2 text-white">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={ticket.name}
                      onChange={(e) => updateTicketType(index, 'name', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border font-medium text-sm ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white focus:border-[#FF6B00]'
                          : 'bg-white border-slate-200 text-slate-900'
                      } focus:outline-none`}
                      placeholder="VIP, Standard..."
                      disabled={processing}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-2 text-white">
                      Prix (FCFA)
                    </label>
                    <input
                      type="number"
                      value={ticket.price}
                      onChange={(e) => updateTicketType(index, 'price', Number(e.target.value))}
                      className={`w-full px-3 py-2 rounded-lg border font-medium text-sm ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white focus:border-[#FF6B00]'
                          : 'bg-white border-slate-200 text-slate-900'
                      } focus:outline-none`}
                      placeholder="5000"
                      disabled={processing}
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-2 text-white">
                      Quantité
                    </label>
                    <input
                      type="number"
                      value={ticket.quantity}
                      onChange={(e) => updateTicketType(index, 'quantity', Number(e.target.value))}
                      className={`w-full px-3 py-2 rounded-lg border font-medium text-sm ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white focus:border-[#FF6B00]'
                          : 'bg-white border-slate-200 text-slate-900'
                      } focus:outline-none`}
                      placeholder="100"
                      disabled={processing}
                      min="1"
                    />
                  </div>

                  <div className="flex items-end">
                    {ticketTypes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTicketType(index)}
                        className="w-full px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold text-sm transition-colors"
                        disabled={processing}
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 rounded-xl bg-[#FF6B00]/10">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#FF6B00]">
                  Capacité totale
                </span>
                <span className="text-2xl font-black text-white">
                  {calculateTotalCapacity()} places
                </span>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl border-2 ${
            isDark ? 'bg-[#10B981]/10 border-[#10B981]/30' : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-start gap-3 mb-4">
              <Shield className="w-6 h-6 mt-1 text-[#10B981]" />
              <div className="flex-1">
                <h3 className="text-lg font-black mb-1 text-white">
                  Modèle Financier VIP & Fast Track
                </h3>
                <p className="text-sm text-white/70">
                  Activez l'Accord Exclusivité pour bénéficier du reversement automatique et du statut VIP
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className={`flex items-center justify-between p-4 rounded-xl ${
                isDark ? 'bg-white/5' : 'bg-white'
              }`}>
                <div className="flex-1">
                  <div className="font-bold mb-1 text-white">
                    Accord Exclusivité
                  </div>
                  <div className="text-xs text-white/60">
                    Commission 5% ajoutée au prix • Reversement automatique 70% pour VIP
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exclusivityAgreement}
                    onChange={(e) => handleExclusivityToggle(e.target.checked)}
                    className="sr-only peer"
                    disabled={processing}
                  />
                  <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#10B981]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#10B981]"></div>
                </label>
              </div>

              {calculateTotalCapacity() >= VIP_THRESHOLD && (
                <div className={`p-4 rounded-xl border-2 ${
                  isVIPEligible
                    ? 'bg-[#10B981]/20 border-[#10B981]/40'
                    : 'bg-orange-500/10 border-orange-500/30'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {isVIPEligible ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-[#10B981]" />
                        <span className="font-black text-[#10B981]">
                          ⚡ STATUT VIP FAST TRACK ACTIVÉ
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-orange-400" />
                        <span className="font-black text-orange-400">
                          Éligible VIP • Activez l'Accord Exclusivité
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-white/70">
                    {isVIPEligible ? (
                      <>
                        ✅ Reversement automatique de 70% du CA après chaque vente<br />
                        ✅ 25% en séquestre de sécurité<br />
                        ✅ 5% commission platform
                      </>
                    ) : (
                      <>
                        📊 Capacité : {calculateTotalCapacity()} / {VIP_THRESHOLD} places<br />
                        🔓 Activez l'Accord Exclusivité pour débloquer le Fast Track
                      </>
                    )}
                  </div>
                </div>
              )}

              {!exclusivityAgreement && (
                <div className={`p-3 rounded-xl text-xs ${
                  isDark ? 'bg-blue-500/10 text-blue-300' : 'bg-blue-50 text-blue-700'
                }`}>
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Sans Accord Exclusivité : Commission 5% partagée (2.5% acheteur / 2.5% vendeur)
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={processing}
            className={`w-full px-6 py-4 rounded-2xl transition-all font-black text-lg shadow-xl flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-[#E55F00] text-black ${
              processing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {processing ? (
              <>
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Créer l'événement avec {ticketTypes.length} type{ticketTypes.length > 1 ? 's' : ''} de billet
              </>
            )}
          </button>
        </form>
      </div>

      {showCGUModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
          <div className="rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-[#0A0A0B] border border-white/10">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-2xl font-black text-white mb-2">
                Conditions Générales d'Utilisation - Accord Exclusivité
              </h3>
              <p className="text-sm text-white/60">
                Veuillez lire et accepter les conditions suivantes
              </p>
            </div>

            <div className="p-6 space-y-4 text-sm text-white/80">
              <div>
                <h4 className="font-bold text-white mb-2">1. COMMISSION ET TARIFICATION</h4>
                <p>
                  En activant l'Accord Exclusivité, vous acceptez que la commission de 5% soit ajoutée au prix de vente du billet et payée par l'acheteur final. Vous recevez l'intégralité du prix HT (Hors Taxes) que vous avez défini.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">2. PLAFOND DES FRAIS</h4>
                <p>
                  Les frais de service sont plafonnés à 2 500 FCFA maximum par billet, quel que soit le prix de vente.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">3. STATUT VIP FAST TRACK</h4>
                <p>
                  Si votre événement a une capacité totale d'au moins <strong>2 000 billets</strong> ET que l'Accord Exclusivité est activé, vous bénéficiez du statut <strong>VIP Fast Track ⚡</strong> :
                </p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li><strong>70% du chiffre d'affaires</strong> est reversé automatiquement sur votre solde après chaque vente</li>
                  <li><strong>25%</strong> reste en séquestre de sécurité jusqu'à la tenue de l'événement</li>
                  <li><strong>5%</strong> correspondent à la commission platform</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">4. FRAIS DE RETRAIT</h4>
                <p>
                  Lors du retrait de vos fonds, des frais techniques de <strong>2%</strong> sont appliqués pour couvrir les frais de transaction bancaire et mobile money.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">5. SÉQUESTRE DE SÉCURITÉ</h4>
                <p>
                  Le séquestre de sécurité (25% pour VIP, 95% pour Standard) est libéré après la tenue de l'événement et la validation des scans d'entrée. Ce mécanisme protège à la fois les organisateurs et les acheteurs.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">6. EXCLUSIVITÉ PLATFORM</h4>
                <p>
                  En activant cet accord, vous vous engagez à utiliser DemDem Transports & Events comme plateforme exclusive de billetterie pour cet événement. Toute vente en dehors de la plateforme peut entraîner la suspension de votre compte organisateur.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                <AlertCircle className="w-5 h-5 inline mr-2 text-yellow-400" />
                <span className="text-yellow-300 font-semibold">
                  En acceptant ces conditions, vous reconnaissez avoir lu et compris l'ensemble des termes de l'Accord Exclusivité.
                </span>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex gap-3">
              <button
                onClick={handleCGUDecline}
                className="flex-1 px-6 py-3 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
              >
                Refuser
              </button>
              <button
                onClick={handleCGUAccept}
                className="flex-1 px-6 py-3 rounded-xl font-bold bg-[#10B981] hover:bg-[#059669] text-black transition-all"
              >
                ✓ Accepter les CGU
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <EventSubmissionConfirmModal
          onConfirm={handleConfirmSubmission}
          onCancel={() => setShowConfirmModal(false)}
          processing={processing}
        />
      )}
    </div>
  );
}
