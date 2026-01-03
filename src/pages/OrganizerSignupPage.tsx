import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Phone, User, FileText, Globe, MapPin, ArrowLeft, Lock, Wallet, Upload, AlertCircle } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, db } from '../firebase';
import { uploadToCloudinary } from '../lib/cloudinary';

export default function OrganizerSignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    organization_name: '',
    organization_type: 'individual' as 'individual' | 'company',
    description: '',
    contact_email: '',
    contact_phone: '',
    merchant_number: '',
    merchant_provider: 'wave' as 'wave' | 'orange_money',
    website: '',
    city: '',
  });

  const [documents, setDocuments] = useState<{
    cni?: File;
    registre?: File;
  }>({});

  const handleFileChange = (type: 'cni' | 'registre', file: File | null) => {
    if (file) {
      setDocuments(prev => ({ ...prev, [type]: file }));
    }
  };

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!formData.full_name.trim()) {
        setError('Le nom complet est obligatoire');
        return false;
      }
      if (!formData.email.trim() || !formData.email.includes('@')) {
        setError('Email valide requis');
        return false;
      }
      if (!formData.phone.trim()) {
        setError('Le téléphone est obligatoire');
        return false;
      }
      if (!formData.password || formData.password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères');
        return false;
      }
    }

    if (currentStep === 2) {
      if (!formData.organization_name.trim()) {
        setError('Le nom de structure est obligatoire');
        return false;
      }
      if (!formData.contact_email.trim() || !formData.contact_email.includes('@')) {
        setError('Email de contact valide requis');
        return false;
      }
      if (!formData.contact_phone.trim()) {
        setError('Le téléphone de contact est obligatoire');
        return false;
      }
      if (!formData.city.trim()) {
        setError('La ville est obligatoire');
        return false;
      }
    }

    if (currentStep === 3) {
      if (!formData.merchant_number.trim()) {
        setError('Le numéro marchand est obligatoire');
        return false;
      }
      if (formData.organization_type === 'company') {
        if (!documents.cni) {
          setError('La CNI est obligatoire pour les entreprises');
          return false;
        }
        if (!documents.registre) {
          setError('Le registre de commerce est obligatoire pour les entreprises');
          return false;
        }
      }
    }

    setError('');
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('[ORGANIZER SIGNUP] Starting signup process...');

      // Déconnecter tout utilisateur actuellement connecté
      console.log('[ORGANIZER SIGNUP] Signing out any existing user...');
      await auth.signOut();

      console.log('[ORGANIZER SIGNUP] Creating Firebase auth user...');
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      const userId = user.uid;
      console.log('[ORGANIZER SIGNUP] User created with ID:', userId);

      console.log('[ORGANIZER SIGNUP] Creating user profile in database...');
      await set(ref(db, `users/${userId}`), {
        uid: userId,
        email: formData.email,
        full_name: formData.full_name,
        phone: formData.phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        role: 'organizer'
      });
      console.log('[ORGANIZER SIGNUP] User profile created');

      const verificationDocuments: any = {};

      if (documents.cni) {
        console.log('[ORGANIZER SIGNUP] Uploading CNI document to Cloudinary...');
        const cniUrl = await uploadToCloudinary(documents.cni, `verification-documents/${userId}`);
        verificationDocuments.cni = cniUrl;
        console.log('[ORGANIZER SIGNUP] CNI uploaded successfully to Cloudinary');
      }

      if (documents.registre) {
        console.log('[ORGANIZER SIGNUP] Uploading registre document to Cloudinary...');
        const registreUrl = await uploadToCloudinary(documents.registre, `verification-documents/${userId}`);
        verificationDocuments.registre = registreUrl;
        console.log('[ORGANIZER SIGNUP] Registre uploaded successfully to Cloudinary');
      }

      console.log('[ORGANIZER SIGNUP] Creating organizer profile...');
      await set(ref(db, `organizers/${userId}`), {
        uid: userId,
        user_id: userId,
        organization_name: formData.organization_name,
        organization_type: formData.organization_type,
        description: formData.description,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        website: formData.website || null,
        verification_status: 'pending',
        verification_documents: verificationDocuments,
        bank_account_info: {
          provider: formData.merchant_provider,
          phone: formData.merchant_number,
        },
        commission_rate: 10,
        total_events_created: 0,
        total_tickets_sold: 0,
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      console.log('[ORGANIZER SIGNUP] Organizer profile created successfully');

      console.log('[ORGANIZER SIGNUP] Signing out user...');
      await auth.signOut();

      console.log('[ORGANIZER SIGNUP] Signup complete! Showing success message...');
      alert('✅ Demande envoyée avec succès!\n\n' +
        'Votre compte organisateur est en attente de validation par notre équipe.\n\n' +
        'Vous recevrez un email de confirmation une fois votre compte approuvé (sous 24h).\n\n' +
        '📞 Contact : 77 139 29 26\n' +
        '📧 Email : contact@evenpass.sn');

      navigate('/organizer/login');
    } catch (err: any) {
      console.error('[FIREBASE] Error creating organizer:', err);

      // Message d'erreur plus clair pour l'email déjà utilisé
      if (err.code === 'auth/email-already-in-use') {
        setError('Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email.');
      } else {
        setError(err.message || 'Erreur lors de la création du compte');
      }

      setLoading(false);
    }
  };

  const organizationTypes = [
    { value: 'individual', label: 'Individuel', description: 'Artiste solo, freelance' },
    { value: 'company', label: 'Entreprise', description: 'Société commerciale' },
  ];

  const merchantProviders = [
    { value: 'wave', label: 'Wave', logo: '/wave-logo.svg' },
    { value: 'orange_money', label: 'Orange Money', logo: '/orange-money-logo.svg' },
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
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                      step >= s ? 'bg-[#FF5F05] text-white' : 'bg-[#2A2A2A] text-[#B5B5B5]'
                    }`}
                  >
                    {s}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className={`font-bold text-sm ${step >= s ? 'text-white' : 'text-[#B5B5B5]'}`}>
                      {s === 1 ? 'Compte' : s === 2 ? 'Organisation' : 'Vérification'}
                    </p>
                  </div>
                  {s < 3 && (
                    <div className={`h-1 flex-1 mx-4 rounded ${step > s ? 'bg-[#FF5F05]' : 'bg-[#2A2A2A]'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Créer votre compte</h2>

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

                <div>
                  <label className="block text-sm font-medium text-[#B5B5B5] mb-2">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Mot de passe *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-white placeholder-[#B5B5B5] focus:outline-none focus:border-[#FF5F05]"
                    placeholder="Minimum 6 caractères"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={nextStep}
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
                    Nom de structure *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.organization_name}
                    onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-white placeholder-[#B5B5B5] focus:outline-none focus:border-[#FF5F05]"
                    placeholder="Nom de votre structure"
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
                    Description (Facultatif)
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
                      Site web (Facultatif)
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

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-8 py-3 bg-[#2A2A2A] hover:bg-[#404040] text-white rounded-lg font-bold transition-all"
                  >
                    Précédent
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 px-8 py-3 bg-gradient-to-r from-[#FF5F05] to-[#FF8C42] hover:from-[#FF7A00] hover:to-[#FFA05D] text-white rounded-lg font-bold transition-all"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Vérification & Paiement</h2>

                <div className="bg-[#FF5F05]/10 border border-[#FF5F05]/20 rounded-lg p-4 mb-6">
                  <p className="text-sm text-[#FF8C42] font-medium">
                    <Wallet className="w-4 h-4 inline mr-2" />
                    Les reversements se feront uniquement sur le numéro renseigné ci-dessous
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#B5B5B5] mb-3">
                    <Wallet className="w-4 h-4 inline mr-2" />
                    Opérateur Mobile Money *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {merchantProviders.map((provider) => (
                      <button
                        key={provider.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, merchant_provider: provider.value as any })}
                        className={`p-6 rounded-lg border-2 text-center transition-all ${
                          formData.merchant_provider === provider.value
                            ? 'border-[#FF5F05] bg-[#FF5F05]/10'
                            : 'border-[#2A2A2A] hover:border-[#B5B5B5]'
                        }`}
                      >
                        <div className="flex items-center justify-center mb-3">
                          <img
                            src={provider.logo}
                            alt={provider.label}
                            className="h-12 w-auto object-contain"
                          />
                        </div>
                        <p className="text-sm font-bold text-white">{provider.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#B5B5B5] mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Numéro Marchand *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.merchant_number}
                    onChange={(e) => setFormData({ ...formData, merchant_number: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-white placeholder-[#B5B5B5] focus:outline-none focus:border-[#FF5F05]"
                    placeholder="77 123 45 67"
                  />
                  <p className="text-xs text-[#B5B5B5] mt-2">
                    Ce numéro sera utilisé pour tous vos reversements de fonds
                  </p>
                </div>

                <div className="border-t border-[#2A2A2A] pt-6">
                  <h3 className="text-lg font-bold text-white mb-4">
                    <Upload className="w-5 h-5 inline mr-2" />
                    Documents de vérification
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#B5B5B5] mb-2">
                        Carte d'identité nationale (CNI) {formData.organization_type === 'company' ? '*' : '(Facultatif)'}
                      </label>
                      <input
                        type="file"
                        required={formData.organization_type === 'company'}
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange('cni', e.target.files?.[0] || null)}
                        className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#FF5F05] file:text-white file:cursor-pointer hover:file:bg-[#FF7A00]"
                      />
                      {formData.organization_type === 'individual' && (
                        <p className="text-xs text-[#B5B5B5] mt-2">
                          Le téléchargement de la CNI est facultatif pour les individuels
                        </p>
                      )}
                    </div>

                    {formData.organization_type === 'company' && (
                      <div>
                        <label className="block text-sm font-medium text-[#B5B5B5] mb-2">
                          Registre de commerce / NINEA *
                        </label>
                        <input
                          type="file"
                          required
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileChange('registre', e.target.files?.[0] || null)}
                          className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#FF5F05] file:text-white file:cursor-pointer hover:file:bg-[#FF7A00]"
                        />
                        <p className="text-xs text-[#B5B5B5] mt-2">
                          Obligatoire pour les entreprises
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[#0F0F0F] rounded-lg p-4 border border-[#2A2A2A]">
                  <p className="text-sm text-[#B5B5B5]">
                    En soumettant ce formulaire, vous acceptez que votre demande soit examinée par notre équipe.
                    Vous serez notifié par email une fois votre compte approuvé (sous 24h).
                  </p>
                  <div className="mt-3 text-sm text-[#FF8C42]">
                    📞 Contact : 77 139 29 26 | 📧 contact@evenpass.sn
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
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
