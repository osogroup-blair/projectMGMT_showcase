import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Wand2, Loader2, Trash2, Play, CheckCircle2, AlertCircle, Database, Users, Eye } from "lucide-react";
import type { SampleSection } from "../types";
import { Link } from "wouter";

interface SampleDataCardProps {
  className?: string;
}

export function SampleDataCard({ className }: SampleDataCardProps) {
  const { toast } = useToast();
  const [hasSampleData, setHasSampleData] = useState(false);
  const [hasDemoData, setHasDemoData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [lastResult, setLastResult] = useState<{ created: Record<string, number>; errors?: string[] } | null>(null);
  const [activeTab, setActiveTab] = useState<"sample" | "demo">("demo");

  useEffect(() => {
    checkDataStatus();
  }, []);

  const checkDataStatus = async () => {
    try {
      const [sampleRes, demoRes] = await Promise.all([
        fetch("/api/admin/sample-data/status"),
        fetch("/api/admin/demo-data/status"),
      ]);
      const sampleData = await sampleRes.json();
      const demoData = await demoRes.json();
      setHasSampleData(sampleData.hasSampleData);
      setHasDemoData(demoData.hasDemoData);
    } catch (error) {
      console.error("Failed to check data status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSample = async (section: SampleSection, clearFirst: boolean = false) => {
    setIsGenerating(true);
    setLastResult(null);
    try {
      const response = await fetch("/api/admin/sample-data/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, clearFirst }),
      });
      const result = await response.json();
      
      if (result.success) {
        setLastResult({ created: result.created, errors: result.errors });
        toast({
          title: "Sample data generated",
          description: `Created: ${Object.entries(result.created || {}).map(([k, v]) => `${v} ${k}`).join(", ")}`,
        });
        await checkDataStatus();
      } else {
        toast({
          title: "Generation failed",
          description: result.errors?.join(", ") || result.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateDemo = async () => {
    setIsGenerating(true);
    setLastResult(null);
    try {
      const response = await fetch("/api/admin/demo-data/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearFirst: true }),
      });
      const result = await response.json();
      
      if (result.success) {
        setLastResult({ created: result.created, errors: result.errors });
        toast({
          title: "Demo data generated",
          description: `Created: ${Object.entries(result.created || {}).map(([k, v]) => `${v} ${k}`).join(", ")}`,
        });
        await checkDataStatus();
      } else {
        toast({
          title: "Generation failed",
          description: result.errors?.join(", ") || result.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearSample = async () => {
    setIsClearing(true);
    setLastResult(null);
    try {
      const response = await fetch("/api/admin/sample-data/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Sample data cleared",
          description: `Deleted: ${Object.entries(result.deleted || {}).map(([k, v]) => `${v} ${k}`).join(", ")}`,
        });
        await checkDataStatus();
      } else {
        toast({
          title: "Clear failed",
          description: "Could not clear sample data",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearDemo = async () => {
    setIsClearing(true);
    setLastResult(null);
    try {
      const response = await fetch("/api/admin/demo-data/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Demo data cleared",
          description: `Deleted: ${Object.entries(result.deleted || {}).map(([k, v]) => `${v} ${k}`).join(", ")}`,
        });
        await checkDataStatus();
      } else {
        toast({
          title: "Clear failed",
          description: "Could not clear demo data",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const sections: { id: SampleSection; label: string; description: string }[] = [
    { id: "core", label: "Core", description: "Project, Deliverables, Epics, Stages" },
    { id: "tasks", label: "Tasks", description: "Tasks with dependencies" },
    { id: "milestones", label: "Milestones", description: "Project milestones" },
    { id: "sprints", label: "Sprints", description: "Sprints with members" },
    { id: "comments", label: "Comments", description: "Comments and activity" },
  ];

  const demoProjects = [
    { name: "CRM System", progress: 60, stage: "Development", color: "bg-blue-500" },
    { name: "Task Management App", progress: 30, stage: "Design", color: "bg-purple-500" },
    { name: "Time Entry System", progress: 10, stage: "Requirements", color: "bg-amber-500" },
  ];

  const ResultDisplay = () => (
    <>
      {lastResult && Object.keys(lastResult.created).length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="text-xs text-green-800">
              <p className="font-medium">Created:</p>
              <p className="mt-1">
                {Object.entries(lastResult.created)
                  .filter(([, count]) => count > 0)
                  .map(([entity, count]) => `${count} ${entity}`)
                  .join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {lastResult?.errors && lastResult.errors.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div className="text-xs text-amber-800">
              <p className="font-medium">Notes:</p>
              {lastResult.errors.map((err, i) => (
                <p key={i} className="mt-1">{err}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Generate Test Data
          </CardTitle>
          <Link href="/admin/data-viewer">
            <Button variant="ghost" size="sm" className="gap-1.5 h-7" data-testid="button-view-data">
              <Eye className="h-3.5 w-3.5" />
              View Data
            </Button>
          </Link>
        </div>
        <CardDescription className="text-xs">
          Generate sample or demo data for testing and demonstration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "sample" | "demo")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="demo" className="text-xs gap-1.5" data-testid="tab-demo-data">
                <Users className="h-3.5 w-3.5" />
                Demo Data
                {hasDemoData && <span className="ml-1 h-1.5 w-1.5 bg-green-500 rounded-full" />}
              </TabsTrigger>
              <TabsTrigger value="sample" className="text-xs gap-1.5" data-testid="tab-sample-data">
                <Database className="h-3.5 w-3.5" />
                Sample Data
                {hasSampleData && <span className="ml-1 h-1.5 w-1.5 bg-green-500 rounded-full" />}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="demo" className="space-y-4 mt-4">
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium">Demo Data Includes:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• 5 Demo Users (Solution Consultant, Product Designer, Developer Lead, QA Engineer, Documentation Manager)</li>
                  <li>• Delivery Framework (Requirements → Design → Development → QA → Documentation)</li>
                  <li>• 3 Projects at different stages:</li>
                </ul>
                <div className="space-y-1.5 mt-2">
                  {demoProjects.map((project) => (
                    <div key={project.name} className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${project.color}`} />
                      <span className="text-xs">{project.name}</span>
                      <span className="text-xs text-muted-foreground">({project.progress}% - {project.stage})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={handleGenerateDemo}
                  disabled={isGenerating || isClearing}
                  data-testid="button-generate-demo"
                >
                  {isGenerating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                  Generate Demo Data
                </Button>
                {hasDemoData && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1.5"
                    onClick={handleClearDemo}
                    disabled={isGenerating || isClearing}
                    data-testid="button-clear-demo-data"
                  >
                    {isClearing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Clear
                  </Button>
                )}
              </div>

              <ResultDisplay />
            </TabsContent>

            <TabsContent value="sample" className="space-y-4 mt-4">
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => handleGenerateSample("all", false)}
                  disabled={isGenerating || isClearing}
                  data-testid="button-generate-all"
                >
                  {isGenerating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                  Generate All
                </Button>
                {hasSampleData && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1.5"
                    onClick={handleClearSample}
                    disabled={isGenerating || isClearing}
                    data-testid="button-clear-sample-data"
                  >
                    {isClearing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Clear
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Or generate by section:</p>
                <div className="grid grid-cols-2 gap-2">
                  {sections.map((section) => (
                    <Button
                      key={section.id}
                      variant="outline"
                      size="sm"
                      className="h-auto py-2 flex flex-col items-start text-left"
                      onClick={() => handleGenerateSample(section.id, false)}
                      disabled={isGenerating || isClearing}
                      data-testid={`button-generate-${section.id}`}
                    >
                      <span className="text-xs font-medium">{section.label}</span>
                      <span className="text-[10px] text-muted-foreground">{section.description}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <ResultDisplay />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
