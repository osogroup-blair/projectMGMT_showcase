import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Palette, 
  Check, 
  Star, 
  Upload, 
  Download, 
  Copy, 
  Trash2, 
  Edit,
  Eye,
  Sun,
  Moon,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Theme, ThemeTokens, ThemeExportFormat } from "@shared/schema";

interface AdminThemesContentProps {
  embedded?: boolean;
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

const COLOR_GROUPS = [
  { label: "Base", keys: ["background", "foreground", "card", "cardForeground", "popover", "popoverForeground"] },
  { label: "Primary & Secondary", keys: ["primary", "primaryForeground", "secondary", "secondaryForeground"] },
  { label: "Muted & Accent", keys: ["muted", "mutedForeground", "accent", "accentForeground"] },
  { label: "States", keys: ["destructive", "destructiveForeground", "success", "successForeground", "warning", "warningForeground", "info", "infoForeground"] },
  { label: "Inputs & Borders", keys: ["border", "input", "ring"] },
  { label: "Charts", keys: ["chart1", "chart2", "chart3", "chart4", "chart5"] },
  { label: "Sidebar", keys: ["sidebar", "sidebarForeground", "sidebarPrimary", "sidebarPrimaryForeground", "sidebarAccent", "sidebarAccentForeground", "sidebarBorder", "sidebarRing"] },
];

function hslToHex(hsl: string): string {
  const parts = hsl.split(" ");
  if (parts.length !== 3) return "#888888";
  const h = parseFloat(parts[0]) || 0;
  const s = parseFloat(parts[1]) / 100 || 0;
  const l = parseFloat(parts[2]) / 100 || 0;
  
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0 0% 50%";
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
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

function ColorEditor({ 
  colorKey, 
  value, 
  onChange 
}: { 
  colorKey: string; 
  value: string; 
  onChange: (key: string, value: string) => void;
}) {
  const hexValue = hslToHex(value);
  
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div 
        className="w-8 h-8 rounded border shrink-0 cursor-pointer"
        style={{ backgroundColor: `hsl(${value})` }}
      />
      <input
        type="color"
        value={hexValue}
        onChange={(e) => onChange(colorKey, hexToHsl(e.target.value))}
        className="sr-only"
        id={`color-${colorKey}`}
      />
      <label 
        htmlFor={`color-${colorKey}`}
        className="flex-1 text-sm cursor-pointer hover:text-primary"
      >
        {colorKey.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}
      </label>
      <Input
        value={value}
        onChange={(e) => onChange(colorKey, e.target.value)}
        className="w-32 h-7 text-xs font-mono"
        data-testid={`input-color-${colorKey}`}
      />
    </div>
  );
}

function ThemeEditor({ 
  theme, 
  onSave, 
  onClose,
  isCreating = false,
}: { 
  theme: Theme | null;
  onSave: (data: { name: string; description: string; lightTokens: ThemeTokens; darkTokens: ThemeTokens }) => void;
  onClose: () => void;
  isCreating?: boolean;
}) {
  const [name, setName] = useState(theme?.name || "New Theme");
  const [description, setDescription] = useState(theme?.description || "");
  const [lightTokens, setLightTokens] = useState<ThemeTokens>(
    theme?.lightTokens || DEFAULT_LIGHT_TOKENS
  );
  const [darkTokens, setDarkTokens] = useState<ThemeTokens>(
    theme?.darkTokens || DEFAULT_DARK_TOKENS
  );
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");
  const [activeSection, setActiveSection] = useState("colors");
  
  const currentTokens = previewMode === "light" ? lightTokens : darkTokens;
  const setCurrentTokens = previewMode === "light" ? setLightTokens : setDarkTokens;
  
  const handleColorChange = (key: string, value: string) => {
    setCurrentTokens({
      ...currentTokens,
      colors: { ...currentTokens.colors, [key]: value },
    });
  };
  
  const handleTypographyChange = (key: string, value: string) => {
    setCurrentTokens({
      ...currentTokens,
      typography: { ...currentTokens.typography, [key]: value },
    });
  };
  
  const handleSpacingChange = (key: string, value: string) => {
    setCurrentTokens({
      ...currentTokens,
      spacing: { ...currentTokens.spacing, [key]: value },
    });
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="space-y-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-xl font-bold border-0 p-0 h-auto focus-visible:ring-0"
            placeholder="Theme Name"
            data-testid="input-theme-name"
          />
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-sm text-muted-foreground border-0 p-0 h-auto focus-visible:ring-0"
            placeholder="Description"
            data-testid="input-theme-description"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-0.5">
            <Button
              variant={previewMode === "light" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setPreviewMode("light")}
              className="h-7 px-2"
            >
              <Sun className="h-4 w-4 mr-1" />
              Light
            </Button>
            <Button
              variant={previewMode === "dark" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setPreviewMode("dark")}
              className="h-7 px-2"
            >
              <Moon className="h-4 w-4 mr-1" />
              Dark
            </Button>
          </div>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-theme">
            Cancel
          </Button>
          <Button onClick={() => onSave({ name, description, lightTokens, darkTokens })} data-testid="button-save-theme">
            {isCreating ? "Create" : "Save"}
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 border-r bg-muted/30">
          <Tabs value={activeSection} onValueChange={setActiveSection} className="h-full flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b px-2 h-auto py-1">
              <TabsTrigger value="colors" className="text-xs">Colors</TabsTrigger>
              <TabsTrigger value="typography" className="text-xs">Typography</TabsTrigger>
              <TabsTrigger value="spacing" className="text-xs">Spacing</TabsTrigger>
            </TabsList>
            
            <ScrollArea className="flex-1">
              <TabsContent value="colors" className="m-0 p-3">
                {COLOR_GROUPS.map((group) => (
                  <div key={group.label} className="mb-4">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                      {group.label}
                    </h4>
                    <div className="space-y-0.5">
                      {group.keys.map((key) => (
                        <ColorEditor
                          key={key}
                          colorKey={key}
                          value={(currentTokens.colors as unknown as Record<string, string>)[key] || "0 0% 50%"}
                          onChange={handleColorChange}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="typography" className="m-0 p-3 space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Sans Font</Label>
                  <Input
                    value={currentTokens.typography.fontSans}
                    onChange={(e) => handleTypographyChange("fontSans", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Heading Font</Label>
                  <Input
                    value={currentTokens.typography.fontHeading}
                    onChange={(e) => handleTypographyChange("fontHeading", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Mono Font</Label>
                  <Input
                    value={currentTokens.typography.fontMono}
                    onChange={(e) => handleTypographyChange("fontMono", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="spacing" className="m-0 p-3 space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Border Radius</Label>
                  <Input
                    value={currentTokens.spacing.radius}
                    onChange={(e) => handleSpacingChange("radius", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
        
        <div className="flex-1 p-6 overflow-auto">
          <div 
            className="rounded-lg border p-6 space-y-6"
            style={{
              backgroundColor: `hsl(${currentTokens.colors.background})`,
              color: `hsl(${currentTokens.colors.foreground})`,
              fontFamily: currentTokens.typography.fontSans,
              borderRadius: currentTokens.spacing.radius,
            }}
          >
            <div>
              <h2 
                className="text-2xl font-bold mb-2"
                style={{ 
                  fontFamily: currentTokens.typography.fontHeading,
                  color: `hsl(${currentTokens.colors.primary})`,
                }}
              >
                Theme Preview
              </h2>
              <p style={{ color: `hsl(${currentTokens.colors.mutedForeground})` }}>
                This preview shows how your theme will look across the application.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                className="px-4 py-2 rounded-md font-medium"
                style={{
                  backgroundColor: `hsl(${currentTokens.colors.primary})`,
                  color: `hsl(${currentTokens.colors.primaryForeground})`,
                  borderRadius: currentTokens.spacing.radius,
                }}
              >
                Primary Button
              </button>
              <button
                className="px-4 py-2 rounded-md font-medium"
                style={{
                  backgroundColor: `hsl(${currentTokens.colors.secondary})`,
                  color: `hsl(${currentTokens.colors.secondaryForeground})`,
                  borderRadius: currentTokens.spacing.radius,
                }}
              >
                Secondary Button
              </button>
              <button
                className="px-4 py-2 rounded-md font-medium"
                style={{
                  backgroundColor: `hsl(${currentTokens.colors.destructive})`,
                  color: `hsl(${currentTokens.colors.destructiveForeground})`,
                  borderRadius: currentTokens.spacing.radius,
                }}
              >
                Destructive
              </button>
              <button
                className="px-4 py-2 rounded-md font-medium"
                style={{
                  backgroundColor: `hsl(${currentTokens.colors.success})`,
                  color: `hsl(${currentTokens.colors.successForeground})`,
                  borderRadius: currentTokens.spacing.radius,
                }}
              >
                Success
              </button>
            </div>
            
            <div 
              className="p-4 border"
              style={{
                backgroundColor: `hsl(${currentTokens.colors.card})`,
                color: `hsl(${currentTokens.colors.cardForeground})`,
                borderColor: `hsl(${currentTokens.colors.border})`,
                borderRadius: currentTokens.spacing.radius,
              }}
            >
              <h3 className="font-semibold mb-2" style={{ fontFamily: currentTokens.typography.fontHeading }}>
                Card Component
              </h3>
              <p style={{ color: `hsl(${currentTokens.colors.mutedForeground})` }}>
                Cards use the card background and foreground colors.
              </p>
              <input
                type="text"
                placeholder="Input field"
                className="mt-3 w-full px-3 py-2 border"
                style={{
                  backgroundColor: `hsl(${currentTokens.colors.input})`,
                  borderColor: `hsl(${currentTokens.colors.border})`,
                  borderRadius: currentTokens.spacing.radius,
                }}
              />
            </div>
            
            <div className="flex gap-2">
              {["chart1", "chart2", "chart3", "chart4", "chart5"].map((key) => (
                <div
                  key={key}
                  className="w-12 h-12 rounded"
                  style={{
                    backgroundColor: `hsl(${(currentTokens.colors as unknown as Record<string, string>)[key]})`,
                    borderRadius: currentTokens.spacing.radius,
                  }}
                />
              ))}
            </div>
            
            <div 
              className="p-4"
              style={{
                backgroundColor: `hsl(${currentTokens.colors.sidebar})`,
                color: `hsl(${currentTokens.colors.sidebarForeground})`,
                borderRadius: currentTokens.spacing.radius,
              }}
            >
              <h4 className="font-medium mb-2">Sidebar Preview</h4>
              <div 
                className="px-3 py-2 rounded"
                style={{
                  backgroundColor: `hsl(${currentTokens.colors.sidebarAccent})`,
                  color: `hsl(${currentTokens.colors.sidebarAccentForeground})`,
                }}
              >
                Active Item
              </div>
              <div className="px-3 py-2 mt-1 opacity-80">
                Inactive Item
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminThemesContent({ embedded }: AdminThemesContentProps) {
  const queryClient = useQueryClient();
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: themes = [], isLoading } = useQuery<Theme[]>({
    queryKey: ["/api/admin/themes"],
    queryFn: async () => {
      const res = await fetch("/api/admin/themes", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch themes");
      return res.json();
    },
  });
  
  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; lightTokens: ThemeTokens; darkTokens: ThemeTokens }) => {
      const res = await fetch("/api/admin/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create theme");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes"] });
      toast.success("Theme created");
      setIsCreating(false);
    },
    onError: () => toast.error("Failed to create theme"),
  });
  
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string; description: string; lightTokens: ThemeTokens; darkTokens: ThemeTokens }) => {
      const res = await fetch(`/api/admin/themes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update theme");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes"] });
      toast.success("Theme updated");
      setEditingTheme(null);
    },
    onError: () => toast.error("Failed to update theme"),
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/themes/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete theme");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes"] });
      toast.success("Theme deleted");
    },
    onError: () => toast.error("Failed to delete theme"),
  });
  
  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/themes/${id}/publish`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Failed to publish theme");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes"] });
      toast.success("Theme published");
    },
    onError: () => toast.error("Failed to publish theme"),
  });
  
  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/themes/${id}/set-default`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Failed to set default theme");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes"] });
      toast.success("Default theme updated");
    },
    onError: () => toast.error("Failed to set default theme"),
  });
  
  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/themes/${id}/duplicate`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Failed to duplicate theme");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes"] });
      toast.success("Theme duplicated");
    },
    onError: () => toast.error("Failed to duplicate theme"),
  });
  
  const importMutation = useMutation({
    mutationFn: async (data: ThemeExportFormat) => {
      const res = await fetch("/api/admin/themes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to import theme");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes"] });
      toast.success("Theme imported");
    },
    onError: () => toast.error("Failed to import theme"),
  });
  
  const handleExport = (theme: Theme) => {
    const exportData: ThemeExportFormat = {
      name: theme.name,
      lightTokens: theme.lightTokens,
      darkTokens: theme.darkTokens,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${theme.name.toLowerCase().replace(/\s+/g, "-")}-theme.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Theme exported");
  };
  
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as ThemeExportFormat;
        if (!data.lightTokens || !data.darkTokens) {
          toast.error("Invalid theme file format");
          return;
        }
        importMutation.mutate(data);
      } catch {
        toast.error("Failed to parse theme file");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };
  
  if (editingTheme || isCreating) {
    return (
      <Card className="h-[calc(100vh-200px)] min-h-[600px]">
        <ThemeEditor
          theme={isCreating ? null : editingTheme}
          isCreating={isCreating}
          onSave={(data) => {
            if (isCreating) {
              createMutation.mutate(data);
            } else if (editingTheme) {
              updateMutation.mutate({ id: editingTheme.id, ...data });
            }
          }}
          onClose={() => {
            setEditingTheme(null);
            setIsCreating(false);
          }}
        />
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme Manager
          </h2>
          <p className="text-sm text-muted-foreground">
            Create and manage themes for the application
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            data-testid="button-import-theme"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => setIsCreating(true)} data-testid="button-create-theme">
            <Plus className="h-4 w-4 mr-2" />
            Create Theme
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading themes...</div>
      ) : themes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Palette className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No themes yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first theme to customize the application appearance
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Theme
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => (
            <Card key={theme.id} className={cn(theme.isDefault && "ring-2 ring-primary")}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {theme.name}
                      {theme.isDefault && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {theme.description || "No description"}
                    </CardDescription>
                  </div>
                  <Badge variant={theme.status === "published" ? "default" : "secondary"}>
                    {theme.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-1 mb-4">
                  {["primary", "secondary", "accent", "destructive", "success"].map((key) => (
                    <div
                      key={key}
                      className="w-8 h-8 rounded border"
                      style={{
                        backgroundColor: `hsl(${(theme.lightTokens?.colors as unknown as Record<string, string>)?.[key] || "0 0% 50%"})`,
                      }}
                      title={key}
                    />
                  ))}
                </div>
                
                <div className="flex flex-wrap gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setEditingTheme(theme)}
                    data-testid={`button-edit-theme-${theme.id}`}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => duplicateMutation.mutate(theme.id)}
                    data-testid={`button-duplicate-theme-${theme.id}`}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Clone
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleExport(theme)}
                    data-testid={`button-export-theme-${theme.id}`}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Export
                  </Button>
                  {theme.status === "draft" && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => publishMutation.mutate(theme.id)}
                      data-testid={`button-publish-theme-${theme.id}`}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Publish
                    </Button>
                  )}
                  {theme.status === "published" && !theme.isDefault && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setDefaultMutation.mutate(theme.id)}
                      data-testid={`button-set-default-theme-${theme.id}`}
                    >
                      <Star className="h-3.5 w-3.5 mr-1" />
                      Set Default
                    </Button>
                  )}
                  {!theme.isSystem && !theme.isDefault && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-theme-${theme.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete theme?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{theme.name}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(theme.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
