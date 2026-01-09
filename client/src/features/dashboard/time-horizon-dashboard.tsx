import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useTasks } from "@/hooks/use-nexus-data";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  AlertCircle, 
  ArrowRight,
  ChevronRight,
  Target,
  TrendingUp,
  Users,
  Layers,
  Search,
  Filter,
  CalendarDays,
  Milestone as MilestoneIcon,
  Gauge
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, isValid, differenceInDays } from "date-fns";
import type { 
  DashboardData, 
  DashboardFilters, 
  TimeRange, 
  AssigneeScope,
  DashboardTask,
  DashboardMilestone,
  WeeklyFocus,
  StageProgress,
  RiskItem
} from "./types";

const safeParseDateOrFallback = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const parsed = parseISO(dateStr);
  if (isValid(parsed)) return parsed;
  const fallback = new Date(dateStr);
  if (isValid(fallback)) return fallback;
  return new Date();
};

const formatDeadline = (deadline: string) => {
  const date = safeParseDateOrFallback(deadline);
  const now = new Date();
  const days = differenceInDays(date, now);
  
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, className: "text-red-600 font-medium" };
  if (days === 0) return { text: "Today", className: "text-amber-600 font-medium" };
  if (days === 1) return { text: "Tomorrow", className: "text-amber-500" };
  if (days <= 7) return { text: `${days}d left`, className: "text-blue-600" };
  return { text: format(date, "MMM d"), className: "text-muted-foreground" };
};

const STATUS_STYLES: Record<string, string> = {
  todo: "bg-slate-100 text-slate-700 border-slate-200",
  "in progress": "bg-blue-100 text-blue-700 border-blue-200",
  review: "bg-amber-100 text-amber-700 border-amber-200",
  done: "bg-green-100 text-green-700 border-green-200",
  blocked: "bg-red-100 text-red-700 border-red-200",
  planned: "bg-purple-100 text-purple-700 border-purple-200",
  active: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
};

const StatusBadge = ({ status }: { status: string }) => {
  const normalizeStatus = (s: string) => s.toLowerCase();
  const className = STATUS_STYLES[normalizeStatus(status)] || "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <Badge variant="outline" className={cn("capitalize whitespace-nowrap text-xs", className)}>
      {status}
    </Badge>
  );
};

