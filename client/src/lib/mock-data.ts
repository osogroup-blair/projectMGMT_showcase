import { LucideIcon, LayoutDashboard, Settings, CheckSquare, Workflow, Wallet, Timer, Users, BookOpen, AlertCircle, CheckCircle2, Clock, PlayCircle } from "lucide-react";

export interface Project {
  id: string;
  name: string;
  status: "Upcoming" | "In Progress" | "Completed" | "On Hold" | "Archived" | "Overdue";
  startDate?: string; // Added for dynamic timeline calculation
  deadline: string;
  progress?: number;
  frameworkId?: string; 
  defaultMappingTemplateId?: string;
  permissions?: Record<string, any>;
}

export interface Deliverable {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: "Not Started" | "In Progress" | "Completed";
  ownerId: string;
  dueDate: string;
  progress: number;
}

export interface Epic {
  id: string;
  deliverableId: string;
  title: string;
  description: string;
  status: "Not Started" | "In Progress" | "Completed";
  ownerId: string;
  startDate: string;
  endDate: string;
  progress: number;
  stageIds: string[]; // Specific stages assigned to this epic (that generate tasks)
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  project: string;
  projectId?: string; // Added for linking
  stageId?: string;
  epicId?: string;
  status: "Todo" | "In Progress" | "Review" | "Done";
  assigneeId?: string;
  deadline: string;
  priority: "Low" | "Medium" | "High";
  milestoneId?: string;
  estimateHours?: number;
  effort?: number; // Fibonacci sequence: 1, 2, 3, 5, 8, 13, 21, 34, 55, 89
  tags?: string[];
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  details?: string;
  avatar?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  status: "Online" | "Offline" | "In Meeting";
  email?: string;
}

export interface Milestone {
  id: string;
  projectId?: string; // Added for schema compatibility
  name: string;
  description: string;
  phase: "plan_strategy" | "validate_blueprints" | "develop_solution" | "enable_users"; // Changed from stageId to phase enum
  stageId?: string; // Keep for backward compatibility if needed, or map phase to stageId
  targetDate: string;
  status: "planned" | "in_progress" | "achieved" | "slipped" | "cancelled" | "Pending" | "In Progress" | "Completed" | "Blocked" | "Skipped"; // Expanded for schema
  ownerId: string;
  scopeType: "rule_based" | "manual" | "mixed";
  completionMode: "all_tasks" | "percentage" | "custom_rule";
  completionTargetPercent?: number;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  progress: {
    totalTasks: number;
    completedTasks: number;
    percentComplete: number;
    lastCalculatedAt?: string;
  };
  // Deprecated/Legacy fields to keep TS happy until full refactor
  progressPercent?: number;
  isBillingGate?: boolean;
  requiredCompletionRatio?: number;
}

export interface MilestoneScopeRule {
  id: string;
  label?: string;
  taskTemplateKey?: string; // e.g. 'validate_user_story' or just 'task_type'
  stage?: "plan_strategy" | "validate_blueprints" | "develop_solution" | "enable_users";
  epicType?: string;
  filters?: {
    includeEpicIds?: string[];
    excludeEpicIds?: string[];
    includeTaskIds?: string[];
    excludeTaskIds?: string[];
  };
  active: boolean;
}

export interface MilestoneScopeRules {
  milestoneId: string;
  rules: MilestoneScopeRule[];
  lastEvaluatedAt?: string;
}

export interface MilestoneTaskLink {
  id: string;
  milestoneId: string;
  taskId: string;
  projectId?: string;
  source: "rule" | "manual_add";
  ruleId?: string;
  locked?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  taskId: string;
  fileName: string;
  url: string;
  fileType: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface History {
  id: string;
  taskId: string;
  field: string;
  oldValue: string;
  newValue: string;
  changedAt: string;
  changedBy: string;
}

export interface ProjectRole {
  id: string;
  name: string;
  description: string;
  roleType: "Management" | "Discovery" | "Design" | "Development" | "QA & Testing" | "Launch";
  isRequired: boolean;
  maxAssignees?: number;
  permissions: string[];
}

export interface RoleAssignment {
  id: string;
  roleId: string;
  userId: string;
  isPrimary: boolean;
  allocationPercent: number;
}

export interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  defaultRoleType: "Management" | "Discovery" | "Design" | "Development" | "QA & Testing" | "Launch";
  defaultPermissions: string[];
}

