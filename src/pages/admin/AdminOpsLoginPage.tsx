import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, Eye, EyeOff, Activity } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, database } from '../../firebase';
import { ref, get } from 'firebase/database';
import DynamicLogo from '../../components/DynamicLogo';

export default function AdminOpsLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = ref(database, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        setError('Compte non trouvé dans la base de données');
        await auth.signOut();
        setLoading(false);
        return;
      }

      const userData = snapshot.val();
      const userRole = userData.role || '';

      if (userRole !== 'ops_event' && userRole !== 'super_admin') {
        setError('Accès refusé. Rôle OPS Events requis.');
        await auth.signOut();
        setLoading(false);
        return;
      }

      console.log('[OPS Login] ✅ Authentification réussie:', userRole);

      navigate('/admin/ops-events');
    } catch (err: any) {
      console.error('[OPS Login] ❌ Erreur:', err);

      switch (err.code) {
        case 'auth/invalid-email':
          setError('Email invalide');
          break;
        case 'auth/user-not-found':
          setError('Utilisateur non trouvé');
          break;
        case 'auth/wrong-password':
          setError('Mot de passe incorrect');
          break;
        case 'auth/invalid-credential':
          setError('Identifiants invalides');
          break;
        case 'auth/too-many-requests':
          setError('Trop de tentatives. Réessayez plus tard.');
          break;
        default:
          setError('Erreur de connexion. Vérifiez vos identifiants.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <DynamicLogo size="lg" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Activity className="w-6 h-6 text-orange-500" />
            <h1 className="text-2xl font-bold text-white">OPS Manager Events</h1>
          </div>
          <p className="text-zinc-400">Accès réservé aux opérateurs</p>
        </div>

        {/* Login Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg pl-12 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  placeholder="ops@demdem.sn"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg pl-12 pr-12 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 disabled:from-zinc-700 disabled:to-zinc-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-orange-500/50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Connexion OPS
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-6 border-t border-zinc-800">
            <div className="flex items-start gap-2 text-xs text-zinc-500">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>
                Accès sécurisé réservé au personnel OPS Events autorisé.
                Toutes les connexions sont enregistrées et surveillées.
              </p>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/for-organizers')}
            className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
          >
            ← Retour à l'accueil
          </button>
        </div>
      </div>

      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
    </div>
  );
}
