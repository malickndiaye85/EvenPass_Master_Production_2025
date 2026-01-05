import { useState } from 'react';
import { X, CheckCircle, Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { Timestamp, addDoc, collection } from 'firebase/firestore';
import { firestore } from '../firebase';
import { uploadToCloudinary } from '../lib/cloudinary';

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

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    venue_name: '',
    venue_city: '',
    event_image: null as File | null,
    total_capacity: 0,
  });

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

      const eventData: any = {
        title: formData.title || 'Sans titre',
        description: formData.description || '',
        start_date: formData.start_date || new Date().toISOString(),
        venue_name: formData.venue_name || '',
        venue_city: formData.venue_city || '',
        organizer_id: organizerData.id,
        slug,
        status: 'draft',
        is_featured: false,
        is_free: false,
        event_image_url: event_image_url,
        total_capacity: totalCapacity,
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

      for (const ticketType of ticketTypes) {
        if (ticketType.name && ticketType.quantity > 0) {
          await addDoc(collection(firestore, 'ticket_types'), {
            event_id: eventRef.id,
            name: ticketType.name,
            price: ticketType.price || 0,
            quantity_total: ticketType.quantity,
            quantity_sold: 0,
            is_active: true,
            created_at: Timestamp.now(),
          });
        }
      }

      alert('Événement créé avec succès avec les types de billets!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('[CREATE EVENT] Error creating event:', error);
      const errorMessage = error?.message || 'Erreur inconnue';
      alert(`Erreur lors de la création de l'événement:\n${errorMessage}\n\nVérifiez votre connexion et réessayez.`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={`rounded-[32px] max-w-4xl w-full max-h-[95vh] overflow-y-auto border my-8 ${
        isDark
          ? 'bg-gradient-to-br from-amber-950/95 to-orange-950/95 border-amber-800/40'
          : 'bg-white border-slate-200'
      }`}>
        <div className={`sticky top-0 p-6 border-b flex justify-between items-center z-10 ${
          isDark
            ? 'bg-amber-950/95 backdrop-blur-xl border-amber-800/40'
            : 'bg-white backdrop-blur-xl border-slate-200'
        }`}>
          <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Créer un événement
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDark
                ? 'hover:bg-amber-900/40 text-amber-400'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
            disabled={processing}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className={`block text-sm font-bold mb-2 ${
                isDark ? 'text-amber-300' : 'text-slate-700'
              }`}>
                Affiche de l'événement
              </label>
              <div className={`relative border-2 border-dashed rounded-2xl p-6 transition-colors ${
                isDark
                  ? 'border-amber-800/40 hover:border-amber-700/60'
                  : 'border-slate-200 hover:border-slate-300'
              }`}>
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
                    <ImageIcon className={`w-12 h-12 mb-2 ${
                      isDark ? 'text-amber-400' : 'text-slate-400'
                    }`} />
                    <span className={`text-sm font-medium ${
                      isDark ? 'text-amber-400' : 'text-slate-600'
                    }`}>
                      Cliquer pour télécharger une image
                    </span>
                    <span className={`text-xs mt-1 ${
                      isDark ? 'text-amber-400/60' : 'text-slate-500'
                    }`}>
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
              <label className={`block text-sm font-bold mb-2 ${
                isDark ? 'text-amber-300' : 'text-slate-700'
              }`}>
                Titre de l'événement
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors ${
                  isDark
                    ? 'bg-amber-950/40 border-amber-800/40 text-white focus:border-amber-600'
                    : 'bg-white border-slate-200 text-slate-900 focus:border-orange-500'
                } focus:outline-none`}
                placeholder="Concert de Youssou N'Dour..."
                required
                disabled={processing}
              />
            </div>

            <div className="md:col-span-2">
              <label className={`block text-sm font-bold mb-2 ${
                isDark ? 'text-amber-300' : 'text-slate-700'
              }`}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors ${
                  isDark
                    ? 'bg-amber-950/40 border-amber-800/40 text-white focus:border-amber-600'
                    : 'bg-white border-slate-200 text-slate-900 focus:border-orange-500'
                } focus:outline-none`}
                placeholder="Décrivez votre événement..."
                rows={4}
                required
                disabled={processing}
              />
            </div>

            <div>
              <label className={`block text-sm font-bold mb-2 ${
                isDark ? 'text-amber-300' : 'text-slate-700'
              }`}>
                Date et heure
              </label>
              <input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors ${
                  isDark
                    ? 'bg-amber-950/40 border-amber-800/40 text-white focus:border-amber-600'
                    : 'bg-white border-slate-200 text-slate-900 focus:border-orange-500'
                } focus:outline-none`}
                required
                disabled={processing}
              />
            </div>

            <div>
              <label className={`block text-sm font-bold mb-2 ${
                isDark ? 'text-amber-300' : 'text-slate-700'
              }`}>
                Nom du lieu
              </label>
              <input
                type="text"
                value={formData.venue_name}
                onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors ${
                  isDark
                    ? 'bg-amber-950/40 border-amber-800/40 text-white focus:border-amber-600'
                    : 'bg-white border-slate-200 text-slate-900 focus:border-orange-500'
                } focus:outline-none`}
                placeholder="Stade Demba Diop"
                required
                disabled={processing}
              />
            </div>

            <div>
              <label className={`block text-sm font-bold mb-2 ${
                isDark ? 'text-amber-300' : 'text-slate-700'
              }`}>
                Ville
              </label>
              <input
                type="text"
                value={formData.venue_city}
                onChange={(e) => setFormData({ ...formData, venue_city: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors ${
                  isDark
                    ? 'bg-amber-950/40 border-amber-800/40 text-white focus:border-amber-600'
                    : 'bg-white border-slate-200 text-slate-900 focus:border-orange-500'
                } focus:outline-none`}
                placeholder="Dakar"
                required
                disabled={processing}
              />
            </div>
          </div>

          <div className={`p-6 rounded-2xl border-2 ${
            isDark ? 'bg-amber-950/20 border-amber-800/40' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Types de billets
              </h3>
              <button
                type="button"
                onClick={addTicketType}
                className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 ${
                  isDark
                    ? 'bg-amber-800/40 hover:bg-amber-800/60 text-amber-300'
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
                  className={`grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl border ${
                    isDark ? 'bg-amber-950/40 border-amber-800/40' : 'bg-white border-slate-200'
                  }`}
                >
                  <div>
                    <label className={`block text-xs font-bold mb-2 ${
                      isDark ? 'text-amber-400' : 'text-slate-600'
                    }`}>
                      Nom
                    </label>
                    <input
                      type="text"
                      value={ticket.name}
                      onChange={(e) => updateTicketType(index, 'name', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border font-medium text-sm ${
                        isDark
                          ? 'bg-amber-950/60 border-amber-800/40 text-white'
                          : 'bg-white border-slate-200 text-slate-900'
                      } focus:outline-none`}
                      placeholder="VIP, Standard..."
                      disabled={processing}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-2 ${
                      isDark ? 'text-amber-400' : 'text-slate-600'
                    }`}>
                      Prix (FCFA)
                    </label>
                    <input
                      type="number"
                      value={ticket.price}
                      onChange={(e) => updateTicketType(index, 'price', Number(e.target.value))}
                      className={`w-full px-3 py-2 rounded-lg border font-medium text-sm ${
                        isDark
                          ? 'bg-amber-950/60 border-amber-800/40 text-white'
                          : 'bg-white border-slate-200 text-slate-900'
                      } focus:outline-none`}
                      placeholder="5000"
                      disabled={processing}
                      min="0"
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-2 ${
                      isDark ? 'text-amber-400' : 'text-slate-600'
                    }`}>
                      Quantité
                    </label>
                    <input
                      type="number"
                      value={ticket.quantity}
                      onChange={(e) => updateTicketType(index, 'quantity', Number(e.target.value))}
                      className={`w-full px-3 py-2 rounded-lg border font-medium text-sm ${
                        isDark
                          ? 'bg-amber-950/60 border-amber-800/40 text-white'
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

            <div className={`mt-4 p-4 rounded-xl ${
              isDark ? 'bg-amber-900/20' : 'bg-orange-50'
            }`}>
              <div className="flex justify-between items-center">
                <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-slate-700'}`}>
                  Capacité totale
                </span>
                <span className={`text-2xl font-black ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {calculateTotalCapacity()} places
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={processing}
            className={`w-full px-6 py-4 rounded-2xl transition-all font-black text-lg shadow-xl flex items-center justify-center gap-2 ${
              processing ? 'opacity-50 cursor-not-allowed' : ''
            } ${
              isDark
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-black'
                : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white'
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
    </div>
  );
}
