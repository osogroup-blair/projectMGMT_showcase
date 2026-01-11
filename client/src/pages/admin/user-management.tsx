import { useState } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  Users, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Mail,
  Filter,
  Download,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/hooks/use-toast";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useUsers, useCreateUser, useUpdateUser, useDeactivateUser } from "@/features/user-management";
import type { UserPublic, CreateUserRequest, UpdateUserRequest } from "@shared/contracts/user-management";

interface UserManagementProps {
  embedded?: boolean;
}

function UserManagementContent({ embedded = false }: UserManagementProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserPublic | null>(null);
  const [formData, setFormData] = useState<Partial<CreateUserRequest & UpdateUserRequest>>({});

  const { data: usersData, isLoading, error } = useUsers({ search: searchQuery });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deactivateUser = useDeactivateUser();

  const users = usersData?.users || [];

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      jobTitle: "",
      systemRole: "member"
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (user: UserPublic) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      jobTitle: user.jobTitle || "",
      systemRole: (user.systemRole as any) || "member"
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingUser) {
      try {
        await updateUser.mutateAsync({
          id: editingUser.id,
          data: {
            name: formData.name,
            jobTitle: formData.jobTitle,
            systemRole: formData.systemRole as any
          }
        });
        toast({ title: "User Updated", description: "User details saved successfully." });
        setIsDialogOpen(false);
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      if (!formData.name || !formData.email) {
        toast({ title: "Validation Error", description: "Name and email are required.", variant: "destructive" });
        return;
      }
      try {
        await createUser.mutateAsync({
          name: formData.name!,
          email: formData.email!,
          jobTitle: formData.jobTitle,
          systemRole: (formData.systemRole as any) || "member"
        });
        toast({ title: "User Created", description: "New user added to the system." });
        setIsDialogOpen(false);
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateUser.mutateAsync(id);
      toast({ title: "User Deactivated", description: "User has been deactivated.", variant: "destructive" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getInitials = (user: UserPublic) => {
    const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '';
    return name.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (user: UserPublic) => {
    return user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
  };

  const Wrapper = embedded ? ({ children }: { children: React.ReactNode }) => <>{children}</> : Shell;

  if (isLoading) {
    return (
      <Wrapper>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Wrapper>
    );
  }

  if (error) {
    return (
      <Wrapper>
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">Failed to load users: {(error as Error).message}</p>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            {!embedded && (
              <>
                <h1 className="text-2xl font-bold tracking-tight text-primary">User Management</h1>
                <p className="text-muted-foreground">Manage system users, roles, and access permissions.</p>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button onClick={handleOpenAdd} className="gap-2" data-testid="button-add-user">
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>System Users ({usersData?.total || 0})</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search-users"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>System Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.profileImageUrl || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{getDisplayName(user)}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email || "no-email@example.com"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {user.jobTitle || "Team Member"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={
                          user.systemRole === "admin" ? "bg-purple-100 text-purple-700 hover:bg-purple-100" :
                          user.systemRole === "manager" ? "bg-blue-100 text-blue-700 hover:bg-blue-100" :
                          "bg-slate-100 text-slate-700 hover:bg-slate-100"
                        }
                      >
                        {user.systemRole || "member"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={
                          user.status === "Online" ? "bg-green-100 text-green-700 hover:bg-green-100" :
                          user.status === "Deactivated" ? "bg-red-100 text-red-700 hover:bg-red-100" :
                          "bg-slate-100 text-slate-700 hover:bg-slate-100"
                        }
                      >
                        {user.status || "Offline"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-user-actions-${user.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEdit(user)}>
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeactivate(user.id)}
                          >
                            Deactivate User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
              <DialogDescription>
                {editingUser ? "Update user details and role." : "Enter user details and assign initial role."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={formData.name || ""} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  data-testid="input-user-name"
                />
              </div>
              {!editingUser && (
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={formData.email || ""} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@company.com"
                    data-testid="input-user-email"
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input 
                  id="jobTitle" 
                  value={formData.jobTitle || ""} 
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  placeholder="Project Manager"
                  data-testid="input-user-job-title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="systemRole">System Role</Label>
                <SearchableSelect
                  value={formData.systemRole}
                  onValueChange={(v) => setFormData({ ...formData, systemRole: v as any })}
                  placeholder="Select role"
                  options={[
                    { value: "admin", label: "Admin" },
                    { value: "manager", label: "Manager" },
                    { value: "member", label: "Member" },
                    { value: "viewer", label: "Viewer" },
                  ]}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleSave} 
                disabled={createUser.isPending || updateUser.isPending}
                data-testid="button-save-user"
              >
                {(createUser.isPending || updateUser.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingUser ? "Save Changes" : "Create User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Wrapper>
  );
}

export default function UserManagement(props: UserManagementProps) {
  return (
    <AuthGuard requiredRoles={["admin", "manager"]}>
      <UserManagementContent {...props} />
    </AuthGuard>
  );
}