export interface SavedView {
  id: string;
  name: string;
  description: string;
  stageIds: string[];
  viewType: "Kanban" | "List" | "Calendar" | "Gantt";
  visibility: "Global" | "Personal";
  isDefault: boolean;
  config: Record<string, any>;
}

export interface GuidanceItem {
  id: string;
  title: string;
  body: string;
  priority: "High" | "Medium" | "Low";
  stageId?: string;
}

export interface ProjectStage {
  id: string;
  name: string;
  description?: string;
  order: number;
  type: "planning" | "execution" | "review" | "delivery";
  status: "completed" | "active" | "pending";
}

export interface FrameworkTemplate {
  id: string;
  name: string;
  description?: string;
  defaultStages: string[]; // List of StageTemplate IDs
}

export interface StageTemplate {
  id: string;
  name: string;
  description?: string;
  defaultTasks: string[]; // List of TaskTemplate IDs
  defaultRoles: string[]; // List of RoleTemplate IDs required for this stage
  entryCriteria?: string;
  exitCriteria?: string;
  allowedTaskStatuses?: string[]; // IDs from TASK_STATUS_OPTIONS or custom
}

export interface MappingTemplate {
  id: string;
  name: string;
  dataType: string;
}

// Template Interfaces
export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  defaultFrameworkId: string; // The framework defines the project structure
  defaultRoles: string[]; // role template IDs
  defaultDeliverables?: string[]; // deliverable template IDs
  thumbnail?: string;
}

export interface DeliverableTemplate {
  id: string;
  title: string;
  description: string;
  defaultEpics: string[]; // epic template IDs
}

export interface EpicTemplate {
  id: string;
  title: string;
  description: string;
  defaultStages: string[]; // List of StageTemplate IDs that this epic will populate
}

export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  defaultPriority: "Low" | "Medium" | "High";
  defaultEstimateHours: number;
  requiredRole?: string; // Role Type
  assignedRoleId?: string; // Specific Role Template ID
}

export interface StatusOption {
  id: string;
  label: string;
  color: string;
  isDefault?: boolean;
  type: "project" | "task" | "epic" | "deliverable" | "stage";
}

export const STAGE_STATUS_OPTIONS: StatusOption[] = [
  { id: "ss1", label: "completed", color: "bg-green-50 text-green-700 border-green-200", type: "stage" },
  { id: "ss2", label: "active", color: "bg-blue-50 text-blue-700 border-blue-200", type: "stage" },
  { id: "ss3", label: "pending", color: "bg-muted/50 text-muted-foreground border-muted", type: "stage" },
];

export const PROJECT_STATUS_OPTIONS: StatusOption[] = [
  { id: "ps1", label: "Upcoming", color: "bg-purple-50 text-purple-700", type: "project" },
  { id: "ps2", label: "In Progress", color: "bg-blue-50 text-blue-700", type: "project" },
  { id: "ps3", label: "Completed", color: "bg-green-50 text-green-700", type: "project" },
  { id: "ps4", label: "On Hold", color: "bg-gray-100 text-gray-700", type: "project" },
  { id: "ps5", label: "Archived", color: "bg-slate-100 text-slate-700", type: "project" },
  { id: "ps6", label: "Overdue", color: "bg-red-50 text-red-700", type: "project" },
];

