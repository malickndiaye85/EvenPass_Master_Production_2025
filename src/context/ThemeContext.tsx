import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppMode = 'transport' | 'event';

interface ThemeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
}

const TRANSPORT_THEME = {
  primary: '#0A192F',
  secondary: '#10B981',
  background: '#F8FAFC',
  text: '#1E293B',
  accent: '#10B981'
};

const EVENT_THEME = {
  primary: '#000000',
  secondary: '#FF6B00',
  background: '#000000',
  text: '#FFFFFF',
  accent: '#FF6B00'
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<AppMode>(() => {
    const saved = localStorage.getItem('demdem-mode');
    return (saved === 'transport' || saved === 'event') ? saved : 'event';
  });

  const colors = mode === 'transport' ? TRANSPORT_THEME : EVENT_THEME;

  useEffect(() => {
    localStorage.setItem('demdem-mode', mode);

    document.documentElement.style.setProperty('--color-primary', colors.primary);
    document.documentElement.style.setProperty('--color-secondary', colors.secondary);
    document.documentElement.style.setProperty('--color-background', colors.background);
    document.documentElement.style.setProperty('--color-text', colors.text);
    document.documentElement.style.setProperty('--color-accent', colors.accent);

    if (mode === 'event') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode, colors]);

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, setMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
