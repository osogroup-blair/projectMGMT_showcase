export interface SprintStats {
  total: number;
  done: number;
  inProgress: number;
  toDo: number;
  percent: number;
  totalEffort: number;
  doneEffort: number;
}

export interface ScopeRule {
  id: string;
  label: string;
  active: boolean;
  stage: string;
  milestone: string;
  epicType: string;
  taskTemplateKey: string;
}

export const STATUS_CONFIG: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
  "planned": { icon: null, color: "text-slate-500", bgColor: "bg-slate-100", label: "Planned" },
  "active": { icon: null, color: "text-blue-500", bgColor: "bg-blue-100", label: "Active" },
  "closed": { icon: null, color: "text-green-500", bgColor: "bg-green-100", label: "Closed" },
};

export const TASK_STATUS_CONFIG: Record<string, { icon: any; color: string; bgColor: string }> = {
  "Pending": { icon: null, color: "text-slate-500", bgColor: "bg-slate-100" },
  "To Do": { icon: null, color: "text-slate-500", bgColor: "bg-slate-100" },
  "In Progress": { icon: null, color: "text-blue-500", bgColor: "bg-blue-100" },
  "Done": { icon: null, color: "text-green-500", bgColor: "bg-green-100" },
  "Completed": { icon: null, color: "text-green-500", bgColor: "bg-green-100" },
};
