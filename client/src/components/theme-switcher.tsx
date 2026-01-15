import { useTheme } from "@/context/theme-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, Palette, Check } from "lucide-react";

export function ThemeSwitcher() {
  const { themes, activeTheme, isDark, setTheme, toggleDarkMode } = useTheme();

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleDarkMode}
        className="h-8 w-8"
        data-testid="dark-mode-toggle"
      >
        {isDark ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="theme-switcher-trigger">
            <Palette className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Select Theme</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={activeTheme?.id || ""}
            onValueChange={setTheme}
          >
            {themes.map((theme) => (
              <DropdownMenuRadioItem
                key={theme.id}
                value={theme.id}
                className="cursor-pointer"
                data-testid={`theme-option-${theme.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col">
                    <span className="font-medium">{theme.name}</span>
                    {theme.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {theme.description}
                      </span>
                    )}
                  </div>
                  {theme.isDefault && (
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-2">
                      Default
                    </span>
                  )}
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function ThemeSwitcherCompact() {
  const { themes, activeTheme, isDark, setTheme, toggleDarkMode } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" data-testid="theme-switcher-compact">
          <Palette className="h-4 w-4" />
          <span className="text-sm">{activeTheme?.name || "Theme"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Appearance</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              toggleDarkMode();
            }}
            className="h-7 gap-1.5 text-xs"
          >
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {isDark ? "Light" : "Dark"}
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-1 max-h-64 overflow-y-auto">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              className={`w-full flex items-center gap-3 p-2 rounded-md text-left hover:bg-accent transition-colors ${
                activeTheme?.id === theme.id ? "bg-accent" : ""
              }`}
              data-testid={`theme-compact-${theme.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div
                className="w-8 h-8 rounded-md border flex-shrink-0 overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, 
                    hsl(${theme.lightTokens.colors.primary}) 0%, 
                    hsl(${theme.lightTokens.colors.primary}) 50%, 
                    hsl(${theme.lightTokens.colors.accent}) 50%, 
                    hsl(${theme.lightTokens.colors.accent}) 100%)`,
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-sm">{theme.name}</span>
                  {theme.isDefault && (
                    <span className="text-[9px] bg-primary/10 text-primary px-1 py-0.5 rounded">
                      Default
                    </span>
                  )}
                </div>
                {theme.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {theme.description}
                  </p>
                )}
              </div>
              {activeTheme?.id === theme.id && (
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
