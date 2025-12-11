import { ProjectDashboard } from "@/types/dashboard";

export const MOCK_DASHBOARD_DATA: ProjectDashboard = {
  projectId: "1",
  projectName: "Nymbl Implementation",
  lastUpdated: new Date().toISOString(),
  statusSnapshot: {
    health: "green",
    phase: "develop_solution",
    percentComplete: 65,
    originalEndDate: "2024-12-31",
    projectedEndDate: "2024-12-25",
    daysRemaining: 18,
    openRisksCount: 2,
    openIssuesCount: 1,
    pendingDecisionsCount: 3,
    upcomingMilestonesCount: 2
  },
  financialResourceSnapshot: {
    currency: "USD",
    budgetPlanned: 150000,
    budgetUsed: 85000,
    budgetForecastFinal: 145000,
    hoursPlanned: 1200,
    hoursUsed: 750,
    hoursForecastFinal: 1150,
    spendByPhase: [
      { phase: "plan_strategy", budgetUsed: 25000, hoursUsed: 200 },
      { phase: "validate_blueprints", budgetUsed: 35000, hoursUsed: 300 },
      { phase: "develop_solution", budgetUsed: 25000, hoursUsed: 250 },
      { phase: "enable_users", budgetUsed: 0, hoursUsed: 0 }
    ],
    resourceUtilization: [
      { entityId: "1", entityType: "person", name: "Alex Johnson", utilizationPercent: 95, status: "healthy" },
      { entityId: "2", entityType: "person", name: "Sarah Williams", utilizationPercent: 110, status: "overallocated" },
      { entityId: "3", entityType: "role", name: "Frontend Dev", utilizationPercent: 80, status: "underallocated" }
    ]
  },
  upcomingWork: {
    horizonDaysShort: 7,
    horizonDaysLong: 21,
    items: [
      {
        id: "1",
        type: "task",
        title: "Finalize API Integration",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        horizon: "short",
        status: "in_progress",
        owner: "Alex Johnson",
        priority: "high",
        relatedPhase: "develop_solution"
      },
      {
        id: "2",
        type: "approval",
        title: "Approve UX Designs",
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        horizon: "short",
        status: "not_started",
        owner: "Product Owner",
        priority: "critical",
        relatedPhase: "develop_solution"
      },
      {
        id: "3",
        type: "milestone",
        title: "Beta Release",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        horizon: "long",
        status: "not_started",
        priority: "high",
        relatedPhase: "enable_users"
      },
      {
        id: "4",
        type: "meeting",
        title: "Steering Committee Review",
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        horizon: "long",
        status: "not_started",
        priority: "medium"
      }
    ]
  },
  riskIssuePanel: {
    trend: "stable",
    risks: [
      {
        id: "r1",
        title: "API Rate Limits",
        description: "Third-party API might hit rate limits during load.",
        severity: "medium",
        likelihood: "medium",
        owner: "Tech Lead",
        status: "open",
        targetResolutionDate: "2024-06-15"
      },
      {
        id: "r2",
        title: "Key Resource Availability",
        description: "Sarah might be pulled into another project.",
        severity: "high",
        likelihood: "high",
        owner: "Project Manager",
        status: "mitigating",
        targetResolutionDate: "2024-06-10"
      }
    ],
    issues: [
      {
        id: "i1",
        title: "Login Bug on Safari",
        description: "Users cannot login using Safari browser.",
        severity: "high",
        owner: "QA Lead",
        status: "in_progress",
        relatedPhase: "develop_solution",
        targetResolutionDate: "2024-06-05"
      }
    ]
  },
  recentActivity: {
    windowDays: 7,
    completedCount: 12,
    completedChangePercentVsPrevWindow: 15,
    items: [
      {
        id: "a1",
        type: "task_completed",
        title: "Database Schema Migration",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        actor: "Alex Johnson",
        relatedPhase: "develop_solution"
      },
      {
        id: "a2",
        type: "file_uploaded",
        title: "Updated Architecture Diagram",
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        actor: "Sarah Williams",
        relatedPhase: "develop_solution"
      },
      {
        id: "a3",
        type: "status_changed",
        title: "Moved 'User Profile' to QA",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        actor: "Mike Chen",
        relatedPhase: "develop_solution"
      }
    ]
  }
};
