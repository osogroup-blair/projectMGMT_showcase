import { 
  Search,
  ChevronDown
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import logo from "@assets/image_1765392085901.png";

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-[280px] flex-col border-r bg-sidebar text-sidebar-foreground">
      {/* Header / Profile */}
      <div className="p-6 pb-2">
        <div className="mb-6 px-2">
          <img src={logo} alt="Nymbl" className="h-8 w-auto object-contain" />
        </div>
        
        <div className="flex items-center gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-sidebar-foreground/70" />
            <input 
              className="flex h-9 w-full rounded-md border border-sidebar-border bg-sidebar-accent/50 px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-sidebar-foreground/50 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-sidebar-ring disabled:cursor-not-allowed disabled:opacity-50 pl-9 text-sidebar-foreground"
              placeholder="Search..." 
              data-testid="input-search"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-2.5 inline-flex h-5 select-none items-center gap-1 rounded border border-sidebar-border bg-sidebar-accent px-1.5 font-mono text-[10px] font-medium text-sidebar-foreground/70 opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent cursor-pointer transition-colors mb-4" data-testid="profile-card">
          <Avatar className="h-10 w-10 border border-sidebar-border">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>JM</AvatarFallback>
          </Avatar>
          <div className="flex flex-col text-left">
            <span className="text-sm font-semibold">Joy Mason</span>
            <span className="text-xs text-sidebar-foreground/70">Product Manager</span>
          </div>
          <ChevronDown className="ml-auto h-4 w-4 text-sidebar-foreground/70" />
        </div>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-6">
          {/* Navigation items will be added here */}
        </div>
      </ScrollArea>
    </div>
  );
}

