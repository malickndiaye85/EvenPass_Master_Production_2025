import React, { useState, useEffect } from 'react';
import { Image, Upload, Loader, Check, X } from 'lucide-react';
import { updateLandingBackground, useLandingBackgrounds } from '../lib/landingBackgrounds';
import AlertModal from './AlertModal';

interface AdminLandingBackgroundsManagerProps {
  isDark: boolean;
  userId: string;
}

export default function AdminLandingBackgroundsManager({ isDark, userId }: AdminLandingBackgroundsManagerProps) {
  const { backgrounds, loading } = useLandingBackgrounds();
  const [expressUrl, setExpressUrl] = useState('');
  const [evenementUrl, setEvenementUrl] = useState('');
  const [uploading, setUploading] = useState<'express' | 'evenement' | null>(null);
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

  const handleUpdate = async (section: 'express' | 'evenement') => {
    const url = section === 'express' ? expressUrl : evenementUrl;

    if (!url.trim()) {
      setModalConfig({
        type: 'error',
        title: 'URL vide',
        message: 'Veuillez entrer une URL valide pour l\'image.'
      });
      setShowModal(true);
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setModalConfig({
        type: 'error',
        title: 'URL invalide',
        message: 'L\'URL doit commencer par http:// ou https://'
      });
      setShowModal(true);
      return;
    }

    setUploading(section);

    const result = await updateLandingBackground(section, url, userId);

    if (result.success) {
      setModalConfig({
        type: 'success',
        title: 'Mise à jour réussie',
        message: `L'image ${section === 'express' ? 'DEM EXPRESS' : 'DEM ÉVÉNEMENT'} a été mise à jour avec succès.`
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
        <div className="p-3 rounded-xl bg-[#00FF00]/10">
          <Image className="w-6 h-6 text-[#00FF00]" />
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
              URL de l'image (Pexels recommandé)
            </label>
            <input
              type="url"
              value={expressUrl}
              onChange={(e) => setExpressUrl(e.target.value)}
              placeholder="https://images.pexels.com/..."
              className="w-full px-4 py-3 rounded-xl border bg-white/5 border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#00FF00]/50 focus:bg-white/10 transition-all"
            />
            <button
              onClick={() => handleUpdate('express')}
              disabled={uploading === 'express'}
              className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                uploading === 'express'
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-[#00FF00] text-black hover:bg-[#00DD00]'
              }`}
            >
              {uploading === 'express' ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Mettre à jour
                </>
              )}
            </button>
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
              URL de l'image (Pexels recommandé)
            </label>
            <input
              type="url"
              value={evenementUrl}
              onChange={(e) => setEvenementUrl(e.target.value)}
              placeholder="https://images.pexels.com/..."
              className="w-full px-4 py-3 rounded-xl border bg-white/5 border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#00FF00]/50 focus:bg-white/10 transition-all"
            />
            <button
              onClick={() => handleUpdate('evenement')}
              disabled={uploading === 'evenement'}
              className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                uploading === 'evenement'
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-[#00FF00] text-black hover:bg-[#00DD00]'
              }`}
            >
              {uploading === 'evenement' ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Mettre à jour
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <p className="text-sm text-white/70">
          💡 <strong className="text-white">Astuce :</strong> Utilisez des images de Pexels (pexels.com) pour des photos libres de droits de haute qualité.
          Format recommandé : 1920x1080px minimum.
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
