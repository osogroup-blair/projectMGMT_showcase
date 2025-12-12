import { useState } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  ArrowLeft, 
  Plus, 
  MoreHorizontal, 
  Check,
  Package,
  Layers,
  Calendar as CalendarIcon,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRoute, Link } from "wouter";
import { STAGE_TEMPLATES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useDeliverables, useEpics, useUsers } from "@/hooks/use-nexus-data";
import { Loader2 } from "lucide-react";

// Export content component separately for reuse
export function DeliverablesContent({ projectId }: { projectId: string }) {
  const { toast } = useToast();

  const { data: allDeliverables, isLoading: isDeliverablesLoading, create: createDeliverable } = useDeliverables();
  const { data: allEpics, isLoading: isEpicsLoading, create: createEpic } = useEpics();
  const { data: users, isLoading: isUsersLoading } = useUsers();

  const deliverables = allDeliverables.filter((d: any) => d.projectId === projectId);
  const getEpicsForDeliverable = (deliverableId: string) => allEpics.filter((e: any) => e.deliverableId === deliverableId);
  const getOwner = (ownerId: string) => users.find((t: any) => t.id === ownerId);

  // Epic Creation State
  const [isCreateEpicOpen, setIsCreateEpicOpen] = useState(false);
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<string>("");
  const [newEpicData, setNewEpicData] = useState({
    title: "",
    description: "",
    stageIds: [] as string[]
  });

  const handleOpenCreateEpic = (deliverableId: string) => {
    setSelectedDeliverableId(deliverableId);
    setNewEpicData({
      title: "",
      description: "",
      stageIds: []
    });
    setIsCreateEpicOpen(true);
  };

  const toggleStageSelection = (stageId: string) => {
    setNewEpicData(prev => ({
      ...prev,
      stageIds: prev.stageIds.includes(stageId)
        ? prev.stageIds.filter(id => id !== stageId)
        : [...prev.stageIds, stageId]
    }));
  };

  const handleCreateEpic = () => {
    if (!newEpicData.title || !selectedDeliverableId) {
      toast({
        title: "Validation Error",
        description: "Please provide an epic title.",
        variant: "destructive"
      });
      return;
    }
    
    createEpic({
      title: newEpicData.title,
      description: newEpicData.description,
      deliverableId: selectedDeliverableId,
      stageIds: newEpicData.stageIds,
      status: "Not Started",
      progress: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    
    toast({
      title: "Epic Created",
      description: `${newEpicData.title} has been created with ${newEpicData.stageIds.length} assigned stages.`,
    });
    setIsCreateEpicOpen(false);
  };

  if (isDeliverablesLoading || isEpicsLoading || isUsersLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Deliverables</h2>
          <p className="text-sm text-muted-foreground">Manage high-level deliverables and breakdown epics.</p>
        </div>
        <Button className="gap-2" size="sm">
          <Plus className="h-4 w-4" />
          New Deliverable
        </Button>
      </div>

      {/* Deliverables List */}
      <div className="space-y-6">
        {deliverables.length === 0 ? (
          <Card className="bg-muted/10 border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No deliverables defined</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
                Start by defining the major outcomes for this project to organize your epics and tasks.
              </p>
              <Button>Create First Deliverable</Button>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" defaultValue={deliverables.map(d => d.id)} className="space-y-4">
            {deliverables.map(deliverable => {
              const epics = getEpicsForDeliverable(deliverable.id);
              const owner = getOwner(deliverable.ownerId);

              return (
                <AccordionItem key={deliverable.id} value={deliverable.id} className="border rounded-lg bg-card px-4">
                  <div className="flex items-center py-4">
                    <AccordionTrigger className="hover:no-underline py-0 flex-1">
                      <div className="flex items-start gap-4 text-left w-full">
                        <div className={cn(
                          "p-2 rounded-lg mt-1",
                          deliverable.status === "Completed" ? "bg-green-100 text-green-700" :
                          deliverable.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                          "bg-slate-100 text-slate-700"
                        )}>
                          <Package className="h-5 w-5" />
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">{deliverable.title}</h3>
                            <Badge variant="outline" className={cn(
                              "font-normal",
                              deliverable.status === "Completed" ? "bg-green-50 text-green-700 border-green-200" :
                              deliverable.status === "In Progress" ? "bg-blue-50 text-blue-700 border-blue-200" :
                              "bg-slate-50 text-slate-700 border-slate-200"
                            )}>
                              {deliverable.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{deliverable.description}</p>
                          <div className="flex items-center gap-6 pt-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[9px]">{owner?.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span>Owner: {owner?.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <CalendarIcon className="h-3.5 w-3.5" />
                              <span>Due: {deliverable.dueDate}</span>
                            </div>
                            <div className="flex items-center gap-2 min-w-[100px]">
                              <Progress value={deliverable.progress} className="h-1.5 w-16" />
                              <span>{deliverable.progress}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <div className="flex items-center gap-2 pl-4 border-l ml-4 h-12">
                      <Button variant="ghost" size="icon" onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCreateEpic(deliverable.id);
                      }}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <AccordionContent className="pt-0 pb-4 pl-[3.25rem]">
                    <div className="space-y-3 mt-4">
                      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        <span>Associated Epics ({epics.length})</span>
                      </div>
                      {epics.length > 0 ? (
                        <div className="grid gap-3">
                          {epics.map(epic => (
                            <Link key={epic.id} href={`/projects/${projectId}/epics/${epic.id}`}>
                              <div className="group flex items-center justify-between p-3 rounded-md border bg-background hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer">
                                <div className="flex items-center gap-3">
                                  <div className="p-1.5 bg-primary/10 text-primary rounded">
                                    <Layers className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium group-hover:text-primary transition-colors">{epic.title}</h4>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <span>{epic.startDate} - {epic.endDate}</span>
                                      {epic.stageIds && (
                                          <span className="flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded bg-muted">
                                              {epic.stageIds.length} Stages
                                          </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-6">
                                  <Badge variant="secondary" className="font-normal text-xs">
                                    {epic.status}
                                  </Badge>
                                  <div className="flex items-center gap-2 w-24">
                                    <Progress value={epic.progress} className="h-1.5" />
                                    <span className="text-xs text-muted-foreground w-8 text-right">{epic.progress}%</span>
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 border border-dashed rounded-md text-center text-sm text-muted-foreground bg-muted/30">
                          No epics created yet. 
                          <span 
                            className="text-primary cursor-pointer hover:underline ml-1"
                            onClick={() => handleOpenCreateEpic(deliverable.id)}
                          >
                            Add an Epic
                          </span>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>

      {/* Create Epic Dialog */}
      <Dialog open={isCreateEpicOpen} onOpenChange={setIsCreateEpicOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Epic</DialogTitle>
            <DialogDescription>
              Define a new body of work for this deliverable.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="epic-title">Epic Title</Label>
              <Input 
                id="epic-title" 
                value={newEpicData.title}
                onChange={(e) => setNewEpicData({...newEpicData, title: e.target.value})}
                placeholder="e.g. User Authentication"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="epic-desc">Description</Label>
              <Input 
                id="epic-desc" 
                value={newEpicData.description}
                onChange={(e) => setNewEpicData({...newEpicData, description: e.target.value})}
                placeholder="Brief description of the work..."
              />
            </div>
            
            <div className="space-y-3 pt-2">
              <Label>Assign Stages</Label>
              <div className="text-xs text-muted-foreground mb-2">
                  Select the workflow stages that apply to this epic. This determines the task workflow.
              </div>
              <ScrollArea className="h-[200px] border rounded-md p-2">
                  <div className="space-y-2">
                      {STAGE_TEMPLATES.map(stage => (
                          <div 
                              key={stage.id} 
                              className={cn(
                                  "flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-colors border",
                                  newEpicData.stageIds.includes(stage.id) 
                                      ? "bg-primary/5 border-primary" 
                                      : "hover:bg-muted border-transparent"
                              )}
                              onClick={() => toggleStageSelection(stage.id)}
                          >
                              <div className={cn(
                                  "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                                  newEpicData.stageIds.includes(stage.id)
                                      ? "bg-primary border-primary text-primary-foreground"
                                      : "border-muted-foreground"
                              )}>
                                  {newEpicData.stageIds.includes(stage.id) && <Check className="h-3 w-3" />}
                              </div>
                              <div className="flex-1">
                                  <div className="text-sm font-medium">{stage.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                      Includes {stage.defaultTasks.length} default tasks
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateEpicOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateEpic}>Create Epic</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function DeliverablesList() {
  const [match, params] = useRoute("/projects/:projectId/deliverables");
  const projectId = params?.projectId || "1";

  return (
    <Shell>
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href={`/projects/${projectId}`} className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Project
            </Link>
            <span className="text-border">|</span>
            <span>Deliverables & Epics</span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-primary">Deliverables</h1>
              <p className="text-muted-foreground">Manage high-level deliverables and breakdown epics.</p>
            </div>
            {/* Action button moved inside content for consistency */}
          </div>
        </div>

        <DeliverablesContent projectId={projectId} />
      </div>
    </Shell>
  );
}
