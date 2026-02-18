import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/FirebaseAuthContext';
import { getDefaultRedirectForRole, UserRole } from '../lib/rolePermissions';

const AutoRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && user.role) {
      const redirectPath = getDefaultRedirectForRole(user.role as UserRole);

      console.log('[AutoRedirect] Redirecting user:', {
        email: user.email,
        role: user.role,
        redirectPath
      });

      if (redirectPath !== '/') {
        navigate(redirectPath, { replace: true });
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B]">
        <div className="w-12 h-12 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return null;
};

export default AutoRedirect;
