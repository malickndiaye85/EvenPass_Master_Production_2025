import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Ticket, Mail, Lock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function OrganizerLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Connexion avec Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erreur de connexion');

      // 2. Récupérer le profil organisateur
      const { data: organizerData, error: organizerError } = await supabase
        .from('organizers')
        .select('*, users(*)')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      if (organizerError) throw organizerError;

      // 3. Vérifier si l'utilisateur est un organisateur
      if (!organizerData) {
        setError('Aucun compte organisateur trouvé pour cet email');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // 4. Vérifier le statut de vérification
      if (organizerData.verification_status === 'pending') {
        // Compte en attente de vérification
        navigate('/organizer/pending');
        return;
      }

      if (organizerData.verification_status === 'rejected') {
        setError('Votre compte a été rejeté. Veuillez contacter le support pour plus d\'informations.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (organizerData.verification_status === 'verified' && organizerData.is_active) {
        // Compte vérifié et actif
        navigate('/organizer/dashboard');
      } else {
        setError('Votre compte n\'est pas encore actif');
        await supabase.auth.signOut();
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error during login:', err);
      setError(err.message || 'Email ou mot de passe incorrect');
      setLoading(false);
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
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-2xl text-[#FFFFFF] placeholder-[#B5B5B5] focus:outline-none focus:border-[#FF7A00] transition-colors"
                  placeholder="••••••••"
                />
              </div>
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

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-[#B5B5B5]">
              Pas encore organisateur ?{' '}
              <button
                onClick={() => navigate('/organizer/signup')}
                className="text-[#FF7A00] hover:underline font-bold"
              >
                Créer un compte
              </button>
            </p>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-[#B5B5B5] hover:text-[#FF7A00] transition-colors block w-full"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
