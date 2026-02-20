import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scan, Mail, Lock, AlertCircle, Eye, EyeOff, Bus } from 'lucide-react';
import { useAuth } from '../../context/FirebaseAuthContext';

const ControllerLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      navigate('/controller-epscanv');
    } catch (err: any) {
      setError('Erreur de connexion. Vérifiez vos identifiants.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#1A1A1B] to-[#0A0A0B] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-[#10B981] to-[#059669] mb-6 shadow-2xl shadow-[#10B981]/30">
            <Scan className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2">
            EPscanV
          </h1>
          <p className="text-gray-400 text-sm">
            Contrôleur Transport • DEM-DEM Express
          </p>
        </div>

        <div className="bg-[#1E1E1E] rounded-3xl p-8 shadow-2xl border border-gray-800">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Email Contrôleur
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-[#10B981] transition-colors"
                  placeholder="controleur@demdem.sn"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-14 py-3 bg-[#2A2A2A] border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-[#10B981] transition-colors"
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
              className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-[#10B981]/30 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <Bus className="w-5 h-5" />
                  Accéder au Scanner
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/voyage')}
              className="text-sm text-gray-400 hover:text-[#10B981] transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>

        <div className="mt-6 bg-[#10B981]/10 border border-[#10B981]/30 rounded-2xl p-4">
          <div className="flex items-start space-x-3">
            <Bus className="text-[#10B981] flex-shrink-0 mt-0.5" size={20} />
            <div>
              <div className="text-white font-bold text-sm mb-1">Mode Offline-First</div>
              <div className="text-gray-400 text-xs">
                Le scanner fonctionne sans connexion Internet. Les scans sont synchronisés automatiquement dès que le réseau revient.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControllerLoginPage;
