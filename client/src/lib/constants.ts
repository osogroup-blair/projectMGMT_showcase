export interface StatusOption {
  id: string;
  label: string;
  color: string;
  type?: "stage" | "task";
}

export interface ProjectStage {
  id: string;
  name: string;
  description: string;
  order: number;
  type: "planning" | "execution" | "delivery";
  status: "pending" | "active" | "completed";
}

export interface StageTemplate {
  id: string;
  name: string;
  defaultTasks: string[];
  defaultRoles: string[];
}

export const TASK_STATUS_OPTIONS: StatusOption[] = [
  { id: "ts1", label: "Todo", color: "bg-slate-100 text-slate-700", type: "task" },
  { id: "ts2", label: "In Progress", color: "bg-blue-50 text-blue-700", type: "task" },
  { id: "ts3", label: "Review", color: "bg-amber-50 text-amber-700", type: "task" },
  { id: "ts4", label: "Done", color: "bg-green-50 text-green-700", type: "task" },
];

export const STAGE_STATUS_OPTIONS: StatusOption[] = [
  { id: "ss1", label: "completed", color: "bg-green-50 text-green-700 border-green-200", type: "stage" },
  { id: "ss2", label: "active", color: "bg-blue-50 text-blue-700 border-blue-200", type: "stage" },
  { id: "ss3", label: "pending", color: "bg-muted/50 text-muted-foreground border-muted", type: "stage" },
];

export const DEFAULT_PROJECT_STAGES: ProjectStage[] = [
  { id: "st_plan", name: "Plan Strategy", description: "Define the strategic direction and core requirements.", order: 1, type: "planning", status: "completed" },
  { id: "st_validate", name: "Validate Blueprints", description: "Confirm design and architecture decisions.", order: 2, type: "execution", status: "active" },
  { id: "st_develop", name: "Develop Solution", description: "Build and implement the solution components.", order: 3, type: "execution", status: "pending" },
  { id: "st_enable", name: "Enable Users", description: "Train users and prepare for go-live.", order: 4, type: "delivery", status: "pending" },
];

export const STAGE_TEMPLATES: StageTemplate[] = [
  { id: "st_plan_strategy", name: "Plan Strategy", defaultTasks: ["tt1"], defaultRoles: ["rt3"] },
  { id: "st_validate_blueprint", name: "Validate Blueprint", defaultTasks: ["tt2"], defaultRoles: ["rt2"] },
  { id: "st_develop_solution", name: "Develop Solution", defaultTasks: ["tt3", "tt4"], defaultRoles: ["rt1"] },
  { id: "st_enable_users", name: "Enable Users", defaultTasks: [], defaultRoles: [] }
];
