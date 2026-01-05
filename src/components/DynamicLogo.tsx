import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function DynamicLogo() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isPassUniverse = location.pathname.includes('/pass');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getLogoHeight = () => {
    if (scrolled) {
      return 'h-8 sm:h-10';
    }
    return 'h-10 sm:h-12 md:h-14';
  };

  return (
    <button
      onClick={() => navigate('/')}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative transition-all duration-500 ease-in-out hover:scale-110 ${
        isHovered ? 'filter drop-shadow-2xl' : ''
      }`}
      aria-label="Retour à l'accueil"
    >
      <div className="relative">
        <img
          src="/evenpass-logo.png"
          alt="EvenPass"
          className={`${getLogoHeight()} w-auto object-contain transition-all duration-500 ${
            isHovered ? 'brightness-110' : 'brightness-100'
          }`}
        />
        {isHovered && (
          <div className={`absolute -inset-4 rounded-2xl blur-xl opacity-60 transition-opacity duration-500 ${
            isPassUniverse
              ? 'bg-gradient-to-r from-cyan-400 to-[#0A7EA3]'
              : 'bg-gradient-to-r from-[#FF5F05] to-amber-500'
          } -z-10`}></div>
        )}
      </div>
    </button>
  );
}
