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
  useProjectStages
} from "@/hooks/use-nexus-data";
import { EFFORT_VALUES } from "@shared/schema";

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

  // Local state for comments
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([
    { id: "c1", authorName: "Joy Mason", body: "Initial task setup complete.", createdAt: new Date().toISOString() }
  ]);

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
      <div className="mx-auto max-w-5xl space-y-6">
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
