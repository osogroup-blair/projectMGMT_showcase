import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Trash2, ChevronDown, ChevronRight, Save, ArrowLeft, GripVertical, FileBox, ListTodo } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useFrameworkTemplates, useStageTemplates, useTaskTemplates, useMilestoneTemplates } from "@/hooks/use-nexus-data";

// Type definitions for the builder state
interface TemplateTask {
    id: string; // Temporary UI ID
    title: string;
    description: string;
    defaultPriority: string;
    defaultEstimateHours: number;
    scope?: string;
    defaultMilestoneId?: string | null;
}

interface TemplateMilestone {
    id: string; // Provisional UI ID
    name: string;
    description: string;
    scopeType: string;
    completionMode: string;
    completionTargetPercent: number;
    isBillingGate: boolean;
    offsetDays: number;
    order: number;
}

interface TemplateEpic {
    id: string; // Temporary UI ID
    title: string;
    description: string;
    tasks: TemplateTask[];
}

interface TemplateDeliverable {
    id: string; // Temporary UI ID
    title: string;
    description: string;
    epics: TemplateEpic[];
}

export default function TemplateBuilder() {
    const [_, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [projectTemplateName, setProjectTemplateName] = useState("");
    const [projectTemplateDescription, setProjectTemplateDescription] = useState("");
    const [defaultFrameworkId, setDefaultFrameworkId] = useState<string>("none");
    const [deliverables, setDeliverables] = useState<TemplateDeliverable[]>([]);
    const [milestones, setMilestones] = useState<TemplateMilestone[]>([]);

    const { data: frameworkTemplates = [] } = useFrameworkTemplates();
    const { data: stageTemplates = [] } = useStageTemplates();
    const { data: taskTemplates = [] } = useTaskTemplates();
    const { data: milestoneTemplatesData = [] } = useMilestoneTemplates();

    // Expanded State
    const [expandedDeliverables, setExpandedDeliverables] = useState<Set<string>>(new Set());
    const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());

    const toggleDeliverableExpanded = (id: string) => {
        setExpandedDeliverables(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const toggleEpicExpanded = (id: string) => {
        setExpandedEpics(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const handleFrameworkChange = (newFrameworkId: string) => {
        setDefaultFrameworkId(newFrameworkId);

        if (!newFrameworkId || newFrameworkId === "none") {
            setMilestones([]);
            return;
        }

        const framework = frameworkTemplates.find((f: any) => f.id === newFrameworkId);
        if (!framework) return;

        const stageTemplateIds = framework.defaultStages || [];

        // Load milestones linked to these stages
        const linkedMilestoneTemplates = milestoneTemplatesData.filter(
            (mt: any) => mt.stageTemplateId && stageTemplateIds.includes(mt.stageTemplateId)
        );

        if (linkedMilestoneTemplates.length > 0) {
            const tempMilestones: TemplateMilestone[] = linkedMilestoneTemplates.map((mt: any, i: number) => ({
                id: `ms-temp-${Date.now()}-${i}`,
                name: mt.name,
                description: mt.description || "",
                scopeType: mt.scopeType || "deliverable",
                completionMode: mt.completionMode || "percentage",
                completionTargetPercent: mt.completionTargetPercent || 100,
                isBillingGate: mt.isBillingGate || false,
                offsetDays: mt.offsetDays || 0,
                order: mt.order || 0
            }));
            setMilestones(tempMilestones);
        } else {
            setMilestones([]);
        }

        // Build "Management Activities" Deliverable for "Once" Tasks
        const onceTasks: TemplateTask[] = [];
        const fStages = stageTemplateIds
            .map((sid: string) => stageTemplates.find((st: any) => st.id === sid))
            .filter(Boolean);

        fStages.forEach((stage: any) => {
            (stage.defaultTasks || []).forEach((tid: string) => {
                const tTemplate = taskTemplates.find((t: any) => t.id === tid);
                if (tTemplate && tTemplate.scope === 'once') {
                    onceTasks.push({
                        id: `tt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                        title: tTemplate.title,
                        description: tTemplate.description,
                        defaultPriority: tTemplate.defaultPriority,
                        defaultEstimateHours: tTemplate.defaultEstimateHours || 0,
                        scope: 'once',
                        defaultMilestoneId: null
                    });
                }
            });
        });

        if (onceTasks.length > 0) {
            const mgmtDelivId = `dt-mgmt-${Date.now()}`;
            const mgmtEpicId = `et-mgmt-${Date.now()}`;
            setDeliverables(prev => {
                const filtered = prev.filter(d => d.title !== 'Management Activities');
                return [{
                    id: mgmtDelivId,
                    title: "Management Activities",
                    description: "Project management and coordination activities",
                    epics: [{
                        id: mgmtEpicId,
                        title: "Product Management",
                        description: "Product strategy, requirements, and backlog management tasks",
                        tasks: onceTasks
                    }]
                }, ...filtered];
            });
            setExpandedDeliverables(prev => new Set(prev).add(mgmtDelivId));
            setExpandedEpics(prev => new Set(prev).add(mgmtEpicId));
        }
    };

    // Auto-populate per_epic tasks from the currently selected framework
    const generatePerEpicTasks = useCallback(() => {
        if (!defaultFrameworkId || defaultFrameworkId === "none") return [];

        const framework = frameworkTemplates.find((f: any) => f.id === defaultFrameworkId);
        if (!framework) return [];

        const stageTemplateIds = framework.defaultStages || [];
        const fStages = stageTemplateIds
            .map((sid: string) => stageTemplates.find((st: any) => st.id === sid))
            .filter(Boolean);

        const perEpicTasks: TemplateTask[] = [];

        fStages.forEach((stage: any) => {
            (stage.defaultTasks || []).forEach((tid: string) => {
                const tTemplate = taskTemplates.find((t: any) => t.id === tid);
                if (tTemplate && (!tTemplate.scope || tTemplate.scope === 'per_epic')) {
                    perEpicTasks.push({
                        id: `tt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                        title: tTemplate.title,
                        description: tTemplate.description,
                        defaultPriority: tTemplate.defaultPriority,
                        defaultEstimateHours: tTemplate.defaultEstimateHours || 0,
                        scope: 'per_epic',
                        defaultMilestoneId: null
                    });
                }
            });
        });

        return perEpicTasks;
    }, [defaultFrameworkId, frameworkTemplates, stageTemplates, taskTemplates]);

    const createDeliverable = useCallback(() => {
        const id = `dt-${Date.now()}`;
        const epicId = `et-${Date.now()}`;
        const autoTasks = generatePerEpicTasks();

        setDeliverables(prev => [...prev, {
            id,
            title: "",
            description: "",
            epics: [{
                id: epicId,
                title: "Epic",
                description: "",
                tasks: autoTasks
            }]
        }]);
        setExpandedDeliverables(prev => new Set(prev).add(id));
        setExpandedEpics(prev => new Set(prev).add(epicId));
    }, [generatePerEpicTasks]);

    const addEpic = (dIndex: number) => {
        const id = `et-${Date.now()}`;
        const autoTasks = generatePerEpicTasks();

        setDeliverables(prev => {
            const newD = [...prev];
            newD[dIndex].epics.push({
                id,
                title: "Epic",
                description: "",
                tasks: autoTasks
            });
            return newD;
        });
        setExpandedEpics(prev => new Set(prev).add(id));
    };

    const removeEpic = (dIndex: number, eIndex: number) => {
        setDeliverables(prev => {
            const newD = [...prev];
            newD[dIndex].epics.splice(eIndex, 1);
            return newD;
        });
    };

    const addTask = (dIndex: number, eIndex: number) => {
        const id = `tt-${Date.now()}`;
        setDeliverables(prev => {
            const newD = [...prev];
            newD[dIndex].epics[eIndex].tasks.push({
                id,
                title: "",
                description: "",
                defaultPriority: "medium",
                defaultEstimateHours: 0,
                scope: "per_epic",
                defaultMilestoneId: null
            });
            return newD;
        });
    };

    const removeTask = (dIndex: number, eIndex: number, tIndex: number) => {
        setDeliverables(prev => {
            const newD = [...prev];
            newD[dIndex].epics[eIndex].tasks.splice(tIndex, 1);
            return newD;
        });
    };

    const createTemplateMutation = useMutation({
        mutationFn: async (payload: any) => {
            const res = await apiRequest("POST", "/api/templates/project-templates/full-create", payload);
            return res.json();
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Project template structure saved successfully.",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/projectTemplates"] });
            queryClient.invalidateQueries({ queryKey: ["/api/deliverableTemplates"] });
            queryClient.invalidateQueries({ queryKey: ["/api/epicTemplates"] });
            queryClient.invalidateQueries({ queryKey: ["/api/taskTemplates"] });
            setLocation("/admin/frameworks"); // Redirect to frameworks/templates hub
        },
        onError: (error: Error) => {
            toast({
                title: "Error saving template",
                description: error.message,
                variant: "destructive"
            });
        }
    });

    const handleSave = () => {
        if (!projectTemplateName.trim()) {
            toast({
                title: "Validation Error",
                description: "Project Template Name is required.",
                variant: "destructive"
            });
            return;
        }

        const payload = {
            projectTemplate: {
                name: projectTemplateName,
                description: projectTemplateDescription,
                defaultFrameworkId: defaultFrameworkId === "none" ? null : defaultFrameworkId
            },
            deliverables: deliverables.map(d => ({
                title: d.title || "Untitled Deliverable",
                description: d.description,
                epics: d.epics.map(e => ({
                    title: e.title || "Untitled Epic",
                    description: e.description,
                    tasks: e.tasks.map(t => ({
                        title: t.title || "Untitled Task",
                        description: t.description,
                        defaultPriority: t.defaultPriority,
                        defaultEstimateHours: t.defaultEstimateHours || 0,
                        scope: t.scope || "per_epic",
                        defaultMilestoneId: t.defaultMilestoneId || null
                    }))
                }))
            })),
            milestones: milestones
        };

        createTemplateMutation.mutate(payload);
    };

    return (
        <div className="flex-1 space-y-6 container mx-auto py-8 px-4 max-w-6xl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => setLocation("/admin/frameworks")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tight">Project Template Builder</h1>
                        <p className="text-sm text-muted-foreground">
                            Define a complete project shape (Deliverables {">"} Epics {">"} Tasks) to reuse across workspace projects.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleSave}
                        disabled={createTemplateMutation.isPending}
                    >
                        {createTemplateMutation.isPending ? "Saving..." : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Template
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardContent className="space-y-4 pt-6 px-0 pb-0">
                        <div className="grid gap-4 w-full max-w-2xl">
                            <div className="space-y-2">
                                <Label>Template Name <span className="text-destructive">*</span></Label>
                                <Input
                                    value={projectTemplateName}
                                    onChange={e => setProjectTemplateName(e.target.value)}
                                    placeholder="e.g. Standard Implementation Project V1"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Template Description</Label>
                                <Textarea
                                    value={projectTemplateDescription}
                                    onChange={e => setProjectTemplateDescription(e.target.value)}
                                    placeholder="Describe when this template should be used..."
                                    className="min-h-[80px]"
                                />
                            </div>
                            <div className="space-y-2 pt-2 border-t mt-2">
                                <Label>Default Framework</Label>
                                <Select value={defaultFrameworkId} onValueChange={handleFrameworkChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a framework..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Framework</SelectItem>
                                        {frameworkTemplates.map((framework: any) => (
                                            <SelectItem key={framework.id} value={framework.id}>
                                                {framework.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Selecting a framework automatically pre-populates new epics with tasks associated with the framework's stages.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </CardHeader>
            </Card>

            <div className="flex items-center justify-between border-b pb-4 mt-8">
                <div>
                    <h3 className="text-lg font-semibold">Template Work Breakdown</h3>
                    <p className="text-sm text-muted-foreground">Add deliverable blocks containing epics and common tasks.</p>
                </div>
                <Button onClick={createDeliverable} size="sm">
                    <Plus className="h-4 w-4 mr-2" /> Add Deliverable Block
                </Button>
            </div>

            {deliverables.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/20">
                    <Package className="h-8 w-8 mb-2 opacity-50" />
                    <p>No deliverables added yet.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {deliverables.map((deliverable, dIndex) => (
                        <Collapsible
                            key={deliverable.id}
                            open={expandedDeliverables.has(deliverable.id)}
                        >
                            <Card className="border-border">
                                <CardHeader className="bg-muted/30 p-4 pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 flex-1">
                                            <CollapsibleTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => toggleDeliverableExpanded(deliverable.id)}
                                                >
                                                    {expandedDeliverables.has(deliverable.id) ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </CollapsibleTrigger>
                                            <Package className="h-5 w-5 text-primary" />
                                            <Input
                                                value={deliverable.title}
                                                onChange={(e) => {
                                                    const newD = [...deliverables];
                                                    newD[dIndex].title = e.target.value;
                                                    setDeliverables(newD);
                                                }}
                                                className="h-8 font-medium bg-transparent border-transparent hover:border-input focus:border-input w-full max-w-sm"
                                                placeholder="Deliverable Template Name (e.g. Phase 1)"
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                ({deliverable.epics.length} epic{deliverable.epics.length !== 1 ? 's' : ''})
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive"
                                            onClick={() => {
                                                const newD = [...deliverables];
                                                newD.splice(dIndex, 1);
                                                setDeliverables(newD);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>

                                <CollapsibleContent>
                                    <CardContent className="p-4 pt-2">
                                        <div className="space-y-4 pt-2">
                                            <div className="pl-8 pb-2">
                                                <Input
                                                    value={deliverable.description}
                                                    onChange={(e) => {
                                                        const newD = [...deliverables];
                                                        newD[dIndex].description = e.target.value;
                                                        setDeliverables(newD);
                                                    }}
                                                    className="h-8 text-sm placeholder:text-muted-foreground/50 w-full max-w-xl bg-transparent"
                                                    placeholder="Optional deliverable description..."
                                                />
                                            </div>

                                            <div className="pl-1 space-y-3">
                                                {deliverable.epics.map((epic, eIndex) => (
                                                    <Collapsible
                                                        key={epic.id}
                                                        open={expandedEpics.has(epic.id)}
                                                    >
                                                        <div className="rounded-md border bg-card">
                                                            {/* Epic Header */}
                                                            <div className="flex items-center gap-2 p-3 pb-2 border-b border-border/50 bg-muted/10">
                                                                <CollapsibleTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-5 w-5 ml-1 mt-1 shrink-0"
                                                                        onClick={() => toggleEpicExpanded(epic.id)}
                                                                    >
                                                                        {expandedEpics.has(epic.id) ? (
                                                                            <ChevronDown className="h-3 w-3" />
                                                                        ) : (
                                                                            <ChevronRight className="h-3 w-3" />
                                                                        )}
                                                                    </Button>
                                                                </CollapsibleTrigger>
                                                                <FileBox className="h-4 w-4 text-primary ml-1" />
                                                                <Input
                                                                    value={epic.title}
                                                                    onChange={(e) => {
                                                                        const newD = [...deliverables];
                                                                        newD[dIndex].epics[eIndex].title = e.target.value;
                                                                        setDeliverables(newD);
                                                                    }}
                                                                    className="h-7 text-sm font-medium border-transparent hover:border-input focus:border-input max-w-[240px]"
                                                                    placeholder="Epic Template Name"
                                                                />
                                                                <span className="text-xs text-muted-foreground mr-auto">
                                                                    ({epic.tasks.length} task{epic.tasks.length !== 1 ? 's' : ''})
                                                                </span>

                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                                    onClick={() => removeEpic(dIndex, eIndex)}
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>

                                                            <CollapsibleContent>
                                                                <div className="p-3 pl-11 pb-4 bg-muted/5">
                                                                    <div className="mb-4">
                                                                        <Input
                                                                            value={epic.description}
                                                                            onChange={(e) => {
                                                                                const newD = [...deliverables];
                                                                                newD[dIndex].epics[eIndex].description = e.target.value;
                                                                                setDeliverables(newD);
                                                                            }}
                                                                            className="h-7 text-xs placeholder:text-muted-foreground/50 max-w-lg bg-transparent border-transparent hover:border-input"
                                                                            placeholder="Optional epic description..."
                                                                        />
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        {epic.tasks.length > 0 && (
                                                                            <div className="grid grid-cols-[1fr_80px_120px_100px_40px] gap-2 mb-1 px-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                                                                <div>Task Title & Description</div>
                                                                                <div>Priority</div>
                                                                                <div>Milestone</div>
                                                                                <div>Est. Hours</div>
                                                                                <div></div>
                                                                            </div>
                                                                        )}

                                                                        {epic.tasks.map((task, tIndex) => (
                                                                            <div key={task.id} className="grid grid-cols-[1fr_80px_120px_100px_40px] gap-2 items-start bg-background border rounded-sm p-2">
                                                                                <div className="space-y-1 w-full flex gap-2">
                                                                                    <div className="mt-2 text-muted-foreground/30"><GripVertical className="h-3 w-3" /></div>
                                                                                    <div className="w-full">
                                                                                        <Input
                                                                                            value={task.title}
                                                                                            onChange={(e) => {
                                                                                                const newD = [...deliverables];
                                                                                                newD[dIndex].epics[eIndex].tasks[tIndex].title = e.target.value;
                                                                                                setDeliverables(newD);
                                                                                            }}
                                                                                            className="h-7 text-xs border-transparent hover:border-input focus:border-input"
                                                                                            placeholder="Task Title"
                                                                                        />
                                                                                        <Input
                                                                                            value={task.description}
                                                                                            onChange={(e) => {
                                                                                                const newD = [...deliverables];
                                                                                                newD[dIndex].epics[eIndex].tasks[tIndex].description = e.target.value;
                                                                                                setDeliverables(newD);
                                                                                            }}
                                                                                            className="h-6 mt-1 text-[11px] border-transparent bg-transparent placeholder:text-muted-foreground/40 w-[95%]"
                                                                                            placeholder="Description..."
                                                                                        />
                                                                                    </div>
                                                                                </div>

                                                                                <Select
                                                                                    value={task.defaultPriority}
                                                                                    onValueChange={(val) => {
                                                                                        const newD = [...deliverables];
                                                                                        newD[dIndex].epics[eIndex].tasks[tIndex].defaultPriority = val;
                                                                                        setDeliverables(newD);
                                                                                    }}
                                                                                >
                                                                                    <SelectTrigger className="h-7 text-xs border-transparent hover:border-input">
                                                                                        <SelectValue />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="low">Low</SelectItem>
                                                                                        <SelectItem value="medium">Medium</SelectItem>
                                                                                        <SelectItem value="high">High</SelectItem>
                                                                                        <SelectItem value="critical">Critical</SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>

                                                                                <Select
                                                                                    value={task.defaultMilestoneId || "none"}
                                                                                    onValueChange={(val) => {
                                                                                        const newD = [...deliverables];
                                                                                        newD[dIndex].epics[eIndex].tasks[tIndex].defaultMilestoneId = val === "none" ? null : val;
                                                                                        setDeliverables(newD);
                                                                                    }}
                                                                                >
                                                                                    <SelectTrigger className="h-7 text-xs border-transparent hover:border-input">
                                                                                        <SelectValue placeholder="No Milestone" />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="none">No Milestone</SelectItem>
                                                                                        {milestones.map(ms => (
                                                                                            <SelectItem key={ms.id} value={ms.id}>{ms.name}</SelectItem>
                                                                                        ))}
                                                                                    </SelectContent>
                                                                                </Select>

                                                                                <Input
                                                                                    type="number"
                                                                                    min={0}
                                                                                    value={task.defaultEstimateHours || ""}
                                                                                    onChange={(e) => {
                                                                                        const newD = [...deliverables];
                                                                                        newD[dIndex].epics[eIndex].tasks[tIndex].defaultEstimateHours = parseFloat(e.target.value) || 0;
                                                                                        setDeliverables(newD);
                                                                                    }}
                                                                                    className="h-7 text-xs text-right border-transparent hover:border-input"
                                                                                    placeholder="Hrs"
                                                                                />

                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                                                    onClick={() => removeTask(dIndex, eIndex, tIndex)}
                                                                                >
                                                                                    <Trash2 className="h-3 w-3" />
                                                                                </Button>
                                                                            </div>
                                                                        ))}

                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-7 text-xs text-muted-foreground border border-dashed border-transparent hover:border-border mt-1"
                                                                            onClick={() => addTask(dIndex, eIndex)}
                                                                        >
                                                                            <Plus className="h-3 w-3 mr-1" /> Add Template Task
                                                                        </Button>
                                                                    </div>

                                                                </div>
                                                            </CollapsibleContent>
                                                        </div>
                                                    </Collapsible>
                                                ))}

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="ml-6 mt-2 text-xs text-muted-foreground"
                                                    onClick={() => addEpic(dIndex)}
                                                >
                                                    <Plus className="h-3 w-3 mr-2" /> Add Epic
                                                </Button>
                                            </div>

                                        </div>
                                    </CardContent>
                                </CollapsibleContent>

                            </Card>
                        </Collapsible>
                    ))}
                </div>
            )}

        </div>
    );
}
