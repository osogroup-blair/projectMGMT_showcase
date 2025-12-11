import { useState } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  Database,
  Layout, 
  ListTodo, 
  Plus, 
  Search, 
  Settings, 
  Users,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  Check,
  Package,
  FileBox,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { 
  PROJECTS, 
  TASKS, 
  TEAM, 
  Project, 
  Task, 
  TeamMember,
  PROJECT_STATUS_OPTIONS,
  TASK_STATUS_OPTIONS
} from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

export default function AdminDemoData() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("projects");

  // Local State for Demo Data
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [team, setTeam] = useState<TeamMember[]>(TEAM);

  // Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentType, setCurrentType] = useState<"project" | "task" | "user">("project");
  const [formData, setFormData] = useState<any>({});
  const [currentItem, setCurrentItem] = useState<any>(null);

  const filterData = (data: any[]) => {
    return data.filter(item => 
      (item.name || item.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleCreate = (type: "project" | "task" | "user") => {
    setCurrentType(type);
    setCurrentItem(null);
    
    // Initialize empty form data
    if (type === "project") {
      setFormData({
        name: "",
        status: "Upcoming",
        deadline: "",
        progress: 0,
        frameworkId: "ft_impl"
      });
    } else if (type === "task") {
      setFormData({
        title: "",
        description: "",
        status: "Todo",
        priority: "Medium",
        estimateHours: 1
      });
    } else if (type === "user") {
      setFormData({
        name: "",
        role: "",
        email: "",
        status: "Offline"
      });
    }
    
    setIsEditOpen(true);
  };

  const handleEdit = (item: any, type: "project" | "task" | "user") => {
    setCurrentType(type);
    setCurrentItem(item);
    setFormData({ ...item });
    setIsEditOpen(true);
  };

  const handleDelete = (id: string, type: "project" | "task" | "user") => {
    if (type === "project") {
      setProjects(prev => prev.filter(p => p.id !== id));
    } else if (type === "task") {
      setTasks(prev => prev.filter(t => t.id !== id));
    } else if (type === "user") {
      setTeam(prev => prev.filter(u => u.id !== id));
    }
    
    toast({
      title: "Item Deleted",
      description: "The item has been removed from the demo data.",
      variant: "destructive"
    });
  };

  const handleSave = () => {
    const isNew = !currentItem;
    const newId = isNew ? `${currentType.charAt(0)}${Date.now()}` : currentItem.id;
    const newItem = { ...formData, id: newId };

    if (currentType === "project") {
      setProjects(prev => isNew ? [...prev, newItem] : prev.map(p => p.id === newId ? newItem : p));
    } else if (currentType === "task") {
      setTasks(prev => isNew ? [...prev, newItem] : prev.map(t => t.id === newId ? newItem : t));
    } else if (currentType === "user") {
      setTeam(prev => isNew ? [...prev, newItem] : prev.map(u => u.id === newId ? newItem : u));
    }

    setIsEditOpen(false);
    toast({
      title: isNew ? "Item Created" : "Item Updated",
      description: "Changes have been applied to the demo data session.",
    });
  };

  const DataCard = ({ item, type, icon: Icon, badge, label }: any) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEdit(item, type)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const dup = { ...item, id: undefined, name: `${item.name || item.title} (Copy)`, title: `${item.name || item.title} (Copy)` };
                setCurrentType(type);
                setCurrentItem(null);
                setFormData(dup);
                setIsEditOpen(true);
              }}>
                <Copy className="mr-2 h-4 w-4" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(item.id, type)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardTitle className="text-lg mt-3 truncate pr-2">{item.name || item.title}</CardTitle>
        <CardDescription className="line-clamp-2 mt-1 h-10 text-xs">
          {item.description || item.email || "No description provided."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between pt-2 border-t text-sm text-muted-foreground">
          <div className="flex items-center gap-1 text-xs">
            {label}
          </div>
          {badge && (
            <Badge variant="secondary" className="font-normal text-xs">
              {badge}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Shell>
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-primary">Demo Data Management</h1>
              <p className="text-muted-foreground">Manage the mock data used throughout the application prototype.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                Session Only
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
             <div className="relative w-full sm:w-96">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search demo data..." 
                  className="pl-9 bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button className="gap-2" onClick={() => handleCreate(activeTab.slice(0, -1) as any)}>
                <Plus className="h-4 w-4" />
                Add {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(0, -1).slice(1)}
              </Button>
          </div>
        </div>

        <Tabs defaultValue="projects" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6 overflow-x-auto">
            <TabsTrigger 
              value="projects" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 flex items-center gap-2"
            >
              <Layout className="h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger 
              value="tasks" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 flex items-center gap-2"
            >
              <ListTodo className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="projects" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterData(projects).map(p => (
                  <DataCard 
                    key={p.id}
                    item={p}
                    type="project"
                    icon={Layout}
                    badge={p.status}
                    label={`Due: ${p.deadline}`}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterData(tasks).map(t => (
                  <DataCard 
                    key={t.id}
                    item={t}
                    type="task"
                    icon={ListTodo}
                    badge={t.priority}
                    label={t.status}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterData(team).map(u => (
                  <DataCard 
                    key={u.id}
                    item={u}
                    type="user"
                    icon={Users}
                    badge={u.status}
                    label={u.role}
                  />
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Edit/Create Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {currentItem ? 'Edit' : 'Create'} {currentType.charAt(0).toUpperCase() + currentType.slice(1)}
              </DialogTitle>
              <DialogDescription>
                Make changes to the demo data.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {currentType === "project" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PROJECT_STATUS_OPTIONS.map(s => (
                            <SelectItem key={s.id} value={s.label}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="deadline">Deadline</Label>
                      <Input id="deadline" value={formData.deadline} onChange={(e) => setFormData({...formData, deadline: e.target.value})} placeholder="e.g. Tomorrow" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="progress">Progress (%)</Label>
                    <Input type="number" id="progress" value={formData.progress} onChange={(e) => setFormData({...formData, progress: parseInt(e.target.value)})} />
                  </div>
                </>
              )}

              {currentType === "task" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="title">Task Title</Label>
                    <Input id="title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TASK_STATUS_OPTIONS.map(s => (
                            <SelectItem key={s.id} value={s.label}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={formData.priority} onValueChange={(v) => setFormData({...formData, priority: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {currentType === "user" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="role">Role Title</Label>
                      <Input id="role" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="status">Status</Label>
                       <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Online">Online</SelectItem>
                          <SelectItem value="Offline">Offline</SelectItem>
                          <SelectItem value="In Meeting">In Meeting</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Shell>
  );
}
