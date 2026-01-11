import { useState, useEffect } from "react";
import { 
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Star,
  FolderKanban,
  Home,
  Settings,
  PanelLeftClose,
  PanelLeft
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/context/current-user-context";
import logo from "@assets/image_1765392085901.png";

interface FavoriteProject {
  projectId: string;
  projectName: string;
}

export function Sidebar() {
  const [location] = useLocation();
  const { currentUser } = useCurrentUser();
  
  // Collapsible state with localStorage persistence
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const { data: favoriteProjects = [] } = useQuery<FavoriteProject[]>({
    queryKey: ['favoriteProjects', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const res = await fetch(`/api/favorites?userId=${currentUser.id}`);
      if (!res.ok) return [];
      const favorites = await res.json();
      
      const projectsRes = await fetch('/api/projects');
      if (!projectsRes.ok) return [];
      const projects = await projectsRes.json();
      
      return favorites.map((f: { projectId: string }) => {
        const project = projects.find((p: { id: string; name: string }) => p.id === f.projectId);
        return {
          projectId: f.projectId,
          projectName: project?.name || 'Unknown Project'
        };
      }).filter((f: FavoriteProject) => f.projectName !== 'Unknown Project');
    },
    enabled: !!currentUser?.id,
  });

  const NavItem = ({ href, icon: Icon, label, isActive, isCollapsed }: { 
    href: string; 
    icon: typeof Home; 
    label: string; 
    isActive: boolean; 
    isCollapsed: boolean;
  }) => {
    const content = (
      <Link 
        href={href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          isCollapsed && "justify-center px-2",
          isActive 
            ? "bg-sidebar-accent text-sidebar-accent-foreground" 
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        {!isCollapsed && <span>{label}</span>}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      );
    }
    return content;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn(
        "flex h-screen flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300",
        isCollapsed ? "w-[68px]" : "w-[280px]"
      )}>
        {/* Header / Profile */}
        <div className={cn("p-4 pb-2", isCollapsed && "px-2")}>
          <div className={cn("mb-4 flex items-center", isCollapsed ? "justify-center" : "px-2 justify-between")}>
            {isCollapsed ? (
              <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-sm">N</span>
              </div>
            ) : (
              <img src={logo} alt="Nymbl" className="h-8 w-auto object-contain" />
            )}
          </div>
          
          {!isCollapsed && (
            <div className="flex items-center gap-2 mb-4">
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
          )}
          
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center p-2 rounded-lg hover:bg-sidebar-accent cursor-pointer transition-colors mb-2" data-testid="profile-card">
                  <Avatar className="h-8 w-8 border border-sidebar-border">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>JM</AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div>
                  <p className="font-semibold">Joy Mason</p>
                  <p className="text-xs text-muted-foreground">Product Manager</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent cursor-pointer transition-colors mb-2" data-testid="profile-card">
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
          )}
        </div>

        <ScrollArea className={cn("flex-1", isCollapsed ? "px-2" : "px-4")}>
          <div className="space-y-6">
            {/* Main Navigation */}
            <div className="space-y-1">
              <NavItem 
                href="/" 
                icon={Home} 
                label="Home" 
                isActive={location === "/"} 
                isCollapsed={isCollapsed} 
              />
              <NavItem 
                href="/projects" 
                icon={FolderKanban} 
                label="All Projects" 
                isActive={location === "/projects" || location.startsWith("/projects/")} 
                isCollapsed={isCollapsed} 
              />
            </div>

            {/* Favorite Projects */}
            {favoriteProjects.length > 0 && (
              <div className="space-y-1">
                {!isCollapsed && (
                  <div className="flex items-center gap-2 px-3 py-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                      Favorites
                    </span>
                  </div>
                )}
                {isCollapsed && (
                  <div className="flex justify-center py-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  </div>
                )}
                {favoriteProjects.map((project) => {
                  const isActive = location === `/projects/${project.projectId}`;
                  const content = (
                    <Link 
                      key={project.projectId}
                      href={`/projects/${project.projectId}`}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                        isCollapsed ? "justify-center px-2" : "ml-2",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                      data-testid={`nav-favorite-${project.projectId}`}
                    >
                      {isCollapsed ? (
                        <div className="h-6 w-6 rounded bg-sidebar-accent flex items-center justify-center text-xs font-medium">
                          {project.projectName.charAt(0)}
                        </div>
                      ) : (
                        <span className="truncate">{project.projectName}</span>
                      )}
                    </Link>
                  );

                  if (isCollapsed) {
                    return (
                      <Tooltip key={project.projectId}>
                        <TooltipTrigger asChild>{content}</TooltipTrigger>
                        <TooltipContent side="right">{project.projectName}</TooltipContent>
                      </Tooltip>
                    );
                  }
                  return content;
                })}
              </div>
            )}

            {/* Admin */}
            <div className="space-y-1">
              <NavItem 
                href="/admin" 
                icon={Settings} 
                label="Admin" 
                isActive={location === "/admin" || location.startsWith("/admin")} 
                isCollapsed={isCollapsed} 
              />
            </div>
          </div>
        </ScrollArea>

        {/* Collapse Toggle Button */}
        <div className={cn("p-4 border-t border-sidebar-border", isCollapsed && "px-2")}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "w-full justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              !isCollapsed && "justify-start gap-2"
            )}
            data-testid="toggle-sidebar"
          >
            {isCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}

