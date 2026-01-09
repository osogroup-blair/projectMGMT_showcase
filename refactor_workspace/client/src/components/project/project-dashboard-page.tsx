import React from "react";
import { 
  ProjectDashboard, 
  StatusSnapshot, 
  FinancialResourceSnapshot, 
  UpcomingWork, 
  RiskIssuePanel, 
  RecentActivity,
  UpcomingItem,
  Risk,
  Issue,
  ActivityItem
} from "@/types/dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Flag, 
  Calendar, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  Briefcase, 
  Users,
  CheckSquare,
  Package,
  Milestone,
  FileCheck,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInDays, parseISO, isPast, isValid } from "date-fns";

// Safe date parsing that handles non-ISO formats
const safeParseDateOrFallback = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  
  // Handle relative date strings
  const lower = dateStr.toLowerCase();
  if (lower === "tomorrow") return new Date(Date.now() + 24 * 60 * 60 * 1000);
  if (lower === "yesterday") return new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (lower === "last week") return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  // Try ISO parsing first
  const isoDate = parseISO(dateStr);
  if (isValid(isoDate)) return isoDate;
  
  // Try native Date parsing for formats like "11/28"
  const parsed = new Date(dateStr);
  if (isValid(parsed)) return parsed;
  
  // Default to today
  return new Date();
};

// --- Utility Components ---

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    green: "bg-green-100 text-green-700 border-green-200",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
    red: "bg-red-100 text-red-700 border-red-200",
    completed: "bg-green-100 text-green-700 border-green-200",
    in_progress: "bg-blue-100 text-blue-700 border-blue-200",
    not_started: "bg-slate-100 text-slate-700 border-slate-200",
    blocked: "bg-red-100 text-red-700 border-red-200",
    critical: "bg-red-100 text-red-700 border-red-200 font-bold",
    high: "bg-orange-100 text-orange-700 border-orange-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    low: "bg-blue-100 text-blue-700 border-blue-200",
    open: "bg-blue-50 text-blue-700 border-blue-200",
    mitigating: "bg-yellow-50 text-yellow-700 border-yellow-200",
    closed: "bg-slate-100 text-slate-500 border-slate-200",
    resolved: "bg-green-50 text-green-700 border-green-200",
    underallocated: "bg-yellow-50 text-yellow-700",
    healthy: "bg-green-50 text-green-700",
    overallocated: "bg-red-50 text-red-700",
  };

  const normalizeStatus = (s: string) => s.toLowerCase().replace(" ", "_");
  const className = styles[normalizeStatus(status)] || "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <Badge variant="outline" className={cn("capitalize whitespace-nowrap", className)}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
};

const PhaseLabel = ({ phase }: { phase: string }) => {
  const labels: Record<string, string> = {
    plan_strategy: "Plan Strategy",
    validate_blueprints: "Validate Blueprints",
    develop_solution: "Develop Solution",
    enable_users: "Enable Users",
  };
  return <span className="font-medium text-sm">{labels[phase] || phase}</span>;
};

// --- Module Components ---

