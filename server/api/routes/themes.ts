import type { Express } from "express";
import { db } from "../../db";
import { themes, themeVersions, themeAuditLog, type ThemeTokens, type ThemeAssets } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

function getAuthUserId(req: any): string | null {
  return req.user?.id || null;
}

const DEFAULT_LIGHT_TOKENS: ThemeTokens = {
  colors: {
    background: "191 47% 98%",
    foreground: "228 61% 17%",
    card: "0 0% 100%",
    cardForeground: "228 61% 17%",
    popover: "0 0% 100%",
    popoverForeground: "228 61% 17%",
    primary: "228 61% 17%",
    primaryForeground: "0 0% 100%",
    secondary: "191 47% 93%",
    secondaryForeground: "228 61% 17%",
    muted: "210 20% 96%",
    mutedForeground: "208 22% 49%",
    accent: "211 55% 70%",
    accentForeground: "228 61% 17%",
    destructive: "355 86% 71%",
    destructiveForeground: "0 0% 100%",
    border: "211 30% 85%",
    input: "211 30% 90%",
    ring: "228 61% 17%",
    chart1: "228 61% 17%",
    chart2: "211 55% 70%",
    chart3: "177 33% 73%",
    chart4: "355 86% 71%",
    chart5: "208 22% 49%",
    sidebar: "228 61% 17%",
    sidebarForeground: "0 0% 98%",
    sidebarPrimary: "211 55% 70%",
    sidebarPrimaryForeground: "228 61% 17%",
    sidebarAccent: "228 50% 25%",
    sidebarAccentForeground: "0 0% 100%",
    sidebarBorder: "228 50% 25%",
    sidebarRing: "211 55% 70%",
    success: "142 76% 36%",
    successForeground: "0 0% 100%",
    warning: "38 92% 50%",
    warningForeground: "0 0% 100%",
    info: "199 89% 48%",
    infoForeground: "0 0% 100%",
  },
  typography: {
    fontSans: "'Raleway', sans-serif",
    fontHeading: "'Montserrat', sans-serif",
    fontMono: "'JetBrains Mono', monospace",
  },
  spacing: {
    radius: "0.5rem",
  },
};

const DEFAULT_DARK_TOKENS: ThemeTokens = {
  colors: {
    background: "228 40% 8%",
    foreground: "210 20% 98%",
    card: "228 35% 12%",
    cardForeground: "210 20% 98%",
    popover: "228 35% 12%",
    popoverForeground: "210 20% 98%",
    primary: "211 55% 70%",
    primaryForeground: "228 61% 17%",
    secondary: "228 30% 20%",
    secondaryForeground: "210 20% 98%",
    muted: "228 30% 20%",
    mutedForeground: "210 15% 70%",
    accent: "177 33% 73%",
    accentForeground: "228 61% 17%",
    destructive: "355 70% 60%",
    destructiveForeground: "210 20% 98%",
    border: "228 30% 20%",
    input: "228 30% 20%",
    ring: "211 55% 70%",
    chart1: "211 55% 70%",
    chart2: "177 33% 73%",
    chart3: "355 86% 71%",
    chart4: "208 22% 49%",
    chart5: "228 61% 17%",
    sidebar: "228 35% 10%",
    sidebarForeground: "210 20% 90%",
    sidebarPrimary: "211 55% 70%",
    sidebarPrimaryForeground: "228 61% 17%",
    sidebarAccent: "228 30% 15%",
    sidebarAccentForeground: "211 55% 70%",
    sidebarBorder: "228 30% 20%",
    sidebarRing: "211 55% 70%",
    success: "142 76% 36%",
    successForeground: "0 0% 100%",
    warning: "38 92% 50%",
    warningForeground: "0 0% 100%",
    info: "199 89% 48%",
    infoForeground: "0 0% 100%",
  },
  typography: {
    fontSans: "'Raleway', sans-serif",
    fontHeading: "'Montserrat', sans-serif",
    fontMono: "'JetBrains Mono', monospace",
  },
  spacing: {
    radius: "0.5rem",
  },
};

