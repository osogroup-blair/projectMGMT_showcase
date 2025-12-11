import { useState, useMemo } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  Plus, Search, Filter, MoreVertical, Edit, Trash2, 
  CheckCircle2, Circle, Clock, AlertCircle, Calendar, 
  User, Flag, CheckSquare, Target, Briefcase, Layers,
  ListTodo, SlidersHorizontal, ArrowRight, Copy, Lock, Unlock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter 
} from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { 
  MILESTONES, MILESTONE_SCOPE_RULES, MILESTONE_TASK_LINKS, 
  TASKS, EPICS, TEAM, PROJECTS,
  Milestone, MilestoneScopeRules, MilestoneTaskLink, Task, Epic
} from "@/lib/mock-data";

// --- Types & Constants ---

const PHASES = [
  { id: "plan_strategy", label: "Plan Strategy", color: "bg-purple-100 text-purple-800" },
  { id: "validate_blueprints", label: "Validate Blueprints", color: "bg-blue-100 text-blue-800" },
  { id: "develop_solution", label: "Develop Solution", color: "bg-indigo-100 text-indigo-800" },
  { id: "enable_users", label: "Enable Users", color: "bg-green-100 text-green-800" }
];

const STATUS_CONFIG = {
  "planned": { icon: Circle, color: "text-slate-500", label: "Planned" },
  "in_progress": { icon: Clock, color: "text-blue-500", label: "In Progress" },
  "achieved": { icon: CheckCircle2, color: "text-green-500", label: "Achieved" },
  "slipped": { icon: AlertCircle, color: "text-red-500", label: "Slipped" },
  "cancelled": { icon: Flag, color: "text-slate-400", label: "Cancelled" },
  // Legacy mappings
  "Pending": { icon: Circle, color: "text-slate-500", label: "Planned" },
  "In Progress": { icon: Clock, color: "text-blue-500", label: "In Progress" },
  "Completed": { icon: CheckCircle2, color: "text-green-500", label: "Achieved" },
  "Blocked": { icon: AlertCircle, color: "text-red-500", label: "Slipped" },
  "Skipped": { icon: Flag, color: "text-slate-400", label: "Cancelled" }
};

// --- Sub-Components ---

