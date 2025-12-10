import { useState } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  ArrowLeft, 
  Plus, 
  MoreHorizontal, 
  Search, 
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Package,
  Layers,
  Calendar as CalendarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useRoute, Link } from "wouter";
import { 
  PROJECTS, 
  DELIVERABLES, 
  EPICS, 
  TEAM 
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function DeliverablesList() {
  const [match, params] = useRoute("/projects/:projectId/deliverables");
  const projectId = params?.projectId || "1";
  const project = PROJECTS.find(p => p.id === projectId) || PROJECTS[0];

  const deliverables = DELIVERABLES.filter(d => d.projectId === projectId);
  const getEpicsForDeliverable = (deliverableId: string) => EPICS.filter(e => e.deliverableId === deliverableId);
  const getOwner = (ownerId: string) => TEAM.find(t => t.id === ownerId);

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
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Deliverable
            </Button>
          </div>
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
                        <Button variant="ghost" size="icon">
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
                            No epics created yet. <span className="text-primary cursor-pointer hover:underline">Add an Epic</span>
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
      </div>
    </Shell>
  );
}
