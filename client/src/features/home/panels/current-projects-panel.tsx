import { HomeTask } from "../types";
import { useProjects, useTasks, useEpics, useProjectStages, useSprints, useMilestones, useUsers } from "@/hooks/use-nexus-data";
import { useCurrentUser } from "@/context/current-user-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Briefcase, ChevronDown, ChevronRight, MoreHorizontal, LayoutGrid, List, Layers, Workflow, Flag, Loader2, ExternalLink, Kanban } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { TaskCard } from "./task-card";
import { PortableKanban } from "@/components/kanban/portable-kanban";
import { TaskQuickCreateDialog } from "@/components/task-quick-create-dialog";
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
  const { data: sprints = [], isLoading: sprintsLoading } = useSprints();
  const { data: milestones = [], isLoading: milestonesLoading } = useMilestones();
  const { data: allUsers = [], isLoading: usersLoading } = useUsers();
  const { currentUserId } = useCurrentUser();
  
  // Inactive task statuses to exclude
  const INACTIVE_STATUSES = ["done", "deferred", "archived", "complete", "completed"];
  
  // Filter tasks to only show those assigned to the current user
  // Use string comparison to handle potential type mismatches
  const userTasks = useMemo(() => {
    if (!allTasks || !currentUserId) return [];
    return allTasks.filter((task: any) => String(task.assigneeId) === String(currentUserId));
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
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedProjectForTask, setSelectedProjectForTask] = useState<{ id: string; name: string } | null>(null);
  
  const handleAddTaskForProject = (projectId: string, projectName: string) => {
    setSelectedProjectForTask({ id: projectId, name: projectName });
    setIsCreateTaskOpen(true);
  };
  
  // Use active tasks or all user tasks based on toggle
  const tasks = showAllTasks ? userTasks : activeTasks;

  // Helper to map raw Task to HomeTask for the TaskCard
  const mapToHomeTask = useMemo(() => (task: any): HomeTask => {
    const project = projects.find((p: any) => p.name === task.project || p.id === task.projectId);
    const epic = epics.find((e: any) => e.id === task.epicId);
    const projectId = project?.id || task.projectId || "unknown";
    
    return {
      id: task.id,
      projectId: projectId,
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
      links: {
        taskUrl: `/projects/${projectId}/tasks/${task.id}`,
        projectUrl: `/projects/${projectId}`,
        epicUrl: epic?.id ? `/projects/${projectId}/epics/${epic.id}` : undefined,
      },
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
  
  // Get raw tasks for Kanban (not mapped to HomeTask format)
  const getRawProjectTasks = (projectId: string, projectName: string) => {
    return tasks
      .filter((t: any) => t.project === projectName || t.projectId === projectId)
      .map((t: any) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        effort: t.effort,
        assigneeId: t.assigneeId,
        epicId: t.epicId,
        milestoneId: t.milestoneId,
        sprintId: t.sprintId,
        deadline: t.deadline,
        description: t.description,
        priority: t.priority,
        estimateHours: t.estimateHours,
        projectId: t.projectId || projectId,
        projectName: t.project || projectName,
        epicName: epics.find((e: any) => e.id === t.epicId)?.title,
        sprintName: sprints.find((s: any) => s.id === t.sprintId)?.name,
        milestoneName: milestones.find((m: any) => m.id === t.milestoneId)?.name,
        assigneeName: allUsers.find((u: any) => u.id === t.assigneeId)?.name,
        stageId: t.stageId,
        tags: t.tags,
      }));
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

  if (projectsLoading || tasksLoading || epicsLoading || stagesLoading || sprintsLoading || milestonesLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  // Format users for Kanban filter
  const kanbanUsers = allUsers.map((u: any) => ({
    id: u.id,
    name: u.name || u.email || `User ${u.id}`,
  }));
  
  // Format epics for Kanban filter
  const kanbanEpics = epics.map((e: any) => ({
    id: e.id,
    title: e.title || e.name || `Epic ${e.id}`,
  }));
  
  // Format milestones for Kanban filter
  const kanbanMilestones = milestones.map((m: any) => ({
    id: m.id,
    title: m.name || m.title || `Milestone ${m.id}`,
  }));
  
  // Format sprints for Kanban filter
  const kanbanSprints = sprints.map((s: any) => ({
    id: s.id,
    name: s.name || `Sprint ${s.id}`,
  }));

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
                              <Link href={`/projects/${project.id}`} className="font-semibold text-base truncate hover:underline hover:text-primary transition-colors">
                                {project.name}
                              </Link>
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
                             <Kanban className="w-4 h-4" />
                             Kanban
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

                         <TabsContent value="status" className="mt-0">
                            <PortableKanban
                              tasks={getRawProjectTasks(project.id, project.name)}
                              users={kanbanUsers}
                              epics={kanbanEpics.filter((e: any) => {
                                const projectEpicIds = new Set(
                                  getRawProjectTasks(project.id, project.name).map((t: any) => t.epicId).filter(Boolean)
                                );
                                return projectEpicIds.has(e.id);
                              })}
                              milestones={kanbanMilestones.filter((m: any) => {
                                const projectMilestoneIds = new Set(
                                  getRawProjectTasks(project.id, project.name).map((t: any) => t.milestoneId).filter(Boolean)
                                );
                                return projectMilestoneIds.has(m.id);
                              })}
                              sprints={kanbanSprints.filter((s: any) => {
                                const projectSprintIds = new Set(
                                  getRawProjectTasks(project.id, project.name).map((t: any) => t.sprintId).filter(Boolean)
                                );
                                return projectSprintIds.has(s.id);
                              })}
                              projectId={project.id}
                              boardId={`home-project-${project.id}`}
                              showFilters={true}
                              showAssigneeFilter={true}
                              showAddTask={true}
                              onAddTask={() => handleAddTaskForProject(project.id, project.name)}
                              isReadOnly={false}
                              className="min-h-[400px]"
                            />
                         </TabsContent>

                         <TabsContent value="epic" className="mt-0 space-y-8">
                            {Object.entries(tasksByEpic).map(([epicName, epicTasks]) => {
                               const epicId = epicTasks[0]?.epicId;
                               return (
                                 <div key={epicName} className="space-y-3">
                                    <h4 className="text-sm font-semibold flex items-center gap-2">
                                       <Flag className="w-4 h-4 text-purple-500" />
                                       {epicId ? (
                                         <Link 
                                           href={`/projects/${project.id}/epics/${epicId}`}
                                           className="hover:underline hover:text-primary transition-colors"
                                         >
                                           {epicName}
                                         </Link>
                                       ) : (
                                         epicName
                                       )}
                                       <span className="text-muted-foreground font-normal ml-1">({epicTasks.length})</span>
                                    </h4>
                                    {renderTaskGrid(epicTasks)}
                                 </div>
                               );
                            })}
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
                           <DropdownMenuItem asChild>
                             <Link href={`/projects/${project.id}`}>View Project</Link>
                           </DropdownMenuItem>
                           <DropdownMenuItem asChild>
                             <Link href={`/projects/${project.id}/settings`}>Project Settings</Link>
                           </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                    </div>
                    <Link href={`/projects/${project.id}`}>
                     <CardTitle className="text-lg leading-tight hover:underline hover:text-primary transition-colors">{project.name}</CardTitle>
                   </Link>
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
                          <Link 
                            key={task.id} 
                            href={task.links?.taskUrl || `/projects/${project.id}/tasks/${task.id}`}
                            className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                          >
                             <div className={cn(
                               "w-2 h-2 rounded-full",
                               task.status === "complete" ? "bg-green-500" : "bg-blue-500"
                             )} />
                             <span className="truncate hover:underline">{task.title}</span>
                          </Link>
                        ))}
                        {projectTasks.length > 2 && (
                          <Link 
                            href={`/projects/${project.id}/tasks`}
                            className="text-xs text-muted-foreground pl-4 hover:text-primary hover:underline transition-colors"
                          >
                            + {projectTasks.length - 2} more
                          </Link>
                        )}
                      </div>
                    </div>
                 </CardContent>
               </Card>
             );
           })}
        </div>
      )}
      
      <TaskQuickCreateDialog
        open={isCreateTaskOpen}
        onOpenChange={(open) => {
          setIsCreateTaskOpen(open);
          if (!open) setSelectedProjectForTask(null);
        }}
        defaultProjectId={selectedProjectForTask?.id}
        defaultProjectName={selectedProjectForTask?.name}
      />
    </div>
  );
}
