import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
  UserX,
  Link2,
  Unlink,
  Clock,
  RefreshCw,
  GitMerge,
  Filter,
  ListTodo,
  Calendar,
  AtSign,
  ChevronDown
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  useUserProfile,
  useLinkIdentity,
  useUnlinkIdentity,
  useAvailableSystems,
  useMergeUsers,
  type UseUsersOptions 
} from "@/features/user-management";
import type { UserPublic, CreateUserRequest, UpdateUserRequest } from "@shared/contracts/user-management";
import type { IdentityPublic, LinkIdentityRequest } from "@shared/contracts/user-identity";

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

const SearchInput = React.memo(function SearchInput({ 
  onSearch,
  externalValue = ""
}: { 
  onSearch: (val: string) => void;
  externalValue?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(externalValue);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (externalValue === "" && localValue !== "") {
      setLocalValue("");
    }
  }, [externalValue]);
  
  const debouncedSearch = useCallback((value: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      onSearch(value);
    }, 300);
  }, [onSearch]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedSearch(newValue);
  };

  const handleClear = () => {
    setLocalValue("");
    onSearch("");
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex-1 min-w-[200px] max-w-sm">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        placeholder="Search by name or email..."
        className="pl-9 h-9"
        value={localValue}
        onChange={handleChange}
        data-testid="input-search-users"
      />
      {localValue && (
        <button 
          onClick={handleClear}
          className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
});

function UserManagementContent({ embedded = false }: UserManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [hasEmailFilter, setHasEmailFilter] = useState<string>("");
  const [hasTasksFilter, setHasTasksFilter] = useState<string>("");
  const [emailDomainFilter, setEmailDomainFilter] = useState<string>("");
  const debouncedEmailDomain = useDebounce(emailDomainFilter, 300);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
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

  const [isIdentityDialogOpen, setIsIdentityDialogOpen] = useState(false);
  const [identityUserId, setIdentityUserId] = useState<string | null>(null);
  const [linkForm, setLinkForm] = useState<Partial<LinkIdentityRequest>>({
    systemId: "",
    externalUserId: "",
    externalUsername: "",
    externalEmail: "",
  });
  const [unlinkConfirm, setUnlinkConfirm] = useState<{ userId: string; identity: IdentityPublic } | null>(null);
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
  const [mergeSource, setMergeSource] = useState<UserPublic | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState<string>("");

  const queryOptions: UseUsersOptions = {
    search: searchQuery || undefined,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
    hasEmail: hasEmailFilter as "yes" | "no" | undefined || undefined,
    hasTasks: hasTasksFilter as "yes" | "no" | undefined || undefined,
    emailDomain: debouncedEmailDomain || undefined,
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
  const { data: systems = [] } = useAvailableSystems();
  const { data: profileData, refetch: refetchProfile } = useUserProfile(identityUserId || undefined);
  const linkIdentity = useLinkIdentity();
  const unlinkIdentity = useUnlinkIdentity();
  const mergeUsers = useMergeUsers();

  const users = usersData?.users || [];
  const total = usersData?.total || 0;
  const totalPages = usersData?.totalPages || 1;

  useEffect(() => {
    setPage(1);
  }, [searchQuery, roleFilter, statusFilter, hasEmailFilter, hasTasksFilter, debouncedEmailDomain]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, searchQuery, roleFilter, statusFilter, hasEmailFilter, hasTasksFilter, debouncedEmailDomain]);

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

  const handleOpenIdentities = (userId: string) => {
    setIdentityUserId(userId);
    setIsIdentityDialogOpen(true);
  };

  const handleLinkIdentity = async () => {
    if (!identityUserId || !linkForm.systemId || !linkForm.externalUserId) return;
    
    const selectedSystem = systems.find(s => s.id === linkForm.systemId);
    
    try {
      await linkIdentity.mutateAsync({
        userId: identityUserId,
        data: {
          systemId: linkForm.systemId,
          systemType: selectedSystem?.type,
          systemName: selectedSystem?.name,
          externalUserId: linkForm.externalUserId,
          externalUsername: linkForm.externalUsername || undefined,
          externalEmail: linkForm.externalEmail || undefined,
          identityType: "user",
          auth: {
            authType: "imported",
            provider: linkForm.systemId,
          },
        },
      });
      setLinkForm({ systemId: "", externalUserId: "", externalUsername: "", externalEmail: "" });
      refetchProfile();
      toast({ title: "Identity linked successfully" });
    } catch (error: any) {
      toast({ title: "Failed to link identity", description: error.message, variant: "destructive" });
    }
  };

  const handleUnlinkIdentity = async () => {
    if (!unlinkConfirm) return;
    try {
      await unlinkIdentity.mutateAsync({
        userId: unlinkConfirm.userId,
        identityId: unlinkConfirm.identity.id,
      });
      setUnlinkConfirm(null);
      refetchProfile();
      toast({ title: "Identity unlinked successfully" });
    } catch (error: any) {
      toast({ title: "Failed to unlink identity", description: error.message, variant: "destructive" });
    }
  };

  const handleOpenMerge = (user: UserPublic) => {
    setMergeSource(user);
    setMergeTargetId("");
    setIsMergeDialogOpen(true);
  };

  const handleMergeUsers = async () => {
    if (!mergeSource || !mergeTargetId) return;
    try {
      const result = await mergeUsers.mutateAsync({
        sourceUserId: mergeSource.id,
        targetUserId: mergeTargetId,
      });
      setIsMergeDialogOpen(false);
      setMergeSource(null);
      setMergeTargetId("");
      toast({ 
        title: "Users merged successfully", 
        description: `Moved ${result.identitiesMoved} identities to target user`
      });
    } catch (error: any) {
      toast({ title: "Failed to merge users", description: error.message, variant: "destructive" });
    }
  };

  const getSystemIcon = (systemId: string) => {
    const icons: Record<string, string> = {
      clickup: "🎯",
      jira: "🔷",
      asana: "🟠",
      monday: "📅",
      trello: "📋",
      google: "🔵",
      microsoft: "🟦",
      slack: "💬",
      github: "⚫",
      gitlab: "🦊",
    };
    return icons[systemId] || "🔗";
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
    setSearchQuery("");
    setRoleFilter("");
    setStatusFilter("");
    setHasEmailFilter("");
    setHasTasksFilter("");
    setEmailDomainFilter("");
    setPage(1);
  };

  const hasActiveFilters = searchQuery || roleFilter || statusFilter || hasEmailFilter || hasTasksFilter || emailDomainFilter;
  
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (roleFilter) count++;
    if (statusFilter) count++;
    if (hasEmailFilter) count++;
    if (hasTasksFilter) count++;
    if (emailDomainFilter) count++;
    return count;
  }, [roleFilter, statusFilter, hasEmailFilter, hasTasksFilter, emailDomainFilter]);

  const applyQuickFilter = (preset: string) => {
    clearFilters();
    switch (preset) {
      case "deactivation-candidates":
        setStatusFilter("Active");
        setHasTasksFilter("no");
        break;
      case "active-contributors":
        setStatusFilter("Active");
        setHasTasksFilter("yes");
        break;
      case "deactivated":
        setStatusFilter("Deactivated");
        break;
      case "no-email":
        setHasEmailFilter("no");
        break;
    }
  };
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
          <div className="p-3 border-b space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput 
                onSearch={setSearchQuery}
                externalValue={searchQuery}
              />
              
              <Select value={roleFilter || "all"} onValueChange={(v) => setRoleFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Deactivated">Deactivated</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Offline">Offline</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant={showAdvancedFilters ? "secondary" : "outline"} 
                size="sm" 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="h-9 gap-1.5"
              >
                <Filter className="h-3.5 w-3.5" />
                More Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-primary text-primary-foreground">
                    {activeFilterCount}
                  </Badge>
                )}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
              </Button>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-2">
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}

              <div className="flex-1" />

              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                {isFetching && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                <span className="font-medium text-foreground">{total.toLocaleString()}</span> users
              </div>
            </div>

            {showAdvancedFilters && (
              <div className="pt-3 border-t space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-medium text-muted-foreground mr-2">Quick Filters:</div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs gap-1"
                    onClick={() => applyQuickFilter("deactivation-candidates")}
                  >
                    <UserX className="h-3 w-3" />
                    Deactivation Candidates
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs gap-1"
                    onClick={() => applyQuickFilter("active-contributors")}
                  >
                    <ListTodo className="h-3 w-3" />
                    Active Contributors
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs gap-1"
                    onClick={() => applyQuickFilter("deactivated")}
                  >
                    <UserX className="h-3 w-3 text-red-500" />
                    Already Deactivated
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs gap-1"
                    onClick={() => applyQuickFilter("no-email")}
                  >
                    <Mail className="h-3 w-3" />
                    Missing Email
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Select value={hasTasksFilter || "all"} onValueChange={(v) => setHasTasksFilter(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-[140px] h-9">
                      <ListTodo className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      <SelectValue placeholder="Task Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any tasks</SelectItem>
                      <SelectItem value="yes">Has tasks</SelectItem>
                      <SelectItem value="no">No tasks</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={hasEmailFilter || "all"} onValueChange={(v) => setHasEmailFilter(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-[140px] h-9">
                      <Mail className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      <SelectValue placeholder="Email Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any email</SelectItem>
                      <SelectItem value="yes">Has email</SelectItem>
                      <SelectItem value="no">No email</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="relative">
                    <AtSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Filter by email domain..."
                      className="pl-9 h-9 w-[200px]"
                      value={emailDomainFilter}
                      onChange={(e) => setEmailDomainFilter(e.target.value)}
                    />
                    {emailDomainFilter && (
                      <button 
                        onClick={() => setEmailDomainFilter("")}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <span className="text-xs text-muted-foreground">Active filters:</span>
                {roleFilter && (
                  <Badge variant="secondary" className="gap-1 text-xs h-6">
                    Role: {roleFilter}
                    <button onClick={() => setRoleFilter("")} className="ml-0.5 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {statusFilter && (
                  <Badge variant="secondary" className="gap-1 text-xs h-6">
                    Status: {statusFilter}
                    <button onClick={() => setStatusFilter("")} className="ml-0.5 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {hasTasksFilter && (
                  <Badge variant="secondary" className="gap-1 text-xs h-6">
                    Tasks: {hasTasksFilter === "yes" ? "Has tasks" : "No tasks"}
                    <button onClick={() => setHasTasksFilter("")} className="ml-0.5 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {hasEmailFilter && (
                  <Badge variant="secondary" className="gap-1 text-xs h-6">
                    Email: {hasEmailFilter === "yes" ? "Has email" : "No email"}
                    <button onClick={() => setHasEmailFilter("")} className="ml-0.5 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {emailDomainFilter && (
                  <Badge variant="secondary" className="gap-1 text-xs h-6">
                    Domain: @{emailDomainFilter}
                    <button onClick={() => setEmailDomainFilter("")} className="ml-0.5 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}

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
                            <DropdownMenuItem onClick={() => handleOpenIdentities(user.id)}>
                              <Link2 className="h-4 w-4 mr-2" />
                              Manage Identities
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenMerge(user)}>
                              <GitMerge className="h-4 w-4 mr-2" />
                              Merge User
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

        <Dialog open={isIdentityDialogOpen} onOpenChange={(open) => { setIsIdentityDialogOpen(open); if (!open) setIdentityUserId(null); }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Manage Linked Identities
              </DialogTitle>
              <DialogDescription>
                View and manage external account connections for this user
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="identities" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="identities">Linked Accounts</TabsTrigger>
                <TabsTrigger value="link">Link New Account</TabsTrigger>
              </TabsList>
              
              <TabsContent value="identities" className="mt-4">
                <ScrollArea className="h-[300px] pr-4">
                  {profileData?.identities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Link2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No linked accounts</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {profileData?.identities.map((identity) => (
                        <div key={identity.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="text-xl">{getSystemIcon(identity.systemId)}</div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{identity.systemName || identity.systemId}</span>
                                {identity.workspaceId && (
                                  <span className="text-xs text-muted-foreground">({identity.workspaceId})</span>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {identity.externalUsername || identity.externalEmail || identity.externalUserId}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={identity.status === "active" ? "default" : "secondary"} className="text-xs">
                                  {identity.status}
                                </Badge>
                                {identity.syncStatus === "healthy" && (
                                  <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Synced
                                  </Badge>
                                )}
                                {identity.syncStatus === "stale" && (
                                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">
                                    <Clock className="w-3 h-3 mr-1" /> Stale
                                  </Badge>
                                )}
                                {identity.syncStatus === "error" && (
                                  <Badge variant="outline" className="text-xs text-red-600 border-red-600">
                                    <AlertCircle className="w-3 h-3 mr-1" /> Error
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          {(profileData?.identities.length || 0) > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setUnlinkConfirm({ userId: identityUserId!, identity })}
                            >
                              <Unlink className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="link" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label>System</Label>
                  <Select
                    value={linkForm.systemId}
                    onValueChange={(value) => setLinkForm({ ...linkForm, systemId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a system" />
                    </SelectTrigger>
                    <SelectContent>
                      {systems.map((system) => (
                        <SelectItem key={system.id} value={system.id}>
                          {getSystemIcon(system.id)} {system.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>External User ID</Label>
                  <Input
                    placeholder="User ID in the external system"
                    value={linkForm.externalUserId}
                    onChange={(e) => setLinkForm({ ...linkForm, externalUserId: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Username (optional)</Label>
                    <Input
                      placeholder="Username"
                      value={linkForm.externalUsername}
                      onChange={(e) => setLinkForm({ ...linkForm, externalUsername: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email (optional)</Label>
                    <Input
                      placeholder="Email"
                      value={linkForm.externalEmail}
                      onChange={(e) => setLinkForm({ ...linkForm, externalEmail: e.target.value })}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleLinkIdentity}
                  disabled={!linkForm.systemId || !linkForm.externalUserId || linkIdentity.isPending}
                  className="w-full"
                >
                  {linkIdentity.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Link Account
                </Button>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsIdentityDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isMergeDialogOpen} onOpenChange={setIsMergeDialogOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GitMerge className="h-5 w-5" />
                Merge Users
              </DialogTitle>
              <DialogDescription>
                Merge "{mergeSource?.name || mergeSource?.email}" into another user. All identities will be transferred.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                This action cannot be undone. The source user will be marked as merged.
              </div>
              <div className="space-y-2">
                <Label>Merge into user</Label>
                <Select value={mergeTargetId} onValueChange={setMergeTargetId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(u => u.id !== mergeSource?.id).map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name || u.email} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMergeDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleMergeUsers}
                disabled={!mergeTargetId || mergeUsers.isPending}
                variant="destructive"
              >
                {mergeUsers.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Merge Users
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!unlinkConfirm} onOpenChange={() => setUnlinkConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unlink Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to unlink the {unlinkConfirm?.identity.systemName || unlinkConfirm?.identity.systemId} account?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleUnlinkIdentity}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {unlinkIdentity.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Unlink
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
