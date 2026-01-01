import { Sparkles } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'light' | 'dark';
  className?: string;
}

export default function Logo({ size = 'md', showText = true, variant = 'light', className = '' }: LogoProps) {
  const sizes = {
    sm: { icon: 'w-8 h-8', text: 'text-lg' },
    md: { icon: 'w-12 h-12', text: 'text-2xl' },
    lg: { icon: 'w-16 h-16', text: 'text-3xl' }
  };

  const sizeClasses = sizes[size];

  return (
    <div className={`flex items-center space-x-3 group ${className}`}>
      <div className="relative">
        <div className={`absolute -inset-0.5 rounded-2xl blur opacity-70 group-hover:opacity-100 transition ${
          variant === 'dark' ? 'bg-gradient-to-r from-amber-600 to-orange-600' : 'bg-gradient-to-r from-orange-400 to-pink-500'
        }`}></div>
        <div className={`relative ${sizeClasses.icon} rounded-2xl flex items-center justify-center ${
          variant === 'dark'
            ? 'bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700'
            : 'bg-gradient-to-br from-orange-400 via-red-500 to-pink-500'
        }`}>
          <Sparkles className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'} text-white`} />
        </div>
      </div>
      {showText && (
        <h1 className={`${sizeClasses.text} font-black tracking-tight ${
          variant === 'dark'
            ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 bg-clip-text text-transparent'
            : 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 bg-clip-text text-transparent'
        }`}>
          EvenPass
        </h1>
      )}
    </div>
  );
}
