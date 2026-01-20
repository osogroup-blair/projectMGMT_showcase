import { useMemo, useState, useRef, useEffect } from "react";
import { 
  Zap, 
  Plus, 
  Play,
  Calendar as CalendarIcon,
  Target,
  CheckCircle2,
  Circle,
  MoreVertical,
  Trash2,
  Loader2,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Check,
  X,
  Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useSprints, useTasks, useProject } from "@/hooks/use-nexus-data";
import { useCompletedStatuses } from "@/hooks/use-completed-statuses";
import { addDays, addWeeks, format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TabToolbar, ViewMode } from "@/components/ui/tab-toolbar";
import { computeSprintStatus } from "@/lib/constants";

const STATUS_CONFIG: Record<string, { icon: typeof Circle; color: string; bgColor: string; label: string }> = {
  "planned": { icon: Circle, color: "text-slate-500", bgColor: "bg-slate-100", label: "Planned" },
  "active": { icon: Play, color: "text-blue-500", bgColor: "bg-blue-100", label: "Active" },
  "closed": { icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-100", label: "Closed" },
};

type SortField = "name" | "status" | "startDate" | "tasks" | "progress";
type SortDirection = "asc" | "desc";

export function SprintsContent({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const { data: allSprints, isLoading: isSprintsLoading, create: createSprint, update: updateSprint, remove: removeSprint } = useSprints();
  const { data: allTasks, update: updateTask } = useTasks();
  const { data: project } = useProject(projectId);
  const { isTaskComplete } = useCompletedStatuses();

  const sprints = useMemo(() => 
    (allSprints || []).filter((s: any) => s.projectId === projectId),
    [allSprints, projectId]
  );

  const getNextSprintDefaults = useMemo(() => {
    const sprintDurationWeeks = project?.sprintDurationWeeks || 2;
    
    const sprintNumbers = sprints
      .map((s: any) => {
        const match = s.name?.match(/Sprint\s*(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n: number) => n > 0);
    
    const nextNumber = sprintNumbers.length > 0 ? Math.max(...sprintNumbers) + 1 : 1;
    const nextName = `Sprint ${nextNumber}`;
    
    const sortedSprints = [...sprints].sort((a: any, b: any) => {
      if (!a.endDate && !b.endDate) return 0;
      if (!a.endDate) return 1;
      if (!b.endDate) return -1;
      return a.endDate.localeCompare(b.endDate);
    });
    
    const lastSprint = sortedSprints[sortedSprints.length - 1];
    let startDate: Date;
    
    if (lastSprint?.endDate) {
      startDate = addDays(parseISO(lastSprint.endDate), 1);
    } else {
      startDate = new Date();
    }
    
    const endDate = addWeeks(startDate, sprintDurationWeeks);
    endDate.setDate(endDate.getDate() - 1);
    
    return {
      name: nextName,
      goal: "",
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    };
  }, [sprints, project?.sprintDurationWeeks]);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newSprint, setNewSprint] = useState({
    name: "",
    goal: "",
    startDate: "",
    endDate: "",
  });

  // Toolbar state
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  // Sorting state - default to chronological order by start date
  const [sortField, setSortField] = useState<SortField>("startDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Selection state for bulk actions
  const [selectedSprintIds, setSelectedSprintIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ sprintId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing name
  useEffect(() => {
    if (editingCell?.field === "name" && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingCell]);

  // Get tasks for a specific sprint
  const getSprintTasks = (sprintId: string) => {
    return (allTasks || []).filter((t: any) => t.sprintId === sprintId);
  };

  const getSprintStats = (sprintId: string) => {
    const tasks = getSprintTasks(sprintId);
    const total = tasks.length;
    const done = tasks.filter((t: any) => isTaskComplete(t.status)).length;
    const inProgress = tasks.filter((t: any) => t.status === "In Progress").length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, inProgress, percent };
  };

  // Filter sprints by search query
  const filteredSprints = useMemo(() => {
    if (!searchQuery.trim()) return sprints;
    const query = searchQuery.toLowerCase();
    return sprints.filter((sprint: any) => 
      sprint.name?.toLowerCase().includes(query) ||
      sprint.goal?.toLowerCase().includes(query)
    );
  }, [sprints, searchQuery]);

  // Sort sprints
  const sortedSprints = useMemo(() => {
    const sorted = [...filteredSprints];
    sorted.sort((a: any, b: any) => {
      let aVal: any, bVal: any;
      
      switch (sortField) {
        case "name":
          aVal = a.name?.toLowerCase() || "";
          bVal = b.name?.toLowerCase() || "";
          break;
        case "status":
          const statusOrder = { active: 0, planned: 1, closed: 2 };
          const aStatus = computeSprintStatus(a);
          const bStatus = computeSprintStatus(b);
          aVal = statusOrder[aStatus] ?? 999;
          bVal = statusOrder[bStatus] ?? 999;
          break;
        case "startDate":
          aVal = a.startDate || "";
          bVal = b.startDate || "";
          break;
        case "tasks":
          aVal = getSprintStats(a.id).total;
          bVal = getSprintStats(b.id).total;
          break;
        case "progress":
          aVal = getSprintStats(a.id).percent;
          bVal = getSprintStats(b.id).percent;
          break;
        default:
          aVal = "";
          bVal = "";
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredSprints, sortField, sortDirection]);

  // Handle column header click for sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Render sort indicator
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" 
      ? <ChevronUp className="h-3 w-3 ml-1 inline" />
      : <ChevronDown className="h-3 w-3 ml-1 inline" />;
  };

  // Selection handlers
  const toggleSelectSprint = (sprintId: string) => {
    const newSet = new Set(selectedSprintIds);
    if (newSet.has(sprintId)) {
      newSet.delete(sprintId);
    } else {
      newSet.add(sprintId);
    }
    setSelectedSprintIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedSprintIds.size === sortedSprints.length) {
      setSelectedSprintIds(new Set());
    } else {
      setSelectedSprintIds(new Set(sortedSprints.map((s: any) => s.id)));
    }
  };

  const clearSelection = () => {
    setSelectedSprintIds(new Set());
  };

  // Inline editing handlers
  const startEditingName = (sprintId: string, currentValue: string) => {
    setEditingCell({ sprintId, field: "name" });
    setEditValue(currentValue);
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const saveEditingName = async () => {
    if (!editingCell) return;
    const trimmedValue = editValue.trim();
    if (!trimmedValue) {
      toast({ title: "Sprint name cannot be empty", variant: "destructive" });
      return;
    }
    
    updateSprint({ id: editingCell.sprintId, updates: { name: trimmedValue } });
    cancelEditing();
  };

  const handleInlineStatusChange = async (sprintId: string, newStatus: string) => {
    // Status is now computed from dates - inform user and don't allow manual changes
    toast({ 
      title: "Status is date-driven", 
      description: "Sprint status is automatically set based on dates. Adjust the start/end dates to change status.",
    });
  };

  // Bulk action handlers
  const handleBulkDelete = async () => {
    const ids = Array.from(selectedSprintIds);
    for (const id of ids) {
      removeSprint(id);
    }
    setSelectedSprintIds(new Set());
    setShowBulkDeleteDialog(false);
    toast({ title: `${ids.length} sprint(s) deleted` });
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    const ids = Array.from(selectedSprintIds);
    for (const id of ids) {
      await handleInlineStatusChange(id, newStatus);
    }
    setSelectedSprintIds(new Set());
    toast({ title: `${ids.length} sprint(s) updated` });
  };

  const handleCreateSprint = async () => {
    if (!newSprint.name.trim()) {
      toast({ title: "Sprint name is required", variant: "destructive" });
      return;
    }
    setIsCreating(true);
    try {
      createSprint({
        projectId,
        name: newSprint.name,
        goal: newSprint.goal || null,
        startDate: newSprint.startDate || null,
        endDate: newSprint.endDate || null,
        status: "planned",
        capacityHours: null,
      });
      setShowCreateDialog(false);
      setNewSprint({ name: "", goal: "", startDate: "", endDate: "" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSprint = (sprintId: string) => {
    removeSprint(sprintId);
    setShowDeleteDialog(null);
  };

  if (isSprintsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* Hidden trigger for tab-level Add button */}
      <button 
        data-testid="button-create-sprints" 
        onClick={() => {
          setNewSprint(getNextSprintDefaults);
          setShowCreateDialog(true);
        }} 
        className="hidden" 
        aria-hidden="true"
      />

      <TabToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search sprints..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showFilter={false}
        addButtonLabel="Add Next Sprint"
        onAddClick={() => {
          setNewSprint(getNextSprintDefaults);
          setShowCreateDialog(true);
        }}
        sticky={false}
      />

      {/* Bulk Actions Bar */}
      {selectedSprintIds.size > 0 && (
        <div className="flex items-center gap-3 py-3 px-4 bg-muted/50 rounded-lg mt-4 border">
          <span className="text-sm font-medium">
            {selectedSprintIds.size} selected
          </span>
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Clear
          </Button>
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Set Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleBulkStatusChange("planned")}>
                <Circle className="h-4 w-4 mr-2 text-slate-500" />
                Planned
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkStatusChange("closed")}>
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                Closed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => setShowBulkDeleteDialog(true)}
            data-testid="button-bulk-delete"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      )}

      <div className="space-y-4 pt-4">
        {sortedSprints.length === 0 && sprints.length > 0 ? (
          <Card className="bg-muted/10 border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Zap className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No sprints match your search</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-2">
                Try adjusting your search terms.
              </p>
            </CardContent>
          </Card>
        ) : sprints.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Zap className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sprints yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first sprint to organize work into time-boxed iterations.
              </p>
              <Button onClick={() => {
                setNewSprint(getNextSprintDefaults);
                setShowCreateDialog(true);
              }} data-testid="button-create-first-sprint">
                <Plus className="h-4 w-4 mr-2" />
                Add Next Sprint
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === "list" ? (
          <div className="border rounded-lg bg-card overflow-x-auto">
            <Table style={{ minWidth: "800px" }}>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead style={{ width: "40px" }}>
                    <Checkbox
                      checked={selectedSprintIds.size === sortedSprints.length && sortedSprints.length > 0}
                      onCheckedChange={toggleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                  </TableHead>
                  <TableHead 
                    style={{ width: "25%" }} 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort("name")}
                    data-testid="header-sprint-name"
                  >
                    Sprint{renderSortIndicator("name")}
                  </TableHead>
                  <TableHead 
                    style={{ width: "12%" }}
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort("status")}
                    data-testid="header-status"
                  >
                    Status{renderSortIndicator("status")}
                  </TableHead>
                  <TableHead 
                    style={{ width: "20%" }}
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort("startDate")}
                    data-testid="header-dates"
                  >
                    Dates{renderSortIndicator("startDate")}
                  </TableHead>
                  <TableHead 
                    style={{ width: "10%" }}
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort("tasks")}
                    data-testid="header-tasks"
                  >
                    Tasks{renderSortIndicator("tasks")}
                  </TableHead>
                  <TableHead 
                    style={{ width: "18%" }}
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort("progress")}
                    data-testid="header-progress"
                  >
                    Progress{renderSortIndicator("progress")}
                  </TableHead>
                  <TableHead style={{ width: "15%" }} className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSprints.map((sprint: any) => {
                  const stats = getSprintStats(sprint.id);
                  const computedStatus = computeSprintStatus(sprint);
                  const statusConfig = STATUS_CONFIG[computedStatus] || STATUS_CONFIG["planned"];
                  const StatusIcon = statusConfig.icon;
                  const isSelected = selectedSprintIds.has(sprint.id);
                  const isEditingName = editingCell?.sprintId === sprint.id && editingCell?.field === "name";

                  return (
                    <TableRow 
                      key={sprint.id} 
                      className={cn("hover:bg-muted/50", isSelected && "bg-muted/30")} 
                      data-testid={`row-sprint-${sprint.id}`}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectSprint(sprint.id)}
                          data-testid={`checkbox-sprint-${sprint.id}`}
                        />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-0.5">
                          {isEditingName ? (
                            <div className="flex items-center gap-1">
                              <Input
                                ref={nameInputRef}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEditingName();
                                  if (e.key === "Escape") cancelEditing();
                                }}
                                className="h-7 text-sm"
                                data-testid={`input-edit-name-${sprint.id}`}
                              />
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={saveEditingName}>
                                <Check className="h-3.5 w-3.5 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEditing}>
                                <X className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group">
                              <Link href={`/projects/${projectId}/sprints/${sprint.id}`}>
                                <span className="font-medium hover:text-primary cursor-pointer">{sprint.name}</span>
                              </Link>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                onClick={() => startEditingName(sprint.id, sprint.name)}
                                data-testid={`button-edit-name-${sprint.id}`}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          {sprint.goal && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{sprint.goal}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Badge variant="outline" className={cn(statusConfig.bgColor, statusConfig.color, "border-0 text-xs")}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sprint.startDate ? (
                          <span>
                            {new Date(sprint.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            {sprint.endDate && ` → ${new Date(sprint.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
                          </span>
                        ) : (
                          <span className="italic">Not set</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {stats.total} <span className="text-muted-foreground">({stats.done} done)</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={stats.percent} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-8">{stats.percent}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/projects/${projectId}/sprints/${sprint.id}`}>
                            <Button variant="ghost" size="sm" className="h-7">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setShowDeleteDialog(sprint.id)} className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Sprint
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedSprints.map((sprint: any) => {
              const stats = getSprintStats(sprint.id);
              const computedStatus = computeSprintStatus(sprint);
              const statusConfig = STATUS_CONFIG[computedStatus] || STATUS_CONFIG["planned"];
              const StatusIcon = statusConfig.icon;
              const isSelected = selectedSprintIds.has(sprint.id);
              const isEditingName = editingCell?.sprintId === sprint.id && editingCell?.field === "name";

              return (
                <Card 
                  key={sprint.id} 
                  className={cn("hover:shadow-md transition-shadow", isSelected && "ring-2 ring-primary")} 
                  data-testid={`card-sprint-${sprint.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectSprint(sprint.id)}
                          className="mt-1"
                          data-testid={`checkbox-card-sprint-${sprint.id}`}
                        />
                        <div className={cn("p-2 rounded-md", statusConfig.bgColor)}>
                          <Zap className={cn("h-5 w-5", statusConfig.color)} />
                        </div>
                        <div className="flex-1">
                          {isEditingName ? (
                            <div className="flex items-center gap-1">
                              <Input
                                ref={nameInputRef}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEditingName();
                                  if (e.key === "Escape") cancelEditing();
                                }}
                                className="h-7 text-sm"
                                data-testid={`input-card-edit-name-${sprint.id}`}
                              />
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={saveEditingName}>
                                <Check className="h-3.5 w-3.5 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEditing}>
                                <X className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div 
                                className="flex items-center gap-2 group cursor-pointer"
                                onClick={() => startEditingName(sprint.id, sprint.name)}
                              >
                                <CardTitle className="text-lg hover:text-primary" data-testid={`link-sprint-${sprint.id}`}>
                                  {sprint.name}
                                </CardTitle>
                                <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                              </div>
                              <Link href={`/projects/${projectId}/sprints/${sprint.id}`}>
                                <Button variant="outline" size="sm" className="gap-1.5 h-7" data-testid={`open-sprint-${sprint.id}`}>
                                  <ExternalLink className="h-3 w-3" />
                                  Overview
                                </Button>
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn(statusConfig.bgColor, statusConfig.color, "border-0")}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-sprint-menu-${sprint.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setShowDeleteDialog(sprint.id)} className="text-red-600" data-testid={`button-delete-sprint-${sprint.id}`}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Sprint
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    {sprint.goal && !isEditingName && (
                      <CardDescription className="mt-1 ml-14">{sprint.goal}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                      {sprint.startDate && (
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{new Date(sprint.startDate).toLocaleDateString()}</span>
                          {sprint.endDate && (
                            <>
                              <span>→</span>
                              <span>{new Date(sprint.endDate).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Target className="h-4 w-4" />
                        <span>{stats.total} tasks</span>
                      </div>
                      {stats.done > 0 && (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>{stats.done} done</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{stats.percent}%</span>
                      </div>
                      <Progress value={stats.percent} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Next Sprint</DialogTitle>
            <DialogDescription>
              Create the next sprint with auto-calculated dates based on your project's sprint duration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sprint-name">Sprint Name</Label>
              <Input
                id="sprint-name"
                placeholder="e.g., Sprint 1"
                value={newSprint.name}
                onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })}
                data-testid="input-sprint-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sprint-goal">Sprint Goal (optional)</Label>
              <Textarea
                id="sprint-goal"
                placeholder="What do you want to achieve in this sprint?"
                value={newSprint.goal}
                onChange={(e) => setNewSprint({ ...newSprint, goal: e.target.value })}
                data-testid="input-sprint-goal"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sprint-start">Start Date</Label>
                <Input
                  id="sprint-start"
                  type="date"
                  value={newSprint.startDate}
                  onChange={(e) => setNewSprint({ ...newSprint, startDate: e.target.value })}
                  data-testid="input-sprint-start"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sprint-end">End Date</Label>
                <Input
                  id="sprint-end"
                  type="date"
                  value={newSprint.endDate}
                  onChange={(e) => setNewSprint({ ...newSprint, endDate: e.target.value })}
                  data-testid="input-sprint-end"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} data-testid="button-cancel-create-sprint">
              Cancel
            </Button>
            <Button onClick={handleCreateSprint} loading={isCreating} data-testid="button-confirm-create-sprint">
              Create Sprint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sprint</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this sprint? Tasks assigned to this sprint will be unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-sprint">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => showDeleteDialog && handleDeleteSprint(showDeleteDialog)} className="bg-red-600" data-testid="button-confirm-delete-sprint">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedSprintIds.size} Sprint(s)</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the selected sprints? Tasks assigned to these sprints will be unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-bulk-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600" data-testid="button-confirm-bulk-delete">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
