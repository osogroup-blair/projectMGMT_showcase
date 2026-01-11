import { useState, useMemo, useEffect } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Calendar,
  User,
  Users,
  Flag,
  Clock,
  CheckCircle2,
  AlertCircle,
  GripVertical,
  ChevronDown,
  LayoutGrid,
  List,
  Columns,
  Trash2,
  Loader2,
  Rows3,
  Zap
} from "lucide-react";
import { TaskCard, LayoutVariant } from "@/features/tasks/task-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useRoute, useLocation, Link } from "wouter";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Task } from "@/lib/mock-data";
import { useTasks, useProject, useMilestones, useUsers, useProjectStages, useEpics, useDeliverables, useSprints, useResolvedTaskTypes } from "@/hooks/use-nexus-data";
import { useTaskStatuses } from "@/hooks/use-task-statuses";
import { useCurrentUser } from "@/context/current-user-context";
import { EFFORT_VALUES } from "@shared/schema";
import { PortableKanban } from "@/components/kanban";

// Stage color mapping based on stage type/order
const STAGE_COLORS: Record<string, string> = {
  "st_plan": "border-purple-500/20 bg-purple-500/5",
  "st_validate": "border-blue-500/20 bg-blue-500/5",
  "st_develop": "border-indigo-500/20 bg-indigo-500/5",
  "st_enable": "border-green-500/20 bg-green-500/5"
};

const getStageColor = (stageId: string, order: number) => {
  if (STAGE_COLORS[stageId]) return STAGE_COLORS[stageId];
  const colors = ["border-purple-500/20 bg-purple-500/5", "border-blue-500/20 bg-blue-500/5", "border-indigo-500/20 bg-indigo-500/5", "border-amber-500/20 bg-amber-500/5", "border-green-500/20 bg-green-500/5"];
  return colors[(order - 1) % colors.length];
};

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  "High": { color: "text-red-600 bg-red-100", label: "High" },
  "Medium": { color: "text-amber-600 bg-amber-100", label: "Medium" },
  "Low": { color: "text-slate-600 bg-slate-100", label: "Low" }
};

