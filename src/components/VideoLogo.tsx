/**
 * VIDEO LOGO DEM⇄DEM
 * Logo dynamique en vidéo MP4 avec fallback couleur
 * Consignes strictes: Ignore filigrane, crop si nécessaire
 */

import React from 'react';
import { useDemDemTheme } from '../contexts/DemDemThemeContext';

interface VideoLogoProps {
  height?: number;
  className?: string;
}

export const VideoLogo: React.FC<VideoLogoProps> = ({
  height = 80,
  className = ''
}) => {
  const { theme } = useDemDemTheme();

  const fallbackColor = theme === 'event' ? '#FF6B00' : '#0A1628';

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ height: `${height}px`, width: '100%' }}
    >
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          objectPosition: 'center',
          objectFit: 'cover',
        }}
      >
        <source src="/assets/logo_demdem_dynamic.mp4" type="video/mp4" />
      </video>

      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundColor: fallbackColor
        }}
      />
    </div>
  );
};
