import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Camera, CheckCircle, AlertCircle, User, Phone, FileText, Shield, CreditCard, Lock, Car, Calendar, Hash } from 'lucide-react';
import { useAuth } from '../../context/FirebaseAuthContext';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { firestore, auth } from '../../firebase';
import DynamicLogo from '../../components/DynamicLogo';
import { CustomModal } from '../../components/CustomModal';
import { uploadToCloudinary } from '../../lib/cloudinary';

interface DriverFormData {
  firstName: string;
  lastName: string;
  phone: string;
  pin: string;
  licenseNumber: string;
  licenseUrl: string;
  insuranceUrl: string;
  carteGriseUrl: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: string;
  vehiclePlateNumber: string;
  vehicleSeats: string;
  vehiclePhotoUrl: string;
  acceptedCGU: boolean;
}

export default function DriverSignupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [uploadingInsurance, setUploadingInsurance] = useState(false);
  const [uploadingCarteGrise, setUploadingCarteGrise] = useState(false);
  const [uploadingVehiclePhoto, setUploadingVehiclePhoto] = useState(false);

  const [modal, setModal] = useState({
    isOpen: false,
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: ''
  });

  const [formData, setFormData] = useState<DriverFormData>({
    firstName: '',
    lastName: '',
    phone: '',
    pin: '',
    licenseNumber: '',
    licenseUrl: '',
    insuranceUrl: '',
    carteGriseUrl: '',
    vehicleBrand: 'Toyota',
    vehicleModel: '',
    vehicleYear: '',
    vehiclePlateNumber: '',
    vehicleSeats: '4',
    vehiclePhotoUrl: '',
    acceptedCGU: false
  });

  const licenseInputRef = useRef<HTMLInputElement>(null);
  const insuranceInputRef = useRef<HTMLInputElement>(null);
  const carteGriseInputRef = useRef<HTMLInputElement>(null);
  const vehiclePhotoInputRef = useRef<HTMLInputElement>(null);

  const formatPhoneNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '');

    if (digits.length === 0) return '';
    if (digits.length <= 2) return digits;
    if (digits.length <= 9) {
      return `${digits.slice(0, 2)} ${digits.slice(2)}`;
    }

    return `${digits.slice(0, 2)} ${digits.slice(2, 9)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Fichier trop volumineux',
        message: 'La photo ne doit pas dépasser 5 MB'
      });
      return;
    }

    setUploadingLicense(true);
    try {
      const url = await uploadToCloudinary(file, 'drivers/licenses', user?.uid);
      setFormData({ ...formData, licenseUrl: url });
      setModal({
        isOpen: true,
        type: 'success',
        title: 'Upload réussi',
        message: 'Votre permis a été uploadé avec succès'
      });
    } catch (error) {
      console.error('Upload error:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Erreur d\'upload',
        message: 'Erreur lors de l\'upload du permis. Veuillez réessayer.'
      });
    } finally {
      setUploadingLicense(false);
    }
  };

  const handleInsuranceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Fichier trop volumineux',
        message: 'La photo ne doit pas dépasser 5 MB'
      });
      return;
    }

    setUploadingInsurance(true);
    try {
      const url = await uploadToCloudinary(file, 'drivers/insurance', user?.uid);
      setFormData({ ...formData, insuranceUrl: url });
      setModal({
        isOpen: true,
        type: 'success',
        title: 'Upload réussi',
        message: 'Votre assurance a été uploadée avec succès'
      });
    } catch (error) {
      console.error('Upload error:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Erreur d\'upload',
        message: 'Erreur lors de l\'upload de l\'assurance. Veuillez réessayer.'
      });
    } finally {
      setUploadingInsurance(false);
    }
  };

  const handleCarteGriseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Fichier trop volumineux',
        message: 'La photo ne doit pas dépasser 5 MB'
      });
      return;
    }

    setUploadingCarteGrise(true);
    try {
      const url = await uploadToCloudinary(file, 'drivers/carte-grise', user?.uid);
      setFormData({ ...formData, carteGriseUrl: url });
      setModal({
        isOpen: true,
        type: 'success',
        title: 'Upload réussi',
        message: 'Votre carte grise a été uploadée avec succès'
      });
    } catch (error) {
      console.error('Upload error:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Erreur d\'upload',
        message: 'Erreur lors de l\'upload de la carte grise. Veuillez réessayer.'
      });
    } finally {
      setUploadingCarteGrise(false);
    }
  };

  const handleVehiclePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Fichier trop volumineux',
        message: 'La photo ne doit pas dépasser 5 MB'
      });
      return;
    }

    setUploadingVehiclePhoto(true);
    try {
      const url = await uploadToCloudinary(file, 'drivers/vehicles', user?.uid);
      setFormData({ ...formData, vehiclePhotoUrl: url });
      setModal({
        isOpen: true,
        type: 'success',
        title: 'Upload réussi',
        message: 'La photo de votre véhicule a été uploadée avec succès'
      });
    } catch (error) {
      console.error('Upload error:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Erreur d\'upload',
        message: 'Erreur lors de l\'upload de la photo. Veuillez réessayer.'
      });
    } finally {
      setUploadingVehiclePhoto(false);
    }
  };

  const canProceedStep1 = () => {
    const phoneDigits = formData.phone.replace(/\D/g, '');
    const validPrefixes = ['77', '78', '76', '70', '75'];
    const hasValidPrefix = validPrefixes.some(prefix => phoneDigits.startsWith(prefix));
    const pinDigits = formData.pin.replace(/\D/g, '');

    return formData.firstName.trim() !== '' &&
           formData.lastName.trim() !== '' &&
           phoneDigits.length === 9 &&
           hasValidPrefix &&
           pinDigits.length === 4;
  };

  const canProceedStep2 = () => {
    return formData.licenseUrl !== '' &&
           formData.insuranceUrl !== '' &&
           formData.carteGriseUrl !== '';
  };

  const canProceedStep3 = () => {
    return formData.vehicleBrand !== '' &&
           formData.vehicleModel.trim() !== '' &&
           formData.vehicleYear !== '' &&
           formData.vehiclePlateNumber.trim() !== '' &&
           formData.vehicleSeats !== '' &&
           formData.vehiclePhotoUrl !== '' &&
           formData.acceptedCGU;
  };

  const hashPIN = async (pin: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const pinHash = await hashPIN(formData.pin);
      const cleanPhone = formData.phone.replace(/\s+/g, '');

      // CRÉER UN COMPTE FIREBASE AUTH
      // Email généré : +221{phone}@driver.demdem.sn
      // Password : PIN (minimum 6 caractères requis par Firebase)
      const generatedEmail = `+221${cleanPhone}@driver.demdem.sn`;
      const password = formData.pin.padEnd(6, '0'); // Assurer minimum 6 caractères

      console.log('[DRIVER SIGNUP] 🔐 Creating Firebase Auth account:', generatedEmail);

      let firebaseUID = '';
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, generatedEmail, password);
        firebaseUID = userCredential.user.uid;
        console.log('[DRIVER SIGNUP] ✅ Firebase Auth account created with UID:', firebaseUID);
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          console.error('[DRIVER SIGNUP] ❌ Un compte existe déjà avec ce numéro');
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Compte existant',
            message: 'Un compte chauffeur existe déjà avec ce numéro de téléphone.'
          });
          setLoading(false);
          return;
        }
        throw authError;
      }

      // Utiliser l'UID Firebase Auth au lieu d'un custom UID
      const driverData = {
        uid: firebaseUID,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        pinHash: pinHash,
        email: generatedEmail,
        licenseNumber: formData.licenseNumber || null,
        licenseUrl: formData.licenseUrl,
        insuranceUrl: formData.insuranceUrl,
        carteGriseUrl: formData.carteGriseUrl,
        vehicleBrand: formData.vehicleBrand,
        vehicleModel: formData.vehicleModel,
        vehicleYear: formData.vehicleYear,
        vehiclePlateNumber: formData.vehiclePlateNumber,
        vehicleSeats: parseInt(formData.vehicleSeats),
        vehiclePhotoUrl: formData.vehiclePhotoUrl,
        acceptedCGU: formData.acceptedCGU,
        status: 'pending_verification',
        role: 'driver_pending',
        silo: 'voyage',
        silo_id: 'voyage',
        isOnline: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await setDoc(doc(firestore, 'drivers', firebaseUID), {
        ...driverData,
        verified: false,
        status: 'pending_verification',
        full_name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        driver_license: formData.licenseUrl,
        vehicle_insurance: formData.insuranceUrl,
        national_id: formData.carteGriseUrl,
        vehicle_type: formData.vehicleBrand,
        vehicle_model: formData.vehicleModel,
        plate_number: formData.vehiclePlateNumber,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });

      await setDoc(doc(firestore, 'users', firebaseUID), {
        phone: formData.phone,
        full_name: `${formData.firstName} ${formData.lastName}`,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: 'driver_pending',
        silo: 'voyage',
        silo_id: 'voyage',
        status: 'pending_verification',
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });

      setModal({
        isOpen: true,
        type: 'success',
        title: 'Dossier reçu !',
        message: 'Connectez-vous avec votre Numéro + PIN pour suivre l\'avancée.'
      });

      setTimeout(() => {
        navigate('/voyage/chauffeur/pending-approval');
      }, 3000);
    } catch (error) {
      console.error('Error creating driver profile:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la création du profil. Veuillez réessayer.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="bg-[#0A1628] shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <DynamicLogo size="md" mode="transport" />
            <button
              onClick={() => navigate('/voyage')}
              className="flex items-center gap-2 text-white hover:text-[#10B981] transition group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:translate-x-[-4px] transition-transform" />
              <span className="font-medium">Retour</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-[#0A1628] mb-2">
            Devenir Chauffeur BII
          </h1>
          <p className="text-gray-600">
            Rejoignez la communauté DEM⇄DEM
          </p>
        </div>

        <div className="flex items-center justify-center mb-8 overflow-x-auto">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step >= 1 ? 'bg-[#10B981] text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              1
            </div>
            <div className={`w-8 h-1 ${step >= 2 ? 'bg-[#10B981]' : 'bg-gray-200'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step >= 2 ? 'bg-[#10B981] text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              2
            </div>
            <div className={`w-8 h-1 ${step >= 3 ? 'bg-[#10B981]' : 'bg-gray-200'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step >= 3 ? 'bg-[#10B981] text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              3
            </div>
            <div className={`w-8 h-1 ${step >= 4 ? 'bg-[#10B981]' : 'bg-gray-200'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step >= 4 ? 'bg-[#10B981] text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              4
            </div>
          </div>
        </div>

        {step === 1 && (
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-[#0A1628] mb-6">Informations personnelles</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10B981] focus:border-transparent text-[#1A1A1A]"
                    placeholder="Votre prénom"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10B981] focus:border-transparent text-[#1A1A1A]"
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10B981] focus:border-transparent text-[#1A1A1A]"
                    placeholder=""
                    maxLength={11}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code PIN <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    inputMode="numeric"
                    value={formData.pin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 4) {
                        setFormData({ ...formData, pin: value });
                      }
                    }}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10B981] focus:border-transparent text-[#1A1A1A]"
                    placeholder="4 chiffres"
                    maxLength={4}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Ce code sera utilisé pour vous connecter</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  N° Licence Transport <span className="text-gray-400 text-xs">(facultatif)</span>
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10B981] focus:border-transparent text-[#1A1A1A]"
                    placeholder="Votre numéro de licence"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1()}
              className={`w-full mt-6 py-3 rounded-lg font-semibold transition-all ${
                canProceedStep1()
                  ? 'bg-[#10B981] text-white hover:bg-[#0D9668]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Continuer
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-[#0A1628] mb-6">Vos Documents</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Photo du Permis de Conduire
                </label>
                <input
                  ref={licenseInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLicenseUpload}
                  className="hidden"
                />
                {formData.licenseUrl ? (
                  <div className="relative">
                    <img
                      src={formData.licenseUrl}
                      alt="Permis"
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => setFormData({ ...formData, licenseUrl: '' })}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <AlertCircle className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Uploadé
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => licenseInputRef.current?.click()}
                    disabled={uploadingLicense}
                    className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-3 hover:border-[#10B981] hover:bg-gray-50 transition-all"
                  >
                    {uploadingLicense ? (
                      <>
                        <div className="w-8 h-8 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-600">Upload en cours...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-gray-400" />
                        <span className="text-gray-600 font-medium">Cliquez pour uploader</span>
                        <span className="text-sm text-gray-400">Max 5 MB</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Photo de l'Assurance
                </label>
                <input
                  ref={insuranceInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleInsuranceUpload}
                  className="hidden"
                />
                {formData.insuranceUrl ? (
                  <div className="relative">
                    <img
                      src={formData.insuranceUrl}
                      alt="Assurance"
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => setFormData({ ...formData, insuranceUrl: '' })}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <AlertCircle className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Uploadé
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => insuranceInputRef.current?.click()}
                    disabled={uploadingInsurance}
                    className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-3 hover:border-[#10B981] hover:bg-gray-50 transition-all"
                  >
                    {uploadingInsurance ? (
                      <>
                        <div className="w-8 h-8 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-600">Upload en cours...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-gray-400" />
                        <span className="text-gray-600 font-medium">Cliquez pour uploader</span>
                        <span className="text-sm text-gray-400">Max 5 MB</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Photo de la Carte Grise
                </label>
                <input
                  ref={carteGriseInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCarteGriseUpload}
                  className="hidden"
                />
                {formData.carteGriseUrl ? (
                  <div className="relative">
                    <img
                      src={formData.carteGriseUrl}
                      alt="Carte Grise"
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => setFormData({ ...formData, carteGriseUrl: '' })}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <AlertCircle className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Uploadé
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => carteGriseInputRef.current?.click()}
                    disabled={uploadingCarteGrise}
                    className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-3 hover:border-[#10B981] hover:bg-gray-50 transition-all"
                  >
                    {uploadingCarteGrise ? (
                      <>
                        <div className="w-8 h-8 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-600">Upload en cours...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-gray-400" />
                        <span className="text-gray-600 font-medium">Cliquez pour uploader</span>
                        <span className="text-sm text-gray-400">Max 5 MB</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Retour
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2()}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  canProceedStep2()
                    ? 'bg-[#10B981] text-white hover:bg-[#0D9668]'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-[#0A1628] mb-6">Informations du Véhicule</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marque <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={formData.vehicleBrand}
                    onChange={(e) => setFormData({ ...formData, vehicleBrand: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10B981] focus:border-transparent text-[#1A1A1A]"
                  >
                    <option value="Toyota">Toyota</option>
                    <option value="Renault">Renault</option>
                    <option value="Peugeot">Peugeot</option>
                    <option value="Ford">Ford</option>
                    <option value="Nissan">Nissan</option>
                    <option value="Hyundai">Hyundai</option>
                    <option value="Mercedes">Mercedes</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modèle <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10B981] focus:border-transparent text-[#1A1A1A]"
                    placeholder="Ex: Corolla, Clio, 208"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Année <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={formData.vehicleYear}
                    onChange={(e) => setFormData({ ...formData, vehicleYear: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10B981] focus:border-transparent text-[#1A1A1A]"
                    placeholder="2020"
                    min="1990"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Immatriculation <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.vehiclePlateNumber}
                    onChange={(e) => setFormData({ ...formData, vehiclePlateNumber: e.target.value.toUpperCase() })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10B981] focus:border-transparent text-[#1A1A1A] uppercase"
                    placeholder="DK-1234-A"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de places <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={formData.vehicleSeats}
                    onChange={(e) => setFormData({ ...formData, vehicleSeats: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10B981] focus:border-transparent text-[#1A1A1A]"
                  >
                    <option value="4">4 places</option>
                    <option value="5">5 places</option>
                    <option value="6">6 places</option>
                    <option value="7">7 places</option>
                    <option value="8">8 places</option>
                    <option value="9">9 places</option>
                    <option value="10">10 places</option>
                    <option value="11">11 places</option>
                    <option value="12">12 places</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Photo du Véhicule <span className="text-red-500">*</span>
                </label>
                <input
                  ref={vehiclePhotoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleVehiclePhotoUpload}
                  className="hidden"
                />
                {formData.vehiclePhotoUrl ? (
                  <div className="relative">
                    <img
                      src={formData.vehiclePhotoUrl}
                      alt="Véhicule"
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => setFormData({ ...formData, vehiclePhotoUrl: '' })}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <AlertCircle className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Uploadé
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => vehiclePhotoInputRef.current?.click()}
                    disabled={uploadingVehiclePhoto}
                    className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-3 hover:border-[#10B981] hover:bg-gray-50 transition-all"
                  >
                    {uploadingVehiclePhoto ? (
                      <>
                        <div className="w-8 h-8 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-600">Upload en cours...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-gray-400" />
                        <span className="text-gray-600 font-medium">Cliquez pour uploader</span>
                        <span className="text-sm text-gray-400">Max 5 MB</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.acceptedCGU}
                    onChange={(e) => setFormData({ ...formData, acceptedCGU: e.target.checked })}
                    className="mt-1 w-5 h-5 text-[#10B981] border-gray-300 rounded focus:ring-[#10B981]"
                  />
                  <span className="text-sm text-gray-700">
                    J'accepte les <a href="/terms" target="_blank" className="text-[#10B981] underline">Conditions Générales d'Utilisation</a> et je certifie que toutes les informations fournies sont exactes.
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Retour
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!canProceedStep3()}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  canProceedStep3()
                    ? 'bg-[#10B981] text-white hover:bg-[#0D9668]'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#10B981] rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-[#0A1628] mb-2">Vérification finale</h2>
              <p className="text-gray-600">Vérifiez vos informations avant de soumettre</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Nom complet</p>
                  <p className="font-semibold text-gray-900">{formData.firstName} {formData.lastName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Téléphone</p>
                  <p className="font-semibold text-gray-900">{formData.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Lock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Code PIN</p>
                  <p className="font-semibold text-gray-900">{'•'.repeat(formData.pin.length)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Car className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Véhicule</p>
                  <p className="font-semibold text-gray-900">{formData.vehicleBrand} {formData.vehicleModel} ({formData.vehicleYear})</p>
                  <p className="text-sm text-gray-600">{formData.vehiclePlateNumber} - {formData.vehicleSeats} places</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Documents</p>
                  <p className="font-semibold text-gray-900">Permis, Assurance, Carte Grise & Photo Véhicule</p>
                </div>
              </div>

              {formData.licenseNumber && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">N° Licence Transport</p>
                    <p className="font-semibold text-gray-900">{formData.licenseNumber}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Validation KYC</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Votre profil sera vérifié sous 24-48h. Vous recevrez une notification WhatsApp.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Retour
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 bg-[#10B981] text-white rounded-lg font-semibold hover:bg-[#0D9668] transition disabled:opacity-50"
              >
                {loading ? 'Envoi...' : 'Soumettre'}
              </button>
            </div>
          </div>
        )}
      </div>

      <CustomModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        type={modal.type}
        title={modal.title}
        message={modal.message}
      />
    </div>
  );
}
