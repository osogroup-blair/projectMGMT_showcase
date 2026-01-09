import { useState, useMemo } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  Users, 
  Banknote, 
  Settings, 
  ClipboardList,
  Calendar,
  AlertTriangle,
  HeartPulse,
  Loader2,
  ArrowLeft,
  Rows3,
  LayoutGrid,
  Columns,
  Search,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoute, Link, useLocation } from "wouter";
import { useProject, useTasks, useUsers, useMilestones, useEpics, useProjectStages, useDeliverables } from "@/hooks/use-nexus-data";
import { TaskCard, LayoutVariant } from "@/components/task/task-card";
import { cn } from "@/lib/utils";

export default function ProjectManagement() {
  const [match, params] = useRoute("/projects/:projectId/management");
  const projectId = params?.projectId || "1";
  const [activeTab, setActiveTab] = useState("tasks");
  const [, setLocation] = useLocation();
  const [layoutVariant, setLayoutVariant] = useState<LayoutVariant>("three-column");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: project, isLoading } = useProject(projectId);
  const { data: allTasks, update: updateTask } = useTasks();
  const { data: users } = useUsers();
  const { data: milestones } = useMilestones();
  const { data: allEpics } = useEpics();
  const { data: projectStages } = useProjectStages();
  const { data: allDeliverables } = useDeliverables();

  const projectDeliverables = useMemo(() => {
    if (!allDeliverables || !project) return [];
    return allDeliverables.filter((d: any) => d.projectId === project.id);
  }, [allDeliverables, project]);

  const projectEpics = useMemo(() => {
    if (!allEpics || !project || projectDeliverables.length === 0) return [];
    const deliverableIds = new Set(projectDeliverables.map((d: any) => d.id));
    return allEpics.filter((e: any) => deliverableIds.has(e.deliverableId));
  }, [allEpics, project, projectDeliverables]);

  const projectTasks = useMemo(() => {
    if (!project || !allTasks) return [];
    return allTasks.filter((t: any) => t.project === project.name || t.projectId === project.id);
  }, [project, allTasks]);

  const filteredTasks = useMemo(() => {
    return projectTasks.filter(t => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projectTasks, searchQuery]);

  const getAssignee = (id?: string) => users?.find((u: any) => u.id === id);
  const getMilestone = (id?: string) => milestones?.find((m: any) => m.id === id);
  const getEpic = (id?: string) => projectEpics.find((e: any) => e.id === id);
  const getStage = (id?: string) => projectStages?.find((s: any) => s.id === id);

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Project Management</h1>
            <p className="text-sm text-muted-foreground">{project?.name}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href={`/projects/${projectId}/team`}>
            <Button variant="outline" className="gap-2" data-testid="button-team">
              <Users className="h-4 w-4" />
              Teams
            </Button>
          </Link>
          <Link href={`/projects/${projectId}/budget`}>
            <Button variant="outline" className="gap-2" data-testid="button-budget">
              <Banknote className="h-4 w-4" />
              Budget
            </Button>
          </Link>
          <Link href={`/projects/${projectId}/settings`}>
            <Button variant="outline" className="gap-2" data-testid="button-settings">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
            <TabsTrigger 
              value="tasks" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 gap-2"
              data-testid="tab-management-tasks"
            >
              <ClipboardList className="h-4 w-4" />
              Management Tasks
            </TabsTrigger>
            <TabsTrigger 
              value="meetings" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 gap-2"
              data-testid="tab-meetings"
            >
              <Calendar className="h-4 w-4" />
              Meetings
            </TabsTrigger>
            <TabsTrigger 
              value="raid" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 gap-2"
              data-testid="tab-raid-log"
            >
              <AlertTriangle className="h-4 w-4" />
              RAID Log
            </TabsTrigger>
            <TabsTrigger 
              value="health" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 gap-2"
              data-testid="tab-project-health"
            >
              <HeartPulse className="h-4 w-4" />
              Project Health
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-6 space-y-4">
            {/* Search and Layout Controls */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search tasks..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-mgmt-tasks"
                />
              </div>
              
              {/* Layout Toggle */}
              <div className="flex items-center gap-1 border rounded-md p-0.5 bg-muted/30">
                <Button 
                  variant={layoutVariant === "one-column" ? "secondary" : "ghost"} 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={() => setLayoutVariant("one-column")}
                  title="List view"
                  data-testid="mgmt-layout-one-column"
                >
                  <Rows3 className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant={layoutVariant === "two-column" ? "secondary" : "ghost"} 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={() => setLayoutVariant("two-column")}
                  title="Two column grid"
                  data-testid="mgmt-layout-two-column"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant={layoutVariant === "three-column" ? "secondary" : "ghost"} 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={() => setLayoutVariant("three-column")}
                  title="Three column grid"
                  data-testid="mgmt-layout-three-column"
                >
                  <Columns className="h-3.5 w-3.5" />
                </Button>
              </div>

              <Link href={`/projects/${projectId}/tasks`}>
                <Button className="gap-2" data-testid="button-new-mgmt-task">
                  <Plus className="h-4 w-4" />
                  New Task
                </Button>
              </Link>
            </div>

            {/* Task Cards Grid */}
            <div className={cn(
              "grid gap-3",
              layoutVariant === "one-column" && "grid-cols-1",
              layoutVariant === "two-column" && "grid-cols-1 md:grid-cols-2",
              layoutVariant === "three-column" && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            )}>
              {filteredTasks.map(task => {
                const assignee = getAssignee(task.assigneeId);
                const milestone = getMilestone(task.milestoneId);
                const epic = getEpic(task.epicId);
                const stage = getStage(task.stageId);

                return (
                  <TaskCard
                    key={task.id}
                    task={{
                      id: task.id,
                      title: task.title,
                      status: task.status,
                      priority: task.priority,
                      assigneeId: task.assigneeId,
                      deadline: task.deadline,
                      effort: task.effort,
                      epicId: task.epicId,
                      stageId: task.stageId,
                      milestoneId: task.milestoneId
                    }}
                    epicName={epic?.title}
                    stageName={stage?.name}
                    milestoneName={milestone?.name}
                    assigneeName={assignee?.name}
                    users={(users || []).map((u: any) => ({ id: u.id, name: u.name }))}
                    stages={(projectStages || []).map((s: any) => ({ id: s.id, name: s.name }))}
                    layoutVariant={layoutVariant}
                    onUpdateTask={(id, updates) => updateTask({ id, updates })}
                    onOpenTask={(id) => setLocation(`/projects/${projectId}/tasks/${id}`)}
                    onOpenEpic={(epicId) => {
                      const epicData = getEpic(epicId);
                      if (epicData?.deliverableId) {
                        setLocation(`/projects/${projectId}?tab=deliverable-${epicData.deliverableId}&epic=${epicId}`);
                      }
                    }}
                    onOpenMilestone={(milestoneId) => setLocation(`/projects/${projectId}?tab=milestones&milestone=${milestoneId}`)}
                  />
                );
              })}
            </div>

            {filteredTasks.length === 0 && (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tasks found</p>
                    <p className="text-sm mt-1">Create a new task to get started</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="meetings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Meetings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Scheduled meetings will appear here</p>
                  <p className="text-sm mt-1">Plan and track project meetings and reviews</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="raid" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>RAID Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Risks, Assumptions, Issues, and Dependencies</p>
                  <p className="text-sm mt-1">Track and manage project RAID items</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <HeartPulse className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Project health metrics will appear here</p>
                  <p className="text-sm mt-1">Monitor overall project status and KPIs</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
}
