import { Shell } from "@/components/layout/shell";
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MoreHorizontal,
  ChevronRight,
  LayoutDashboard,
  Kanban,
  Settings,
  Flag,
  ListTodo,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { useRoute, Link } from "wouter";
import { PROJECTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// Mock Data Types
interface ProjectStage {
  id: string;
  name: string;
  order: number;
  type: "planning" | "execution" | "review" | "delivery";
  status: "completed" | "active" | "pending";
}

interface Milestone {
  id: string;
  name: string;
  stageId: string;
  targetDate: string;
  status: "completed" | "on_track" | "at_risk" | "overdue";
  progress: number;
}

interface TaskStats {
  total: number;
  completed: number;
  atRisk: number;
  inProgress: number;
}

// Mock Data Generator
const getProjectData = (id: string) => {
  const project = PROJECTS.find(p => p.id === id) || PROJECTS[0];
  
  const stages: ProjectStage[] = [
    { id: "s1", name: "Discovery", order: 1, type: "planning", status: "completed" },
    { id: "s2", name: "Design", order: 2, type: "execution", status: "active" },
    { id: "s3", name: "Development", order: 3, type: "execution", status: "pending" },
    { id: "s4", name: "QA & Testing", order: 4, type: "review", status: "pending" },
    { id: "s5", name: "Launch", order: 5, type: "delivery", status: "pending" },
  ];

  const milestones: Milestone[] = [
    { id: "m1", name: "Requirements Sign-off", stageId: "s1", targetDate: "2023-10-15", status: "completed", progress: 100 },
    { id: "m2", name: "Wireframes Approval", stageId: "s2", targetDate: "2023-11-01", status: "completed", progress: 100 },
    { id: "m3", name: "UI Design Review", stageId: "s2", targetDate: "2023-11-15", status: "on_track", progress: 60 },
    { id: "m4", name: "Alpha Release", stageId: "s3", targetDate: "2023-12-10", status: "at_risk", progress: 20 },
    { id: "m5", name: "Beta Launch", stageId: "s4", targetDate: "2024-01-05", status: "on_track", progress: 0 },
  ];

  const stats: TaskStats = {
    total: 45,
    completed: 18,
    inProgress: 12,
    atRisk: 3
  };

  return { project, stages, milestones, stats };
};

export default function ProjectOverview() {
  const [match, params] = useRoute("/projects/:projectId");
  const projectId = params?.projectId || "1";
  const { project, stages, milestones, stats } = getProjectData(projectId);

  const completionPercentage = Math.round((stats.completed / stats.total) * 100);

  return (
    <Shell>
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/projects" className="hover:text-primary transition-colors">Projects</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-foreground">{project.name}</span>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-primary">{project.name}</h1>
                <Badge variant="outline" className={cn(
                  "px-2.5 py-0.5 text-sm font-medium border-0",
                  project.status === 'In Progress' && "bg-blue-50 text-blue-700",
                  project.status === 'Upcoming' && "bg-purple-50 text-purple-700",
                  project.status === 'Overdue' && "bg-red-50 text-red-700",
                  project.status === 'Completed' && "bg-green-50 text-green-700"
                )}>
                  {project.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback>CP</AvatarFallback>
                  </Avatar>
                  Colgate-Palmolive
                </span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Due Nov 28, 2023
                </span>
              </div>
            </div>

            <div className="flex gap-2 w-full lg:w-auto">
              <Link href={`/projects/${projectId}/tasks`}>
                <Button variant="outline" className="gap-2 flex-1 lg:flex-none">
                  <Kanban className="h-4 w-4" />
                  Task Board
                </Button>
              </Link>
              <Link href={`/projects/${projectId}/stages`}>
                <Button variant="outline" className="gap-2 flex-1 lg:flex-none">
                  <Layers className="h-4 w-4" />
                  Edit Stages
                </Button>
              </Link>
              <Button size="icon" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <ListTodo className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{stats.total}</div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Tasks</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg text-green-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.completed}</div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Completed</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.inProgress}</div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">In Progress</div>
              </div>
            </CardContent>
          </Card>
          <Card className={cn(stats.atRisk > 0 && "bg-red-50/50 border-red-100")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-700">{stats.atRisk}</div>
                <div className="text-xs font-medium text-red-600/80 uppercase tracking-wide">At Risk</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Project Stages Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Project Stages</CardTitle>
                <CardDescription>Current phase and progress timeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative pt-2 pb-6">
                  {/* Progress Bar Background */}
                  <div className="absolute top-[14px] left-0 right-0 h-1 bg-muted rounded-full" />
                  
                  {/* Active Progress */}
                  <div className="absolute top-[14px] left-0 h-1 bg-primary rounded-full transition-all duration-500" style={{ width: '35%' }} />

                  {/* Stages */}
                  <div className="relative flex justify-between">
                    {stages.map((stage, i) => {
                      const isActive = stage.status === 'active';
                      const isCompleted = stage.status === 'completed';
                      
                      return (
                        <div key={stage.id} className="flex flex-col items-center gap-3 group cursor-pointer">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 bg-background transition-colors",
                            isCompleted ? "border-primary bg-primary text-primary-foreground" :
                            isActive ? "border-primary ring-4 ring-primary/20 text-primary" :
                            "border-muted-foreground/30 text-muted-foreground"
                          )}>
                            {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                          </div>
                          <div className="flex flex-col items-center text-center">
                            <span className={cn(
                              "text-sm font-semibold",
                              isActive ? "text-primary" : "text-muted-foreground"
                            )}>{stage.name}</span>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{stage.status}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tasks & Activity Tabs */}
            <Tabs defaultValue="milestones" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                <TabsTrigger 
                  value="milestones" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                >
                  Milestones
                </TabsTrigger>
                <TabsTrigger 
                  value="activity" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                >
                  Recent Activity
                </TabsTrigger>
              </TabsList>
              <TabsContent value="milestones" className="pt-6 space-y-4">
                {milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/20 transition-colors group">
                    <div className={cn(
                      "p-2 rounded-full",
                      milestone.status === 'completed' ? "bg-green-100 text-green-600" :
                      milestone.status === 'at_risk' ? "bg-red-100 text-red-600" :
                      "bg-blue-50 text-blue-600"
                    )}>
                      <Flag className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{milestone.name}</h4>
                        {milestone.status === 'at_risk' && (
                          <Badge variant="destructive" className="h-5 text-[10px] px-1.5">At Risk</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Target: {milestone.targetDate}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{stages.find(s => s.id === milestone.stageId)?.name} Stage</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-32 shrink-0">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full",
                            milestone.status === 'at_risk' ? "bg-red-500" : "bg-primary"
                          )} 
                          style={{ width: `${milestone.progress}%` }} 
                        />
                      </div>
                      <span className="text-xs font-medium w-8 text-right">{milestone.progress}%</span>
                    </div>
                  </div>
                ))}
                <Button variant="ghost" className="w-full text-muted-foreground hover:text-primary">
                  View All Milestones <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Project Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span className="font-bold">{completionPercentage}%</span>
                  </div>
                  <Progress value={completionPercentage} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Budget Used</span>
                    <div className="text-lg font-bold">65%</div>
                    <Progress value={65} className="h-1.5 bg-muted" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Time Elapsed</span>
                    <div className="text-lg font-bold">42%</div>
                    <Progress value={42} className="h-1.5 bg-muted" />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Key Stakeholders</h4>
                  <div className="flex items-center -space-x-2 overflow-hidden">
                    <Avatar className="inline-block border-2 border-background w-8 h-8">
                      <AvatarImage src="https://github.com/shadcn.png" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <Avatar className="inline-block border-2 border-background w-8 h-8">
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <Avatar className="inline-block border-2 border-background w-8 h-8">
                      <AvatarFallback>WK</AvatarFallback>
                    </Avatar>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground">
                      +4
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/10 border-dashed">
              <CardContent className="p-6 flex flex-col items-center text-center gap-2">
                <div className="p-3 bg-background rounded-full shadow-sm">
                  <Settings className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium mt-2">Configure View</h3>
                <p className="text-xs text-muted-foreground mb-4">Customize the dashboard layout and visible widgets for this project.</p>
                <Button variant="outline" size="sm" className="w-full">Manage Widgets</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  );
}
