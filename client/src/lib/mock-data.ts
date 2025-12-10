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
  project: string;
  status: "Todo" | "In Progress" | "Review" | "Done";
  deadline: string;
  priority: "Low" | "Medium" | "High";
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

export const PROJECTS: Project[] = [
  { id: "1", name: "Houlihan Lokey Rebrand", status: "In Progress", deadline: "11/28", progress: 65 },
  { id: "2", name: "Colgate-Palmolive Retool", status: "Upcoming", deadline: "Tomorrow", progress: 0 },
  { id: "3", name: "Kraft HR", status: "On Hold", deadline: "11/30", progress: 30 },
  { id: "4", name: "SDMP Internal Project", status: "Completed", deadline: "Yesterday", progress: 100 },
  { id: "5", name: "Quality Matters", status: "Overdue", deadline: "Yesterday", progress: 85 },
];

export const TASKS: Task[] = [
  { id: "1", title: "Code Review", project: "Quality Matters", status: "Review", deadline: "Tomorrow", priority: "High" },
  { id: "2", title: "Feature Implementation", project: "Houlihan Lokey", status: "In Progress", deadline: "11/28", priority: "Medium" },
  { id: "3", title: "Bug Fixing", project: "Kraft HR", status: "Todo", deadline: "11/29", priority: "High" },
  { id: "4", title: "System Optimization", project: "Colgate-Palmolive", status: "Todo", deadline: "Tomorrow", priority: "Medium" },
  { id: "5", title: "API Development", project: "Houlihan Lokey", status: "Todo", deadline: "11/30", priority: "High" },
  { id: "6", title: "Testing and QA", project: "Kraft", status: "Todo", deadline: "11/30", priority: "Low" },
];

export const TEAM: TeamMember[] = [
  { id: "1", name: "Joy Mason", role: "Product Manager", status: "Online" },
  { id: "2", name: "Jessica Lin", role: "Project Manager", status: "In Meeting" },
  { id: "3", name: "Susan Smith", role: "UX Designer", status: "Online" },
  { id: "4", name: "Jason Ho", role: "CEO", status: "Offline" },
  { id: "5", name: "Jason Roberts", role: "Senior Developer", status: "Online" },
  { id: "6", name: "Nigel Wong", role: "UX Designer", status: "Offline" },
  { id: "7", name: "Steven Ahmed", role: "UX Designer", status: "In Meeting" },
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
