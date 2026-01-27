"use client";

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type DesignTheme = 'default' | 'bloomberg' | 'editorial' | 'calm';

interface DesignThemeContextType {
  designTheme: DesignTheme;
  setDesignTheme: (theme: DesignTheme) => void;
}

const DesignThemeContext = createContext<DesignThemeContextType | undefined>(undefined);

export function useDesignTheme() {
  const context = useContext(DesignThemeContext);
  if (!context) {
    throw new Error('useDesignTheme must be used within a DesignThemeProvider');
  }
  return context;
}

interface DesignThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: DesignTheme;
}

export function DesignThemeProvider({
  children,
  defaultTheme = 'bloomberg'
}: DesignThemeProviderProps) {
  const [designTheme, setDesignThemeState] = useState<DesignTheme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  const applyDesignTheme = useCallback((theme: DesignTheme) => {
    const root = document.documentElement;

    // Remove all design theme attributes
    root.removeAttribute('data-design-theme');

    // Apply new theme if not default
    if (theme !== 'default') {
      root.setAttribute('data-design-theme', theme);
    }
  }, []);

  const setDesignTheme = useCallback((newTheme: DesignTheme) => {
    setDesignThemeState(newTheme);
    localStorage.setItem('design-theme', newTheme);
    applyDesignTheme(newTheme);
  }, [applyDesignTheme]);

  // Initial load
  useEffect(() => {
    const savedTheme = localStorage.getItem('design-theme') as DesignTheme | null;
    const initialTheme = savedTheme ?? defaultTheme;
    setDesignThemeState(initialTheme);
    applyDesignTheme(initialTheme);
    setMounted(true);
  }, [defaultTheme, applyDesignTheme]);

  const value = {
    designTheme,
    setDesignTheme,
  };

  return (
    <DesignThemeContext.Provider value={value}>
      {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
    </DesignThemeContext.Provider>
  );
}
