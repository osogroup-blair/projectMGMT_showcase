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
  Layers,
  Users,
  Eye,
  Briefcase
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
import { PROJECTS, PROJECT_STAGES, MILESTONES, STAGE_STATUS_OPTIONS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { StageTabContent } from "@/components/project/stage-tab-content";
import { TimelineView } from "@/components/project/timeline-view";

// Mock Data Types
interface TaskStats {
  total: number;
  completed: number;
  atRisk: number;
  inProgress: number;
}

// Mock Data Generator
const getProjectData = (id: string) => {
  const project = PROJECTS.find(p => p.id === id) || PROJECTS[0];
  
  // Use the global stages we defined
  const stages = PROJECT_STAGES;

  // Filter milestones for this project (mocking association)
  const milestones = MILESTONES; // In a real app, filter by projectId

  const stats: TaskStats = {
    total: 45,
    completed: 18,
    inProgress: 12,
    atRisk: 3
  };

  return { project, stages, milestones, stats };
};

import { DeliverablesContent } from "@/pages/deliverables";

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
                  <Briefcase className="h-4 w-4" />
                  Nymbl Implementation
                </span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Due {project.deadline}
                </span>
              </div>
            </div>

            <div className="flex gap-2 w-full lg:w-auto">
              <Link href={`/projects/${projectId}/team`}>
                <Button variant="outline" className="gap-2">
                  <Users className="h-4 w-4" />
                  Team
                </Button>
              </Link>
              <Link href={`/projects/${projectId}/settings`}>
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </Link>
              <Button size="icon" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6 overflow-x-auto">
            <TabsTrigger 
              value="overview" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
            >
              Project Overview
            </TabsTrigger>

            <TabsTrigger 
              value="deliverables" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
            >
              Deliverables
            </TabsTrigger>

             <TabsTrigger 
              value="timeline" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
            >
              Timeline
            </TabsTrigger>
            
            {stages.map(stage => {
              const statusConfig = STAGE_STATUS_OPTIONS.find(s => s.label === stage.status);
              // Extract base color from config or default to muted
              // Assuming config.color follows "bg-X-50 text-X-700 border-X-200" pattern
              const statusColorClass = statusConfig?.color || "bg-muted/50 text-muted-foreground border-muted";
              
              // For the tab text/border, we need to adapt slightly or use the config directly
              // We'll extract the text color part for the tab label
              const textClass = statusConfig ? statusConfig.color.split(' ').find(c => c.startsWith('text-')) : 'text-muted-foreground';
              // For the active border, we'll try to match the text color but as a border
              const borderClass = textClass?.replace('text-', 'data-[state=active]:border-');

              return (
                <TabsTrigger 
                  key={stage.id}
                  value={`stage-${stage.id}`}
                  className={cn(
                    "rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent px-0 py-2 font-medium",
                    textClass,
                    borderClass
                  )}
                >
                  <span className={cn(
                    "mr-2 flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
                    statusColorClass
                  )}>
                    {stage.order}
                  </span>
                  {stage.name}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="mt-6">
            {/* Project Overview Tab Content */}
            <TabsContent value="overview" className="space-y-8">
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
                  <div className="lg:col-span-2 space-y-6">
                     <Card>
                      <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest updates from the team</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex gap-4 p-3 hover:bg-muted/50 rounded-lg transition-colors">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>U{i}</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <p className="text-sm">
                                            <span className="font-medium">User {i}</span> updated task <span className="font-medium text-primary">Requirement Analysis</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                      </CardContent>
                     </Card>
                  </div>

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
                  </div>
                </div>
            </TabsContent>
            
            {/* Timeline Tab Content */}
            <TabsContent value="timeline" className="h-[700px]">
               <TimelineView stages={stages} milestones={milestones} project={project} />
            </TabsContent>

            {/* Dynamic Stage Tabs */}
            {stages.map(stage => (
              <TabsContent key={stage.id} value={`stage-${stage.id}`} className="mt-6">
                 <StageTabContent stage={stage} projectId={projectId} />
              </TabsContent>
            ))}

            {/* Deliverables Tab */}
            <TabsContent value="deliverables">
              <div className="mt-6">
                <DeliverablesContent projectId={projectId} />
              </div>
            </TabsContent>

          </div>
        </Tabs>
      </div>
    </Shell>
  );
}