export const TASK_STATUS_OPTIONS: StatusOption[] = [
  { id: "ts1", label: "Todo", color: "bg-slate-100 text-slate-700", type: "task" },
  { id: "ts2", label: "In Progress", color: "bg-blue-50 text-blue-700", type: "task" },
  { id: "ts3", label: "Review", color: "bg-amber-50 text-amber-700", type: "task" },
  { id: "ts4", label: "Done", color: "bg-green-50 text-green-700", type: "task" },
];

export const PROJECTS: Project[] = [
  { id: "1", name: "Houlihan Lokey Rebrand", status: "In Progress", startDate: "2024-10-01", deadline: "11/28", progress: 65, frameworkId: "ft_impl", defaultMappingTemplateId: "mt1" },
  { id: "2", name: "Colgate-Palmolive Retool", status: "Upcoming", startDate: "2025-01-01", deadline: "Tomorrow", progress: 0, frameworkId: "ft_impl" },
  { id: "3", name: "Kraft HR", status: "On Hold", deadline: "11/30", progress: 30, frameworkId: "ft_impl" },
  { id: "4", name: "SDMP Internal Project", status: "Completed", deadline: "Yesterday", progress: 100, frameworkId: "ft_impl" },
  { id: "5", name: "Quality Matters", status: "Overdue", deadline: "Yesterday", progress: 85, frameworkId: "ft_impl" },
];

export const DELIVERABLES: Deliverable[] = [
  { 
    id: "d1", 
    projectId: "1", 
    title: "Brand Strategy", 
    description: "Complete overhaul of brand positioning and messaging framework.", 
    status: "Completed", 
    ownerId: "1", 
    dueDate: "2023-12-15",
    progress: 100 
  },
  { 
    id: "d2", 
    projectId: "1", 
    title: "Digital Presence", 
    description: "New website design and development including CMS implementation.", 
    status: "In Progress", 
    ownerId: "2", 
    dueDate: "2024-02-28",
    progress: 45 
  },
  { 
    id: "d3", 
    projectId: "1", 
    title: "Marketing Collateral", 
    description: "Templates for presentations, business cards, and social media assets.", 
    status: "Not Started", 
    ownerId: "3", 
    dueDate: "2024-03-15",
    progress: 0 
  }
];

export const EPICS: Epic[] = [
  { 
    id: "e1", 
    deliverableId: "d2", 
    title: "Website Redesign", 
    description: "UX/UI design phases including wireframing and prototyping.", 
    status: "In Progress", 
    ownerId: "3", 
    startDate: "2023-11-01", 
    endDate: "2024-01-15",
    progress: 60,
    stageIds: ["st_validate", "st_develop", "st_enable"]
  },
  { 
    id: "e2", 
    deliverableId: "d2", 
    title: "CMS Implementation", 
    description: "Backend development and content migration to the new CMS.", 
    status: "Not Started", 
    ownerId: "5", 
    startDate: "2024-01-01", 
    endDate: "2024-02-28",
    progress: 0,
    stageIds: ["st_develop", "st_enable"]
  },
  { 
    id: "e3", 
    deliverableId: "d1", 
    title: "Market Research", 
    description: "Competitor analysis and stakeholder interviews.", 
    status: "Completed", 
    ownerId: "1", 
    startDate: "2023-10-01", 
    endDate: "2023-11-15",
    progress: 100,
    stageIds: ["st_plan"]
  }
];

