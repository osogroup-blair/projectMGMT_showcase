import * as React from "react";
import { Search, LogOut, User, Settings, HelpCircle, Moon, Sun, Palette, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/context/current-user-context";
import { useTheme } from "@/context/theme-context";
import { SearchCommandPalette } from "./search-command-palette";

export function TopNav() {
  const { currentUser } = useCurrentUser();
  const { themes, activeTheme, isDark, setTheme, toggleDarkMode } = useTheme();
  const [, setLocation] = useLocation();
  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
  
  const displayName = currentUser?.name || 
    `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 
    currentUser?.email || 
    "User";
  const firstName = displayName.split(" ")[0] || "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2) || "U";
  const avatarUrl = currentUser?.avatar || currentUser?.profileImageUrl;
  const userRole = currentUser?.role || currentUser?.jobTitle || "Team Member";

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="h-16 bg-sidebar text-sidebar-foreground border-b border-sidebar-border flex items-center justify-center px-6 gap-4 relative">
      <div className="absolute left-6 shrink-0">
        <span className="text-lg font-semibold text-sidebar-foreground">Project Management</span>
      </div>

      <div className="max-w-md w-full">
        <button
          onClick={() => setSearchOpen(true)}
          className="relative w-full"
          data-testid="button-open-search"
        >
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-sidebar-foreground/70" />
            <div 
              className="flex h-9 w-full rounded-md border border-sidebar-border bg-sidebar-accent/50 px-3 py-1 text-sm shadow-xs transition-colors pl-9 text-sidebar-foreground/50 text-left cursor-pointer hover:bg-sidebar-accent/70"
            >
              Search...
            </div>
            <kbd className="pointer-events-none absolute right-2.5 top-2.5 inline-flex h-5 select-none items-center gap-1 rounded border border-sidebar-border bg-sidebar-accent px-1.5 font-mono text-[10px] font-medium text-sidebar-foreground/70">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </button>
      </div>

      <SearchCommandPalette open={searchOpen} onOpenChange={setSearchOpen} />

      <div className="absolute right-6 flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm text-sidebar-foreground/70 mr-2">{getTimeGreeting()}, <span className="font-medium text-sidebar-foreground">{firstName}!</span></p>
        </div>
        
        {/* Theme Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            data-testid="dark-mode-toggle"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                data-testid="theme-switcher-trigger"
              >
                <Palette className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Select Theme</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {themes.map((theme) => (
                <DropdownMenuItem
                  key={theme.id}
                  onClick={() => setTheme(theme.id)}
                  className="cursor-pointer flex items-center justify-between"
                  data-testid={`theme-option-${theme.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded border flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, 
                          hsl(${theme.lightTokens.colors.primary}) 0%, 
                          hsl(${theme.lightTokens.colors.primary}) 50%, 
                          hsl(${theme.lightTokens.colors.accent}) 50%, 
                          hsl(${theme.lightTokens.colors.accent}) 100%)`,
                      }}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{theme.name}</span>
                      {theme.description && (
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {theme.description}
                        </span>
                      )}
                    </div>
                  </div>
                  {activeTheme?.id === theme.id && (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => setLocation("/help")}
          data-testid="button-help"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 pl-4 border-l border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer" data-testid="button-user-dropdown">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium">{displayName}</div>
                  <div className="text-xs text-sidebar-foreground/70">{userRole}</div>
                </div>
                <Avatar className="h-8 w-8 border border-sidebar-border">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{currentUser?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation("/profile")} data-testid="menu-item-profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation("/admin/settings")} data-testid="menu-item-settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
                data-testid="menu-item-logout"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
