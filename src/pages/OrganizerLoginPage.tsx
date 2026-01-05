import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Ticket, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, db } from '../firebase';

export default function OrganizerLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

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
      alert('⚠️ Veuillez entrer votre email d\'abord');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
      alert('✅ Email de réinitialisation envoyé!\n\nVérifiez votre boîte mail (et vos spams) pour réinitialiser votre mot de passe.');
    } catch (err: any) {
      console.error('[FIREBASE] Error sending password reset:', err);
      if (err.code === 'auth/user-not-found') {
        alert('❌ Aucun compte trouvé avec cet email');
      } else {
        alert('❌ Erreur: ' + err.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#FF7A00] mb-6 shadow-2xl shadow-[#FF7A00]/30">
            <Ticket className="w-10 h-10 text-[#0F0F0F]" />
          </div>
          <h1 className="text-4xl font-black text-[#FFFFFF] mb-2">
            Espace Organisateur
          </h1>
          <p className="text-[#B5B5B5]">
            Connectez-vous pour gérer vos événements
          </p>
        </div>

        <div className="bg-[#2A2A2A] rounded-3xl p-8 shadow-2xl border border-[#2A2A2A]">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#FFFFFF] mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#B5B5B5]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-2xl text-[#FFFFFF] placeholder-[#B5B5B5] focus:outline-none focus:border-[#FF7A00] transition-colors"
                  placeholder="votre@email.com"
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
                  className={`w-full pl-12 pr-14 py-3 border border-[#2A2A2A] rounded-2xl text-[#FFFFFF] placeholder-[#B5B5B5] focus:outline-none focus:border-[#FF7A00] transition-all ${
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

            <div className="text-right">
              <button
                type="button"
                onClick={handlePasswordReset}
                className="text-sm text-[#FF7A00] hover:text-[#FF8C42] transition-colors underline"
              >
                Mot de passe oublié ?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-[#0F0F0F] font-black py-4 rounded-2xl transition-all shadow-lg shadow-[#FF7A00]/30 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-3 border-[#0F0F0F] border-t-transparent rounded-full animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Se connecter
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <div className="border-t border-[#2A2A2A] pt-6">
              <p className="text-[#B5B5B5] mb-4 text-lg">
                Pas encore organisateur ?
              </p>
              <button
                onClick={() => navigate('/organizer/signup')}
                className="w-full px-8 py-4 bg-gradient-to-r from-[#FF5F05] to-[#FF8C42] hover:from-[#FF7A00] hover:to-[#FFA05D] text-white rounded-2xl font-black text-lg transition-all shadow-lg shadow-[#FF5F05]/30 hover:scale-[1.02]"
              >
                Créer un compte organisateur
              </button>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-[#B5B5B5] hover:text-[#FF7A00] transition-colors block w-full pt-4"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