export const TASKS: Task[] = [
  { 
    id: "1", 
    title: "Code Review", 
    description: "Review pull requests for the authentication module. Focus on security vulnerabilities and code style consistency.",
    project: "Quality Matters", 
    stageId: "st_develop",
    epicId: "e2",
    status: "Review", 
    deadline: "Tomorrow", 
    priority: "High",
    assigneeId: "5", // Jason Roberts
    milestoneId: "m3",
    estimateHours: 4,
    tags: ["Backend", "Security"]
  },
  { 
    id: "2", 
    title: "Feature Implementation", 
    description: "Implement the new dashboard widgets as per design. Ensure responsiveness on mobile devices.",
    project: "Houlihan Lokey", 
    stageId: "st_develop",
    epicId: "e1",
    status: "In Progress", 
    deadline: "11/28", 
    priority: "Medium",
    assigneeId: "6", // Nigel Wong
    milestoneId: "m3",
    estimateHours: 12,
    tags: ["Frontend", "React"]
  },
  { 
    id: "3", 
    title: "Bug Fixing", 
    description: "Fix the reported crash on the user profile page when uploading large avatars.",
    project: "Kraft HR", 
    stageId: "st_enable",
    epicId: "e2",
    status: "Todo", 
    deadline: "11/29", 
    priority: "High",
    assigneeId: "5", // Jason Roberts
    milestoneId: "m4",
    estimateHours: 2,
    tags: ["Bug", "Urgent"]
  },
  { 
    id: "4", 
    title: "System Optimization", 
    description: "Optimize database queries for faster load times on the reports page.",
    project: "Colgate-Palmolive", 
    stageId: "st_develop",
    epicId: "e2",
    status: "Todo", 
    deadline: "Tomorrow", 
    priority: "Medium",
    assigneeId: "2", // Jessica Lin
    milestoneId: "m3",
    estimateHours: 8,
    tags: ["Database", "Performance"]
  },
  { 
    id: "5", 
    title: "API Development", 
    description: "Create REST endpoints for the mobile app to fetch user settings.",
    project: "Houlihan Lokey", 
    stageId: "st_develop",
    epicId: "e2",
    status: "Todo", 
    deadline: "11/30", 
    priority: "High",
    assigneeId: "5", // Jason Roberts
    milestoneId: "m3",
    estimateHours: 16,
    tags: ["API", "Backend"]
  },
  { 
    id: "6", 
    title: "Testing and QA", 
    description: "Run regression tests before the release. Document any failures in JIRA.",
    project: "Kraft", 
    stageId: "st_enable",
    epicId: "e2",
    status: "Todo", 
    deadline: "11/30", 
    priority: "Low",
    assigneeId: "7", // Steven Ahmed
    milestoneId: "m4",
    estimateHours: 6,
    tags: ["QA", "Testing"]
  },
  { 
    id: "7", 
    title: "Design System Update", 
    description: "Update the color palette in the design system to match the new brand guidelines.",
    project: "Houlihan Lokey", 
    stageId: "st_validate",
    epicId: "e1",
    status: "Done", 
    deadline: "Yesterday", 
    priority: "Medium",
    assigneeId: "3", // Susan Smith
    milestoneId: "m2",
    estimateHours: 4,
    tags: ["Design", "UI/UX"]
  },
  { 
    id: "8", 
    title: "Client Meeting Prep", 
    description: "Prepare slides for the weekly status update. Include metrics on velocity and burn-down.",
    project: "Houlihan Lokey", 
    stageId: "st_plan",
    epicId: "e3",
    status: "Done", 
    deadline: "Last Week", 
    priority: "High",
    assigneeId: "1", // Joy Mason
    milestoneId: "m1",
    estimateHours: 2,
    tags: ["Management", "Client"]
  },
];

export const TEAM: TeamMember[] = [
  { id: "1", name: "Nym Bull", role: "Product Manager", status: "Online", email: "nym.bull@nexus.com" },
  { id: "2", name: "Jessica Lin", role: "Project Manager", status: "In Meeting", email: "jessica.lin@nexus.com" },
  { id: "3", name: "Susan Smith", role: "UX Designer", status: "Online", email: "susan.smith@nexus.com" },
  { id: "4", name: "Jason Ho", role: "CEO", status: "Offline", email: "jason.ho@nexus.com" },
  { id: "5", name: "Jason Roberts", role: "Senior Developer", status: "Online", email: "jason.roberts@nexus.com" },
  { id: "6", name: "Nigel Wong", role: "UX Designer", status: "Offline", email: "nigel.wong@nexus.com" },
  { id: "7", name: "Steven Ahmed", role: "UX Designer", status: "In Meeting", email: "steven.ahmed@nexus.com" },
];

