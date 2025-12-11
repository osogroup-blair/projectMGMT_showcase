export interface HomeTask {
  id: string;
  projectId: string;
  projectName: string;
  deliverableId?: string;
  deliverableName?: string;
  epicId?: string;
  epicName?: string;
  title: string;
  description?: string;
  status: "not_started" | "in_progress" | "blocked" | "complete";
  assignedToUserId: string;
  dueDateTime?: string; // ISO 8601
  estimatedDurationMinutes?: number;
  durationBucket?: "quick_win" | "small" | "medium" | "deep_work";
  priority?: "low" | "medium" | "high" | "critical";
  isOverdue?: boolean;
  milestoneIds?: string[];
  links?: {
    taskUrl?: string;
    epicUrl?: string;
    deliverableUrl?: string;
    projectUrl?: string;
  };
}

export interface WorkBlock {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM:SS
  endTime: string; // HH:MM:SS
  label?: string;
  taskIds: string[];
  totalPlannedMinutes?: number;
  status: "planned" | "in_progress" | "completed" | "cancelled";
  createdAt?: string;
  updatedAt?: string;
}

export interface DayPlan {
  userId: string;
  date: string;
  workBlocks: WorkBlock[];
  unassignedTaskIds: string[];
  targetWorkMinutes?: number;
  plannedMinutes?: number;
}

export interface HomeMilestoneSummary {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  targetDate: string;
  status: "planned" | "in_progress" | "achieved" | "slipped" | "cancelled";
  percentComplete: number;
  daysUntil?: number;
  links?: {
    milestoneUrl?: string;
    projectUrl?: string;
  };
}

export interface UserPreferences {
  workdayStartTime?: string;
  workdayEndTime?: string;
  defaultTargetDailyMinutes?: number;
  showOnlyActionable?: boolean;
}

export interface UserHomeState {
  userId: string;
  today: string; // YYYY-MM-DD
  timezone?: string;
  preferences?: UserPreferences;
  todayTasks: HomeTask[];
  weekTasks: HomeTask[];
  upcomingTasks: HomeTask[];
  dayPlans: DayPlan[];
  upcomingMilestones: HomeMilestoneSummary[];
}
