import { useState } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  ArrowLeft, 
  Settings,
  Save,
  AlertTriangle,
  Info,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useRoute, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { 
  PROJECTS, 
  FRAMEWORK_TEMPLATES, 
  MAPPING_TEMPLATES,
  PROJECT_STAGES,
  STAGE_STATUS_OPTIONS
} from "@/lib/mock-data";

export default function ProjectSettings() {
  const [match, params] = useRoute("/projects/:projectId/settings");
  const projectId = params?.projectId || "1";
  const { toast } = useToast();

  const project = PROJECTS.find(p => p.id === projectId) || PROJECTS[0];

  const [formData, setFormData] = useState({
    name: project.name,
    status: project.status,
    frameworkId: project.frameworkId || "ft1",
    defaultMappingTemplateId: project.defaultMappingTemplateId || "mt1",
    permissions: JSON.stringify(project.permissions || {
      "view_project": ["admin", "member", "viewer"],
      "edit_project": ["admin"],
      "delete_project": ["admin"]
    }, null, 2),
    isArchived: project.status === "Archived"
  });

  // Local state for stages
  const [stages, setStages] = useState(PROJECT_STAGES);

  const handleSave = () => {
    // In a real app, this would mutate the project and stages
    toast({
      title: "Settings Saved",
      description: "Project settings and stage configurations have been successfully updated.",
    });
  };

  const handleStageChange = (id: string, field: string, value: any) => {
    setStages(prev => prev.map(stage => 
      stage.id === id ? { ...stage, [field]: value } : stage
    ));
  };

  return (
    <Shell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href={`/projects/${projectId}`} className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Project
            </Link>
            <span className="text-border">|</span>
            <span>Settings</span>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-primary">Project Settings</h1>
              <p className="text-muted-foreground mt-1">Manage configuration and defaults for {project.name}.</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/projects/${projectId}/export`}>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export Data
                </Button>
              </Link>
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>Basic details and status of the project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input 
                  id="projectName" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="flex items-center justify-between border rounded-lg p-4 bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-base">Archive Project</Label>
                  <p className="text-sm text-muted-foreground">
                    Archived projects are read-only and hidden from default lists.
                  </p>
                </div>
                <Switch 
                  checked={formData.isArchived}
                  onCheckedChange={(checked) => setFormData({...formData, isArchived: checked})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Templates Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Framework & Defaults</CardTitle>
              <CardDescription>Configure the project's methodology and default settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="framework">Project Framework</Label>
                  <SearchableSelect 
                    value={formData.frameworkId} 
                    onValueChange={(val) => setFormData({...formData, frameworkId: val})}
                    placeholder="Select a framework"
                    options={FRAMEWORK_TEMPLATES.map(t => ({ value: t.id, label: t.name }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Defines the overall stages and workflow methodology.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mappingTemplate">Default Import Mapping</Label>
                  <SearchableSelect 
                    value={formData.defaultMappingTemplateId} 
                    onValueChange={(val) => setFormData({...formData, defaultMappingTemplateId: val})}
                    placeholder="Select a mapping"
                    options={MAPPING_TEMPLATES.map(t => ({ value: t.id, label: `${t.name} (${t.dataType})` }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Default field mapping configuration for imports.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stage Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Stage Configuration</CardTitle>
              <CardDescription>Customize the stages, their order, and status colors for this project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {stages.map((stage, index) => (
                  <div key={stage.id} className="flex items-start gap-4 p-4 border rounded-lg bg-card">
                    <div className="flex-none pt-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border bg-muted text-xs font-medium">
                        {index + 1}
                      </div>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Stage Name</Label>
                        <Input 
                          value={stage.name}
                          onChange={(e) => handleStageChange(stage.id, 'name', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Status & Color</Label>
                        <SearchableSelect 
                          value={stage.status}
                          onValueChange={(val) => handleStageChange(stage.id, 'status', val)}
                          placeholder="Select status"
                          options={STAGE_STATUS_OPTIONS.map(option => ({ value: option.label, label: option.label }))}
                        />
                      </div>

                      <div className="col-span-1 md:col-span-2 space-y-2">
                        <Label>Description</Label>
                        <Input 
                          value={stage.description || ''}
                          onChange={(e) => handleStageChange(stage.id, 'description', e.target.value)}
                          placeholder="Stage description"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Advanced Permissions */}
          <Card>
            <CardHeader>
              <CardTitle>Access Control</CardTitle>
              <CardDescription>Advanced JSON configuration for project-level permissions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md bg-amber-50 p-4 border border-amber-200 flex gap-3 mb-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-800">Advanced Configuration</p>
                  <p className="text-xs text-amber-700">
                    Modifying permissions directly can lock users out of the project. Ensure you validate the JSON structure before saving.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="permissionsJson">Permissions JSON</Label>
                <Textarea 
                  id="permissionsJson" 
                  className="font-mono text-xs min-h-[150px]"
                  value={formData.permissions}
                  onChange={(e) => setFormData({...formData, permissions: e.target.value})}
                />
              </div>
            </CardContent>
            <CardFooter className="bg-muted/10 border-t px-6 py-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>Changes to permissions take effect immediately upon saving.</span>
              </div>
            </CardFooter>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>Destructive actions for this project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-red-100 rounded-lg bg-red-50/50">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-red-900">Delete Project</p>
                  <p className="text-xs text-red-700/80">
                    Permanently delete this project and all its data. This action cannot be undone.
                  </p>
                </div>
                <Button variant="destructive" size="sm">Delete Project</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
