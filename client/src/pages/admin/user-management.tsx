import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
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
  AlertDialogTrigger,
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
  useBulkActivate,
  useBulkDelete,
  useDeletionPreflight,
  useArchiveUser,
  useTransferOwnership,
  usePermanentDelete,
  useBulkDeletionPreflight,
  useBulkDeleteWithPreflight,
  useUserProfile,
  useLinkIdentity,
  useUnlinkIdentity,
  useAvailableSystems,
  useMergeUsers,
  type UseUsersOptions,
  type DeletionPreflightResponse,
  type BulkPreflightResponse,
  type BulkDeleteResult,
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
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserPublic | null>(null);
  const [permissionsDialogUser, setPermissionsDialogUser] = useState<UserPublic | null>(null);
  const [preflightUser, setPreflightUser] = useState<UserPublic | null>(null);
  const [preflightData, setPreflightData] = useState<DeletionPreflightResponse | null>(null);
  const [transferTargetId, setTransferTargetId] = useState<string>("");
  const [bulkPreflightData, setBulkPreflightData] = useState<BulkPreflightResponse | null>(null);
  const [bulkDeleteResult, setBulkDeleteResult] = useState<BulkDeleteResult | null>(null);

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
  const bulkActivate = useBulkActivate();
  const bulkDelete = useBulkDelete();
  const deletionPreflight = useDeletionPreflight();
  const archiveUser = useArchiveUser();
  const transferOwnership = useTransferOwnership();
  const permanentDelete = usePermanentDelete();
  const bulkDeletionPreflight = useBulkDeletionPreflight();
  const bulkDeleteWithPreflight = useBulkDeleteWithPreflight();
  const { data: systems = [] } = useAvailableSystems();
  const { data: systemRoles = [] } = useQuery<{ id: string; name: string; displayName: string; description: string }[]>({
    queryKey: ["/api/roles-permissions/roles"],
    queryFn: async () => {
      const res = await fetch("/api/roles-permissions/roles", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch roles");
      return res.json();
    },
  });

  const roleOptions = useMemo(() => {
    if (systemRoles.length > 0) {
      return systemRoles.map(role => ({
        value: role.name,
        label: role.displayName,
      }));
    }
    return [
      { value: "admin", label: "Admin" },
      { value: "manager", label: "Manager" },
      { value: "member", label: "Member" },
      { value: "viewer", label: "Viewer" },
      { value: "demo", label: "Demo" },
    ];
  }, [systemRoles]);
  const { data: allPermissions = [] } = useQuery<{ id: string; key: string; displayName: string; category: string }[]>({
    queryKey: ["/api/roles-permissions/permissions"],
    queryFn: async () => {
      const res = await fetch("/api/roles-permissions/permissions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch permissions");
      return res.json();
    },
  });
  const { data: effectivePermsData } = useQuery<{ permissions: { key: string; displayName: string; source: "role" | "individual" }[] }>({
    queryKey: ["/api/roles-permissions/user", permissionsDialogUser?.id, "effective"],
    queryFn: async () => {
      if (!permissionsDialogUser?.id) return { permissions: [] };
      const res = await fetch(`/api/roles-permissions/user/${permissionsDialogUser.id}/effective`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch effective permissions");
      return res.json();
    },
    enabled: !!permissionsDialogUser,
  });
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

  const handleBulkActivate = async () => {
    try {
      await bulkActivate.mutateAsync(Array.from(selectedIds));
      toast({ title: "Users Activated", description: `Activated ${selectedIds.size} users.` });
      setSelectedIds(new Set());
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleOpenBulkPreflight = async () => {
    try {
      const data = await bulkDeletionPreflight.mutateAsync(Array.from(selectedIds));
      setBulkPreflightData(data);
      setBulkDeleteResult(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleBulkDelete = async (mode: "archive" | "delete") => {
    if (!bulkPreflightData) return;
    try {
      const ids = bulkPreflightData.users.map(u => u.id);
      const result = await bulkDeleteWithPreflight.mutateAsync({ ids, mode });
      setBulkDeleteResult(result);
      
      const msgs: string[] = [];
      if (result.deleted.length > 0) msgs.push(`${result.deleted.length} deleted`);
      if (result.archived.length > 0) msgs.push(`${result.archived.length} archived`);
      if (result.failed.length > 0) msgs.push(`${result.failed.length} failed`);
      
      toast({ 
        title: "Bulk Delete Complete", 
        description: msgs.join(", "),
        variant: result.failed.length > 0 ? "destructive" : "default"
      });
      
      if (result.failed.length === 0) {
        setBulkPreflightData(null);
        setSelectedIds(new Set());
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleCloseBulkPreflight = () => {
    setBulkPreflightData(null);
    setBulkDeleteResult(null);
    setSelectedIds(new Set());
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      jobTitle: "",
      systemRole: "member",
      permissions: []
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (user: UserPublic) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      jobTitle: user.jobTitle || "",
      systemRole: (user.systemRole as any) || "member",
      permissions: (user as any).permissions || []
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
            systemRole: formData.systemRole as any,
            permissions: formData.permissions as string[]
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
          systemRole: (formData.systemRole as any) || "member",
          permissions: formData.permissions as string[]
        });
        toast({ title: "User Created", description: "New user added to the system." });
        setIsDialogOpen(false);
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    }
  };

  const togglePermission = (permKey: string) => {
    const current = formData.permissions || [];
    const newPerms = current.includes(permKey)
      ? current.filter(p => p !== permKey)
      : [...current, permKey];
    setFormData({ ...formData, permissions: newPerms });
  };

  const permissionsByCategory = useMemo(() => {
    const grouped: Record<string, typeof allPermissions> = {};
    for (const perm of allPermissions) {
      if (!grouped[perm.category]) {
        grouped[perm.category] = [];
      }
      grouped[perm.category].push(perm);
    }
    return grouped;
  }, [allPermissions]);

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateUser.mutateAsync(id);
      toast({ title: "User Deactivated", description: "User has been deactivated." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    try {
      await bulkDelete.mutateAsync([deleteConfirmUser.id]);
      toast({ title: "User Deleted", description: `${deleteConfirmUser.name || deleteConfirmUser.email} has been permanently deleted.` });
      setDeleteConfirmUser(null);
      setSelectedIds(new Set());
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleOpenPreflight = async (user: UserPublic) => {
    try {
      const data = await deletionPreflight.mutateAsync(user.id);
      setPreflightUser(user);
      setPreflightData(data);
      setTransferTargetId("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleArchiveUser = async () => {
    if (!preflightUser) return;
    try {
      await archiveUser.mutateAsync(preflightUser.id);
      toast({ title: "User Archived", description: `${preflightUser.name || preflightUser.email} has been archived.` });
      setPreflightUser(null);
      setPreflightData(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleTransferAll = async () => {
    if (!preflightUser || !preflightData || !transferTargetId) return;
    const { blockers } = preflightData;
    
    try {
      if (blockers.ownedProjects.length > 0) {
        await transferOwnership.mutateAsync({
          userId: preflightUser.id,
          targetUserId: transferTargetId,
          entityType: "projects",
          entityIds: blockers.ownedProjects.map(p => p.id),
        });
      }
      if (blockers.ownedDeliverables.length > 0) {
        await transferOwnership.mutateAsync({
          userId: preflightUser.id,
          targetUserId: transferTargetId,
          entityType: "deliverables",
          entityIds: blockers.ownedDeliverables.map(d => d.id),
        });
      }
      if (blockers.ownedEpics.length > 0) {
        await transferOwnership.mutateAsync({
          userId: preflightUser.id,
          targetUserId: transferTargetId,
          entityType: "epics",
          entityIds: blockers.ownedEpics.map(e => e.id),
        });
      }
      if (blockers.ownedMilestones.length > 0) {
        await transferOwnership.mutateAsync({
          userId: preflightUser.id,
          targetUserId: transferTargetId,
          entityType: "milestones",
          entityIds: blockers.ownedMilestones.map(m => m.id),
        });
      }
      if (blockers.ownedSprints.length > 0) {
        await transferOwnership.mutateAsync({
          userId: preflightUser.id,
          targetUserId: transferTargetId,
          entityType: "sprints",
          entityIds: blockers.ownedSprints.map(s => s.id),
        });
      }
      
      toast({ title: "Ownership Transferred", description: "All owned entities have been transferred to the new owner." });
      const newData = await deletionPreflight.mutateAsync(preflightUser.id);
      setPreflightData(newData);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handlePermanentDelete = async () => {
    if (!preflightUser) return;
    try {
      const freshPreflight = await deletionPreflight.mutateAsync(preflightUser.id);
      setPreflightData(freshPreflight);
      
      if (!freshPreflight.canDelete) {
        toast({ 
          title: "Cannot Delete", 
          description: "There are still blocking dependencies. Please transfer ownership first.",
          variant: "destructive" 
        });
        return;
      }
      
      await permanentDelete.mutateAsync(preflightUser.id);
      toast({ title: "User Deleted", description: `${preflightUser.name || preflightUser.email} has been permanently deleted.` });
      setPreflightUser(null);
      setPreflightData(null);
    } catch (error: any) {
      const freshPreflight = await deletionPreflight.mutateAsync(preflightUser.id).catch(() => null);
      if (freshPreflight) setPreflightData(freshPreflight);
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

  const handleExport = async () => {
    try {
      const response = await fetch('/api/users/export', {
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      const exportData = await response.json();
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.download = `users-export-${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ 
        title: "Export Complete", 
        description: `Exported ${exportData.Users?.length || 0} users to file.` 
      });
    } catch (error: any) {
      toast({ 
        title: "Export Failed", 
        description: error.message, 
        variant: "destructive" 
      });
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
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport} data-testid="button-export-users">
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <UserX className="h-3.5 w-3.5 mr-1" />
                        Status
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={handleBulkActivate}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                        Activate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleBulkDeactivate} className="text-destructive">
                        <UserX className="h-3.5 w-3.5 mr-1.5" />
                        Deactivate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleOpenBulkPreflight}
                    disabled={bulkDeletionPreflight.isPending}
                    data-testid="button-bulk-delete"
                  >
                    {bulkDeletionPreflight.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <X className="h-3.5 w-3.5 mr-1" />
                    )}
                    Delete
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
                            <DropdownMenuItem onClick={() => setPermissionsDialogUser(user)}>
                              View Permissions
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
                              className="text-amber-600"
                              onClick={() => handleDeactivate(user.id)}
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleOpenPreflight(user)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Delete Permanently
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
                  value={formData.systemRole || ""}
                  onValueChange={(v) => setFormData({ ...formData, systemRole: v as any })}
                  placeholder="Select role"
                  options={roleOptions}
                  data-testid="select-user-role"
                />
              </div>
              <div className="grid gap-2">
                <Label>Additional Permissions</Label>
                <p className="text-xs text-muted-foreground">
                  Grant extra permissions beyond the user's role
                </p>
                <ScrollArea className="h-48 border rounded-md p-3">
                  {Object.entries(permissionsByCategory).map(([category, perms]) => (
                    <div key={category} className="mb-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">{category}</p>
                      <div className="space-y-1">
                        {perms.map(perm => (
                          <div key={perm.key} className="flex items-center gap-2">
                            <Checkbox
                              id={`perm-${perm.key}`}
                              checked={(formData.permissions || []).includes(perm.key)}
                              onCheckedChange={() => togglePermission(perm.key)}
                              data-testid={`checkbox-permission-${perm.key}`}
                            />
                            <label htmlFor={`perm-${perm.key}`} className="text-sm cursor-pointer">
                              {perm.displayName}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </ScrollArea>
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

        <Dialog open={!!permissionsDialogUser} onOpenChange={() => setPermissionsDialogUser(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Effective Permissions</DialogTitle>
              <DialogDescription>
                Permissions for {permissionsDialogUser?.name || permissionsDialogUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium">Role:</span>
                <Badge variant="secondary">{permissionsDialogUser?.systemRole || "member"}</Badge>
              </div>
              <ScrollArea className="h-64 border rounded-md p-3">
                {effectivePermsData?.permissions && effectivePermsData.permissions.length > 0 ? (
                  <div className="space-y-2">
                    {effectivePermsData.permissions.map(perm => (
                      <div key={perm.key} className="flex items-center justify-between py-1">
                        <span className="text-sm">{perm.displayName}</span>
                        <Badge variant={perm.source === "role" ? "secondary" : "default"} className="text-xs">
                          {perm.source === "role" ? "From Role" : "Individual"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No permissions assigned
                  </div>
                )}
              </ScrollArea>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPermissionsDialogUser(null)}>Close</Button>
              <Button onClick={() => {
                setPermissionsDialogUser(null);
                if (permissionsDialogUser) handleOpenEdit(permissionsDialogUser);
              }}>
                Edit Permissions
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

        <AlertDialog open={!!deleteConfirmUser} onOpenChange={() => setDeleteConfirmUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User Permanently</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete <strong>{deleteConfirmUser?.name || deleteConfirmUser?.email}</strong>? 
                This action cannot be undone and will remove all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {bulkDelete.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={!!preflightUser} onOpenChange={() => { setPreflightUser(null); setPreflightData(null); }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="dialog-deletion-preflight">
            <DialogHeader>
              <DialogTitle>Delete User: {preflightUser?.name || preflightUser?.email}</DialogTitle>
              <DialogDescription>
                Review the dependencies below before deleting this user.
              </DialogDescription>
            </DialogHeader>

            {deletionPreflight.isPending ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : preflightData ? (
              <div className="space-y-6">
                {preflightData.blockers.isLastAdmin && (
                  <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
                    <div className="flex items-center gap-2 text-destructive font-medium mb-2">
                      <AlertCircle className="w-5 h-5" />
                      Cannot Delete: Last Admin
                    </div>
                    <p className="text-sm text-muted-foreground">
                      This user is the last administrator. Promote another user to admin before deleting.
                    </p>
                  </div>
                )}

                {!preflightData.canDelete && !preflightData.blockers.isLastAdmin && (
                  <div className="space-y-4">
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium mb-2">
                        <AlertCircle className="w-5 h-5" />
                        Ownership Transfer Required
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        This user owns entities that must be transferred before deletion.
                      </p>

                      <div className="space-y-3">
                        {preflightData.blockers.ownedProjects.length > 0 && (
                          <div>
                            <span className="text-sm font-medium">Projects ({preflightData.blockers.ownedProjects.length}):</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {preflightData.blockers.ownedProjects.map(p => (
                                <Badge key={p.id} variant="secondary" className="text-xs">{p.name}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {preflightData.blockers.ownedDeliverables.length > 0 && (
                          <div>
                            <span className="text-sm font-medium">Deliverables ({preflightData.blockers.ownedDeliverables.length}):</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {preflightData.blockers.ownedDeliverables.slice(0, 10).map(d => (
                                <Badge key={d.id} variant="secondary" className="text-xs">{d.name}</Badge>
                              ))}
                              {preflightData.blockers.ownedDeliverables.length > 10 && (
                                <Badge variant="outline" className="text-xs">+{preflightData.blockers.ownedDeliverables.length - 10} more</Badge>
                              )}
                            </div>
                          </div>
                        )}
                        {preflightData.blockers.ownedEpics.length > 0 && (
                          <div>
                            <span className="text-sm font-medium">Epics ({preflightData.blockers.ownedEpics.length}):</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {preflightData.blockers.ownedEpics.slice(0, 10).map(e => (
                                <Badge key={e.id} variant="secondary" className="text-xs">{e.name}</Badge>
                              ))}
                              {preflightData.blockers.ownedEpics.length > 10 && (
                                <Badge variant="outline" className="text-xs">+{preflightData.blockers.ownedEpics.length - 10} more</Badge>
                              )}
                            </div>
                          </div>
                        )}
                        {preflightData.blockers.ownedMilestones.length > 0 && (
                          <div>
                            <span className="text-sm font-medium">Milestones ({preflightData.blockers.ownedMilestones.length}):</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {preflightData.blockers.ownedMilestones.slice(0, 10).map(m => (
                                <Badge key={m.id} variant="secondary" className="text-xs">{m.name}</Badge>
                              ))}
                              {preflightData.blockers.ownedMilestones.length > 10 && (
                                <Badge variant="outline" className="text-xs">+{preflightData.blockers.ownedMilestones.length - 10} more</Badge>
                              )}
                            </div>
                          </div>
                        )}
                        {preflightData.blockers.ownedSprints.length > 0 && (
                          <div>
                            <span className="text-sm font-medium">Sprints ({preflightData.blockers.ownedSprints.length}):</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {preflightData.blockers.ownedSprints.slice(0, 10).map(s => (
                                <Badge key={s.id} variant="secondary" className="text-xs">{s.name}</Badge>
                              ))}
                              {preflightData.blockers.ownedSprints.length > 10 && (
                                <Badge variant="outline" className="text-xs">+{preflightData.blockers.ownedSprints.length - 10} more</Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <Label className="text-sm font-medium">Transfer all ownership to:</Label>
                        <div className="flex gap-2 mt-2">
                          <Select value={transferTargetId} onValueChange={setTransferTargetId}>
                            <SelectTrigger className="flex-1" data-testid="select-transfer-target">
                              <SelectValue placeholder="Select a user..." />
                            </SelectTrigger>
                            <SelectContent>
                              {users.filter(u => u.id !== preflightUser?.id && u.status === "Active").map(u => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.name || u.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={handleTransferAll}
                            disabled={!transferTargetId || transferOwnership.isPending}
                            data-testid="button-transfer-ownership"
                          >
                            {transferOwnership.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Transfer All
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(preflightData.warnings.assignedTasks > 0 || 
                  preflightData.warnings.comments > 0 || 
                  preflightData.warnings.identities > 0 ||
                  preflightData.warnings.roleAssignments > 0 ||
                  preflightData.warnings.sprintMemberships > 0) && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="text-sm font-medium mb-2">Data that will be affected:</div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      {preflightData.warnings.assignedTasks > 0 && (
                        <div>Task assignments: {preflightData.warnings.assignedTasks} (will be unassigned)</div>
                      )}
                      {preflightData.warnings.comments > 0 && (
                        <div>Comments: {preflightData.warnings.comments} (will be deleted)</div>
                      )}
                      {preflightData.warnings.identities > 0 && (
                        <div>Linked identities: {preflightData.warnings.identities} (will be removed)</div>
                      )}
                      {preflightData.warnings.roleAssignments > 0 && (
                        <div>Role assignments: {preflightData.warnings.roleAssignments} (will be removed)</div>
                      )}
                      {preflightData.warnings.sprintMemberships > 0 && (
                        <div>Sprint memberships: {preflightData.warnings.sprintMemberships} (will be removed)</div>
                      )}
                    </div>
                  </div>
                )}

                {preflightData.canDelete && (
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium">
                      <CheckCircle2 className="w-5 h-5" />
                      Ready to Delete
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      All blocking dependencies have been resolved. You can now permanently delete this user.
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => { setPreflightUser(null); setPreflightData(null); }}>
                Cancel
              </Button>
              <Button 
                variant="secondary"
                onClick={handleArchiveUser}
                disabled={archiveUser.isPending}
                data-testid="button-archive-user"
              >
                {archiveUser.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Archive Instead
              </Button>
              <Button 
                variant="destructive"
                onClick={handlePermanentDelete}
                disabled={!preflightData?.canDelete || permanentDelete.isPending}
                data-testid="button-permanent-delete"
              >
                {permanentDelete.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Delete Permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!bulkPreflightData} onOpenChange={() => handleCloseBulkPreflight()}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" data-testid="dialog-bulk-deletion-preflight">
            <DialogHeader>
              <DialogTitle>Delete {bulkPreflightData?.users.length || 0} Users</DialogTitle>
              <DialogDescription>
                Review the dependencies for each selected user before proceeding.
              </DialogDescription>
            </DialogHeader>

            {bulkDeleteResult ? (
              <div className="space-y-4">
                <div className="text-lg font-medium">Delete Results</div>
                
                {bulkDeleteResult.deleted.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium mb-2">
                      <CheckCircle2 className="w-5 h-5" />
                      {bulkDeleteResult.deleted.length} Users Permanently Deleted
                    </div>
                  </div>
                )}

                {bulkDeleteResult.archived.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium mb-2">
                      <AlertCircle className="w-5 h-5" />
                      {bulkDeleteResult.archived.length} Users Archived (had blockers)
                    </div>
                    <p className="text-sm text-muted-foreground">
                      These users owned entities that couldn't be automatically transferred.
                    </p>
                  </div>
                )}

                {bulkDeleteResult.failed.length > 0 && (
                  <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
                    <div className="flex items-center gap-2 text-destructive font-medium mb-2">
                      <X className="w-5 h-5" />
                      {bulkDeleteResult.failed.length} Users Failed
                    </div>
                    <div className="text-sm space-y-1">
                      {bulkDeleteResult.failed.map(f => (
                        <div key={f.id} className="text-muted-foreground">
                          {f.id}: {f.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : bulkPreflightData ? (
              <div className="space-y-4">
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-3">
                    {bulkPreflightData.users.map(user => {
                      const hasBlockers = !user.canDelete;
                      const blockerCount = 
                        user.blockers.ownedProjects.length +
                        user.blockers.ownedDeliverables.length +
                        user.blockers.ownedEpics.length +
                        user.blockers.ownedMilestones.length +
                        user.blockers.ownedSprints.length;
                      
                      return (
                        <div 
                          key={user.id}
                          className={`p-3 rounded-lg border ${
                            user.blockers.isLastAdmin 
                              ? "bg-destructive/10 border-destructive" 
                              : hasBlockers 
                                ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                                : "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{user.name}</div>
                            <div className="flex items-center gap-2">
                              {user.blockers.isLastAdmin ? (
                                <Badge variant="destructive">Last Admin</Badge>
                              ) : hasBlockers ? (
                                <Badge variant="outline" className="text-amber-700 border-amber-300">
                                  {blockerCount} owned entities
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-green-700 border-green-300">
                                  Ready to delete
                                </Badge>
                              )}
                            </div>
                          </div>
                          {hasBlockers && !user.blockers.isLastAdmin && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              {user.blockers.ownedProjects.length > 0 && `${user.blockers.ownedProjects.length} projects, `}
                              {user.blockers.ownedDeliverables.length > 0 && `${user.blockers.ownedDeliverables.length} deliverables, `}
                              {user.blockers.ownedEpics.length > 0 && `${user.blockers.ownedEpics.length} epics, `}
                              {user.blockers.ownedMilestones.length > 0 && `${user.blockers.ownedMilestones.length} milestones, `}
                              {user.blockers.ownedSprints.length > 0 && `${user.blockers.ownedSprints.length} sprints`}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-sm font-medium mb-2">Summary</div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-green-600 font-medium">
                        {bulkPreflightData.users.filter(u => u.canDelete).length}
                      </span>{" "}
                      ready to delete
                    </div>
                    <div>
                      <span className="text-amber-600 font-medium">
                        {bulkPreflightData.users.filter(u => !u.canDelete && !u.blockers.isLastAdmin).length}
                      </span>{" "}
                      will be archived
                    </div>
                    <div>
                      <span className="text-destructive font-medium">
                        {bulkPreflightData.users.filter(u => u.blockers.isLastAdmin).length}
                      </span>{" "}
                      cannot be deleted
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleCloseBulkPreflight}>
                {bulkDeleteResult ? "Close" : "Cancel"}
              </Button>
              {!bulkDeleteResult && (
                <>
                  <Button 
                    variant="secondary"
                    onClick={() => handleBulkDelete("archive")}
                    disabled={bulkDeleteWithPreflight.isPending}
                    data-testid="button-bulk-archive"
                  >
                    {bulkDeleteWithPreflight.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Delete & Archive Blocked
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => handleBulkDelete("delete")}
                    disabled={bulkDeleteWithPreflight.isPending || bulkPreflightData?.users.every(u => !u.canDelete)}
                    data-testid="button-bulk-delete-only"
                  >
                    {bulkDeleteWithPreflight.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Delete Ready Only
                  </Button>
                </>
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
