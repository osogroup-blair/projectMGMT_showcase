export interface TaskDetailContext {
  task: any;
  projectId: string;
  taskId: string;
  isLoading: boolean;
}

export interface TaskTabProps {
  task: any;
  projectId: string;
}

export interface TaskOverviewTabProps extends TaskTabProps {
  updateTask: (field: string, value: any) => void;
}

export interface TaskSubtasksTabProps extends TaskTabProps {
  subtasks: any[];
  createSubtask: (data: any) => void;
  updateTask: (data: { id: string; updates: any }) => void;
}

export interface TaskDependenciesTabProps extends TaskTabProps {
  taskId: string;
  allTasks: any[];
  stages: any[];
  allEpics: any[];
  milestones: any[];
  dependsOn: any[];
  dependents: any[];
  addDependency: (taskId: string) => void;
  removeDependency: (depId: string) => void;
}

export interface TaskAttachmentsTabProps extends TaskTabProps {}

export interface TaskHistoryTabProps extends TaskTabProps {}