export default function TaskBoard() {
  const [match, params] = useRoute("/projects/:projectId/tasks");
  const [, setLocation] = useLocation();
  const projectId = params?.projectId || "1";
  const { toast } = useToast();

  const { data: project, isLoading: isProjectLoading } = useProject(projectId);
  const { data: allTasks, isLoading: isTasksLoading, create: createTask, update: updateTask, remove: deleteTask } = useTasks();
  const { data: milestones, isLoading: isMilestonesLoading } = useMilestones();
  const { data: users, isLoading: isUsersLoading } = useUsers();
  const { data: projectStages, isLoading: isStagesLoading } = useProjectStages();
  const { data: allEpics, isLoading: isEpicsLoading } = useEpics();
  const { data: allDeliverables, isLoading: isDeliverablesLoading } = useDeliverables();
  const { data: allSprints } = useSprints();
  const { data: taskTypes } = useResolvedTaskTypes(projectId);
  const { currentUser } = useCurrentUser();
  const { statusLabels, defaultStatus } = useTaskStatuses();
  
  const projectSprints = useMemo(() => {
    if (!allSprints || !project) return [];
    return allSprints.filter((s: any) => s.projectId === project.id);
  }, [allSprints, project]);
  
  // Filter deliverables for this project
  const projectDeliverables = useMemo(() => {
    if (!allDeliverables || !project) return [];
    return allDeliverables.filter((d: any) => d.projectId === project.id);
  }, [allDeliverables, project]);
  
  // Filter epics for the current project (via deliverables)
  const projectEpics = useMemo(() => {
    if (!allEpics || !project || projectDeliverables.length === 0) return [];
    const deliverableIds = new Set(projectDeliverables.map((d: any) => d.id));
    return allEpics.filter((e: any) => deliverableIds.has(e.deliverableId));
  }, [allEpics, project, projectDeliverables]);

  // Get project-specific tasks first (needed to determine which stages belong to this project)
  const projectTasks = useMemo(() => {
    if (!project || !allTasks) return [];
    return allTasks.filter((t: any) => t.project === project.name || t.projectId === project.id);
  }, [project, allTasks]);

  // Extract unique stage IDs from project tasks AND project epics to scope stages to this project
  // This ensures stages show even if they have no tasks yet (from epic configuration)
  const projectStageIds = useMemo(() => {
    const stageIds = new Set<string>();
    // Add stage IDs from tasks
    projectTasks.forEach((t: any) => {
      if (t.stageId) stageIds.add(t.stageId);
    });
    // Add stage IDs from epics (epics define which stages belong to the project)
    projectEpics.forEach((e: any) => {
      if (e.stageIds && Array.isArray(e.stageIds)) {
        e.stageIds.forEach((sid: string) => stageIds.add(sid));
      }
    });
    return stageIds;
  }, [projectTasks, projectEpics]);

  // Map stages with colors, sorted by order - FILTERED to only stages used by this project
  const stages = useMemo(() => {
    if (!projectStages || projectStages.length === 0) return [];
    // Filter to only stages configured for this project (via tasks or epics)
    return [...projectStages]
      .filter((stage: any) => projectStageIds.has(stage.id))
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
      .map((stage: any) => ({
        ...stage,
        color: getStageColor(stage.id, stage.order)
      }));
  }, [projectStages, projectStageIds]);

  const [searchQuery, setSearchQuery] = useState("");
  const [viewType, setViewType] = useState<"board" | "list">("board");
  
  // Filters
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [milestoneFilter, setMilestoneFilter] = useState<string>("all");
  const [sprintFilter, setSprintFilter] = useState<string>("all");
  
  // Sidebar grouping
  const [groupBy, setGroupBy] = useState<"stage" | "status" | "epic" | "assignee" | "milestone">("stage");
  const [selectedSection, setSelectedSection] = useState<string>("all");

  // Group tasks by the selected groupBy criteria
  const groupedSections = useMemo(() => {
    if (groupBy === "stage") {
      return stages.map(stage => ({
        id: stage.id,
        name: stage.name,
        count: projectTasks.filter(t => t.stageId === stage.id).length
      }));
    }
    if (groupBy === "status") {
      return statusLabels.map(status => ({
        id: status,
        name: status,
        count: projectTasks.filter(t => t.status === status).length
      }));
    }
    if (groupBy === "epic") {
      const sections = projectEpics.map(epic => ({
        id: epic.id,
        name: epic.title || epic.name,
        count: projectTasks.filter(t => t.epicId === epic.id).length
      }));
      const unassigned = projectTasks.filter(t => !t.epicId).length;
      if (unassigned > 0) {
        sections.push({ id: "unassigned", name: "No Epic", count: unassigned });
      }
      return sections;
    }
    if (groupBy === "assignee") {
      const sections = users.map((user: any) => ({
        id: user.id,
        name: user.name,
        count: projectTasks.filter(t => t.assigneeId === user.id).length
      }));
      const unassigned = projectTasks.filter(t => !t.assigneeId).length;
      if (unassigned > 0) {
        sections.push({ id: "unassigned", name: "Unassigned", count: unassigned });
      }
      return sections;
    }
    if (groupBy === "milestone") {
      const sections = milestones.map((m: any) => ({
        id: m.id,
        name: m.name,
        count: projectTasks.filter(t => t.milestoneId === m.id).length
      }));
      const unassigned = projectTasks.filter(t => !t.milestoneId).length;
      if (unassigned > 0) {
        sections.push({ id: "unassigned", name: "No Milestone", count: unassigned });
      }
      return sections;
    }
    return [];
  }, [groupBy, stages, projectTasks, projectEpics, users, milestones]);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<Partial<Task>>({});

  // Reset selectedSection when groupBy changes
  useEffect(() => {
    setSelectedSection("all");
  }, [groupBy]);

  // Use the already filtered project tasks
  const tasks = projectTasks;

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.description?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesAssignee = assigneeFilter === "all" || t.assigneeId === assigneeFilter;
    const matchesMilestone = milestoneFilter === "all" || t.milestoneId === milestoneFilter;
    const matchesSprint = sprintFilter === "all" || 
      (sprintFilter === "backlog" ? !t.sprintId : t.sprintId === sprintFilter);
    
    // Filter by selected section in sidebar
    let matchesSection = true;
    if (selectedSection !== "all") {
      if (groupBy === "stage") matchesSection = t.stageId === selectedSection;
      else if (groupBy === "status") matchesSection = t.status === selectedSection;
      else if (groupBy === "epic") matchesSection = selectedSection === "unassigned" ? !t.epicId : t.epicId === selectedSection;
      else if (groupBy === "assignee") matchesSection = selectedSection === "unassigned" ? !t.assigneeId : t.assigneeId === selectedSection;
      else if (groupBy === "milestone") matchesSection = selectedSection === "unassigned" ? !t.milestoneId : t.milestoneId === selectedSection;
    }
    
    return matchesSearch && matchesAssignee && matchesMilestone && matchesSprint && matchesSection;
  });

  const handleOpenCreate = (stageId?: string, epicId?: string) => {
    if (!project) return;
    setEditingTask(null);
    // Default to "Action" task type, or isDefault, or first available
    const actionType = (taskTypes || []).find((tt: any) => tt.name === "Action");
    const defaultTaskType = actionType || (taskTypes || []).find((tt: any) => tt.isDefault) || (taskTypes || [])[0];
    setFormData({
      title: "",
      description: "",
      project: project.name, // Legacy field
      projectId: project.id, // New field
      stageId: stageId || (stages[0]?.id || "st_plan"),
      epicId: epicId || (projectEpics[0]?.id || ""),
      status: "BACKLOGGED",
      assigneeId: currentUser?.id || "",
      deadline: new Date().toISOString().split('T')[0],
      priority: "Medium",
      estimateHours: 0,
      effort: 3, // Default to Fibonacci value 3
      tags: [],
      taskTypeId: defaultTaskType?.id || null
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    // Navigate to task detail page
    setLocation(`/projects/${projectId}/tasks/${task.id}`);
  };

  const handleSave = () => {
    if (!formData.title || !formData.stageId || !formData.epicId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Title, Stage, and Epic are required).",
        variant: "destructive"
      });
      return;
    }

    if (editingTask) {
      updateTask({ id: editingTask.id, updates: formData });
    } else {
      createTask({
        ...formData,
        project: project?.name,
        projectId: project?.id
      });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteTask(id);
    setIsDialogOpen(false);
  };

  const getAssignee = (id?: string) => users.find((t: any) => t.id === id);
  const getMilestone = (id?: string) => milestones.find((m: any) => m.id === id);
  const getEpic = (id?: string) => projectEpics.find((e: any) => e.id === id);

  if (isProjectLoading || isTasksLoading || isMilestonesLoading || isUsersLoading || isStagesLoading || isEpicsLoading || isDeliverablesLoading) {
    return (
      <Shell>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  if (!project) return null;

  return (
    <Shell>
      <div className="h-[calc(100vh-8rem)] flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-6 shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-primary">Task Board</h1>
              <p className="text-muted-foreground">Manage and track tasks across project stages.</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center border rounded-md bg-card">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("h-9 w-9 rounded-none rounded-l-md", viewType === "board" && "bg-muted")}
                  onClick={() => setViewType("board")}
                >
                  <Columns className="h-4 w-4" />
                </Button>
                <div className="w-px h-full bg-border" />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("h-9 w-9 rounded-none rounded-r-md", viewType === "list" && "bg-muted")}
                  onClick={() => setViewType("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={() => handleOpenCreate()} className="gap-2">
                <Plus className="h-4 w-4" />
                New Task
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
              <SearchableSelect
                value={groupBy}
                onValueChange={(v: any) => setGroupBy(v)}
                placeholder="Group By"
                options={[
                  { value: "stage", label: "Stage" },
                  { value: "status", label: "Status" },
                  { value: "epic", label: "Epic" },
                  { value: "assignee", label: "Assignee" },
                  { value: "milestone", label: "Milestone" }
                ]}
                triggerClassName="w-[140px]"
              />

              <SearchableSelect
                value={assigneeFilter}
                onValueChange={setAssigneeFilter}
                placeholder="Assignee"
                options={[
                  { value: "all", label: "All Assignees" },
                  ...users.map((member: any) => ({ value: member.id, label: member.name }))
                ]}
                triggerClassName="w-[160px]"
              />

              <SearchableSelect
                value={milestoneFilter}
                onValueChange={setMilestoneFilter}
                placeholder="Milestone"
                options={[
                  { value: "all", label: "All Milestones" },
                  ...milestones.map((m: any) => ({ value: m.id, label: m.name }))
                ]}
                triggerClassName="w-[160px]"
              />

              <SearchableSelect
                value={sprintFilter}
                onValueChange={setSprintFilter}
                placeholder="Sprint"
                options={[
                  { value: "all", label: "All Sprints" },
                  { value: "backlog", label: "Backlog" },
                  ...projectSprints.map((s: any) => ({ value: s.id, label: s.name }))
                ]}
                triggerClassName="w-[160px]"
                data-testid="select-sprint-filter"
              />
              
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main content with sidebar */}
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Left Sidebar */}
          <div className="w-56 shrink-0 space-y-1 overflow-y-auto">
            <Button 
              variant={selectedSection === "all" ? "secondary" : "ghost"} 
              className="w-full justify-between text-sm h-9"
              onClick={() => setSelectedSection("all")}
              data-testid="sidebar-all-tasks"
            >
              <span>All Tasks</span>
              <Badge variant="outline" className="ml-2 font-mono text-xs">{projectTasks.length}</Badge>
            </Button>
            <div className="border-t my-2" />
            {groupedSections.map(section => (
              <Button 
                key={section.id}
                variant={selectedSection === section.id ? "secondary" : "ghost"}
                className="w-full justify-between text-sm h-9"
                onClick={() => setSelectedSection(section.id)}
                data-testid={`sidebar-section-${section.id}`}
              >
                <span className="truncate">{section.name}</span>
                <Badge variant="outline" className="ml-2 font-mono text-xs shrink-0">{section.count}</Badge>
              </Button>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
        {/* Board View */}
        {viewType === "board" ? (
          groupBy === "status" ? (
            <div className="h-[calc(100vh-280px)] min-h-[400px]">
              <PortableKanban
                tasks={filteredTasks}
                users={users || []}
                epics={projectEpics}
                milestones={milestones || []}
                projectId={projectId}
                boardId={`taskboard-${projectId}`}
                showFilters={false}
                showAddTask={true}
                onAddTask={() => handleOpenCreate()}
                hoverCard={{
                  enabled: true,
                  users: users || [],
                  onAssigneeChange: (taskId, assigneeId) => {
                    updateTask({ id: taskId, updates: { assigneeId } });
                  },
                }}
                onTaskMove={(taskId, newStatus) => {
                  updateTask({ id: taskId, updates: { status: newStatus } });
                  toast({ title: "Task Updated", description: `Task moved to ${newStatus}` });
                }}
              />
            </div>
          ) : (
          <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
            <div className="flex gap-6 h-full min-w-max">
              {stages.map(stage => {
                const stageTasks = filteredTasks.filter(t => t.stageId === stage.id);
                
                return (
                  <div key={stage.id} className="w-[320px] flex flex-col h-full rounded-xl bg-muted/30 border border-border/50">
                    {/* Column Header */}
                    <div 
                      className={cn("p-4 border-b flex items-center justify-between shrink-0 rounded-t-xl cursor-pointer hover:opacity-80 transition-opacity", stage.color)}
                      onClick={() => setLocation(`/projects/${projectId}?tab=stage-${stage.id}`)}
                      title={`View ${stage.name} stage details`}
                    >
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{stage.name}</h3>
                        <Badge variant="secondary" className="bg-background/50 text-foreground font-mono text-xs">
                          {stageTasks.length}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleOpenCreate(stage.id); }}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Tasks List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      {stageTasks.map(task => {
                        const assignee = getAssignee(task.assigneeId);
                        const priority = PRIORITY_CONFIG[task.priority];

                        return (
                          <Card 
                            key={task.id} 
                            className="shadow-sm hover:shadow-md transition-shadow cursor-pointer group bg-card"
                            onClick={() => handleOpenEdit(task)}
                          >
                            <CardContent className="p-3 space-y-3">
                              <div className="flex justify-between items-start gap-2">
                                <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 font-medium border-0", priority.color)}>
                                  {priority.label}
                                </Badge>
                                <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); /* Menu logic */ }}>
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </div>

                              <div>
                                <h4 className="font-medium text-sm leading-tight mb-1 line-clamp-2">{task.title}</h4>
                                {task.tags && task.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {task.tags.map((tag: string) => (
                                      <span key={tag} className="text-[10px] text-muted-foreground bg-muted px-1 rounded-sm">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between pt-1 border-t border-border/50">
                                {assignee ? (
                                  <div className="flex items-center gap-1.5" title={assignee.name}>
                                    <Avatar className="h-5 w-5">
                                      <AvatarFallback className="text-[9px]">{assignee.name.substring(0,2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs text-muted-foreground max-w-[80px] truncate">{assignee.name.split(' ')[0]}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <User className="h-3.5 w-3.5" />
                                    <span className="text-xs">Unassigned</span>
                                  </div>
                                )}
                                
                                <div className={cn(
                                  "flex items-center gap-1 text-xs",
                                  new Date(task.deadline) < new Date() ? "text-red-500 font-medium" : "text-muted-foreground"
                                )}>
                                  <Clock className="h-3 w-3" />
                                  <span>{new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                      
                      <Button variant="ghost" className="w-full text-muted-foreground text-xs py-2 h-auto hover:bg-muted/50 border border-dashed border-border" onClick={() => handleOpenCreate(stage.id)}>
                        <Plus className="h-3 w-3 mr-1.5" />
                        Add Task
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )
        ) : (
          <div className="flex-1 bg-card rounded-lg border shadow-sm flex flex-col">
            <div className="overflow-x-auto overflow-y-hidden">
              <div className="p-4 border-b bg-muted/30 font-medium text-sm grid gap-3 text-muted-foreground shrink-0" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", minWidth: "min-content" }}>
                <div>Task</div>
                <div>Stage</div>
                <div>Assignee</div>
                <div>Sprint</div>
                <div>Priority</div>
                <div>Due Date</div>
              </div>
            </div>
            <div className="overflow-x-auto overflow-y-auto h-full flex-1">
              <div style={{ minWidth: "min-content" }}>
                {filteredTasks.map(task => {
                  const assignee = getAssignee(task.assigneeId);
                  const stage = stages.find(s => s.id === task.stageId);
                  const priority = PRIORITY_CONFIG[task.priority];

                  return (
                    <div 
                      key={task.id} 
                      className="p-4 border-b last:border-0 grid gap-3 items-center hover:bg-muted/30 transition-colors text-sm group"
                      style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr" }}
                    >
                    <div className="font-medium flex items-center gap-2 cursor-pointer" onClick={() => handleOpenEdit(task)}>
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {task.title}
                    </div>
                    <div className="cursor-pointer" onClick={() => handleOpenEdit(task)}>
                      <Badge variant="outline" className="font-normal text-muted-foreground">
                        {stage?.name || "Unknown"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleOpenEdit(task)}>
                      {assignee ? (
                        <>
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[9px]">{assignee.name.substring(0,2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="truncate">{assignee.name}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground italic">Unassigned</span>
                      )}
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <SearchableSelect
                        value={task.sprintId || "backlog"}
                        onValueChange={(v) => updateTask({ id: task.id, updates: { sprintId: v === "backlog" ? undefined : v } })}
                        placeholder="Backlog"
                        options={[
                          { value: "backlog", label: "Backlog" },
                          ...projectSprints.map((s: any) => ({ value: s.id, label: s.name }))
                        ]}
                        triggerClassName="h-8"
                        data-testid={`select-sprint-${task.id}`}
                      />
                    </div>
                    <div className="cursor-pointer" onClick={() => handleOpenEdit(task)}>
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", priority.color)}>
                        {priority.label}
                      </span>
                    </div>
                    <div className="text-muted-foreground cursor-pointer" onClick={() => handleOpenEdit(task)}>
                      {new Date(task.deadline).toLocaleDateString()}
                    </div>
                  </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
          </div>
        </div>

        {/* Create/Edit Task Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[650px]">
            <DialogHeader>
              <DialogTitle>{editingTask ? "Edit Task" : "Create Task"}</DialogTitle>
              <DialogDescription>
                {editingTask ? "Update task details and progress." : "Add a new task to your project workflow."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Task Title</Label>
                <Input 
                  id="title" 
                  value={formData.title || ""} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Implement Login Page"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  value={formData.description || ""} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed explanation of the task..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="stage">Stage <span className="text-destructive">*</span></Label>
                  <SearchableSelect
                    value={formData.stageId}
                    onValueChange={(v) => setFormData({ ...formData, stageId: v })}
                    placeholder="Select stage"
                    options={stages.map(stage => ({ value: stage.id, label: stage.name }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="epic">Epic <span className="text-destructive">*</span></Label>
                  <SearchableSelect
                    value={formData.epicId || ""}
                    onValueChange={(v) => setFormData({ ...formData, epicId: v })}
                    placeholder="Select epic"
                    options={projectEpics.map((epic: any) => ({ value: epic.id, label: epic.title }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="assignee">Assignee</Label>
                  <SearchableSelect
                    value={formData.assigneeId}
                    onValueChange={(v) => setFormData({ ...formData, assigneeId: v })}
                    placeholder="Unassigned"
                    options={users.map((member: any) => ({ value: member.id, label: member.name }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="effort">Effort</Label>
                  <SearchableSelect
                    value={formData.effort?.toString() || "5"}
                    onValueChange={(v) => setFormData({ ...formData, effort: parseInt(v) })}
                    placeholder="Select effort"
                    options={EFFORT_VALUES.map(value => ({ value: value.toString(), label: value.toString() }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <SearchableSelect
                    value={formData.priority}
                    onValueChange={(v: any) => setFormData({ ...formData, priority: v })}
                    placeholder="Select priority"
                    options={[
                      { value: "High", label: "High" },
                      { value: "Medium", label: "Medium" },
                      { value: "Low", label: "Low" }
                    ]}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="deadline">Due Date</Label>
                  <Input 
                    id="deadline" 
                    type="date"
                    value={formData.deadline || ""} 
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="milestone">Milestone (Optional)</Label>
                  <SearchableSelect
                    value={formData.milestoneId || "none"}
                    onValueChange={(v) => setFormData({ ...formData, milestoneId: v === "none" ? undefined : v })}
                    placeholder="Select milestone"
                    options={[
                      { value: "none", label: "None" },
                      ...(milestones?.map((m: any) => ({ value: m.id, label: m.name })) || [])
                    ]}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="estimate">Estimate (Hours)</Label>
                  <Input 
                    id="estimate" 
                    type="number"
                    min="0"
                    value={formData.estimateHours || 0} 
                    onChange={(e) => setFormData({ ...formData, estimateHours: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              {editingTask && (
                 <div className="flex justify-between items-center pt-2 border-t">
                    <Button 
                      variant="ghost" 
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        handleDelete(editingTask.id);
                        setIsDialogOpen(false);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Task
                    </Button>
                 </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editingTask ? "Save Changes" : "Create Task"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Shell>
  );
}

// Group types for filter buttons
type GroupByType = "status" | "epic" | "stage" | "milestone" | "assignee";

const GROUP_BY_CONFIG: Record<GroupByType, { label: string; icon: any; color: string }> = {
  status: { label: "By Status", icon: CheckCircle2, color: "bg-green-500/10 text-green-700 border-green-200 hover:bg-green-500/20" },
  epic: { label: "By Epic", icon: LayoutGrid, color: "bg-purple-500/10 text-purple-700 border-purple-200 hover:bg-purple-500/20" },
  stage: { label: "By Stage", icon: Columns, color: "bg-blue-500/10 text-blue-700 border-blue-200 hover:bg-blue-500/20" },
  milestone: { label: "By Milestone", icon: Flag, color: "bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500/20" },
  assignee: { label: "By Assignee", icon: User, color: "bg-indigo-500/10 text-indigo-700 border-indigo-200 hover:bg-indigo-500/20" }
};

// Embeddable Task Board Content (without Shell wrapper)
export function TaskBoardContent({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: project, isLoading: isProjectLoading } = useProject(projectId);
  const { data: allTasks, isLoading: isTasksLoading, create: createTask, update: updateTask, remove: deleteTask } = useTasks();
  const { data: milestones, isLoading: isMilestonesLoading } = useMilestones();
  const { data: users, isLoading: isUsersLoading } = useUsers();
  const { data: projectStages, isLoading: isStagesLoading } = useProjectStages();
  const { data: allEpics, isLoading: isEpicsLoading } = useEpics();
  const { data: allDeliverables, isLoading: isDeliverablesLoading } = useDeliverables();
  const { data: taskTypes } = useResolvedTaskTypes(projectId);
  const { currentUser } = useCurrentUser();
  const { statusLabels, getStatusColor, defaultStatus } = useTaskStatuses();
  
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

  const projectStageIds = useMemo(() => {
    const stageIds = new Set<string>();
    projectTasks.forEach((t: any) => { if (t.stageId) stageIds.add(t.stageId); });
    projectEpics.forEach((e: any) => {
      if (e.stageIds && Array.isArray(e.stageIds)) {
        e.stageIds.forEach((sid: string) => stageIds.add(sid));
      }
    });
    return stageIds;
  }, [projectTasks, projectEpics]);

  const stages = useMemo(() => {
    if (!projectStages || projectStages.length === 0) return [];
    return [...projectStages]
      .filter((stage: any) => projectStageIds.has(stage.id))
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
      .map((stage: any) => ({ ...stage, color: getStageColor(stage.id, stage.order) }));
  }, [projectStages, projectStageIds]);

  const projectMilestones = useMemo(() => {
    if (!milestones || !project) return [];
    return milestones.filter((m: any) => m.projectId === project.id);
  }, [milestones, project]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeAccordion, setActiveAccordion] = useState<string>("status");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<Partial<Task>>({});
  
  // Filter state for chips
  const [priorityFilters, setPriorityFilters] = useState<string[]>([]);
  const [dueFilters, setDueFilters] = useState<string[]>([]);
  
  // Layout variant state
  const [layoutVariant, setLayoutVariant] = useState<LayoutVariant>("three-column");

  // Reset selectedSection when accordion changes
  useEffect(() => {
    setSelectedSection("all");
  }, [activeAccordion]);

  // All accordion sections computed once
  const accordionSections = useMemo(() => {
    return {
      status: statusLabels.map(s => ({ id: s, name: s, count: projectTasks.filter(t => t.status === s).length })),
      stage: stages.map((s: any) => ({ id: s.id, name: s.name, count: projectTasks.filter(t => t.stageId === s.id).length })),
      epic: (() => {
        const sections = projectEpics.map((e: any) => ({ id: e.id, name: e.title, count: projectTasks.filter(t => t.epicId === e.id).length }));
        const unassigned = projectTasks.filter(t => !t.epicId).length;
        if (unassigned > 0) sections.push({ id: "unassigned", name: "No Epic", count: unassigned });
        return sections;
      })(),
      assignee: (() => {
        const sections = users.map((u: any) => ({ id: u.id, name: u.name, count: projectTasks.filter(t => t.assigneeId === u.id).length }));
        const unassigned = projectTasks.filter(t => !t.assigneeId).length;
        if (unassigned > 0) sections.push({ id: "unassigned", name: "Unassigned", count: unassigned });
        return sections;
      })(),
      milestone: (() => {
        const sections = projectMilestones.map((m: any) => ({ id: m.id, name: m.name, count: projectTasks.filter(t => t.milestoneId === m.id).length }));
        const unassigned = projectTasks.filter(t => !t.milestoneId).length;
        if (unassigned > 0) sections.push({ id: "unassigned", name: "No Milestone", count: unassigned });
        return sections;
      })()
    };
  }, [stages, projectTasks, projectEpics, users, projectMilestones]);

  const sidebarSections = accordionSections[activeAccordion as keyof typeof accordionSections] || [];

  const filteredTasks = useMemo(() => {
    return projectTasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (t.description?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      
      // Filter by selected accordion section
      let matchesSection = true;
      if (selectedSection !== "all") {
        if (activeAccordion === "stage") matchesSection = t.stageId === selectedSection;
        else if (activeAccordion === "status") matchesSection = t.status === selectedSection;
        else if (activeAccordion === "epic") matchesSection = selectedSection === "unassigned" ? !t.epicId : t.epicId === selectedSection;
        else if (activeAccordion === "assignee") matchesSection = selectedSection === "unassigned" ? !t.assigneeId : t.assigneeId === selectedSection;
        else if (activeAccordion === "milestone") matchesSection = selectedSection === "unassigned" ? !t.milestoneId : t.milestoneId === selectedSection;
      }

      // Priority chip filter
      const matchesPriority = priorityFilters.length === 0 || priorityFilters.includes(t.priority);

      // Due date filter
      let matchesDue = true;
      if (dueFilters.length > 0) {
        const today = new Date();
        const deadline = new Date(t.deadline);
        const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        matchesDue = dueFilters.some(f => {
          if (f === "overdue") return diffDays < 0;
          if (f === "thisWeek") return diffDays >= 0 && diffDays <= 7;
          if (f === "later") return diffDays > 7;
          return true;
        });
      }

      return matchesSearch && matchesSection && matchesPriority && matchesDue;
    });
  }, [projectTasks, searchQuery, selectedSection, activeAccordion, priorityFilters, dueFilters]);

  const hasActiveFilters = priorityFilters.length > 0 || dueFilters.length > 0;
  const clearAllFilters = () => { setPriorityFilters([]); setDueFilters([]); };

  const handleOpenCreate = (stageId?: string, epicId?: string) => {
    if (!project) return;
    setEditingTask(null);
    // Default to "Action" task type, or isDefault, or first available
    const actionType = (taskTypes || []).find((tt: any) => tt.name === "Action");
    const defaultTaskType = actionType || (taskTypes || []).find((tt: any) => tt.isDefault) || (taskTypes || [])[0];
    setFormData({
      title: "", description: "", project: project.name, projectId: project.id,
      stageId: stageId || (stages[0]?.id || "st_plan"), epicId: epicId || (projectEpics[0]?.id || ""),
      status: "BACKLOGGED", assigneeId: currentUser?.id || "", deadline: new Date().toISOString().split('T')[0],
      priority: "Medium", estimateHours: 0, effort: 5, tags: [], taskTypeId: defaultTaskType?.id || null
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({ ...task, stageId: task.stageId || stages[0]?.id || "st_plan", epicId: task.epicId || projectEpics[0]?.id || "", effort: task.effort || 5 });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.stageId || !formData.epicId) {
      toast({ title: "Validation Error", description: "Please fill in all required fields (Title, Stage, and Epic are required).", variant: "destructive" });
      return;
    }
    if (editingTask) { updateTask({ id: editingTask.id, updates: formData }); }
    else { createTask({ ...formData, project: project?.name, projectId: project?.id }); }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => { deleteTask(id); setIsDialogOpen(false); };

  const getAssignee = (id?: string) => users.find((t: any) => t.id === id);
  const getMilestone = (id?: string) => milestones.find((m: any) => m.id === id);
  const getEpic = (id?: string) => projectEpics.find((e: any) => e.id === id);

  if (isProjectLoading || isTasksLoading || isMilestonesLoading || isUsersLoading || isStagesLoading || isEpicsLoading || isDeliverablesLoading) {
    return (<div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>);
  }

  if (!project) return null;

  return (
    <>
    <div className="flex gap-6">
      {/* Left Accordion Sidebar */}
      <div className="w-60 shrink-0 space-y-2">
        <Button 
          variant={selectedSection === "all" && activeAccordion === "" ? "secondary" : "ghost"} 
          className="w-full justify-between text-sm h-9"
          onClick={() => { setSelectedSection("all"); setActiveAccordion(""); }}
          data-testid="sidebar-all-tasks"
        >
          <span>All Tasks</span>
          <Badge variant="outline" className="ml-2 font-mono text-xs">{projectTasks.length}</Badge>
        </Button>
        
        <Accordion 
          type="single" 
          value={activeAccordion} 
          onValueChange={(val) => { setActiveAccordion(val); setSelectedSection("all"); }}
          className="w-full"
        >
          {(Object.keys(GROUP_BY_CONFIG) as GroupByType[]).map(key => {
            const config = GROUP_BY_CONFIG[key];
            const Icon = config.icon;
            const sections = accordionSections[key] || [];
            const totalCount = sections.reduce((sum: number, s: any) => sum + s.count, 0);
            
            return (
              <AccordionItem key={key} value={key} className="border rounded-lg mb-1 px-1">
                <AccordionTrigger className="py-2 px-2 hover:no-underline" data-testid={`accordion-${key}`}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{config.label.replace("By ", "")}</span>
                    <Badge variant="secondary" className="ml-1 font-mono text-xs">{totalCount}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-2 pt-0">
                  <div className="space-y-0.5 pl-6">
                    <Button 
                      variant={activeAccordion === key && selectedSection === "all" ? "secondary" : "ghost"} 
                      className="w-full justify-between text-xs h-7"
                      onClick={() => setSelectedSection("all")}
                      data-testid={`sidebar-${key}-all`}
                    >
                      <span>All</span>
                      <span className="text-muted-foreground font-mono">{totalCount}</span>
                    </Button>
                    {sections.map((section: any) => (
                      <Button 
                        key={section.id}
                        variant={selectedSection === section.id ? "secondary" : "ghost"}
                        className="w-full justify-between text-xs h-7"
                        onClick={() => setSelectedSection(section.id)}
                        data-testid={`sidebar-section-${section.id}`}
                      >
                        <span className="truncate">{section.name}</span>
                        <span className="text-muted-foreground font-mono shrink-0">{section.count}</span>
                      </Button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-4">
        {/* Search and New Task */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search tasks..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-tasks"
            />
          </div>
          <Button onClick={() => handleOpenCreate()} className="gap-2" data-testid="button-new-task">
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground font-medium">Priority:</span>
          {["High", "Medium", "Low"].map(p => (
            <Button
              key={p}
              variant={priorityFilters.includes(p) ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setPriorityFilters(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
              data-testid={`filter-priority-${p.toLowerCase()}`}
            >
              {p}
            </Button>
          ))}
          <div className="w-px h-4 bg-border mx-1" />
          <span className="text-xs text-muted-foreground font-medium">Due:</span>
          {[{ id: "overdue", label: "Overdue" }, { id: "thisWeek", label: "This Week" }, { id: "later", label: "Later" }].map(d => (
            <Button
              key={d.id}
              variant={dueFilters.includes(d.id) ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setDueFilters(prev => prev.includes(d.id) ? prev.filter(x => x !== d.id) : [...prev, d.id])}
              data-testid={`filter-due-${d.id}`}
            >
              {d.label}
            </Button>
          ))}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={clearAllFilters} data-testid="clear-filters">
              <X className="h-3 w-3" />
              Clear
            </Button>
          )}
          
          {/* Layout Toggle */}
          <div className="flex items-center gap-1 ml-auto border rounded-md p-0.5 bg-muted/30">
            <Button 
              variant={layoutVariant === "one-column" ? "secondary" : "ghost"} 
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={() => setLayoutVariant("one-column")}
              title="List view"
              data-testid="layout-one-column"
            >
              <Rows3 className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant={layoutVariant === "two-column" ? "secondary" : "ghost"} 
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={() => setLayoutVariant("two-column")}
              title="Two column grid"
              data-testid="layout-two-column"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant={layoutVariant === "three-column" ? "secondary" : "ghost"} 
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={() => setLayoutVariant("three-column")}
              title="Three column grid"
              data-testid="layout-three-column"
            >
              <Columns className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

          {/* Flat Task List */}
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
              const stage = stages.find((s: any) => s.id === task.stageId);

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
                  users={users.map((u: any) => ({ id: u.id, name: u.name }))}
                  stages={stages.map((s: any) => ({ id: s.id, name: s.name }))}
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
            <div className="text-center py-12 text-muted-foreground">
              <p>No tasks found matching your search.</p>
            </div>
          )}
        </div>
      </div>

      {/* Task Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "Create New Task"}</DialogTitle>
            <DialogDescription>
              {editingTask ? "Update the task details below." : "Fill out the form to create a new task."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Task Title</Label>
              <Input 
                id="title" 
                value={formData.title || ""} 
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Implement Login Page"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input 
                id="description" 
                value={formData.description || ""} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed explanation of the task..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="stage">Stage <span className="text-destructive">*</span></Label>
                <SearchableSelect
                  value={formData.stageId}
                  onValueChange={(v) => setFormData({ ...formData, stageId: v })}
                  placeholder="Select stage"
                  options={stages.map(stage => ({ value: stage.id, label: stage.name }))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="epic">Epic <span className="text-destructive">*</span></Label>
                <SearchableSelect
                  value={formData.epicId || ""}
                  onValueChange={(v) => setFormData({ ...formData, epicId: v })}
                  placeholder="Select epic"
                  options={projectEpics.map((epic: any) => ({ value: epic.id, label: epic.title }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="assignee">Assignee</Label>
                <SearchableSelect
                  value={formData.assigneeId}
                  onValueChange={(v) => setFormData({ ...formData, assigneeId: v })}
                  placeholder="Unassigned"
                  options={users.map((member: any) => ({ value: member.id, label: member.name }))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="effort">Effort</Label>
                <SearchableSelect
                  value={formData.effort?.toString() || "5"}
                  onValueChange={(v) => setFormData({ ...formData, effort: parseInt(v) })}
                  placeholder="Select effort"
                  options={EFFORT_VALUES.map(value => ({ value: value.toString(), label: value.toString() }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <SearchableSelect
                  value={formData.priority}
                  onValueChange={(v: any) => setFormData({ ...formData, priority: v })}
                  placeholder="Select priority"
                  options={[
                    { value: "High", label: "High" },
                    { value: "Medium", label: "Medium" },
                    { value: "Low", label: "Low" }
                  ]}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input 
                  id="deadline" 
                  type="date"
                  value={formData.deadline || ""} 
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="milestone">Milestone</Label>
                <SearchableSelect
                  value={formData.milestoneId || "none"}
                  onValueChange={(v) => setFormData({ ...formData, milestoneId: v === "none" ? undefined : v })}
                  placeholder="No milestone"
                  options={[
                    { value: "none", label: "No Milestone" },
                    ...milestones.map((m: any) => ({ value: m.id, label: m.name }))
                  ]}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="estimate">Estimate (Hours)</Label>
                <Input 
                  id="estimate" 
                  type="number"
                  min="0"
                  value={formData.estimateHours || 0} 
                  onChange={(e) => setFormData({ ...formData, estimateHours: parseInt(e.target.value) })}
                />
              </div>
            </div>

            {editingTask && (
               <div className="flex justify-between items-center pt-2 border-t">
                  <Button 
                    variant="ghost" 
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      handleDelete(editingTask.id);
                      setIsDialogOpen(false);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Task
                  </Button>
               </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingTask ? "Save Changes" : "Create Task"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