function MilestoneListPanel({ 
  milestones, 
  selectedId, 
  onSelect, 
  onCreate, 
  onDelete 
}: { 
  milestones: Milestone[], 
  selectedId?: string, 
  onSelect: (id: string) => void,
  onCreate: () => void,
  onDelete: (id: string) => void
}) {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = milestones.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full border-r bg-muted/10 w-full md:w-80 lg:w-96 shrink-0">
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Milestones</h2>
          <Button size="sm" variant="ghost" onClick={onCreate}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search milestones..." 
            className="pl-9 bg-background"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col p-2 gap-2">
          {filtered.map(m => {
            const status = STATUS_CONFIG[m.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.planned;
            const StatusIcon = status.icon;
            
            return (
              <div 
                key={m.id}
                onClick={() => onSelect(m.id)}
                className={cn(
                  "p-3 rounded-lg cursor-pointer border transition-all hover:shadow-sm",
                  selectedId === m.id 
                    ? "bg-background border-primary shadow-sm ring-1 ring-primary/20" 
                    : "bg-card border-transparent hover:bg-background hover:border-border"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm line-clamp-1">{m.name}</span>
                  {selectedId === m.id && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 text-muted-foreground hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); setDeleteId(m.id); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <StatusIcon className={cn("h-3 w-3", status.color)} />
                  <span>{status.label}</span>
                  <span className="mx-1">•</span>
                  <span>{new Date(m.targetDate).toLocaleDateString()}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Progress</span>
                    <span>{m.progress?.percentComplete || 0}%</span>
                  </div>
                  <Progress value={m.progress?.percentComplete || 0} className="h-1" />
                </div>
              </div>
            );
          })}
          
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No milestones found.
            </div>
          )}
        </div>
      </ScrollArea>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the milestone and remove all task associations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteId) onDelete(deleteId);
              setDeleteId(null);
            }} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ScopeBuilder({ 
  milestone, 
  tasks, 
  epics, 
  links, 
  rules, 
  onUpdateLinks,
  onUpdateRules 
}: {
  milestone: Milestone,
  tasks: Task[],
  epics: Epic[],
  links: MilestoneTaskLink[],
  rules: MilestoneScopeRules,
  onUpdateLinks: (links: MilestoneTaskLink[]) => void,
  onUpdateRules: (rules: MilestoneScopeRules) => void
}) {
  // Manual Scope State
  const [manualSearch, setManualSearch] = useState("");
  
  // Rule Builder State
  const [activeRuleId, setActiveRuleId] = useState<string | null>(null);

  // Filtered tasks for manual selection
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(manualSearch.toLowerCase()) || 
                            t.project.toLowerCase().includes(manualSearch.toLowerCase());
      return matchesSearch;
    });
  }, [tasks, manualSearch]);

  const handleToggleTask = (taskId: string) => {
    const existingLink = links.find(l => l.taskId === taskId && l.milestoneId === milestone.id);
    
    if (existingLink) {
      if (existingLink.locked) return; // Prevent unlocking via simple toggle, need unlock action
      // Remove link
      onUpdateLinks(links.filter(l => l.id !== existingLink.id));
    } else {
      // Add link
      const newLink: MilestoneTaskLink = {
        id: `l-${Date.now()}`,
        milestoneId: milestone.id,
        taskId,
        source: "manual_add",
        locked: true,
        createdAt: new Date().toISOString()
      };
      onUpdateLinks([...links, newLink]);
    }
  };

  const handleToggleLock = (link: MilestoneTaskLink) => {
    const updated = { ...link, locked: !link.locked };
    onUpdateLinks(links.map(l => l.id === link.id ? updated : l));
  };

  const handleAddRule = () => {
    const newRule = {
      id: `r-${Date.now()}`,
      label: "New Scope Rule",
      active: true,
      filters: {}
    };
    onUpdateRules({
      ...rules,
      rules: [...(rules.rules || []), newRule]
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    onUpdateRules({
      ...rules,
      rules: rules.rules.filter(r => r.id !== ruleId)
    });
  };

  const handleUpdateRule = (ruleId: string, updates: any) => {
    onUpdateRules({
      ...rules,
      rules: rules.rules.map(r => r.id === ruleId ? { ...r, ...updates } : r)
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
          <TabsTrigger 
            value="rules" 
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Rule-Based Scope
          </TabsTrigger>
          <TabsTrigger 
            value="manual"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2"
          >
            <ListTodo className="w-4 h-4 mr-2" />
            Manual Adjustments
          </TabsTrigger>
          <TabsTrigger 
            value="matrix"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2"
          >
            <Layers className="w-4 h-4 mr-2" />
            Coverage Matrix
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="rules" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Definition Rules</h3>
              <Button size="sm" variant="outline" onClick={handleAddRule} className="gap-2">
                <Plus className="h-4 w-4" /> Add Rule
              </Button>
            </div>
            
            <div className="space-y-3">
              {(rules.rules || []).length === 0 ? (
                 <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm bg-muted/10">
                   No rules defined. Add a rule to automatically include tasks in this milestone.
                 </div>
              ) : (
                rules.rules.map((rule) => (
                  <Card key={rule.id} className="relative overflow-hidden group">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                      <div className="flex-1 mr-4">
                         <Input 
                           value={rule.label} 
                           onChange={(e) => handleUpdateRule(rule.id, { label: e.target.value })}
                           className="h-8 font-medium border-transparent hover:border-input focus:border-input px-0"
                         />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={rule.active} onCheckedChange={(c) => handleUpdateRule(rule.id, { active: c })} />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteRule(rule.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 text-sm text-muted-foreground space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <Label className="text-xs">Task Type</Label>
                           <Select value={rule.taskTemplateKey || "all"} onValueChange={(v) => handleUpdateRule(rule.id, { taskTemplateKey: v })}>
                             <SelectTrigger className="h-8"><SelectValue placeholder="Any Type" /></SelectTrigger>
                             <SelectContent>
                               <SelectItem value="all">Any Type</SelectItem>
                               <SelectItem value="backend">Backend Task</SelectItem>
                               <SelectItem value="frontend">Frontend Task</SelectItem>
                               <SelectItem value="design">Design Task</SelectItem>
                             </SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-1">
                           <Label className="text-xs">Stage</Label>
                           <Select value={rule.stage || "all"} onValueChange={(v) => handleUpdateRule(rule.id, { stage: v })}>
                             <SelectTrigger className="h-8"><SelectValue placeholder="Any Stage" /></SelectTrigger>
                             <SelectContent>
                               <SelectItem value="all">Any Stage</SelectItem>
                               <SelectItem value="develop_solution">Develop Solution</SelectItem>
                               <SelectItem value="validate_blueprints">Validate Blueprints</SelectItem>
                               <SelectItem value="plan_strategy">Plan Strategy</SelectItem>
                               <SelectItem value="enable_users">Enable Users</SelectItem>
                             </SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-1">
                           <Label className="text-xs">Epic Type</Label>
                           <Select value={rule.epicType || "all"} onValueChange={(v) => handleUpdateRule(rule.id, { epicType: v })}>
                             <SelectTrigger className="h-8"><SelectValue placeholder="Any Epic Type" /></SelectTrigger>
                             <SelectContent>
                               <SelectItem value="all">Any Epic Type</SelectItem>
                               <SelectItem value="use_case">Use Case</SelectItem>
                               <SelectItem value="technical">Technical</SelectItem>
                             </SelectContent>
                           </Select>
                        </div>
                      </div>
                      <div className="bg-muted/30 p-2 rounded text-xs flex items-center gap-2 mt-2">
                         <ArrowRight className="h-3 w-3" />
                         <span>Matches roughly <strong>{Math.floor(Math.random() * 10)} tasks</strong> across <strong>{Math.floor(Math.random() * 3)} epics</strong></span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="flex gap-2">
               <div className="relative flex-1">
                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                 <Input 
                   placeholder="Search tasks to add..." 
                   className="pl-9"
                   value={manualSearch}
                   onChange={e => setManualSearch(e.target.value)}
                 />
               </div>
               <Button variant="outline"><Filter className="h-4 w-4 mr-2" /> Filter</Button>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Epic</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Included</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map(task => {
                    const link = links.find(l => l.taskId === task.id && l.milestoneId === milestone.id);
                    const isLinked = !!link;
                    const epic = epics.find(e => e.id === task.epicId);

                    return (
                      <TableRow key={task.id}>
                        <TableCell>
                          <CheckSquare 
                            className={cn(
                              "h-4 w-4 cursor-pointer transition-colors", 
                              isLinked ? "text-primary" : "text-muted-foreground/30 hover:text-muted-foreground"
                            )}
                            onClick={() => handleToggleTask(task.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {task.title}
                          <div className="text-xs text-muted-foreground">{task.id}</div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {epic?.title || "No Epic"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-normal">
                            {task.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {isLinked ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                              {link?.source === 'rule' ? 'By Rule' : 'Manual'}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                           {isLinked && (
                             <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleToggleLock(link)}>
                               {link.locked ? (
                                 <Lock className="h-3 w-3 text-amber-500" />
                               ) : (
                                 <Unlock className="h-3 w-3 text-muted-foreground/30" />
                               )}
                             </Button>
                           )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="matrix" className="space-y-4">
             <div className="border rounded-md overflow-hidden">
               <div className="bg-muted/30 p-4 border-b">
                 <h4 className="font-medium text-sm">Coverage Matrix</h4>
                 <p className="text-xs text-muted-foreground">Quickly spot gaps in epic coverage for this milestone.</p>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-sm">
                   <thead>
                     <tr className="border-b bg-muted/10">
                       <th className="p-3 text-left font-medium min-w-[200px]">Epic</th>
                       <th className="p-3 text-center font-medium border-l">Plan</th>
                       <th className="p-3 text-center font-medium border-l">Design</th>
                       <th className="p-3 text-center font-medium border-l">Develop</th>
                       <th className="p-3 text-center font-medium border-l">QA</th>
                     </tr>
                   </thead>
                   <tbody>
                     {epics.map(epic => (
                       <tr key={epic.id} className="border-b last:border-0 hover:bg-muted/5">
                         <td className="p-3 font-medium">
                           {epic.title}
                           <div className="text-xs text-muted-foreground font-normal line-clamp-1">{epic.description}</div>
                         </td>
                         {[1, 2, 3, 4].map(idx => {
                           const hasTask = Math.random() > 0.3; // Fake check
                           const isIncluded = hasTask && Math.random() > 0.5;
                           
                           return (
                             <td key={idx} className="p-3 text-center border-l">
                               {hasTask ? (
                                 isIncluded ? (
                                   <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto">
                                     <CheckCircle2 className="h-4 w-4" />
                                   </div>
                                 ) : (
                                   <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                                     <Circle className="h-4 w-4" />
                                   </div>
                                 )
                               ) : (
                                 <span className="text-muted-foreground/20 text-xs">-</span>
                               )}
                             </td>
                           );
                         })}
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function MilestoneDetailPanel({ 
  milestone, 
  onSave, 
  tasks,
  epics,
  team,
  scopeRules,
  taskLinks,
  onUpdateScopeRules,
  onUpdateTaskLinks
}: { 
  milestone: Milestone, 
  onSave: (m: Milestone) => void,
  tasks: Task[],
  epics: Epic[],
  team: any[],
  scopeRules: MilestoneScopeRules,
  taskLinks: MilestoneTaskLink[],
  onUpdateScopeRules: (rules: MilestoneScopeRules) => void,
  onUpdateTaskLinks: (links: MilestoneTaskLink[]) => void
}) {
  const [formData, setFormData] = useState<Milestone>({ ...milestone });
  const [isDirty, setIsDirty] = useState(false);

  // Update local state when prop changes (selection change)
  useMemo(() => {
    setFormData({ ...milestone });
    setIsDirty(false);
  }, [milestone.id]);

  const handleChange = (field: keyof Milestone, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    onSave(formData);
    setIsDirty(false);
  };

  const status = STATUS_CONFIG[formData.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.planned;
  const phase = PHASES.find(p => p.id === formData.phase) || PHASES[0];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header Section */}
      <div className="p-6 border-b space-y-6">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1 flex-1">
             <div className="flex items-center gap-2 mb-2">
               <Badge variant="outline" className={cn("font-normal", phase.color)}>
                 {phase.label}
               </Badge>
               <Badge variant="outline" className={cn("font-normal border-transparent", status.color, "bg-opacity-10")}>
                 {status.label}
               </Badge>
             </div>
             <Input 
               value={formData.name} 
               onChange={e => handleChange('name', e.target.value)}
               className="text-2xl font-bold border-transparent px-0 hover:border-input focus:border-input h-auto py-1 shadow-none"
             />
             <Input 
               value={formData.description} 
               onChange={e => handleChange('description', e.target.value)}
               className="text-muted-foreground border-transparent px-0 hover:border-input focus:border-input shadow-none h-auto py-1"
               placeholder="Add a description..."
             />
          </div>
          <div className="flex flex-col gap-2 items-end">
             <Button onClick={handleSave} disabled={!isDirty}>
               {isDirty ? "Save Changes" : "Saved"}
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Target Date</Label>
            <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-card">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <input 
                type="date" 
                value={formData.targetDate}
                onChange={e => handleChange('targetDate', e.target.value)}
                className="bg-transparent text-sm focus:outline-none w-full"
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Owner</Label>
            <Select value={formData.ownerId} onValueChange={v => handleChange('ownerId', v)}>
              <SelectTrigger className="bg-card">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {team.map(t => (
                   <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={formData.status} onValueChange={v => handleChange('status', v)}>
              <SelectTrigger className="bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_CONFIG).slice(0, 5).map(([key, conf]) => (
                   <SelectItem key={key} value={key}>{conf.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Phase</Label>
            <Select value={formData.phase} onValueChange={v => handleChange('phase', v)}>
              <SelectTrigger className="bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PHASES.map(p => (
                   <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="pt-2">
            <div className="h-10 flex flex-col justify-center gap-1.5">
              <div className="flex justify-between text-xs">
                <span>{formData.progress?.completedTasks || 0}/{formData.progress?.totalTasks || 0} tasks completed</span>
                <span className="font-medium">{formData.progress?.percentComplete || 0}%</span>
              </div>
              <Progress value={formData.progress?.percentComplete || 0} className="h-2" />
            </div>
        </div>
      </div>

      {/* Scope Builder Area */}
      <div className="flex-1 overflow-auto bg-muted/5 p-6">
         <div className="max-w-4xl mx-auto">
            <ScopeBuilder 
               milestone={formData}
               tasks={tasks}
               epics={epics}
               links={taskLinks}
               rules={scopeRules}
               onUpdateLinks={onUpdateTaskLinks}
               onUpdateRules={onUpdateScopeRules}
            />
         </div>
      </div>
    </div>
  );
}

// --- Main Page Component ---

export default function MilestonesManagementPage() {
  const { toast } = useToast();
  
  // Local State for Mock Data
  const [milestones, setMilestones] = useState<Milestone[]>(MILESTONES);
  const [selectedId, setSelectedId] = useState<string | null>(MILESTONES[0]?.id || null);
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [scopeRules, setScopeRules] = useState<MilestoneScopeRules[]>(MILESTONE_SCOPE_RULES);
  const [taskLinks, setTaskLinks] = useState<MilestoneTaskLink[]>(MILESTONE_TASK_LINKS);
  
  // Create Dialog State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    phase: "plan_strategy",
    targetDate: new Date().toISOString().split('T')[0]
  });

  const selectedMilestone = useMemo(() => 
    milestones.find(m => m.id === selectedId), 
    [milestones, selectedId]
  );

  const selectedRules = useMemo(() => 
    scopeRules.find(r => r.milestoneId === selectedId) || { milestoneId: selectedId!, rules: [] },
    [scopeRules, selectedId]
  );

  const selectedLinks = useMemo(() => 
    taskLinks.filter(l => l.milestoneId === selectedId),
    [taskLinks, selectedId]
  );

  // Handlers
  const handleOpenCreate = () => {
    setCreateForm({
      name: "",
      phase: "plan_strategy",
      targetDate: new Date().toISOString().split('T')[0]
    });
    setIsCreateDialogOpen(true);
  };

  const handleCreateConfirm = () => {
    if (!createForm.name) return;

    const newId = `m-${Date.now()}`;
    const newMilestone: Milestone = {
      id: newId,
      projectId: "1",
      name: createForm.name,
      description: "Describe the milestone goal...",
      phase: createForm.phase as any,
      targetDate: createForm.targetDate,
      status: "planned",
      ownerId: TEAM[0].id,
      scopeType: "manual",
      completionMode: "all_tasks",
      progress: {
        totalTasks: 0,
        completedTasks: 0,
        percentComplete: 0
      }
    };
    
    setMilestones([...milestones, newMilestone]);
    setSelectedId(newId);
    setIsCreateDialogOpen(false);
    toast({ title: "Milestone Created", description: "Start by defining its scope." });
  };

  const handleDelete = (id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
    if (selectedId === id) setSelectedId(null);
    toast({ title: "Milestone Deleted" });
  };

  const handleUpdateMilestone = (updated: Milestone) => {
    setMilestones(prev => prev.map(m => m.id === updated.id ? updated : m));
    toast({ title: "Milestone Updated" });
  };

  const handleUpdateRules = (updatedRules: MilestoneScopeRules) => {
    setScopeRules(prev => {
       const existing = prev.findIndex(r => r.milestoneId === updatedRules.milestoneId);
       if (existing >= 0) {
         const copy = [...prev];
         copy[existing] = updatedRules;
         return copy;
       }
       return [...prev, updatedRules];
    });
    toast({ title: "Scope Rules Updated", description: "Milestone scope has been recalculated." });
  };

  const handleUpdateLinks = (updatedLinks: MilestoneTaskLink[]) => {
    // Replace all links for this milestone with the new set
    setTaskLinks(prev => {
       const others = prev.filter(l => l.milestoneId !== selectedId);
       return [...others, ...updatedLinks];
    });

    // Recalculate progress
    if (selectedMilestone) {
      const total = updatedLinks.length;
      const completed = updatedLinks.filter(l => {
         const t = tasks.find(task => task.id === l.taskId);
         return t?.status === "Done";
      }).length;
      
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

      const updatedMilestone = {
        ...selectedMilestone,
        progress: {
          totalTasks: total,
          completedTasks: completed,
          percentComplete: percent
        },
        progressPercent: percent // legacy sync
      };
      
      setMilestones(prev => prev.map(m => m.id === updatedMilestone.id ? updatedMilestone : m));
    }
  };

  return (
    <Shell>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
        <MilestoneListPanel 
          milestones={milestones}
          selectedId={selectedId || undefined}
          onSelect={setSelectedId}
          onCreate={handleOpenCreate}
          onDelete={handleDelete}
        />
        
        <div className="flex-1 flex flex-col min-w-0">
          {selectedMilestone ? (
            <MilestoneDetailPanel 
              milestone={selectedMilestone}
              onSave={handleUpdateMilestone}
              tasks={tasks}
              epics={EPICS}
              team={TEAM}
              scopeRules={selectedRules}
              taskLinks={selectedLinks}
              onUpdateScopeRules={handleUpdateRules}
              onUpdateTaskLinks={handleUpdateLinks}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <div className="bg-muted/30 p-6 rounded-full mb-4">
                <Target className="h-12 w-12 opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-foreground">No Milestone Selected</h3>
              <p className="max-w-xs text-center mt-2">Select a milestone from the list or create a new one to get started.</p>
              <Button onClick={handleOpenCreate} className="mt-6">Create Milestone</Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Milestone</DialogTitle>
            <DialogDescription>
              Define the basics for your new milestone. You can configure scope and rules later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="e.g. Alpha Release"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phase">Phase</Label>
              <Select 
                value={createForm.phase} 
                onValueChange={(v) => setCreateForm({ ...createForm, phase: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PHASES.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Target Date</Label>
              <Input
                id="date"
                type="date"
                value={createForm.targetDate}
                onChange={(e) => setCreateForm({ ...createForm, targetDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateConfirm} disabled={!createForm.name}>Create Milestone</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}