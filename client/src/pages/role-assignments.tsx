import { useState, useMemo } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  ArrowLeft, 
  Users, 
  Check, 
  Trash2, 
  Plus, 
  Crown, 
  AlertCircle, 
  Briefcase,
  Search,
  PenTool,
  Code,
  Bug,
  Rocket,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useRoute, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  PROJECT_ROLES, 
  ROLE_ASSIGNMENTS, 
  TEAM, 
  TeamMember,
  ProjectRole,
  RoleAssignment 
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
  "Management": "text-purple-600 bg-purple-100",
  "Discovery": "text-indigo-600 bg-indigo-100",
  "Design": "text-pink-600 bg-pink-100",
  "Development": "text-blue-600 bg-blue-100",
  "QA & Testing": "text-amber-600 bg-amber-100",
  "Launch": "text-green-600 bg-green-100"
};

export default function RoleAssignments() {
  const [match, params] = useRoute("/projects/:projectId/roles/:roleId/assignments");
  const projectId = params?.projectId || "1";
  const roleId = params?.roleId || "";
  const { toast } = useToast();

  // Mock Data State
  const role = PROJECT_ROLES.find(r => r.id === roleId);
  const [assignments, setAssignments] = useState<RoleAssignment[]>(
    ROLE_ASSIGNMENTS.filter(ra => ra.roleId === roleId)
  );
  
  // UI State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<RoleAssignment | null>(null);
  const [formData, setFormData] = useState<Partial<RoleAssignment>>({});

  // Derived State
  const availableUsers = useMemo(() => {
    const assignedUserIds = new Set(assignments.map(a => a.userId));
    if (editingAssignment) {
      // Include current user when editing
      assignedUserIds.delete(editingAssignment.userId);
    }
    return TEAM.filter(user => !assignedUserIds.has(user.id));
  }, [assignments, editingAssignment]);

  if (!role) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Role Not Found</h1>
          <p className="text-muted-foreground">The requested role does not exist.</p>
          <Link href={`/projects/${projectId}/roles`}>
            <Button variant="outline">Back to Roles</Button>
          </Link>
        </div>
      </Shell>
    );
  }

  const handleOpenAdd = () => {
    setEditingAssignment(null);
    setFormData({
      isPrimary: false,
      allocationPercent: 100,
      userId: ""
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (assignment: RoleAssignment) => {
    setEditingAssignment(assignment);
    setFormData({ ...assignment });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.userId) {
      toast({
        title: "Validation Error",
        description: "Please select a team member.",
        variant: "destructive"
      });
      return;
    }

    if (editingAssignment) {
      setAssignments(prev => prev.map(a => 
        a.id === editingAssignment.id ? { ...a, ...formData } as RoleAssignment : a
      ));
      toast({
        title: "Assignment Updated",
        description: "Team member allocation updated successfully.",
      });
    } else {
      if (role.maxAssignees && assignments.length >= role.maxAssignees) {
        toast({
          title: "Limit Reached",
          description: `This role allows a maximum of ${role.maxAssignees} assignees.`,
          variant: "destructive"
        });
        return;
      }

      const newAssignment: RoleAssignment = {
        id: `ra_${Date.now()}`,
        roleId: role.id,
        ...formData as any
      };
      setAssignments(prev => [...prev, newAssignment]);
      toast({
        title: "Team Member Assigned",
        description: "New member added to this role.",
      });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
    toast({
      title: "Assignment Removed",
      description: "Team member removed from this role.",
      variant: "destructive"
    });
  };

  const Icon = ROLE_TYPE_ICONS[role.roleType] || Briefcase;

  return (
    <Shell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href={`/projects/${projectId}/roles`} className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Roles
            </Link>
            <span className="text-border">|</span>
            <span>Role Assignments</span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-start gap-4">
              <div className={cn("p-3 rounded-lg border bg-background", ROLE_TYPE_COLORS[role.roleType])}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                  {role.name}
                  {role.isRequired && (
                    <Badge variant="secondary" className="text-amber-600 bg-amber-50 border-amber-200 text-[10px] px-1.5 h-5 gap-1 font-normal">
                      Required
                    </Badge>
                  )}
                </h1>
                <p className="text-muted-foreground">{role.description}</p>
              </div>
            </div>
            <Button onClick={handleOpenAdd} className="gap-2" disabled={role.maxAssignees ? assignments.length >= role.maxAssignees : false}>
              <Plus className="h-4 w-4" />
              Add Assignment
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Assigned</CardDescription>
              <CardTitle className="text-2xl font-bold">
                {assignments.length}
                {role.maxAssignees && (
                  <span className="text-muted-foreground text-sm font-normal ml-1">
                    / {role.maxAssignees} max
                  </span>
                )}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Primary Leads</CardDescription>
              <CardTitle className="text-2xl font-bold">
                {assignments.filter(a => a.isPrimary).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg. Allocation</CardDescription>
              <CardTitle className="text-2xl font-bold">
                {assignments.length > 0 
                  ? Math.round(assignments.reduce((acc, curr) => acc + curr.allocationPercent, 0) / assignments.length)
                  : 0}%
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Assignments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Assigned Team Members</CardTitle>
            <CardDescription>Manage who is fulfilling this role and their capacity.</CardDescription>
          </CardHeader>
          <CardContent>
            {assignments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Member</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Allocation</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map(assignment => {
                    const user = TEAM.find(u => u.id === assignment.userId);
                    if (!user) return null;

                    return (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{user.name}</span>
                              <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {assignment.isPrimary ? (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 gap-1 pl-1">
                              <Crown className="h-3 w-3 fill-yellow-800" />
                              Primary Lead
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">Contributor</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${assignment.allocationPercent}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{assignment.allocationPercent}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEdit(assignment)}>
                                Edit Assignment
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(assignment.id)}>
                                Remove Assignment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <h3 className="font-medium text-muted-foreground">No assignments yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Assign team members to fulfill this role.</p>
                <Button variant="outline" size="sm" onClick={handleOpenAdd}>Assign Member</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit/Add Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingAssignment ? "Edit Assignment" : "Assign Team Member"}</DialogTitle>
              <DialogDescription>
                Configure allocation and responsibilities for this role assignment.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="user">Team Member</Label>
                <SearchableSelect 
                  value={formData.userId || ""} 
                  onValueChange={(v) => setFormData({ ...formData, userId: v })}
                  disabled={!!editingAssignment}
                  placeholder="Select a team member"
                  options={[
                    ...(editingAssignment ? [{ value: editingAssignment.userId, label: TEAM.find(u => u.id === editingAssignment.userId)?.name || "" }] : []),
                    ...availableUsers.map(user => ({ value: user.id, label: user.name }))
                  ]}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    Primary Lead
                    <Crown className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Main point of contact for this role.
                  </p>
                </div>
                <Switch 
                  checked={formData.isPrimary || false}
                  onCheckedChange={(c) => setFormData({ ...formData, isPrimary: c })}
                />
              </div>

              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <Label>Allocation Percentage</Label>
                  <span className="text-sm font-medium">{formData.allocationPercent}%</span>
                </div>
                <Slider 
                  value={[formData.allocationPercent || 0]} 
                  min={0} 
                  max={100} 
                  step={5}
                  onValueChange={([v]) => setFormData({ ...formData, allocationPercent: v })}
                />
                <p className="text-xs text-muted-foreground">
                  Percentage of time this member dedicates to this specific role.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>
                {editingAssignment ? "Save Changes" : "Assign Member"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Shell>
  );
}
