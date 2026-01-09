import { RefreshCw, Settings, Grid3x3, Sliders, ChevronRight, Home as HomeIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation, Link, useSearch } from "wouter";
import { useProjects, useMilestones, useSprints } from "@/hooks/use-nexus-data";
import { Fragment, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PROJECT_STAGES } from "@/lib/mock-data";

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

  // Parse tab from URL query params
  const activeTab = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return params.get("tab");
  }, [searchString]);

  // Extract specific entity IDs from URL for targeted lookups
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
      if (prev === "tasks" && segment) {
        ids.taskId = segment;
      }
      if (prev === "sprints" && segment) {
        ids.sprintId = segment;
      }
    }
    return ids;
  }, [pathSegments]);

  // Lightweight single-entity fetches only when needed
  const { data: deliverable } = useQuery({
    queryKey: ["/api/deliverables", entityIds.deliverableId],
    queryFn: async () => {
      const res = await fetch(`/api/deliverables/${entityIds.deliverableId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!entityIds.deliverableId,
    staleTime: 60000,
  });

  const { data: epic } = useQuery({
    queryKey: ["/api/epics", entityIds.epicId],
    queryFn: async () => {
      const res = await fetch(`/api/epics/${entityIds.epicId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!entityIds.epicId,
    staleTime: 60000,
  });

  const { data: task } = useQuery({
    queryKey: ["/api/tasks", entityIds.taskId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${entityIds.taskId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!entityIds.taskId,
    staleTime: 60000,
  });

  // Fetch the epic for a task (when viewing task detail)
  const { data: taskEpic } = useQuery({
    queryKey: ["/api/epics", task?.epicId],
    queryFn: async () => {
      const res = await fetch(`/api/epics/${task.epicId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!task?.epicId,
    staleTime: 60000,
  });

  // Fetch the deliverable for the task's epic
  const { data: taskDeliverable } = useQuery({
    queryKey: ["/api/deliverables", taskEpic?.deliverableId],
    queryFn: async () => {
      const res = await fetch(`/api/deliverables/${taskEpic.deliverableId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!taskEpic?.deliverableId,
    staleTime: 60000,
  });

  const handleGoBack = () => {
    window.history.back();
  };

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

    if (prevSegment === "deliverables" && deliverable?.title) {
      return deliverable.title;
    }

    if (prevSegment === "epics" && epic?.title) {
      return epic.title;
    }

    if (prevSegment === "tasks" && task?.title) {
      return task.title;
    }

    if (prevSegment === "import") {
      return "New Session";
    }

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

  // Check if we're on a project overview page (just /projects/:id with optional tab query)
  const isProjectOverviewPage = pathSegments.length === 2 && pathSegments[0] === "projects";

  // Check if we're on a task detail page: /projects/:projectId/tasks/:taskId
  const isTaskDetailPage = pathSegments.length === 4 && 
    pathSegments[0] === "projects" && 
    pathSegments[2] === "tasks";

  // Check if we're on a sprint detail page: /projects/:projectId/sprints/:sprintId
  const isSprintDetailPage = pathSegments.length === 4 && 
    pathSegments[0] === "projects" && 
    pathSegments[2] === "sprints";

  // Get project info for task detail breadcrumb
  const projectIdFromPath = pathSegments[1];
  const projectForBreadcrumb = projects?.find((p: any) => p.id === projectIdFromPath);
  
  // Get sprint info for sprint detail breadcrumb
  const sprintIdFromPath = isSprintDetailPage ? pathSegments[3] : null;
  const sprintForBreadcrumb = sprintIdFromPath ? allSprints?.find((s: any) => s.id === sprintIdFromPath) : null;

  return (
    <div className="h-12 border-b border-border bg-background flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground overflow-hidden">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 shrink-0" 
          onClick={handleGoBack}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="w-px h-5 bg-border shrink-0" />
        <Link href="/" className="flex items-center hover:text-primary transition-colors">
          <HomeIcon className="h-4 w-4" />
        </Link>
        
        {/* Custom breadcrumb for sprint detail page: Project > Sprints > Sprint Name */}
        {isSprintDetailPage && sprintForBreadcrumb ? (
          <>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            <Link href="/projects" className="hover:text-primary transition-colors truncate max-w-[150px]">
              Projects
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            <Link href={`/projects/${projectIdFromPath}`} className="hover:text-primary transition-colors truncate max-w-[150px]">
              {projectForBreadcrumb?.name || "Project"}
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            <Link href={`/projects/${projectIdFromPath}?tab=sprints`} className="hover:text-primary transition-colors truncate max-w-[150px]">
              Sprints
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            <span className="font-medium text-foreground truncate max-w-[200px]">
              {sprintForBreadcrumb.name}
            </span>
          </>
        ) : /* Custom breadcrumb for task detail page: Project > Deliverable > Epic > Task */
        isTaskDetailPage && taskDeliverable && taskEpic && task ? (
          <>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            <Link href="/projects" className="hover:text-primary transition-colors truncate max-w-[150px]">
              Projects
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            <Link href={`/projects/${projectIdFromPath}?tab=deliverables`} className="hover:text-primary transition-colors truncate max-w-[150px]">
              {projectForBreadcrumb?.name || "Project"}
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            <Link href={`/projects/${projectIdFromPath}?tab=deliverables`} className="hover:text-primary transition-colors truncate max-w-[150px]">
              {taskDeliverable.title}
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            <Link href={`/projects/${projectIdFromPath}?tab=deliverables`} className="hover:text-primary transition-colors truncate max-w-[150px]">
              {taskEpic.title}
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            <span className="font-medium text-foreground truncate max-w-[200px]">
              {task.title}
            </span>
          </>
        ) : pathSegments.map((segment, index) => {
          let path = `/${pathSegments.slice(0, index + 1).join("/")}`;
          const isLast = index === pathSegments.length - 1;
          const label = getBreadcrumbLabel(segment, index, pathSegments);
          const prevSegment = pathSegments[index - 1];

          // Special case: "stages" segment should link to the stages tab in project overview
          if (segment === "stages" && prevSegment && !isLast) {
            const projectPath = pathSegments.slice(0, index).join("/");
            path = `/${projectPath}?tab=stages`;
          }

          // Skip rendering if this would be redundant
          const showTabAfter = isLast && isProjectOverviewPage && activeTab && activeTab !== "overview";

          return (
            <Fragment key={path}>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              {isLast && !showTabAfter ? (
                <span className="font-medium text-foreground truncate max-w-[200px]">
                  {label}
                </span>
              ) : (
                <Link href={path} className="hover:text-primary transition-colors truncate max-w-[150px]">
                  {label}
                </Link>
              )}
              {showTabAfter && (
                <>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  <span className="font-medium text-foreground truncate max-w-[200px]">
                    {TAB_LABELS[activeTab] || activeTab}
                  </span>
                </>
              )}
            </Fragment>
          );
        })}
      </div>
      
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground hidden sm:flex">
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh 1 minute ago</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" data-testid="button-view-option-1">
            <Grid3x3 className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" data-testid="button-view-option-2">
            <Sliders className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" data-testid="button-customize">
            <Settings className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        <Button size="sm" className="h-7 text-xs gap-1.5" data-testid="button-customize-main">
          Customize
        </Button>
      </div>
    </div>
  );
}
