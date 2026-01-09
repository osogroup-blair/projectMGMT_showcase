import { useState, useMemo } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  MoreHorizontal, 
  Calendar,
  User,
  Flag,
  Clock,
  Paperclip,
  MessageSquare,
  History as HistoryIcon,
  Send,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  Layers,
  Target,
  ChevronRight,
  Package,
  Zap,
  ListTodo
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useRoute, Link } from "wouter";
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
import { 
  Link2, 
  Link2Off, 
  Plus, 
  X as XIcon,
  GitBranch,
  Tag
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";

const PRIORITY_CONFIG = {
  "High": { color: "text-red-600 bg-red-100", label: "High" },
  "Medium": { color: "text-amber-600 bg-amber-100", label: "Medium" },
  "Low": { color: "text-slate-600 bg-slate-100", label: "Low" }
};

const STATUS_OPTIONS = ["Todo", "In Progress", "Review", "Done"];

export default function TaskDetail() {
  const [match, params] = useRoute("/projects/:projectId/tasks/:taskId");
  const projectId = params?.projectId || "1";
  const taskId = params?.taskId || "1";
  const { toast } = useToast();

  // Fetch data from database
  const { data: project, isLoading: isProjectLoading } = useProject(projectId);
  const { data: allTasks, isLoading: isTasksLoading, update: updateTask } = useTasks();
  const { data: users, isLoading: isUsersLoading } = useUsers();
  const { data: allEpics, isLoading: isEpicsLoading } = useEpics();
  const { data: allDeliverables, isLoading: isDeliverablesLoading } = useDeliverables();
  const { data: allMilestones, isLoading: isMilestonesLoading } = useMilestones();
  const { data: projectStages, isLoading: isStagesLoading } = useProjectStages();
  
  // Task Types, Dependencies, and Subtasks
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

  // Local state for comments
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([
    { id: "c1", authorName: "Joy Mason", body: "Initial task setup complete.", createdAt: new Date().toISOString() }
  ]);
  
  // Local state for subtasks and dependencies dialogs
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [showAddDependency, setShowAddDependency] = useState(false);
  const [selectedDependencyTaskId, setSelectedDependencyTaskId] = useState("");

  // Derive task and related data
  const task = useMemo(() => allTasks?.find((t: any) => t.id === taskId), [allTasks, taskId]);
  const epic = useMemo(() => allEpics?.find((e: any) => e.id === task?.epicId), [allEpics, task]);
  const deliverable = useMemo(() => allDeliverables?.find((d: any) => d.id === epic?.deliverableId), [allDeliverables, epic]);
  
  // Filter milestones and stages for this project
  const milestones = useMemo(() => 
    (allMilestones || []).filter((m: any) => m.projectId === projectId),
    [allMilestones, projectId]
  );
  
  const stages = useMemo(() => projectStages || [], [projectStages]);
  
  // Get task type for this task
  const taskType = useMemo(() => 
    (taskTypes || []).find((tt: any) => tt.id === task?.taskTypeId),
    [taskTypes, task]
  );
  
  // Available tasks for dependencies (exclude self, already added deps, and subtasks)
  const availableTasksForDeps = useMemo(() => {
    const existingDepIds = (dependsOn || []).map((d: any) => d.dependsOnTaskId);
    const subtaskIds = (subtasks || []).map((s: any) => s.id);
    return (allTasks || []).filter((t: any) => 
      t.id !== taskId && 
      !existingDepIds.includes(t.id) &&
      !subtaskIds.includes(t.id) &&
      t.parentTaskId !== taskId // Exclude subtasks of this task
    );
  }, [allTasks, taskId, dependsOn, subtasks]);
  
  // Subtask progress calculation
  const subtaskProgress = useMemo(() => {
    if (!subtasks || subtasks.length === 0) return 0;
    const completed = subtasks.filter((s: any) => s.status === "Done").length;
    return Math.round((completed / subtasks.length) * 100);
  }, [subtasks]);

  const isLoading = isProjectLoading || isTasksLoading || isUsersLoading || isEpicsLoading || isDeliverablesLoading || isMilestonesLoading || isStagesLoading;

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

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment = {
      id: `c_${Date.now()}`,
      authorName: "Current User",
      body: newComment,
      createdAt: new Date().toISOString()
    };
    
    setComments(prev => [...prev, comment]);
    setNewComment("");
    toast({
      title: "Comment Added",
      description: "Your comment has been posted.",
    });
  };

  const getAssignee = (id?: string | null) => users?.find((u: any) => u.id === id);
  const getMilestone = (id?: string | null) => milestones.find((m: any) => m.id === id);
  const getStage = (id?: string | null) => stages.find((s: any) => s.id === id);
  const getTaskById = (id: string) => allTasks?.find((t: any) => t.id === id);
  
  const handleCreateSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    createSubtask({
      title: newSubtaskTitle.trim(),
      epicId: task.epicId,
      projectId: projectId
    });
    setNewSubtaskTitle("");
  };
  
  const handleAddDependency = () => {
    if (!selectedDependencyTaskId) return;
    addDependency(selectedDependencyTaskId);
    setSelectedDependencyTaskId("");
    setShowAddDependency(false);
  };
  
  const handleRemoveDependency = (dependencyId: string) => {
    removeDependency(dependencyId);
  };

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
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Task Header */}
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

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Description</Label>
              <Textarea 
                className="min-h-[150px] resize-none"
                value={task.description || ""}
                onChange={(e) => handleUpdateTask("description", e.target.value)}
                placeholder="Add a more detailed description..."
                data-testid="textarea-task-description"
              />
            </div>

            {/* Subtasks Section */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <ListTodo className="h-4 w-4" />
                    Subtasks
                    {subtasks && subtasks.length > 0 && (
                      <Badge variant="secondary" className="ml-2 font-normal">
                        {subtasks.filter((s: any) => s.status === "Done").length}/{subtasks.length}
                      </Badge>
                    )}
                  </CardTitle>
                </div>
                {subtasks && subtasks.length > 0 && (
                  <Progress value={subtaskProgress} className="h-1 mt-2" />
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {subtasks && subtasks.length > 0 ? (
                  <div className="space-y-2">
                    {subtasks.map((subtask: any) => (
                      <Link 
                        key={subtask.id}
                        href={`/projects/${projectId}/tasks/${subtask.id}`}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors group"
                        data-testid={`subtask-${subtask.id}`}
                      >
                        <Checkbox 
                          checked={subtask.status === "Done"}
                          onCheckedChange={(checked) => {
                            updateTask({ 
                              id: subtask.id, 
                              updates: { status: checked ? "Done" : "Todo" } 
                            });
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className={cn(
                          "flex-1 text-sm",
                          subtask.status === "Done" && "line-through text-muted-foreground"
                        )}>
                          {subtask.title}
                        </span>
                        <Badge variant="outline" className="text-xs opacity-0 group-hover:opacity-100">
                          {subtask.status}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No subtasks yet.</p>
                )}
                
                <div className="flex gap-2 pt-2">
                  <Input 
                    placeholder="Add a subtask..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateSubtask()}
                    data-testid="input-new-subtask"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleCreateSubtask}
                    disabled={!newSubtaskTitle.trim()}
                    data-testid="button-add-subtask"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Dependencies Section */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <GitBranch className="h-4 w-4" />
                    Dependencies
                  </CardTitle>
                  <Dialog open={showAddDependency} onOpenChange={setShowAddDependency}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" data-testid="button-add-dependency">
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Dependency</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                          Select a task that must be completed before this task can start.
                        </p>
                        <Select 
                          value={selectedDependencyTaskId} 
                          onValueChange={setSelectedDependencyTaskId}
                        >
                          <SelectTrigger data-testid="select-dependency-task">
                            <SelectValue placeholder="Select a task..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTasksForDeps.map((t: any) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowAddDependency(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleAddDependency}
                            disabled={!selectedDependencyTaskId}
                            data-testid="button-confirm-add-dependency"
                          >
                            Add Dependency
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Blocked By (dependencies this task has) */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Link2Off className="h-3 w-3" />
                    Blocked By
                  </Label>
                  {dependsOn && dependsOn.length > 0 ? (
                    <div className="space-y-1">
                      {dependsOn.map((dep: any) => {
                        const depTask = getTaskById(dep.dependsOnTaskId);
                        return (
                          <div 
                            key={dep.id} 
                            className="flex items-center justify-between p-2 rounded-md bg-muted/30 group"
                            data-testid={`dependency-blocked-by-${dep.id}`}
                          >
                            <Link 
                              href={`/projects/${projectId}/tasks/${dep.dependsOnTaskId}`}
                              className="flex items-center gap-2 text-sm hover:underline"
                            >
                              <span className={cn(
                                depTask?.status === "Done" && "line-through text-muted-foreground"
                              )}>
                                {depTask?.title || "Unknown task"}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {depTask?.status || "Unknown"}
                              </Badge>
                            </Link>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="opacity-0 group-hover:opacity-100"
                              onClick={() => handleRemoveDependency(dep.id)}
                              data-testid={`button-remove-dependency-${dep.id}`}
                            >
                              <XIcon className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No blocking tasks.</p>
                  )}
                </div>

                <Separator />

                {/* Blocking (tasks that depend on this task) */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Link2 className="h-3 w-3" />
                    Blocking
                  </Label>
                  {dependents && dependents.length > 0 ? (
                    <div className="space-y-1">
                      {dependents.map((dep: any) => {
                        const depTask = getTaskById(dep.taskId);
                        return (
                          <Link 
                            key={dep.id}
                            href={`/projects/${projectId}/tasks/${dep.taskId}`}
                            className="flex items-center justify-between p-2 rounded-md bg-muted/30 hover:bg-muted/50"
                            data-testid={`dependency-blocking-${dep.id}`}
                          >
                            <div className="flex items-center gap-2 text-sm">
                              <span>{depTask?.title || "Unknown task"}</span>
                              <Badge variant="outline" className="text-xs">
                                {depTask?.status || "Unknown"}
                              </Badge>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not blocking any tasks.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabs: Comments, Attachments, History */}
            <Tabs defaultValue="comments" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                <TabsTrigger 
                  value="comments" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 gap-2"
                  data-testid="tab-comments"
                >
                  <MessageSquare className="h-4 w-4" />
                  Comments ({comments.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="attachments" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 gap-2"
                  data-testid="tab-attachments"
                >
                  <Paperclip className="h-4 w-4" />
                  Attachments
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 gap-2"
                  data-testid="tab-history"
                >
                  <HistoryIcon className="h-4 w-4" />
                  History
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="comments" className="pt-6 space-y-6">
                {/* Comment Input */}
                <div className="flex gap-4">
                  <Avatar>
                    <AvatarFallback>CU</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea 
                      placeholder="Write a comment..." 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      data-testid="textarea-new-comment"
                    />
                    <div className="flex justify-end">
                      <Button 
                        size="sm" 
                        onClick={handleAddComment} 
                        disabled={!newComment.trim()}
                        data-testid="button-post-comment"
                      >
                        <Send className="h-3 w-3 mr-2" />
                        Post Comment
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4 group" data-testid={`comment-${comment.id}`}>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{comment.authorName.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{comment.authorName}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-foreground/90 leading-relaxed">
                          {comment.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="attachments" className="pt-6">
                <Card className="border-dashed flex items-center justify-center p-6 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Paperclip className="h-6 w-6" />
                    <span className="text-sm font-medium">Upload File</span>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="pt-6">
                <p className="text-sm text-muted-foreground">No history available.</p>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar Properties */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Task Type</Label>
                  <Select 
                    value={task.taskTypeId || ""} 
                    onValueChange={(v) => handleUpdateTask("taskTypeId", v || null)}
                  >
                    <SelectTrigger data-testid="select-task-type">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span>{taskType?.name || "Select type"}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {(taskTypes || []).map((tt: any) => (
                        <SelectItem key={tt.id} value={tt.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: tt.color || '#6b7280' }}
                            />
                            <span>{tt.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select 
                    value={task.status} 
                    onValueChange={(v) => handleUpdateTask("status", v)}
                  >
                    <SelectTrigger data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Stage</Label>
                  <Select 
                    value={task.stageId || ""} 
                    onValueChange={(v) => handleUpdateTask("stageId", v)}
                  >
                    <SelectTrigger data-testid="select-stage">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Epic</Label>
                  <Select 
                    value={task.epicId || ""} 
                    onValueChange={(v) => handleUpdateTask("epicId", v)}
                  >
                    <SelectTrigger data-testid="select-epic">
                      <SelectValue placeholder="Select epic" />
                    </SelectTrigger>
                    <SelectContent>
                      {(allEpics || []).map((e: any) => (
                        <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Assignee</Label>
                  <Select 
                    value={task.assigneeId || "unassigned"} 
                    onValueChange={(v) => handleUpdateTask("assigneeId", v === "unassigned" ? null : v)}
                  >
                    <SelectTrigger data-testid="select-assignee">
                      <div className="flex items-center gap-2">
                        {task.assigneeId && getAssignee(task.assigneeId) ? (
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[8px]">{getAssignee(task.assigneeId)?.name.substring(0,2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        ) : <User className="h-4 w-4" />}
                        <span className="truncate">{getAssignee(task.assigneeId)?.name || "Unassigned"}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {(users || []).map((member: any) => (
                        <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Priority</Label>
                  <Select 
                    value={task.priority} 
                    onValueChange={(v) => handleUpdateTask("priority", v)}
                  >
                    <SelectTrigger data-testid="select-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Effort (Fibonacci)</Label>
                  <Select 
                    value={String(task.effort || "")} 
                    onValueChange={(v) => handleUpdateTask("effort", parseInt(v))}
                  >
                    <SelectTrigger data-testid="select-effort">
                      <SelectValue placeholder="Select effort" />
                    </SelectTrigger>
                    <SelectContent>
                      {EFFORT_VALUES.map(val => (
                        <SelectItem key={val} value={String(val)}>{val}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

                <Separator />

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Milestone</Label>
                  <Select 
                    value={task.milestoneId || "none"} 
                    onValueChange={(v) => handleUpdateTask("milestoneId", v === "none" ? null : v)}
                  >
                    <SelectTrigger data-testid="select-milestone">
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{getMilestone(task.milestoneId)?.name || "No Milestone"}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {milestones.map((m: any) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              </CardContent>
            </Card>

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
