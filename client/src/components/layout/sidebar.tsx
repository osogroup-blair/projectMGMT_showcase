import { 
  Search,
  ChevronDown,
  Star,
  FolderKanban,
  Home,
  Settings
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
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
          {/* Main Navigation */}
          <div className="space-y-1">
            <Link 
              href="/"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                location === "/" 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
              data-testid="nav-home"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link 
              href="/projects"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                location === "/projects" || location.startsWith("/projects/")
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
              data-testid="nav-projects"
            >
              <FolderKanban className="h-4 w-4" />
              All Projects
            </Link>
          </div>

          {/* Favorite Projects */}
          {favoriteProjects.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 px-3 py-2">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                  Favorites
                </span>
              </div>
              {favoriteProjects.map((project) => (
                <Link 
                  key={project.projectId}
                  href={`/projects/${project.projectId}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ml-2",
                    location === `/projects/${project.projectId}`
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                  data-testid={`nav-favorite-${project.projectId}`}
                >
                  <span className="truncate">{project.projectName}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Admin */}
          <div className="space-y-1">
            <Link 
              href="/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                location === "/admin" || location.startsWith("/admin")
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
              data-testid="nav-admin"
            >
              <Settings className="h-4 w-4" />
              Admin
            </Link>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

