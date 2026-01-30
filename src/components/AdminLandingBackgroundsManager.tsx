import React, { useState, useEffect } from 'react';
import { Image, Upload, Loader, Check, X } from 'lucide-react';
import { updateLandingBackground, useLandingBackgrounds } from '../lib/landingBackgrounds';
import AlertModal from './AlertModal';
import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface AdminLandingBackgroundsManagerProps {
  isDark: boolean;
  userId: string;
}

export default function AdminLandingBackgroundsManager({ isDark, userId }: AdminLandingBackgroundsManagerProps) {
  const { backgrounds, loading } = useLandingBackgrounds();
  const [expressUrl, setExpressUrl] = useState('');
  const [evenementUrl, setEvenementUrl] = useState('');
  const [uploading, setUploading] = useState<'express' | 'evenement' | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({ type: 'success', title: '', message: '' });

  useEffect(() => {
    if (!loading) {
      setExpressUrl(backgrounds.express || '');
      setEvenementUrl(backgrounds.evenement || '');
    }
  }, [backgrounds, loading]);

  const handleFileUpload = async (file: File, section: 'express' | 'evenement') => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setModalConfig({
        type: 'error',
        title: 'Fichier invalide',
        message: 'Veuillez sélectionner un fichier image (JPG, PNG, WEBP, etc.)'
      });
      setShowModal(true);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setModalConfig({
        type: 'error',
        title: 'Fichier trop volumineux',
        message: 'La taille du fichier ne doit pas dépasser 5 MB.'
      });
      setShowModal(true);
      return;
    }

    setUploading(section);
    setUploadProgress(0);

    try {
      const storageRef = ref(storage, `landing-backgrounds/${section}-${Date.now()}.${file.name.split('.').pop()}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          console.error('Upload error:', error);
          setModalConfig({
            type: 'error',
            title: 'Erreur d\'upload',
            message: 'Une erreur est survenue lors de l\'upload de l\'image.'
          });
          setShowModal(true);
          setUploading(null);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const result = await updateLandingBackground(section, downloadURL, userId);

          if (result.success) {
            if (section === 'express') {
              setExpressUrl(downloadURL);
            } else {
              setEvenementUrl(downloadURL);
            }

            setModalConfig({
              type: 'success',
              title: 'Upload réussi',
              message: `L'image ${section === 'express' ? 'DEM EXPRESS' : 'DEM ÉVÉNEMENT'} a été uploadée avec succès.`
            });
            setShowModal(true);
          } else {
            setModalConfig({
              type: 'error',
              title: 'Erreur',
              message: result.error || 'Une erreur est survenue lors de la mise à jour.'
            });
            setShowModal(true);
          }

          setUploading(null);
          setUploadProgress(0);
        }
      );
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setModalConfig({
        type: 'error',
        title: 'Erreur',
        message: error.message || 'Une erreur est survenue lors de l\'upload.'
      });
      setShowModal(true);
      setUploading(null);
      setUploadProgress(0);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-[#10B981]/10">
          <Image className="w-6 h-6 text-[#10B981]" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">
            Gestion des Images d'Accueil
          </h3>
          <p className="text-sm text-white/60">
            Gérer les arrière-plans du split-screen
          </p>
        </div>
      </div>


      <div className="grid md:grid-cols-2 gap-6">
        {/* DEM EXPRESS */}
        <div className="rounded-2xl p-6 bg-white/5 backdrop-blur-sm border border-white/10"
        >
          <div className="mb-4">
            <h4 className="text-lg font-bold mb-2 text-white">
              DEM EXPRESS
            </h4>
            <p className="text-sm text-white/60">
              Arrière-plan gauche (Voyage)
            </p>
          </div>

          <div className="mb-4">
            <div
              className="w-full h-48 rounded-xl bg-cover bg-center relative overflow-hidden"
              style={{ backgroundImage: `url(${backgrounds.express})` }}
            >
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <p className="text-white font-bold text-2xl">DEM EXPRESS</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-white/80">
              Charger une image depuis votre appareil
            </label>
            <input
              type="file"
              id="express-file-upload"
              accept="image/*"
              onChange={(e) => e.target.files && e.target.files[0] && handleFileUpload(e.target.files[0], 'express')}
              className="hidden"
              disabled={uploading === 'express'}
            />
            <label
              htmlFor="express-file-upload"
              className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                uploading === 'express'
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-[#10B981] text-white hover:bg-[#059669]'
              }`}
            >
              {uploading === 'express' ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Upload en cours... {uploadProgress}%
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Choisir une image
                </>
              )}
            </label>
            {uploading === 'express' && uploadProgress > 0 && (
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#10B981] h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            {expressUrl && (
              <p className="text-xs text-white/50 truncate">
                Image actuelle : {expressUrl.substring(0, 50)}...
              </p>
            )}
          </div>
        </div>

        {/* DEM ÉVÉNEMENT */}
        <div className="rounded-2xl p-6 bg-white/5 backdrop-blur-sm border border-white/10">
          <div className="mb-4">
            <h4 className="text-lg font-bold mb-2 text-white">
              DEM ÉVÉNEMENT
            </h4>
            <p className="text-sm text-white/60">
              Arrière-plan droit (Événements)
            </p>
          </div>

          <div className="mb-4">
            <div
              className="w-full h-48 rounded-xl bg-cover bg-center relative overflow-hidden"
              style={{ backgroundImage: `url(${backgrounds.evenement})` }}
            >
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <p className="text-white font-bold text-2xl">DEM ÉVÉNEMENT</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-white/80">
              Charger une image depuis votre appareil
            </label>
            <input
              type="file"
              id="evenement-file-upload"
              accept="image/*"
              onChange={(e) => e.target.files && e.target.files[0] && handleFileUpload(e.target.files[0], 'evenement')}
              className="hidden"
              disabled={uploading === 'evenement'}
            />
            <label
              htmlFor="evenement-file-upload"
              className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                uploading === 'evenement'
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-[#10B981] text-white hover:bg-[#059669]'
              }`}
            >
              {uploading === 'evenement' ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Upload en cours... {uploadProgress}%
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Choisir une image
                </>
              )}
            </label>
            {uploading === 'evenement' && uploadProgress > 0 && (
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#10B981] h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            {evenementUrl && (
              <p className="text-xs text-white/50 truncate">
                Image actuelle : {evenementUrl.substring(0, 50)}...
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <p className="text-sm text-white/70">
          💡 <strong className="text-white">Astuce :</strong> Choisissez des images de haute qualité (1920x1080px minimum).
          Les fichiers sont automatiquement uploadés sur Firebase Storage et les URLs sont enregistrées. Taille maximale : 5 MB.
        </p>
      </div>

      <AlertModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
      />
    </div>
  );
}
