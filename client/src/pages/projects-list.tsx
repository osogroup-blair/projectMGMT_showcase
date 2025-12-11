import { 
  Project, 
  TEAM,
  FRAMEWORK_TEMPLATES
} from "@/lib/mock-data";
import { useProjects } from "@/hooks/use-nexus-data";
import { 
  Search, 
  Filter, 
  Plus, 
  Upload, 
  MoreHorizontal, 
  ArrowUpDown,
  Calendar,
  AlertTriangle,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  X,
  Workflow,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Shell } from "@/components/layout/shell";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

// Extended Project Interface for this view
interface ExtendedProject extends Project {
  client: string;
  phase: string;
  owner: string;
  startDate: string;
  endDate: string;
  riskLevel: "Low" | "Medium" | "High";
  description?: string;
}

export default function ProjectsList() {
  const { toast } = useToast();
  const { data: projectsData, isLoading, create: createProject, update: updateProject, remove: deleteProject } = useProjects();
  
  // Filters State
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog & Form State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<ExtendedProject | null>(null);
  
  const [formData, setFormData] = useState<Partial<ExtendedProject>>({
    name: "",
    client: "",
    status: "Upcoming",
    phase: "Planning",
    owner: "",
    startDate: "",
    endDate: "",
    riskLevel: "Low",
    description: "",
    progress: 0,
    frameworkId: ""
  });

  // Enrich Data Memo
  const projects = useMemo(() => {
    return projectsData.map((p: any) => ({
      ...p,
      client: p.client || (p.name.includes("Houlihan") ? "Houlihan Lokey" : 
              p.name.includes("Colgate") ? "Colgate-Palmolive" : 
              p.name.includes("Kraft") ? "Kraft Heinz" : "SDMP Internal"),
      phase: p.phase || (p.status === "Upcoming" ? "Planning" : 
             p.status === "In Progress" ? "Development" : 
             p.status === "Completed" ? "Delivery" : "On Hold"),
      owner: p.owner || TEAM[Math.floor(Math.random() * TEAM.length)].name,
      startDate: p.startDate || "2023-10-01",
      endDate: p.endDate || "2023-12-15",
      riskLevel: p.riskLevel || (p.status === "Overdue" ? "High" : 
                 p.progress && p.progress < 50 && p.status === "In Progress" ? "Medium" : "Low"),
      description: p.description || "A strategic initiative to overhaul the core systems and improve user experience across all digital touchpoints."
    })) as ExtendedProject[];
  }, [projectsData]);

  // Filter Logic
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          project.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || project.status === filterStatus;
    const matchesRisk = filterRisk === "all" || project.riskLevel === filterRisk;
    
    return matchesSearch && matchesStatus && matchesRisk;
  });

  // CRUD Handlers
  const handleCreate = () => {
    const newProject = {
      name: formData.name || "New Project",
      status: formData.status || "Upcoming",
      deadline: formData.endDate || "TBD",
      progress: formData.progress || 0,
      frameworkId: formData.frameworkId,
      // Custom fields to be persisted
      client: formData.client || "Internal",
      phase: formData.phase || "Planning",
      owner: formData.owner || TEAM[0].name,
      startDate: formData.startDate || new Date().toISOString().split('T')[0],
      endDate: formData.endDate || "",
      riskLevel: formData.riskLevel || "Low",
      description: formData.description || "",
    };

    createProject(newProject);
    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = () => {
    if (!currentProject) return;

    updateProject({
      id: currentProject.id,
      updates: { ...formData }
    });

    setIsEditOpen(false);
    setCurrentProject(null);
    resetForm();
  };

  const handleDelete = () => {
    if (!currentProject) return;

    deleteProject(currentProject.id);
    setIsDeleteOpen(false);
    setCurrentProject(null);
  };


  const openEditDialog = (project: ExtendedProject) => {
    setCurrentProject(project);
    setFormData({
      name: project.name,
      client: project.client,
      status: project.status,
      phase: project.phase,
      owner: project.owner,
      startDate: project.startDate,
      endDate: project.endDate,
      riskLevel: project.riskLevel,
      description: project.description,
      progress: project.progress,
      frameworkId: project.frameworkId
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (project: ExtendedProject) => {
    setCurrentProject(project);
    setIsDeleteOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      client: "",
      status: "Upcoming",
      phase: "Planning",
      owner: "",
      startDate: "",
      endDate: "",
      riskLevel: "Low",
      description: "",
      progress: 0,
      frameworkId: ""
    });
  };

  return (
    <Shell>
      <div className="flex flex-col space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Projects List</h1>
            <p className="text-muted-foreground text-sm">Manage and track all ongoing projects across the organization.</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Link href="/projects/import">
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Import Project
              </Button>
            </Link>
            
            <Link href="/projects/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Project
                </Button>
            </Link>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border border-border shadow-sm">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search projects..." 
              className="pl-9 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Upcoming">Upcoming</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterRisk} onValueChange={setFilterRisk}>
              <SelectTrigger className="w-[140px]">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Risk Level" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risks</SelectItem>
                <SelectItem value="Low">Low Risk</SelectItem>
                <SelectItem value="Medium">Medium Risk</SelectItem>
                <SelectItem value="High">High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-md border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[250px]">
                  <Button variant="ghost" size="sm" className="-ml-3 h-8 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Project Name
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead className="w-[100px]">Progress</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project.id} className="group cursor-pointer hover:bg-muted/20">
                  <TableCell className="font-medium">
                    <Link href={`/projects/${project.id}`} className="hover:underline text-primary">
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{project.client}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "font-normal border-0 px-2 py-0.5 rounded-full text-xs",
                      project.status === 'In Progress' && "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
                      project.status === 'Upcoming' && "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300",
                      project.status === 'Overdue' && "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300",
                      project.status === 'Completed' && "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300",
                      project.status === 'On Hold' && "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    )}>
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-inset ring-gray-500/10">
                      {project.phase}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${project.owner}`} />
                        <AvatarFallback>{project.owner.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">{project.owner}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {project.startDate}
                      </span>
                      <span>to {project.endDate}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={cn(
                      "flex items-center gap-1.5 text-xs font-medium",
                      project.riskLevel === "High" ? "text-red-600" :
                      project.riskLevel === "Medium" ? "text-amber-600" : "text-green-600"
                    )}>
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        project.riskLevel === "High" ? "bg-red-500" :
                        project.riskLevel === "Medium" ? "bg-amber-500" : "bg-green-500"
                      )} />
                      {project.riskLevel}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={project.progress || 0} className="h-1.5 w-16" />
                      <span className="text-xs text-muted-foreground">{project.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/projects/${project.id}`}>
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(project)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit Project
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => openDeleteDialog(project)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-xs text-muted-foreground">
              Showing <strong>1-{filteredProjects.length}</strong> of <strong>{projects.length}</strong> projects
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled className="h-8 w-8 p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update the project details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Project Name</Label>
                <Input 
                  id="edit-name" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-client">Client</Label>
                <Input 
                  id="edit-client" 
                  value={formData.client}
                  onChange={(e) => setFormData({...formData, client: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(val) => setFormData({...formData, status: val as any})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Upcoming">Upcoming</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-owner">Project Owner</Label>
                <Select 
                  value={formData.owner} 
                  onValueChange={(val) => setFormData({...formData, owner: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM.map(member => (
                      <SelectItem key={member.id} value={member.name}>{member.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-framework">Project Framework</Label>
              <Select 
                value={formData.frameworkId} 
                onValueChange={(val) => setFormData({...formData, frameworkId: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a framework" />
                </SelectTrigger>
                <SelectContent>
                  {FRAMEWORK_TEMPLATES.map(fw => (
                    <SelectItem key={fw.id} value={fw.id}>{fw.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Start Date</Label>
                <Input 
                  id="edit-startDate" 
                  type="date" 
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">End Date</Label>
                <Input 
                  id="edit-endDate" 
                  type="date" 
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-risk">Risk Level</Label>
              <Select 
                value={formData.riskLevel} 
                onValueChange={(val) => setFormData({...formData, riskLevel: val as any})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea 
                id="edit-description" 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the 
              <span className="font-semibold"> {currentProject?.name} </span>
              project and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
}
