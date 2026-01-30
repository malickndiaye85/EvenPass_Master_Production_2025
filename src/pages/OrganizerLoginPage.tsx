import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Eye, EyeOff, ArrowRight, RefreshCw } from 'lucide-react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, db } from '../firebase';
import DynamicLogo from '../components/DynamicLogo';
import { verifyOrganizersByEvents } from '../lib/initFirebaseRoles';

export default function OrganizerLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [logoTapTimeout, setLogoTapTimeout] = useState<NodeJS.Timeout | null>(null);
  const [initializingRoles, setInitializingRoles] = useState(false);
  const [showRoleInitButton, setShowRoleInitButton] = useState(false);

  const handleLogoClick = () => {
    // Clear existing timeout
    if (logoTapTimeout) {
      clearTimeout(logoTapTimeout);
    }

    const newCount = logoTapCount + 1;
    setLogoTapCount(newCount);

    // Triple tap for admin access
    if (newCount === 3) {
      navigate('/admin/login');
      setLogoTapCount(0);
      return;
    }

    // Reset counter after 1 second
    const timeout = setTimeout(() => {
      setLogoTapCount(0);
    }, 1000);
    setLogoTapTimeout(timeout);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const organizerRef = ref(db, `organizers/${user.uid}`);
      const organizerSnapshot = await get(organizerRef);
      const organizerData = organizerSnapshot.val();

      if (!organizerData) {
        console.log('[ORGANIZER LOGIN] ⚠️ Aucun compte organisateur trouvé pour:', user.uid);
        setError('Aucun compte organisateur trouvé. Si vous avez des événements créés, cliquez sur "Vérifier les rôles" ci-dessous.');
        setShowRoleInitButton(true);
        await auth.signOut();
        setLoading(false);
        return;
      }

      if (organizerData.verification_status === 'pending') {
        navigate('/organizer/pending');
        return;
      }

      if (organizerData.verification_status === 'rejected') {
        setError('Votre compte a été rejeté. Veuillez contacter le support pour plus d\'informations.');
        await auth.signOut();
        setLoading(false);
        return;
      }

      if (organizerData.verification_status === 'verified' && organizerData.is_active) {
        navigate('/organizer/dashboard');
      } else {
        setError('Votre compte n\'est pas encore actif');
        await auth.signOut();
        setLoading(false);
      }
    } catch (err: any) {
      console.error('[FIREBASE] Error during login:', err);

      if (err.code === 'auth/invalid-credential') {
        setError('Email ou mot de passe incorrect. Si vous avez oublié votre mot de passe, utilisez le lien ci-dessous.');
      } else if (err.code === 'auth/user-disabled') {
        setError('Ce compte a été désactivé. Veuillez contacter le support.');
      } else {
        setError(err.message || 'Email ou mot de passe incorrect');
      }
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email || !email.includes('@')) {
      setError('Veuillez entrer votre email d\'abord');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
      setError('');
      alert('Email de réinitialisation envoyé!\n\nVérifiez votre boîte mail (et vos spams) pour réinitialiser votre mot de passe.');
    } catch (err: any) {
      console.error('[FIREBASE] Error sending password reset:', err);
      if (err.code === 'auth/user-not-found') {
        setError('Aucun compte trouvé avec cet email');
      } else {
        setError('Erreur: ' + err.message);
      }
    }
  };

  const handleVerifyOrganizers = async () => {
    setInitializingRoles(true);
    setError('');

    try {
      console.log('[ORGANIZER LOGIN] 🔧 Verifying organizers from events...');
      const result = await verifyOrganizersByEvents();

      if (result.success) {
        console.log('[ORGANIZER LOGIN] ✅ Organizers verified successfully');
        setError('');
        alert('Vérification terminée!\n\n' + result.message + '\n\nVeuillez vous reconnecter.');
        setShowRoleInitButton(false);
      } else {
        console.error('[ORGANIZER LOGIN] ❌ Failed to verify organizers:', result.message);
        setError(result.message);
      }
    } catch (err: any) {
      console.error('[ORGANIZER LOGIN] 💥 Exception during role verification:', err);
      setError('Erreur lors de la vérification des rôles: ' + err.message);
    } finally {
      setInitializingRoles(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo - Triple tap for admin access */}
        <div
          className="text-center mb-8 cursor-pointer select-none"
          onClick={handleLogoClick}
        >
          <div className="flex justify-center mb-6">
            <DynamicLogo size="xl" mode="event" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Espace Organisateur
          </h1>
          <p className="text-white/60 text-base">
            Gérez vos événements en toute simplicité
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Role Verification Button */}
          {showRoleInitButton && (
            <button
              type="button"
              onClick={handleVerifyOrganizers}
              disabled={initializingRoles}
              className="w-full mb-6 py-3 bg-[#10B981] text-white font-bold rounded-xl hover:bg-[#059669] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {initializingRoles ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Vérification en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Vérifier et corriger les rôles organisateurs
                </>
              )}
            </button>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-[52px] pl-12 pr-4 bg-[#1E293B] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#10B981]/50 focus:bg-[#1E293B] transition-all duration-200"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-[52px] pl-12 pr-14 bg-[#1E293B] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#10B981]/50 focus:bg-[#1E293B] transition-all duration-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg hover:bg-white/10 transition-all duration-200"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-white/60" />
                  ) : (
                    <Eye className="w-5 h-5 text-white/60" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={handlePasswordReset}
                className="text-sm text-[#10B981] hover:text-[#059669] transition-colors duration-200 font-medium"
              >
                Mot de passe oublié ?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[52px] bg-[#10B981] hover:bg-[#059669] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Connexion...</span>
                </>
              ) : (
                <>
                  <span>SE CONNECTER</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/5 text-white/60">ou</span>
            </div>
          </div>

          {/* Create Account Button */}
          <button
            onClick={() => navigate('/organizer/signup')}
            className="w-full h-[52px] bg-transparent border-2 border-[#10B981] text-[#10B981] hover:bg-[#10B981]/10 font-semibold rounded-xl transition-all duration-200"
          >
            Créer un compte organisateur
          </button>

          {/* Back to Home Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-white/60 hover:text-[#10B981] transition-colors duration-200"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
