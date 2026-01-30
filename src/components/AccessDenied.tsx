import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Home } from 'lucide-react';
import { useAuth } from '../context/FirebaseAuthContext';
import { getSiloForRole } from '../hooks/useSiloCheck';

interface AccessDeniedProps {
  message?: string;
  title?: string;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({
  message = 'Vous n\'avez pas les permissions nécessaires pour accéder à cette page.',
  title = 'Accès Refusé'
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getHomeRoute = () => {
    if (!user) return '/';

    const silo = getSiloForRole(user.role || '');

    if (silo === 'voyage') {
      return '/voyage/wallet';
    }

    if (silo === 'evenement') {
      return '/';
    }

    if (silo === 'admin') {
      return '/admin/finance';
    }

    return '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B] p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl p-8 text-center bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl">
          <div className="flex justify-center mb-6">
            <img
              src="/assets/logo-demdemv2.svg"
              alt="DEM-DEM"
              className="h-16 w-auto object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/assets/logo-demdem.png';
              }}
            />
          </div>

          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-red-500" />
          </div>

          <h2 className="text-2xl font-bold mb-2 text-white">
            {title}
          </h2>

          <p className="mb-6 text-white/60">
            {message}
          </p>

          {user && (
            <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm text-white/40 mb-1">Votre profil :</p>
              <p className="text-white font-medium">{user.email}</p>
              <p className="text-xs text-white/40 mt-1">
                Rôle : <span className="text-[#10B981]">{user.role}</span>
              </p>
            </div>
          )}

          <button
            onClick={() => navigate(getHomeRoute())}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#10B981] text-black rounded-xl font-bold hover:bg-[#059669] transition-all"
          >
            <Home className="w-5 h-5" />
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
