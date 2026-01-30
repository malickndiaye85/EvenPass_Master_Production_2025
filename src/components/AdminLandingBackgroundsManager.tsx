import React, { useState, useEffect } from 'react';
import { Image, Upload, Loader, Check, X } from 'lucide-react';
import { updateLandingBackground, useLandingBackgrounds } from '../lib/landingBackgrounds';

interface AdminLandingBackgroundsManagerProps {
  isDark: boolean;
  userId: string;
}

export default function AdminLandingBackgroundsManager({ isDark, userId }: AdminLandingBackgroundsManagerProps) {
  const { backgrounds, loading } = useLandingBackgrounds();
  const [expressUrl, setExpressUrl] = useState('');
  const [evenementUrl, setEvenementUrl] = useState('');
  const [uploading, setUploading] = useState<'express' | 'evenement' | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!loading) {
      setExpressUrl(backgrounds.express || '');
      setEvenementUrl(backgrounds.evenement || '');
    }
  }, [backgrounds, loading]);

  const handleUpdate = async (section: 'express' | 'evenement') => {
    const url = section === 'express' ? expressUrl : evenementUrl;

    if (!url.trim()) {
      setMessage({ type: 'error', text: 'URL ne peut pas être vide' });
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setMessage({ type: 'error', text: 'URL invalide. Doit commencer par http:// ou https://' });
      return;
    }

    setUploading(section);
    setMessage(null);

    const result = await updateLandingBackground(section, url, userId);

    if (result.success) {
      setMessage({
        type: 'success',
        text: `Image ${section === 'express' ? 'DEM EXPRESS' : 'DEM ÉVÉNEMENT'} mise à jour avec succès`
      });
    } else {
      setMessage({
        type: 'error',
        text: result.error || 'Erreur lors de la mise à jour'
      });
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
        <div className={`p-3 rounded-xl ${isDark ? 'bg-cyan-500/20' : 'bg-cyan-50'}`}>
          <Image className={`w-6 h-6 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
        </div>
        <div>
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Gestion des Images d'Accueil
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Gérer les arrière-plans du split-screen
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success'
            ? isDark ? 'bg-green-500/20 border border-green-500/30' : 'bg-green-50 border border-green-200'
            : isDark ? 'bg-red-500/20 border border-red-500/30' : 'bg-red-50 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <Check className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
          ) : (
            <X className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          )}
          <p className={`text-sm font-medium ${
            message.type === 'success'
              ? isDark ? 'text-green-400' : 'text-green-700'
              : isDark ? 'text-red-400' : 'text-red-700'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* DEM EXPRESS */}
        <div className={`rounded-2xl p-6 border-2 ${
          isDark
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="mb-4">
            <h4 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              DEM EXPRESS
            </h4>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
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
            <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              URL de l'image (Pexels recommandé)
            </label>
            <input
              type="url"
              value={expressUrl}
              onChange={(e) => setExpressUrl(e.target.value)}
              placeholder="https://images.pexels.com/..."
              className={`w-full px-4 py-3 rounded-xl border-2 ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:border-cyan-500`}
            />
            <button
              onClick={() => handleUpdate('express')}
              disabled={uploading === 'express'}
              className={`w-full py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                uploading === 'express'
                  ? 'bg-gray-500 cursor-not-allowed'
                  : isDark
                  ? 'bg-gradient-to-r from-cyan-500 to-[#0A7EA3] hover:from-cyan-600 hover:to-[#006B8C]'
                  : 'bg-gradient-to-r from-[#0A7EA3] to-[#005975] hover:from-[#006B8C] hover:to-[#00475E]'
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
        <div className={`rounded-2xl p-6 border-2 ${
          isDark
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="mb-4">
            <h4 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              DEM ÉVÉNEMENT
            </h4>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
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
            <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              URL de l'image (Pexels recommandé)
            </label>
            <input
              type="url"
              value={evenementUrl}
              onChange={(e) => setEvenementUrl(e.target.value)}
              placeholder="https://images.pexels.com/..."
              className={`w-full px-4 py-3 rounded-xl border-2 ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:border-orange-500`}
            />
            <button
              onClick={() => handleUpdate('evenement')}
              disabled={uploading === 'evenement'}
              className={`w-full py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                uploading === 'evenement'
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
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

      <div className={`p-4 rounded-xl ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`}>
        <p className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
          💡 <strong>Astuce :</strong> Utilisez des images de Pexels (pexels.com) pour des photos libres de droits de haute qualité.
          Format recommandé : 1920x1080px minimum.
        </p>
      </div>
    </div>
  );
}
