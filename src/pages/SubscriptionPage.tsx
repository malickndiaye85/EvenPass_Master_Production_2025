import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Camera, Upload, User, CreditCard, Phone, Check, Calendar, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import DynamicLogo from '../components/DynamicLogo';
import {
  uploadSubscriptionPhoto,
  createSubscription,
  generateSubscriptionNumber,
  calculateEndDate,
  saveSubscriptionToLocalStorage
} from '../lib/subscriptionFirebase';

const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [subscriptionType, setSubscriptionType] = useState<'monthly' | 'annual'>('monthly');
  const [route, setRoute] = useState('dakar_thies');
  const [holderName, setHolderName] = useState('');
  const [holderCNI, setHolderCNI] = useState('');
  const [holderPhone, setHolderPhone] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const routes = {
    dakar_thies: 'Dakar - Thiès',
    dakar_mbour: 'Dakar - Mbour',
    dakar_kaolack: 'Dakar - Kaolack',
    dakar_saint_louis: 'Dakar - Saint-Louis'
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La photo ne doit pas dépasser 5 MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image');
        return;
      }

      setPhotoFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getPrice = (): number => {
    return subscriptionType === 'monthly' ? 25000 : 250000;
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return !!subscriptionType;
      case 2: return !!route;
      case 3: return !!holderName && holderCNI.length === 13 && holderPhone.length >= 9;
      case 4: return !!photoFile;
      default: return false;
    }
  };

  const handleSubscribe = async () => {
    if (!photoFile) {
      alert('Veuillez uploader une photo d\'identité');
      return;
    }

    setLoading(true);

    try {
      const subscriptionNumber = generateSubscriptionNumber();
      const photoUrl = await uploadSubscriptionPhoto(photoFile, subscriptionNumber);

      const startDate = new Date().toISOString().split('T')[0];
      const endDate = calculateEndDate(startDate, subscriptionType);

      const qrCode = `GENAA_GAAW_${subscriptionNumber}`;

      const subscriptionData = {
        subscription_number: subscriptionNumber,
        holder_name: holderName,
        holder_cni: holderCNI,
        holder_phone: holderPhone,
        photo_url: photoUrl,
        subscription_type: subscriptionType,
        route: route,
        start_date: startDate,
        end_date: endDate,
        amount_paid: getPrice(),
        payment_status: 'pending' as const,
        qr_code: qrCode
      };

      const subscriptionId = await createSubscription(subscriptionData);

      setLoading(false);

      navigate('/subscription/payment', {
        state: {
          subscriptionId,
          subscriptionNumber,
          amount: getPrice(),
          subscriptionData: { ...subscriptionData, id: subscriptionId, created_at: Date.now() }
        }
      });
    } catch (error) {
      setLoading(false);
      alert('Erreur lors de la création de l\'abonnement');
    }
  };

  const steps = [
    { number: 1, label: 'Type' },
    { number: 2, label: 'Trajet' },
    { number: 3, label: 'Identité' },
    { number: 4, label: 'Photo' },
    { number: 5, label: 'Paiement' }
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[#F8FAFC]'}`}>
      <nav className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-xl border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => step === 1 ? navigate('/') : setStep(step - 1)} className="flex items-center gap-2 group">
              <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'} group-hover:translate-x-[-4px] transition-transform`} />
              <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {step === 1 ? 'Accueil' : 'Retour'}
              </span>
            </button>

            <div className="flex items-center gap-3">
              <DynamicLogo size="sm" mode="transport" />
              <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Gënaa Gaaw</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center">
                <div className={`flex flex-col items-center ${index < steps.length - 1 ? 'mr-2' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step >= s.number
                      ? isDark ? 'bg-cyan-500 text-white' : 'bg-[#0A7EA3] text-white'
                      : isDark ? 'bg-gray-800 text-gray-600' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {step > s.number ? <Check className="w-5 h-5" /> : s.number}
                  </div>
                  <span className={`text-xs mt-1 hidden md:block ${
                    step >= s.number
                      ? isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'
                      : isDark ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-8 md:w-12 ${
                    step > s.number
                      ? isDark ? 'bg-cyan-500' : 'bg-[#0A7EA3]'
                      : isDark ? 'bg-gray-800' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <div className={`rounded-3xl p-8 md:p-12 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
            {step === 1 && (
              <div>
                <div className="text-center mb-8">
                  <Calendar className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                  <h2 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Type d'abonnement
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Choisissez votre formule
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <button
                    onClick={() => setSubscriptionType('monthly')}
                    className={`p-8 rounded-2xl border-2 transition-all ${
                      subscriptionType === 'monthly'
                        ? isDark ? 'border-cyan-500 bg-cyan-500/10' : 'border-[#0A7EA3] bg-[#E6F1F5]'
                        : isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Mensuel
                    </div>
                    <div className={`text-4xl font-black mb-3 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                      25 000 FCFA
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Valable 30 jours
                    </div>
                  </button>

                  <button
                    onClick={() => setSubscriptionType('annual')}
                    className={`p-8 rounded-2xl border-2 transition-all relative ${
                      subscriptionType === 'annual'
                        ? isDark ? 'border-cyan-500 bg-cyan-500/10' : 'border-[#0A7EA3] bg-[#E6F1F5]'
                        : isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="absolute -top-3 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Économisez 17%
                    </div>
                    <div className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Annuel
                    </div>
                    <div className={`text-4xl font-black mb-3 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                      250 000 FCFA
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Valable 365 jours
                    </div>
                  </button>
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!canProceed()}
                  className={`w-full mt-6 py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                    canProceed()
                      ? isDark ? 'bg-gradient-to-r from-cyan-500 to-[#0A7EA3] hover:from-cyan-600 hover:to-[#006B8C]'
                        : 'bg-gradient-to-r from-[#0A7EA3] to-[#005975] hover:from-[#006B8C] hover:to-[#00475E]'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  Continuer
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="text-center mb-8">
                  <User className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                  <h2 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Trajet
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Sélectionnez votre ligne
                  </p>
                </div>

                <div className="space-y-3">
                  {Object.entries(routes).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setRoute(key)}
                      className={`w-full p-6 rounded-2xl border-2 transition-all text-left ${
                        route === key
                          ? isDark ? 'border-cyan-500 bg-cyan-500/10' : 'border-[#0A7EA3] bg-[#E6F1F5]'
                          : isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {label}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep(3)}
                  disabled={!canProceed()}
                  className={`w-full mt-6 py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                    canProceed()
                      ? isDark ? 'bg-gradient-to-r from-cyan-500 to-[#0A7EA3] hover:from-cyan-600 hover:to-[#006B8C]'
                        : 'bg-gradient-to-r from-[#0A7EA3] to-[#005975] hover:from-[#006B8C] hover:to-[#00475E]'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  Continuer
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="text-center mb-8">
                  <CreditCard className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                  <h2 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Informations personnelles
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Identité de l'abonné
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      value={holderName}
                      onChange={(e) => setHolderName(e.target.value)}
                      placeholder="Prénom NOM"
                      className={`w-full p-4 rounded-xl border-2 ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:border-cyan-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Numéro CNI * (13 chiffres)
                    </label>
                    <input
                      type="text"
                      value={holderCNI}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, '');
                        if (cleaned.length <= 13) {
                          setHolderCNI(cleaned);
                        }
                      }}
                      placeholder="1234567890123"
                      maxLength={13}
                      className={`w-full p-4 rounded-xl border-2 font-mono ${
                        holderCNI && holderCNI.length !== 13 ? 'border-red-500' :
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:border-cyan-500`}
                    />
                    {holderCNI && holderCNI.length !== 13 && (
                      <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Le numéro CNI doit contenir exactement 13 chiffres ({holderCNI.length}/13)</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      value={holderPhone}
                      onChange={(e) => setHolderPhone(e.target.value)}
                      placeholder=""
                      className={`w-full p-4 rounded-xl border-2 ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:border-cyan-500`}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setStep(4)}
                  disabled={!canProceed()}
                  className={`w-full mt-6 py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                    canProceed()
                      ? isDark ? 'bg-gradient-to-r from-cyan-500 to-[#0A7EA3] hover:from-cyan-600 hover:to-[#006B8C]'
                        : 'bg-gradient-to-r from-[#0A7EA3] to-[#005975] hover:from-[#006B8C] hover:to-[#00475E]'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  Continuer
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {step === 4 && (
              <div>
                <div className="text-center mb-8">
                  <Camera className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                  <h2 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Photo d'identité
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Obligatoire pour validation
                  </p>
                </div>

                <div className={`mb-6 p-6 rounded-2xl ${isDark ? 'bg-red-900/30 border-2 border-red-700' : 'bg-red-50 border-2 border-red-300'}`}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className={`w-6 h-6 flex-shrink-0 mt-1 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                    <div>
                      <div className={`font-bold text-lg mb-2 ${isDark ? 'text-red-400' : 'text-red-800'}`}>
                        Photo obligatoire
                      </div>
                      <div className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                        Vous devez uploader une photo d'identité pour créer votre abonnement Gënaa Gaaw. Cette photo sera vérifiée par les contrôleurs lors de vos trajets.
                      </div>
                    </div>
                  </div>
                </div>

                {photoPreview ? (
                  <div className="mb-6">
                    <div className={`relative rounded-2xl overflow-hidden border-4 ${isDark ? 'border-cyan-500' : 'border-[#0A7EA3]'}`}>
                      <img src={photoPreview} alt="Photo preview" className="w-full h-96 object-cover" />
                      <button
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview('');
                        }}
                        className="absolute top-4 right-4 bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full p-12 rounded-2xl border-4 border-dashed transition-all ${
                      isDark
                        ? 'border-gray-700 hover:border-cyan-500 bg-gray-700/30'
                        : 'border-gray-300 hover:border-[#0A7EA3] bg-gray-50'
                    }`}
                  >
                    <Upload className={`w-20 h-20 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                    <div className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Cliquez pour uploader
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Format : JPG, PNG (Max 5 MB)
                    </div>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handlePhotoChange}
                  className="hidden"
                />

                <button
                  onClick={() => setStep(5)}
                  disabled={!canProceed()}
                  className={`w-full mt-6 py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                    canProceed()
                      ? isDark ? 'bg-gradient-to-r from-cyan-500 to-[#0A7EA3] hover:from-cyan-600 hover:to-[#006B8C]'
                        : 'bg-gradient-to-r from-[#0A7EA3] to-[#005975] hover:from-[#006B8C] hover:to-[#00475E]'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  Continuer
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {step === 5 && (
              <div>
                <div className="text-center mb-8">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-cyan-500/20' : 'bg-[#E6F1F5]'
                  }`}>
                    <Check className={`w-10 h-10 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                  </div>
                  <h2 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Récapitulatif
                  </h2>
                </div>

                <div className="space-y-4 mb-8">
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Type d'abonnement</div>
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {subscriptionType === 'monthly' ? 'Mensuel (30 jours)' : 'Annuel (365 jours)'}
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Trajet</div>
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {routes[route as keyof typeof routes]}
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Titulaire</div>
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {holderName}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      CNI : {holderCNI}
                    </div>
                  </div>

                  {photoPreview && (
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Photo d'identité</div>
                      <img src={photoPreview} alt="Photo" className="w-32 h-32 object-cover rounded-xl border-2 border-cyan-500" />
                    </div>
                  )}

                  <div className={`p-6 rounded-xl ${
                    isDark ? 'bg-gradient-to-br from-cyan-900/30 to-blue-900/30' : 'bg-gradient-to-br from-[#E6F1F5] to-[#B3D9E6]'
                  }`}>
                    <div className={`text-sm font-semibold mb-2 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>TOTAL À PAYER</div>
                    <div className={`text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {getPrice().toLocaleString()} FCFA
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : isDark
                        ? 'bg-gradient-to-r from-cyan-500 to-[#0A7EA3] hover:from-cyan-600 hover:to-[#006B8C]'
                        : 'bg-gradient-to-r from-[#0A7EA3] to-[#005975] hover:from-[#006B8C] hover:to-[#00475E]'
                  }`}
                >
                  {loading ? 'Traitement...' : 'Procéder au paiement'}
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
