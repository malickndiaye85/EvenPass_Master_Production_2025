interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'default' | 'monochrome';
  className?: string;
}

export default function Logo({ size = 'md', showText = true, variant = 'default', className = '' }: LogoProps) {
  const sizes = {
    sm: { container: 'w-8 h-8', text: 'text-lg', icon: 'w-4 h-4' },
    md: { container: 'w-12 h-12', text: 'text-2xl', icon: 'w-6 h-6' },
    lg: { container: 'w-16 h-16', text: 'text-3xl', icon: 'w-8 h-8' },
    xl: { container: 'w-20 h-20', text: 'text-4xl', icon: 'w-10 h-10' }
  };

  const sizeClasses = sizes[size];

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="relative group">
        <div className={`${sizeClasses.container} relative rounded-lg flex items-center justify-center ${
          variant === 'monochrome'
            ? 'bg-black border-2 border-black'
            : 'bg-black'
        } shadow-2xl group-hover:shadow-[#FF5F05]/30 transition-all duration-300`}>
          <svg
            className={sizeClasses.icon}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="4" y="4" width="6" height="6" fill={variant === 'monochrome' ? 'white' : '#FF5F05'} />
            <rect x="14" y="4" width="6" height="6" fill={variant === 'monochrome' ? 'white' : '#FF5F05'} />
            <rect x="4" y="14" width="6" height="6" fill={variant === 'monochrome' ? 'white' : '#FF5F05'} />
            <rect x="14" y="14" width="6" height="6" fill="white" />
            <rect x="9" y="9" width="6" height="6" fill="white" />
          </svg>
        </div>
        {variant === 'default' && (
          <div className="absolute -inset-1 bg-gradient-to-br from-[#FF5F05] to-[#FF8C42] rounded-lg blur opacity-20 group-hover:opacity-40 transition-opacity -z-10"></div>
        )}
      </div>
      {showText && (
        <div className={`${sizeClasses.text} font-black tracking-tighter leading-none flex items-center`}>
          <span className={variant === 'monochrome' ? 'text-white' : 'text-[#FF5F05]'}>
            Even
          </span>
          <span className={variant === 'monochrome' ? 'text-white' : 'text-black'}>
            Pass
          </span>
        </div>
      )}
    </div>
  );
}
