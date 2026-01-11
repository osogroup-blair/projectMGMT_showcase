import { useMemo } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  MoreHorizontal, 
  Calendar,
  User,
  Flag,
  Clock,
  Loader2,
  Layers,
  Target,
  Tag,
  GripVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useRoute, Link, useLocation, useSearch } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  useProject, 
  useTasks, 
  useUsers, 
  useEpics, 
  useDeliverables,
  useMilestones,
  useProjectStages,
  useResolvedTaskTypes,
  useTaskDependencies,
  useSubtasks
} from "@/hooks/use-nexus-data";
import { useTaskStatuses } from "@/hooks/use-task-statuses";
import { EFFORT_VALUES } from "@shared/schema";
import { TaskOverviewTab } from "./task-overview-tab";
import { TaskSubtasksTab } from "./task-subtasks-tab";
import { TaskAttachmentsTab } from "./task-attachments-tab";
import { TaskDependenciesTab } from "./task-dependencies-tab";
import { TaskHistoryTab } from "./task-history-tab";
import { TaskPropertiesTab } from "./task-properties-tab";
import { TaskSidebarTabs } from "./task-sidebar-tabs";

const PRIORITY_CONFIG = {
  "High": { color: "text-red-600 bg-red-100", label: "High" },
  "Medium": { color: "text-amber-600 bg-amber-100", label: "Medium" },
  "Low": { color: "text-slate-600 bg-slate-100", label: "Low" }
};

const VALID_TABS = ["overview", "subtasks", "attachments", "dependents", "properties", "history"] as const;
type TabValue = typeof VALID_TABS[number];

