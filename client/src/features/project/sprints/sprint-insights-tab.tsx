import { useState, useMemo } from "react";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle,
  AlertCircle,
  Target,
  Calendar,
  TrendingUp,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Square,
  FileText,
  Pause
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { format, differenceInDays, parseISO, isAfter, isBefore } from "date-fns";

interface SprintTask {
  id: string;
  title: string;
  status: string;
  priority?: string;
  dueDate?: string;
  updatedAt?: string;
  epicId?: string;
  epicName?: string;
  blocked?: boolean;
  blockerReason?: string;
}

interface SprintInsightsTabProps {
  sprint: any;
  tasks: SprintTask[];
  projectId: string;
  projectSprints: any[];
  isReadOnly: boolean;
  onCloseSprint: () => void;
  onNotesChange?: (notes: string) => void;
  onRolloverTasks?: (decisions: { taskId: string; action: string; targetSprintId?: string }[]) => void;
}

type RolloverAction = "next_sprint" | "backlog" | "close";

interface TaskRolloverDecision {
  taskId: string;
  action: RolloverAction;
  targetSprintId?: string;
}

export function SprintInsightsTab({ 
  sprint, 
  tasks, 
  projectId, 
  projectSprints,
  isReadOnly,
  onCloseSprint,
  onNotesChange,
  onRolloverTasks 
}: SprintInsightsTabProps) {
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closeStep, setCloseStep] = useState<1 | 2 | 3>(1);
  const [rolloverDecisions, setRolloverDecisions] = useState<Record<string, RolloverAction>>({});
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(sprint?.notes || "");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    "in-progress": true,
    "not-started": true,
    "blocked": true,
  });

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => ["Done", "Completed", "Complete"].some(s => t.status?.toLowerCase() === s.toLowerCase())).length;
    const inProgress = tasks.filter(t => ["In Progress", "Review", "In Review"].some(s => t.status?.toLowerCase() === s.toLowerCase())).length;
    const notStarted = tasks.filter(t => ["To Do", "Todo", "Pending", "Backlog", "Not Started"].some(s => t.status?.toLowerCase() === s.toLowerCase())).length;
    const blocked = tasks.filter(t => t.status?.toLowerCase() === "blocked" || t.blocked).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, inProgress, notStarted, blocked, percent };
  }, [tasks]);

  const velocityProxy = useMemo(() => {
    if (stats.total === 0) return 0;
    return Math.round((stats.done / stats.total) * 100);
  }, [stats]);

  const sprintDuration = useMemo(() => {
    if (!sprint?.startDate || !sprint?.endDate) return null;
    try {
      const start = parseISO(sprint.startDate);
      const end = parseISO(sprint.endDate);
      const total = differenceInDays(end, start);
      const elapsed = Math.max(0, differenceInDays(new Date(), start));
      return { total, elapsed, remaining: Math.max(0, total - elapsed) };
    } catch {
      return null;
    }
  }, [sprint?.startDate, sprint?.endDate]);

  const riskSignals = useMemo(() => {
    const today = new Date();
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const overdue = tasks.filter(t => {
      if (!t.dueDate || ["Done", "Completed", "Complete"].some(s => t.status?.toLowerCase() === s.toLowerCase())) return false;
      try {
        return isBefore(parseISO(t.dueDate), today);
      } catch { return false; }
    });

    const stale = tasks.filter(t => {
      if (!t.updatedAt || ["Done", "Completed", "Complete"].some(s => t.status?.toLowerCase() === s.toLowerCase())) return false;
      try {
        return isBefore(parseISO(t.updatedAt), threeDaysAgo);
      } catch { return false; }
    });

    const isSlipping = sprintDuration && sprintDuration.elapsed > sprintDuration.total * 0.5 && stats.percent < 40;

    return { 
      blocked: stats.blocked, 
      overdue: overdue.length, 
      stale: stale.length,
      slipping: isSlipping
    };
  }, [tasks, stats, sprintDuration]);

  const unfinishedTasks = useMemo(() => {
    return tasks.filter(t => !["Done", "Completed", "Complete"].some(s => t.status?.toLowerCase() === s.toLowerCase()));
  }, [tasks]);

  const nextPlannedSprint = useMemo(() => {
    return projectSprints
      .filter(s => s.id !== sprint?.id && s.status === "planned")
      .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""))[0];
  }, [projectSprints, sprint?.id]);

  const handleOpenCloseDialog = () => {
    const defaultDecisions: Record<string, RolloverAction> = {};
    unfinishedTasks.forEach(t => {
      defaultDecisions[t.id] = "next_sprint";
    });
    setRolloverDecisions(defaultDecisions);
    setCloseStep(1);
    setShowCloseDialog(true);
  };

  const handleRolloverChange = (taskId: string, action: RolloverAction) => {
    setRolloverDecisions(prev => ({ ...prev, [taskId]: action }));
  };

  const handleBulkRollover = (action: RolloverAction) => {
    const newDecisions: Record<string, RolloverAction> = {};
    unfinishedTasks.forEach(t => {
      newDecisions[t.id] = action;
    });
    setRolloverDecisions(newDecisions);
  };

  const handleConfirmClose = () => {
    const decisions = Object.entries(rolloverDecisions).map(([taskId, action]) => ({
      taskId,
      action,
      targetSprintId: action === "next_sprint" ? nextPlannedSprint?.id : undefined,
    }));
    onRolloverTasks?.(decisions);
    onCloseSprint();
    setShowCloseDialog(false);
  };

  const handleSaveNotes = () => {
    onNotesChange?.(notesText);
    setIsEditingNotes(false);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const renderTaskList = (taskList: SprintTask[], category: string) => (
    <Collapsible 
      open={expandedCategories[category]} 
      onOpenChange={() => toggleCategory(category)}
    >
      <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 hover:bg-accent/50 rounded px-2">
        {expandedCategories[category] ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span className="font-medium text-sm">{taskList.length} tasks</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-1 pl-6">
          {taskList.map(task => (
            <Link key={task.id} href={`/projects/${projectId}/tasks/${task.id}`}>
              <div className="flex items-center gap-2 p-2 rounded hover:bg-accent/50 cursor-pointer text-sm">
                <span className="truncate flex-1">{task.title}</span>
                {task.epicName && (
                  <Badge variant="outline" className="text-[10px]">{task.epicName}</Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );

  const rolloverCounts = useMemo(() => {
    const counts = { next_sprint: 0, backlog: 0, close: 0 };
    Object.values(rolloverDecisions).forEach(action => {
      counts[action]++;
    });
    return counts;
  }, [rolloverDecisions]);

  if (isReadOnly) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div>
            <div className="font-medium text-green-800">Sprint Closed</div>
            <div className="text-sm text-green-700">
              Closed on {sprint?.closedAt ? format(new Date(sprint.closedAt), "MMM d, yyyy") : "Unknown date"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Sprint Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sprint?.goal && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Sprint Goal</div>
                  <div className="text-sm">{sprint.goal}</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold">{stats.done}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">Total Planned</div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Completion</span>
                  <span className="font-medium">{stats.percent}%</span>
                </div>
                <Progress value={stats.percent} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                Sprint Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sprint?.notes ? (
                <div className="p-3 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap">
                  {sprint.notes}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No notes were recorded for this sprint.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sprint?.status === "active" && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Square className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">Ready to close this sprint?</div>
                  <div className="text-sm text-muted-foreground">
                    Review progress and handle unfinished work before closing.
                  </div>
                </div>
              </div>
              <Button onClick={handleOpenCloseDialog} data-testid="button-close-sprint-insights">
                Close Sprint
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Sprint Progress
            </CardTitle>
            <CardDescription>Track completion against your sprint goal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {sprint?.goal && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Sprint Goal</div>
                <div className="text-sm font-medium">{sprint.goal}</div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Overall Progress</span>
                <span className="text-lg font-bold">{stats.percent}%</span>
              </div>
              <Progress value={stats.percent} className="h-3" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-green-50 text-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <div className="text-xl font-bold text-green-700">{stats.done}</div>
                <div className="text-xs text-green-600">Done</div>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 text-center">
                <Clock className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <div className="text-xl font-bold text-blue-700">{stats.inProgress}</div>
                <div className="text-xs text-blue-600">In Progress</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 text-center">
                <Circle className="h-5 w-5 text-slate-500 mx-auto mb-1" />
                <div className="text-xl font-bold text-slate-700">{stats.notStarted}</div>
                <div className="text-xs text-slate-600">Not Started</div>
              </div>
              <div className="p-3 rounded-lg bg-red-50 text-center">
                <AlertCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
                <div className="text-xl font-bold text-red-700">{stats.blocked}</div>
                <div className="text-xs text-red-600">Blocked</div>
              </div>
            </div>

            {sprintDuration && (
              <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm">
                    Day {sprintDuration.elapsed} of {sprintDuration.total}
                  </div>
                  <Progress 
                    value={(sprintDuration.elapsed / sprintDuration.total) * 100} 
                    className="h-1.5 mt-1" 
                  />
                </div>
                <Badge variant="outline" className="text-xs">
                  {sprintDuration.remaining} days left
                </Badge>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">Velocity</span>
              </div>
              <div className="text-right">
                <div className="font-bold">{velocityProxy}%</div>
                <div className="text-xs text-muted-foreground">tasks completed / planned</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Risk Signals
            </CardTitle>
            <CardDescription>Issues requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {riskSignals.blocked > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-700">Blocked tasks</span>
                </div>
                <Badge variant="destructive">{riskSignals.blocked}</Badge>
              </div>
            )}
            {riskSignals.overdue > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-700">Overdue tasks</span>
                </div>
                <Badge className="bg-amber-500">{riskSignals.overdue}</Badge>
              </div>
            )}
            {riskSignals.stale > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <Pause className="h-4 w-4 text-slate-600" />
                  <span className="text-sm text-slate-700">Stale (3+ days)</span>
                </div>
                <Badge variant="secondary">{riskSignals.stale}</Badge>
              </div>
            )}
            {riskSignals.slipping && (
              <div className="p-3 rounded-lg bg-orange-50 border border-orange-100">
                <div className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Sprint may be slipping</span>
                </div>
                <p className="text-xs text-orange-600 mt-1">
                  More than halfway through with less than 40% complete.
                </p>
              </div>
            )}
            {riskSignals.blocked === 0 && riskSignals.overdue === 0 && riskSignals.stale === 0 && !riskSignals.slipping && (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-50" />
                <p className="text-sm">No risk signals detected</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completion Breakdown</CardTitle>
            <CardDescription>Click categories to view tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded bg-green-50 cursor-pointer hover:bg-green-100"
                   onClick={() => toggleCategory("done")}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Done</span>
                </div>
                <Badge className="bg-green-600">{stats.done}</Badge>
              </div>
              <Collapsible open={expandedCategories["done"]} onOpenChange={() => toggleCategory("done")}>
                <CollapsibleContent>
                  <ScrollArea className="h-[120px]">
                    <div className="space-y-1 pl-6 pr-2">
                      {tasks.filter(t => ["Done", "Completed", "Complete"].some(s => t.status?.toLowerCase() === s.toLowerCase())).map(task => (
                        <Link key={task.id} href={`/projects/${projectId}/tasks/${task.id}`}>
                          <div className="flex items-center gap-2 p-1.5 rounded hover:bg-accent/50 cursor-pointer text-sm">
                            <span className="truncate">{task.title}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>

              <div className="flex items-center justify-between p-2 rounded bg-blue-50 cursor-pointer hover:bg-blue-100"
                   onClick={() => toggleCategory("in-progress")}>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">In Progress</span>
                </div>
                <Badge className="bg-blue-600">{stats.inProgress}</Badge>
              </div>
              <Collapsible open={expandedCategories["in-progress"]} onOpenChange={() => toggleCategory("in-progress")}>
                <CollapsibleContent>
                  <ScrollArea className="h-[120px]">
                    <div className="space-y-1 pl-6 pr-2">
                      {tasks.filter(t => ["In Progress", "Review", "In Review"].some(s => t.status?.toLowerCase() === s.toLowerCase())).map(task => (
                        <Link key={task.id} href={`/projects/${projectId}/tasks/${task.id}`}>
                          <div className="flex items-center gap-2 p-1.5 rounded hover:bg-accent/50 cursor-pointer text-sm">
                            <span className="truncate">{task.title}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>

              <div className="flex items-center justify-between p-2 rounded bg-slate-50 cursor-pointer hover:bg-slate-100"
                   onClick={() => toggleCategory("not-started")}>
                <div className="flex items-center gap-2">
                  <Circle className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Not Started</span>
                </div>
                <Badge variant="secondary">{stats.notStarted}</Badge>
              </div>
              <Collapsible open={expandedCategories["not-started"]} onOpenChange={() => toggleCategory("not-started")}>
                <CollapsibleContent>
                  <ScrollArea className="h-[120px]">
                    <div className="space-y-1 pl-6 pr-2">
                      {tasks.filter(t => ["To Do", "Todo", "Pending", "Backlog", "Not Started"].some(s => t.status?.toLowerCase() === s.toLowerCase())).map(task => (
                        <Link key={task.id} href={`/projects/${projectId}/tasks/${task.id}`}>
                          <div className="flex items-center gap-2 p-1.5 rounded hover:bg-accent/50 cursor-pointer text-sm">
                            <span className="truncate">{task.title}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>

              <div className="flex items-center justify-between p-2 rounded bg-red-50 cursor-pointer hover:bg-red-100"
                   onClick={() => toggleCategory("blocked")}>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-700">Blocked</span>
                </div>
                <Badge variant="destructive">{stats.blocked}</Badge>
              </div>
              <Collapsible open={expandedCategories["blocked"]} onOpenChange={() => toggleCategory("blocked")}>
                <CollapsibleContent>
                  <ScrollArea className="h-[120px]">
                    <div className="space-y-1 pl-6 pr-2">
                      {tasks.filter(t => t.status?.toLowerCase() === "blocked" || t.blocked).map(task => (
                        <Link key={task.id} href={`/projects/${projectId}/tasks/${task.id}`}>
                          <div className="flex items-center gap-2 p-1.5 rounded hover:bg-accent/50 cursor-pointer text-sm">
                            <span className="truncate">{task.title}</span>
                            {task.blockerReason && (
                              <span className="text-[10px] text-red-500 truncate max-w-[100px]">
                                ({task.blockerReason})
                              </span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                Sprint Notes
              </CardTitle>
              <CardDescription>Capture observations for retrospectives</CardDescription>
            </div>
            {!isEditingNotes && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditingNotes(true)}>
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isEditingNotes ? (
              <div className="space-y-3">
                <Textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="What went well? What could improve? Any action items for next sprint?"
                  className="min-h-[150px]"
                  data-testid="textarea-sprint-notes"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => {
                    setNotesText(sprint?.notes || "");
                    setIsEditingNotes(false);
                  }}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveNotes} data-testid="button-save-notes">
                    Save Notes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="min-h-[150px]">
                {notesText ? (
                  <div className="p-3 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap">
                    {notesText}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[150px] text-muted-foreground">
                    <FileText className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No notes yet</p>
                    <Button 
                      variant="link" 
                      size="sm" 
                      onClick={() => setIsEditingNotes(true)}
                      className="mt-1"
                    >
                      Add notes
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {closeStep === 1 && "Review Sprint Summary"}
              {closeStep === 2 && "Handle Unfinished Work"}
              {closeStep === 3 && "Confirm & Close Sprint"}
            </DialogTitle>
            <DialogDescription>
              {closeStep === 1 && "Review what was accomplished before closing."}
              {closeStep === 2 && "Decide what happens to unfinished tasks."}
              {closeStep === 3 && "Confirm your decisions and close the sprint."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 mb-4">
            <div className={cn("flex-1 h-1 rounded", closeStep >= 1 ? "bg-primary" : "bg-muted")} />
            <div className={cn("flex-1 h-1 rounded", closeStep >= 2 ? "bg-primary" : "bg-muted")} />
            <div className={cn("flex-1 h-1 rounded", closeStep >= 3 ? "bg-primary" : "bg-muted")} />
          </div>

          {closeStep === 1 && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sprint</span>
                  <span className="font-medium">{sprint?.name}</span>
                </div>
                {sprint?.startDate && sprint?.endDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dates</span>
                    <span>{format(parseISO(sprint.startDate), "MMM d")} - {format(parseISO(sprint.endDate), "MMM d, yyyy")}</span>
                  </div>
                )}
                {sprint?.goal && (
                  <div>
                    <span className="text-muted-foreground text-sm">Goal</span>
                    <p className="text-sm mt-1">{sprint.goal}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-lg bg-green-50">
                  <div className="text-xl font-bold text-green-700">{stats.done}</div>
                  <div className="text-xs text-green-600">Completed</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-50">
                  <div className="text-xl font-bold text-blue-700">{stats.inProgress}</div>
                  <div className="text-xs text-blue-600">In Progress</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-50">
                  <div className="text-xl font-bold text-slate-700">{stats.notStarted}</div>
                  <div className="text-xs text-slate-600">Not Started</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-50">
                  <div className="text-xl font-bold text-red-700">{stats.blocked}</div>
                  <div className="text-xs text-red-600">Blocked</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Completion Rate:</span>
                <span className="font-bold">{stats.percent}%</span>
              </div>
            </div>
          )}

          {closeStep === 2 && (
            <div className="space-y-4">
              {unfinishedTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p className="text-lg font-medium">All tasks completed!</p>
                  <p className="text-muted-foreground">No unfinished work to handle.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {unfinishedTasks.length} unfinished task(s)
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleBulkRollover("next_sprint")}>
                        All to Next Sprint
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleBulkRollover("backlog")}>
                        All to Backlog
                      </Button>
                    </div>
                  </div>

                  <ScrollArea className="h-[300px] border rounded-lg">
                    <div className="p-2 space-y-2">
                      {unfinishedTasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                          <div className="flex-1 min-w-0 mr-4">
                            <div className="text-sm font-medium truncate">{task.title}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px]">{task.status}</Badge>
                              {task.epicName && (
                                <span className="text-[10px] text-muted-foreground">{task.epicName}</span>
                              )}
                            </div>
                          </div>
                          <RadioGroup 
                            value={rolloverDecisions[task.id] || "next_sprint"}
                            onValueChange={(v) => handleRolloverChange(task.id, v as RolloverAction)}
                            className="flex gap-3"
                          >
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="next_sprint" id={`${task.id}-next`} />
                              <Label htmlFor={`${task.id}-next`} className="text-xs cursor-pointer">
                                Next Sprint
                              </Label>
                            </div>
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="backlog" id={`${task.id}-backlog`} />
                              <Label htmlFor={`${task.id}-backlog`} className="text-xs cursor-pointer">
                                Backlog
                              </Label>
                            </div>
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="close" id={`${task.id}-close`} />
                              <Label htmlFor={`${task.id}-close`} className="text-xs cursor-pointer">
                                Close
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {!nextPlannedSprint && rolloverCounts.next_sprint > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                      <AlertTriangle className="h-4 w-4 inline mr-2" />
                      No planned sprint exists. Tasks marked for "Next Sprint" will create a new sprint automatically.
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {closeStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="font-medium">Summary of Changes</div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tasks completed</span>
                    <span className="font-medium text-green-600">{stats.done}</span>
                  </div>
                  {rolloverCounts.next_sprint > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Moving to next sprint</span>
                      <span className="font-medium text-blue-600">{rolloverCounts.next_sprint}</span>
                    </div>
                  )}
                  {rolloverCounts.backlog > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Moving to backlog</span>
                      <span className="font-medium">{rolloverCounts.backlog}</span>
                    </div>
                  )}
                  {rolloverCounts.close > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Closing incomplete</span>
                      <span className="font-medium text-red-600">{rolloverCounts.close}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                <div className="flex items-center gap-2 text-primary font-medium mb-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Ready to close sprint
                </div>
                <p className="text-sm text-muted-foreground">
                  This action will mark the sprint as closed and apply all task rollover decisions.
                  The sprint will become read-only.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {closeStep > 1 && (
              <Button variant="outline" onClick={() => setCloseStep(prev => (prev - 1) as 1 | 2 | 3)}>
                Back
              </Button>
            )}
            <div className="flex-1" />
            {closeStep < 3 ? (
              <Button onClick={() => setCloseStep(prev => (prev + 1) as 1 | 2 | 3)}>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleConfirmClose} data-testid="button-confirm-close-sprint">
                Close Sprint
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
