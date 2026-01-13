import { useMemo, useState, useRef } from "react";
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
  GripVertical,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Gauge,
  Trash2
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { TaskAttachmentsTab } from "./task-attachments-tab";
import { TaskHistoryTab } from "./task-history-tab";
import { TaskPropertiesTab } from "./task-properties-tab";
import { TaskSidebarTabs } from "./task-sidebar-tabs";

const PRIORITY_CONFIG = {
  "High": { color: "text-red-600 bg-red-100", label: "High" },
  "Medium": { color: "text-amber-600 bg-amber-100", label: "Medium" },
  "Low": { color: "text-slate-600 bg-slate-100", label: "Low" }
};

const VALID_TABS = ["overview", "attachments", "properties", "history"] as const;
type TabValue = typeof VALID_TABS[number];

export default function TaskDetail() {
  const [match, params] = useRoute("/projects/:projectId/tasks/:taskId");
  const projectId = params?.projectId || "1";
  const taskId = params?.taskId || "1";
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const searchParams = new URLSearchParams(searchString);
  const tabParam = searchParams.get("tab") as TabValue | null;
  const activeTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : "overview";
  
  const handleTabChange = (tab: string) => {
    const newParams = new URLSearchParams(searchString);
    newParams.set("tab", tab);
    setLocation(`/projects/${projectId}/tasks/${taskId}?${newParams.toString()}`, { replace: true });
  };

  const { data: project, isLoading: isProjectLoading } = useProject(projectId);
  const { data: allTasks, isLoading: isTasksLoading, update: updateTask, remove: deleteTask } = useTasks();
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
    removeDependency,
    updateDependency
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

  const { statuses: taskStatusOptions, getStatusColor } = useTaskStatuses();

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

  const handleDeleteTask = async () => {
    if (!task) return;
    setIsDeleting(true);
    try {
      await deleteTask(task.id);
      toast({
        title: "Task Deleted",
        description: `"${task.title}" has been deleted.`,
      });
      setDeleteConfirmOpen(false);
      setLocation(`/projects/${projectId}/tasks`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete task.",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  const getAssignee = (id?: string | null) => users?.find((u: any) => u.id === id);
  const getMilestone = (id?: string | null) => milestones.find((m: any) => m.id === id);
  const getStage = (id?: string | null) => stages.find((s: any) => s.id === id);
  const getEpic = (id?: string | null) => allEpics?.find((e: any) => e.id === id);
  const getDeliverable = (id?: string | null) => allDeliverables?.find((d: any) => d.id === id);
  
  const epic = getEpic(task?.epicId);
  const deliverable = epic ? getDeliverable(epic.deliverableId) : null;
  const parentTask = useMemo(() => 
    task?.parentTaskId ? allTasks?.find((t: any) => t.id === task.parentTaskId) : null,
    [allTasks, task?.parentTaskId]
  );

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
        <PanelGroup direction="horizontal">
          {!leftPanelCollapsed && (
            <Panel defaultSize={rightPanelCollapsed ? 100 : 70} minSize={40}>
            <div className="pr-4 space-y-6 h-full overflow-y-auto">
            <div className="space-y-4">
              {/* Project Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
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
                {parentTask && (
                  <>
                    <span>/</span>
                    <Link 
                      href={`/projects/${projectId}/tasks/${parentTask.id}`}
                      className="hover:text-foreground hover:underline transition-colors flex items-center gap-1"
                      data-testid="link-parent-task"
                    >
                      <Layers className="h-3.5 w-3.5" />
                      {parentTask.title}
                    </Link>
                    <span className="text-xs text-muted-foreground/60">(parent)</span>
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid="button-task-menu">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="text-destructive focus:text-destructive cursor-pointer"
                      data-testid="menu-delete-task"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Task
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={cn("px-2 py-1 rounded text-xs font-medium border shadow-sm", getStatusColor(task.status))}>
                    <SearchableSelect
                      value={task.status || ""}
                      onValueChange={(v) => handleUpdateTask("status", v)}
                      placeholder="Status"
                      options={taskStatusOptions.map(s => ({ value: s.label, label: s.label }))}
                      className="border-none bg-transparent h-auto p-0 min-w-[80px] shadow-none focus:ring-0"
                      data-testid="inline-select-status"
                    />
                  </div>
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
                  <Gauge className="h-4 w-4 text-muted-foreground" />
                  <SearchableSelect
                    value={String(task.effort || "")}
                    onValueChange={(v) => handleUpdateTask("effort", parseInt(v))}
                    placeholder="Effort"
                    options={EFFORT_VALUES.map(val => ({ value: String(val), label: String(val) }))}
                    className="w-[80px] h-8"
                    data-testid="inline-select-effort"
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
                  value="attachments" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                  data-testid="tab-attachments"
                >
                  Attachments
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
                  epic={epic}
                  deliverable={deliverable}
                />
              </TabsContent>

              <TabsContent value="attachments" className="pt-6">
                <TaskAttachmentsTab 
                  task={task}
                  projectId={projectId}
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
          )}

          {!leftPanelCollapsed && !rightPanelCollapsed && (
            <PanelResizeHandle className="w-2 flex items-center justify-center hover:bg-muted/50 transition-colors">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </PanelResizeHandle>
          )}

          {!rightPanelCollapsed && (
            <Panel defaultSize={leftPanelCollapsed ? 100 : 30} minSize={25} maxSize={leftPanelCollapsed ? 100 : 50}>
            <div className="pl-4 space-y-4 h-full overflow-y-auto">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
                  data-testid="button-toggle-left-panel"
                >
                  {leftPanelCollapsed ? (
                    <><PanelLeftOpen className="h-4 w-4 mr-1" /> Show Main</>
                  ) : (
                    <><PanelLeftClose className="h-4 w-4 mr-1" /> Full Width</>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRightPanelCollapsed(true)}
                  data-testid="button-close-right-panel"
                >
                  <PanelRightClose className="h-4 w-4" />
                </Button>
              </div>
              
              <TaskSidebarTabs 
                task={task} 
                projectId={projectId} 
                subtasks={subtasks || []}
                isLoadingSubtasks={isSubtasksLoading}
                dependsOn={dependsOn}
                dependents={dependents}
                isLoadingDeps={isDepsLoading}
                allTasks={allTasks || []}
                stages={stages}
                allEpics={allEpics || []}
                milestones={milestones}
                users={users || []}
                addDependency={addDependency}
                removeDependency={removeDependency}
                updateDependency={updateDependency}
                createSubtask={createSubtask}
                updateTask={updateTask}
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
          )}

          {rightPanelCollapsed && !leftPanelCollapsed && (
            <div className="flex items-start p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRightPanelCollapsed(false)}
                data-testid="button-open-right-panel"
              >
                <PanelRightOpen className="h-4 w-4" />
              </Button>
            </div>
          )}
        </PanelGroup>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{task.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-delete-task"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
}
