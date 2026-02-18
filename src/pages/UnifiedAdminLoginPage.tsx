import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../context/FirebaseAuthContext';
import { getDefaultRedirectForRole, UserRole } from '../lib/rolePermissions';

const UnifiedAdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const { signIn, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[UNIFIED LOGIN] Auth state:', { user: user?.email, role: user?.role, authLoading });

    if (!authLoading && user && user.role) {
      console.log('[UNIFIED LOGIN] User already authenticated with role:', user.role);
      console.log('[UNIFIED LOGIN] Bypassing login page, redirecting to dashboard...');
      const redirectPath = getDefaultRedirectForRole(user.role as UserRole);
      console.log('[UNIFIED LOGIN] Redirect path:', redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('[UNIFIED LOGIN] Login attempt for:', email);

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        console.log('[UNIFIED LOGIN] Sign in error:', signInError.message);
        setError('Email ou mot de passe incorrect');
        setLoading(false);
        return;
      }

      console.log('[UNIFIED LOGIN] Sign in successful, showing verification screen');
      setLoading(false);
      setVerifying(true);

      setTimeout(() => {
        console.log('[UNIFIED LOGIN] Verification timeout complete, reloading page');
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('[UNIFIED LOGIN] Login error:', err);
      setError('Une erreur est survenue lors de la connexion');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#1A1A1B] to-[#0A0A0B] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#10B981]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#3B82F6]/5 rounded-full blur-3xl"></div>
      </div>

      {verifying ? (
        <div className="relative bg-[#1A1A1B]/80 backdrop-blur-xl p-12 rounded-2xl border border-[#2A2A2B] shadow-2xl max-w-md w-full text-center">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
              <Shield className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-[#10B981]" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Vérification de vos accès...</h3>
              <p className="text-gray-400">Analyse de vos permissions en cours</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse delay-75"></div>
              <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse delay-150"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative bg-[#1A1A1B]/80 backdrop-blur-xl p-8 rounded-2xl border border-[#2A2A2B] shadow-2xl max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-2xl mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Portail d'Administration</h1>
            <p className="text-gray-400">Accès sécurisé aux dashboards DEM-DEM</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email professionnel
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2A2A2B] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent transition-all"
                placeholder="nom@demdem.sn"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2A2A2B] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#10B981]/25 transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Connexion...
                </>
              ) : (
                <>
                  <Lock className="mr-2" size={20} />
                  Se connecter
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#2A2A2B]">
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <Shield size={14} />
              <span>Connexion sécurisée avec vérification de rôle</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedAdminLoginPage;
