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
  ChevronDown,
  Settings2
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { EFFORT_VALUES } from "@shared/schema";
import { TaskOverviewTab } from "./task-overview-tab";
import { TaskSubtasksTab } from "./task-subtasks-tab";
import { TaskAttachmentsTab } from "./task-attachments-tab";
import { TaskDependenciesTab } from "./task-dependencies-tab";
import { TaskHistoryTab } from "./task-history-tab";
import { TaskCommentsPanel } from "./task-comments-panel";

const PRIORITY_CONFIG = {
  "High": { color: "text-red-600 bg-red-100", label: "High" },
  "Medium": { color: "text-amber-600 bg-amber-100", label: "Medium" },
  "Low": { color: "text-slate-600 bg-slate-100", label: "Low" }
};

const STATUS_OPTIONS = ["Todo", "In Progress", "Review", "Done"];

const VALID_TABS = ["overview", "subtasks", "attachments", "dependents", "history"] as const;
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
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                <Input 
                  className="text-2xl font-bold border-none shadow-none px-0 h-auto focus-visible:ring-0"
                  value={task.title}
                  onChange={(e) => handleUpdateTask("title", e.target.value)}
                  data-testid="input-task-title"
                />
                <Button variant="ghost" size="icon" data-testid="button-task-menu">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {getStage(task.stageId) && (
                  <Badge variant="outline" className="font-medium" data-testid="badge-stage">
                    <Layers className="h-3 w-3 mr-1" />
                    {getStage(task.stageId)?.name}
                  </Badge>
                )}
                <Badge 
                  variant="outline" 
                  className={cn("font-medium border-0", PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]?.color)}
                  data-testid="badge-priority"
                >
                  {task.priority} Priority
                </Badge>
                {task.effort && (
                  <Badge variant="secondary" className="font-normal" data-testid="badge-effort">
                    <Target className="h-3 w-3 mr-1" />
                    Effort: {task.effort}
                  </Badge>
                )}
                {task.tags?.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="font-normal text-muted-foreground">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <Collapsible defaultOpen={false}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between" data-testid="accordion-metadata-trigger">
                  <span className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    Properties & Relationships
                  </span>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Task Type</Label>
                        <SearchableSelect
                          value={task.taskTypeId || ""}
                          onValueChange={(v) => handleUpdateTask("taskTypeId", v || null)}
                          placeholder="Select type"
                          options={(taskTypes || []).map((tt: any) => ({ value: tt.id, label: tt.name }))}
                          data-testid="select-task-type"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Status</Label>
                        <SearchableSelect
                          value={task.status}
                          onValueChange={(v) => handleUpdateTask("status", v)}
                          placeholder="Select status"
                          options={STATUS_OPTIONS.map(status => ({ value: status, label: status }))}
                          data-testid="select-status"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Stage</Label>
                        <SearchableSelect
                          value={task.stageId || ""}
                          onValueChange={(v) => handleUpdateTask("stageId", v)}
                          placeholder="Select stage"
                          options={stages.map((s: any) => ({ value: s.id, label: s.name }))}
                          data-testid="select-stage"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Epic</Label>
                        <SearchableSelect
                          value={task.epicId || ""}
                          onValueChange={(v) => handleUpdateTask("epicId", v)}
                          placeholder="Select epic"
                          options={(allEpics || []).map((e: any) => ({ value: e.id, label: e.title }))}
                          data-testid="select-epic"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Assignee</Label>
                        <SearchableSelect
                          value={task.assigneeId || "unassigned"}
                          onValueChange={(v) => handleUpdateTask("assigneeId", v === "unassigned" ? null : v)}
                          placeholder="Select assignee"
                          options={[
                            { value: "unassigned", label: "Unassigned" },
                            ...(users || []).map((member: any) => ({ value: member.id, label: member.name }))
                          ]}
                          data-testid="select-assignee"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Priority</Label>
                        <SearchableSelect
                          value={task.priority}
                          onValueChange={(v) => handleUpdateTask("priority", v)}
                          placeholder="Select priority"
                          options={[
                            { value: "High", label: "High" },
                            { value: "Medium", label: "Medium" },
                            { value: "Low", label: "Low" }
                          ]}
                          data-testid="select-priority"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Effort (Fibonacci)</Label>
                        <SearchableSelect
                          value={String(task.effort || "")}
                          onValueChange={(v) => handleUpdateTask("effort", parseInt(v))}
                          placeholder="Select effort"
                          options={EFFORT_VALUES.map(val => ({ value: String(val), label: String(val) }))}
                          data-testid="select-effort"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Due Date</Label>
                        <Input 
                          type="date" 
                          value={task.deadline || ""}
                          onChange={(e) => handleUpdateTask("deadline", e.target.value)}
                          data-testid="input-deadline"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Milestone</Label>
                        <SearchableSelect
                          value={task.milestoneId || "none"}
                          onValueChange={(v) => handleUpdateTask("milestoneId", v === "none" ? null : v)}
                          placeholder="Select milestone"
                          options={[
                            { value: "none", label: "None" },
                            ...milestones.map((m: any) => ({ value: m.id, label: m.name }))
                          ]}
                          data-testid="select-milestone"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Estimate (Hours)</Label>
                        <div className="relative">
                          <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="number" 
                            className="pl-9"
                            value={task.estimateHours || 0}
                            onChange={(e) => handleUpdateTask("estimateHours", parseInt(e.target.value) || 0)}
                            data-testid="input-estimate-hours"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>

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
                  Dependents
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

              <TabsContent value="history" className="pt-6">
                <TaskHistoryTab 
                  task={task}
                  projectId={projectId}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <TaskCommentsPanel task={task} projectId={projectId} />

            <Card className="bg-muted/10 border-dashed">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Project: <span className="font-medium text-foreground">{project?.name || task.project}</span></p>
                  <p>Task ID: <span className="font-mono text-foreground">{task.id}</span></p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  );
}
