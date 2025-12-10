import { 
  Home, 
  Settings, 
  CheckSquare, 
  Workflow, 
  Users, 
  Clock, 
  Box, 
  Brain, 
  Search,
  ChevronDown,
  Bell,
  LayoutGrid
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-[280px] flex-col border-r bg-sidebar text-sidebar-foreground">
      {/* Header / Profile */}
      <div className="p-6 pb-2">
        <div className="flex items-center gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-9"
              placeholder="Search..." 
              data-testid="input-search"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-2.5 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
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
            <span className="text-xs text-muted-foreground">Product Manager</span>
          </div>
          <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-6">
          <div className="space-y-1">
            <NavItem icon={Home} label="Home" active={location === "/"} href="/" />
            <NavItem icon={LayoutGrid} label="Customize" href="/customize" />
            <NavItem icon={CheckSquare} label="My Tasks" href="/tasks" badge="6" />
            <NavItem icon={Workflow} label="Workflows" href="/workflows" />
            <NavItem icon={Users} label="Accounts" href="/accounts" />
          </div>

          <div className="space-y-1">
            <h4 className="px-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">Operations</h4>
            <NavItem icon={Clock} label="Time & Billing" href="/billing" />
            <NavItem icon={Box} label="Resources" href="/resources" />
          </div>

          <div className="space-y-1">
            <h4 className="px-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">Knowledge</h4>
            <NavItem icon={Brain} label="AI Hub" href="/ai" className="text-accent hover:text-accent hover:bg-accent/10" />
            <NavItem icon={Bell} label="Quick Insights" href="/insights" />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function NavItem({ icon: Icon, label, active, href, badge, className }: any) {
  return (
    <Link href={href}>
      <Button 
        variant="ghost" 
        className={cn(
          "w-full justify-start gap-3 h-10 font-normal", 
          active ? "bg-sidebar-accent text-sidebar-primary font-medium shadow-xs" : "text-muted-foreground hover:text-sidebar-foreground",
          className
        )}
        data-testid={`nav-${label.toLowerCase().replace(" ", "-")}`}
      >
        <Icon className={cn("h-4 w-4", active && "text-sidebar-primary")} />
        {label}
        {badge && (
          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-sidebar-primary/10 text-[10px] font-medium text-sidebar-primary">
            {badge}
          </span>
        )}
      </Button>
    </Link>
  );
}