export default function TaskDetail() {
  const [match, params] = useRoute("/projects/:projectId/tasks/:taskId");
  const projectId = params?.projectId || "1";
  const taskId = params?.taskId || "1";
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  
  const searchParams = new URLSearchParams(searchString);
  const tabParam = searchParams.get("tab") as TabValue | null;
  const activeTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : "overview";
  
  const handleTabChange = (tab: string) => {
    const newParams = new URLSearchParams(searchString);
    newParams.set("tab", tab);
    setLocation(`/projects/${projectId}/tasks/${taskId}?${newParams.toString()}`, { replace: true });
  };

  const { data: project, isLoading: isProjectLoading } = useProject(projectId);
  const { data: allTasks, isLoading: isTasksLoading, update: updateTask } = useTasks();
  const { data: users, isLoading: isUsersLoading } = useUsers();
  const { data: allEpics, isLoading: isEpicsLoading } = useEpics();
  const { data: allDeliverables, isLoading: isDeliverablesLoading } = useDeliverables();
  const { data: allMilestones, isLoading: isMilestonesLoading } = useMilestones();
  const { data: projectStages, isLoading: isStagesLoading } = useProjectStages();
  const { data: taskTypes, isLoading: isTaskTypesLoading } = useResolvedTaskTypes(projectId);
  const { 
    dependsOn, 
    dependents, 
    isLoading: isDepsLoading,
    addDependency,
    removeDependency
  } = useTaskDependencies(taskId);
  const { 
    data: subtasks, 
    isLoading: isSubtasksLoading,
    create: createSubtask
  } = useSubtasks(taskId);
  const { statusLabels } = useTaskStatuses();

  const task = useMemo(() => allTasks?.find((t: any) => t.id === taskId), [allTasks, taskId]);
  const milestones = useMemo(() => 
    (allMilestones || []).filter((m: any) => m.projectId === projectId),
    [allMilestones, projectId]
  );
  const stages = useMemo(() => projectStages || [], [projectStages]);
  const taskType = useMemo(() => 
    (taskTypes || []).find((tt: any) => tt.id === task?.taskTypeId),
    [taskTypes, task]
  );

  const isLoading = isProjectLoading || isTasksLoading || isUsersLoading || isEpicsLoading || 
    isDeliverablesLoading || isMilestonesLoading || isStagesLoading || isTaskTypesLoading;

  const handleUpdateTask = (field: string, value: any) => {
    if (!task) return;
    updateTask({ 
      id: task.id, 
      updates: { [field]: value === "" ? null : value } 
    });
    toast({
      title: "Task Updated",
      description: "Changes saved successfully.",
    });
  };

  const getAssignee = (id?: string | null) => users?.find((u: any) => u.id === id);
  const getMilestone = (id?: string | null) => milestones.find((m: any) => m.id === id);
  const getStage = (id?: string | null) => stages.find((s: any) => s.id === id);
  const getEpic = (id?: string | null) => allEpics?.find((e: any) => e.id === id);
  const getDeliverable = (id?: string | null) => allDeliverables?.find((d: any) => d.id === id);
  
  const epic = getEpic(task?.epicId);
  const deliverable = epic ? getDeliverable(epic.deliverableId) : null;

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    );
  }

  if (!task) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">Task not found</p>
          <Link href={`/projects/${projectId}/tasks`}>
            <Button variant="outline">Back to Tasks</Button>
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="h-[calc(100vh-120px)]">
        <PanelGroup direction="horizontal" autoSaveId="task-detail-layout">
          <Panel defaultSize={70} minSize={50}>
            <div className="pr-4 space-y-6 h-full overflow-y-auto">
            <div className="space-y-4">
              {/* Project Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link 
                  href={`/projects/${projectId}`}
                  className="hover:text-foreground hover:underline transition-colors font-medium"
                  data-testid="link-project-breadcrumb"
                >
                  {project?.name || "Project"}
                </Link>
                {deliverable && (
                  <>
                    <span>/</span>
                    <Link 
                      href={`/projects/${projectId}/deliverables/${deliverable.id}`}
                      className="hover:text-foreground hover:underline transition-colors"
                      data-testid="link-deliverable"
                    >
                      {deliverable.title}
                    </Link>
                  </>
                )}
                {epic && (
                  <>
                    <span>/</span>
                    <Link 
                      href={`/projects/${projectId}/epics/${epic.id}`}
                      className="hover:text-foreground hover:underline transition-colors"
                      data-testid="link-epic"
                    >
                      {epic.title}
                    </Link>
                  </>
                )}
              </div>

              <div className="flex justify-between items-start gap-4">
                <Input 
                  className="text-4xl font-bold border-none shadow-none px-0 h-auto focus-visible:ring-0"
                  value={task.title}
                  onChange={(e) => handleUpdateTask("title", e.target.value)}
                  data-testid="input-task-title"
                />
                <Button variant="ghost" size="icon" data-testid="button-task-menu">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <SearchableSelect
                    value={task.assigneeId || "unassigned"}
                    onValueChange={(v) => handleUpdateTask("assigneeId", v === "unassigned" ? null : v)}
                    placeholder="Assignee"
                    options={[
                      { value: "unassigned", label: "Unassigned" },
                      ...(users || []).map((member: any) => ({ value: member.id, label: member.name }))
                    ]}
                    className="w-[140px] h-8"
                    data-testid="inline-select-assignee"
                  />
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="date" 
                    value={task.deadline || ""}
                    onChange={(e) => handleUpdateTask("deadline", e.target.value)}
                    className="w-[140px] h-8"
                    data-testid="inline-input-deadline"
                  />
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="number" 
                    value={task.estimateHours || ""}
                    onChange={(e) => handleUpdateTask("estimateHours", parseInt(e.target.value) || 0)}
                    placeholder="Est. hrs"
                    className="w-[80px] h-8"
                    data-testid="inline-input-estimate"
                  />
                  <span className="text-sm text-muted-foreground">hrs</span>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-muted-foreground" />
                  <SearchableSelect
                    value={task.milestoneId || "none"}
                    onValueChange={(v) => handleUpdateTask("milestoneId", v === "none" ? null : v)}
                    placeholder="Milestone"
                    options={[
                      { value: "none", label: "No Milestone" },
                      ...milestones.map((m: any) => ({ value: m.id, label: m.name }))
                    ]}
                    className="w-[140px] h-8"
                    data-testid="inline-select-milestone"
                  />
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <SearchableSelect
                    value={task.taskTypeId || ""}
                    onValueChange={(v) => handleUpdateTask("taskTypeId", v || null)}
                    placeholder="Type"
                    options={(taskTypes || []).map((tt: any) => ({ value: tt.id, label: tt.name }))}
                    className="w-[120px] h-8"
                    data-testid="inline-select-task-type"
                  />
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                <TabsTrigger 
                  value="overview" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                  data-testid="tab-overview"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="subtasks" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                  data-testid="tab-subtasks"
                >
                  Subtasks
                </TabsTrigger>
                <TabsTrigger 
                  value="attachments" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                  data-testid="tab-attachments"
                >
                  Attachments
                </TabsTrigger>
                <TabsTrigger 
                  value="dependents" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                  data-testid="tab-dependents"
                >
                  Dependencies
                </TabsTrigger>
                <TabsTrigger 
                  value="properties" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                  data-testid="tab-properties"
                >
                  Properties
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                  data-testid="tab-history"
                >
                  History
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="pt-6">
                <TaskOverviewTab 
                  task={task} 
                  projectId={projectId}
                  updateTask={handleUpdateTask}
                />
              </TabsContent>

              <TabsContent value="subtasks" className="pt-6">
                <TaskSubtasksTab 
                  task={task}
                  projectId={projectId}
                  subtasks={subtasks}
                  createSubtask={createSubtask}
                  updateTask={updateTask}
                />
              </TabsContent>

              <TabsContent value="attachments" className="pt-6">
                <TaskAttachmentsTab 
                  task={task}
                  projectId={projectId}
                />
              </TabsContent>

              <TabsContent value="dependents" className="pt-6">
                <TaskDependenciesTab 
                  task={task}
                  projectId={projectId}
                  allTasks={allTasks || []}
                  stages={stages}
                  allEpics={allEpics || []}
                  milestones={milestones}
                  dependsOn={dependsOn}
                  dependents={dependents}
                  addDependency={addDependency}
                  removeDependency={removeDependency}
                />
              </TabsContent>

              <TabsContent value="properties" className="pt-6">
                <TaskPropertiesTab 
                  task={task}
                  projectId={projectId}
                  updateTask={handleUpdateTask}
                  stages={stages}
                  allEpics={allEpics || []}
                />
              </TabsContent>

              <TabsContent value="history" className="pt-6">
                <TaskHistoryTab 
                  task={task}
                  projectId={projectId}
                />
              </TabsContent>
            </Tabs>
            </div>
          </Panel>

          <PanelResizeHandle className="w-2 flex items-center justify-center hover:bg-muted/50 transition-colors">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </PanelResizeHandle>

          <Panel defaultSize={30} minSize={20} maxSize={45}>
            <div className="pl-4 space-y-6 h-full overflow-y-auto">
              <TaskSidebarTabs 
                task={task} 
                projectId={projectId} 
                subtasks={subtasks || []}
                isLoadingSubtasks={isSubtasksLoading}
                dependsOn={dependsOn}
                dependents={dependents}
                isLoadingDeps={isDepsLoading}
              />

              <Card className="bg-muted/10 border-dashed">
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Task ID: <span className="font-mono text-foreground">{task.id}</span></p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </Shell>
  );
}