export const MILESTONES: Milestone[] = [
  {
    id: "m1",
    projectId: "1",
    name: "Strategy Sign-off",
    description: "Final approval of brand strategy and core messaging",
    phase: "plan_strategy",
    stageId: "st_plan",
    targetDate: "2024-12-15",
    status: "achieved", // mapped from Completed
    ownerId: "1", // Joy Mason
    scopeType: "manual",
    completionMode: "all_tasks",
    completionTargetPercent: 100,
    tags: ["Strategy", "Client"],
    progress: {
      totalTasks: 5,
      completedTasks: 5,
      percentComplete: 100
    },
    // Legacy
    progressPercent: 100,
    isBillingGate: true,
    requiredCompletionRatio: 100
  },
  {
    id: "m2",
    projectId: "1",
    name: "Visual Identity Presentation",
    description: "Presenting the 3 directions for visual identity",
    phase: "validate_blueprints",
    stageId: "st_validate",
    targetDate: "2025-01-10",
    status: "in_progress",
    ownerId: "3", // Susan Smith
    scopeType: "mixed",
    completionMode: "percentage",
    completionTargetPercent: 80,
    tags: ["Design", "Review"],
    progress: {
      totalTasks: 10,
      completedTasks: 6,
      percentComplete: 60
    },
    // Legacy
    progressPercent: 60,
    isBillingGate: false,
    requiredCompletionRatio: 80
  },
  {
    id: "m3",
    projectId: "1",
    name: "Alpha Release",
    description: "Internal release for team testing",
    phase: "develop_solution",
    stageId: "st_develop",
    targetDate: "2025-02-01",
    status: "planned",
    ownerId: "5", // Jason Roberts
    scopeType: "rule_based",
    completionMode: "percentage",
    completionTargetPercent: 90,
    tags: ["Dev", "Release"],
    progress: {
      totalTasks: 20,
      completedTasks: 0,
      percentComplete: 0
    },
    // Legacy
    progressPercent: 0,
    isBillingGate: true,
    requiredCompletionRatio: 90
  },
  {
    id: "m4",
    projectId: "1",
    name: "UAT Completion",
    description: "User acceptance testing sign-off from client",
    phase: "enable_users",
    stageId: "st_enable",
    targetDate: "2025-02-20",
    status: "planned",
    ownerId: "2", // Jessica Lin
    scopeType: "rule_based",
    completionMode: "all_tasks",
    completionTargetPercent: 100,
    tags: ["QA", "Client"],
    progress: {
      totalTasks: 15,
      completedTasks: 0,
      percentComplete: 0
    },
    // Legacy
    progressPercent: 0,
    isBillingGate: false,
    requiredCompletionRatio: 100
  },
  {
    id: "m5",
    projectId: "1",
    name: "Go Live",
    description: "Public launch of the new brand",
    phase: "enable_users",
    stageId: "st_enable",
    targetDate: "2025-03-01",
    status: "planned",
    ownerId: "1", // Joy Mason
    scopeType: "manual",
    completionMode: "all_tasks",
    completionTargetPercent: 100,
    tags: ["Launch", "Major"],
    progress: {
      totalTasks: 0,
      completedTasks: 0,
      percentComplete: 0
    },
    // Legacy
    progressPercent: 0,
    isBillingGate: true,
    requiredCompletionRatio: 100
  }
];

export const MILESTONE_SCOPE_RULES: MilestoneScopeRules[] = [
  {
    milestoneId: "m3",
    rules: [
      {
        id: "r1",
        label: "Include all Backend tasks in Develop Stage",
        taskTemplateKey: "backend",
        stage: "develop_solution",
        active: true,
        filters: { includeEpicIds: ["e1", "e2"] }
      }
    ],
    lastEvaluatedAt: "2024-12-10T10:00:00Z"
  }
];

