export type ScopeType = "all" | "sprint" | "milestone" | "deliverable" | "unscoped";
export type ViewMode = "list" | "card";
export type DueDateFilter = "all" | "overdue" | "this-week" | "upcoming";

export interface TasksByPersonFilters {
  scope: ScopeType;
  scopeId?: string;
  statuses: string[];
  priorities: string[];
  dueDateFilter: DueDateFilter;
  blockedOnly: boolean;
  search: string;
}

export interface PersonWorkloadMetrics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  blockedTasks: number;
  dueSoonTasks: number;
  completionPercent: number;
  hasSprintTasks: boolean;
  hasMilestoneTasks: boolean;
  hasDeliverableTasks: boolean;
  hasUnscopedTasks: boolean;
}

export interface PersonWorkload {
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole?: string;
  metrics: PersonWorkloadMetrics;
  status: "on-track" | "at-risk" | "off-track";
  tasks: TaskWithContext[];
}

export interface TaskWithContext {
  id: string;
  title: string;
  status: string;
  priority: string;
  deadline?: string;
  blocked: boolean;
  blockerReason?: string;
  epicId?: string;
  epicTitle?: string;
  sprintId?: string;
  sprintName?: string;
  milestoneId?: string;
  milestoneName?: string;
  deliverableId?: string;
  deliverableName?: string;
  effort?: number;
}

export interface TasksByPersonConfig {
  projectId: string;
  showJustMyTasksToggle: boolean;
  defaultJustMyTasks: boolean;
  allowedScopes: ScopeType[];
  allowInlineEditing: boolean;
  defaultExpanded: boolean;
  currentUserId?: string;
}

export interface ScopeGroup {
  id: string;
  name: string;
  type: ScopeType;
  tasks: TaskWithContext[];
}
