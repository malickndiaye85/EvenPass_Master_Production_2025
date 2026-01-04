import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import DynamicLogo from './DynamicLogo';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 h-20 flex items-center px-8 transition-colors">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        <DynamicLogo />

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
      </div>
    </nav>
  );
};

export default Navbar;
