import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, DollarSign, Mail, Lock, AlertCircle, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/FirebaseAuthContext';
import { auth } from '../firebase';
import { initSuperAdminRole } from '../lib/initFirebaseRoles';

const SUPER_ADMIN_UID = 'Tnq8Isi0fATmidMwEuVrw1SAJkI3';

export default function AdminFinanceLoginPage() {
  const navigate = useNavigate();
  const { signIn, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [initializingRoles, setInitializingRoles] = useState(false);
  const [showRoleInitButton, setShowRoleInitButton] = useState(false);

  // Remettre loading à false si authContext a fini de charger
  useEffect(() => {
    if (!authLoading && loading) {
      console.log('[ADMIN LOGIN] AuthContext a fini de charger, déblocage du bouton');
      setLoading(false);
    }
  }, [authLoading, loading]);

  useEffect(() => {
    console.log('[ADMIN LOGIN] Auth state changed:', {
      authLoading,
      hasUser: !!user,
      userRole: user?.role,
      userId: user?.id,
      isSuperAdminUID: user?.id === SUPER_ADMIN_UID
    });

    if (!authLoading && user) {
      // Force redirect if UID matches super admin, regardless of role
      if (user.id === SUPER_ADMIN_UID) {
        console.log('[ADMIN LOGIN] ✅ Super Admin UID detected, forcing redirect to /admin/transversal');
        navigate('/admin/transversal');
        return;
      }

      // Regular admin role check
      if (user.role === 'admin' || user.role === 'super_admin') {
        console.log('[ADMIN LOGIN] Redirecting admin user...');
        if (user.role === 'super_admin') {
          console.log('[ADMIN LOGIN] → /admin/transversal');
          navigate('/admin/transversal');
        } else {
          console.log('[ADMIN LOGIN] → /admin/finance');
          navigate('/admin/finance');
        }
      } else {
        console.log('[ADMIN LOGIN] ⚠️ Utilisateur connecté mais rôle incorrect:', user.role);

        // Show button to initialize roles for super admin
        if (user.id === SUPER_ADMIN_UID) {
          setShowRoleInitButton(true);
          setError('Rôle super-admin non initialisé. Cliquez sur "Initialiser les rôles" ci-dessous.');
        } else {
          setError('Accès non autorisé. Compte administrateur requis.');
        }
        setLoading(false);
      }
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('[ADMIN LOGIN] 🔐 Début de la connexion pour:', email);
    console.log('[ADMIN LOGIN] Firebase Auth disponible:', !!auth);

    // Timeout de sécurité pour éviter le blocage infini
    const timeoutId = setTimeout(() => {
      console.error('[ADMIN LOGIN] ⏰ Timeout dépassé (10s)');
      setError('Délai de connexion dépassé. Veuillez réessayer.');
      setLoading(false);
    }, 10000);

    try {
      console.log('[ADMIN LOGIN] 📨 Appel de signIn...');
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        console.error('[ADMIN LOGIN] ❌ Erreur de connexion:', signInError.message);

        // Gestion spéciale pour erreur 403 / PERMISSION_DENIED
        if (signInError.message.includes('PERMISSION_DENIED') || signInError.message.includes('403')) {
          setError('Accès refusé : Vérifiez vos privilèges admin dans Firebase Console (Security Rules)');
        } else if (signInError.message.includes('auth/invalid-credential') || signInError.message.includes('auth/wrong-password')) {
          setError('Email ou mot de passe incorrect');
        } else if (signInError.message.includes('auth/user-not-found')) {
          setError('Aucun compte trouvé avec cet email');
        } else if (signInError.message.includes('auth/too-many-requests')) {
          setError('Trop de tentatives. Réessayez dans quelques minutes');
        } else {
          setError(signInError.message);
        }

        clearTimeout(timeoutId);
        setLoading(false);
        return;
      }

      console.log('[ADMIN LOGIN] ✅ Connexion réussie, attente du chargement du profil...');

      // Attendre que le profil soit chargé via authContext
      // Le useEffect se chargera de la redirection
      clearTimeout(timeoutId);

    } catch (err: any) {
      console.error('[ADMIN LOGIN] 💥 Exception:', err);

      // Gestion spéciale pour erreur 403 / PERMISSION_DENIED
      if (err?.code === 'PERMISSION_DENIED' || err?.message?.includes('403')) {
        setError('Accès refusé : Vérifiez vos privilèges admin dans Firebase Console (Security Rules)');
      } else if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password') {
        setError('Email ou mot de passe incorrect');
      } else if (err?.code === 'auth/user-not-found') {
        setError('Aucun compte trouvé avec cet email');
      } else if (err?.code === 'auth/too-many-requests') {
        setError('Trop de tentatives. Réessayez dans quelques minutes');
      } else {
        setError('Erreur de connexion. Vérifiez votre connexion Internet.');
      }

      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleInitializeRoles = async () => {
    setInitializingRoles(true);
    setError('');

    try {
      console.log('[ADMIN LOGIN] 🔧 Initializing Super Admin role...');
      const result = await initSuperAdminRole();

      if (result.success) {
        console.log('[ADMIN LOGIN] ✅ Role initialized successfully');
        setError('');
        // Reload the page to trigger auth state change
        window.location.reload();
      } else {
        console.error('[ADMIN LOGIN] ❌ Failed to initialize role:', result.message);
        setError(result.message);
      }
    } catch (err: any) {
      console.error('[ADMIN LOGIN] 💥 Exception during role initialization:', err);
      setError('Erreur lors de l\'initialisation des rôles: ' + err.message);
    } finally {
      setInitializingRoles(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#0A1628] mb-6 shadow-2xl shadow-[#0A1628]/50">
            <DollarSign className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-[#FFFFFF] mb-2">
            Admin Finance
          </h1>
          <p className="text-[#B5B5B5]">
            Portail Super Admin DEM-DEM
          </p>
        </div>

        <div className="bg-[#2A2A2A] rounded-3xl p-8 shadow-2xl border border-[#2A2A2A]">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {showRoleInitButton && (
            <button
              type="button"
              onClick={handleInitializeRoles}
              disabled={initializingRoles}
              className="w-full mb-6 py-3 bg-gradient-to-r from-cyan-500 to-[#0A7EA3] text-white font-bold rounded-2xl hover:from-cyan-600 hover:to-[#006B8C] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {initializingRoles ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Initialisation...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Initialiser les rôles Super Admin
                </>
              )}
            </button>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#FFFFFF] mb-2">
                Email Admin
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#B5B5B5]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-2xl text-[#FFFFFF] placeholder-[#B5B5B5] focus:outline-none focus:border-[#0A1628] transition-colors"
                  placeholder="admin@demdem.sn"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#FFFFFF] mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#B5B5B5]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  required
                  className={`w-full pl-12 pr-14 py-3 border border-[#2A2A2A] rounded-2xl text-[#FFFFFF] placeholder-[#B5B5B5] focus:outline-none focus:border-[#0A1628] transition-all ${
                    passwordFocused ? 'bg-[#0F0F0F]' : 'bg-[#1A1A1A]'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-white" />
                  ) : (
                    <Eye className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0A1628] hover:bg-[#0D1F3A] text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-[#0A1628]/50 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Accès sécurisé
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-[#B5B5B5] hover:text-[#0A1628] transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
