import { useState, useEffect, useMemo } from "react";
import { Shell } from "@/components/layout/shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertCircle, Check, ChevronLeft, Download, Eye, Moon, Palette, Plus, RefreshCcw, Save, Sun, Trash2, Upload, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Link } from "wouter";
import type { Theme, ThemeVersion, ThemeTokens } from "@shared/schema";

interface ColorToken {
  key: string;
  label: string;
  description: string;
  category: string;
}

const COLOR_TOKENS: ColorToken[] = [
  { key: "background", label: "Background", description: "Main page background", category: "Base" },
  { key: "foreground", label: "Foreground", description: "Main text color", category: "Base" },
  { key: "card", label: "Card", description: "Card background", category: "Base" },
  { key: "cardForeground", label: "Card Text", description: "Card text color", category: "Base" },
  { key: "popover", label: "Popover", description: "Popover background", category: "Base" },
  { key: "popoverForeground", label: "Popover Text", description: "Popover text color", category: "Base" },
  { key: "primary", label: "Primary", description: "Primary action color", category: "Brand" },
  { key: "primaryForeground", label: "Primary Text", description: "Text on primary color", category: "Brand" },
  { key: "secondary", label: "Secondary", description: "Secondary elements", category: "Brand" },
  { key: "secondaryForeground", label: "Secondary Text", description: "Text on secondary", category: "Brand" },
  { key: "muted", label: "Muted", description: "Muted backgrounds", category: "Base" },
  { key: "mutedForeground", label: "Muted Text", description: "Muted text color", category: "Base" },
  { key: "accent", label: "Accent", description: "Accent highlights", category: "Brand" },
  { key: "accentForeground", label: "Accent Text", description: "Text on accent", category: "Brand" },
  { key: "destructive", label: "Destructive", description: "Danger/delete actions", category: "Semantic" },
  { key: "destructiveForeground", label: "Destructive Text", description: "Text on destructive", category: "Semantic" },
  { key: "border", label: "Border", description: "Border color", category: "Base" },
  { key: "input", label: "Input", description: "Input background", category: "Base" },
  { key: "ring", label: "Focus Ring", description: "Focus ring color", category: "Base" },
  { key: "sidebar", label: "Sidebar", description: "Sidebar background", category: "Sidebar" },
  { key: "sidebarForeground", label: "Sidebar Text", description: "Sidebar text", category: "Sidebar" },
  { key: "sidebarPrimary", label: "Sidebar Primary", description: "Active sidebar item", category: "Sidebar" },
  { key: "sidebarPrimaryForeground", label: "Sidebar Primary Text", description: "Text on active", category: "Sidebar" },
  { key: "sidebarAccent", label: "Sidebar Accent", description: "Sidebar hover", category: "Sidebar" },
  { key: "sidebarAccentForeground", label: "Sidebar Accent Text", description: "Text on hover", category: "Sidebar" },
  { key: "sidebarBorder", label: "Sidebar Border", description: "Sidebar border", category: "Sidebar" },
  { key: "sidebarRing", label: "Sidebar Ring", description: "Sidebar focus ring", category: "Sidebar" },
  { key: "chart1", label: "Chart 1", description: "First chart color", category: "Charts" },
  { key: "chart2", label: "Chart 2", description: "Second chart color", category: "Charts" },
  { key: "chart3", label: "Chart 3", description: "Third chart color", category: "Charts" },
  { key: "chart4", label: "Chart 4", description: "Fourth chart color", category: "Charts" },
  { key: "chart5", label: "Chart 5", description: "Fifth chart color", category: "Charts" },
  { key: "success", label: "Success", description: "Success messages", category: "Semantic" },
  { key: "successForeground", label: "Success Text", description: "Text on success", category: "Semantic" },
  { key: "warning", label: "Warning", description: "Warning messages", category: "Semantic" },
  { key: "warningForeground", label: "Warning Text", description: "Text on warning", category: "Semantic" },
  { key: "info", label: "Info", description: "Info messages", category: "Semantic" },
  { key: "infoForeground", label: "Info Text", description: "Text on info", category: "Semantic" },
];

