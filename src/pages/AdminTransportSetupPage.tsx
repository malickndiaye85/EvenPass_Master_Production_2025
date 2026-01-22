import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Check, AlertCircle, DollarSign } from 'lucide-react';
import { initializeTransportDatabase, getPricing, updateRoutePricing } from '../lib/transportFirebase';
import { PricingConfig } from '../types/transport';
import Logo from '../components/Logo';

export default function AdminTransportSetupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState('');
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [editMode, setEditMode] = useState(false);

  const [line1Eco, setLine1Eco] = useState(10000);
  const [line1Comfort, setLine1Comfort] = useState(15000);
  const [line2Eco, setLine2Eco] = useState(15000);
  const [line2Comfort, setLine2Comfort] = useState(30000);

  async function handleInitialize() {
    setLoading(true);
    setError('');

    try {
      const result = await initializeTransportDatabase();

      if (result.success) {
        setInitialized(true);
        const pricingData = await getPricing();
        setPricing(pricingData);

        if (pricingData) {
          setLine1Eco(pricingData.routes['line-1'].eco);
          setLine1Comfort(pricingData.routes['line-1'].comfort);
          setLine2Eco(pricingData.routes['line-2'].eco);
          setLine2Comfort(pricingData.routes['line-2'].comfort);
        }
      } else {
        setError('Erreur lors de l\'initialisation de la base de données');
      }
    } catch (err) {
      setError('Erreur: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadPricing() {
    setLoading(true);
    setError('');

    try {
      const pricingData = await getPricing();

      if (pricingData) {
        setPricing(pricingData);
        setInitialized(true);

        setLine1Eco(pricingData.routes['line-1'].eco);
        setLine1Comfort(pricingData.routes['line-1'].comfort);
        setLine2Eco(pricingData.routes['line-2'].eco);
        setLine2Comfort(pricingData.routes['line-2'].comfort);
      } else {
        setError('Aucune configuration de prix trouvée. Veuillez initialiser d\'abord.');
      }
    } catch (err) {
      setError('Erreur: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePricing() {
    setLoading(true);
    setError('');

    try {
      await Promise.all([
        updateRoutePricing('line-1', line1Eco, line1Comfort, 'admin'),
        updateRoutePricing('line-2', line2Eco, line2Comfort, 'admin'),
      ]);

      alert('Prix mis à jour avec succès!');
      setEditMode(false);
      await handleLoadPricing();
    } catch (err) {
      setError('Erreur: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="bg-[#0A192F] shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" showText={true} />
            <button
              onClick={() => navigate('/admin/ops')}
              className="text-white hover:text-[#10B981] transition"
            >
              Retour Admin
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-black text-[#0A192F] mb-2">
              Configuration Transport
            </h1>
            <p className="text-gray-600">
              Initialiser et gérer les données de transport
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {!initialized && (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <div className="text-center">
                <div className="inline-flex p-6 rounded-full bg-[#10B981]/10 mb-6">
                  <Database className="w-16 h-16 text-[#10B981]" />
                </div>

                <h2 className="text-2xl font-bold text-[#0A192F] mb-4">
                  Initialiser la base de données Transport
                </h2>

                <p className="text-gray-600 mb-8">
                  Cette action va créer les collections Firestore nécessaires et les pré-remplir avec les données par défaut:
                </p>

                <ul className="text-left max-w-md mx-auto space-y-2 mb-8">
                  <li className="flex items-start space-x-2">
                    <Check className="w-5 h-5 text-[#10B981] mt-0.5 flex-shrink-0" />
                    <span>Line 1: Dakar → Mbour (10k/15k FCFA)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-5 h-5 text-[#10B981] mt-0.5 flex-shrink-0" />
                    <span>Line 2: Dakar → Thiès (15k/30k FCFA)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-5 h-5 text-[#10B981] mt-0.5 flex-shrink-0" />
                    <span>Configuration des horaires et tarifs</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-5 h-5 text-[#10B981] mt-0.5 flex-shrink-0" />
                    <span>Logique de split-shift (10h-16h)</span>
                  </li>
                </ul>

                <div className="space-y-4">
                  <button
                    onClick={handleInitialize}
                    disabled={loading}
                    className="w-full bg-[#10B981] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#0EA570] transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Database className="w-6 h-6" />
                        <span>Initialiser maintenant</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleLoadPricing}
                    disabled={loading}
                    className="w-full bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all disabled:opacity-50"
                  >
                    Charger la configuration existante
                  </button>
                </div>
              </div>
            </div>
          )}

          {initialized && pricing && (
            <div className="space-y-6">
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                <div className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-green-900 mb-1">Base de données initialisée</h3>
                    <p className="text-green-800 text-sm">
                      La configuration du transport est prête. Vous pouvez maintenant gérer les prix.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#0A192F] flex items-center space-x-2">
                    <DollarSign className="w-7 h-7 text-[#10B981]" />
                    <span>Gestion des Prix</span>
                  </h2>

                  {!editMode && (
                    <button
                      onClick={() => setEditMode(true)}
                      className="bg-[#10B981] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#0EA570] transition"
                    >
                      Modifier les prix
                    </button>
                  )}
                </div>

                <div className="space-y-8">
                  <div className="border-2 border-gray-200 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-[#0A192F] mb-4">
                      Line 1: Dakar → Mbour
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Eco (FCFA)
                        </label>
                        <input
                          type="number"
                          value={line1Eco}
                          onChange={(e) => setLine1Eco(parseInt(e.target.value) || 0)}
                          disabled={!editMode}
                          className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 font-bold text-lg focus:outline-none focus:border-[#10B981] disabled:bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Comfort (FCFA)
                        </label>
                        <input
                          type="number"
                          value={line1Comfort}
                          onChange={(e) => setLine1Comfort(parseInt(e.target.value) || 0)}
                          disabled={!editMode}
                          className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 font-bold text-lg focus:outline-none focus:border-[#10B981] disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-2 border-gray-200 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-[#0A192F] mb-4">
                      Line 2: Dakar → Thiès
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Eco (FCFA)
                        </label>
                        <input
                          type="number"
                          value={line2Eco}
                          onChange={(e) => setLine2Eco(parseInt(e.target.value) || 0)}
                          disabled={!editMode}
                          className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 font-bold text-lg focus:outline-none focus:border-[#10B981] disabled:bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Comfort (FCFA)
                        </label>
                        <input
                          type="number"
                          value={line2Comfort}
                          onChange={(e) => setLine2Comfort(parseInt(e.target.value) || 0)}
                          disabled={!editMode}
                          className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 font-bold text-lg focus:outline-none focus:border-[#10B981] disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {editMode && (
                  <div className="mt-6 flex space-x-4">
                    <button
                      onClick={handleUpdatePricing}
                      disabled={loading}
                      className="flex-1 bg-[#10B981] text-white py-4 rounded-xl font-bold hover:bg-[#0EA570] transition-all disabled:opacity-50"
                    >
                      {loading ? 'Mise à jour...' : 'Enregistrer les changements'}
                    </button>

                    <button
                      onClick={() => {
                        setEditMode(false);
                        if (pricing) {
                          setLine1Eco(pricing.routes['line-1'].eco);
                          setLine1Comfort(pricing.routes['line-1'].comfort);
                          setLine2Eco(pricing.routes['line-2'].eco);
                          setLine2Comfort(pricing.routes['line-2'].comfort);
                        }
                      }}
                      className="flex-1 bg-gray-200 text-gray-800 py-4 rounded-xl font-bold hover:bg-gray-300 transition-all"
                    >
                      Annuler
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
