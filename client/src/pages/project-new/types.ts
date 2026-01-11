export interface ProjectData {
  name: string;
  description: string;
  startDate: string;
  dueDate: string;
  sprintDurationWeeks: number;
  ownerId?: string;
  client?: string;
  templateId?: string;
  frameworkId?: string;
}

export interface WizardDeliverable {
  id: string;
  title: string;
  description: string;
  startDate?: string;
  endDate?: string;
  deliverableTypeId?: string;
  epics: WizardEpic[];
}

export interface WizardEpicTask {
  id: string;
  title: string;
  description?: string;
  priority?: string;
  estimateHours?: number;
  status?: string;
  assigneeId?: string;
  deadline?: string;
  externalId?: string;
  taskTypeId?: string;
}

export interface WizardEpic {
  id: string;
  title: string;
  description: string;
  startDate?: string;
  endDate?: string;
  epicTypeId?: string;
  tasks?: WizardEpicTask[];
}

export type TaskMappingStatus = 'mapped' | 'orphaned' | 'manual' | 'skipped';

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
  sourceEpicId?: string;
  sourceEpicTitle?: string;
  assignedEpicId?: string;
  assignedEpicTitle?: string;
  mappingStatus?: TaskMappingStatus;
  startDate?: string;
  deadline?: string;
  datesInheritedFromStage?: boolean;
  taskTypeId?: string;
  assigneeId?: string;
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
  startDate?: string;
  endDate?: string;
}

/**
 * Calculate proportional stage dates based on project start/end dates
 * Distributes stages evenly across the project timeline
 */
export function calculateStageDates(
  stages: WizardStage[],
  projectStartDate: string,
  projectDueDate: string
): WizardStage[] {
  if (stages.length === 0 || !projectStartDate || !projectDueDate) {
    return stages;
  }
  
  const start = new Date(projectStartDate);
  const end = new Date(projectDueDate);
  const totalDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const daysPerStage = Math.floor(totalDays / stages.length);
  
  return stages.map((stage, index) => {
    const stageStart = new Date(start);
    stageStart.setDate(stageStart.getDate() + (index * daysPerStage));
    
    const stageEnd = new Date(start);
    if (index === stages.length - 1) {
      // Last stage ends on project due date
      stageEnd.setTime(end.getTime());
    } else {
      stageEnd.setDate(stageEnd.getDate() + ((index + 1) * daysPerStage) - 1);
    }
    
    return {
      ...stage,
      startDate: stageStart.toISOString().split('T')[0],
      endDate: stageEnd.toISOString().split('T')[0]
    };
  });
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
  templateId?: string;
  isCore?: boolean;
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
  deliverableTypes?: any[];
  epicTypes?: any[];
  taskTypes?: any[];
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
  { id: 3, title: "Task Alignment", description: "Map tasks to epics" },
  { id: 4, title: "Stage Configuration", description: "Set up stages, tasks, and milestones" },
  { id: 5, title: "Assignments & Roles", description: "Assign team members by role" },
  { id: 6, title: "Review & Summary", description: "Preview what will be created" },
];

export const DEFAULT_SPRINT_DURATION = 2;
export const DEFAULT_PROJECT_DURATION_WEEKS = 12;

export const CORE_PROJECT_ROLES = [
  { 
    templateId: "rt_project_manager", 
    name: "Project Manager", 
    description: "Owns overall project execution, timeline, and stakeholder communication",
    roleType: "Management",
    isCore: true
  },
  { 
    templateId: "rt_team_member", 
    name: "Team Member", 
    description: "General team contributor assigned to project work",
    roleType: "General",
    isCore: true
  }
];

export function getDefaultDueDate(startDate: string, weeksFromStart: number = DEFAULT_PROJECT_DURATION_WEEKS): string {
  const start = new Date(startDate);
  start.setDate(start.getDate() + weeksFromStart * 7);
  return start.toISOString().split('T')[0];
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}