const StatusSnapshotCard = ({ data }: { data: StatusSnapshot }) => {
  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          
          {/* Health & Phase */}
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full border-4 text-2xl font-bold shadow-sm",
              data.health === "green" ? "border-green-100 bg-green-50 text-green-600" :
              data.health === "yellow" ? "border-yellow-100 bg-yellow-50 text-yellow-600" :
              "border-red-100 bg-red-50 text-red-600"
            )}>
              {data.percentComplete}%
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold tracking-tight">Project Health</h3>
                <StatusBadge status={data.health} />
              </div>
              <div className="text-muted-foreground text-sm flex items-center gap-2">
                Phase: <PhaseLabel phase={data.phase} />
              </div>
            </div>
          </div>

          <Separator orientation="vertical" className="hidden md:block h-12" />

          {/* Timeline */}
          <div className="flex-1 space-y-2 min-w-[200px]">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Original End: {data.originalEndDate}</span>
              <span className={cn(
                "font-medium",
                data.originalEndDate !== data.projectedEndDate ? "text-amber-600" : "text-green-600"
              )}>
                Projected: {data.projectedEndDate}
              </span>
            </div>
            <Progress value={data.percentComplete} className="h-2" />
            <div className="text-xs text-muted-foreground text-right">
              {data.daysRemaining} days remaining
            </div>
          </div>

          <Separator orientation="vertical" className="hidden md:block h-12" />

          {/* Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-red-600">{data.openRisksCount}</div>
              <div className="text-[10px] uppercase text-muted-foreground font-semibold">Risks</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-amber-600">{data.openIssuesCount}</div>
              <div className="text-[10px] uppercase text-muted-foreground font-semibold">Issues</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-blue-600">{data.pendingDecisionsCount}</div>
              <div className="text-[10px] uppercase text-muted-foreground font-semibold">Decisions</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-purple-600">{data.upcomingMilestonesCount}</div>
              <div className="text-[10px] uppercase text-muted-foreground font-semibold">Milestones</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

// ... (previous imports)

const UpcomingWorkSection = ({ data }: { data: UpcomingWork }) => {
  const renderItem = (item: UpcomingItem) => {
    const Icon = {
      task: CheckSquare,
      deliverable: Package,
      milestone: Milestone,
      approval: FileCheck,
      meeting: Users
    }[item.type] || FileText;

    const isOverdue = isPast(safeParseDateOrFallback(item.dueDate)) && item.status !== 'complete';

    return (
      <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-all group">
        <div className={cn(
          "p-2 rounded-md shrink-0",
          item.type === 'milestone' ? "bg-purple-100 text-purple-700" :
          item.type === 'approval' ? "bg-amber-100 text-amber-700" :
          "bg-muted text-muted-foreground"
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h4 className="font-medium truncate group-hover:text-primary transition-colors">{item.title}</h4>
            {item.priority === 'critical' && <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />}
          </div>
          
          {/* Progress Bar (Only for tasks/deliverables or if progress is defined) */}
          {(item.type === 'task' || item.type === 'deliverable' || item.progress !== undefined) && (
            <div className="mt-2 flex items-center gap-2">
              <Progress value={item.progress || 0} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground w-8 text-right">{item.progress || 0}%</span>
            </div>
          )}

          <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-2 items-center">
            <span className={cn("flex items-center gap-1", isOverdue && "text-red-600 font-medium")}>
              <Calendar className="h-3 w-3" />
              {format(safeParseDateOrFallback(item.dueDate), "MMM d")}
            </span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>{item.owner}</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <StatusBadge status={item.status || 'not_started'} />
          </div>
        </div>
      </div>
    );
  };
