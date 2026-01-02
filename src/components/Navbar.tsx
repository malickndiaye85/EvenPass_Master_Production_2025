import React from 'react';
import { Moon, Sun, LogIn, LayoutDashboard, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

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
          className="cursor-pointer flex flex-col"
          onClick={() => onNavigate('home')}
        >
          <Logo size="md" variant="default" />
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-wide -mt-1 ml-1">
            Digital Ticketing & Access Control
          </p>
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
