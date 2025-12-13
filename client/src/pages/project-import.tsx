import { useState } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, FileText, ArrowRight, FolderPlus, FolderOpen } from "lucide-react";
import { PROJECTS } from "@/lib/mock-data";
import { useLocation } from "wouter";

export default function ProjectImport() {
  const [_, setLocation] = useLocation();
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const loadDemoFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const demoFile = new File(
      ["name,client,start_date,budget,owner\nWebsite Redesign,Acme,2024-01-01,50000,Sarah"], 
      "Q1_2024_Projects_Import.csv", 
      { type: "text/csv" }
    );
    setFile(demoFile);
  };

  const handleContinue = () => {
    // Mock session ID generation and navigation
    const sessionId = "session_" + Math.random().toString(36).substr(2, 9);
    setLocation(`/projects/import/${sessionId}/mapping`);
  };

  return (
    <Shell>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Import Project Data</h1>
          <p className="text-muted-foreground">Upload a file to create a new project or update an existing one.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Import Configuration</CardTitle>
            <CardDescription>Choose how you want to import your data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup defaultValue="new" value={mode} onValueChange={(v: "new" | "existing") => setMode(v)} className="grid grid-cols-2 gap-4">
              <div>
                <RadioGroupItem value="new" id="new" className="peer sr-only" />
                <Label
                  htmlFor="new"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all h-full"
                >
                  <FolderPlus className="mb-3 h-6 w-6 text-primary" />
                  <div className="text-center">
                    <div className="font-semibold">Create New Project</div>
                    <div className="text-xs text-muted-foreground mt-1">Start a fresh project from your file</div>
                  </div>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="existing" id="existing" className="peer sr-only" />
                <Label
                  htmlFor="existing"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all h-full"
                >
                  <FolderOpen className="mb-3 h-6 w-6 text-primary" />
                  <div className="text-center">
                    <div className="font-semibold">Update Existing</div>
                    <div className="text-xs text-muted-foreground mt-1">Add data to an active project</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {mode === "existing" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <Label>Select Target Project</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECTS.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Upload File</CardTitle>
            <CardDescription>Supported formats: CSV, Excel, JSON</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`
                border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer
                ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/20'}
                ${file ? 'bg-primary/5 border-primary' : ''}
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".csv,.xlsx,.json"
              />
              
              <div className="flex flex-col items-center gap-4">
                <div className={`p-4 rounded-full ${file ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {file ? <FileText className="h-8 w-8" /> : <Upload className="h-8 w-8" />}
                </div>
                <div>
                  {file ? (
                    <>
                      <h3 className="font-semibold text-lg text-primary">{file.name}</h3>
                      <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                    </>
                  ) : (
                    <>
                      <h3 className="font-semibold text-lg">Click or drag file to upload</h3>
                      <p className="text-sm text-muted-foreground mt-1">Maximum file size 50MB</p>
                      <Button variant="link" size="sm" className="mt-2 text-primary" onClick={loadDemoFile}>
                        Use Demo CSV
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="ghost">Cancel</Button>
          <Button onClick={handleContinue} disabled={!file || (mode === 'existing' && !selectedProject)} className="gap-2">
            Continue to Mapping
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Shell>
  );
}
