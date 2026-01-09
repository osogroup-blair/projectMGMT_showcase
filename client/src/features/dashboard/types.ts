export type TimeRange = 'week' | 'nextWeek' | '30days' | '60days' | '90days';
export type AssigneeScope = 'me' | 'team' | 'all';
export type CapacityLevel = 'low' | 'medium' | 'high';
export type MilestoneConfidence = 'on_track' | 'at_risk';
export type StageHealth = 'on_track' | 'at_risk';

export interface DashboardFilters {
  range: TimeRange;
  projectIds: string[];
  assigneeScope: AssigneeScope;
  userId?: string;
  search?: string;
}

export interface DashboardSummary {
  tasksDue: number;
  overdue: number;
  blocked: number;
  milestonesDue: number;
  capacityLevel: CapacityLevel;
}

export interface DashboardTask {
  id: string;
  title: string;
  projectId: string | null;
  projectName?: string;
  epicId?: string | null;
  epicName?: string;
  deadline: string;
  status: string;
  priority: string;
  priorityScore?: number;
  isOverdue?: boolean;
  isBlocked?: boolean;
}

export interface DashboardMilestone {
  id: string;
  name: string;
  projectId: string | null;
  projectName?: string;
  targetDate: string;
  status: string;
  confidence?: MilestoneConfidence;
}

export interface WeeklyFocus {
  projectId: string;
  projectName: string;
  milestone?: {
    id: string;
    name: string;
    targetDate: string;
    status: string;
  } | null;
  topTasks: {
    id: string;
    title: string;
    deadline: string;
    status: string;
  }[];
}

export interface CapacityPreview {
  notStartedCount: number;
  capacityLevel: CapacityLevel;
}

export interface StageProgress {
  id: string;
  projectId: string | null;
  projectName?: string;
  name: string;
  order: number;
  type: string;
  status: string;
  openTaskCount: number;
  health: StageHealth;
}

export interface RiskItem {
  id: string;
  title: string;
  projectId: string | null;
  projectName?: string;
  type: 'long_running' | 'high_blocker' | 'slipping_milestone';
  deadline?: string;
}

export interface ThisWeekData {
  myCommitments: DashboardTask[];
  atRisk: DashboardTask[];
  weeklyFocus: WeeklyFocus[];
}

export interface NextWeekData {
  milestones: DashboardMilestone[];
  rollingTasks: DashboardTask[];
  capacityPreview: CapacityPreview;
}

export interface FutureData {
  milestones: DashboardMilestone[];
  stageProgress: StageProgress[];
  risks: RiskItem[];
}

export interface DashboardData {
  summary: DashboardSummary;
  thisWeek: ThisWeekData;
  nextWeek: NextWeekData;
  future: FutureData;
}
