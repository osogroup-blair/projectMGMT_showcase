import { useState } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  Users, 
  Banknote, 
  Settings, 
  ClipboardList,
  Calendar,
  AlertTriangle,
  HeartPulse,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoute, Link } from "wouter";
import { useProject } from "@/hooks/use-nexus-data";

export default function ProjectManagement() {
  const [match, params] = useRoute("/projects/:projectId/management");
  const projectId = params?.projectId || "1";
  const [activeTab, setActiveTab] = useState("tasks");

  const { data: project, isLoading } = useProject(projectId);

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Project Management</h1>
            <p className="text-sm text-muted-foreground">{project?.name}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href={`/projects/${projectId}/team`}>
            <Button variant="outline" className="gap-2" data-testid="button-team">
              <Users className="h-4 w-4" />
              Teams
            </Button>
          </Link>
          <Link href={`/projects/${projectId}/budget`}>
            <Button variant="outline" className="gap-2" data-testid="button-budget">
              <Banknote className="h-4 w-4" />
              Budget
            </Button>
          </Link>
          <Link href={`/projects/${projectId}/settings`}>
            <Button variant="outline" className="gap-2" data-testid="button-settings">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
            <TabsTrigger 
              value="tasks" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 gap-2"
              data-testid="tab-management-tasks"
            >
              <ClipboardList className="h-4 w-4" />
              Management Tasks
            </TabsTrigger>
            <TabsTrigger 
              value="meetings" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 gap-2"
              data-testid="tab-meetings"
            >
              <Calendar className="h-4 w-4" />
              Meetings
            </TabsTrigger>
            <TabsTrigger 
              value="raid" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 gap-2"
              data-testid="tab-raid-log"
            >
              <AlertTriangle className="h-4 w-4" />
              RAID Log
            </TabsTrigger>
            <TabsTrigger 
              value="health" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 gap-2"
              data-testid="tab-project-health"
            >
              <HeartPulse className="h-4 w-4" />
              Project Health
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Management Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Management tasks will appear here</p>
                  <p className="text-sm mt-1">Track administrative and project management activities</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="meetings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Meetings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Scheduled meetings will appear here</p>
                  <p className="text-sm mt-1">Plan and track project meetings and reviews</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="raid" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>RAID Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Risks, Assumptions, Issues, and Dependencies</p>
                  <p className="text-sm mt-1">Track and manage project RAID items</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <HeartPulse className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Project health metrics will appear here</p>
                  <p className="text-sm mt-1">Monitor overall project status and KPIs</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
}
