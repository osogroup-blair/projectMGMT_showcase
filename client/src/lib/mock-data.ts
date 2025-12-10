import { LucideIcon, LayoutDashboard, Settings, CheckSquare, Workflow, Wallet, Timer, Users, BookOpen, AlertCircle, CheckCircle2, Clock, PlayCircle } from "lucide-react";

export interface Project {
  id: string;
  name: string;
  status: "Upcoming" | "In Progress" | "Completed" | "On Hold" | "Archived" | "Overdue";
  deadline: string;
  progress?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  project: string;
  stageId?: string;
  status: "Todo" | "In Progress" | "Review" | "Done";
  assigneeId?: string;
  deadline: string;
  priority: "Low" | "Medium" | "High";
  milestoneId?: string;
  estimateHours?: number;
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
  name: string;
  description: string;
  stageId: string;
  targetDate: string;
  status: "Pending" | "In Progress" | "Completed" | "Blocked" | "Skipped";
  ownerId: string;
  progressPercent: number;
  isBillingGate: boolean;
  requiredCompletionRatio: number;
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

export const PROJECTS: Project[] = [
  { id: "1", name: "Houlihan Lokey Rebrand", status: "In Progress", deadline: "11/28", progress: 65 },
  { id: "2", name: "Colgate-Palmolive Retool", status: "Upcoming", deadline: "Tomorrow", progress: 0 },
  { id: "3", name: "Kraft HR", status: "On Hold", deadline: "11/30", progress: 30 },
  { id: "4", name: "SDMP Internal Project", status: "Completed", deadline: "Yesterday", progress: 100 },
  { id: "5", name: "Quality Matters", status: "Overdue", deadline: "Yesterday", progress: 85 },
];

export const TEAM: TeamMember[] = [
  { id: "1", name: "Joy Mason", role: "Product Manager", status: "Online", email: "joy.mason@nexus.com" },
  { id: "2", name: "Jessica Lin", role: "Project Manager", status: "In Meeting", email: "jessica.lin@nexus.com" },
  { id: "3", name: "Susan Smith", role: "UX Designer", status: "Online", email: "susan.smith@nexus.com" },
  { id: "4", name: "Jason Ho", role: "CEO", status: "Offline", email: "jason.ho@nexus.com" },
  { id: "5", name: "Jason Roberts", role: "Senior Developer", status: "Online", email: "jason.roberts@nexus.com" },
  { id: "6", name: "Nigel Wong", role: "UX Designer", status: "Offline", email: "nigel.wong@nexus.com" },
  { id: "7", name: "Steven Ahmed", role: "UX Designer", status: "In Meeting", email: "steven.ahmed@nexus.com" },
];

export const TASKS: Task[] = [
  { 
    id: "1", 
    title: "Code Review", 
    description: "Review pull requests for the authentication module. Focus on security vulnerabilities and code style consistency.",
    project: "Quality Matters", 
    stageId: "s3",
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
    stageId: "s3",
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
    stageId: "s4",
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
    stageId: "s3",
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
    stageId: "s3",
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
    stageId: "s4",
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
    stageId: "s2",
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
    stageId: "s1",
    status: "Done", 
    deadline: "Last Week", 
    priority: "High",
    assigneeId: "1", // Joy Mason
    milestoneId: "m1",
    estimateHours: 2,
    tags: ["Management", "Client"]
  },
];

export const MILESTONES: Milestone[] = [
  {
    id: "m1",
    name: "Strategy Sign-off",
    description: "Final approval of brand strategy and core messaging",
    stageId: "s1", // Discovery
    targetDate: "2024-12-15",
    status: "Completed",
    ownerId: "1", // Joy Mason
    progressPercent: 100,
    isBillingGate: true,
    requiredCompletionRatio: 100
  },
  {
    id: "m2",
    name: "Visual Identity Presentation",
    description: "Presenting the 3 directions for visual identity",
    stageId: "s2", // Design
    targetDate: "2025-01-10",
    status: "In Progress",
    ownerId: "3", // Susan Smith
    progressPercent: 60,
    isBillingGate: false,
    requiredCompletionRatio: 80
  },
  {
    id: "m3",
    name: "Alpha Release",
    description: "Internal release for team testing",
    stageId: "s3", // Development
    targetDate: "2025-02-01",
    status: "Pending",
    ownerId: "5", // Jason Roberts
    progressPercent: 0,
    isBillingGate: true,
    requiredCompletionRatio: 90
  },
  {
    id: "m4",
    name: "UAT Completion",
    description: "User acceptance testing sign-off from client",
    stageId: "s4", // QA & Testing
    targetDate: "2025-02-20",
    status: "Pending",
    ownerId: "2", // Jessica Lin
    progressPercent: 0,
    isBillingGate: false,
    requiredCompletionRatio: 100
  },
  {
    id: "m5",
    name: "Go Live",
    description: "Public launch of the new brand",
    stageId: "s5", // Launch
    targetDate: "2025-03-01",
    status: "Pending",
    ownerId: "1", // Joy Mason
    progressPercent: 0,
    isBillingGate: true,
    requiredCompletionRatio: 100
  }
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
