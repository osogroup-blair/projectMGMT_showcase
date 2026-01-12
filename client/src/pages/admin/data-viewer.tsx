import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, ChevronDown, ChevronRight, Folder, File, Users, Database, Loader2, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProjectData {
  projects: any[];
  users: any[];
  summary: {
    projectCount: number;
    deliverableCount: number;
    epicCount: number;
    taskCount: number;
    stageCount: number;
    milestoneCount: number;
    sprintCount: number;
    userCount: number;
  };
}

export default function DataViewerPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [data, setData] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("projects");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/data-viewer/projects");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: "Error",
        description: "Failed to load project data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyJson = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      toast({ title: "Copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/admin/import-export")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Data Viewer</h1>
              <p className="text-xs text-muted-foreground">Inspect generated project data structure</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyJson}
              className="gap-1.5"
              disabled={!data}
              data-testid="button-copy-json"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy JSON"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="gap-1.5"
              disabled={isLoading}
              data-testid="button-refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                  {Object.entries(data.summary).map(([key, value]) => (
                    <div key={key} className="text-center p-2 bg-muted rounded-lg">
                      <div className="text-lg font-bold">{value}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {key.replace("Count", "s")}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="projects" className="gap-1.5" data-testid="tab-projects">
                  <Folder className="h-3.5 w-3.5" />
                  Projects ({data.projects.length})
                </TabsTrigger>
                <TabsTrigger value="users" className="gap-1.5" data-testid="tab-users">
                  <Users className="h-3.5 w-3.5" />
                  Users ({data.users.length})
                </TabsTrigger>
                <TabsTrigger value="raw" className="gap-1.5" data-testid="tab-raw">
                  <File className="h-3.5 w-3.5" />
                  Raw JSON
                </TabsTrigger>
              </TabsList>

              <TabsContent value="projects" className="mt-4">
                <div className="space-y-4">
                  {data.projects.map((project) => (
                    <ProjectTreeView key={project.id} project={project} />
                  ))}
                  {data.projects.length === 0 && (
                    <Card className="p-8 text-center text-muted-foreground">
                      No projects found. Generate demo or sample data first.
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="users" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {data.users.map((user) => (
                        <div key={user.id} className="p-3 flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{user.name || user.email || user.id}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <span>{user.email}</span>
                              {user.jobTitle && <span>• {user.jobTitle}</span>}
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {user.systemRole || "member"}
                          </Badge>
                        </div>
                      ))}
                      {data.users.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground">
                          No users found.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="raw" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[600px]">
                      <pre className="p-4 text-xs font-mono whitespace-pre-wrap break-all">
                        {JSON.stringify(data, null, 2)}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <Card className="p-8 text-center text-muted-foreground">
            Failed to load data. Please try again.
          </Card>
        )}
      </main>
    </div>
  );
}

function ProjectTreeView({ project }: { project: any }) {
  const [isOpen, setIsOpen] = useState(true);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "done":
        return "bg-green-500";
      case "active":
      case "in-progress":
      case "in_progress":
        return "bg-blue-500";
      case "planned":
      case "pending":
      case "todo":
        return "bg-gray-400";
      default:
        return "bg-gray-300";
    }
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <div className={`h-2 w-2 rounded-full ${getStatusColor(project.status)}`} />
                <CardTitle className="text-sm font-medium">{project.name}</CardTitle>
                <Badge variant="outline" className="text-xs">{project.progress || 0}%</Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{project.deliverables?.length || 0} deliverables</span>
                <span>•</span>
                <span>{project.deliverables?.reduce((acc: number, d: any) => acc + (d.epics?.length || 0), 0) || 0} epics</span>
                <span>•</span>
                <span>{project.deliverables?.reduce((acc: number, d: any) => acc + d.epics?.reduce((a: number, e: any) => a + (e.tasks?.length || 0), 0), 0) || 0} tasks</span>
              </div>
            </div>
            <CardDescription className="text-xs ml-6">{project.description}</CardDescription>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pl-8 space-y-3">
            {project.stages?.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">Stages</div>
                <div className="flex flex-wrap gap-1.5">
                  {project.stages
                    .sort((a: any, b: any) => a.order - b.order)
                    .map((stage: any) => (
                      <Badge
                        key={stage.id}
                        variant={stage.status === "active" ? "default" : stage.status === "completed" ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {stage.name}
                        {stage.status === "active" && " (Active)"}
                        {stage.status === "completed" && " ✓"}
                      </Badge>
                    ))}
                </div>
              </div>
            )}

            {project.deliverables?.map((deliverable: any) => (
              <DeliverableTreeView key={deliverable.id} deliverable={deliverable} />
            ))}

            {project.milestones?.length > 0 && (
              <div className="space-y-1 pt-2 border-t">
                <div className="text-xs font-medium text-muted-foreground">Milestones ({project.milestones.length})</div>
                <div className="grid grid-cols-2 gap-2">
                  {project.milestones.map((m: any) => (
                    <div key={m.id} className="text-xs bg-muted/50 rounded p-2 flex items-center justify-between">
                      <span>{m.name}</span>
                      <Badge variant="outline" className="text-[10px]">{m.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {project.sprints?.length > 0 && (
              <div className="space-y-1 pt-2 border-t">
                <div className="text-xs font-medium text-muted-foreground">Sprints ({project.sprints.length})</div>
                <div className="grid grid-cols-2 gap-2">
                  {project.sprints.map((s: any) => (
                    <div key={s.id} className="text-xs bg-muted/50 rounded p-2 flex items-center justify-between">
                      <span>{s.name}</span>
                      <Badge variant="outline" className="text-[10px]">{s.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function DeliverableTreeView({ deliverable }: { deliverable: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full text-left">
        <div className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 transition-colors">
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <Folder className="h-3.5 w-3.5 text-amber-600" />
          <span className="text-xs font-medium">{deliverable.title}</span>
          <Badge variant="outline" className="text-[10px] ml-auto">{deliverable.progress || 0}%</Badge>
          <span className="text-[10px] text-muted-foreground">{deliverable.epics?.length || 0} epics</span>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="ml-5 space-y-1">
        {deliverable.epics?.map((epic: any) => (
          <EpicTreeView key={epic.id} epic={epic} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function EpicTreeView({ epic }: { epic: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full text-left">
        <div className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 transition-colors">
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <Folder className="h-3 w-3 text-purple-600" />
          <span className="text-xs">{epic.title}</span>
          <Badge variant="outline" className="text-[10px] ml-auto">{epic.progress || 0}%</Badge>
          <span className="text-[10px] text-muted-foreground">{epic.tasks?.length || 0} tasks</span>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="ml-5">
        {epic.tasks?.map((task: any) => (
          <div
            key={task.id}
            className="flex items-center gap-2 p-1 text-xs text-muted-foreground"
          >
            <File className="h-3 w-3" />
            <span className="truncate flex-1">{task.title}</span>
            <Badge
              variant={task.status === "done" ? "secondary" : task.status === "in-progress" ? "default" : "outline"}
              className="text-[10px]"
            >
              {task.status}
            </Badge>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