export const MILESTONE_TASK_LINKS: MilestoneTaskLink[] = [
  { id: "l1", milestoneId: "m1", taskId: "8", source: "manual_add" },
  { id: "l2", milestoneId: "m2", taskId: "7", source: "manual_add" },
  { id: "l3", milestoneId: "m3", taskId: "1", source: "rule", ruleId: "r1" },
  { id: "l4", milestoneId: "m3", taskId: "2", source: "rule", ruleId: "r1" },
  { id: "l5", milestoneId: "m3", taskId: "4", source: "rule", ruleId: "r1" },
  { id: "l6", milestoneId: "m3", taskId: "5", source: "rule", ruleId: "r1" },
  { id: "l7", milestoneId: "m4", taskId: "3", source: "manual_add" },
  { id: "l8", milestoneId: "m4", taskId: "6", source: "manual_add" },
];

export const ACTIVITY: Activity[] = [
  { 
    id: "1", 
    user: "Jason Roberts", 
    action: "Commented", 
    target: "Colgate-Palmolive: System Optimization", 
    time: "2 hours ago",
    details: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium..."
  },
  { 
    id: "2", 
    user: "Susan Smith", 
    action: "Marked Complete", 
    target: "Kraft HR: Bug Fixing", 
    time: "3 hours ago",
    details: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium..."
  },
  { 
    id: "3", 
    user: "Jessica Lin", 
    action: "Created New Folder", 
    target: "Quality Matters: Code Review", 
    time: "9:34 AM",
    details: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium..."
  },
];

export const STATS = {
  hoursLogged: 24,
  tasksCompleted: 6,
  activeProjects: 6,
  pendingReimbursement: 1586.56,
  milestones: 8,
  projectRisks: 2,
};

export const COMMENTS: Comment[] = [
  {
    id: "c1",
    taskId: "1",
    authorId: "5",
    authorName: "Jason Roberts",
    body: "I've reviewed the initial PR. There are a few security concerns around the token handling. Please check my comments in the review.",
    createdAt: "2023-11-20T10:30:00Z"
  },
  {
    id: "c2",
    taskId: "1",
    authorId: "6",
    authorName: "Nigel Wong",
    body: "Thanks Jason. I'll address those and push a new commit by EOD.",
    createdAt: "2023-11-20T11:15:00Z"
  }
];

export const ATTACHMENTS: Attachment[] = [
  {
    id: "a1",
    taskId: "2",
    fileName: "dashboard-mockup-v2.fig",
    url: "#",
    fileType: "Figma",
    size: "12 MB",
    uploadedAt: "2023-11-18T14:20:00Z",
    uploadedBy: "Susan Smith"
  },
  {
    id: "a2",
    taskId: "2",
    fileName: "requirements-spec.pdf",
    url: "#",
    fileType: "PDF",
    size: "2.4 MB",
    uploadedAt: "2023-11-15T09:00:00Z",
    uploadedBy: "Joy Mason"
  }
];

export const HISTORY: History[] = [
  {
    id: "h1",
    taskId: "1",
    field: "Status",
    oldValue: "In Progress",
    newValue: "Review",
    changedAt: "2023-11-20T10:00:00Z",
    changedBy: "Nigel Wong"
  },
  {
    id: "h2",
    taskId: "1",
    field: "Priority",
    oldValue: "Medium",
    newValue: "High",
    changedAt: "2023-11-19T16:45:00Z",
    changedBy: "Joy Mason"
  }
];

