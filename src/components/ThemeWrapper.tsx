import { useEffect } from 'react';
import { useTheme, AppMode } from '../context/ThemeContext';

interface ThemeWrapperProps {
  mode: AppMode;
  children: React.ReactNode;
}

export default function ThemeWrapper({ mode, children }: ThemeWrapperProps) {
  const { setMode } = useTheme();

  useEffect(() => {
    setMode(mode);
  }, [mode, setMode]);

  return <>{children}</>;
}
