import { useState } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  Users, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Shield, 
  Mail,
  Filter,
  Download
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
import { TEAM, TeamMember } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

interface UserManagementProps {
  embedded?: boolean;
}

export default function UserManagement({ embedded = false }: UserManagementProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<TeamMember[]>(TEAM);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TeamMember | null>(null);
  
  // Mock form state
  const [formData, setFormData] = useState<Partial<TeamMember>>({});

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      role: "Member",
      status: "Offline"
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (user: TeamMember) => {
    setEditingUser(user);
    setFormData({ ...user });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      toast({
        title: "Validation Error",
        description: "Name and email are required.",
        variant: "destructive"
      });
      return;
    }

    if (editingUser) {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...formData } as TeamMember : u));
      toast({
        title: "User Updated",
        description: "User details saved successfully.",
      });
    } else {
      const newUser: TeamMember = {
        id: `u_${Date.now()}`,
        status: "Offline",
        ...formData as any
      };
      setUsers(prev => [...prev, newUser]);
      toast({
        title: "User Created",
        description: "New user added to the system.",
      });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    toast({
      title: "User Deleted",
      description: "User removed from the system.",
      variant: "destructive"
    });
  };

  const Wrapper = embedded ? ({ children }: { children: React.ReactNode }) => <>{children}</> : Shell;

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
            <Button onClick={handleOpenAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>System Users</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                  <TableHead>Status</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{user.name}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email || "no-email@example.com"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={
                          user.status === "Online" ? "bg-green-100 text-green-700 hover:bg-green-100" :
                          user.status === "In Meeting" ? "bg-amber-100 text-amber-700 hover:bg-amber-100" :
                          "bg-slate-100 text-slate-700 hover:bg-slate-100"
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">Product</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEdit(user)}>
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem>Reset Password</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDelete(user.id)}
                          >
                            Deactivate User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
              <DialogDescription>
                Enter user details and assign initial role permissions.
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
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={formData.email || ""} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@nexus.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Primary Role</Label>
                <SearchableSelect
                  value={formData.role}
                  onValueChange={(v) => setFormData({ ...formData, role: v })}
                  placeholder="Select role"
                  options={[
                    { value: "Product Manager", label: "Product Manager" },
                    { value: "Project Manager", label: "Project Manager" },
                    { value: "UX Designer", label: "UX Designer" },
                    { value: "Senior Developer", label: "Senior Developer" },
                    { value: "CEO", label: "CEO" },
                  ]}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editingUser ? "Save Changes" : "Create User"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Wrapper>
  );
}