function calculateContrastRatio(hsl1: string, hsl2: string): number {
  const parseHSL = (hsl: string): [number, number, number] => {
    const parts = hsl.split(' ').map(p => parseFloat(p.replace('%', '')));
    return [parts[0] || 0, (parts[1] || 0) / 100, (parts[2] || 0) / 100];
  };
  
  const hslToLuminance = (h: number, s: number, l: number): number => {
    const hueToRgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = hueToRgb(p, q, h / 360 + 1/3);
    const g = hueToRgb(p, q, h / 360);
    const b = hueToRgb(p, q, h / 360 - 1/3);
    
    const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };
  
  const [h1, s1, l1] = parseHSL(hsl1);
  const [h2, s2, l2] = parseHSL(hsl2);
  
  const lum1 = hslToLuminance(h1, s1, l1);
  const lum2 = hslToLuminance(h2, s2, l2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

function validateThemeTokens(tokens: ThemeTokens): {
  isValid: boolean;
  errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }>;
  contrastIssues: Array<{ pair: string; ratio: number; required: number }>;
} {
  const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }> = [];
  const contrastIssues: Array<{ pair: string; ratio: number; required: number }> = [];
  
  const contrastPairs = [
    { bg: 'background', fg: 'foreground', required: 4.5 },
    { bg: 'card', fg: 'cardForeground', required: 4.5 },
    { bg: 'primary', fg: 'primaryForeground', required: 4.5 },
    { bg: 'secondary', fg: 'secondaryForeground', required: 4.5 },
    { bg: 'muted', fg: 'mutedForeground', required: 3 },
    { bg: 'destructive', fg: 'destructiveForeground', required: 4.5 },
    { bg: 'sidebar', fg: 'sidebarForeground', required: 4.5 },
  ];
  
  for (const pair of contrastPairs) {
    const bgColor = tokens.colors[pair.bg as keyof typeof tokens.colors];
    const fgColor = tokens.colors[pair.fg as keyof typeof tokens.colors];
    
    if (bgColor && fgColor) {
      const ratio = calculateContrastRatio(bgColor, fgColor);
      if (ratio < pair.required) {
        contrastIssues.push({
          pair: `${pair.bg}/${pair.fg}`,
          ratio: Math.round(ratio * 100) / 100,
          required: pair.required,
        });
        errors.push({
          field: `colors.${pair.fg}`,
          message: `Contrast ratio ${ratio.toFixed(2)}:1 is below WCAG ${pair.required}:1 requirement`,
          severity: ratio < 3 ? 'error' : 'warning',
        });
      }
    }
  }
  
  const hslPattern = /^\d+(\.\d+)?\s+\d+(\.\d+)?%?\s+\d+(\.\d+)?%?$/;
  for (const [key, value] of Object.entries(tokens.colors)) {
    if (value && !hslPattern.test(value)) {
      errors.push({
        field: `colors.${key}`,
        message: `Invalid HSL format. Expected "H S% L%" (e.g., "228 61% 17%")`,
        severity: 'error',
      });
    }
  }
  
  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
    contrastIssues,
  };
}

