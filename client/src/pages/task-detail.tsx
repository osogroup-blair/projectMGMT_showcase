import { useState } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  ArrowLeft, 
  MoreHorizontal, 
  Calendar,
  User,
  Flag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  MessageSquare,
  History as HistoryIcon,
  Send,
  Download,
  Trash2,
  FileText,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useRoute, Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  PROJECTS, 
  TASKS, 
  TEAM, 
  MILESTONES, 
  COMMENTS, 
  ATTACHMENTS, 
  HISTORY,
  Task, 
  Comment, 
  Attachment 
} from "@/lib/mock-data";

// Reuse Mock Stages
const MOCK_STAGES = [
  { id: "s1", name: "Discovery", color: "border-purple-500/20 bg-purple-500/5" },
  { id: "s2", name: "Design", color: "border-blue-500/20 bg-blue-500/5" },
  { id: "s3", name: "Development", color: "border-indigo-500/20 bg-indigo-500/5" },
  { id: "s4", name: "QA & Testing", color: "border-amber-500/20 bg-amber-500/5" },
  { id: "s5", name: "Launch", color: "border-green-500/20 bg-green-500/5" }
];

const PRIORITY_CONFIG = {
  "High": { color: "text-red-600 bg-red-100", label: "High" },
  "Medium": { color: "text-amber-600 bg-amber-100", label: "Medium" },
  "Low": { color: "text-slate-600 bg-slate-100", label: "Low" }
};

export default function TaskDetail() {
  const [match, params] = useRoute("/projects/:projectId/tasks/:taskId");
  const [, setLocation] = useLocation();
  const projectId = params?.projectId || "1";
  const taskId = params?.taskId || "1";
  const { toast } = useToast();

  const project = PROJECTS.find(p => p.id === projectId) || PROJECTS[0];
  const initialTask = TASKS.find(t => t.id === taskId) || TASKS[0];

  const [task, setTask] = useState<Task>(initialTask);
  const [comments, setComments] = useState<Comment[]>(COMMENTS);
  const [newComment, setNewComment] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>(ATTACHMENTS);

  const handleUpdateTask = (field: keyof Task, value: any) => {
    setTask(prev => ({ ...prev, [field]: value }));
    toast({
      title: "Task Updated",
      description: "Changes saved successfully.",
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: `c_${Date.now()}`,
      taskId: task.id,
      authorId: "1", // Mock current user
      authorName: "Joy Mason",
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

  const getAssignee = (id?: string) => TEAM.find(t => t.id === id);
  const getMilestone = (id?: string) => MILESTONES.find(m => m.id === id);
  const getStage = (id?: string) => MOCK_STAGES.find(s => s.id === id);

  return (
    <Shell>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={`/projects/${projectId}/tasks`} className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Board
          </Link>
          <span className="text-border">|</span>
          <span className="font-mono text-xs text-muted-foreground">{task.id}</span>
        </div>

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
                />
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className={cn("font-medium", getStage(task.stageId)?.color)}>
                  {getStage(task.stageId)?.name}
                </Badge>
                <Badge variant="outline" className={cn("font-medium border-0", PRIORITY_CONFIG[task.priority].color)}>
                  {PRIORITY_CONFIG[task.priority].label} Priority
                </Badge>
                {task.tags?.map(tag => (
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
              />
            </div>

            {/* Tabs: Activity, Comments, Attachments */}
            <Tabs defaultValue="comments" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                <TabsTrigger 
                  value="comments" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Comments ({comments.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="attachments" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 gap-2"
                >
                  <Paperclip className="h-4 w-4" />
                  Attachments ({attachments.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 gap-2"
                >
                  <HistoryIcon className="h-4 w-4" />
                  History
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="comments" className="pt-6 space-y-6">
                {/* Comment Input */}
                <div className="flex gap-4">
                  <Avatar>
                    <AvatarFallback>JM</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea 
                      placeholder="Write a comment..." 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                        <Send className="h-3 w-3 mr-2" />
                        Post Comment
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4 group">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {attachments.map((file) => (
                    <Card key={file.id} className="overflow-hidden group">
                      <div className="p-3 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          {file.fileType === "PDF" ? <FileText className="h-5 w-5 text-red-500" /> : <ImageIcon className="h-5 w-5 text-blue-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.fileName}</p>
                          <p className="text-xs text-muted-foreground">{file.size} • {new Date(file.uploadedAt).toLocaleDateString()}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                  <Card className="border-dashed flex items-center justify-center p-6 hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Paperclip className="h-6 w-6" />
                      <span className="text-sm font-medium">Upload File</span>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="history" className="pt-6">
                <div className="space-y-6 relative pl-4 border-l">
                  {HISTORY.map((event) => (
                    <div key={event.id} className="relative">
                      <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-muted-foreground/30 ring-4 ring-background" />
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">{event.changedBy}</span> changed 
                          <span className="font-medium"> {event.field} </span> 
                          from <span className="line-through text-muted-foreground">{event.oldValue}</span> to <span className="text-primary font-medium">{event.newValue}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{new Date(event.changedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
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
                    onValueChange={(v: any) => handleUpdateTask("status", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todo">Todo</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Review">Review</SelectItem>
                      <SelectItem value="Done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Stage</Label>
                  <Select 
                    value={task.stageId} 
                    onValueChange={(v: any) => handleUpdateTask("stageId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_STAGES.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Assignee</Label>
                  <Select 
                    value={task.assigneeId} 
                    onValueChange={(v: any) => handleUpdateTask("assigneeId", v)}
                  >
                    <SelectTrigger>
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
                      {TEAM.map(member => (
                        <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Priority</Label>
                  <Select 
                    value={task.priority} 
                    onValueChange={(v: any) => handleUpdateTask("priority", v)}
                  >
                    <SelectTrigger>
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
                  <Label className="text-xs text-muted-foreground">Due Date</Label>
                  <Input 
                    type="date" 
                    value={task.deadline}
                    onChange={(e) => handleUpdateTask("deadline", e.target.value)}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Milestone</Label>
                  <Select 
                    value={task.milestoneId || "none"} 
                    onValueChange={(v: any) => handleUpdateTask("milestoneId", v === "none" ? undefined : v)}
                  >
                    <SelectTrigger>
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{getMilestone(task.milestoneId)?.name || "No Milestone"}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {MILESTONES.map(m => (
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
                      onChange={(e) => handleUpdateTask("estimateHours", parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/10 border-dashed">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Created by <span className="font-medium text-foreground">Joy Mason</span> on Nov 15, 2023</p>
                  <p>Last updated by <span className="font-medium text-foreground">Nigel Wong</span> 2 hours ago</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  );
}
