import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Lock, ArrowLeft } from 'lucide-react';
import { CustomModal } from '../../components/CustomModal';

export const DriverLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    phone: '',
    pin: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: ''
  });

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const phoneDigits = formData.phone.replace(/\D/g, '');

      if (phoneDigits.length !== 9) {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Erreur',
          message: 'Numéro de téléphone invalide'
        });
        return;
      }

      if (formData.pin.length !== 4) {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Erreur',
          message: 'Le code PIN doit contenir 4 chiffres'
        });
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      setModal({
        isOpen: true,
        type: 'success',
        title: 'Connexion réussie',
        message: 'Bienvenue dans votre espace Chauffeur'
      });

      setTimeout(() => {
        navigate('/voyage/chauffeur/dashboard');
      }, 1500);

    } catch (error) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Erreur de connexion',
        message: 'Téléphone ou code PIN incorrect'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#1a2942] to-[#0A1628]">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/voyage')}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Retour</span>
        </button>

        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#10B981] to-[#059669] p-8 text-center">
              <h1 className="text-3xl font-bold text-white mb-2">
                Espace Chauffeur
              </h1>
              <p className="text-white/90">
                Connectez-vous pour accéder à votre tableau de bord
              </p>
            </div>

            <div className="p-8">
              <form onSubmit={handleLogin} className="space-y-6">
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
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#10B981] focus:border-transparent text-[#1A1A1A]"
                      placeholder="77 100****"
                      maxLength={11}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code PIN
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={formData.pin}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setFormData({ ...formData, pin: value });
                      }}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#10B981] focus:border-transparent text-[#1A1A1A]"
                      placeholder="••••"
                      maxLength={4}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Connexion...' : 'Se connecter'}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-gray-600">
                  Pas encore de compte ?{' '}
                  <button
                    onClick={() => navigate('/voyage/chauffeur/signup')}
                    className="text-[#10B981] font-semibold hover:text-[#059669] transition-colors"
                  >
                    S'inscrire
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
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
};
