import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Loader2, LogOut } from 'lucide-react';
import { useAuth } from '../context/FirebaseAuthContext';
import { getDefaultRedirectForRole, UserRole } from '../lib/rolePermissions';
import { ref, get, update, set, remove } from 'firebase/database';
import { db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const getAdminUID = () => {
  if (typeof window !== 'undefined' && (window as any).ENV?.ADMIN_UID) {
    return (window as any).ENV.ADMIN_UID;
  }
  return import.meta.env.VITE_ADMIN_UID || 'Tnq8Isi0fATmidMwEuVrw1SAJkI3';
};

const UnifiedAdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signOut, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[UNIFIED LOGIN] Auth state:', { user: user?.email, role: user?.role, authLoading });

    if (!authLoading && user && user.role) {
      const isSuperAdmin = user.uid === getAdminUID();

      if (isSuperAdmin) {
        console.log('[UNIFIED LOGIN] Super Admin detected - allowing access to login page for testing');
        return;
      }

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
      if (user) {
        console.log('[UNIFIED LOGIN] User already logged in, signing out first...');
        await signOut();
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      let signInError = null;
      let accountCreated = false;

      const signInResult = await signIn(email, password);
      signInError = signInResult.error;

      if (signInError && db && auth) {
        console.log('[UNIFIED LOGIN] Sign in failed, checking for pre-registered staff account...');

        try {
          const staffRef = ref(db, 'staff');
          const staffSnapshot = await get(staffRef);

          if (staffSnapshot.exists()) {
            const staffData = staffSnapshot.val();
            const staffEntry = Object.entries(staffData).find(
              ([_, data]: [string, any]) => data.email === email
            );

            if (staffEntry) {
              const [tempStaffId, staffInfo] = staffEntry as [string, any];
              console.log('[UNIFIED LOGIN] Found pre-registered staff account');

              const userRef = ref(db, `users/${tempStaffId}`);
              const userSnapshot = await get(userRef);
              const userData = userSnapshot.val();

              if (!userData || !userData.password) {
                console.log('[UNIFIED LOGIN] Staff account found but no password set - first login detected');

                if (password.length < 6) {
                  setError('Bienvenue dans l\'équipe DEM-DEM ! Votre mot de passe doit contenir au moins 6 caractères.');
                  setLoading(false);
                  return;
                }

                console.log('[UNIFIED LOGIN] Creating Firebase Auth account with provided password...');
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const newUID = userCredential.user.uid;
                console.log('[UNIFIED LOGIN] Firebase Auth account created with UID:', newUID);

                await set(ref(db, `staff/${newUID}`), {
                  ...staffInfo,
                  id: newUID
                });

                await set(ref(db, `users/${newUID}`), {
                  ...(userData || {}),
                  email: staffInfo.email,
                  role: staffInfo.role,
                  silo: staffInfo.silo,
                  silo_id: staffInfo.silo_id,
                  password: undefined,
                  pending_activation: false,
                  first_login_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });

                await set(ref(db, `admins/${newUID}`), {
                  email: staffInfo.email,
                  role: staffInfo.role,
                  silo: staffInfo.silo,
                  silo_id: staffInfo.silo_id,
                  is_active: true,
                  pending_activation: false,
                  activated_at: new Date().toISOString(),
                  created_at: staffInfo.created_at,
                  created_by: staffInfo.created_by
                });

                await remove(ref(db, `staff/${tempStaffId}`));
                if (userData) {
                  await remove(ref(db, `users/${tempStaffId}`));
                }

                console.log('[UNIFIED LOGIN] First login setup completed successfully');
                accountCreated = true;
                signInError = null;
              } else if (userData.password === password) {
                console.log('[UNIFIED LOGIN] Password matches! Creating Firebase Auth account...');

                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const newUID = userCredential.user.uid;
                console.log('[UNIFIED LOGIN] Firebase Auth account created with UID:', newUID);

                await set(ref(db, `staff/${newUID}`), {
                  ...staffInfo,
                  id: newUID
                });

                await set(ref(db, `users/${newUID}`), {
                  ...userData,
                  password: undefined,
                  pending_activation: false,
                  updated_at: new Date().toISOString()
                });

                await set(ref(db, `admins/${newUID}`), {
                  email: staffInfo.email,
                  role: staffInfo.role,
                  silo: staffInfo.silo,
                  silo_id: staffInfo.silo_id,
                  is_active: true,
                  pending_activation: false,
                  activated_at: new Date().toISOString(),
                  created_at: staffInfo.created_at,
                  created_by: staffInfo.created_by
                });

                await remove(ref(db, `staff/${tempStaffId}`));
                await remove(ref(db, `users/${tempStaffId}`));

                console.log('[UNIFIED LOGIN] Account migration completed successfully');
                accountCreated = true;
                signInError = null;
              } else {
                console.log('[UNIFIED LOGIN] Password does not match pre-registered account');
                setError('Mot de passe incorrect pour ce compte staff');
                setLoading(false);
                return;
              }
            }
          }
        } catch (error) {
          console.error('[UNIFIED LOGIN] Error during account creation:', error);
          if ((error as any).code === 'auth/email-already-in-use') {
            setError('Un compte existe déjà avec cet email. Contactez l\'administrateur.');
          }
        }
      }

      if (signInError && !accountCreated) {
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

  const isSuperAdmin = user?.uid === import.meta.env.VITE_SUPER_ADMIN_UID;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#1A1A1B] to-[#0A0A0B] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#10B981]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#3B82F6]/5 rounded-full blur-3xl"></div>
      </div>

      {isSuperAdmin && (
        <div className="absolute top-4 right-4 z-50">
          <div className="bg-[#1A1A1B]/90 backdrop-blur-xl border border-[#10B981]/30 rounded-xl px-4 py-2 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse"></div>
              <span className="text-[#10B981] text-sm font-medium">Super Admin: {user?.email}</span>
            </div>
            <button
              onClick={async () => {
                await signOut();
                navigate('/');
              }}
              className="text-gray-400 hover:text-white transition-colors"
              title="Se déconnecter"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}

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
