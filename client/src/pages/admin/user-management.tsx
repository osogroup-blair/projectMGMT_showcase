import { useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Shell } from "@/components/layout/shell";
import { 
  Users, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Mail,
  Download,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  UserX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { 
  useUsers, 
  useCreateUser, 
  useUpdateUser, 
  useDeactivateUser,
  useBulkUpdateRole,
  useBulkDeactivate,
  type UseUsersOptions 
} from "@/features/user-management";
import type { UserPublic, CreateUserRequest, UpdateUserRequest } from "@shared/contracts/user-management";

interface UserManagementProps {
  embedded?: boolean;
}

interface ImportResults {
  created: number;
  updated: number;
  identitiesCreated: number;
  errors: { email: string; error: string }[];
}

type SortColumn = "name" | "email" | "systemRole" | "status" | "createdAt";
type SortOrder = "asc" | "desc";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function UserManagementContent({ embedded = false }: UserManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortBy, setSortBy] = useState<SortColumn>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserPublic | null>(null);
  const [formData, setFormData] = useState<Partial<CreateUserRequest & UpdateUserRequest>>({});
  
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryOptions: UseUsersOptions = {
    search: debouncedSearch || undefined,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
    page,
    pageSize,
    sortBy,
    sortOrder,
  };

  const { data: usersData, isLoading, error, isFetching } = useUsers(queryOptions);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deactivateUser = useDeactivateUser();
  const bulkUpdateRole = useBulkUpdateRole();
  const bulkDeactivate = useBulkDeactivate();

  const users = usersData?.users || [];
  const total = usersData?.total || 0;
  const totalPages = usersData?.totalPages || 1;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, debouncedSearch, roleFilter, statusFilter]);

  const handleSort = useCallback((column: SortColumn) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1);
  }, [sortBy]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(users.map(u => u.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [users]);

  const handleSelectOne = useCallback((id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleBulkRoleChange = async (role: string) => {
    try {
      await bulkUpdateRole.mutateAsync({ ids: Array.from(selectedIds), role });
      toast({ title: "Roles Updated", description: `Updated ${selectedIds.size} users to ${role}.` });
      setSelectedIds(new Set());
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleBulkDeactivate = async () => {
    try {
      await bulkDeactivate.mutateAsync(Array.from(selectedIds));
      toast({ title: "Users Deactivated", description: `Deactivated ${selectedIds.size} users.` });
      setSelectedIds(new Set());
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

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
      toast({ title: "User Deactivated", description: "User has been deactivated." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleImportClick = () => {
    setImportResults(null);
    setIsImportDialogOpen(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResults(null);

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      const response = await fetch('/api/users/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData),
        credentials: 'include',
      });

      const results = await response.json();
      
      if (!response.ok) {
        throw new Error(results.error || results.message || 'Import failed');
      }

      setImportResults(results);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ 
        title: "Import Complete", 
        description: `Created ${results.created} users, updated ${results.updated} users.` 
      });
    } catch (error: any) {
      toast({ 
        title: "Import Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getInitials = (user: UserPublic) => {
    const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '';
    return name.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (user: UserPublic) => {
    return user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
  };

  const clearFilters = () => {
    setSearchInput("");
    setRoleFilter("");
    setStatusFilter("");
    setPage(1);
  };

  const hasActiveFilters = searchInput || roleFilter || statusFilter;
  const allSelected = users.length > 0 && users.every(u => selectedIds.has(u.id));
  const someSelected = users.some(u => selectedIds.has(u.id)) && !allSelected;

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortBy !== column) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    return sortOrder === "asc" ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const Wrapper = embedded ? ({ children }: { children: React.ReactNode }) => <>{children}</> : Shell;

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
      <div className="space-y-4">
        {!embedded && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-primary">User Management</h1>
              <p className="text-muted-foreground text-sm">Manage system users, roles, and access permissions.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleImportClick} data-testid="button-import-users">
                <Upload className="h-3.5 w-3.5" />
                Import
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
              <Button size="sm" onClick={handleOpenAdd} className="gap-1.5" data-testid="button-add-user">
                <Plus className="h-3.5 w-3.5" />
                Add User
              </Button>
            </div>
          </div>
        )}

        <div className="bg-card border rounded-lg">
          <div className="p-3 border-b">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-9 h-9"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  data-testid="input-search-users"
                />
                {searchInput && (
                  <button 
                    onClick={() => setSearchInput("")}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All status</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Offline">Offline</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Deactivated">Deactivated</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-2">
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}

              <div className="flex-1" />

              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                {isFetching && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                <span className="font-medium text-foreground">{total.toLocaleString()}</span> users
              </div>
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                <span className="text-sm font-medium">{selectedIds.size} selected</span>
                <div className="flex gap-1.5">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">Change Role</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkRoleChange("admin")}>Set as Admin</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkRoleChange("manager")}>Set as Manager</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkRoleChange("member")}>Set as Member</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkRoleChange("viewer")}>Set as Viewer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive hover:text-destructive"
                    onClick={handleBulkDeactivate}
                  >
                    <UserX className="h-3.5 w-3.5 mr-1" />
                    Deactivate
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                    Clear selection
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10">
                    <Checkbox 
                      checked={allSelected} 
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                      className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
                    />
                  </TableHead>
                  <TableHead className="min-w-[250px]">
                    <button 
                      className="flex items-center hover:text-foreground transition-colors"
                      onClick={() => handleSort("name")}
                    >
                      User <SortIcon column="name" />
                    </button>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    <button 
                      className="flex items-center hover:text-foreground transition-colors"
                      onClick={() => handleSort("systemRole")}
                    >
                      Role <SortIcon column="systemRole" />
                    </button>
                  </TableHead>
                  <TableHead className="w-[100px]">
                    <button 
                      className="flex items-center hover:text-foreground transition-colors"
                      onClick={() => handleSort("status")}
                    >
                      Status <SortIcon column="status" />
                    </button>
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 w-4 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-8 w-48 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-5 w-16 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-5 w-14 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-6 w-6 bg-muted rounded animate-pulse" /></TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <Users className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-muted-foreground">
                        {hasActiveFilters ? "No users match your filters" : "No users found"}
                      </p>
                      {hasActiveFilters && (
                        <Button variant="link" onClick={clearFilters} className="mt-1">
                          Clear filters
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map(user => (
                    <TableRow 
                      key={user.id} 
                      data-testid={`row-user-${user.id}`}
                      className={selectedIds.has(user.id) ? "bg-muted/50" : ""}
                    >
                      <TableCell>
                        <Checkbox 
                          checked={selectedIds.has(user.id)}
                          onCheckedChange={(checked) => handleSelectOne(user.id, !!checked)}
                          aria-label={`Select ${getDisplayName(user)}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.profileImageUrl || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {getInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{getDisplayName(user)}</div>
                            <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              {user.email || "no-email"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs font-normal ${
                            user.systemRole === "admin" ? "bg-purple-100 text-purple-700" :
                            user.systemRole === "manager" ? "bg-blue-100 text-blue-700" :
                            "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {user.systemRole || "member"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs font-normal ${
                            user.status === "Online" || user.status === "Active" ? "bg-green-100 text-green-700" :
                            user.status === "Deactivated" ? "bg-red-100 text-red-700" :
                            "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {user.status || "Offline"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-user-actions-${user.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEdit(user)}>
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeactivate(user.id)}
                            >
                              Deactivate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between p-3 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows per page:</span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="w-[70px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground mr-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

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

        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Import Users</DialogTitle>
              <DialogDescription>
                Upload a JSON file to import users from external systems like ClickUp.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-import-file"
              />
              
              {!importResults ? (
                <div className="flex flex-col items-center gap-4 py-8 border-2 border-dashed rounded-lg">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Select a JSON file to import</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports user exports from ClickUp, Jira, and other systems
                    </p>
                  </div>
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    data-testid="button-select-import-file"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>Choose File</>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Import Complete</p>
                      <p className="text-sm text-green-700">
                        Created {importResults.created} users, updated {importResults.updated} users,
                        {importResults.identitiesCreated} identities created
                      </p>
                    </div>
                  </div>
                  
                  {importResults.errors.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {importResults.errors.length} Error(s)
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {importResults.errors.map((err, idx) => (
                          <div key={idx} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                            <span className="font-medium">{err.email}:</span> {err.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                {importResults ? "Close" : "Cancel"}
              </Button>
              {importResults && (
                <Button onClick={() => { setImportResults(null); }} data-testid="button-import-more">
                  Import More
                </Button>
              )}
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
