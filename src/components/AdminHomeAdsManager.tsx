import { useState, useEffect } from 'react';
import { Image, Upload, Save, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../context/FirebaseAuthContext';
import { getHomeAdsConfig, updateHomeAdsConfig, type HomeAdsConfig } from '../lib/homeAdsConfig';
import { uploadToCloudinary } from '../lib/cloudinary';

const ADMIN_FINANCE_UID = 'Tnq8Isi0fATmidMwEuVrw1SAJkI3';

export default function AdminHomeAdsManager() {
  const { firebaseUser } = useAuth();
  const [adsConfig, setAdsConfig] = useState<HomeAdsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<'even' | 'pass' | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const config = await getHomeAdsConfig();
      setAdsConfig(config);
    } catch (err) {
      setError('Erreur lors du chargement de la configuration');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'even' | 'pass') => {
    if (firebaseUser?.uid !== ADMIN_FINANCE_UID) {
      setError('Accès refusé. Seul l\'Admin Finance peut modifier les publicités.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image valide');
      return;
    }

    setUploading(type);
    setError('');
    setSuccess('');

    try {
      const imageUrl = await uploadToCloudinary(file);

      const updatedConfig: HomeAdsConfig = {
        ...adsConfig!,
        [type === 'even' ? 'evenBackgroundUrl' : 'passBackgroundUrl']: imageUrl,
        lastUpdated: Date.now(),
        updatedBy: firebaseUser.uid
      };

      await updateHomeAdsConfig(updatedConfig);
      setAdsConfig(updatedConfig);
      setSuccess(`Image ${type === 'even' ? 'EVEN' : 'PASS'} mise à jour avec succès`);
    } catch (err) {
      setError('Erreur lors du téléchargement de l\'image');
      console.error(err);
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[#FF5F05] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (firebaseUser?.uid !== ADMIN_FINANCE_UID) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-red-500 mb-2">Accès Refusé</h3>
            <p className="text-sm text-red-400">
              Seul l'Admin Finance peut accéder à cette section.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#2A2A2A] rounded-3xl p-6 border border-[#2A2A2A]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF5F05] to-[#FF7A00] flex items-center justify-center">
            <Image className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Gestion Publicitaire Home</h2>
            <p className="text-sm text-[#B5B5B5]">
              Gérez les affiches publicitaires de la page d'accueil
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-500">{success}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#0F0F0F] rounded-2xl p-6 border border-[#2A2A2A]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-white">Cadre EVEN</h3>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full">
                Événements
              </span>
            </div>

            {adsConfig?.evenBackgroundUrl && (
              <div className="mb-4 rounded-xl overflow-hidden">
                <img
                  src={adsConfig.evenBackgroundUrl}
                  alt="EVEN Background"
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'even');
                }}
                disabled={uploading !== null}
                className="hidden"
              />
              <div className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all cursor-pointer ${
                uploading === 'even'
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
              }`}>
                {uploading === 'even' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Téléchargement...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Télécharger une affiche
                  </>
                )}
              </div>
            </label>

            <p className="text-xs text-[#B5B5B5] mt-3">
              Recommandé: 1920x1080px minimum. L'image sera affichée avec un overlay sombre pour la lisibilité.
            </p>
          </div>

          <div className="bg-[#0F0F0F] rounded-2xl p-6 border border-[#2A2A2A]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-white">Cadre PASS</h3>
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-bold rounded-full">
                Mobilité
              </span>
            </div>

            {adsConfig?.passBackgroundUrl && (
              <div className="mb-4 rounded-xl overflow-hidden">
                <img
                  src={adsConfig.passBackgroundUrl}
                  alt="PASS Background"
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'pass');
                }}
                disabled={uploading !== null}
                className="hidden"
              />
              <div className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all cursor-pointer ${
                uploading === 'pass'
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-[#0A7EA3] hover:from-cyan-600 hover:to-[#006B8C]'
              }`}>
                {uploading === 'pass' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Téléchargement...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Télécharger une affiche
                  </>
                )}
              </div>
            </label>

            <p className="text-xs text-[#B5B5B5] mt-3">
              Recommandé: 1920x1080px minimum. L'image sera affichée avec un overlay sombre pour la lisibilité.
            </p>
          </div>
        </div>

        {adsConfig && (
          <div className="mt-6 pt-6 border-t border-[#2A2A2A]">
            <p className="text-sm text-[#B5B5B5]">
              Dernière modification:{' '}
              <span className="text-white font-semibold">
                {new Date(adsConfig.lastUpdated).toLocaleString('fr-FR')}
              </span>
            </p>
          </div>
        )}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-blue-400 mb-2">Note Importante</h4>
            <ul className="text-sm text-blue-300 space-y-1">
              <li>• Les images remplacent instantanément les fonds de la page d'accueil</li>
              <li>• Un overlay sombre (40%) est automatiquement appliqué pour la lisibilité</li>
              <li>• Les images sont stockées via Cloudinary et hébergées de manière sécurisée</li>
              <li>• Format recommandé: JPG ou PNG, minimum 1920x1080px</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
