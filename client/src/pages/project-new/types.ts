export interface ProjectData {
  name: string;
  description: string;
  frameworkId: string;
  templateId: string;
  startDate: string;
  dueDate: string;
  sprintDurationWeeks: number;
  ownerId?: string;
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
  tasks: any[];
}

export interface WizardStage {
  id: string;
  name: string;
  description?: string;
  taskCreationMode: 'none' | 'once' | 'per_epic';
  defaultTasks?: string[];
  defaultRoles?: string[];
  type?: string;
}

export interface WizardMilestone {
  id: string;
  name: string;
  description: string;
  phase: string;
  stageId: string;
  targetDate: string;
  ownerId: string;
  scopeType: string;
  completionMode: string;
  completionTargetPercent: number;
  isBillingGate: boolean;
}

export interface WizardRole {
  id: string;
  name: string;
  description?: string;
  roleType: string;
  assigneeId: string | null;
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
  frameworkTemplates: any[];
  stageTemplates: any[];
  projectTemplatesData: any[];
  deliverableTemplates: any[];
  epicTemplates: any[];
  taskTemplates: any[];
  roleTemplates: any[];
  users: any[];
  onTemplateSelect: (templateId: string) => void;
  onFrameworkSelect: (frameworkId: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const STEPS = [
  { id: 1, title: "Project Basics", description: "Name, framework, and templates" },
  { id: 2, title: "Work Breakdown", description: "Deliverables, epics, and tasks" },
  { id: 3, title: "Stage Configuration", description: "Review and customize stages" },
  { id: 4, title: "Set Milestones", description: "Define key dates and gates" },
  { id: 5, title: "Team & Roles", description: "Assign team members" },
  { id: 6, title: "Review", description: "Verify and create" },
];
