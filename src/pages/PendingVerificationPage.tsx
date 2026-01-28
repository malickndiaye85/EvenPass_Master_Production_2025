import { useNavigate } from 'react-router-dom';
import { Clock, Mail, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/FirebaseAuthContext';

export default function PendingVerificationPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/organizer/login');
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-[#2A2A2A] rounded-3xl p-12 shadow-2xl border border-[#2A2A2A] text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#FF5F05]/10 border-4 border-[#FF5F05]/30 mb-6 animate-pulse">
            <Clock className="w-12 h-12 text-[#FF5F05]" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">
            Compte en cours de vérification
          </h1>

          <p className="text-lg text-[#B5B5B5] mb-8">
            Merci de votre inscription ! Notre équipe examine actuellement votre demande.
          </p>

          <div className="bg-[#0F0F0F] rounded-2xl p-6 mb-8 text-left space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <p className="text-white font-bold mb-1">Votre demande a été reçue</p>
                <p className="text-sm text-[#B5B5B5]">
                  Nous avons bien reçu votre demande d'inscription en tant qu'organisateur
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#FF8C42] flex-shrink-0 mt-1" />
              <div>
                <p className="text-white font-bold mb-1">Vérification en cours</p>
                <p className="text-sm text-[#B5B5B5]">
                  EvenPass procède à la vérification de vos documents et informations
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1" />
              <div>
                <p className="text-white font-bold mb-1">Notification par email</p>
                <p className="text-sm text-[#B5B5B5]">
                  Vous recevrez un email de confirmation une fois votre compte approuvé
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#FF5F05]/10 border border-[#FF5F05]/20 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#FF5F05] flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-white font-bold mb-2">Délai de traitement : 24 heures</p>
                <p className="text-sm text-[#B5B5B5] mb-4">
                  Votre demande sera traitée dans un délai de 24 heures maximum.
                  Passé ce délai, vous pouvez nous contacter.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-[#FF8C42]" />
                    <span className="text-white font-medium">77 139 29 26</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-[#FF8C42]" />
                    <span className="text-white font-medium">contact@demdem.sn</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="w-full px-8 py-4 bg-[#2A2A2A] hover:bg-[#404040] text-white rounded-2xl font-bold transition-all"
            >
              Se déconnecter
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full px-8 py-4 bg-transparent hover:bg-[#2A2A2A] text-[#B5B5B5] hover:text-white rounded-2xl font-bold transition-all border border-[#2A2A2A]"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>

        <p className="text-center text-[#B5B5B5] mt-6 text-sm">
          En attendant la validation, vous pouvez découvrir les événements sur EvenPass
        </p>
      </div>
    </div>
  );
}
