import { useTheme } from '../context/ThemeContext';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  forceMode?: 'transport' | 'event';
}

export default function Logo({ size = 'md', showText = true, className = '', forceMode }: LogoProps) {
  const { mode } = useTheme();
  const activeMode = forceMode || mode;

  const sizes = {
    sm: { height: 'h-8', text: 'text-lg' },
    md: { height: 'h-12', text: 'text-2xl' },
    lg: { height: 'h-16', text: 'text-3xl' },
    xl: { height: 'h-20', text: 'text-4xl' }
  };

  const sizeClasses = sizes[size];

  const logoFilter = activeMode === 'event'
    ? 'brightness(0) invert(1)'
    : 'none';

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <img
        src="/assets/logo-demdem.svg"
        alt="DemDem"
        className={`${sizeClasses.height} w-auto object-contain transition-all duration-300`}
        style={{ filter: logoFilter }}
      />
      {showText && (
        <div className={`${sizeClasses.text} font-black tracking-tight leading-none`}>
          <span className={activeMode === 'transport' ? 'text-[#0A192F]' : 'text-white'}>
            Dem
          </span>
          <span className={activeMode === 'transport' ? 'text-[#10B981]' : 'text-[#FF6B00]'}>
            Dem
          </span>
        </div>
      )}
    </div>
  );
}
