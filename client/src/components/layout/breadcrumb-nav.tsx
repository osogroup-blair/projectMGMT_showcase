import { ChevronRight, Home as HomeIcon, ArrowLeft, UserCog, X, Eye, ListTodo, FolderKanban, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation, Link, useSearch } from "wouter";
import { useProjects, useMilestones, useSprints } from "@/hooks/use-nexus-data";
import { Fragment, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PROJECT_STAGES } from "@/lib/mock-data";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const TAB_LABELS: Record<string, string> = {
  overview: "Dashboard",
  tasks: "Tasks",
  deliverables: "Deliverables",
  timeline: "Timeline",
  milestones: "Milestones",
  stages: "Stages",
  sprints: "Sprints",
};

export function BreadcrumbNav() {
  const [location] = useLocation();
  const searchString = useSearch();
  const pathSegments = location.split("/").filter(Boolean);
  const { data: projects } = useProjects();
  const { data: allMilestones } = useMilestones();
  const { data: allSprints } = useSprints();
  const { user, isAdmin, isDemoUser, canImpersonate, isImpersonating, realUser, impersonate, stopImpersonation, isImpersonating_loading, isStoppingImpersonation } = useAuth();
  
  const { data: usersWithCounts } = useQuery<Array<{
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    profileImageUrl: string | null;
    systemRole: string | null;
    taskCount: number;
    projectCount: number;
  }>>({
    queryKey: ["/api/users/with-counts"],
    queryFn: async () => {
      const res = await fetch("/api/users/with-counts", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: canImpersonate,
  });
  const [impersonateOpen, setImpersonateOpen] = useState(false);

  const activeTab = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return params.get("tab");
  }, [searchString]);

  const entityIds = useMemo(() => {
    const ids: { deliverableId?: string; epicId?: string; taskId?: string; sprintId?: string } = {};
    for (let i = 0; i < pathSegments.length; i++) {
      const prev = pathSegments[i - 1];
      const segment = pathSegments[i];
      if (prev === "deliverables" && segment && !["epics", "tasks", "milestones", "sprints"].includes(segment)) {
        ids.deliverableId = segment;
      }
      if (prev === "epics" && segment && !["tasks", "milestones", "sprints"].includes(segment)) {
        ids.epicId = segment;
      }
      if (prev === "tasks" && segment) ids.taskId = segment;
      if (prev === "sprints" && segment) ids.sprintId = segment;
    }
    return ids;
  }, [pathSegments]);

  const { data: deliverable } = useQuery({
    queryKey: ["/api/deliverables", entityIds.deliverableId],
    queryFn: async () => {
      const res = await fetch(`/api/deliverables/${entityIds.deliverableId}`);
      return res.ok ? res.json() : null;
    },
    enabled: !!entityIds.deliverableId,
  });

  const { data: epic } = useQuery({
    queryKey: ["/api/epics", entityIds.epicId],
    queryFn: async () => {
      const res = await fetch(`/api/epics/${entityIds.epicId}`);
      return res.ok ? res.json() : null;
    },
    enabled: !!entityIds.epicId,
  });

  const { data: task } = useQuery({
    queryKey: ["/api/tasks", entityIds.taskId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${entityIds.taskId}`);
      return res.ok ? res.json() : null;
    },
    enabled: !!entityIds.taskId,
  });

  const { data: taskEpic } = useQuery({
    queryKey: ["/api/epics", task?.epicId],
    queryFn: async () => {
      const res = await fetch(`/api/epics/${task?.epicId}`);
      return res.ok ? res.json() : null;
    },
    enabled: !!task?.epicId,
  });

  const { data: taskDeliverable } = useQuery({
    queryKey: ["/api/deliverables", taskEpic?.deliverableId],
    queryFn: async () => {
      const res = await fetch(`/api/deliverables/${taskEpic?.deliverableId}`);
      return res.ok ? res.json() : null;
    },
    enabled: !!taskEpic?.deliverableId,
  });

  const { data: epicDeliverable } = useQuery({
    queryKey: ["/api/deliverables", epic?.deliverableId],
    queryFn: async () => {
      const res = await fetch(`/api/deliverables/${epic?.deliverableId}`);
      return res.ok ? res.json() : null;
    },
    enabled: !!epic?.deliverableId,
  });

  const handleGoBack = () => window.history.back();

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return email?.[0]?.toUpperCase() || "?";
  };

  const handleImpersonate = (userId: string) => {
    impersonate(userId);
    setImpersonateOpen(false);
  };

  const isProjectOverviewPage = pathSegments.length === 2 && pathSegments[0] === "projects";
  const isTaskDetailPage = pathSegments.length === 4 && pathSegments[0] === "projects" && pathSegments[2] === "tasks";
  const isSprintDetailPage = pathSegments.length === 4 && pathSegments[0] === "projects" && pathSegments[2] === "sprints";
  const isEpicDetailPage = pathSegments.length === 4 && pathSegments[0] === "projects" && pathSegments[1] !== "templates" && pathSegments[2] === "epics";

  const projectIdFromPath = pathSegments[1];
  const projectForBreadcrumb = projects?.find((p: any) => p.id === projectIdFromPath);
  const sprintIdFromPath = isSprintDetailPage ? pathSegments[3] : null;
  const sprintForBreadcrumb = sprintIdFromPath ? allSprints?.find((s: any) => s.id === sprintIdFromPath) : null;

  const getBreadcrumbLabel = (segment: string, index: number, allSegments: string[]) => {
    if (segment === "projects") return "Projects";
    if (segment === "import") return "Import";
    if (segment === "mapping") return "Field Mapping";
    if (segment === "preview") return "Preview & Confirm";
    if (segment === "stages") return "Stages";
    if (segment === "deliverables") return "Deliverables";
    if (segment === "epics") return "Epics";
    if (segment === "tasks") return "Tasks";
    if (segment === "milestones") return "Milestones";
    if (segment === "sprints") return "Sprints";
    if (segment === "view-settings") return "View Settings";

    const prevSegment = allSegments[index - 1];
    if (prevSegment === "projects") {
      const project = projects?.find((p: any) => p.id === segment);
      return project ? project.name : "Project";
    }
    if (prevSegment === "deliverables" && deliverable?.title) return deliverable.title;
    if (prevSegment === "epics" && epic?.title) return epic.title;
    if (prevSegment === "tasks" && task?.title) return task.title;
    if (prevSegment === "import") return "New Session";
    if (prevSegment === "stages") {
      const stage = PROJECT_STAGES.find((s: any) => s.id === segment);
      return stage?.name || "Stage";
    }
    if (prevSegment === "milestones" && allMilestones) {
      const milestone = allMilestones.find((m: any) => m.id === segment);
      return milestone?.name || "Milestone";
    }
    if (prevSegment === "sprints" && allSprints) {
      const sprint = allSprints.find((s: any) => s.id === segment);
      return sprint?.name || "Sprint";
    }
    return segment;
  };

  return (
    <div className="h-12 border-b border-border bg-background flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground overflow-hidden">
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleGoBack} data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="w-px h-5 bg-border shrink-0" />
        <Link href="/" className="flex items-center hover:text-primary transition-colors">
          <HomeIcon className="h-4 w-4" />
        </Link>
        
        {isSprintDetailPage && sprintForBreadcrumb ? (
          <>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            <Link href="/projects" className="hover:text-primary transition-colors truncate max-w-[150px]">Projects</Link>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            <Link href={`/projects/${projectIdFromPath}`} className="hover:text-primary transition-colors truncate max-w-[150px]">
              {projectForBreadcrumb?.name || "Project"}
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            <Link href={`/projects/${projectIdFromPath}?tab=sprints`} className="hover:text-primary transition-colors truncate max-w-[150px]">Sprints</Link>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            <span className="font-medium text-foreground truncate max-w-[200px]">{sprintForBreadcrumb.name}</span>
          </>
        ) : isEpicDetailPage && epicDeliverable && epic ? (
          <>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            <Link href="/projects" className="hover:text-primary transition-colors truncate max-w-[150px]">Projects</Link>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            <Link href={`/projects/${projectIdFromPath}`} className="hover:text-primary transition-colors truncate max-w-[150px]">
              {projectForBreadcrumb?.name || "Project"}
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            <Link href={`/projects/${projectIdFromPath}/deliverables/${epicDeliverable.id}`} className="hover:text-primary transition-colors truncate max-w-[150px]">
              {epicDeliverable.title}
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            <span className="font-medium text-foreground truncate max-w-[200px]">{epic.title}</span>
          </>
        ) : isTaskDetailPage && taskDeliverable && taskEpic && task ? (
          <>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            <Link href="/projects" className="hover:text-primary transition-colors truncate max-w-[150px]">Projects</Link>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            <Link href={`/projects/${projectIdFromPath}?tab=deliverables`} className="hover:text-primary transition-colors truncate max-w-[150px]">
              {projectForBreadcrumb?.name || "Project"}
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            <Link href={`/projects/${projectIdFromPath}?tab=deliverables`} className="hover:text-primary transition-colors truncate max-w-[150px]">{taskDeliverable.title}</Link>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            <Link href={`/projects/${projectIdFromPath}?tab=deliverables`} className="hover:text-primary transition-colors truncate max-w-[150px]">{taskEpic.title}</Link>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            <span className="font-medium text-foreground truncate max-w-[200px]">{task.title}</span>
          </>
        ) : pathSegments.map((segment, index) => {
          let path = `/${pathSegments.slice(0, index + 1).join("/")}`;
          const isLast = index === pathSegments.length - 1;
          const label = getBreadcrumbLabel(segment, index, pathSegments);
          const prevSegment = pathSegments[index - 1];
          if (segment === "stages" && prevSegment && !isLast) {
            const projectPath = pathSegments.slice(0, index).join("/");
            path = `/${projectPath}?tab=stages`;
          }
          const showTabAfter = isLast && isProjectOverviewPage && activeTab && activeTab !== "overview";
          return (
            <Fragment key={path}>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              {isLast && !showTabAfter ? (
                <span className="font-medium text-foreground truncate max-w-[200px]">{label}</span>
              ) : (
                <Link href={path} className="hover:text-primary transition-colors truncate max-w-[150px]">{label}</Link>
              )}
              {showTabAfter && (
                <>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  <span className="font-medium text-foreground truncate max-w-[200px]">{TAB_LABELS[activeTab] || activeTab}</span>
                </>
              )}
            </Fragment>
          );
        })}
      </div>

      {/* Impersonation Controls (Admin and Demo users) */}
      {canImpersonate && (
        <div className="flex items-center gap-2 shrink-0">
          {isImpersonating ? (
            <div className="flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-md">
              <Eye className="h-4 w-4" />
              <span className="text-xs font-medium">
                Viewing as: {user?.name || user?.firstName || user?.email}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5 hover:bg-amber-200"
                onClick={() => stopImpersonation()}
                disabled={isStoppingImpersonation}
                data-testid="button-stop-impersonation"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Popover open={impersonateOpen} onOpenChange={setImpersonateOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 gap-2 text-xs"
                  data-testid="button-impersonate"
                  role="combobox"
                  aria-expanded={impersonateOpen}
                >
                  <UserCog className="h-4 w-4" />
                  Impersonate
                  <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <Command>
                  <CommandInput placeholder="Search users..." data-testid="input-user-search" />
                  <CommandList>
                    <CommandEmpty>No users found</CommandEmpty>
                    <CommandGroup heading="Users">
                      {(usersWithCounts || [])
                        .filter((u) => {
                          // Demo users can only see other demo users to impersonate
                          if (isDemoUser) {
                            return u.systemRole === "demo" || u.id.startsWith("demo-");
                          }
                          // Admins can see everyone
                          return true;
                        })
                        .map((u) => (
                        <CommandItem 
                          key={u.id}
                          value={`${u.name || ''} ${u.firstName || ''} ${u.lastName || ''} ${u.email || ''}`}
                          onSelect={() => handleImpersonate(u.id)}
                          disabled={isImpersonating_loading || u.id === user?.id}
                          className="cursor-pointer py-2"
                          data-testid={`impersonate-user-${u.id}`}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {getInitials(u.name, u.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-medium truncate">{u.name || u.firstName || "Unknown"}</p>
                                {u.systemRole === "admin" && (
                                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded">Admin</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-0.5">
                                  <ListTodo className="h-3 w-3" />
                                  {u.taskCount} tasks
                                </span>
                                <span className="flex items-center gap-0.5">
                                  <FolderKanban className="h-3 w-3" />
                                  {u.projectCount} projects
                                </span>
                              </div>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}
    </div>
  );
}
