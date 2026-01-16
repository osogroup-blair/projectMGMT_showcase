import { 
  Project
} from "@/lib/mock-data";
import { useUsers, useTasks } from "@/hooks/use-nexus-data";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/context/current-user-context";
import { 
  Search, 
  Filter, 
  Plus, 
  Upload, 
  MoreHorizontal, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  AlertTriangle,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pencil,
  Trash2,
  X,
  Workflow,
  Loader2,
  Star,
  FolderKanban
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Shell } from "@/components/layout/shell";
import { Link } from "wouter";
import { useState, useMemo, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
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
  owner: string;
  ownerId?: string;
  startDate: string;
  endDate: string;
  riskLevel: "Low" | "Medium" | "High";
  description?: string;
}

export default function ProjectsList() {
  const { toast } = useToast();
  const { data: usersData } = useUsers();
  const { data: tasksData } = useTasks();
  const { currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  // Filters State (moved up for use in query)
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [filterFavorites, setFilterFavorites] = useState<boolean>(false);
  const [filterRole, setFilterRole] = useState<string>("my");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // Sorting State
  type SortField = "name" | "client" | "status" | "owner" | "startDate" | "riskLevel" | "progress" | "teamSize";
  type SortDirection = "asc" | "desc";
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterStatus, filterRisk, filterFavorites, filterRole, sortField, sortDirection]);
  
  // Paginated projects query with server-side filtering
  const { 
    data: paginatedData, 
    isLoading 
  } = useQuery({
    queryKey: [
      'projects-paginated', 
      page, 
      pageSize, 
      debouncedSearch, 
      filterStatus, 
      filterRisk, 
      filterRole, 
      filterFavorites, 
      sortField, 
      sortDirection,
      currentUser?.id
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('limit', pageSize.toString());
      params.set('offset', ((page - 1) * pageSize).toString());
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterRisk !== 'all') params.set('riskLevel', filterRisk);
      if (filterRole !== 'all') params.set('role', filterRole);
      if (filterFavorites) params.set('favoriteOnly', 'true');
      if (currentUser?.id) params.set('userId', currentUser.id);
      if (sortField !== 'teamSize' && sortField !== 'owner') {
        params.set('sortField', sortField);
        params.set('sortDirection', sortDirection);
      }
      
      const res = await fetch(`/api/projects/paginated?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json() as Promise<{ data: any[]; total: number; limit: number; offset: number }>;
    },
    enabled: !!currentUser?.id,
  });
  
  const projectsData = paginatedData?.data || [];
  const totalProjects = paginatedData?.total || 0;
  const totalPages = Math.ceil(totalProjects / pageSize);
  
  // Project mutations
  const createProjectMutation = useMutation({
    mutationFn: async (project: any) => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      if (!res.ok) throw new Error('Failed to create project');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-paginated'] });
    },
  });
  
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update project');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-paginated'] });
    },
  });
  
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete project');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-paginated'] });
    },
  });
  
  const createProject = (project: any) => createProjectMutation.mutate(project);
  const updateProject = (params: { id: string; updates: any }) => updateProjectMutation.mutate(params);
  const deleteProject = (id: string) => deleteProjectMutation.mutate(id);
  
  // Favorites
  const { data: favorites = [] } = useQuery<{ projectId: string }[]>({
    queryKey: ['favorites', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const res = await fetch(`/api/favorites?userId=${currentUser.id}`);
      if (!res.ok) throw new Error('Failed to fetch favorites');
      return res.json();
    },
    enabled: !!currentUser?.id,
  });

  const favoriteProjectIds = useMemo(() => 
    new Set(favorites.map(f => f.projectId)), 
    [favorites]
  );

  const addFavorite = useMutation({
    mutationFn: async (projectId: string) => {
      const res = await fetch(`/api/favorites/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id }),
      });
      if (!res.ok) throw new Error('Failed to add favorite');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['favoriteProjects', currentUser?.id] });
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async (projectId: string) => {
      const res = await fetch(`/api/favorites/${projectId}?userId=${currentUser?.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove favorite');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['favoriteProjects', currentUser?.id] });
    },
  });

  const toggleFavorite = (projectId: string) => {
    if (favoriteProjectIds.has(projectId)) {
      removeFavorite.mutate(projectId);
    } else {
      addFavorite.mutate(projectId);
    }
  };

  // All project team memberships for team size calculation
  const { data: allMemberships = [] } = useQuery<{ id: string; projectId: string; userId: string }[]>({
    queryKey: ['allProjectMemberships'],
    queryFn: async () => {
      const res = await fetch('/api/projectTeamMembers');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const teamSizeByProject = useMemo(() => {
    const usersByProject: Record<string, Set<string>> = {};
    allMemberships.forEach(m => {
      if (!usersByProject[m.projectId]) {
        usersByProject[m.projectId] = new Set();
      }
      usersByProject[m.projectId].add(m.userId);
    });
    const counts: Record<string, number> = {};
    Object.entries(usersByProject).forEach(([projectId, users]) => {
      counts[projectId] = users.size;
    });
    return counts;
  }, [allMemberships]);

  // User's project memberships for filtering
  const { data: userMemberships = [] } = useQuery<{ projectId: string; highLevelRoles: string[] }[]>({
    queryKey: ['userProjectMemberships', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const res = await fetch(`/api/users/${currentUser.id}/project-memberships`);
      if (!res.ok) throw new Error('Failed to fetch memberships');
      return res.json();
    },
    enabled: !!currentUser?.id,
  });

  // Create lookup maps for user's roles per project
  const userProjectRoles = useMemo(() => {
    const map: Record<string, string[]> = {};
    userMemberships.forEach(m => {
      map[m.projectId] = m.highLevelRoles || [];
    });
    return map;
  }, [userMemberships]);

  const userProjectIds = useMemo(() => new Set(userMemberships.map(m => m.projectId)), [userMemberships]);

  // Selection State for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Dialog & Form State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<ExtendedProject | null>(null);
  
  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string | number>("");
  
  const [formData, setFormData] = useState<Partial<ExtendedProject>>({
    name: "",
    client: "",
    status: "Upcoming",
    ownerId: "",
    startDate: "",
    endDate: "",
    riskLevel: "Low",
    description: "",
    progress: 0,
    frameworkId: ""
  });

  // Helper to get user name by id
  const getUserName = (userId?: string) => {
    if (!userId || !usersData) return "—";
    const user = usersData.find((u: any) => u.id === userId);
    return user?.name || "—";
  };

  // Task count by project
  const taskCountByProject = useMemo(() => {
    const counts: Record<string, number> = {};
    (tasksData || []).forEach((task: any) => {
      if (task.projectId) {
        counts[task.projectId] = (counts[task.projectId] || 0) + 1;
      }
    });
    return counts;
  }, [tasksData]);

  // Enrich Data Memo
  const projects = useMemo(() => {
    return projectsData.map((p: any) => ({
      ...p,
      client: p.client || "—",
      owner: getUserName(p.ownerId),
      ownerId: p.ownerId,
      startDate: p.startDate || "",
      endDate: p.deadline || "",
      riskLevel: p.riskLevel || "Low",
      description: p.description || ""
    })) as ExtendedProject[];
  }, [projectsData, usersData]);

  // Server handles filtering - only apply client-side sorting for owner/teamSize columns
  const filteredProjects = useMemo(() => {
    let result = [...projects];
    
    // Client-side sorting only for fields the server can't sort (owner name, teamSize)
    if (sortField === 'owner' || sortField === 'teamSize') {
      result.sort((a, b) => {
        let aVal: string | number = "";
        let bVal: string | number = "";
        
        if (sortField === "owner") {
          aVal = a.owner.toLowerCase();
          bVal = b.owner.toLowerCase();
        } else if (sortField === "teamSize") {
          aVal = teamSizeByProject[a.id] || 0;
          bVal = teamSizeByProject[b.id] || 0;
        }
        
        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [projects, sortField, sortDirection, teamSizeByProject]);

  // Toggle sort for a column
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProjects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProjects.map(p => p.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(selectedIds);
    for (const id of idsToDelete) {
      await deleteProject(id);
    }
    setSelectedIds(new Set());
    setIsBulkDeleteOpen(false);
    toast({
      title: "Projects Deleted",
      description: `Successfully deleted ${idsToDelete.length} project(s).`,
    });
  };

  // Sortable column header component
  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button 
      variant="ghost" 
      size="sm" 
      className="-ml-3 h-8 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      onClick={() => toggleSort(field)}
      data-testid={`sort-${field}`}
    >
      {children}
      {sortField === field ? (
        sortDirection === "asc" ? (
          <ArrowUp className="ml-2 h-3 w-3" />
        ) : (
          <ArrowDown className="ml-2 h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
      )}
    </Button>
  );

  // CRUD Handlers
  const handleCreate = () => {
    const newProject = {
      name: formData.name || "New Project",
      status: formData.status || "Upcoming",
      deadline: formData.endDate || "TBD",
      progress: formData.progress || 0,
      frameworkId: formData.frameworkId,
      client: formData.client || "",
      ownerId: formData.ownerId || undefined,
      startDate: formData.startDate || new Date().toISOString().split('T')[0],
      riskLevel: formData.riskLevel || "Low",
      description: formData.description || "",
    };

    createProject(newProject);
    setIsCreateOpen(false);
    resetForm();
  };


  const handleDelete = () => {
    if (!currentProject) return;

    deleteProject(currentProject.id);
    setIsDeleteOpen(false);
    setCurrentProject(null);
  };



  const openDeleteDialog = (project: ExtendedProject) => {
    setCurrentProject(project);
    setIsDeleteOpen(true);
  };

  // Inline editing handlers
  const startInlineEdit = (projectId: string, field: string, currentValue: string | number) => {
    setEditingId(projectId);
    setEditingField(field);
    setEditingValue(currentValue);
  };

  const cancelInlineEdit = () => {
    setEditingId(null);
    setEditingField(null);
    setEditingValue("");
  };

  const saveInlineEdit = (projectId: string) => {
    if (editingField) {
      updateProject({
        id: projectId,
        updates: { [editingField]: editingValue }
      });
      toast({
        title: "Updated",
        description: `Project ${editingField} has been updated.`,
      });
    }
    cancelInlineEdit();
  };

  const handleInlineKeyDown = (e: React.KeyboardEvent, projectId: string) => {
    if (e.key === "Enter") {
      saveInlineEdit(projectId);
    } else if (e.key === "Escape") {
      cancelInlineEdit();
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      client: "",
      status: "Upcoming",
      ownerId: "",
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
            <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
              <FolderKanban className="h-6 w-6 text-primary/70 shrink-0" />
              Projects List
            </h1>
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

        {/* View Toggle & Filters */}
        <div className="flex flex-col gap-4">
          {/* Primary Toggle - My Projects vs All Projects */}
          <div className="flex items-center justify-between bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            <button
              onClick={() => setFilterRole("my")}
              className={cn(
                "flex-1 py-3 px-6 text-sm font-medium transition-colors text-center",
                filterRole !== "all" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              data-testid="toggle-my-projects"
            >
              My Projects
            </button>
            <div className="w-px h-8 bg-border" />
            <button
              onClick={() => setFilterRole("all")}
              className={cn(
                "flex-1 py-3 px-6 text-sm font-medium transition-colors text-center",
                filterRole === "all" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              data-testid="toggle-all-projects"
            >
              All Projects
            </button>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border border-border shadow-sm">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search projects..." 
                className="pl-9 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-projects"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <SearchableSelect 
                value={filterStatus} 
                onValueChange={setFilterStatus}
                className="w-[140px]"
                placeholder="Status"
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "In Progress", label: "In Progress" },
                  { value: "Upcoming", label: "Upcoming" },
                  { value: "Completed", label: "Completed" },
                  { value: "On Hold", label: "On Hold" },
                  { value: "Overdue", label: "Overdue" }
                ]}
                data-testid="filter-status"
              />

              <SearchableSelect 
                value={filterRisk} 
                onValueChange={setFilterRisk}
                className="w-[140px]"
                placeholder="Risk Level"
                options={[
                  { value: "all", label: "All Risks" },
                  { value: "Low", label: "Low Risk" },
                  { value: "Medium", label: "Medium Risk" },
                  { value: "High", label: "High Risk" }
                ]}
                data-testid="filter-risk"
              />

              {filterRole !== "all" && (
                <SearchableSelect 
                  value={filterRole} 
                  onValueChange={setFilterRole}
                  className="w-[150px]"
                  placeholder="My Role"
                  options={[
                    { value: "my", label: "All My Roles" },
                    { value: "owner", label: "As Owner" },
                    { value: "stakeholder", label: "As Stakeholder" },
                    { value: "member", label: "As Member" }
                  ]}
                  data-testid="filter-role"
                />
              )}

              <Button
                variant={filterFavorites ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterFavorites(!filterFavorites)}
                className="gap-2"
                data-testid="filter-favorites-toggle"
              >
                <Star className={cn("h-3.5 w-3.5", filterFavorites && "fill-current")} />
                Favorites
              </Button>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedIds.size === filteredProjects.length}
                onCheckedChange={toggleSelectAll}
                data-testid="checkbox-select-all-bar"
              />
              <span className="text-sm font-medium">
                {selectedIds.size} project{selectedIds.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
                data-testid="button-clear-selection"
              >
                Clear Selection
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsBulkDeleteOpen(true)}
                data-testid="button-bulk-delete"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="rounded-md border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={filteredProjects.length > 0 && selectedIds.size === filteredProjects.length}
                    onCheckedChange={toggleSelectAll}
                    data-testid="checkbox-select-all"
                  />
                </TableHead>
                <TableHead className="w-[250px]">
                  <SortableHeader field="name">Project Name</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader field="client">Client</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader field="status">Status</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader field="owner">Owner</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader field="startDate">Timeline</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader field="riskLevel">Risk</SortableHeader>
                </TableHead>
                <TableHead className="w-[100px]">
                  <SortableHeader field="progress">Progress</SortableHeader>
                </TableHead>
                <TableHead className="w-[80px]">
                  <SortableHeader field="teamSize">Team</SortableHeader>
                </TableHead>
                <TableHead className="w-[80px]">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tasks</span>
                </TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project.id} className={cn("group hover:bg-muted/20", selectedIds.has(project.id) && "bg-primary/5")}>
                  {/* Checkbox */}
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(project.id)}
                      onCheckedChange={() => toggleSelectOne(project.id)}
                      data-testid={`checkbox-project-${project.id}`}
                    />
                  </TableCell>
                  {/* Inline Editable Name */}
                  <TableCell className="font-medium">
                    {editingId === project.id && editingField === "name" ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={editingValue as string}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => handleInlineKeyDown(e, project.id)}
                          onBlur={() => saveInlineEdit(project.id)}
                          className="h-7 text-sm"
                          autoFocus
                          data-testid={`input-inline-name-${project.id}`}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite(project.id);
                          }}
                          data-testid={`button-favorite-${project.id}`}
                        >
                          <Star className={cn(
                            "h-4 w-4 transition-colors",
                            favoriteProjectIds.has(project.id) 
                              ? "fill-yellow-400 text-yellow-400" 
                              : "text-muted-foreground hover:text-yellow-400"
                          )} />
                        </Button>
                        <Link href={`/projects/${project.id}`} className="hover:underline text-primary">
                          {project.name}
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.preventDefault();
                            startInlineEdit(project.id, "name", project.name);
                          }}
                          data-testid={`button-inline-edit-name-${project.id}`}
                        >
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  {/* Inline Editable Client */}
                  <TableCell>
                    {editingId === project.id && editingField === "client" ? (
                      <Input
                        value={editingValue as string}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={(e) => handleInlineKeyDown(e, project.id)}
                        onBlur={() => saveInlineEdit(project.id)}
                        className="h-7 text-sm w-32"
                        autoFocus
                        placeholder="Client name"
                        data-testid={`input-inline-client-${project.id}`}
                      />
                    ) : (
                      <span 
                        className="text-muted-foreground cursor-pointer hover:text-foreground hover:underline"
                        onClick={() => startInlineEdit(project.id, "client", project.client || "")}
                        data-testid={`text-client-${project.id}`}
                      >
                        {project.client || "—"}
                      </span>
                    )}
                  </TableCell>
                  {/* Inline Editable Status */}
                  <TableCell>
                    {editingId === project.id && editingField === "status" ? (
                      <SearchableSelect 
                        value={editingValue as string} 
                        onValueChange={(val) => {
                          setEditingValue(val);
                          updateProject({ id: project.id, updates: { status: val } });
                          toast({ title: "Updated", description: "Project status has been updated." });
                          cancelInlineEdit();
                        }}
                        className="h-7 w-[120px] text-xs"
                        data-testid={`select-inline-status-${project.id}`}
                        options={[
                          { value: "Upcoming", label: "Upcoming" },
                          { value: "In Progress", label: "In Progress" },
                          { value: "On Hold", label: "On Hold" },
                          { value: "Completed", label: "Completed" }
                        ]}
                      />
                    ) : (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "font-normal border-0 px-2 py-0.5 rounded-full text-xs cursor-pointer hover:ring-2 hover:ring-primary/20",
                          project.status === 'In Progress' && "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
                          project.status === 'Upcoming' && "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300",
                          project.status === 'Overdue' && "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300",
                          project.status === 'Completed' && "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300",
                          project.status === 'On Hold' && "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        )}
                        onClick={() => startInlineEdit(project.id, "status", project.status)}
                        data-testid={`badge-status-${project.id}`}
                      >
                        {project.status}
                      </Badge>
                    )}
                  </TableCell>
                  {/* Inline Editable Owner */}
                  <TableCell>
                    {editingId === project.id && editingField === "ownerId" ? (
                      <SearchableSelect
                        value={editingValue as string}
                        onValueChange={(val) => {
                          setEditingValue(val);
                          updateProject({ id: project.id, updates: { ownerId: val || null } });
                          toast({ title: "Updated", description: "Project owner has been updated." });
                          cancelInlineEdit();
                        }}
                        className="h-7 w-[140px] text-xs"
                        placeholder="Select owner"
                        options={[
                          { value: "", label: "No owner" },
                          ...(usersData || []).map((u: any) => ({ value: u.id, label: u.name }))
                        ]}
                        data-testid={`select-inline-owner-${project.id}`}
                      />
                    ) : (
                      <span 
                        className="text-sm text-muted-foreground cursor-pointer hover:text-foreground hover:underline"
                        onClick={() => startInlineEdit(project.id, "ownerId", project.ownerId || "")}
                        data-testid={`text-owner-${project.id}`}
                      >
                        {project.owner || '—'}
                      </span>
                    )}
                  </TableCell>
                  {/* Inline Editable Timeline */}
                  <TableCell>
                    {editingId === project.id && editingField === "startDate" ? (
                      <div className="flex flex-col gap-1">
                        <Input
                          type="date"
                          value={editingValue as string}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => handleInlineKeyDown(e, project.id)}
                          onBlur={() => saveInlineEdit(project.id)}
                          className="h-7 text-xs w-32"
                          autoFocus
                          data-testid={`input-inline-startDate-${project.id}`}
                        />
                      </div>
                    ) : editingId === project.id && editingField === "deadline" ? (
                      <div className="flex flex-col gap-1">
                        <Input
                          type="date"
                          value={editingValue as string}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => handleInlineKeyDown(e, project.id)}
                          onBlur={() => saveInlineEdit(project.id)}
                          className="h-7 text-xs w-32"
                          autoFocus
                          data-testid={`input-inline-deadline-${project.id}`}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col text-xs text-muted-foreground">
                        <span 
                          className="flex items-center gap-1 cursor-pointer hover:text-foreground"
                          onClick={() => startInlineEdit(project.id, "startDate", project.startDate || "")}
                          data-testid={`text-startDate-${project.id}`}
                        >
                          <Calendar className="h-3 w-3" />
                          {project.startDate || "Set start"}
                        </span>
                        <span 
                          className="cursor-pointer hover:text-foreground"
                          onClick={() => startInlineEdit(project.id, "deadline", project.endDate || "")}
                          data-testid={`text-endDate-${project.id}`}
                        >
                          to {project.endDate || "Set end"}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  {/* Inline Editable Risk */}
                  <TableCell>
                    {editingId === project.id && editingField === "riskLevel" ? (
                      <SearchableSelect
                        value={editingValue as string}
                        onValueChange={(val) => {
                          setEditingValue(val);
                          updateProject({ id: project.id, updates: { riskLevel: val } });
                          toast({ title: "Updated", description: "Project risk level has been updated." });
                          cancelInlineEdit();
                        }}
                        className="h-7 w-[100px] text-xs"
                        options={[
                          { value: "Low", label: "Low" },
                          { value: "Medium", label: "Medium" },
                          { value: "High", label: "High" }
                        ]}
                        data-testid={`select-inline-risk-${project.id}`}
                      />
                    ) : (
                      <div 
                        className={cn(
                          "flex items-center gap-1.5 text-xs font-medium cursor-pointer hover:opacity-70",
                          project.riskLevel === "High" ? "text-red-600" :
                          project.riskLevel === "Medium" ? "text-amber-600" : "text-green-600"
                        )}
                        onClick={() => startInlineEdit(project.id, "riskLevel", project.riskLevel || "Low")}
                        data-testid={`text-risk-${project.id}`}
                      >
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          project.riskLevel === "High" ? "bg-red-500" :
                          project.riskLevel === "Medium" ? "bg-amber-500" : "bg-green-500"
                        )} />
                        {project.riskLevel}
                      </div>
                    )}
                  </TableCell>
                  {/* Inline Editable Progress */}
                  <TableCell>
                    {editingId === project.id && editingField === "progress" ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={editingValue}
                          onChange={(e) => setEditingValue(parseInt(e.target.value) || 0)}
                          onKeyDown={(e) => handleInlineKeyDown(e, project.id)}
                          onBlur={() => saveInlineEdit(project.id)}
                          className="h-7 w-16 text-xs"
                          autoFocus
                          data-testid={`input-inline-progress-${project.id}`}
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    ) : (
                      <div 
                        className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1"
                        onClick={() => startInlineEdit(project.id, "progress", project.progress || 0)}
                        data-testid={`progress-${project.id}`}
                      >
                        <Progress value={project.progress || 0} className="h-1.5 w-16" />
                        <span className="text-xs text-muted-foreground">{project.progress || 0}%</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/projects/${project.id}?tab=team&subTab=member`}>
                      <div className="flex items-center gap-1.5 text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                        <UserIcon className="h-3.5 w-3.5" />
                        <span className="text-sm font-medium">{teamSizeByProject[project.id] || 0}</span>
                      </div>
                    </Link>
                  </TableCell>
                  {/* Tasks Count (Read-only) */}
                  <TableCell>
                    <Link href={`/projects/${project.id}?tab=tasks`}>
                      <span className="text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors" data-testid={`task-count-${project.id}`}>
                        {taskCountByProject[project.id] || 0}
                      </span>
                    </Link>
                  </TableCell>
                  {/* Action Buttons */}
                  <TableCell>
                    <div className="flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-600"
                        onClick={() => openDeleteDialog(project)}
                        data-testid={`button-delete-${project.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="flex items-center gap-4">
              <div className="text-xs text-muted-foreground">
                Showing <strong>{totalProjects > 0 ? ((page - 1) * pageSize) + 1 : 0}-{Math.min(page * pageSize, totalProjects)}</strong> of <strong>{totalProjects}</strong> projects
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Per page:</Label>
                <select 
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-8 rounded border border-input bg-background px-2 py-1 text-xs"
                  data-testid="select-page-size"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === 1} 
                onClick={() => setPage(1)}
                className="h-8 w-8 p-0"
                data-testid="button-first-page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === 1} 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="h-8 w-8 p-0"
                data-testid="button-prev-page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground px-2">
                Page {page} of {totalPages || 1}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="h-8 w-8 p-0"
                data-testid="button-next-page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                className="h-8 w-8 p-0"
                data-testid="button-last-page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

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

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Project{selectedIds.size !== 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected 
              {selectedIds.size === 1 ? ' project ' : ` ${selectedIds.size} projects `}
              and all associated data including deliverables, epics, tasks, and milestones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete} 
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-bulk-delete"
            >
              Delete {selectedIds.size} Project{selectedIds.size !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
}
