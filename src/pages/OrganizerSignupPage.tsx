import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Phone, User, FileText, Globe, MapPin, ArrowLeft } from 'lucide-react';

export default function OrganizerSignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    organization_name: '',
    organization_type: 'individual' as 'individual' | 'company' | 'association' | 'ngo',
    description: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    city: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('[MOCK] Creating organizer account:', formData);

      setTimeout(() => {
        alert('✅ Demande envoyée avec succès!\n\nVotre compte organisateur est en attente de validation par notre équipe.\n\nVous recevrez un email de confirmation une fois votre compte approuvé.');
        navigate('/organizer/login');
      }, 1500);
    } catch (error) {
      console.error('Error creating organizer:', error);
      alert('❌ Erreur lors de la création du compte');
      setLoading(false);
    }
  };

  const organizationTypes = [
    { value: 'individual', label: 'Individuel', description: 'Artiste solo, freelance' },
    { value: 'company', label: 'Entreprise', description: 'Société commerciale' },
    { value: 'association', label: 'Association', description: 'Organisation à but non lucratif' },
    { value: 'ngo', label: 'ONG', description: 'Organisation non gouvernementale' },
  ];

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center py-12 px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-[#B5B5B5] hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">
            Devenir <span className="text-[#FF5F05]">Organisateur</span>
          </h1>
          <p className="text-[#B5B5B5]">
            Créez et gérez vos événements sur EvenPass
          </p>
        </div>

        <div className="bg-[#2A2A2A] rounded-2xl border border-[#2A2A2A] overflow-hidden">
          <div className="bg-[#0F0F0F] px-8 py-4 border-b border-[#2A2A2A]">
            <div className="flex items-center justify-between">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                      step >= s ? 'bg-[#FF5F05] text-white' : 'bg-[#2A2A2A] text-[#B5B5B5]'
                    }`}
                  >
                    {s}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className={`font-bold ${step >= s ? 'text-white' : 'text-[#B5B5B5]'}`}>
                      {s === 1 ? 'Informations personnelles' : 'Informations organisation'}
                    </p>
                  </div>
                  {s < 2 && (
                    <div className={`h-1 flex-1 mx-4 rounded ${step > s ? 'bg-[#FF5F05]' : 'bg-[#2A2A2A]'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Vos informations</h2>

                <div>
                  <label className="block text-sm font-medium text-[#B5B5B5] mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-white placeholder-[#B5B5B5] focus:outline-none focus:border-[#FF5F05]"
                    placeholder="Votre nom complet"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#B5B5B5] mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-white placeholder-[#B5B5B5] focus:outline-none focus:border-[#FF5F05]"
                      placeholder="votre@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#B5B5B5] mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-white placeholder-[#B5B5B5] focus:outline-none focus:border-[#FF5F05]"
                      placeholder="77 123 45 67"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-8 py-3 bg-gradient-to-r from-[#FF5F05] to-[#FF8C42] hover:from-[#FF7A00] hover:to-[#FFA05D] text-white rounded-lg font-bold transition-all"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Votre organisation</h2>

                <div>
                  <label className="block text-sm font-medium text-[#B5B5B5] mb-2">
                    <Building2 className="w-4 h-4 inline mr-2" />
                    Nom de l'organisation *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.organization_name}
                    onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-white placeholder-[#B5B5B5] focus:outline-none focus:border-[#FF5F05]"
                    placeholder="Nom de votre organisation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#B5B5B5] mb-3">
                    Type d'organisation *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {organizationTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, organization_type: type.value as any })}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          formData.organization_type === type.value
                            ? 'border-[#FF5F05] bg-[#FF5F05]/10'
                            : 'border-[#2A2A2A] hover:border-[#B5B5B5]'
                        }`}
                      >
                        <p className="font-bold text-white">{type.label}</p>
                        <p className="text-sm text-[#B5B5B5] mt-1">{type.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#B5B5B5] mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-white placeholder-[#B5B5B5] focus:outline-none focus:border-[#FF5F05]"
                    placeholder="Présentez votre organisation..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#B5B5B5] mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email de contact *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-white placeholder-[#B5B5B5] focus:outline-none focus:border-[#FF5F05]"
                      placeholder="contact@organisation.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#B5B5B5] mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Téléphone de contact *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-white placeholder-[#B5B5B5] focus:outline-none focus:border-[#FF5F05]"
                      placeholder="77 123 45 67"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#B5B5B5] mb-2">
                      <Globe className="w-4 h-4 inline mr-2" />
                      Site web
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-white placeholder-[#B5B5B5] focus:outline-none focus:border-[#FF5F05]"
                      placeholder="https://votresite.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#B5B5B5] mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Ville *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-white placeholder-[#B5B5B5] focus:outline-none focus:border-[#FF5F05]"
                      placeholder="Dakar"
                    />
                  </div>
                </div>

                <div className="bg-[#0F0F0F] rounded-lg p-4 border border-[#2A2A2A]">
                  <p className="text-sm text-[#B5B5B5]">
                    En soumettant ce formulaire, vous acceptez que votre demande soit examinée par notre équipe.
                    Vous serez notifié par email une fois votre compte approuvé.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-8 py-3 bg-[#2A2A2A] hover:bg-[#404040] text-white rounded-lg font-bold transition-all"
                  >
                    Précédent
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-8 py-3 bg-gradient-to-r from-[#FF5F05] to-[#FF8C42] hover:from-[#FF7A00] hover:to-[#FFA05D] text-white rounded-lg font-bold transition-all disabled:opacity-50"
                  >
                    {loading ? 'Envoi en cours...' : 'Soumettre la demande'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <p className="text-center text-[#B5B5B5] mt-6">
          Déjà organisateur ?{' '}
          <button
            onClick={() => navigate('/organizer/login')}
            className="text-[#FF5F05] hover:underline font-bold"
          >
            Se connecter
          </button>
        </p>
      </div>
    </div>
  );
}
