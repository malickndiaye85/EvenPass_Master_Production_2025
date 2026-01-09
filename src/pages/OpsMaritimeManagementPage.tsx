import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ship, Plus, Key, LogOut, Moon, Sun, Shield, Users, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/FirebaseAuthContext';
import { useTheme } from '../context/ThemeContext';
import { firestore } from '../firebase';
import { collection, getDocs, addDoc, query, where, Timestamp } from 'firebase/firestore';
import MaritimeAccessManager from '../components/MaritimeAccessManager';

interface MaritimeController {
  id: string;
  name: string;
  email: string;
  role: 'accueil' | 'commandant' | 'commercial';
  vessel_id: string;
  vessel_name: string;
  access_code?: string;
  is_active: boolean;
  created_at: any;
}

const VESSELS = [
  { id: 'aguene', name: 'Aguène' },
  { id: 'diarama', name: 'Diarama' },
  { id: 'coumba_castel', name: 'Coumba Castel' }
];

export default function OpsMaritimeManagementPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [controllers, setControllers] = useState<MaritimeController[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        navigate('/');
      } else {
        loadControllers();
      }
    }
  }, [authLoading, user, navigate]);

  const loadControllers = async () => {
    try {
      setLoading(true);
      const controllersRef = collection(firestore, 'maritime_users');
      const snapshot = await getDocs(controllersRef);

      const loadedControllers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MaritimeController[];

      setControllers(loadedControllers);
    } catch (error) {
      console.error('Error loading controllers:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAccessCode = (controllerId: string, vesselId: string): string => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString().slice(-3);
    return `${timestamp}${random}`;
  };

  const handleGenerateCode = async (controller: MaritimeController) => {
    setGenerating(controller.id);
    try {
      const accessCode = generateAccessCode(controller.id, controller.vessel_id);

      await addDoc(collection(firestore, 'maritime_access_codes'), {
        controller_id: controller.id,
        controller_name: controller.name,
        controller_email: controller.email,
        vessel_id: controller.vessel_id,
        vessel_name: controller.vessel_name,
        role: controller.role,
        access_code: accessCode,
        is_active: true,
        scans_count: 0,
        created_at: Timestamp.now(),
        expires_at: null,
      });

      alert(`✅ Code généré avec succès!\n\nCode: ${accessCode}\nContrôleur: ${controller.name}\nNavire: ${controller.vessel_name}\n\nCe code ouvre EPscan+ (PASS)`);

      await loadControllers();
    } catch (error) {
      console.error('Error generating code:', error);
      alert('❌ Erreur lors de la génération du code');
    } finally {
      setGenerating(null);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'accueil':
        return isDark ? 'text-green-400 bg-green-900/40' : 'text-green-700 bg-green-100';
      case 'commandant':
        return isDark ? 'text-blue-400 bg-blue-900/40' : 'text-blue-700 bg-blue-100';
      case 'commercial':
        return isDark ? 'text-purple-400 bg-purple-900/40' : 'text-purple-700 bg-purple-100';
      default:
        return isDark ? 'text-slate-400 bg-slate-900/40' : 'text-slate-700 bg-slate-100';
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#050505]' : 'bg-slate-50'}`}>
      <header className={`sticky top-0 z-50 ${
        isDark ? 'bg-black/80 border-slate-800' : 'bg-white/80 border-slate-200'
      } backdrop-blur-xl border-b`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/ops')}
                className={`p-3 rounded-xl transition-all ${
                  isDark
                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                ←
              </button>
              <div>
                <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Gestion Contrôleurs PASS
                </h1>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Codes d'accès EPscan+ Maritime
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className={`p-3 rounded-xl transition-all ${
                  isDark
                    ? 'bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-400'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate('/admin/ops/login');
                }}
                className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                  isDark
                    ? 'bg-red-900/20 hover:bg-red-900/40 text-red-400'
                    : 'bg-red-50 hover:bg-red-100 text-red-600'
                }`}
              >
                <LogOut className="w-5 h-5" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className={`rounded-3xl p-8 mb-8 ${
          isDark
            ? 'bg-gradient-to-br from-blue-950/40 to-cyan-950/40 border border-blue-900/40'
            : 'bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-4 rounded-2xl ${isDark ? 'bg-blue-900/60' : 'bg-blue-100'}`}>
              <Shield className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div className="flex-1">
              <h2 className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Système de Codes par Contrôleur
              </h2>
              <p className={`mb-4 ${isDark ? 'text-blue-300/80' : 'text-blue-900'}`}>
                Chaque contrôleur reçoit un code d'accès unique à 6 chiffres qui ouvre EPscan+ pour une traçabilité totale des scans.
              </p>
              <div className="grid md:grid-cols-3 gap-3">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-900/40' : 'bg-white'}`}>
                  <CheckCircle className={`w-4 h-4 mb-1 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Code unique par agent
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-900/40' : 'bg-white'}`}>
                  <CheckCircle className={`w-4 h-4 mb-1 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Traçabilité totale
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-900/40' : 'bg-white'}`}>
                  <CheckCircle className={`w-4 h-4 mb-1 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Mode hors-ligne
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`rounded-3xl p-8 ${
          isDark
            ? 'bg-slate-900/80 border border-slate-800'
            : 'bg-white border border-slate-200'
        }`}>
          <h2 className={`text-2xl font-black mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Contrôleurs Actifs
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Chargement...</p>
            </div>
          ) : controllers.length === 0 ? (
            <div className="text-center py-12">
              <Users className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-slate-700' : 'text-slate-300'}`} />
              <p className={`font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Aucun contrôleur enregistré
              </p>
              <p className={`text-sm mt-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                Créez des contrôleurs depuis la section Maritime
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {controllers.map((controller) => (
                <div
                  key={controller.id}
                  className={`p-6 rounded-2xl border-2 ${
                    controller.is_active
                      ? isDark
                        ? 'bg-slate-900/40 border-slate-800'
                        : 'bg-slate-50 border-slate-200'
                      : isDark
                      ? 'bg-slate-900/20 border-slate-900 opacity-50'
                      : 'bg-slate-100/50 border-slate-300 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-3 rounded-xl ${
                        controller.is_active
                          ? isDark ? 'bg-blue-900/60' : 'bg-blue-100'
                          : isDark ? 'bg-slate-800' : 'bg-slate-200'
                      }`}>
                        <Ship className={`w-6 h-6 ${
                          controller.is_active
                            ? isDark ? 'text-blue-400' : 'text-blue-600'
                            : isDark ? 'text-slate-600' : 'text-slate-400'
                        }`} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {controller.name}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-black ${getRoleColor(controller.role)}`}>
                            {controller.role.toUpperCase()}
                          </span>
                          {controller.is_active ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <div className={`text-sm space-y-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          <p>📧 {controller.email}</p>
                          <p>🚢 {controller.vessel_name}</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleGenerateCode(controller)}
                      disabled={!controller.is_active || generating === controller.id}
                      className={`px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 transition-all ${
                        controller.is_active
                          ? isDark
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white'
                            : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
                          : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      } disabled:opacity-50`}
                    >
                      <Key className="w-5 h-5" />
                      {generating === controller.id ? 'Génération...' : 'Générer Code'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8">
          <MaritimeAccessManager />
        </div>
      </div>
    </div>
  );
}
