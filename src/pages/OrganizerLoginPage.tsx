import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, db } from '../firebase';
import Logo from '../components/Logo';

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
        setError('Aucun compte organisateur trouvé pour cet email');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo - Triple tap for admin access */}
        <div
          className="text-center mb-8 cursor-pointer select-none"
          onClick={handleLogoClick}
        >
          <div className="flex justify-center mb-6">
            <Logo size="xl" showText={true} forceMode="event" />
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">
            Espace Organisateur
          </h1>
          <p className="text-[#6B7280] text-base">
            Gérez vos événements en toute simplicité
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-[52px] pl-12 pr-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF6B00] focus:bg-white transition-all duration-200"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-[52px] pl-12 pr-14 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF6B00] focus:bg-white transition-all duration-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 transition-all duration-200"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-[#6B7280]" />
                  ) : (
                    <Eye className="w-5 h-5 text-[#6B7280]" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={handlePasswordReset}
                className="text-sm text-[#FF6B00] hover:text-[#FF8533] transition-colors duration-200 font-medium"
              >
                Mot de passe oublié ?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[52px] bg-[#FF6B00] hover:bg-[#FF8533] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              <div className="w-full border-t border-[#E5E7EB]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-[#6B7280]">ou</span>
            </div>
          </div>

          {/* Create Account Button */}
          <button
            onClick={() => navigate('/organizer/signup')}
            className="w-full h-[52px] bg-transparent border-2 border-[#FF6B00] text-[#FF6B00] hover:bg-[#FF6B00]/5 font-semibold rounded-xl transition-all duration-200"
          >
            Créer un compte organisateur
          </button>

          {/* Back to Home Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-[#6B7280] hover:text-[#FF6B00] transition-colors duration-200"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
