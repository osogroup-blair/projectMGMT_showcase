import { Home, Layers, Settings, LayoutTemplate, Sliders, Users, Download, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="w-48 h-full border-r border-border bg-card flex flex-col">
      <div className="space-y-1 p-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-9 font-normal text-sm",
                  isActive 
                    ? "bg-secondary text-primary font-medium shadow-xs" 
                    : "text-foreground/70 hover:text-foreground hover:bg-secondary/50"
                )}
                data-testid={`subnav-${item.label.toLowerCase()}`}
              >
                <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </div>

      {favoriteProjects.length > 0 && (
        <div className="px-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-2 py-1 mb-1">
            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Favorites
            </span>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-0.5 pr-2">
              {favoriteProjects.map((project) => {
                const isActive = location === `/projects/${project.projectId}`;
                return (
                  <Link key={project.projectId} href={`/projects/${project.projectId}`}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start h-8 font-normal text-xs px-2",
                        isActive 
                          ? "bg-secondary text-primary font-medium shadow-xs" 
                          : "text-foreground/70 hover:text-foreground hover:bg-secondary/50"
                      )}
                      data-testid={`nav-favorite-${project.projectId}`}
                    >
                      <span className="truncate">{project.projectName}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}

      <div className="p-4 border-t border-border mt-auto">
        <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Admin
        </div>
        <Link href="/admin/templates">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 h-9 font-normal text-sm",
              location === "/admin/templates"
                ? "bg-secondary text-primary font-medium shadow-xs" 
                : "text-foreground/70 hover:text-foreground hover:bg-secondary/50"
            )}
            data-testid="subnav-admin-templates"
          >
            <LayoutTemplate className={cn("h-4 w-4", location === "/admin/templates" && "text-primary")} />
            Templates
          </Button>
        </Link>
        <Link href="/admin/defaults">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 h-9 font-normal text-sm",
              location === "/admin/defaults"
                ? "bg-secondary text-primary font-medium shadow-xs" 
                : "text-foreground/70 hover:text-foreground hover:bg-secondary/50"
            )}
            data-testid="subnav-admin-defaults"
          >
            <Settings className={cn("h-4 w-4", location === "/admin/defaults" && "text-primary")} />
            App Defaults
          </Button>
        </Link>
        <Link href="/admin/users">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 h-9 font-normal text-sm",
              location === "/admin/users"
                ? "bg-secondary text-primary font-medium shadow-xs" 
                : "text-foreground/70 hover:text-foreground hover:bg-secondary/50"
            )}
            data-testid="subnav-admin-users"
          >
            <Users className={cn("h-4 w-4", location === "/admin/users" && "text-primary")} />
            User Management
          </Button>
        </Link>
        <Link href="/admin/import-export">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 h-9 font-normal text-sm",
              location === "/admin/import-export"
                ? "bg-secondary text-primary font-medium shadow-xs" 
                : "text-foreground/70 hover:text-foreground hover:bg-secondary/50"
            )}
            data-testid="subnav-admin-import-export"
          >
            <Download className={cn("h-4 w-4", location === "/admin/import-export" && "text-primary")} />
            Import & Export
          </Button>
        </Link>
      </div>
    </div>
  );
}
