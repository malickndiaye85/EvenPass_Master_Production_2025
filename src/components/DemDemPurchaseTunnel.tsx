import React, { useState, useRef } from 'react';
import { X, User, Phone, Camera, Upload } from 'lucide-react';
import { BusRouteDisplay } from '../lib/transportLinesService';

interface PurchaseTunnelProps {
  route: BusRouteDisplay;
  tier: 'eco' | 'prestige';
  duration: 'weekly' | 'monthly' | 'quarterly';
  onClose: () => void;
  onConfirm: (userData: UserIdentity) => void;
}

export interface UserIdentity {
  firstName: string;
  lastName: string;
  phone: string;
  photoUrl: string;
}

export default function DemDemPurchaseTunnel({ route, tier, duration, onClose, onConfirm }: PurchaseTunnelProps) {
  const [step, setStep] = useState<'identity' | 'recap'>('identity');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+221 ');
  const [photoUrl, setPhotoUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const durationLabels = {
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
    quarterly: 'Trimestriel'
  };

  const price = route.pricing[tier][duration];

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\s/g, '');
    const senegalPattern = /^\+221[0-9]{9}$/;
    return senegalPattern.test(cleaned);
  };

  const handlePhoneChange = (value: string) => {
    if (!value.startsWith('+221 ')) {
      value = '+221 ' + value.replace('+221', '').trim();
    }

    const digits = value.replace(/\D/g, '').substring(3);
    if (digits.length <= 9) {
      setPhone('+221 ' + digits);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'Le prénom est obligatoire';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Le nom est obligatoire';
    }
    if (!validatePhone(phone)) {
      newErrors.phone = 'Numéro invalide (format: +221 XX XXX XX XX)';
    }
    if (!photoUrl) {
      newErrors.photo = 'La photo de profil est obligatoire';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      setStep('recap');
    }
  };

  const handleConfirm = () => {
    onConfirm({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.replace(/\s/g, ''),
      photoUrl
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
        setErrors(prev => ({ ...prev, photo: '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Erreur caméra:', err);
      alert('Impossible d\'accéder à la caméra');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPhotoUrl(dataUrl);
        setErrors(prev => ({ ...prev, photo: '' }));

        const stream = videoRef.current.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
        setCameraActive(false);
      }
    }
  };

  if (step === 'recap') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 rounded-3xl max-w-lg w-full border-2 border-white/10 shadow-2xl">
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white">Confirmation</h2>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-blue-900/30 rounded-2xl p-4 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-3">Votre abonnement</h3>
              <div className="space-y-2 text-white/80">
                <p><span className="font-semibold text-white">Ligne:</span> {route.origin} ⇄ {route.destination}</p>
                <p><span className="font-semibold text-white">Formule:</span> {tier === 'eco' ? 'ECO' : 'PRESTIGE ★'}</p>
                <p><span className="font-semibold text-white">Durée:</span> {durationLabels[duration]}</p>
                <p className="text-2xl font-black text-amber-400 mt-3">{price.toLocaleString()} FCFA</p>
              </div>
            </div>

            <div className="bg-blue-900/30 rounded-2xl p-4 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-3">Vos informations</h3>
              <div className="flex items-center space-x-4">
                <img
                  src={photoUrl}
                  alt="Photo de profil"
                  className="w-16 h-16 rounded-full object-cover border-2 border-amber-400"
                />
                <div className="text-white/80">
                  <p className="font-semibold text-white text-lg">{firstName} {lastName}</p>
                  <p>{phone}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleConfirm}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-400/50"
            >
              🧪 MODE TEST - Générer le Pass
            </button>
            <p className="text-center text-amber-400 text-sm font-medium">
              ⚡ Paiement temporairement désactivé pour les tests
            </p>

            <button
              onClick={() => setStep('identity')}
              className="w-full bg-white/10 text-white py-3 rounded-2xl font-semibold hover:bg-white/20 transition-all border border-white/20"
            >
              Modifier mes informations
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 rounded-3xl max-w-lg w-full border-2 border-white/10 shadow-2xl my-8">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Vos informations</h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-900/30 rounded-2xl p-4 border border-white/10 mb-6">
            <div className="text-center">
              <p className="text-white/70 text-sm mb-1">{route.origin} ⇄ {route.destination}</p>
              <p className="text-white font-semibold">{tier === 'eco' ? 'ECO' : 'PRESTIGE ★'} • {durationLabels[duration]}</p>
              <p className="text-2xl font-black text-amber-400 mt-2">{price.toLocaleString()} FCFA</p>
            </div>
          </div>

          <div>
            <label className="text-white font-semibold mb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-amber-400" />
              Prénom
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                setErrors(prev => ({ ...prev, firstName: '' }));
              }}
              placeholder="Votre prénom"
              className="w-full bg-blue-900/30 text-white px-4 py-4 rounded-xl border-2 border-white/10 focus:border-amber-400 outline-none text-lg"
            />
            {errors.firstName && <p className="text-red-400 text-sm mt-1">{errors.firstName}</p>}
          </div>

          <div>
            <label className="text-white font-semibold mb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-amber-400" />
              Nom
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                setErrors(prev => ({ ...prev, lastName: '' }));
              }}
              placeholder="Votre nom"
              className="w-full bg-blue-900/30 text-white px-4 py-4 rounded-xl border-2 border-white/10 focus:border-amber-400 outline-none text-lg"
            />
            {errors.lastName && <p className="text-red-400 text-sm mt-1">{errors.lastName}</p>}
          </div>

          <div>
            <label className="text-white font-semibold mb-2 flex items-center gap-2">
              <Phone className="w-5 h-5 text-amber-400" />
              Numéro Mobile
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                handlePhoneChange(e.target.value);
                setErrors(prev => ({ ...prev, phone: '' }));
              }}
              placeholder="+221 77 123 45 67"
              className="w-full bg-blue-900/30 text-white px-4 py-4 rounded-xl border-2 border-white/10 focus:border-amber-400 outline-none text-lg"
            />
            {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="text-white font-semibold mb-2 flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-400" />
              Photo de profil
            </label>

            {photoUrl ? (
              <div className="relative">
                <img
                  src={photoUrl}
                  alt="Photo de profil"
                  className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-amber-400 shadow-lg"
                />
                <button
                  onClick={() => setPhotoUrl('')}
                  className="absolute top-0 right-1/2 translate-x-16 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {cameraActive ? (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full rounded-xl"
                    />
                    <div className="flex gap-3 mt-3">
                      <button
                        onClick={capturePhoto}
                        className="flex-1 bg-amber-400 text-blue-950 py-3 rounded-xl font-bold hover:bg-amber-500 transition-all"
                      >
                        Capturer
                      </button>
                      <button
                        onClick={() => {
                          const stream = videoRef.current?.srcObject as MediaStream;
                          stream?.getTracks().forEach(track => track.stop());
                          setCameraActive(false);
                        }}
                        className="flex-1 bg-white/10 text-white py-3 rounded-xl font-semibold hover:bg-white/20 transition-all"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={startCamera}
                      className="bg-blue-900/30 border-2 border-white/20 hover:border-amber-400 text-white py-4 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                      <Camera className="w-5 h-5" />
                      Selfie
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-900/30 border-2 border-white/20 hover:border-amber-400 text-white py-4 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                      <Upload className="w-5 h-5" />
                      Galerie
                    </button>
                  </div>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            {errors.photo && <p className="text-red-400 text-sm mt-1">{errors.photo}</p>}
          </div>

          <button
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-blue-950 py-4 rounded-2xl font-bold text-lg hover:from-amber-500 hover:to-amber-600 transition-all shadow-lg shadow-amber-400/50 mt-6"
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}