const StatusDropdown = ({ 
  taskId, 
  currentStatus, 
  onStatusChange 
}: { 
  taskId: string; 
  currentStatus: string; 
  onStatusChange: (taskId: string, newStatus: string) => void;
}) => {
  const normalizeStatus = (s: string) => s.toLowerCase();
  const className = STATUS_STYLES[normalizeStatus(currentStatus)] || "bg-gray-100 text-gray-700 border-gray-200";
  
  return (
    <Select 
      value={currentStatus} 
      onValueChange={(value) => onStatusChange(taskId, value)}
    >
      <SelectTrigger 
        className="h-6 w-auto border-0 bg-transparent p-0 shadow-none focus:ring-0"
        onClick={(e) => e.stopPropagation()}
        data-testid={`status-dropdown-${taskId}`}
      >
        <Badge variant="outline" className={cn("capitalize whitespace-nowrap text-xs cursor-pointer", className)}>
          {currentStatus}
        </Badge>
      </SelectTrigger>
      <SelectContent>
        {["Todo", "In Progress", "Review", "Done"].map((s) => (
          <SelectItem key={s} value={s}>{s}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const PriorityIndicator = ({ priority }: { priority: string }) => {
  const colors: Record<string, string> = {
    critical: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-yellow-500",
    low: "bg-blue-500",
  };
  return (
    <div 
      className={cn("w-1.5 h-1.5 rounded-full", colors[priority.toLowerCase()] || "bg-gray-400")} 
      title={priority}
    />
  );
};

function SummaryBar({ summary }: { summary: DashboardData["summary"] }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{summary.tasksDue}</div>
                <div className="text-xs text-muted-foreground">Tasks Due</div>
              </div>
            </div>
            
            <Separator orientation="vertical" className="h-10" />
            
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{summary.overdue}</div>
                <div className="text-xs text-muted-foreground">Overdue</div>
              </div>
            </div>
            
            <Separator orientation="vertical" className="h-10" />
            
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">{summary.blocked}</div>
                <div className="text-xs text-muted-foreground">Blocked</div>
              </div>
            </div>
            
            <Separator orientation="vertical" className="h-10" />
            
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-50">
                <Target className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{summary.milestonesDue}</div>
                <div className="text-xs text-muted-foreground">Milestones Due</div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Gauge className={cn(
              "h-5 w-5",
              summary.capacityLevel === 'low' ? "text-green-500" :
              summary.capacityLevel === 'medium' ? "text-amber-500" : "text-red-500"
            )} />
            <div className="text-sm">
              Capacity: <span className={cn(
                "font-medium capitalize",
                summary.capacityLevel === 'low' ? "text-green-600" :
                summary.capacityLevel === 'medium' ? "text-amber-600" : "text-red-600"
              )}>{summary.capacityLevel}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskRow({ 
  task, 
  showProject = true, 
  onStatusChange 
}: { 
  task: DashboardTask; 
  showProject?: boolean;
  onStatusChange?: (taskId: string, newStatus: string) => void;
}) {
  const deadline = formatDeadline(task.deadline);
  const taskLink = task.projectId ? `/projects/${task.projectId}/tasks/${task.id}` : null;
  const epicLink = task.projectId && task.epicId ? `/projects/${task.projectId}/epics/${task.epicId}` : null;
  
  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
      data-testid={`task-row-${task.id}`}
    >
      <PriorityIndicator priority={task.priority} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {taskLink ? (
            <Link 
              href={taskLink}
              className="font-medium truncate hover:text-primary hover:underline"
              data-testid={`task-link-${task.id}`}
            >
              {task.title}
            </Link>
          ) : (
            <span className="font-medium truncate">{task.title}</span>
          )}
          {task.isBlocked && <Badge variant="destructive" className="text-[10px] h-4">Blocked</Badge>}
          {task.isOverdue && <Badge variant="destructive" className="text-[10px] h-4">Overdue</Badge>}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {showProject && task.projectName && (
            <span className="truncate">{task.projectName}</span>
          )}
          {task.epicName && (
            <>
              {showProject && task.projectName && <span>•</span>}
              {epicLink ? (
                <Link 
                  href={epicLink}
                  className="truncate hover:text-primary hover:underline"
                  data-testid={`epic-link-${task.id}`}
                >
                  {task.epicName}
                </Link>
              ) : (
                <span className="truncate">{task.epicName}</span>
              )}
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {onStatusChange ? (
          <StatusDropdown 
            taskId={task.id} 
            currentStatus={task.status} 
            onStatusChange={onStatusChange} 
          />
        ) : (
          <StatusBadge status={task.status} />
        )}
        <span className={cn("text-xs whitespace-nowrap", deadline.className)}>
          <Clock className="inline h-3 w-3 mr-1" />
          {deadline.text}
        </span>
      </div>
    </div>
  );
}

function MyCommitmentsPanel({ 
  tasks, 
  onStatusChange 
}: { 
  tasks: DashboardTask[];
  onStatusChange?: (taskId: string, newStatus: string) => void;
}) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            My Commitments
          </CardTitle>
          <Badge variant="secondary">{tasks.length}</Badge>
        </div>
        <CardDescription>Tasks due this week assigned to you</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-[350px]">
          <div className="space-y-2 pr-2">
            {tasks.length > 0 ? tasks.map(task => (
              <TaskRow key={task.id} task={task} onStatusChange={onStatusChange} />
            )) : (
              <div className="text-center text-muted-foreground py-8">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tasks due this week</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function AtRiskPanel({ 
  tasks,
  onStatusChange 
}: { 
  tasks: DashboardTask[];
  onStatusChange?: (taskId: string, newStatus: string) => void;
}) {
  const groupedByProject = tasks.reduce((acc, task) => {
    const key = task.projectName || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {} as Record<string, DashboardTask[]>);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            At Risk
          </CardTitle>
          <Badge variant="destructive">{tasks.length}</Badge>
        </div>
        <CardDescription>Tasks requiring immediate attention</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-[350px]">
          <div className="space-y-4 pr-2">
            {Object.entries(groupedByProject).length > 0 ? Object.entries(groupedByProject).map(([project, projectTasks]) => (
              <div key={project} className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {project}
                </div>
                {projectTasks.map(task => (
                  <TaskRow key={task.id} task={task} showProject={false} onStatusChange={onStatusChange} />
                ))}
              </div>
            )) : (
              <div className="text-center text-muted-foreground py-8">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-50" />
                <p className="text-sm">No at-risk tasks</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function WeeklyFocusPanel({ focus }: { focus: WeeklyFocus[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-5 w-5 text-primary" />
          Weekly Focus
        </CardTitle>
        <CardDescription>Top priorities per project this week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {focus.length > 0 ? focus.map(item => (
            <div key={item.projectId} className="p-4 rounded-lg border bg-accent/20">
              <div className="font-semibold mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <Link 
                  href={`/projects/${item.projectId}`}
                  className="hover:text-primary hover:underline"
                >
                  {item.projectName}
                </Link>
              </div>
              {item.milestone && (
                <Link 
                  href={`/projects/${item.projectId}/milestones/${item.milestone.id}`}
                  className="block mb-3 p-2 rounded bg-purple-50 border border-purple-100 hover:bg-purple-100 transition-colors"
                  data-testid={`milestone-link-${item.milestone.id}`}
                >
                  <div className="flex items-center gap-2 text-purple-700">
                    <MilestoneIcon className="h-3 w-3" />
                    <span className="text-xs font-medium">Milestone Due</span>
                  </div>
                  <div className="text-sm font-medium mt-1">{item.milestone.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(safeParseDateOrFallback(item.milestone.targetDate), "MMM d")}
                  </div>
                </Link>
              )}
              <div className="space-y-1.5">
                {item.topTasks.map(task => {
                  const deadline = formatDeadline(task.deadline);
                  return (
                    <div key={task.id} className="flex items-center justify-between text-sm">
                      <Link 
                        href={`/projects/${item.projectId}/tasks/${task.id}`}
                        className="truncate flex-1 hover:text-primary hover:underline"
                        data-testid={`focus-task-link-${task.id}`}
                      >
                        {task.title}
                      </Link>
                      <span className={cn("text-xs ml-2 shrink-0", deadline.className)}>
                        {deadline.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )) : (
            <div className="col-span-full text-center text-muted-foreground py-8">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No focus items this week</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MilestoneCard({ milestone }: { milestone: DashboardMilestone }) {
  const deadline = formatDeadline(milestone.targetDate);
  const milestoneLink = milestone.projectId ? `/projects/${milestone.projectId}/milestones/${milestone.id}` : null;
  
  const content = (
    <>
      <div className={cn(
        "p-2 rounded-lg",
        milestone.confidence === 'at_risk' ? "bg-red-50" : "bg-green-50"
      )}>
        <MilestoneIcon className={cn(
          "h-4 w-4",
          milestone.confidence === 'at_risk' ? "text-red-600" : "text-green-600"
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{milestone.name}</div>
        <div className="text-xs text-muted-foreground truncate">{milestone.projectName}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {milestone.confidence === 'at_risk' && (
          <Badge variant="destructive" className="text-[10px]">At Risk</Badge>
        )}
        <span className={cn("text-xs whitespace-nowrap", deadline.className)}>
          {deadline.text}
        </span>
      </div>
    </>
  );

  if (milestoneLink) {
    return (
      <Link 
        href={milestoneLink}
        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
        data-testid={`milestone-card-${milestone.id}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      {content}
    </div>
  );
}

function CapacityPreviewCard({ capacity }: { capacity: { notStartedCount: number; capacityLevel: string } }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Gauge className="h-4 w-4" />
          Capacity Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold">{capacity.notStartedCount}</div>
          <div className="text-sm text-muted-foreground">
            Not-started tasks<br />scheduled for next week
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Progress 
            value={capacity.capacityLevel === 'low' ? 30 : capacity.capacityLevel === 'medium' ? 60 : 90} 
            className="h-2" 
          />
          <Badge variant={
            capacity.capacityLevel === 'low' ? 'secondary' :
            capacity.capacityLevel === 'medium' ? 'outline' : 'destructive'
          } className="capitalize">
            {capacity.capacityLevel}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function StageProgressCard({ stages }: { stages: StageProgress[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="h-5 w-5 text-primary" />
          Stage Progress
        </CardTitle>
        <CardDescription>Current stage health per project</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <div className="space-y-2 pr-2">
            {stages.length > 0 ? stages.map(stage => (
              <div key={stage.id} className="flex items-center justify-between p-2 rounded border">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    stage.health === 'at_risk' ? "bg-red-500" : "bg-green-500"
                  )} />
                  <div>
                    <div className="text-sm font-medium">{stage.name}</div>
                    <div className="text-xs text-muted-foreground">{stage.projectName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{stage.openTaskCount} open</span>
                  {stage.health === 'at_risk' && (
                    <Badge variant="destructive" className="text-[10px]">At Risk</Badge>
                  )}
                </div>
              </div>
            )) : (
              <div className="text-center text-muted-foreground py-4">
                <p className="text-sm">No active stages</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function RiskRadarCard({ risks }: { risks: RiskItem[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Risk Radar
        </CardTitle>
        <CardDescription>Long-running and high-blocker tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <div className="space-y-2 pr-2">
            {risks.length > 0 ? risks.map(risk => (
              <div key={risk.id} className="flex items-center gap-3 p-2 rounded border border-amber-100 bg-amber-50/50">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{risk.title}</div>
                  <div className="text-xs text-muted-foreground">{risk.projectName}</div>
                </div>
                <Badge variant="outline" className="text-[10px] capitalize">{risk.type.replace('_', ' ')}</Badge>
              </div>
            )) : (
              <div className="text-center text-muted-foreground py-4">
                <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-500 opacity-50" />
                <p className="text-sm">No risks detected</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface TimeHorizonDashboardProps {
  projectId?: string;
  externalFilters?: DashboardFilters;
  onFiltersChange?: (filters: DashboardFilters) => void;
}

export function DashboardFilterControls({
  filters,
  onFiltersChange,
}: {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Select 
        value={filters.range} 
        onValueChange={(value: TimeRange) => onFiltersChange({ ...filters, range: value })}
      >
        <SelectTrigger className="w-[130px] h-8 text-xs" data-testid="range-selector">
          <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="week">This Week</SelectItem>
          <SelectItem value="nextWeek">Next Week</SelectItem>
          <SelectItem value="30days">30 Days</SelectItem>
          <SelectItem value="60days">60 Days</SelectItem>
          <SelectItem value="90days">90 Days</SelectItem>
        </SelectContent>
      </Select>
      
      <Select 
        value={filters.assigneeScope} 
        onValueChange={(value: AssigneeScope) => onFiltersChange({ ...filters, assigneeScope: value })}
      >
        <SelectTrigger className="w-[120px] h-8 text-xs" data-testid="scope-selector">
          <Users className="h-3.5 w-3.5 mr-1.5" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="me">Assigned to me</SelectItem>
          <SelectItem value="team">My team</SelectItem>
          <SelectItem value="all">Everyone</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export default function TimeHorizonDashboard({ projectId, externalFilters, onFiltersChange }: TimeHorizonDashboardProps) {
  const [internalFilters, setInternalFilters] = useState<DashboardFilters>({
    range: 'week',
    projectIds: projectId ? [projectId] : [],
    assigneeScope: 'all',
  });
  const queryClient = useQueryClient();
  const { update: updateTask } = useTasks();

  const filters = externalFilters || internalFilters;
  const updateFilters = (newFilters: DashboardFilters) => {
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    } else {
      setInternalFilters(newFilters);
    }
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    updateTask({ id: taskId, updates: { status: newStatus } });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const { data: dashboard, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard', filters, projectId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('range', filters.range);
      if (filters.assigneeScope !== 'all') {
        params.set('assigneeScope', filters.assigneeScope);
      }
      if (filters.userId) {
        params.set('userId', filters.userId);
      }
      const projectIdsToUse = projectId ? [projectId] : filters.projectIds;
      projectIdsToUse.forEach(id => params.append('projectIds', id));
      
      const res = await fetch(`/api/dashboard?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch dashboard');
      return res.json();
    },
    staleTime: 30000,
  });

  const { data: projects } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
    enabled: !projectId,
  });

  const isProjectScoped = !!projectId;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <AlertCircle className="h-6 w-6 mr-2" />
        Failed to load dashboard
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", !isProjectScoped && "p-6")}>
      {!isProjectScoped && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">What matters now, what's coming, and where risks are forming</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select 
              value={filters.range} 
              onValueChange={(value: TimeRange) => updateFilters({ ...filters, range: value })}
            >
              <SelectTrigger className="w-[140px]" data-testid="range-selector">
                <CalendarDays className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="nextWeek">Next Week</SelectItem>
                <SelectItem value="30days">30 Days</SelectItem>
                <SelectItem value="60days">60 Days</SelectItem>
                <SelectItem value="90days">90 Days</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={filters.assigneeScope} 
              onValueChange={(value: AssigneeScope) => updateFilters({ ...filters, assigneeScope: value })}
            >
              <SelectTrigger className="w-[130px]" data-testid="scope-selector">
                <Users className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="me">Assigned to me</SelectItem>
                <SelectItem value="team">My team</SelectItem>
                <SelectItem value="all">Everyone</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <SummaryBar summary={dashboard.summary} />
        </div>
      )}

      <Tabs defaultValue="thisWeek" className="space-y-6">
        <TabsList>
          <TabsTrigger value="thisWeek" className="gap-2" data-testid="tab-this-week">
            <Calendar className="h-4 w-4" />
            This Week
          </TabsTrigger>
          <TabsTrigger value="nextWeek" className="gap-2" data-testid="tab-next-week">
            <ArrowRight className="h-4 w-4" />
            Next Week
          </TabsTrigger>
          <TabsTrigger value="trajectory" className="gap-2" data-testid="tab-trajectory">
            <TrendingUp className="h-4 w-4" />
            1-3 Months
          </TabsTrigger>
        </TabsList>

        <TabsContent value="thisWeek" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MyCommitmentsPanel tasks={dashboard.thisWeek.myCommitments} onStatusChange={handleStatusChange} />
            <AtRiskPanel tasks={dashboard.thisWeek.atRisk} onStatusChange={handleStatusChange} />
          </div>
          <WeeklyFocusPanel focus={dashboard.thisWeek.weeklyFocus} />
        </TabsContent>

        <TabsContent value="nextWeek" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MilestoneIcon className="h-5 w-5 text-purple-600" />
                    Upcoming Milestones
                  </CardTitle>
                  <CardDescription>Milestones due or starting next week</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2 pr-2">
                      {dashboard.nextWeek.milestones.length > 0 ? dashboard.nextWeek.milestones.map(m => (
                        <MilestoneCard key={m.id} milestone={m} />
                      )) : (
                        <div className="text-center text-muted-foreground py-8">
                          <MilestoneIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No milestones next week</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
            <CapacityPreviewCard capacity={dashboard.nextWeek.capacityPreview} />
          </div>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5 text-primary" />
                Tasks Rolling In
              </CardTitle>
              <CardDescription>Tasks due next week sorted by priority</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2 pr-2">
                  {dashboard.nextWeek.rollingTasks.length > 0 ? dashboard.nextWeek.rollingTasks.map(task => (
                    <TaskRow key={task.id} task={task} />
                  )) : (
                    <div className="text-center text-muted-foreground py-8">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No tasks due next week</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trajectory" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-5 w-5 text-purple-600" />
                Milestone Timeline
              </CardTitle>
              <CardDescription>Milestones within the next 1-3 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                <div className="space-y-2 pr-2">
                  {dashboard.future.milestones.length > 0 ? dashboard.future.milestones.map(m => (
                    <div key={m.id} className="flex items-center gap-3 p-2 rounded border">
                      <MilestoneIcon className="h-4 w-4 text-purple-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{m.name}</div>
                        <div className="text-xs text-muted-foreground">{m.projectName}</div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(safeParseDateOrFallback(m.targetDate), "MMM d, yyyy")}
                      </span>
                    </div>
                  )) : (
                    <div className="text-center text-muted-foreground py-8">
                      <MilestoneIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No upcoming milestones</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StageProgressCard stages={dashboard.future.stageProgress} />
            <RiskRadarCard risks={dashboard.future.risks} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
