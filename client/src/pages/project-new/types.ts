export interface ProjectData {
  name: string;
  description: string;
  startDate: string;
  dueDate: string;
  sprintDurationWeeks: number;
  ownerId?: string;
  client?: string;
  templateId?: string;
}

export interface WizardDeliverable {
  id: string;
  title: string;
  description: string;
  epics: WizardEpic[];
}

export interface WizardEpic {
  id: string;
  title: string;
  description: string;
}

export interface WizardTaskDraft {
  id: string;
  templateId?: string;
  title: string;
  description: string;
  priority: string;
  estimateHours: number;
  scope: 'once' | 'per_epic';
  assigneeRoleTypeId?: string;
  stageId: string;
  order: number;
}

export interface WizardStage {
  id: string;
  name: string;
  description?: string;
  taskCreationMode: 'none' | 'once' | 'per_epic';
  defaultTasks?: string[];
  defaultRoles?: string[];
  type?: string;
  tasks: WizardTaskDraft[];
}

export interface WizardMilestoneRule {
  scopeType: 'stage' | 'deliverable' | 'epic' | 'all';
  scopeEntityId?: string;
  completionMode: 'all_tasks' | 'percentage' | 'specific_tasks';
  completionTargetPercent?: number;
}

export interface WizardMilestone {
  id: string;
  name: string;
  description: string;
  phase: string;
  targetDate: string;
  ownerId: string;
  isBillingGate: boolean;
  rule: WizardMilestoneRule;
}

export interface WizardRole {
  id: string;
  name: string;
  description?: string;
  roleType: string;
  roleTypeId?: string;
  assigneeId: string | null;
}

export interface WizardTemplateSnippet {
  id: string;
  name: string;
  description?: string;
  type: 'stage' | 'task' | 'milestone' | 'full';
  stageTemplateIds: string[];
  taskTemplateIds: string[];
  milestoneTemplateIds: string[];
}

export interface WizardRoleType {
  id: string;
  label: string;
  description?: string;
}

export interface StepProps {
  projectData: ProjectData;
  setProjectData: React.Dispatch<React.SetStateAction<ProjectData>>;
  deliverables: WizardDeliverable[];
  setDeliverables: React.Dispatch<React.SetStateAction<WizardDeliverable[]>>;
  stages: WizardStage[];
  setStages: React.Dispatch<React.SetStateAction<WizardStage[]>>;
  milestones: WizardMilestone[];
  setMilestones: React.Dispatch<React.SetStateAction<WizardMilestone[]>>;
  roles: WizardRole[];
  setRoles: React.Dispatch<React.SetStateAction<WizardRole[]>>;
  frameworkTemplates?: any[];
  stageTemplates: any[];
  projectTemplatesData: any[];
  deliverableTemplates: any[];
  epicTemplates: any[];
  taskTemplates: any[];
  roleTemplates: any[];
  milestoneTemplates: any[];
  templateSnippets: WizardTemplateSnippet[];
  roleTypes: WizardRoleType[];
  users: any[];
  eligibleUsers: Map<string, any[]>;
  onTemplateSelect: (templateId: string) => void;
  onFrameworkSelect?: (frameworkId: string) => void;
  onSnippetApply: (snippetId: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const STEPS = [
  { id: 1, title: "Project Basics", description: "Name, dates, and basic settings" },
  { id: 2, title: "Work Breakdown", description: "Define deliverables and epics" },
  { id: 3, title: "Stage Configuration", description: "Set up stages, tasks, and milestones" },
  { id: 4, title: "Assignments & Roles", description: "Assign team members by role" },
  { id: 5, title: "Review & Summary", description: "Preview what will be created" },
];

export const DEFAULT_SPRINT_DURATION = 2;
export const DEFAULT_PROJECT_DURATION_WEEKS = 12;

export function getDefaultDueDate(startDate: string, weeksFromStart: number = DEFAULT_PROJECT_DURATION_WEEKS): string {
  const start = new Date(startDate);
  start.setDate(start.getDate() + weeksFromStart * 7);
  return start.toISOString().split('T')[0];
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}
