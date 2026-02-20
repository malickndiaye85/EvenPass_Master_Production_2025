import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Key } from 'lucide-react';
import AccessCodesManager from '../../components/AccessCodesManager';
import { useAuth } from '../../context/FirebaseAuthContext';

const AdminPINCodesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  React.useEffect(() => {
    if (!user || (user.role !== 'ops_transport' && user.role !== 'super_admin')) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#1A1A1B] to-[#0A0A0B] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>

          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-3xl shadow-2xl shadow-[#10B981]/30">
              <Key className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white mb-2">
                Gestion des Codes PIN
              </h1>
              <p className="text-gray-400">
                Administration des accès contrôleurs EPscanV
              </p>
            </div>
          </div>
        </div>

        <AccessCodesManager />

        <div className="mt-8 bg-[#10B981]/10 border border-[#10B981]/30 rounded-2xl p-6">
          <h3 className="text-white font-bold text-lg mb-3">Guide d'utilisation</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p>
              <strong className="text-[#10B981]">Contrôleur Fixe :</strong> Lié à un véhicule spécifique (bus, car, etc.). Le code permet au contrôleur du véhicule de scanner les billets.
            </p>
            <p>
              <strong className="text-blue-400">Contrôleur Volant :</strong> Contrôleur mobile non affecté à un véhicule précis. Peut intervenir sur plusieurs lignes.
            </p>
            <p className="mt-4 pt-4 border-t border-gray-700">
              <strong className="text-white">Sécurité :</strong> Les codes peuvent être désactivés instantanément en cas de compromission. Il est recommandé de changer les codes mensuellement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPINCodesPage;
