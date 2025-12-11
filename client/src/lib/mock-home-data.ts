import { UserHomeState, HomeTask, WorkBlock, DayPlan, HomeMilestoneSummary } from "@/types/home";
import { PROJECTS, TASKS, DELIVERABLES, EPICS, MILESTONES } from "@/lib/mock-data";
import { addDays, format, startOfToday, addHours, subHours } from "date-fns";

const today = startOfToday();
const todayStr = format(today, "yyyy-MM-dd");

// Helper to map existing mock data to HomeTask
const mapToHomeTask = (task: any): HomeTask => {
  const project = PROJECTS.find(p => p.name === task.project || p.id === task.projectId); // Handle loose matching
  const epic = EPICS.find(e => e.id === task.epicId);
  const deliverable = DELIVERABLES.find(d => d.id === epic?.deliverableId);

  return {
    id: task.id,
    projectId: project?.id || "unknown",
    projectName: task.project || project?.name || "Unknown Project",
    deliverableId: deliverable?.id,
    deliverableName: deliverable?.title,
    epicId: epic?.id,
    epicName: epic?.title,
    title: task.title,
    description: task.description,
    status: mapStatus(task.status),
    assignedToUserId: task.assigneeId || "currentUser",
    dueDateTime: task.deadline === "Tomorrow" ? format(addDays(today, 1), "yyyy-MM-dd'T'17:00:00") : 
                 task.deadline === "Yesterday" ? format(subHours(today, 24), "yyyy-MM-dd'T'17:00:00") :
                 format(addDays(today, 3), "yyyy-MM-dd'T'17:00:00"), // Mock date logic
    estimatedDurationMinutes: task.estimateHours ? task.estimateHours * 60 : 60,
    durationBucket: (task.estimateHours || 1) < 2 ? "quick_win" : (task.estimateHours || 1) < 4 ? "medium" : "deep_work",
    priority: task.priority?.toLowerCase() || "medium",
    isOverdue: task.deadline === "Yesterday" || task.status === "Overdue",
    milestoneIds: task.milestoneId ? [task.milestoneId] : [],
    links: {
      taskUrl: `/tasks/${task.id}`,
      projectUrl: `/projects/${project?.id}`
    }
  };
};

const mapStatus = (status: string): "not_started" | "in_progress" | "blocked" | "complete" => {
  switch (status) {
    case "Todo": return "not_started";
    case "In Progress": return "in_progress";
    case "Review": return "blocked"; // Treat review as blocked/waiting for now
    case "Done": return "complete";
    default: return "not_started";
  }
};

// Generate some specific home tasks
export const MOCK_HOME_TASKS: HomeTask[] = [
  ...TASKS.slice(0, 3).map(mapToHomeTask),
  {
    id: "ht1",
    projectId: "1",
    projectName: "Houlihan Lokey Rebrand",
    title: "Finalize Stakeholder Interview Scripts",
    status: "in_progress",
    assignedToUserId: "currentUser",
    dueDateTime: format(today, "yyyy-MM-dd'T'14:00:00"),
    estimatedDurationMinutes: 45,
    durationBucket: "medium",
    priority: "high",
    isOverdue: false,
    deliverableName: "Brand Strategy",
    epicName: "Market Research"
  },
  {
    id: "ht2",
    projectId: "1",
    projectName: "Houlihan Lokey Rebrand",
    title: "Review Competitor Analysis Deck",
    status: "not_started",
    assignedToUserId: "currentUser",
    dueDateTime: format(today, "yyyy-MM-dd'T'17:00:00"),
    estimatedDurationMinutes: 30,
    durationBucket: "quick_win",
    priority: "medium",
    isOverdue: false,
    deliverableName: "Brand Strategy",
    epicName: "Market Research"
  }
];

export const MOCK_WORK_BLOCKS: WorkBlock[] = [
  {
    id: "wb1",
    userId: "currentUser",
    date: todayStr,
    startTime: "09:00:00",
    endTime: "11:00:00",
    label: "Deep Work: Strategy",
    taskIds: ["ht1"],
    totalPlannedMinutes: 120,
    status: "in_progress"
  },
  {
    id: "wb2",
    userId: "currentUser",
    date: todayStr,
    startTime: "13:00:00",
    endTime: "14:00:00",
    label: "Quick Wins & Email",
    taskIds: ["ht2"],
    totalPlannedMinutes: 60,
    status: "planned"
  }
];

export const MOCK_DAY_PLANS: DayPlan[] = [
  {
    userId: "currentUser",
    date: todayStr,
    workBlocks: MOCK_WORK_BLOCKS,
    unassignedTaskIds: ["1", "2"], // IDs from TASKS
    targetWorkMinutes: 360,
    plannedMinutes: 180
  },
  {
    userId: "currentUser",
    date: format(addDays(today, 1), "yyyy-MM-dd"),
    workBlocks: [],
    unassignedTaskIds: ["3"],
    targetWorkMinutes: 360,
    plannedMinutes: 0
  }
];

export const MOCK_UPCOMING_MILESTONES: HomeMilestoneSummary[] = MILESTONES.slice(0, 3).map(m => ({
  id: m.id,
  projectId: m.projectId || "1",
  projectName: PROJECTS.find(p => p.id === m.projectId)?.name || "Unknown Project",
  name: m.name,
  targetDate: m.targetDate,
  status: "planned", // Simplified mapping
  percentComplete: m.progressPercent || 0,
  daysUntil: 5, // Mock
  links: {
    milestoneUrl: `/projects/${m.projectId}/milestones`,
    projectUrl: `/projects/${m.projectId}`
  }
}));

export const MOCK_USER_HOME_STATE: UserHomeState = {
  userId: "currentUser",
  today: todayStr,
  timezone: "America/New_York",
  preferences: {
    workdayStartTime: "09:00:00",
    workdayEndTime: "17:00:00",
    defaultTargetDailyMinutes: 360,
    showOnlyActionable: false
  },
  todayTasks: MOCK_HOME_TASKS,
  weekTasks: TASKS.slice(3, 6).map(mapToHomeTask),
  upcomingTasks: TASKS.slice(6).map(mapToHomeTask),
  dayPlans: MOCK_DAY_PLANS,
  upcomingMilestones: MOCK_UPCOMING_MILESTONES
};
