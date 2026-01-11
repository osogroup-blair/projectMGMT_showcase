import { HomeTask } from "../types";
import { useProjects, useTasks, useEpics, useProjectStages } from "@/hooks/use-nexus-data";
import { useCurrentUser } from "@/context/current-user-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Briefcase, ChevronDown, ChevronRight, MoreHorizontal, LayoutGrid, List, Layers, Workflow, Flag, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { TaskCard } from "./task-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CurrentProjectsPanel() {
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: allTasks, isLoading: tasksLoading } = useTasks();
  const { data: epics, isLoading: epicsLoading } = useEpics();
  const { data: projectStages, isLoading: stagesLoading } = useProjectStages();
  const { currentUserId } = useCurrentUser();
  
  // Inactive task statuses to exclude
  const INACTIVE_STATUSES = ["done", "deferred", "archived", "complete", "completed"];
  
  // Filter tasks to only show those assigned to the current user
  const userTasks = useMemo(() => {
    if (!allTasks) return [];
    return allTasks.filter((task: any) => task.assigneeId === currentUserId);
  }, [allTasks, currentUserId]);
  
  // Active tasks = user's tasks that are NOT Done/Deferred/Archived
  const activeTasks = useMemo(() => {
    return userTasks.filter((task: any) => 
      !INACTIVE_STATUSES.includes(task.status?.toLowerCase())
    );
  }, [userTasks]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  
  // Use active tasks or all user tasks based on toggle
  const tasks = showAllTasks ? userTasks : activeTasks;

  // Helper to map raw Task to HomeTask for the TaskCard
  const mapToHomeTask = useMemo(() => (task: any): HomeTask => {
    const project = projects.find((p: any) => p.name === task.project || p.id === task.projectId);
    const epic = epics.find((e: any) => e.id === task.epicId);
    
    return {
      id: task.id,
      projectId: project?.id || "unknown",
      projectName: task.project || project?.name || "Unknown Project",
      epicId: epic?.id,
      epicName: epic?.title,
      title: task.title,
      description: task.description,
      status: task.status === "Done" ? "complete" : task.status === "Todo" ? "not_started" : "in_progress",
      assignedToUserId: task.assigneeId || "currentUser",
      dueDateTime: task.deadline,
      priority: task.priority?.toLowerCase() || "medium",
      isOverdue: task.status === "Overdue",
      durationBucket: (task.estimateHours || 1) < 2 ? "quick_win" : (task.estimateHours || 1) < 4 ? "medium" : "deep_work",
      stageId: task.stageId,
    };
  }, [projects, epics]);

  // Get project IDs where user has active tasks
  const projectIdsWithActiveTasks = useMemo(() => {
    const ids = new Set<string>();
    tasks.forEach((task: any) => {
      if (task.projectId) {
        ids.add(task.projectId);
      }
      // Also match by project name
      const matchedProject = projects.find((p: any) => p.name === task.project);
      if (matchedProject) {
        ids.add(matchedProject.id);
      }
    });
    return ids;
  }, [tasks, projects]);

  // Filter Projects - only show projects where user has active tasks
  const filteredProjects = useMemo(() => {
    return projects.filter((project: any) => {
      const hasActiveTasks = projectIdsWithActiveTasks.has(project.id);
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
      return hasActiveTasks && matchesSearch;
    });
  }, [projects, projectIdsWithActiveTasks, searchQuery]);

  // Group Tasks by Project
  const getProjectTasks = (projectId: string, projectName: string) => {
    return tasks
      .filter((t: any) => t.project === projectName || t.projectId === projectId)
      .map(mapToHomeTask);
  };


  // Helper to render task grid
  const renderTaskGrid = (taskList: HomeTask[]) => {
    if (taskList.length === 0) {
      return (
        <div className="col-span-full text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
          No tasks found in this view.
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {taskList.map(task => (
          <TaskCard key={task.id} task={task} compact />
        ))}
      </div>
    );
  };

  if (projectsLoading || tasksLoading || epicsLoading || stagesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Filter projects..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            variant={showAllTasks ? "secondary" : "outline"} 
            className="gap-2 w-full sm:w-auto"
            onClick={() => setShowAllTasks(!showAllTasks)}
          >
            <Filter className="h-4 w-4" />
            {showAllTasks ? "Showing All Tasks" : "Active Tasks Only"}
          </Button>

          <div className="flex items-center border rounded-md p-1 bg-background">
             <Button 
               variant={viewMode === "list" ? "secondary" : "ghost"} 
               size="icon" 
               className="h-8 w-8"
               onClick={() => setViewMode("list")}
             >
               <List className="h-4 w-4" />
             </Button>
             <Button 
               variant={viewMode === "grid" ? "secondary" : "ghost"} 
               size="icon" 
               className="h-8 w-8"
               onClick={() => setViewMode("grid")}
             >
               <LayoutGrid className="h-4 w-4" />
             </Button>
          </div>
        </div>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No projects match your filters.
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-4">
           {filteredProjects.map((project: any) => {
             const projectTasks = getProjectTasks(project.id, project.name);
             const progress = project.progress || 0;
             
             // Groupings
             const tasksByStatus = {
               "Todo": projectTasks.filter(t => t.status === "not_started"),
               "In Progress": projectTasks.filter(t => t.status === "in_progress"),
               "Done": projectTasks.filter(t => t.status === "complete"),
             };

             const tasksByEpic = projectTasks.reduce((acc, task) => {
                const epicName = task.epicName || "No Epic";
                if (!acc[epicName]) acc[epicName] = [];
                acc[epicName].push(task);
                return acc;
             }, {} as Record<string, HomeTask[]>);

             // Get stages for this project (project-specific first, then global/shared stages)
             const allStages = projectStages || [];
             let stagesForProject = allStages
               .filter((s: any) => s.projectId === project.id)
               .sort((a: any, b: any) => a.order - b.order);
             
             // If no project-specific stages, use global stages (projectId is null or undefined)
             if (stagesForProject.length === 0) {
               stagesForProject = allStages
                 .filter((s: any) => !s.projectId)
                 .sort((a: any, b: any) => a.order - b.order);
             }
             
             // Create a map of stageId to stageName
             const stageNameMap = stagesForProject.reduce((acc: Record<string, string>, stage: any) => {
               acc[stage.id] = stage.name;
               return acc;
             }, {} as Record<string, string>);
             
             const tasksByStage = projectTasks.reduce((acc, task) => {
                const stageId = (task as any).stageId || "no_stage"; 
                const stageName = stageNameMap[stageId] || "No Stage";
                
                if (!acc[stageName]) acc[stageName] = [];
                acc[stageName].push(task);
                return acc;
             }, {} as Record<string, HomeTask[]>);
             
             // Ensure stages appear in order even if empty
             const orderedTasksByStage: Record<string, HomeTask[]> = {};
             if (stagesForProject.length > 0) {
               stagesForProject.forEach((stage: any) => {
                 orderedTasksByStage[stage.name] = tasksByStage[stage.name] || [];
               });
               // Add "No Stage" if there are tasks without a stage
               if (tasksByStage["No Stage"]) {
                 orderedTasksByStage["No Stage"] = tasksByStage["No Stage"];
               }
             } else {
               // No stages defined - show all tasks under "No Stage"
               orderedTasksByStage["No Stage"] = projectTasks;
             }
             
             return (
               <Card key={project.id} className="overflow-hidden">
                 <Accordion type="single" collapsible>
                   <AccordionItem value="item-1" className="border-b-0">
                     <div className="flex items-center p-4 gap-4">
                        <div className="flex-none">
                           <div className={cn(
                             "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg",
                             project.status === "In Progress" ? "bg-blue-600" :
                             project.status === "Completed" ? "bg-green-600" :
                             "bg-slate-500"
                           )}>
                             {project.name.charAt(0)}
                           </div>
                        </div>
                        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                           <div className="md:col-span-2">
                              <h3 className="font-semibold text-base truncate">{project.name}</h3>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <Badge variant="outline" className={cn(
                                  "font-normal",
                                  project.status === "In Progress" && "bg-blue-50 text-blue-700 border-blue-200",
                                  project.status === "Overdue" && "bg-red-50 text-red-700 border-red-200"
                                )}>
                                  {project.status}
                                </Badge>
                                <span>•</span>
                                <span>Due {project.deadline}</span>
                              </div>
                           </div>
                           
                           <div className="flex flex-col gap-1">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Progress</span>
                                <span>{progress}%</span>
                              </div>
                              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                              </div>
                           </div>

                           <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                              <Briefcase className="w-4 h-4" />
                              {projectTasks.length} tasks
                           </div>
                        </div>
                        
                        <AccordionTrigger className="w-8 h-8 p-0" />
                     </div>
                     
                     <AccordionContent className="border-t bg-muted/20 p-6">
                       <Tabs defaultValue="status" className="w-full">
                         <TabsList className="mb-6 bg-background border">
                           <TabsTrigger value="status" className="gap-2">
                             <Layers className="w-4 h-4" />
                             By Status
                           </TabsTrigger>
                           <TabsTrigger value="epic" className="gap-2">
                             <Flag className="w-4 h-4" />
                             By Epic
                           </TabsTrigger>
                           <TabsTrigger value="stage" className="gap-2">
                             <Workflow className="w-4 h-4" />
                             By Stage
                           </TabsTrigger>
                         </TabsList>

                         <TabsContent value="status" className="mt-0 space-y-8">
                            {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
                               <div key={status} className="space-y-3">
                                  <h4 className="text-sm font-semibold flex items-center gap-2">
                                     <div className={cn(
                                       "w-2 h-2 rounded-full",
                                       status === "Done" ? "bg-green-500" :
                                       status === "In Progress" ? "bg-blue-500" :
                                       "bg-slate-300"
                                     )} />
                                     {status} 
                                     <span className="text-muted-foreground font-normal ml-1">({statusTasks.length})</span>
                                  </h4>
                                  {renderTaskGrid(statusTasks)}
                               </div>
                            ))}
                         </TabsContent>

                         <TabsContent value="epic" className="mt-0 space-y-8">
                            {Object.entries(tasksByEpic).map(([epicName, epicTasks]) => (
                               <div key={epicName} className="space-y-3">
                                  <h4 className="text-sm font-semibold flex items-center gap-2">
                                     <Flag className="w-4 h-4 text-purple-500" />
                                     {epicName}
                                     <span className="text-muted-foreground font-normal ml-1">({epicTasks.length})</span>
                                  </h4>
                                  {renderTaskGrid(epicTasks)}
                               </div>
                            ))}
                         </TabsContent>

                         <TabsContent value="stage" className="mt-0 space-y-8">
                            {Object.entries(orderedTasksByStage).map(([stageName, stageTasks]) => (
                               <div key={stageName} className="space-y-3">
                                  <h4 className="text-sm font-semibold flex items-center gap-2">
                                     <Workflow className="w-4 h-4 text-orange-500" />
                                     {stageName}
                                     <span className="text-muted-foreground font-normal ml-1">({stageTasks.length})</span>
                                  </h4>
                                  {renderTaskGrid(stageTasks)}
                               </div>
                            ))}
                         </TabsContent>
                       </Tabs>
                     </AccordionContent>
                   </AccordionItem>
                 </Accordion>
               </Card>
             );
           })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredProjects.map((project: any) => {
             const projectTasks = getProjectTasks(project.id, project.name);
             const progress = project.progress || 0;
             
             return (
               <Card key={project.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                 <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                       <div className={cn(
                         "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg mb-3",
                         project.status === "In Progress" ? "bg-blue-600" :
                         project.status === "Completed" ? "bg-green-600" :
                         "bg-slate-500"
                       )}>
                         {project.name.charAt(0)}
                       </div>
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8">
                             <MoreHorizontal className="h-4 w-4" />
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                           <DropdownMenuItem>View Project</DropdownMenuItem>
                           <DropdownMenuItem>Project Settings</DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                    </div>
                    <CardTitle className="text-lg leading-tight">{project.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="font-normal text-xs">
                        {project.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">Due {project.deadline}</span>
                    </div>
                 </CardHeader>
                 <CardContent className="flex-1 flex flex-col gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Completion</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-3">{projectTasks.length} Active Tasks</p>
                      <div className="space-y-2">
                        {projectTasks.slice(0, 2).map(task => (
                          <div key={task.id} className="flex items-center gap-2 text-sm">
                             <div className={cn(
                               "w-2 h-2 rounded-full",
                               task.status === "complete" ? "bg-green-500" : "bg-blue-500"
                             )} />
                             <span className="truncate">{task.title}</span>
                          </div>
                        ))}
                        {projectTasks.length > 2 && (
                          <div className="text-xs text-muted-foreground pl-4">
                            + {projectTasks.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                 </CardContent>
               </Card>
             );
           })}
        </div>
      )}
    </div>
  );
}
