import { UserHomePage } from "@/features/home/panels/user-home-page";
import { useQuery } from "@tanstack/react-query";
import { format, startOfToday, addDays, isBefore, isAfter, parseISO, endOfWeek } from "date-fns";
import type { UserHomeState, HomeTask, HomeMilestoneSummary, DayPlan, WorkBlock } from "@/types/home";
import { useCurrentUser } from "@/contexts/current-user-context";

function mapApiTaskToHomeTask(apiTask: any): HomeTask {
  const today = startOfToday();
  const dueDate = apiTask.deadline ? parseISO(apiTask.deadline) : null;
  const isOverdue = dueDate ? isBefore(dueDate, today) && apiTask.status !== "Done" : false;

  const estimateMinutes = (apiTask.estimateHours || 1) * 60;
  let durationBucket: HomeTask["durationBucket"] = "medium";
  if (estimateMinutes <= 30) durationBucket = "quick_win";
  else if (estimateMinutes <= 60) durationBucket = "small";
  else if (estimateMinutes <= 120) durationBucket = "medium";
  else durationBucket = "deep_work";

  const mapStatus = (status: string): HomeTask["status"] => {
    switch (status) {
      case "Todo": return "not_started";
      case "In Progress": return "in_progress";
      case "Review": case "Blocked": return "blocked";
      case "Done": return "complete";
      default: return "not_started";
    }
  };

  const mapPriority = (priority: string): HomeTask["priority"] => {
    const p = (priority || "medium").toLowerCase();
    if (p === "critical" || p === "urgent") return "critical";
    if (p === "high") return "high";
    if (p === "low") return "low";
    return "medium";
  };

  return {
    id: apiTask.id,
    projectId: apiTask.projectId || "",
    projectName: apiTask.projectName || apiTask.project || "Unknown Project",
    epicId: apiTask.epicId,
    epicName: apiTask.epicTitle,
    deliverableId: apiTask.deliverableId,
    title: apiTask.title,
    description: apiTask.description,
    status: mapStatus(apiTask.status),
    assignedToUserId: apiTask.assigneeId || "",
    dueDateTime: apiTask.deadline,
    estimatedDurationMinutes: estimateMinutes,
    durationBucket,
    priority: mapPriority(apiTask.priority),
    isOverdue,
    milestoneIds: apiTask.milestoneId ? [apiTask.milestoneId] : [],
    links: {
      taskUrl: `/projects/${apiTask.projectId}/tasks/${apiTask.id}`,
      projectUrl: `/projects/${apiTask.projectId}`,
    }
  };
}

function mapApiMilestoneToSummary(apiMilestone: any): HomeMilestoneSummary {
  const today = startOfToday();
  const targetDate = apiMilestone.targetDate ? parseISO(apiMilestone.targetDate) : null;
  const daysUntil = targetDate ? Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : undefined;

  const mapStatus = (status: string): HomeMilestoneSummary["status"] => {
    switch (status) {
      case "Planned": return "planned";
      case "In Progress": return "in_progress";
      case "Achieved": case "Complete": return "achieved";
      case "At Risk": case "Slipped": return "slipped";
      case "Cancelled": return "cancelled";
      default: return "planned";
    }
  };

  return {
    id: apiMilestone.id,
    projectId: apiMilestone.projectId,
    projectName: apiMilestone.projectName || "Unknown Project",
    name: apiMilestone.name,
    targetDate: apiMilestone.targetDate,
    status: mapStatus(apiMilestone.status),
    percentComplete: apiMilestone.progressPercent || 0,
    daysUntil,
    links: {
      milestoneUrl: `/projects/${apiMilestone.projectId}/milestones/${apiMilestone.id}`,
      projectUrl: `/projects/${apiMilestone.projectId}`,
    }
  };
}

export default function Home() {
  const { currentUserId, isLoading: userLoading } = useCurrentUser();
  const today = startOfToday();
  const todayStr = format(today, "yyyy-MM-dd");
  const weekEnd = endOfWeek(today);

  const { data: apiTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/home/tasks", currentUserId],
    queryFn: async () => {
      const response = await fetch(`/api/home/tasks/${currentUserId}`);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    },
    enabled: !!currentUserId
  });

  const { data: apiMilestones = [], isLoading: milestonesLoading } = useQuery({
    queryKey: ["/api/home/milestones"],
    queryFn: async () => {
      const response = await fetch("/api/home/milestones");
      if (!response.ok) throw new Error("Failed to fetch milestones");
      return response.json();
    }
  });

  const homeTasks: HomeTask[] = apiTasks.map(mapApiTaskToHomeTask);

  const todayTasks = homeTasks.filter(task => {
    if (!task.dueDateTime) return false;
    const dueDate = parseISO(task.dueDateTime);
    return format(dueDate, "yyyy-MM-dd") === todayStr;
  });

  const weekTasks = homeTasks.filter(task => {
    if (!task.dueDateTime) return false;
    const dueDate = parseISO(task.dueDateTime);
    return isAfter(dueDate, today) && isBefore(dueDate, weekEnd) && format(dueDate, "yyyy-MM-dd") !== todayStr;
  });

  const upcomingTasks = homeTasks.filter(task => {
    if (!task.dueDateTime) return true;
    const dueDate = parseISO(task.dueDateTime);
    return isAfter(dueDate, weekEnd);
  });

  const upcomingMilestones: HomeMilestoneSummary[] = apiMilestones
    .map(mapApiMilestoneToSummary)
    .filter((m: HomeMilestoneSummary) => {
      if (!m.targetDate) return true;
      const targetDate = parseISO(m.targetDate);
      return isAfter(targetDate, today) || m.status === "in_progress";
    })
    .sort((a: HomeMilestoneSummary, b: HomeMilestoneSummary) => {
      if (!a.targetDate) return 1;
      if (!b.targetDate) return -1;
      return parseISO(a.targetDate).getTime() - parseISO(b.targetDate).getTime();
    });

  const emptyDayPlan: DayPlan = {
    userId: currentUserId,
    date: todayStr,
    workBlocks: [],
    unassignedTaskIds: todayTasks.map(t => t.id),
    targetWorkMinutes: 480,
    plannedMinutes: 0,
  };

  const homeState: UserHomeState = {
    userId: currentUserId,
    today: todayStr,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    preferences: {
      workdayStartTime: "09:00",
      workdayEndTime: "17:00",
      defaultTargetDailyMinutes: 480,
      showOnlyActionable: false,
    },
    todayTasks: todayTasks.length > 0 ? todayTasks : homeTasks.slice(0, 5),
    weekTasks,
    upcomingTasks,
    dayPlans: [emptyDayPlan],
    upcomingMilestones,
  };

  if (userLoading || tasksLoading || milestonesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return <UserHomePage homeState={homeState} />;
}
