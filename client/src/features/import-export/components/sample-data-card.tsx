import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Wand2, Loader2, Trash2, Play, CheckCircle2, AlertCircle } from "lucide-react";
import type { SampleSection } from "../types";

interface SampleDataCardProps {
  className?: string;
}

export function SampleDataCard({ className }: SampleDataCardProps) {
  const { toast } = useToast();
  const [hasSampleData, setHasSampleData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [lastResult, setLastResult] = useState<{ created: Record<string, number>; errors?: string[] } | null>(null);

  useEffect(() => {
    checkSampleDataStatus();
  }, []);

  const checkSampleDataStatus = async () => {
    try {
      const response = await fetch("/api/admin/sample-data/status");
      const data = await response.json();
      setHasSampleData(data.hasSampleData);
    } catch (error) {
      console.error("Failed to check sample data status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (section: SampleSection, clearFirst: boolean = false) => {
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
        await checkSampleDataStatus();
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

  const handleClear = async () => {
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
        await checkSampleDataStatus();
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

  const sections: { id: SampleSection; label: string; description: string }[] = [
    { id: "core", label: "Core", description: "Project, Deliverables, Epics, Stages" },
    { id: "tasks", label: "Tasks", description: "Tasks with dependencies" },
    { id: "milestones", label: "Milestones", description: "Project milestones" },
    { id: "sprints", label: "Sprints", description: "Sprints with members" },
    { id: "comments", label: "Comments", description: "Comments and activity" },
  ];

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Sample Project Data
          </CardTitle>
          {hasSampleData && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </div>
        <CardDescription className="text-xs">
          Generate sample data for testing and demonstration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={() => handleGenerate("all", false)}
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
                  onClick={handleClear}
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
                    onClick={() => handleGenerate(section.id, false)}
                    disabled={isGenerating || isClearing}
                    data-testid={`button-generate-${section.id}`}
                  >
                    <span className="text-xs font-medium">{section.label}</span>
                    <span className="text-[10px] text-muted-foreground">{section.description}</span>
                  </Button>
                ))}
              </div>
            </div>

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
        )}
      </CardContent>
    </Card>
  );
}
