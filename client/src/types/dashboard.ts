export interface ProjectDashboard {
  projectId: string;
  projectName: string;
  lastUpdated?: string;
  statusSnapshot: StatusSnapshot;
  financialResourceSnapshot?: FinancialResourceSnapshot;
  upcomingWork?: UpcomingWork;
  riskIssuePanel?: RiskIssuePanel;
  recentActivity?: RecentActivity;
}

export interface StatusSnapshot {
  health: "green" | "yellow" | "red";
  phase: "plan_strategy" | "validate_blueprints" | "develop_solution" | "enable_users";
  percentComplete: number;
  originalEndDate?: string;
  projectedEndDate: string;
  daysRemaining?: number;
  openRisksCount?: number;
  openIssuesCount?: number;
  pendingDecisionsCount?: number;
  upcomingMilestonesCount?: number;
}

export interface FinancialResourceSnapshot {
  currency?: string;
  budgetPlanned?: number;
  budgetUsed?: number;
  budgetForecastFinal?: number;
  hoursPlanned?: number;
  hoursUsed?: number;
  hoursForecastFinal?: number;
  spendByPhase?: {
    phase: "plan_strategy" | "validate_blueprints" | "develop_solution" | "enable_users";
    budgetUsed?: number;
    hoursUsed?: number;
  }[];
  resourceUtilization?: {
    entityId: string;
    entityType: "role" | "person";
    name: string;
    monthlyBudgetedHours?: number;
    monthlyActualHours?: number;
    totalBudgetedHours?: number;
    totalActualHours?: number;
    utilizationPercent?: number; // Kept for backward compatibility if needed, though likely unused now
    status?: "underallocated" | "healthy" | "overallocated";
  }[];
}

export interface UpcomingWork {
  horizonDaysShort?: number;
  horizonDaysLong?: number;
  items?: UpcomingItem[];
}

export interface UpcomingItem {
  id: string;
  type: "task" | "deliverable" | "milestone" | "approval" | "meeting";
  title: string;
  description?: string;
  dueDate: string;
  horizon?: "short" | "long";
  status?: "not_started" | "in_progress" | "blocked" | "complete";
  owner?: string;
  relatedPhase?: "plan_strategy" | "validate_blueprints" | "develop_solution" | "enable_users";
  priority?: "low" | "medium" | "high" | "critical";
  progress?: number;
}

export interface RiskIssuePanel {
  risks?: Risk[];
  issues?: Issue[];
  trend?: "improving" | "stable" | "worsening";
}

export interface Risk {
  id: string;
  title: string;
  description?: string;
  severity: "low" | "medium" | "high" | "critical";
  likelihood: "low" | "medium" | "high";
  owner?: string;
  status: "open" | "mitigating" | "closed";
  targetResolutionDate?: string;
}

export interface Issue {
  id: string;
  title: string;
  description?: string;
  severity: "low" | "medium" | "high" | "critical";
  owner?: string;
  status: "open" | "in_progress" | "blocked" | "resolved";
  targetResolutionDate?: string;
  relatedPhase?: "plan_strategy" | "validate_blueprints" | "develop_solution" | "enable_users";
}

export interface RecentActivity {
  windowDays?: number;
  completedCount?: number;
  completedChangePercentVsPrevWindow?: number;
  items?: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: "task_completed" | "deliverable_completed" | "milestone_achieved" | "note_added" | "file_uploaded" | "assignment_changed" | "status_changed";
  title: string;
  description?: string;
  timestamp: string;
  actor?: string;
  relatedPhase?: "plan_strategy" | "validate_blueprints" | "develop_solution" | "enable_users";
}
