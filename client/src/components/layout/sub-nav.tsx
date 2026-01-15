import { useState, useEffect } from "react";
import { Home, Layers, Settings, LayoutTemplate, Sliders, Users, Download, Star, PanelLeftClose, PanelLeft, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/context/current-user-context";
import { ScrollArea } from "@/components/ui/scroll-area";

const NAV_ITEMS = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Layers, label: "Projects", href: "/projects" },
];

interface FavoriteProject {
  projectId: string;
  projectName: string;
}

export function SubNav() {
  const [location] = useLocation();
  const { currentUser } = useCurrentUser();
  const queryClient = useQueryClient();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('subnav-collapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('subnav-collapsed', String(isCollapsed));
    window.dispatchEvent(new CustomEvent('subnav-collapse-change', { detail: { isCollapsed } }));
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

  const NavButton = ({ href, icon: Icon, label, isActive }: { href: string; icon: typeof Home; label: string; isActive: boolean }) => {
    const button = (
      <Link href={href}>
        <Button
          variant="ghost"
          className={cn(
            "w-full h-9 font-normal text-sm",
            isCollapsed ? "justify-center px-2" : "justify-start gap-3",
            isActive 
              ? "bg-secondary text-primary font-medium shadow-xs" 
              : "text-foreground/70 hover:text-foreground hover:bg-secondary/50"
          )}
          data-testid={`subnav-${label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <Icon className={cn("h-4 w-4 flex-shrink-0", isActive && "text-primary")} />
          {!isCollapsed && label}
        </Button>
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      );
    }
    return button;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn(
        "h-full border-r border-border bg-card flex flex-col transition-all duration-300",
        isCollapsed ? "w-14" : "w-48"
      )}>
        <div className={cn("space-y-1 p-2", !isCollapsed && "p-4")}>
          {NAV_ITEMS.map((item) => (
            <NavButton
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={location === item.href}
            />
          ))}
        </div>

        {favoriteProjects.length > 0 && (
          <div className={cn("flex-1 overflow-hidden flex flex-col", isCollapsed ? "px-2" : "px-4")}>
            {isCollapsed ? (
              <div className="flex justify-center py-2">
                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
              </div>
            ) : (
              <div className="flex items-center gap-2 px-2 py-1 mb-1">
                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Favorites
                </span>
              </div>
            )}
            <ScrollArea className="flex-1">
              <div className="space-y-0.5 pr-2">
                {favoriteProjects.map((project) => {
                  const isActive = location === `/projects/${project.projectId}`;
                  const button = (
                    <Link key={project.projectId} href={`/projects/${project.projectId}`}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full h-8 font-normal text-xs",
                          isCollapsed ? "justify-center px-2" : "justify-start px-2",
                          isActive 
                            ? "bg-secondary text-primary font-medium shadow-xs" 
                            : "text-foreground/70 hover:text-foreground hover:bg-secondary/50"
                        )}
                        data-testid={`nav-favorite-${project.projectId}`}
                      >
                        {isCollapsed ? (
                          <span className="h-5 w-5 rounded bg-secondary flex items-center justify-center text-[10px] font-medium">
                            {project.projectName.charAt(0).toUpperCase()}
                          </span>
                        ) : (
                          <span className="truncate">{project.projectName}</span>
                        )}
                      </Button>
                    </Link>
                  );

                  if (isCollapsed) {
                    return (
                      <Tooltip key={project.projectId}>
                        <TooltipTrigger asChild>{button}</TooltipTrigger>
                        <TooltipContent side="right">{project.projectName}</TooltipContent>
                      </Tooltip>
                    );
                  }
                  return button;
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        <div className={cn("border-t border-border mt-auto", isCollapsed ? "p-2" : "p-4")}>
          {!isCollapsed && (
            <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Admin
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center py-1 mb-1">
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          )}
          <NavButton
            href="/admin/templates"
            icon={LayoutTemplate}
            label="Templates"
            isActive={location === "/admin/templates"}
          />
          <NavButton
            href="/admin/defaults"
            icon={Settings}
            label="App Defaults"
            isActive={location === "/admin/defaults"}
          />
          <NavButton
            href="/admin/users"
            icon={Users}
            label="User Management"
            isActive={location === "/admin/users"}
          />
          <NavButton
            href="/admin/import-export"
            icon={Download}
            label="Import & Export"
            isActive={location === "/admin/import-export"}
          />
          <NavButton
            href="/admin/theme"
            icon={Palette}
            label="Theme Manager"
            isActive={location === "/admin/theme"}
          />
          
          <div className="mt-2 pt-2 border-t border-border">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className={cn(
                    "w-full text-foreground/70 hover:text-foreground hover:bg-secondary/50",
                    isCollapsed ? "justify-center px-2" : "justify-start gap-2"
                  )}
                  data-testid="toggle-subnav"
                >
                  {isCollapsed ? (
                    <PanelLeft className="h-4 w-4" />
                  ) : (
                    <>
                      <PanelLeftClose className="h-4 w-4" />
                      <span className="text-xs">Collapse</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
