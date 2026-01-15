import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ThemeTokens, ThemeAssets } from "@shared/schema";

interface ThemeContextValue {
  lightTokens: ThemeTokens | null;
  darkTokens: ThemeTokens | null;
  assets: ThemeAssets | null;
  isLoading: boolean;
  isDarkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  refreshTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyThemeTokens(tokens: ThemeTokens | null, root: HTMLElement) {
  if (!tokens || !tokens.colors) return;
  
  Object.entries(tokens.colors).forEach(([key, value]) => {
    if (value && typeof value === 'string') {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(`--${cssKey}`, value);
    }
  });
  
  if (tokens.typography?.fontSans) {
    root.style.setProperty('--font-sans', tokens.typography.fontSans);
  }
  if (tokens.typography?.fontHeading) {
    root.style.setProperty('--font-heading', tokens.typography.fontHeading);
  }
  if (tokens.spacing?.radius) {
    root.style.setProperty('--radius', tokens.spacing.radius);
  }
}

function applyThemeAssets(assets: ThemeAssets | null) {
  if (!assets) return;
  
  if (assets.favicon) {
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (link) link.href = assets.favicon;
  }
}

function getStoredDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem('nymbl-dark-mode');
  if (stored !== null) return stored === 'true';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(getStoredDarkMode);
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/themes/active'],
    queryFn: async () => {
      const res = await fetch('/api/themes/active');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  
  const lightTokens = data?.lightTokens as ThemeTokens | null;
  const darkTokens = data?.darkTokens as ThemeTokens | null;
  const assets = data?.version?.assets as ThemeAssets | null;
  
  useEffect(() => {
    const root = document.documentElement;
    const tokens = isDarkMode ? darkTokens : lightTokens;
    
    if (tokens) {
      applyThemeTokens(tokens, root);
    }
    
    if (assets) {
      applyThemeAssets(assets);
    }
    
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [lightTokens, darkTokens, assets, isDarkMode]);
  
  const setDarkMode = (dark: boolean) => {
    setIsDarkMode(dark);
    localStorage.setItem('nymbl-dark-mode', String(dark));
  };
  
  const refreshTheme = () => {
    refetch();
  };
  
  return (
    <ThemeContext.Provider value={{
      lightTokens,
      darkTokens,
      assets,
      isLoading,
      isDarkMode,
      setDarkMode,
      refreshTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
