import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

interface DynamicLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  mode?: 'transport' | 'event' | 'auto';
  onClick?: () => void;
}

export default function DynamicLogo({
  className = '',
  size = 'lg',
  mode = 'auto',
  onClick
}: DynamicLogoProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();

  const isVoyageUniverse = location.pathname.includes('/voyage') ||
                           location.pathname.includes('/pass') ||
                           location.pathname.includes('/transport');

  const actualMode = mode === 'auto'
    ? (isVoyageUniverse ? 'transport' : 'event')
    : mode;

  const sizeMap = {
    sm: { text: 'text-xl', svg: 120 },
    md: { text: 'text-2xl', svg: 140 },
    lg: { text: 'text-3xl', svg: 160 },
    xl: { text: 'text-4xl md:text-5xl', svg: 200 }
  };

  const currentSize = sizeMap[size];

  const getColors = () => {
    if (actualMode === 'transport') {
      return {
        dem: '#0C1E3E',
        arrow: '#10B981',
        demSecondary: '#0C1E3E'
      };
    } else {
      if (isDark) {
        return {
          dem: '#FFFFFF',
          arrow: '#F97316',
          demSecondary: '#FFFFFF'
        };
      } else {
        return {
          dem: '#1F2937',
          arrow: '#F97316',
          demSecondary: '#1F2937'
        };
      }
    }
  };

  const colors = getColors();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/');
    }
  };

  return (
    <div
      className={`inline-flex items-center justify-center cursor-pointer hover:opacity-80 transition-all duration-300 ${className}`}
      onClick={handleClick}
    >
      <svg
        width={currentSize.svg}
        height={currentSize.svg * 0.35}
        viewBox="0 0 300 105"
        xmlns="http://www.w3.org/2000/svg"
        className="select-none"
      >
        <text
          x="10"
          y="70"
          fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
          fontSize="48"
          fontWeight="900"
          fill={colors.dem}
          className="transition-colors duration-300"
        >
          DEM
        </text>

        <g className="transition-transform duration-300 hover:scale-110" transform="translate(125, 52)">
          <path
            d="M -15 0 L 0 -8 L 0 -3 L 15 -3 L 15 3 L 0 3 L 0 8 Z"
            fill={colors.arrow}
            className="transition-colors duration-300"
          />
          <path
            d="M 15 0 L 0 8 L 0 3 L -15 3 L -15 -3 L 0 -3 L 0 -8 Z"
            fill={colors.arrow}
            className="transition-colors duration-300"
          />
        </g>

        <text
          x="175"
          y="70"
          fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
          fontSize="48"
          fontWeight="900"
          fill={colors.demSecondary}
          className="transition-colors duration-300"
        >
          DEM
        </text>
      </svg>
    </div>
  );
}
