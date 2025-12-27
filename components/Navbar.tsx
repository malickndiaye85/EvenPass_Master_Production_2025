import React from 'react';
import { Ticket, Moon, Sun, LogIn, LayoutDashboard, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage }) => {
  const { isDark, toggleTheme } = useTheme();
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      onNavigate('home');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 h-20 flex items-center px-8 transition-colors">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => onNavigate('home')}
        >
          <Ticket className="text-orange-500" size={28} />
          <span className="text-2xl font-black uppercase tracking-tighter text-gray-900 dark:text-white">
            Even<span className="text-orange-500">Pass</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isDark ? (
              <Sun className="text-gray-900 dark:text-white" size={22} />
            ) : (
              <Moon className="text-gray-900 dark:text-white" size={22} />
            )}
          </button>

          {currentUser && (
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-white font-bold"
            >
              <LayoutDashboard size={20} />
              <span className="hidden md:inline">Dashboard</span>
            </button>
          )}

          {currentUser ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600 px-6 py-2 rounded-full font-bold transition-all"
            >
              <LogOut size={20} />
              <span>Déconnexion</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600 px-6 py-2 rounded-full font-bold transition-all"
            >
              <LogIn size={20} />
              <span>Espace Organisateur</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