export function registerThemeRoutes(app: Express): void {
  app.get("/api/themes", async (req, res) => {
    try {
      const allThemes = await db.select().from(themes).orderBy(desc(themes.createdAt));
      res.json(allThemes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/themes/active", async (req, res) => {
    try {
      const [activeTheme] = await db.select().from(themes).where(eq(themes.isActive, true)).limit(1);
      
      if (!activeTheme || !activeTheme.activeVersionId) {
        return res.json({
          theme: null,
          version: null,
          lightTokens: DEFAULT_LIGHT_TOKENS,
          darkTokens: DEFAULT_DARK_TOKENS,
        });
      }
      
      const [version] = await db.select().from(themeVersions).where(eq(themeVersions.id, activeTheme.activeVersionId));
      
      res.json({
        theme: activeTheme,
        version,
        lightTokens: version?.lightTokens || DEFAULT_LIGHT_TOKENS,
        darkTokens: version?.darkTokens || DEFAULT_DARK_TOKENS,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/themes/defaults", async (req, res) => {
    res.json({
      lightTokens: DEFAULT_LIGHT_TOKENS,
      darkTokens: DEFAULT_DARK_TOKENS,
    });
  });

  app.get("/api/themes/:id", async (req, res) => {
    try {
      const [theme] = await db.select().from(themes).where(eq(themes.id, req.params.id));
      
      if (!theme) {
        return res.status(404).json({ error: "Theme not found" });
      }
      
      const versions = await db.select().from(themeVersions)
        .where(eq(themeVersions.themeId, theme.id))
        .orderBy(desc(themeVersions.version));
      
      res.json({ theme, versions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/themes", async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const { name, description } = req.body;
      
      const themeId = randomUUID();
      const versionId = randomUUID();
      
      const [newTheme] = await db.insert(themes).values({
        id: themeId,
        name: name || "New Theme",
        description,
        status: "draft",
        createdBy: userId,
        updatedBy: userId,
      }).returning();
      
      const [newVersion] = await db.insert(themeVersions).values({
        id: versionId,
        themeId,
        version: 1,
        lightTokens: DEFAULT_LIGHT_TOKENS,
        darkTokens: DEFAULT_DARK_TOKENS,
        createdBy: userId,
      }).returning();
      
      await db.insert(themeAuditLog).values({
        id: randomUUID(),
        themeId,
        themeVersionId: versionId,
        action: "created",
        userId,
      });
      
      res.json({ theme: newTheme, version: newVersion });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/themes/:id", async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const { name, description } = req.body;
      
      const [updated] = await db.update(themes)
        .set({
          name,
          description,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(themes.id, req.params.id))
        .returning();
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/themes/:id/versions", async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const { lightTokens, darkTokens, changeNotes } = req.body;
      
      const existingVersions = await db.select().from(themeVersions)
        .where(eq(themeVersions.themeId, req.params.id))
        .orderBy(desc(themeVersions.version));
      
      const nextVersion = (existingVersions[0]?.version || 0) + 1;
      
      const lightValidation = validateThemeTokens(lightTokens);
      const darkValidation = validateThemeTokens(darkTokens);
      
      const combinedValidation = {
        isValid: lightValidation.isValid && darkValidation.isValid,
        errors: [
          ...lightValidation.errors.map(e => ({ ...e, field: `light.${e.field}` })),
          ...darkValidation.errors.map(e => ({ ...e, field: `dark.${e.field}` })),
        ],
        contrastIssues: [
          ...lightValidation.contrastIssues.map(c => ({ ...c, pair: `light:${c.pair}` })),
          ...darkValidation.contrastIssues.map(c => ({ ...c, pair: `dark:${c.pair}` })),
        ],
      };
      
      const versionId = randomUUID();
      const [newVersion] = await db.insert(themeVersions).values({
        id: versionId,
        themeId: req.params.id,
        version: nextVersion,
        lightTokens,
        darkTokens,
        validationResult: combinedValidation,
        changeNotes,
        createdBy: userId,
      }).returning();
      
      await db.insert(themeAuditLog).values({
        id: randomUUID(),
        themeId: req.params.id,
        themeVersionId: versionId,
        action: "version_created",
        userId,
      });
      
      res.json({ version: newVersion, validation: combinedValidation });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/themes/:id/publish", async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const { versionId } = req.body;
      
      const [version] = await db.select().from(themeVersions).where(eq(themeVersions.id, versionId));
      
      if (!version) {
        return res.status(404).json({ error: "Version not found" });
      }
      
      await db.update(themes).set({ isActive: false }).where(eq(themes.isActive, true));
      
      await db.update(themeVersions)
        .set({ publishedAt: new Date(), publishedBy: userId })
        .where(eq(themeVersions.id, versionId));
      
      const [updated] = await db.update(themes)
        .set({
          status: "published",
          isActive: true,
          activeVersionId: versionId,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(themes.id, req.params.id))
        .returning();
      
      await db.insert(themeAuditLog).values({
        id: randomUUID(),
        themeId: req.params.id,
        themeVersionId: versionId,
        action: "published",
        userId,
      });
      
      res.json({ theme: updated, version });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/themes/:id/rollback", async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const { versionId } = req.body;
      
      const [version] = await db.select().from(themeVersions).where(eq(themeVersions.id, versionId));
      
      if (!version) {
        return res.status(404).json({ error: "Version not found" });
      }
      
      const [updated] = await db.update(themes)
        .set({
          activeVersionId: versionId,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(themes.id, req.params.id))
        .returning();
      
      await db.insert(themeAuditLog).values({
        id: randomUUID(),
        themeId: req.params.id,
        themeVersionId: versionId,
        action: "rolled_back",
        userId,
      });
      
      res.json({ theme: updated, version });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/themes/validate", async (req, res) => {
    try {
      const { lightTokens, darkTokens } = req.body;
      
      const lightValidation = validateThemeTokens(lightTokens);
      const darkValidation = validateThemeTokens(darkTokens);
      
      res.json({
        isValid: lightValidation.isValid && darkValidation.isValid,
        light: lightValidation,
        dark: darkValidation,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/themes/:id", async (req, res) => {
    try {
      const [theme] = await db.select().from(themes).where(eq(themes.id, req.params.id));
      
      if (!theme) {
        return res.status(404).json({ error: "Theme not found" });
      }
      
      if (theme.isActive) {
        return res.status(400).json({ error: "Cannot delete an active theme" });
      }
      
      await db.delete(themes).where(eq(themes.id, req.params.id));
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/themes/:id/audit-log", async (req, res) => {
    try {
      const logs = await db.select().from(themeAuditLog)
        .where(eq(themeAuditLog.themeId, req.params.id))
        .orderBy(desc(themeAuditLog.createdAt));
      
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
