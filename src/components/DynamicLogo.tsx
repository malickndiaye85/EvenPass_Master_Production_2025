import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function DynamicLogo() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [hoveredPart, setHoveredPart] = useState<'even' | 'pass' | null>(null);

  const isPassUniverse = location.pathname.includes('/pass');
  const isEvenUniverse = !isPassUniverse;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getLogoSize = () => {
    if (scrolled) {
      return 'text-3xl sm:text-4xl';
    }
    return 'text-4xl sm:text-5xl md:text-6xl';
  };

  return (
    <button
      onClick={() => navigate('/')}
      className={`group transition-all duration-300 ease-in-out ${getLogoSize()} font-black flex items-center justify-center gap-0 hover:scale-105`}
      aria-label="Retour à l'accueil"
    >
      <span
        onMouseEnter={() => setHoveredPart('even')}
        onMouseLeave={() => setHoveredPart(null)}
        className={`transition-all duration-300 ease-in-out ${
          hoveredPart === 'even' ? 'scale-110' : 'scale-100'
        } ${
          isEvenUniverse || hoveredPart === 'even'
            ? isDark
              ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 bg-clip-text text-transparent'
              : 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 bg-clip-text text-transparent'
            : isDark
              ? 'text-amber-500/40'
              : 'text-orange-400/40'
        }`}
      >
        Even
      </span>
      <span
        onMouseEnter={() => setHoveredPart('pass')}
        onMouseLeave={() => setHoveredPart(null)}
        className={`transition-all duration-300 ease-in-out ${
          hoveredPart === 'pass' ? 'scale-110' : 'scale-100'
        } ${
          isPassUniverse || hoveredPart === 'pass'
            ? isDark
              ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-600 bg-clip-text text-transparent'
              : 'bg-gradient-to-r from-[#0A7EA3] via-cyan-500 to-blue-600 bg-clip-text text-transparent'
            : isDark
              ? 'text-cyan-500/40'
              : 'text-cyan-400/40'
        }`}
      >
        Pass
      </span>
    </button>
  );
}