export const PROJECT_ROLES: ProjectRole[] = [
  {
    id: "r1",
    name: "Project Manager",
    description: "Responsible for overall project delivery, timeline, and budget.",
    roleType: "Management",
    isRequired: true,
    maxAssignees: 1,
    permissions: ["manage_project", "manage_budget", "assign_tasks"]
  },
  {
    id: "r2",
    name: "Lead Designer",
    description: "Owns the design direction and visual language of the project.",
    roleType: "Design",
    isRequired: true,
    maxAssignees: 1,
    permissions: ["manage_design", "approve_design", "assign_tasks"]
  },
  {
    id: "r3",
    name: "Senior Developer",
    description: "Technical lead responsible for architecture and code quality.",
    roleType: "Development",
    isRequired: true,
    maxAssignees: 2,
    permissions: ["manage_code", "approve_pr", "deploy"]
  },
  {
    id: "r4",
    name: "Product Owner",
    description: "Client stakeholder responsible for requirements and acceptance.",
    roleType: "Discovery",
    isRequired: false,
    permissions: ["approve_requirements", "accept_delivery"]
  },
  {
    id: "r5",
    name: "QA Specialist",
    description: "Responsible for testing and quality assurance.",
    roleType: "QA & Testing",
    isRequired: false,
    maxAssignees: 3,
    permissions: ["manage_qa", "report_bugs"]
  }
];

export const ROLE_ASSIGNMENTS: RoleAssignment[] = [
  { id: "ra1", roleId: "r1", userId: "2", isPrimary: true, allocationPercent: 100 }, // Jessica Lin -> PM
  { id: "ra2", roleId: "r2", userId: "3", isPrimary: true, allocationPercent: 80 },  // Susan Smith -> Lead Designer
  { id: "ra3", roleId: "r3", userId: "5", isPrimary: true, allocationPercent: 100 }, // Jason Roberts -> Senior Dev
  { id: "ra4", roleId: "r4", userId: "1", isPrimary: true, allocationPercent: 20 },  // Joy Mason -> Product Owner
  { id: "ra5", roleId: "r2", userId: "6", isPrimary: false, allocationPercent: 50 }, // Nigel Wong -> Designer (Secondary)
  { id: "ra6", roleId: "r5", userId: "7", isPrimary: true, allocationPercent: 100 }, // Steven Ahmed -> QA
];

export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: "rt1",
    name: "Scrum Master",
    description: "Facilitator for an agile development team.",
    defaultRoleType: "Management",
    defaultPermissions: ["manage_sprints", "resolve_blockers"]
  },
  {
    id: "rt2",
    name: "DevOps Engineer",
    description: "Responsible for CI/CD pipelines and infrastructure.",
    defaultRoleType: "Development",
    defaultPermissions: ["manage_infra", "deploy_production"]
  },
  {
    id: "rt3",
    name: "Business Analyst",
    description: "Analyzes business needs and documents requirements.",
    defaultRoleType: "Discovery",
    defaultPermissions: ["write_requirements", "create_user_stories"]
  }
];

export const SAVED_VIEWS: SavedView[] = [
  {
    id: "v1",
    name: "Default Kanban",
    description: "Standard board view for daily standups",
    stageIds: ["s1", "s2", "s3", "s4"],
    viewType: "Kanban",
    visibility: "Global",
    isDefault: true,
    config: { groupBy: "stage" }
  },
  {
    id: "v2",
    name: "My Tasks List",
    description: "List of tasks assigned to me",
    stageIds: [],
    viewType: "List",
    visibility: "Personal",
    isDefault: false,
    config: { filterBy: "assignee:me" }
  },
  {
    id: "v3",
    name: "Release Schedule",
    description: "Calendar view of upcoming releases",
    stageIds: ["s3", "s4", "s5"],
    viewType: "Calendar",
    visibility: "Global",
    isDefault: false,
    config: { showMilestones: true }
  }
];

export const PROJECT_STAGES: ProjectStage[] = [
  { id: "st_plan", name: "Plan Strategy", description: "Define the strategic direction and core requirements.", order: 1, type: "planning", status: "completed" },
  { id: "st_validate", name: "Validate Blueprints", description: "Confirm design and architecture decisions.", order: 2, type: "execution", status: "active" },
  { id: "st_develop", name: "Develop Solution", description: "Build and implement the solution components.", order: 3, type: "execution", status: "pending" },
  { id: "st_enable", name: "Enable Users", description: "Train users and prepare for go-live.", order: 4, type: "delivery", status: "pending" },
];