function hslToHex(hsl: string): string {
  const parts = hsl.split(' ').map(p => parseFloat(p.replace('%', '')));
  const h = parts[0] || 0;
  const s = (parts[1] || 0) / 100;
  const l = (parts[2] || 0) / 100;
  
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
  const r = Math.round(hueToRgb(p, q, h / 360 + 1/3) * 255);
  const g = Math.round(hueToRgb(p, q, h / 360) * 255);
  const b = Math.round(hueToRgb(p, q, h / 360 - 1/3) * 255);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0 0% 0%";
  
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function ColorPicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const hexValue = useMemo(() => hslToHex(value || "0 0% 0%"), [value]);
  
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          type="color"
          value={hexValue}
          onChange={(e) => onChange(hexToHsl(e.target.value))}
          className="w-10 h-10 rounded cursor-pointer border border-input"
          title={label}
        />
      </div>
      <Input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="H S% L%"
        className="w-36 font-mono text-xs"
      />
    </div>
  );
}

function ThemePreview({ tokens, isDark }: { tokens: ThemeTokens; isDark: boolean }) {
  const previewStyle = useMemo(() => {
    const vars: Record<string, string> = {};
    if (tokens?.colors) {
      Object.entries(tokens.colors).forEach(([key, value]) => {
        if (value) {
          const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
          vars[`--${cssKey}`] = value;
        }
      });
    }
    return vars;
  }, [tokens]);

  return (
    <div 
      className="rounded-lg border overflow-hidden"
      style={{
        ...previewStyle,
        backgroundColor: `hsl(${tokens?.colors?.background || "0 0% 100%"})`,
        color: `hsl(${tokens?.colors?.foreground || "0 0% 0%"})`,
      }}
    >
      <div 
        className="p-4 flex items-center gap-4"
        style={{ 
          backgroundColor: `hsl(${tokens?.colors?.sidebar || "0 0% 10%"})`,
          color: `hsl(${tokens?.colors?.sidebarForeground || "0 0% 100%"})`,
        }}
      >
        <div className="font-heading font-bold">Nymbl</div>
        <div className="flex-1" />
        <div className="text-xs opacity-70">{isDark ? "Dark Mode" : "Light Mode"}</div>
      </div>
      
      <div className="p-4 space-y-4">
        <div 
          className="p-4 rounded-lg"
          style={{ 
            backgroundColor: `hsl(${tokens?.colors?.card || "0 0% 100%"})`,
            borderColor: `hsl(${tokens?.colors?.border || "0 0% 80%"})`,
            borderWidth: 1,
          }}
        >
          <h3 className="font-heading font-semibold mb-2">Sample Card</h3>
          <p 
            className="text-sm mb-3"
            style={{ color: `hsl(${tokens?.colors?.mutedForeground || "0 0% 50%"})` }}
          >
            This is sample text to preview your theme colors.
          </p>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 rounded text-sm font-medium"
              style={{ 
                backgroundColor: `hsl(${tokens?.colors?.primary || "0 0% 10%"})`,
                color: `hsl(${tokens?.colors?.primaryForeground || "0 0% 100%"})`,
              }}
            >
              Primary
            </button>
            <button
              className="px-3 py-1.5 rounded text-sm font-medium"
              style={{ 
                backgroundColor: `hsl(${tokens?.colors?.secondary || "0 0% 90%"})`,
                color: `hsl(${tokens?.colors?.secondaryForeground || "0 0% 10%"})`,
              }}
            >
              Secondary
            </button>
            <button
              className="px-3 py-1.5 rounded text-sm font-medium"
              style={{ 
                backgroundColor: `hsl(${tokens?.colors?.destructive || "0 80% 60%"})`,
                color: `hsl(${tokens?.colors?.destructiveForeground || "0 0% 100%"})`,
              }}
            >
              Destructive
            </button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <div 
            className="flex-1 p-3 rounded text-center text-sm"
            style={{ 
              backgroundColor: `hsl(${tokens?.colors?.accent || "0 0% 90%"})`,
              color: `hsl(${tokens?.colors?.accentForeground || "0 0% 10%"})`,
            }}
          >
            Accent
          </div>
          <div 
            className="flex-1 p-3 rounded text-center text-sm"
            style={{ 
              backgroundColor: `hsl(${tokens?.colors?.muted || "0 0% 95%"})`,
              color: `hsl(${tokens?.colors?.mutedForeground || "0 0% 50%"})`,
            }}
          >
            Muted
          </div>
        </div>
        
        <div className="flex gap-2">
          {[
            { key: 'chart1', label: '1' },
            { key: 'chart2', label: '2' },
            { key: 'chart3', label: '3' },
            { key: 'chart4', label: '4' },
            { key: 'chart5', label: '5' },
          ].map(({ key, label }) => (
            <div 
              key={key}
              className="flex-1 p-2 rounded text-center text-xs font-medium text-white"
              style={{ backgroundColor: `hsl(${tokens?.colors?.[key as keyof typeof tokens.colors] || "0 0% 50%"})` }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ThemeEditor({ themeId }: { themeId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');
  const [changeNotes, setChangeNotes] = useState("");
  
  const { data: themeData, isLoading } = useQuery({
    queryKey: ['/api/themes', themeId],
    queryFn: async () => {
      const res = await fetch(`/api/themes/${themeId}`);
      return res.json();
    },
  });
  
  const { data: defaults } = useQuery({
    queryKey: ['/api/themes/defaults'],
    queryFn: async () => {
      const res = await fetch('/api/themes/defaults');
      return res.json();
    },
  });
  
  const theme = themeData?.theme as Theme | undefined;
  const versions = themeData?.versions as ThemeVersion[] | undefined;
  const latestVersion = versions?.[0];
  
  const [lightTokens, setLightTokens] = useState<ThemeTokens | null>(null);
  const [darkTokens, setDarkTokens] = useState<ThemeTokens | null>(null);
  
  useEffect(() => {
    if (latestVersion) {
      setLightTokens(latestVersion.lightTokens as ThemeTokens);
      setDarkTokens(latestVersion.darkTokens as ThemeTokens);
    } else if (defaults) {
      setLightTokens(defaults.lightTokens);
      setDarkTokens(defaults.darkTokens);
    }
  }, [latestVersion, defaults]);
  
  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/themes/${themeId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lightTokens, darkTokens, changeNotes }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/themes', themeId] });
      setChangeNotes("");
      
      if (data.validation && !data.validation.isValid) {
        toast({
          title: "Saved with warnings",
          description: `${data.validation.errors.length} validation issue(s) found`,
          variant: "destructive",
        });
      } else {
        toast({ title: "Theme saved", description: "New version created" });
      }
    },
  });
  
  const publishMutation = useMutation({
    mutationFn: async (versionId: string) => {
      const res = await fetch(`/api/themes/${themeId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
      toast({ title: "Theme published", description: "Theme is now active" });
    },
  });
  
  const updateColorToken = (mode: 'light' | 'dark', key: string, value: string) => {
    if (mode === 'light' && lightTokens) {
      setLightTokens({
        ...lightTokens,
        colors: { ...lightTokens.colors, [key]: value },
      });
    } else if (mode === 'dark' && darkTokens) {
      setDarkTokens({
        ...darkTokens,
        colors: { ...darkTokens.colors, [key]: value },
      });
    }
  };
  
  const resetToDefaults = () => {
    if (defaults) {
      setLightTokens(defaults.lightTokens);
      setDarkTokens(defaults.darkTokens);
      toast({ title: "Reset to defaults" });
    }
  };
  
  const categories = useMemo(() => {
    const cats = new Map<string, ColorToken[]>();
    COLOR_TOKENS.forEach(token => {
      if (!cats.has(token.category)) cats.set(token.category, []);
      cats.get(token.category)!.push(token);
    });
    return cats;
  }, []);
  
  const currentTokens = previewMode === 'light' ? lightTokens : darkTokens;
  
  if (isLoading || !lightTokens || !darkTokens) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Link href="/admin/theme">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">{theme?.name}</h1>
            <p className="text-sm text-muted-foreground">
              Version {latestVersion?.version || 1} · {theme?.status}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              const exportData = {
                name: theme?.name,
                lightTokens,
                darkTokens,
                exportedAt: new Date().toISOString(),
              };
              const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${theme?.name?.replace(/\s+/g, '-').toLowerCase() || 'theme'}-export.json`;
              a.click();
              URL.revokeObjectURL(url);
              toast({ title: "Theme exported" });
            }}
          >
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          
          <label>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (evt) => {
                  try {
                    const data = JSON.parse(evt.target?.result as string);
                    if (data.lightTokens) setLightTokens(data.lightTokens);
                    if (data.darkTokens) setDarkTokens(data.darkTokens);
                    toast({ title: "Theme imported", description: "Review the changes and save to apply" });
                  } catch {
                    toast({ title: "Import failed", description: "Invalid JSON file", variant: "destructive" });
                  }
                };
                reader.readAsText(file);
                e.target.value = '';
              }}
            />
            <Button variant="outline" size="sm" asChild>
              <span><Upload className="h-4 w-4 mr-1" /> Import</span>
            </Button>
          </label>
          
          <Button variant="outline" size="sm" onClick={resetToDefaults}>
            <RefreshCcw className="h-4 w-4 mr-1" /> Reset
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Save className="h-4 w-4 mr-1" /> Save Draft
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Theme Version</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Change Notes (optional)</Label>
                  <Textarea
                    value={changeNotes}
                    onChange={(e) => setChangeNotes(e.target.value)}
                    placeholder="Describe your changes..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? "Saving..." : "Save Version"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {latestVersion && (
            <Button 
              size="sm" 
              onClick={() => publishMutation.mutate(latestVersion.id)}
              disabled={publishMutation.isPending}
            >
              <Check className="h-4 w-4 mr-1" /> Publish
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 border-r overflow-auto">
          <Tabs defaultValue="light" className="h-full flex flex-col">
            <div className="p-4 border-b">
              <TabsList>
                <TabsTrigger value="light" onClick={() => setPreviewMode('light')}>
                  <Sun className="h-4 w-4 mr-1" /> Light Mode
                </TabsTrigger>
                <TabsTrigger value="dark" onClick={() => setPreviewMode('dark')}>
                  <Moon className="h-4 w-4 mr-1" /> Dark Mode
                </TabsTrigger>
              </TabsList>
            </div>
            
            <ScrollArea className="flex-1">
              <TabsContent value="light" className="p-4 space-y-6 m-0">
                {Array.from(categories.entries()).map(([category, tokens]) => (
                  <div key={category}>
                    <h3 className="font-semibold text-sm mb-3">{category}</h3>
                    <div className="space-y-3">
                      {tokens.map(token => (
                        <div key={token.key} className="flex items-center justify-between gap-4">
                          <div className="min-w-[120px]">
                            <Label className="text-sm">{token.label}</Label>
                            <p className="text-xs text-muted-foreground">{token.description}</p>
                          </div>
                          <ColorPicker
                            value={lightTokens.colors[token.key as keyof typeof lightTokens.colors] || ""}
                            onChange={(v) => updateColorToken('light', token.key, v)}
                            label={token.label}
                          />
                        </div>
                      ))}
                    </div>
                    <Separator className="mt-4" />
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="dark" className="p-4 space-y-6 m-0">
                {Array.from(categories.entries()).map(([category, tokens]) => (
                  <div key={category}>
                    <h3 className="font-semibold text-sm mb-3">{category}</h3>
                    <div className="space-y-3">
                      {tokens.map(token => (
                        <div key={token.key} className="flex items-center justify-between gap-4">
                          <div className="min-w-[120px]">
                            <Label className="text-sm">{token.label}</Label>
                            <p className="text-xs text-muted-foreground">{token.description}</p>
                          </div>
                          <ColorPicker
                            value={darkTokens.colors[token.key as keyof typeof darkTokens.colors] || ""}
                            onChange={(v) => updateColorToken('dark', token.key, v)}
                            label={token.label}
                          />
                        </div>
                      ))}
                    </div>
                    <Separator className="mt-4" />
                  </div>
                ))}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
        
        <div className="w-1/2 p-4 overflow-auto bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4" /> Live Preview
            </h3>
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <Switch 
                checked={previewMode === 'dark'} 
                onCheckedChange={(checked) => setPreviewMode(checked ? 'dark' : 'light')}
              />
              <Moon className="h-4 w-4" />
            </div>
          </div>
          
          {currentTokens && (
            <ThemePreview tokens={currentTokens} isDark={previewMode === 'dark'} />
          )}
          
          {latestVersion?.validationResult && !latestVersion.validationResult.isValid && (
            <Card className="mt-4 border-amber-200 bg-amber-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
                  <AlertCircle className="h-4 w-4" /> Validation Issues
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="text-xs space-y-1 text-amber-700">
                  {latestVersion.validationResult.errors?.slice(0, 5).map((err: any, i: number) => (
                    <li key={i}>{err.field}: {err.message}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          {versions && versions.length > 1 && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="h-4 w-4" /> Version History
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {versions.slice(0, 5).map((v: ThemeVersion) => (
                    <div key={v.id} className="flex items-center justify-between text-xs">
                      <span>v{v.version} - {v.changeNotes || "No notes"}</span>
                      {v.publishedAt && <Badge variant="outline" className="text-xs">Published</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ThemeList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newThemeName, setNewThemeName] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  
  const { data: themesData, isLoading } = useQuery({
    queryKey: ['/api/themes'],
    queryFn: async () => {
      const res = await fetch('/api/themes');
      return res.json();
    },
  });
  
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newThemeName }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
      setShowCreateDialog(false);
      setNewThemeName("");
      setSelectedThemeId(data.theme.id);
      toast({ title: "Theme created" });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/themes/${id}`, { method: 'DELETE' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
      toast({ title: "Theme deleted" });
    },
  });
  
  const themes = themesData as Theme[] | undefined;
  
  if (selectedThemeId) {
    return <ThemeEditor themeId={selectedThemeId} />;
  }
  
  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Palette className="h-6 w-6" /> Theme Manager
            </h1>
            <p className="text-muted-foreground">
              Customize the look and feel of your workspace
            </p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="create-theme-btn">
                <Plus className="h-4 w-4 mr-1" /> Create Theme
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Theme</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Theme Name</Label>
                  <Input
                    value={newThemeName}
                    onChange={(e) => setNewThemeName(e.target.value)}
                    placeholder="My Custom Theme"
                    data-testid="theme-name-input"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={() => createMutation.mutate()}
                  disabled={!newThemeName || createMutation.isPending}
                  data-testid="create-theme-submit"
                >
                  {createMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {isLoading ? (
          <div className="text-center p-8 text-muted-foreground">Loading themes...</div>
        ) : !themes || themes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No themes yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first theme to customize the workspace appearance.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-1" /> Create Theme
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {themes.map((theme) => (
              <Card 
                key={theme.id} 
                className={`cursor-pointer hover:border-primary transition-colors ${theme.isActive ? 'border-primary ring-1 ring-primary' : ''}`}
                onClick={() => setSelectedThemeId(theme.id)}
                data-testid={`theme-card-${theme.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{theme.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      {theme.isActive && (
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      )}
                      <Badge variant="outline" className="capitalize">{theme.status}</Badge>
                    </div>
                  </div>
                  {theme.description && (
                    <CardDescription className="text-xs">{theme.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Created {new Date(theme.createdAt!).toLocaleDateString()}
                    </span>
                    {!theme.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(theme.id);
                        }}
                        data-testid={`delete-theme-${theme.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}

export default function ThemeManager() {
  return (
    <AuthGuard requiredRoles={["admin"]}>
      <ThemeList />
    </AuthGuard>
  );
}
