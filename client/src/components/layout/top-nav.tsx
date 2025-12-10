import { Search, ChevronDown, Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import logo from "@assets/image_1765392085901.png";

export function TopNav() {
  return (
    <div className="h-16 bg-sidebar text-sidebar-foreground border-b border-sidebar-border flex items-center justify-center px-6 gap-4 relative">
      {/* Logo - Left */}
      <div className="absolute left-6 w-32 shrink-0">
        <img src={logo} alt="Nymbl" className="h-6 w-auto object-contain" />
      </div>

      {/* Search - Center */}
      <div className="max-w-md w-full">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-sidebar-foreground/70" />
          <input 
            className="flex h-9 w-full rounded-md border border-sidebar-border bg-sidebar-accent/50 px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-sidebar-foreground/50 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-sidebar-ring disabled:cursor-not-allowed disabled:opacity-50 pl-9 text-sidebar-foreground"
            placeholder="Search..." 
            data-testid="input-search"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-2.5 inline-flex h-5 select-none items-center gap-1 rounded border border-sidebar-border bg-sidebar-accent px-1.5 font-mono text-[10px] font-medium text-sidebar-foreground/70">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Right Side - Greeting + Profile */}
      <div className="absolute right-6 flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm text-sidebar-foreground/70 mr-2">Good morning, <span className="font-medium text-sidebar-foreground">Joy!</span></p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent">
          <Bell className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 pl-4 border-l border-sidebar-border">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium">Joy Mason</div>
            <div className="text-xs text-sidebar-foreground/70">PM</div>
          </div>
          <Avatar className="h-8 w-8 border border-sidebar-border">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>JM</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}
