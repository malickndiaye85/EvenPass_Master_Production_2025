interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'default' | 'monochrome';
  className?: string;
}

export default function Logo({ size = 'md', showText = false, variant = 'default', className = '' }: LogoProps) {
  const sizes = {
    sm: { height: 'h-8' },
    md: { height: 'h-10' },
    lg: { height: 'h-12' },
    xl: { height: 'h-16' }
  };

  const sizeClasses = sizes[size];

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src="/evenpass-logo.png"
        alt="EvenPass"
        className={`${sizeClasses.height} w-auto object-contain`}
      />
    </div>
  );
}
