import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Theme, ThemeTokens } from "@shared/schema";

interface ThemeContextType {
  themes: Theme[];
  activeTheme: Theme | null;
  isDark: boolean;
  isLoading: boolean;
  setTheme: (themeId: string) => void;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "nymbl-theme-id";
const DARK_MODE_STORAGE_KEY = "nymbl-dark-mode";

function applyThemeTokens(tokens: ThemeTokens, isDark: boolean) {
  const root = document.documentElement;
  const colors = tokens.colors;
  
  const colorMap: Record<string, string> = {
    background: colors.background,
    foreground: colors.foreground,
    card: colors.card,
    "card-foreground": colors.cardForeground,
    popover: colors.popover,
    "popover-foreground": colors.popoverForeground,
    primary: colors.primary,
    "primary-foreground": colors.primaryForeground,
    secondary: colors.secondary,
    "secondary-foreground": colors.secondaryForeground,
    muted: colors.muted,
    "muted-foreground": colors.mutedForeground,
    accent: colors.accent,
    "accent-foreground": colors.accentForeground,
    destructive: colors.destructive,
    "destructive-foreground": colors.destructiveForeground,
    border: colors.border,
    input: colors.input,
    ring: colors.ring,
    "chart-1": colors.chart1,
    "chart-2": colors.chart2,
    "chart-3": colors.chart3,
    "chart-4": colors.chart4,
    "chart-5": colors.chart5,
    sidebar: colors.sidebar,
    "sidebar-foreground": colors.sidebarForeground,
    "sidebar-primary": colors.sidebarPrimary,
    "sidebar-primary-foreground": colors.sidebarPrimaryForeground,
    "sidebar-accent": colors.sidebarAccent,
    "sidebar-accent-foreground": colors.sidebarAccentForeground,
    "sidebar-border": colors.sidebarBorder,
    "sidebar-ring": colors.sidebarRing,
  };

  Object.entries(colorMap).forEach(([key, value]) => {
    if (value) {
      root.style.setProperty(`--${key}`, value);
    }
  });

  if (tokens.spacing?.radius) {
    root.style.setProperty("--radius", tokens.spacing.radius);
  }

  if (tokens.typography) {
    if (tokens.typography.fontSans) {
      root.style.setProperty("--font-sans", tokens.typography.fontSans);
    }
    if (tokens.typography.fontHeading) {
      root.style.setProperty("--font-heading", tokens.typography.fontHeading);
    }
    if (tokens.typography.fontMono) {
      root.style.setProperty("--font-mono", tokens.typography.fontMono);
    }
  }

  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(() => {
    return localStorage.getItem(THEME_STORAGE_KEY);
  });
  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = localStorage.getItem(DARK_MODE_STORAGE_KEY);
    if (stored !== null) {
      return stored === "true";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const { data: themes = [], isLoading: themesLoading } = useQuery<Theme[]>({
    queryKey: ["/api/admin/themes"],
    queryFn: async () => {
      const res = await fetch("/api/admin/themes", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const publishedThemes = themes.filter(t => t.status === "published");

  const activeTheme = React.useMemo(() => {
    if (selectedThemeId) {
      const selected = publishedThemes.find(t => t.id === selectedThemeId);
      if (selected) return selected;
    }
    return publishedThemes.find(t => t.isDefault) || publishedThemes[0] || null;
  }, [selectedThemeId, publishedThemes]);

  useEffect(() => {
    if (activeTheme) {
      const tokens = isDark ? activeTheme.darkTokens : activeTheme.lightTokens;
      applyThemeTokens(tokens, isDark);
    }
  }, [activeTheme, isDark]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem(DARK_MODE_STORAGE_KEY);
      if (stored === null) {
        setIsDark(e.matches);
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const setTheme = useCallback((themeId: string) => {
    setSelectedThemeId(themeId);
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDark(prev => {
      const newValue = !prev;
      localStorage.setItem(DARK_MODE_STORAGE_KEY, String(newValue));
      return newValue;
    });
  }, []);

  const setDarkModeValue = useCallback((value: boolean) => {
    setIsDark(value);
    localStorage.setItem(DARK_MODE_STORAGE_KEY, String(value));
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        themes: publishedThemes,
        activeTheme,
        isDark,
        isLoading: themesLoading,
        setTheme,
        toggleDarkMode,
        setDarkMode: setDarkModeValue,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
