/**
 * THEME CONTEXT DEM⇄DEM
 * Système de thèmes dynamiques basé sur les routes
 * Conforme au Master Prompt v3.1
 */

import React, { createContext, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export type Theme = 'voyage' | 'event' | 'neutral';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const DemDemThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const getThemeFromPath = (pathname: string): Theme => {
    if (
      pathname.startsWith('/voyage') ||
      pathname.startsWith('/pass') ||
      pathname.startsWith('/allo-dakar') ||
      pathname.startsWith('/express') ||
      pathname.startsWith('/ferry') ||
      pathname.startsWith('/conducteur') ||
      pathname.startsWith('/wallet')
    ) {
      return 'voyage';
    }

    if (
      pathname.startsWith('/even') ||
      pathname.startsWith('/organizer') ||
      pathname.startsWith('/event')
    ) {
      return 'event';
    }

    return 'neutral';
  };

  const theme = getThemeFromPath(location.pathname);
  const isDark = theme === 'event';

  useEffect(() => {
    const html = document.documentElement;

    html.setAttribute('data-theme', theme);

    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    console.log(`[DemDemTheme] Theme actif: ${theme} (pathname: ${location.pathname})`);
  }, [theme, isDark, location.pathname]);

  return (
    <ThemeContext.Provider value={{ theme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useDemDemTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useDemDemTheme doit être utilisé dans DemDemThemeProvider');
  }
  return context;
};

export function useThemeColors() {
  const { theme } = useDemDemTheme();

  const colors = {
    voyage: {
      primary: '#0A1628',
      secondary: '#10B981',
      bg: '#F8FAFC',
      accent: '#0EA5E9',
      muted: '#64748B',
    },
    event: {
      primary: '#FF6B00',
      secondary: '#1A1A1A',
      bg: '#FFFFFF',
      accent: '#FF8C42',
      muted: '#6B7280',
    },
    neutral: {
      primary: '#0A1628',
      secondary: '#10B981',
      bg: '#FFFFFF',
      accent: '#0EA5E9',
      muted: '#6B7280',
    },
  };

  return colors[theme];
}