// ... (rest of UpcomingWorkSection)


  const shortTerm = data.items?.filter(i => i.horizon === 'short') || [];
  const longTerm = data.items?.filter(i => i.horizon === 'long') || [];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          Upcoming Work
        </CardTitle>
        <CardDescription>Tasks and milestones due soon</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-hidden flex flex-col gap-6">
        <div className="space-y-3">
          <h5 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
            This Week ({data.horizonDaysShort} Days)
          </h5>
          <div className="space-y-2">
            {shortTerm.length > 0 ? shortTerm.map(renderItem) : (
              <p className="text-sm text-muted-foreground italic pl-2">No items due this week.</p>
            )}
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          <h5 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
            Next Few Weeks ({data.horizonDaysLong} Days)
          </h5>
           <div className="space-y-2">
            {longTerm.length > 0 ? longTerm.map(renderItem) : (
              <p className="text-sm text-muted-foreground italic pl-2">No items scheduled.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const RiskIssuePanelComponent = ({ data }: { data: RiskIssuePanel }) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Risks & Issues
          </CardTitle>
          {data.trend && (
             <Badge variant="outline" className="gap-1">
               {data.trend === 'improving' ? <TrendingUp className="h-3 w-3 text-green-600" /> :
                data.trend === 'worsening' ? <TrendingDown className="h-3 w-3 text-red-600" /> :
                <Minus className="h-3 w-3 text-muted-foreground" />}
               <span className="capitalize">{data.trend}</span>
             </Badge>
          )}
        </div>
        <CardDescription>Attention items requiring mitigation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Top Risks</h5>
            <Badge variant="secondary" className="text-[10px] h-5">{data.risks?.length || 0}</Badge>
          </div>
          <div className="space-y-2">
            {data.risks?.map(risk => (
              <div key={risk.id} className="p-3 rounded-lg border-l-4 border bg-card shadow-sm" style={{ borderLeftColor: risk.severity === 'critical' || risk.severity === 'high' ? '#ef4444' : '#f59e0b' }}>
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium text-sm">{risk.title}</h4>
                  <StatusBadge status={risk.status} />
                </div>
                <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2 mt-2">
                   <span>Prob: <span className="font-medium capitalize text-foreground">{risk.likelihood}</span></span>
                   <span>Impact: <span className="font-medium capitalize text-foreground">{risk.severity}</span></span>
                   <span className="col-span-2">Owner: {risk.owner}</span>
                </div>
              </div>
            ))}
            {(!data.risks || data.risks.length === 0) && (
               <div className="text-sm text-muted-foreground italic bg-muted/30 p-4 rounded text-center">No open risks.</div>
            )}
          </div>
        </div>

        <Separator />

        {/* Issues */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Active Issues</h5>
            <Badge variant="secondary" className="text-[10px] h-5">{data.issues?.length || 0}</Badge>
          </div>
          <div className="space-y-2">
             {data.issues?.map(issue => (
              <div key={issue.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">{issue.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={cn(
                      "font-semibold capitalize",
                      issue.severity === 'critical' ? "text-red-600" : "text-amber-600"
                    )}>{issue.severity} Priority</span>
                    <span>•</span>
                    <span>{issue.owner}</span>
                  </div>
                </div>
                <StatusBadge status={issue.status} />
              </div>
            ))}
             {(!data.issues || data.issues.length === 0) && (
               <div className="text-sm text-muted-foreground italic bg-muted/30 p-4 rounded text-center">No active issues.</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const FinancialResourceSection = ({ data }: { data: FinancialResourceSnapshot }) => {
  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return "-";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: data.currency || 'USD', maximumSignificantDigits: 3 }).format(amount);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          Financials & Resources
        </CardTitle>
        <CardDescription>Budget burn and team utilization</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Budget Burn</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{formatCurrency(data.budgetUsed)}</span>
              <span className="text-xs text-muted-foreground">of {formatCurrency(data.budgetPlanned)}</span>
            </div>
            <Progress value={(data.budgetUsed! / data.budgetPlanned!) * 100} className="h-2" />
            <div className="text-xs text-muted-foreground flex justify-between mt-1">
              <span>Forecast: {formatCurrency(data.budgetForecastFinal)}</span>
              <span className={cn(
                (data.budgetForecastFinal! > data.budgetPlanned!) ? "text-red-500" : "text-green-500"
              )}>
                {Math.round(((data.budgetForecastFinal! - data.budgetPlanned!) / data.budgetPlanned!) * 100)}% var
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Hours Burn</div>
             <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{data.hoursUsed}h</span>
              <span className="text-xs text-muted-foreground">of {data.hoursPlanned}h</span>
            </div>
            <Progress value={(data.hoursUsed! / data.hoursPlanned!) * 100} className="h-2 bg-muted" />
             <div className="text-xs text-muted-foreground flex justify-between mt-1">
              <span>Forecast: {data.hoursForecastFinal}h</span>
              <span className={cn(
                (data.hoursForecastFinal! > data.hoursPlanned!) ? "text-red-500" : "text-green-500"
              )}>
                {Math.round(((data.hoursForecastFinal! - data.hoursPlanned!) / data.hoursPlanned!) * 100)}% var
              </span>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
           <h5 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Resource Utilization (Hours)</h5>
           <div className="border rounded-md overflow-hidden">
             <Table>
               <TableHeader>
                 <TableRow className="bg-muted/50">
                   <TableHead className="w-[180px]">Resource</TableHead>
                   <TableHead className="text-right text-xs">Monthly<br/>Budget</TableHead>
                   <TableHead className="text-right text-xs">Monthly<br/>Actual</TableHead>
                   <TableHead className="text-right text-xs">Total<br/>Budget</TableHead>
                   <TableHead className="text-right text-xs">Total<br/>Actual</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {data.resourceUtilization?.map((res, i) => (
                   <TableRow key={i}>
                     <TableCell className="font-medium py-3">
                        <div className="flex items-center gap-2">
                           <Avatar className="h-6 w-6">
                             <AvatarFallback className="text-[10px]">{res.name.charAt(0)}</AvatarFallback>
                           </Avatar>
                           <div className="flex flex-col">
                             <span>{res.name}</span>
                             <span className="text-[10px] text-muted-foreground capitalize">{res.entityType}</span>
                           </div>
                        </div>
                     </TableCell>
                     <TableCell className="text-right py-3">{res.monthlyBudgetedHours || '-'}</TableCell>
                     <TableCell className={cn(
                       "text-right py-3", 
                       (res.monthlyActualHours || 0) > (res.monthlyBudgetedHours || 0) ? "text-red-600 font-medium" : ""
                     )}>
                       {res.monthlyActualHours || '-'}
                     </TableCell>
                     <TableCell className="text-right py-3">{res.totalBudgetedHours || '-'}</TableCell>
                     <TableCell className={cn(
                       "text-right py-3", 
                       (res.totalActualHours || 0) > (res.totalBudgetedHours || 0) ? "text-red-600 font-medium" : ""
                     )}>
                       {res.totalActualHours || '-'}
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </div>
        </div>
      </CardContent>
    </Card>
  );
};

const RecentActivityFeed = ({ data }: { data: RecentActivity }) => {
  const getIcon = (type: ActivityItem['type']) => {
    switch(type) {
      case 'task_completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'file_uploaded': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'status_changed': return <Activity className="h-4 w-4 text-amber-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
          <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 bg-green-50 text-green-700 rounded-full">
            <ArrowUpRight className="h-3 w-3" />
            {data.completedChangePercentVsPrevWindow}% Momentum
          </div>
        </div>
        <CardDescription>
          {data.completedCount} items completed in last {data.windowDays} days
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 relative">
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-6 pl-2">
            {data.items?.map((item, i) => (
              <div key={item.id} className="relative pl-6 pb-2 border-l last:border-0 border-muted">
                <div className="absolute left-[-5px] top-1 bg-background p-0.5 rounded-full">
                   {getIcon(item.type)}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{item.actor}</span> • {item.description || item.type.replace('_', ' ')}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase">
                    {format(parseISO(item.timestamp), "MMM d, h:mm a")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

// --- Main Page Component ---

export default function ProjectDashboardPage({ dashboard }: { dashboard: ProjectDashboard }) {
  if (!dashboard) return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Top Row: Status Snapshot */}
      <section>
        <StatusSnapshotCard data={dashboard.statusSnapshot} />
      </section>

      {/* Middle Row: Work vs Risk */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {dashboard.upcomingWork && <UpcomingWorkSection data={dashboard.upcomingWork} />}
        {dashboard.riskIssuePanel && <RiskIssuePanelComponent data={dashboard.riskIssuePanel} />}
      </section>

      {/* Bottom Row: Financials + Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {dashboard.financialResourceSnapshot && <FinancialResourceSection data={dashboard.financialResourceSnapshot} />}
        {dashboard.recentActivity && <RecentActivityFeed data={dashboard.recentActivity} />}
      </section>

    </div>
  );
}
