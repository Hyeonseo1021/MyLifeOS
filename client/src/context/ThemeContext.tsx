import React, { createContext, useContext, useEffect, useState } from 'react';
import { settingApi } from '../api/setting';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingApi.getSettings();
        if (data && data.theme) {
          setTheme(data.theme as Theme);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsReady(true);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    let effectiveTheme = theme;
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    root.classList.add(effectiveTheme);
    
    if (isReady) {
      settingApi.updateSettings({ theme }).catch(() => {});
    }
  }, [theme, isReady]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};