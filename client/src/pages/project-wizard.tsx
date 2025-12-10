import { useState } from "react";
import { useLocation } from "wouter";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Package, 
  FileBox, 
  Layers, 
  Users, 
  Plus, 
  Trash2,
  Settings,
  Save,
  Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

// Import mock data
import { 
  PROJECT_TEMPLATES, 
  FRAMEWORK_TEMPLATES, 
  STAGE_TEMPLATES, 
  ROLE_TEMPLATES,
  TEAM,
  DELIVERABLE_TEMPLATES,
  EPIC_TEMPLATES,
  TASK_TEMPLATES,
} from "@/lib/mock-data";

const STEPS = [
  { id: 1, title: "Project Basics", description: "Name, framework, and templates", icon: Settings },
  { id: 2, title: "Work Breakdown", description: "Deliverables, epics, and tasks", icon: Package },
  { id: 3, title: "Stage Configuration", description: "Review and customize stages", icon: Layers },
  { id: 4, title: "Team & Roles", description: "Assign team members", icon: Users },
  { id: 5, title: "Review", description: "Verify and create", icon: Check },
];

export default function ProjectWizard() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Wizard State
  const [projectData, setProjectData] = useState({
    name: "",
    description: "",
    frameworkId: "",
    templateId: "",
    startDate: new Date().toISOString().split('T')[0],
    dueDate: "",
  });

  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  // Handlers
  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCreateProject();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        // Strategy: Look for specific sheets, or fallback to first sheet
        // We expect "Deliverables" and "Epics" sheets, or a flat structure
        
        let newDeliverables = [...deliverables];
        let processedDeliverables = new Map<string, any>(); // Map Name -> Deliverable Object

        // Initialize with existing deliverables to avoid duplicates if possible, or just append?
        // Let's append/merge.
        
        // 1. Try to find "Deliverables" sheet
        const deliverablesSheetName = wb.SheetNames.find(n => n.toLowerCase().includes('deliverable'));
        const epicsSheetName = wb.SheetNames.find(n => n.toLowerCase().includes('epic'));

        if (deliverablesSheetName && epicsSheetName) {
            // Two separate sheets
            const dData = XLSX.utils.sheet_to_json(wb.Sheets[deliverablesSheetName]);
            const eData = XLSX.utils.sheet_to_json(wb.Sheets[epicsSheetName]);

            // Process Deliverables
            dData.forEach((row: any) => {
                const title = row['Title'] || row['Name'] || row['Deliverable'];
                if (title) {
                    const id = `d-${Date.now()}-${Math.random()}`;
                    const d = {
                        id,
                        title,
                        description: row['Description'] || "",
                        epics: []
                    };
                    processedDeliverables.set(title, d);
                }
            });

            // Process Epics
            eData.forEach((row: any) => {
                const epicTitle = row['Title'] || row['Name'] || row['Epic'];
                const parentDeliverable = row['Deliverable'] || row['Parent'] || row['Deliverable Name'];
                
                if (epicTitle && parentDeliverable && processedDeliverables.has(parentDeliverable)) {
                     processedDeliverables.get(parentDeliverable).epics.push({
                        id: `e-${Date.now()}-${Math.random()}`,
                        title: epicTitle,
                        description: row['Description'] || "",
                        tasks: []
                     });
                }
            });

        } else {
            // Fallback: First sheet, flat structure or just list
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            // Check structure
            const hasDeliverableCol = data.length > 0 && ('Deliverable' in (data[0] as object) || 'Deliverable Name' in (data[0] as object));
            
            if (hasDeliverableCol) {
                // Flat structure: Deliverable | Epic | Description
                data.forEach((row: any) => {
                    const dName = row['Deliverable'] || row['Deliverable Name'];
                    const eName = row['Epic'] || row['Epic Name'] || row['Title']; // If 'Title' assumes Epic Title if Deliverable col exists
                    
                    if (dName) {
                        if (!processedDeliverables.has(dName)) {
                            processedDeliverables.set(dName, {
                                id: `d-${Date.now()}-${Math.random()}`,
                                title: dName,
                                description: row['Deliverable Description'] || "",
                                epics: []
                            });
                        }

                        if (eName) {
                            processedDeliverables.get(dName).epics.push({
                                id: `e-${Date.now()}-${Math.random()}`,
                                title: eName,
                                description: row['Description'] || row['Epic Description'] || "",
                                tasks: []
                            });
                        }
                    }
                });
            } else {
                // Simple list of deliverables? Or maybe just try to guess
                // Let's assume it's just a list of things to add as deliverables if no "Epic" column
                 data.forEach((row: any) => {
                    const title = row['Title'] || row['Name'] || Object.values(row)[0]; // Fallback to first column
                    if (title && typeof title === 'string') {
                         processedDeliverables.set(title, {
                                id: `d-${Date.now()}-${Math.random()}`,
                                title: title,
                                description: row['Description'] || "",
                                epics: []
                            });
                    }
                 });
            }
        }

        // Convert Map to Array and update state
        if (processedDeliverables.size > 0) {
            setDeliverables([...deliverables, ...Array.from(processedDeliverables.values())]);
            toast({
                title: "Import Successful",
                description: `Imported ${processedDeliverables.size} deliverables from Excel.`,
            });
        } else {
            toast({
                title: "Import Failed",
                description: "Could not find valid data structure. Please check column headers.",
                variant: "destructive"
            });
        }

      } catch (error) {
        console.error("Error reading file:", error);
        toast({
            title: "Import Error",
            description: "Failed to parse the Excel file.",
            variant: "destructive"
        });
      }
    };
    reader.readAsBinaryString(file);
    
    // Reset input
    e.target.value = '';
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = PROJECT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setProjectData(prev => ({
        ...prev,
        templateId,
        name: prev.name || template.name,
        description: prev.description || template.description,
        frameworkId: template.defaultFrameworkId
      }));

      // Populate Stages from Framework
      const framework = FRAMEWORK_TEMPLATES.find(f => f.id === template.defaultFrameworkId);
      if (framework) {
        const frameworkStages = framework.defaultStages.map(sid => STAGE_TEMPLATES.find(st => st.id === sid)).filter(Boolean);
        setStages(frameworkStages);
      }

      // Populate Deliverables
      if (template.defaultDeliverables) {
        const templateDeliverables = template.defaultDeliverables.map(did => {
          const dTemplate = DELIVERABLE_TEMPLATES.find(dt => dt.id === did);
          if (!dTemplate) return null;
          
          return {
            id: `d-${Date.now()}-${Math.random()}`,
            title: dTemplate.title,
            description: dTemplate.description,
            epics: dTemplate.defaultEpics.map(eid => {
                const eTemplate = EPIC_TEMPLATES.find(et => et.id === eid);
                if (!eTemplate) return null;
                return {
                    id: `e-${Date.now()}-${Math.random()}`,
                    title: eTemplate.title,
                    description: eTemplate.description,
                    tasks: [] 
                };
            }).filter(Boolean)
          };
        }).filter(Boolean);
        setDeliverables(templateDeliverables);
      }

      // Populate Roles (Aggregated from Project, Framework Stages, and Tasks)
      const uniqueRoleIds = new Set<string>();
      
      // 1. From Project Template
      if (template.defaultRoles) {
        template.defaultRoles.forEach(rid => uniqueRoleIds.add(rid));
      }

      // 2. From Framework Stages & Tasks
      if (framework) {
        framework.defaultStages.forEach(sid => {
            const stage = STAGE_TEMPLATES.find(st => st.id === sid);
            if (stage) {
                // Stage required roles
                stage.defaultRoles?.forEach(rid => uniqueRoleIds.add(rid));
                
                // Task required roles
                stage.defaultTasks?.forEach(tid => {
                    const task = TASK_TEMPLATES.find(t => t.id === tid);
                    if (task?.assignedRoleId) {
                        uniqueRoleIds.add(task.assignedRoleId);
                    }
                });
            }
        });
      }

      const aggregatedRoles = Array.from(uniqueRoleIds).map(rid => {
          const rTemplate = ROLE_TEMPLATES.find(rt => rt.id === rid);
          if (!rTemplate) return null;
          return {
              id: `r-${Date.now()}-${Math.random()}`,
              name: rTemplate.name,
              description: rTemplate.description,
              roleType: rTemplate.defaultRoleType,
              assigneeId: null
          };
      }).filter(Boolean);
      
      setRoles(aggregatedRoles);
    }
  };

  const handleFrameworkSelect = (frameworkId: string) => {
    setProjectData(prev => ({ ...prev, frameworkId }));
    const framework = FRAMEWORK_TEMPLATES.find(f => f.id === frameworkId);
    if (framework) {
      const frameworkStages = framework.defaultStages.map(sid => STAGE_TEMPLATES.find(st => st.id === sid)).filter(Boolean);
      setStages(frameworkStages);

      // Re-calculate roles based on new framework (preserving project template roles if possible, but simpler to rebuild)
      // Note: We might lose project-level roles if we just rebuild from stages.
      // Better strategy: Keep roles that came from Project Template, replace Stage-derived roles.
      // For prototype simplicity, let's rebuild, assuming Project Template is the source of truth for Project Roles.
      
      const uniqueRoleIds = new Set<string>();
      
      // 1. From Project Template (if selected)
      if (projectData.templateId) {
          const template = PROJECT_TEMPLATES.find(t => t.id === projectData.templateId);
          template?.defaultRoles?.forEach(rid => uniqueRoleIds.add(rid));
      }

      // 2. From New Framework Stages
      framework.defaultStages.forEach(sid => {
          const stage = STAGE_TEMPLATES.find(st => st.id === sid);
          if (stage) {
              stage.defaultRoles?.forEach(rid => uniqueRoleIds.add(rid));
              stage.defaultTasks?.forEach(tid => {
                  const task = TASK_TEMPLATES.find(t => t.id === tid);
                  if (task?.assignedRoleId) {
                      uniqueRoleIds.add(task.assignedRoleId);
                  }
              });
          }
      });

      const aggregatedRoles = Array.from(uniqueRoleIds).map(rid => {
          const rTemplate = ROLE_TEMPLATES.find(rt => rt.id === rid);
          if (!rTemplate) return null;
          return {
              id: `r-${Date.now()}-${Math.random()}`,
              name: rTemplate.name,
              description: rTemplate.description,
              roleType: rTemplate.defaultRoleType,
              assigneeId: null
          };
      }).filter(Boolean);
      
      setRoles(aggregatedRoles);
    }
  };

  const handleCreateProject = () => {
    toast({
      title: "Project Created",
      description: `${projectData.name} has been successfully created.`,
    });
    setLocation("/projects");
  };

  return (
    <Shell>
      <div className="mx-auto max-w-5xl py-6">
        <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-primary">New Project Wizard</h1>
            <p className="text-muted-foreground">Follow the steps to set up your new project structure.</p>
        </div>

        {/* Stepper */}
        <div className="mb-8">
            <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10" />
                {STEPS.map((step) => {
                    const isActive = currentStep === step.id;
                    const isCompleted = currentStep > step.id;
                    const Icon = step.icon;

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2">
                            <div 
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                                    isActive ? "border-primary bg-primary text-primary-foreground" : 
                                    isCompleted ? "border-primary bg-primary/20 text-primary" : "border-muted bg-background text-muted-foreground"
                                )}
                            >
                                {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                            </div>
                            <div className="text-center hidden sm:block">
                                <div className={cn("text-sm font-medium", isActive ? "text-primary" : "text-muted-foreground")}>{step.title}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Content */}
        <Card className="min-h-[500px] flex flex-col">
            <CardHeader>
                <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
                <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                {currentStep === 1 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="projectName">Project Name</Label>
                            <Input 
                              id="projectName" 
                              placeholder="e.g. Website Rebrand 2024" 
                              value={projectData.name}
                              onChange={(e) => setProjectData({...projectData, name: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea 
                              id="description" 
                              placeholder="Describe the goals and scope..." 
                              className="h-32"
                              value={projectData.description}
                              onChange={(e) => setProjectData({...projectData, description: e.target.value})}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input 
                                    type="date" 
                                    value={projectData.startDate}
                                    onChange={(e) => setProjectData({...projectData, startDate: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Input 
                                    type="date" 
                                    value={projectData.dueDate}
                                    onChange={(e) => setProjectData({...projectData, dueDate: e.target.value})}
                                />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="space-y-3">
                            <Label>Project Template (Optional)</Label>
                            <div className="grid grid-cols-1 gap-2">
                              {PROJECT_TEMPLATES.map(template => (
                                <div 
                                  key={template.id}
                                  className={cn(
                                    "border rounded-lg p-3 cursor-pointer transition-all hover:border-primary",
                                    projectData.templateId === template.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-card"
                                  )}
                                  onClick={() => handleTemplateSelect(template.id)}
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-medium text-sm">{template.name}</div>
                                      <div className="text-xs text-muted-foreground line-clamp-1">{template.description}</div>
                                    </div>
                                    {projectData.templateId === template.id && <Check className="h-4 w-4 text-primary" />}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label>Framework *</Label>
                            <Select value={projectData.frameworkId} onValueChange={handleFrameworkSelect}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a framework..." />
                              </SelectTrigger>
                              <SelectContent>
                                {FRAMEWORK_TEMPLATES.map(fw => (
                                  <SelectItem key={fw.id} value={fw.id}>{fw.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">The framework determines the default stages and workflow structure.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                )}
                
                {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium">Work Breakdown Structure</h3>
                            <p className="text-sm text-muted-foreground">Define deliverables, epics, and initial tasks.</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleFileUpload}
                                />
                                <Button size="sm" variant="outline">
                                    <Upload className="h-4 w-4 mr-2" /> Import Excel
                                </Button>
                            </div>
                            <Button size="sm" onClick={() => {
                                const newDeliverable = {
                                    id: `d-${Date.now()}`,
                                    title: "New Deliverable",
                                    description: "",
                                    epics: []
                                };
                                setDeliverables([...deliverables, newDeliverable]);
                            }}>
                                <Plus className="h-4 w-4 mr-2" /> Add Deliverable
                            </Button>
                        </div>
                      </div>

                      <ScrollArea className="h-[500px] pr-4">
                        {deliverables.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg text-muted-foreground">
                                <Package className="h-8 w-8 mb-2 opacity-50" />
                                <p>No deliverables added yet.</p>
                                <Button variant="link" onClick={() => setDeliverables([{id: `d-${Date.now()}`, title: "New Deliverable", epics: []}])}>Add your first deliverable</Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {deliverables.map((deliverable, dIndex) => (
                                    <Card key={deliverable.id} className="overflow-hidden">
                                        <CardHeader className="bg-muted/30 p-4 pb-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 flex-1">
                                                    <Package className="h-4 w-4 text-primary" />
                                                    <Input 
                                                        value={deliverable.title} 
                                                        onChange={(e) => {
                                                            const newD = [...deliverables];
                                                            newD[dIndex].title = e.target.value;
                                                            setDeliverables(newD);
                                                        }}
                                                        className="h-8 font-medium bg-transparent border-transparent hover:border-input focus:border-input w-full max-w-sm"
                                                        placeholder="Deliverable Title"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                                                        const newD = [...deliverables];
                                                        newD.splice(dIndex, 1);
                                                        setDeliverables(newD);
                                                    }}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-2">
                                            <div className="pl-6 space-y-3 mt-2">
                                                {deliverable.epics.map((epic: any, eIndex: number) => (
                                                    <div key={epic.id} className="flex items-start gap-2 group">
                                                        <FileBox className="h-4 w-4 text-indigo-500 mt-2.5" />
                                                        <div className="flex-1 space-y-1">
                                                            <Input 
                                                                value={epic.title}
                                                                onChange={(e) => {
                                                                    const newD = [...deliverables];
                                                                    newD[dIndex].epics[eIndex].title = e.target.value;
                                                                    setDeliverables(newD);
                                                                }}
                                                                className="h-9 bg-transparent border hover:border-input"
                                                                placeholder="Epic Title"
                                                            />
                                                        </div>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 opacity-0 group-hover:opacity-100" onClick={() => {
                                                            const newD = [...deliverables];
                                                            newD[dIndex].epics.splice(eIndex, 1);
                                                            setDeliverables(newD);
                                                        }}>
                                                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                <Button variant="ghost" size="sm" className="ml-6 text-xs text-muted-foreground" onClick={() => {
                                                    const newD = [...deliverables];
                                                    newD[dIndex].epics.push({
                                                        id: `e-${Date.now()}`,
                                                        title: "New Epic",
                                                        description: "",
                                                        tasks: []
                                                    });
                                                    setDeliverables(newD);
                                                }}>
                                                    <Plus className="h-3 w-3 mr-2" /> Add Epic
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                      </ScrollArea>
                    </div>
                )}
                
                {currentStep === 3 && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium">Stage Configuration</h3>
                            <p className="text-sm text-muted-foreground">Review the stages defined by the {FRAMEWORK_TEMPLATES.find(f => f.id === projectData.frameworkId)?.name} framework.</p>
                        </div>

                        <div className="grid gap-4">
                            {stages.map((stage, index) => (
                                <div key={stage?.id || index} className="flex items-center gap-4 p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium">{stage?.name}</div>
                                        <div className="text-sm text-muted-foreground">{stage?.description || "Standard stage workflow"}</div>
                                    </div>
                                    <div className="flex gap-2 text-xs text-muted-foreground">
                                        <span className="bg-muted px-2 py-1 rounded">{(stage?.defaultTasks?.length || 0)} Default Tasks</span>
                                    </div>
                                </div>
                            ))}
                            {stages.length === 0 && (
                                <div className="text-center p-8 border rounded-lg bg-muted/20 text-muted-foreground">
                                    No framework selected. Please go back to Step 1 and select a framework.
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {currentStep === 4 && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-medium">Team & Roles</h3>
                                <p className="text-sm text-muted-foreground">Assign team members to project roles.</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => {
                                setRoles([...roles, {
                                    id: `r-${Date.now()}`,
                                    name: "New Role",
                                    roleType: "Development",
                                    assigneeId: null
                                }]);
                            }}>
                                <Plus className="h-4 w-4 mr-2" /> Add Role
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {roles.map((role, index) => (
                                <Card key={role.id}>
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <Input 
                                                    value={role.name}
                                                    onChange={(e) => {
                                                        const newRoles = [...roles];
                                                        newRoles[index].name = e.target.value;
                                                        setRoles(newRoles);
                                                    }}
                                                    className="h-7 px-0 font-medium border-0 focus-visible:ring-0 p-0 shadow-none hover:underline decoration-dashed decoration-muted-foreground underline-offset-4 w-full"
                                                />
                                                <Badge variant="outline" className="mt-1 text-[10px]">{role.roleType}</Badge>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => {
                                                const newRoles = [...roles];
                                                newRoles.splice(index, 1);
                                                setRoles(newRoles);
                                            }}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        
                                        <Select 
                                            value={role.assigneeId || ""} 
                                            onValueChange={(val) => {
                                                const newRoles = [...roles];
                                                newRoles[index].assigneeId = val;
                                                setRoles(newRoles);
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Unassigned" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TEAM.map(member => (
                                                    <SelectItem key={member.id} value={member.id}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">
                                                                {member.name.charAt(0)}
                                                            </div>
                                                            {member.name}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
                
                {currentStep === 5 && (
                    <div className="space-y-6">
                        <div className="bg-muted/30 p-6 rounded-lg border space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Project Name</h4>
                                    <p className="font-medium text-lg">{projectData.name || "Untitled Project"}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Framework</h4>
                                    <p className="font-medium">{FRAMEWORK_TEMPLATES.find(f => f.id === projectData.frameworkId)?.name || "None"}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Start Date</h4>
                                    <p className="font-medium">{projectData.startDate || "Not set"}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Due Date</h4>
                                    <p className="font-medium">{projectData.dueDate || "Not set"}</p>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-card p-4 rounded border">
                                    <div className="flex items-center gap-2 mb-2 text-primary">
                                        <Package className="h-5 w-5" />
                                        <span className="font-semibold">Deliverables</span>
                                    </div>
                                    <div className="text-3xl font-bold">{deliverables.length}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {deliverables.reduce((acc, d) => acc + d.epics.length, 0)} Epics defined
                                    </p>
                                </div>
                                <div className="bg-card p-4 rounded border">
                                    <div className="flex items-center gap-2 mb-2 text-primary">
                                        <Layers className="h-5 w-5" />
                                        <span className="font-semibold">Stages</span>
                                    </div>
                                    <div className="text-3xl font-bold">{stages.length}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Standard workflow</p>
                                </div>
                                <div className="bg-card p-4 rounded border">
                                    <div className="flex items-center gap-2 mb-2 text-primary">
                                        <Users className="h-5 w-5" />
                                        <span className="font-semibold">Team Size</span>
                                    </div>
                                    <div className="text-3xl font-bold">{roles.filter(r => r.assigneeId).length}</div>
                                    <p className="text-xs text-muted-foreground mt-1">{roles.length} roles defined</p>
                                </div>
                            </div>
                            
                            <div className="bg-blue-50 text-blue-900 p-4 rounded-md text-sm border border-blue-100 flex gap-3">
                                <Settings className="h-5 w-5 shrink-0" />
                                <div>
                                    <p className="font-semibold">Ready to create?</p>
                                    <p>Your project will be created with the configured settings. You can always modify these later in Project Settings.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
                <Button 
                    variant="outline" 
                    onClick={handleBack} 
                    disabled={currentStep === 1}
                >
                    <ChevronLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                
                <Button onClick={handleNext}>
                    {currentStep === STEPS.length ? (
                        <>Create Project <Save className="h-4 w-4 ml-2" /></>
                    ) : (
                        <>Next Step <ChevronRight className="h-4 w-4 ml-2" /></>
                    )}
                </Button>
            </CardFooter>
        </Card>
      </div>
    </Shell>
  );
}
