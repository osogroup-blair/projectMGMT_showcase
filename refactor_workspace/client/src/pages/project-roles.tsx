import { useState } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  ArrowLeft, 
  Shield, 
  Plus, 
  MoreHorizontal, 
  Search,
  Check,
  Briefcase,
  PenTool,
  Code,
  BarChart,
  Copy,
  Trash2,
  AlertCircle,
  Bug,
  Rocket,
  Users
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
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useRoute, Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  PROJECT_ROLES, 
  ROLE_TEMPLATES, 
  ProjectRole, 
  RoleTemplate 
} from "@/lib/mock-data";

const ROLE_TYPE_ICONS = {
  "Management": Briefcase,
  "Discovery": Search,
  "Design": PenTool,
  "Development": Code,
  "QA & Testing": Bug,
  "Launch": Rocket
};

const ROLE_TYPE_COLORS = {
  "Management": "text-purple-600 bg-purple-100 border-purple-200",
  "Discovery": "text-indigo-600 bg-indigo-100 border-indigo-200",
  "Design": "text-pink-600 bg-pink-100 border-pink-200",
  "Development": "text-blue-600 bg-blue-100 border-blue-200",
  "QA & Testing": "text-amber-600 bg-amber-100 border-amber-200",
  "Launch": "text-green-600 bg-green-100 border-green-200"
};

export default function ProjectRoles() {
  const [match, params] = useRoute("/projects/:projectId/roles");
  const projectId = params?.projectId || "1";
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleManageAssignments = (roleId: string) => {
    setLocation(`/projects/${projectId}/roles/${roleId}/assignments`);
  };

  const [roles, setRoles] = useState<ProjectRole[]>(PROJECT_ROLES);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<ProjectRole | null>(null);
  const [formData, setFormData] = useState<Partial<ProjectRole>>({});

  const handleOpenCreate = () => {
    setEditingRole(null);
    setFormData({
      name: "",
      description: "",
      roleType: "Development",
      isRequired: false,
      maxAssignees: 0, // 0 means unlimited
      permissions: []
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (role: ProjectRole) => {
    setEditingRole(role);
    setFormData({ ...role });
    setIsDialogOpen(true);
  };

  const handleCreateFromTemplate = (template: RoleTemplate) => {
    const newRole: ProjectRole = {
      id: `r_${Date.now()}`,
      name: template.name,
      description: template.description,
      roleType: template.defaultRoleType,
      isRequired: false,
      permissions: template.defaultPermissions
    };
    
    setRoles(prev => [...prev, newRole]);
    toast({
      title: "Role Created",
      description: `Created ${newRole.name} from template.`,
    });
  };

  const handleSave = () => {
    if (!formData.name || !formData.roleType) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (editingRole) {
      setRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, ...formData } as ProjectRole : r));
      toast({
        title: "Role Updated",
        description: "Role definitions saved successfully.",
      });
    } else {
      const newRole: ProjectRole = {
        id: `r_${Date.now()}`,
        ...formData as any
      };
      setRoles(prev => [...prev, newRole]);
      toast({
        title: "Role Created",
        description: "New role added to project.",
      });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setRoles(prev => prev.filter(r => r.id !== id));
    toast({
      title: "Role Deleted",
      description: "Role removed from project.",
      variant: "destructive"
    });
  };

  return (
    <Shell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href={`/projects/${projectId}/team`} className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Team
            </Link>
            <span className="text-border">|</span>
            <span>Role Definitions</span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-primary">Project Role Definitions</h1>
              <p className="text-muted-foreground">Define and manage the roles available for this project.</p>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Copy className="h-4 w-4" />
                    From Template
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {ROLE_TEMPLATES.map(template => (
                    <DropdownMenuItem 
                      key={template.id}
                      onClick={() => handleCreateFromTemplate(template)}
                    >
                      {template.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleOpenCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Role
              </Button>
            </div>
          </div>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map(role => {
            const Icon = ROLE_TYPE_ICONS[role.roleType] || Briefcase;

            return (
              <Card key={role.id} className="group relative overflow-hidden transition-all hover:shadow-md">
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{role.name}</CardTitle>
                        {role.isRequired && (
                          <Badge variant="secondary" className="text-amber-600 bg-amber-50 border-amber-200 text-[10px] px-1.5 h-5 gap-1">
                            Required
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{role.description}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleManageAssignments(role.id)}>
                          <Users className="mr-2 h-4 w-4" />
                          Manage Assignments
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEdit(role)}>
                          Edit Definition
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDelete(role.id)}
                        >
                          Delete Role
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={cn("gap-1.5 pl-1.5", ROLE_TYPE_COLORS[role.roleType] || "bg-muted")}>
                      <Icon className="h-3 w-3" />
                      {role.roleType}
                    </Badge>
                    {role.maxAssignees ? (
                      <Badge variant="outline" className="text-muted-foreground font-normal">
                        Max {role.maxAssignees} Assignees
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground font-normal">
                        Unlimited Assignees
                      </Badge>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Permissions</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {role.permissions.map(perm => (
                        <span key={perm} className="text-xs px-2 py-1 bg-muted rounded-md text-muted-foreground font-mono">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Create/Edit Role Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingRole ? "Edit Role Definition" : "Create New Role"}</DialogTitle>
              <DialogDescription>
                Define role responsibilities, constraints, and permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Role Name</Label>
                <Input 
                  id="name" 
                  value={formData.name || ""} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Solution Architect"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  value={formData.description || ""} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of responsibilities..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Role Type</Label>
                  <Select 
                    value={formData.roleType} 
                    onValueChange={(v: any) => setFormData({ ...formData, roleType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Management">Management</SelectItem>
                      <SelectItem value="Discovery">Discovery</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="QA & Testing">QA & Testing</SelectItem>
                      <SelectItem value="Launch">Launch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="maxAssignees">Max Assignees (0 for unlimited)</Label>
                  <Input 
                    id="maxAssignees" 
                    type="number"
                    min="0"
                    value={formData.maxAssignees || 0}
                    onChange={(e) => setFormData({ ...formData, maxAssignees: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label className="text-base">Required Role</Label>
                  <p className="text-xs text-muted-foreground">
                    This role must be filled for the project to be active.
                  </p>
                </div>
                <Switch 
                  checked={formData.isRequired || false}
                  onCheckedChange={(c) => setFormData({ ...formData, isRequired: c })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="permissions">Permissions (comma separated)</Label>
                <Input 
                  id="permissions" 
                  value={formData.permissions?.join(", ") || ""} 
                  onChange={(e) => setFormData({ ...formData, permissions: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                  placeholder="manage_project, approve_budget, etc."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editingRole ? "Save Changes" : "Create Role"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Shell>
  );
}