export const GUIDANCE_ITEMS: GuidanceItem[] = [
  {
    id: "g1",
    title: "Discovery Checklist",
    body: "Ensure all stakeholder interviews are completed and requirements are documented.",
    priority: "High",
    stageId: "s1"
  },
  {
    id: "g2",
    title: "Design Principles",
    body: "Follow the Nymbl Design System 2.0 guidelines for all UI components.",
    priority: "Medium",
    stageId: "s2"
  },
  {
    id: "g3",
    title: "Code Review Standards",
    body: "All PRs must have 2 approvals and pass CI checks before merge.",
    priority: "High",
    stageId: "s3"
  }
];

export const STAGE_TEMPLATES: StageTemplate[] = [
  { id: "st_plan", name: "Plan Strategy", defaultTasks: ["tt1"], defaultRoles: ["rt3"] },
  { id: "st_validate", name: "Validate Blueprints", defaultTasks: ["tt2"], defaultRoles: ["rt2"] },
  { id: "st_develop", name: "Develop Solution", defaultTasks: ["tt3", "tt4"], defaultRoles: ["rt1"] },
  { id: "st_enable", name: "Enable Users", defaultTasks: [], defaultRoles: [] }
];

export const FRAMEWORK_TEMPLATES: FrameworkTemplate[] = [
  { 
    id: "ft_impl", 
    name: "Implementation Framework",
    description: "Standard implementation delivery framework",
    defaultStages: ["st_plan", "st_validate", "st_develop", "st_enable"]
  }
];

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "pt1",
    name: "Implementation Project",
    description: "Standard implementation project using the Nymbl framework",
    defaultFrameworkId: "ft_impl",
    defaultRoles: ["rt1", "rt2", "rt3"],
    defaultDeliverables: ["dt1"],
    thumbnail: "web-app"
  }
];

export const DELIVERABLE_TEMPLATES: DeliverableTemplate[] = [
  {
    id: "dt1",
    title: "MVP Release",
    description: "Standard deliverables for a Minimum Viable Product",
    defaultEpics: ["et1", "et2"]
  },
  {
    id: "dt2",
    title: "Design System",
    description: "Complete design system documentation and assets",
    defaultEpics: ["et3"]
  }
];

export const EPIC_TEMPLATES: EpicTemplate[] = [
  {
    id: "et1",
    title: "User Authentication",
    description: "Setup login, registration, and password recovery",
    defaultStages: ["st_dev", "st_qa"]
  },
  {
    id: "et2",
    title: "Dashboard Setup",
    description: "Main user dashboard with key metrics",
    defaultStages: ["st_design", "st_dev"]
  },
  {
    id: "et3",
    title: "Component Library",
    description: "Core UI components implementation",
    defaultStages: ["st_design", "st_dev", "st_qa"]
  }
];

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: "tt1",
    title: "Setup Auth API",
    description: "Configure backend authentication endpoints",
    defaultPriority: "High",
    defaultEstimateHours: 8,
    requiredRole: "Development"
  },
  {
    id: "tt2",
    title: "Login Page UI",
    description: "Implement login page frontend",
    defaultPriority: "Medium",
    defaultEstimateHours: 6,
    requiredRole: "Development"
  },
  {
    id: "tt3",
    title: "Analytics Widget",
    description: "Create reusable analytics widget",
    defaultPriority: "Medium",
    defaultEstimateHours: 4,
    requiredRole: "Development"
  },
  {
    id: "tt4",
    title: "Button Component",
    description: "Create button component with variants",
    defaultPriority: "Low",
    defaultEstimateHours: 2,
    requiredRole: "Design"
  }
];

export const MAPPING_TEMPLATES: MappingTemplate[] = [
  { id: "mt1", name: "Jira Import", dataType: "Tasks" },
  { id: "mt2", name: "Trello Import", dataType: "Tasks" },
  { id: "mt3", name: "CSV Standard", dataType: "Mixed" },
];
