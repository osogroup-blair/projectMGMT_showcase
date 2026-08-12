import { firestoreDb as db } from "../db";
import crypto from "crypto";
import type {
  User, InsertUser,
  Project, InsertProject,
  Deliverable, InsertDeliverable,
  Epic, InsertEpic,
  Task, InsertTask,
  Milestone, InsertMilestone,
  MilestoneScopeRule, InsertMilestoneScopeRule,
  MilestoneTaskLink, InsertMilestoneTaskLink,
  Sprint, InsertSprint,
  SprintMember, InsertSprintMember,
  SprintScopeEvent, InsertSprintScopeEvent,
  SprintScopeTarget, InsertSprintScopeTarget,
  SprintPulseUpdate, InsertSprintPulseUpdate,
  Activity, InsertActivity,
  Comment, InsertComment,
  Attachment, InsertAttachment,
  History, InsertHistory,
  ProjectRole, InsertProjectRole,
  ProjectTeamMember, InsertProjectTeamMember,
  ProjectHighLevelRole, InsertProjectHighLevelRole,
  ExecutionRoleAssignment, InsertExecutionRoleAssignment,
  RoleTemplate, InsertRoleTemplate,
  SavedView, InsertSavedView,
  GuidanceItem, InsertGuidanceItem,
  ProjectStage, InsertProjectStage,
  FrameworkTemplate, InsertFrameworkTemplate,
  StageTemplate, InsertStageTemplate,
  ProjectTemplate, InsertProjectTemplate,
  DeliverableTemplate, InsertDeliverableTemplate,
  EpicTemplate, InsertEpicTemplate,
  TaskTemplate, InsertTaskTemplate,
  MappingTemplate, InsertMappingTemplate,
  MilestoneTemplate, InsertMilestoneTemplate,
  TemplateSnippet, InsertTemplateSnippet,
  StatusOption, InsertStatusOption,
  ProjectTaskStatus, InsertProjectTaskStatus,
  ProjectSettings, InsertProjectSettings,
  RoleType, InsertRoleType,
  UserPreferences, InsertUserPreferences,
  WorkBlock, InsertWorkBlock,
  DayPlan, InsertDayPlan,
  ProjectFavorite, InsertProjectFavorite,
  TaskType, InsertTaskType,
  ProjectTaskType, InsertProjectTaskType,
  TaskDependency, InsertTaskDependency,
  TaskDependencyScopeRule, InsertTaskDependencyScopeRule,
  EpicType, InsertEpicType,
  DeliverableType, InsertDeliverableType,
  UserIdentity, InsertUserIdentity,
  UserRoleEligibility,
  Client, InsertClient,
  ClientUser, InsertClientUser,
  AppSettings,
  Theme, InsertTheme,
} from "@shared/schema";

// Firestore Helper functions
async function getAllDocs<T>(colName: string): Promise<T[]> {
  const snapshot = await db.collection(colName).get();
  return snapshot.docs.map(doc => {
    const data = doc.data();
    for (const key of Object.keys(data)) {
      if (data[key] && typeof data[key].toDate === 'function') {
        data[key] = data[key].toDate();
      }
    }
    return { id: doc.id, ...data } as unknown as T;
  });
}

async function getDocById<T>(colName: string, id: string): Promise<T | undefined> {
  const doc = await db.collection(colName).doc(id).get();
  if (!doc.exists) return undefined;
  const data = doc.data()!;
  for (const key of Object.keys(data)) {
    if (data[key] && typeof data[key].toDate === 'function') {
      data[key] = data[key].toDate();
    }
  }
  return { id: doc.id, ...data } as unknown as T;
}

async function createDoc<T>(colName: string, data: any): Promise<T> {
  const id = data.id || crypto.randomUUID();
  const cleanData = { ...data };
  delete cleanData.id;
  for (const key of Object.keys(cleanData)) {
    if (cleanData[key] === undefined) {
      delete cleanData[key];
    }
  }
  const now = new Date();
  if (!cleanData.createdAt) cleanData.createdAt = now;
  if (!cleanData.updatedAt) cleanData.updatedAt = now;

  await db.collection(colName).doc(id).set(cleanData);
  return { id, ...cleanData } as unknown as T;
}

async function updateDoc<T>(colName: string, id: string, data: any): Promise<T> {
  const cleanData = { ...data };
  delete cleanData.id;
  for (const key of Object.keys(cleanData)) {
    if (cleanData[key] === undefined) {
      delete cleanData[key];
    }
  }
  cleanData.updatedAt = new Date();
  await db.collection(colName).doc(id).update(cleanData);
  const updated = await getDocById<T>(colName, id);
  if (!updated) throw new Error(`Document ${id} not found in ${colName}`);
  return updated;
}

async function deleteDoc(colName: string, id: string): Promise<void> {
  await db.collection(colName).doc(id).delete();
}

export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // User Identities
  getUserIdentities(): Promise<UserIdentity[]>;
  getUserIdentitiesByUserId(userId: string): Promise<UserIdentity[]>;
  createUserIdentity(identity: InsertUserIdentity): Promise<UserIdentity>;
  deleteUserIdentity(id: string): Promise<void>;

  // Clients
  getAllClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<Client>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<void>;

  // Client Users
  getClientUsers(clientId: string): Promise<ClientUser[]>;
  getUserClients(userId: string): Promise<Client[]>;
  createClientUser(clientUser: InsertClientUser): Promise<ClientUser>;
  updateClientUserRole(clientId: string, userId: string, role: string): Promise<ClientUser | undefined>;
  deleteClientUser(clientId: string, userId: string): Promise<void>;

  // Projects
  getProjects(): Promise<Project[]>;
  getProjectsPaginated(params: {
    limit?: number;
    offset?: number;
    search?: string;
    status?: string;
    riskLevel?: string;
    userId?: string;
    role?: string;
    favoriteOnly?: boolean;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<{ data: Project[]; total: number; limit: number; offset: number }>;
  getProjectById(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<Project>): Promise<Project>;
  deleteProject(id: string): Promise<void>;

  // Deliverables
  getDeliverables(): Promise<Deliverable[]>;
  getDeliverableById(id: string): Promise<Deliverable | undefined>;
  getDeliverablesByProjectId(projectId: string): Promise<Deliverable[]>;
  createDeliverable(deliverable: InsertDeliverable): Promise<Deliverable>;
  updateDeliverable(id: string, deliverable: Partial<Deliverable>): Promise<Deliverable>;
  deleteDeliverable(id: string): Promise<void>;

  // Epics
  getEpics(): Promise<Epic[]>;
  getEpicById(id: string): Promise<Epic | undefined>;
  getEpicsByDeliverableId(deliverableId: string): Promise<Epic[]>;
  createEpic(epic: InsertEpic): Promise<Epic>;
  updateEpic(id: string, epic: Partial<Epic>): Promise<Epic>;
  deleteEpic(id: string): Promise<void>;

  // Tasks
  getTasks(): Promise<Task[]>;
  getTaskById(id: string): Promise<Task | undefined>;
  getTasksByProjectId(projectId: string): Promise<Task[]>;
  getProjectTasksPaginated(options: {
    projectId: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    search?: string;
    statuses?: string[];
    priorities?: string[];
    stageIds?: string[];
    epicIds?: string[];
    assigneeIds?: string[];
    sprintIds?: string[];
    taskTypeIds?: string[];
    dueDateFrom?: string;
    dueDateTo?: string;
    myTasksOnly?: string;
  }): Promise<{ tasks: Task[]; total: number; page: number; pageSize: number; totalPages: number }>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<Task>): Promise<Task>;
  deleteTask(id: string): Promise<void>;

  // Milestones
  getMilestones(): Promise<Milestone[]>;
  getMilestoneById(id: string): Promise<Milestone | undefined>;
  getMilestonesByProjectId(projectId: string): Promise<Milestone[]>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  updateMilestone(id: string, milestone: Partial<Milestone>): Promise<Milestone>;
  deleteMilestone(id: string): Promise<void>;

  // Milestone Scope Rules
  getMilestoneScopeRules(): Promise<MilestoneScopeRule[]>;
  getMilestoneScopeRuleById(id: string): Promise<MilestoneScopeRule | undefined>;
  getMilestoneScopeRulesByMilestoneId(milestoneId: string): Promise<MilestoneScopeRule[]>;
  createMilestoneScopeRule(rule: InsertMilestoneScopeRule): Promise<MilestoneScopeRule>;
  updateMilestoneScopeRule(id: string, rule: Partial<MilestoneScopeRule>): Promise<MilestoneScopeRule>;
  deleteMilestoneScopeRule(id: string): Promise<void>;

  // Milestone Task Links
  getMilestoneTaskLinks(): Promise<MilestoneTaskLink[]>;
  getMilestoneTaskLinkById(id: string): Promise<MilestoneTaskLink | undefined>;
  getMilestoneTaskLinksByMilestoneId(milestoneId: string): Promise<MilestoneTaskLink[]>;
  createMilestoneTaskLink(link: InsertMilestoneTaskLink): Promise<MilestoneTaskLink>;
  updateMilestoneTaskLink(id: string, link: Partial<MilestoneTaskLink>): Promise<MilestoneTaskLink>;
  deleteMilestoneTaskLink(id: string): Promise<void>;

  // Activity
  getActivity(): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  deleteActivity(id: string): Promise<void>;

  // Comments
  getComments(): Promise<Comment[]>;
  getCommentById(id: string): Promise<Comment | undefined>;
  getCommentsByTaskId(taskId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: string, comment: Partial<Comment>): Promise<Comment>;
  deleteComment(id: string): Promise<void>;

  // Attachments
  getAttachments(): Promise<Attachment[]>;
  getAttachmentById(id: string): Promise<Attachment | undefined>;
  getAttachmentsByTaskId(taskId: string): Promise<Attachment[]>;
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  updateAttachment(id: string, attachment: Partial<Attachment>): Promise<Attachment>;
  deleteAttachment(id: string): Promise<void>;

  // History
  getHistory(): Promise<History[]>;
  getHistoryById(id: string): Promise<History | undefined>;
  getHistoryByTaskId(taskId: string): Promise<History[]>;
  createHistory(history: InsertHistory): Promise<History>;
  updateHistory(id: string, history: Partial<History>): Promise<History>;

  // Project Roles
  getProjectRoles(): Promise<ProjectRole[]>;
  getProjectRoleById(id: string): Promise<ProjectRole | undefined>;
  getProjectRolesByProjectId(projectId: string): Promise<ProjectRole[]>;
  createProjectRole(role: InsertProjectRole): Promise<ProjectRole>;
  updateProjectRole(id: string, role: Partial<ProjectRole>): Promise<ProjectRole>;
  deleteProjectRole(id: string): Promise<void>;

  // Project Team Members
  getProjectTeamMembers(projectId: string): Promise<ProjectTeamMember[]>;
  getProjectTeamMemberById(id: string): Promise<ProjectTeamMember | undefined>;
  getProjectTeamMemberByUserAndProject(projectId: string, userId: string): Promise<ProjectTeamMember | undefined>;
  getProjectTeamMembersByUser(userId: string): Promise<ProjectTeamMember[]>;
  createProjectTeamMember(member: InsertProjectTeamMember): Promise<ProjectTeamMember>;
  updateProjectTeamMember(id: string, member: Partial<ProjectTeamMember>): Promise<ProjectTeamMember>;
  deleteProjectTeamMember(id: string): Promise<void>;

  // High-Level Project Roles
  getHighLevelRoles(teamMemberId: string): Promise<ProjectHighLevelRole[]>;
  getHighLevelRolesByProject(projectId: string): Promise<ProjectHighLevelRole[]>;
  createHighLevelRole(role: InsertProjectHighLevelRole): Promise<ProjectHighLevelRole>;
  deleteHighLevelRole(id: string): Promise<void>;
  deleteHighLevelRolesByTeamMember(teamMemberId: string): Promise<void>;

  // Execution Role Assignments
  getExecutionRoleAssignments(teamMemberId: string): Promise<ExecutionRoleAssignment[]>;
  getExecutionRoleAssignmentsByProject(projectId: string): Promise<ExecutionRoleAssignment[]>;
  createExecutionRoleAssignment(assignment: InsertExecutionRoleAssignment): Promise<ExecutionRoleAssignment>;
  deleteExecutionRoleAssignment(id: string): Promise<void>;
  deleteExecutionRoleAssignmentsByTeamMember(teamMemberId: string): Promise<void>;

  // Role Templates
  getRoleTemplates(): Promise<RoleTemplate[]>;
  getRoleTemplateById(id: string): Promise<RoleTemplate | undefined>;
  createRoleTemplate(template: InsertRoleTemplate): Promise<RoleTemplate>;
  updateRoleTemplate(id: string, template: Partial<RoleTemplate>): Promise<RoleTemplate>;
  deleteRoleTemplate(id: string): Promise<void>;

  // Saved Views
  getSavedViews(): Promise<SavedView[]>;
  getSavedViewById(id: string): Promise<SavedView | undefined>;
  createSavedView(view: InsertSavedView): Promise<SavedView>;
  updateSavedView(id: string, view: Partial<SavedView>): Promise<SavedView>;
  deleteSavedView(id: string): Promise<void>;

  // Guidance Items
  getGuidanceItems(): Promise<GuidanceItem[]>;
  getGuidanceItemById(id: string): Promise<GuidanceItem | undefined>;
  createGuidanceItem(item: InsertGuidanceItem): Promise<GuidanceItem>;
  updateGuidanceItem(id: string, item: Partial<GuidanceItem>): Promise<GuidanceItem>;
  deleteGuidanceItem(id: string): Promise<void>;

  // Project Stages
  getProjectStages(): Promise<ProjectStage[]>;
  getProjectStagesByProjectId(projectId: string): Promise<ProjectStage[]>;
  getProjectStageById(id: string): Promise<ProjectStage | undefined>;
  createProjectStage(stage: InsertProjectStage): Promise<ProjectStage>;
  updateProjectStage(id: string, stage: Partial<ProjectStage>): Promise<ProjectStage>;
  deleteProjectStage(id: string): Promise<void>;

  // Project Epics (by project)
  getEpicsByProjectId(projectId: string): Promise<Epic[]>;

  // Framework Templates
  getFrameworkTemplates(): Promise<FrameworkTemplate[]>;
  getFrameworkTemplateById(id: string): Promise<FrameworkTemplate | undefined>;
  createFrameworkTemplate(template: InsertFrameworkTemplate): Promise<FrameworkTemplate>;
  updateFrameworkTemplate(id: string, template: Partial<FrameworkTemplate>): Promise<FrameworkTemplate>;
  deleteFrameworkTemplate(id: string): Promise<void>;

  // Stage Templates
  getStageTemplates(): Promise<StageTemplate[]>;
  getStageTemplateById(id: string): Promise<StageTemplate | undefined>;
  createStageTemplate(template: InsertStageTemplate): Promise<StageTemplate>;
  updateStageTemplate(id: string, template: Partial<StageTemplate>): Promise<StageTemplate>;
  deleteStageTemplate(id: string): Promise<void>;

  // Project Templates
  getProjectTemplates(): Promise<ProjectTemplate[]>;
  getProjectTemplateById(id: string): Promise<ProjectTemplate | undefined>;
  createProjectTemplate(template: InsertProjectTemplate): Promise<ProjectTemplate>;
  updateProjectTemplate(id: string, template: Partial<ProjectTemplate>): Promise<ProjectTemplate>;
  deleteProjectTemplate(id: string): Promise<void>;

  // Deliverable Templates
  getDeliverableTemplates(): Promise<DeliverableTemplate[]>;
  getDeliverableTemplateById(id: string): Promise<DeliverableTemplate | undefined>;
  createDeliverableTemplate(template: InsertDeliverableTemplate): Promise<DeliverableTemplate>;
  updateDeliverableTemplate(id: string, template: Partial<DeliverableTemplate>): Promise<DeliverableTemplate>;
  deleteDeliverableTemplate(id: string): Promise<void>;

  // Epic Templates
  getEpicTemplates(): Promise<EpicTemplate[]>;
  getEpicTemplateById(id: string): Promise<EpicTemplate | undefined>;
  createEpicTemplate(template: InsertEpicTemplate): Promise<EpicTemplate>;
  updateEpicTemplate(id: string, template: Partial<EpicTemplate>): Promise<EpicTemplate>;
  deleteEpicTemplate(id: string): Promise<void>;

  // Task Templates
  getTaskTemplates(): Promise<TaskTemplate[]>;
  getTaskTemplateById(id: string): Promise<TaskTemplate | undefined>;
  createTaskTemplate(template: InsertTaskTemplate): Promise<TaskTemplate>;
  updateTaskTemplate(id: string, template: Partial<TaskTemplate>): Promise<TaskTemplate>;
  deleteTaskTemplate(id: string): Promise<void>;

  // Mapping Templates
  getMappingTemplates(): Promise<MappingTemplate[]>;
  getMappingTemplateById(id: string): Promise<MappingTemplate | undefined>;
  createMappingTemplate(template: InsertMappingTemplate): Promise<MappingTemplate>;
  updateMappingTemplate(id: string, template: Partial<MappingTemplate>): Promise<MappingTemplate>;
  deleteMappingTemplate(id: string): Promise<void>;

  // Milestone Templates
  getMilestoneTemplates(): Promise<MilestoneTemplate[]>;
  getMilestoneTemplateById(id: string): Promise<MilestoneTemplate | undefined>;
  createMilestoneTemplate(template: InsertMilestoneTemplate): Promise<MilestoneTemplate>;
  updateMilestoneTemplate(id: string, template: Partial<MilestoneTemplate>): Promise<MilestoneTemplate>;
  deleteMilestoneTemplate(id: string): Promise<void>;

  // Template Snippets
  getTemplateSnippets(): Promise<TemplateSnippet[]>;
  getTemplateSnippetById(id: string): Promise<TemplateSnippet | undefined>;
  createTemplateSnippet(snippet: InsertTemplateSnippet): Promise<TemplateSnippet>;
  updateTemplateSnippet(id: string, snippet: Partial<TemplateSnippet>): Promise<TemplateSnippet>;
  deleteTemplateSnippet(id: string): Promise<void>;

  // Status Options
  getStatusOptions(): Promise<StatusOption[]>;
  getStatusOptionById(id: string): Promise<StatusOption | undefined>;
  getStatusOptionsByType(type: string): Promise<StatusOption[]>;
  getDefaultStatusByType(type: string): Promise<string>;
  validateAndResolveStatus(status: string | null | undefined, type: string): Promise<string>;
  createStatusOption(option: InsertStatusOption): Promise<StatusOption>;
  updateStatusOption(id: string, option: Partial<StatusOption>): Promise<StatusOption>;
  deleteStatusOption(id: string): Promise<void>;

  // Status Usage and Remapping
  getStatusUsageCounts(statusLabel: string): Promise<{
    projects: number;
    deliverables: number;
    epics: number;
    tasks: number;
    sprints: number;
    milestones: number;
    projectStages: number;
    workBlocks: number;
    total: number;
  }>;
  remapStatus(oldStatus: string, newStatus: string, entityTypes?: string[]): Promise<{
    projects: number;
    deliverables: number;
    epics: number;
    tasks: number;
    sprints: number;
    milestones: number;
    projectStages: number;
    workBlocks: number;
    total: number;
  }>;

  // Role Types
  getRoleTypes(): Promise<RoleType[]>;
  getRoleTypeById(id: string): Promise<RoleType | undefined>;
  createRoleType(roleType: InsertRoleType): Promise<RoleType>;
  updateRoleType(id: string, roleType: Partial<RoleType>): Promise<RoleType>;
  deleteRoleType(id: string): Promise<void>;

  // Project Task Statuses
  getProjectTaskStatuses(): Promise<ProjectTaskStatus[]>;
  getProjectTaskStatusById(id: string): Promise<ProjectTaskStatus | undefined>;
  getProjectTaskStatusesByProjectId(projectId: string): Promise<ProjectTaskStatus[]>;
  createProjectTaskStatus(status: InsertProjectTaskStatus): Promise<ProjectTaskStatus>;
  updateProjectTaskStatus(id: string, status: Partial<ProjectTaskStatus>): Promise<ProjectTaskStatus>;
  deleteProjectTaskStatus(id: string): Promise<void>;
  deleteProjectTaskStatusesByProjectId(projectId: string): Promise<void>;

  // Project Settings
  getProjectSettings(): Promise<ProjectSettings[]>;
  getProjectSettingsById(id: string): Promise<ProjectSettings | undefined>;
  getProjectSettingsByProjectId(projectId: string): Promise<ProjectSettings | undefined>;
  createProjectSettings(settings: InsertProjectSettings): Promise<ProjectSettings>;
  updateProjectSettings(id: string, settings: Partial<ProjectSettings>): Promise<ProjectSettings>;
  upsertProjectSettings(projectId: string, settings: Partial<InsertProjectSettings>): Promise<ProjectSettings>;

  // Sprints
  getSprints(): Promise<Sprint[]>;
  getSprintById(id: string): Promise<Sprint | undefined>;
  getSprintsByProjectId(projectId: string): Promise<Sprint[]>;
  createSprint(sprint: InsertSprint): Promise<Sprint>;
  updateSprint(id: string, sprint: Partial<Sprint>): Promise<Sprint>;
  deleteSprint(id: string): Promise<void>;

  // Sprint Members
  getSprintMembers(): Promise<SprintMember[]>;
  getSprintMemberById(id: string): Promise<SprintMember | undefined>;
  getSprintMembersBySprintId(sprintId: string): Promise<SprintMember[]>;
  createSprintMember(member: InsertSprintMember): Promise<SprintMember>;
  updateSprintMember(id: string, member: Partial<SprintMember>): Promise<SprintMember>;
  deleteSprintMember(id: string): Promise<void>;

  // Sprint Scope Events
  getSprintScopeEvents(): Promise<SprintScopeEvent[]>;
  getSprintScopeEventsBySprintId(sprintId: string): Promise<SprintScopeEvent[]>;
  createSprintScopeEvent(event: InsertSprintScopeEvent): Promise<SprintScopeEvent>;

  // Sprint Scope Targets
  getSprintScopeTargets(): Promise<SprintScopeTarget[]>;
  getSprintScopeTargetsBySprintId(sprintId: string): Promise<SprintScopeTarget[]>;
  createSprintScopeTarget(target: InsertSprintScopeTarget): Promise<SprintScopeTarget>;
  deleteSprintScopeTarget(id: string): Promise<void>;
  deleteSprintScopeTargetsBySprintId(sprintId: string): Promise<void>;

  // Sprint Pulse Updates
  getSprintPulseUpdates(): Promise<SprintPulseUpdate[]>;
  getSprintPulseUpdatesBySprintId(sprintId: string): Promise<SprintPulseUpdate[]>;
  getSprintPulseUpdateByUserAndDate(sprintId: string, userId: string, date: string): Promise<SprintPulseUpdate | undefined>;
  createSprintPulseUpdate(update: InsertSprintPulseUpdate): Promise<SprintPulseUpdate>;
  updateSprintPulseUpdate(id: string, update: Partial<SprintPulseUpdate>): Promise<SprintPulseUpdate>;
  deleteSprintPulseUpdate(id: string): Promise<void>;

  // Project Favorites
  getAllProjectFavorites(): Promise<ProjectFavorite[]>;
  getProjectFavoritesByUserId(userId: string): Promise<ProjectFavorite[]>;
  createProjectFavorite(favorite: InsertProjectFavorite): Promise<ProjectFavorite>;
  deleteProjectFavorite(userId: string, projectId: string): Promise<void>;
  isProjectFavorite(userId: string, projectId: string): Promise<boolean>;

  // User Preferences
  getAllUserPreferences(): Promise<UserPreferences[]>;

  // Work Blocks
  getAllWorkBlocks(): Promise<WorkBlock[]>;

  // Day Plans
  getAllDayPlans(): Promise<DayPlan[]>;

  // User Role Eligibility
  getUserRoleEligibility(): Promise<UserRoleEligibility[]>;

  // App Settings
  getAppSettings(): Promise<AppSettings | undefined>;
  updateAppSettings(settings: Partial<AppSettings>): Promise<AppSettings>;

  // Task Types (global)
  getTaskTypes(): Promise<TaskType[]>;
  getTaskTypeById(id: string): Promise<TaskType | undefined>;
  createTaskType(taskType: InsertTaskType): Promise<TaskType>;
  updateTaskType(id: string, taskType: Partial<TaskType>): Promise<TaskType>;
  deleteTaskType(id: string): Promise<void>;

  // Project Task Types
  getProjectTaskTypes(): Promise<ProjectTaskType[]>;
  getProjectTaskTypeById(id: string): Promise<ProjectTaskType | undefined>;
  getProjectTaskTypesByProjectId(projectId: string): Promise<ProjectTaskType[]>;
  createProjectTaskType(projectTaskType: InsertProjectTaskType): Promise<ProjectTaskType>;
  updateProjectTaskType(id: string, projectTaskType: Partial<ProjectTaskType>): Promise<ProjectTaskType>;
  deleteProjectTaskType(id: string): Promise<void>;
  deleteProjectTaskTypesByProjectId(projectId: string): Promise<void>;

  // Task Dependencies
  getTaskDependencies(): Promise<TaskDependency[]>;
  getTaskDependencyById(id: string): Promise<TaskDependency | undefined>;
  getTaskDependenciesByTaskId(taskId: string): Promise<TaskDependency[]>;
  getDependentTasksByTaskId(taskId: string): Promise<TaskDependency[]>;
  createTaskDependency(dependency: InsertTaskDependency): Promise<TaskDependency>;
  updateTaskDependency(id: string, dependency: Partial<TaskDependency>): Promise<TaskDependency>;
  deleteTaskDependency(id: string): Promise<void>;
  deleteTaskDependenciesByTaskId(taskId: string): Promise<void>;

  // Task Dependency Scope Rules
  getTaskDependencyScopeRules(): Promise<TaskDependencyScopeRule[]>;
  getTaskDependencyScopeRuleById(id: string): Promise<TaskDependencyScopeRule | undefined>;
  getTaskDependencyScopeRulesByTaskId(taskId: string): Promise<TaskDependencyScopeRule[]>;
  createTaskDependencyScopeRule(rule: InsertTaskDependencyScopeRule): Promise<TaskDependencyScopeRule>;
  updateTaskDependencyScopeRule(id: string, rule: Partial<TaskDependencyScopeRule>): Promise<TaskDependencyScopeRule>;
  deleteTaskDependencyScopeRule(id: string): Promise<void>;

  // Epic Types
  getEpicTypes(): Promise<EpicType[]>;
  getEpicTypeById(id: string): Promise<EpicType | undefined>;
  createEpicType(epicType: InsertEpicType): Promise<EpicType>;
  updateEpicType(id: string, epicType: Partial<EpicType>): Promise<EpicType>;
  deleteEpicType(id: string): Promise<void>;

  // Deliverable Types
  getDeliverableTypes(): Promise<DeliverableType[]>;
  getDeliverableTypeById(id: string): Promise<DeliverableType | undefined>;
  createDeliverableType(deliverableType: InsertDeliverableType): Promise<DeliverableType>;
  updateDeliverableType(id: string, deliverableType: Partial<DeliverableType>): Promise<DeliverableType>;
  deleteDeliverableType(id: string): Promise<void>;

  // Subtasks
  getSubtasksByParentId(parentTaskId: string): Promise<Task[]>;

  // Themes
  getThemes(): Promise<Theme[]>;
  getThemeById(id: string): Promise<Theme | undefined>;
  getActiveTheme(): Promise<Theme | undefined>;
  createTheme(theme: InsertTheme & { id: string }): Promise<Theme>;
  updateTheme(id: string, theme: Partial<Theme>): Promise<Theme>;
  deleteTheme(id: string): Promise<void>;
  publishTheme(id: string, publishedBy: string): Promise<Theme>;
  setDefaultTheme(id: string): Promise<Theme>;

  // Additional aggregation and preference methods
  getAllProjectTeamMembers(): Promise<ProjectTeamMember[]>;
  getTasksForUserHome(userId: string): Promise<any[]>;
  getUpcomingMilestones(): Promise<any[]>;
  getActiveProjectsWithProgress(): Promise<any[]>;
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  updateUserPreferences(userId: string, prefs: any): Promise<UserPreferences>;
  createUserPreferences(prefs: any): Promise<UserPreferences>;
  getWorkBlocksByUserAndDate(userId: string, date: string): Promise<WorkBlock[]>;
  createWorkBlock(block: any): Promise<WorkBlock>;
  updateWorkBlock(id: string, block: any): Promise<WorkBlock>;
  deleteWorkBlock(id: string): Promise<void>;
  getDayPlan(userId: string, date: string): Promise<DayPlan | undefined>;
  updateDayPlan(userId: string, date: string, plan: any): Promise<DayPlan>;
  createDayPlan(plan: any): Promise<DayPlan>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUsers(): Promise<User[]> { return getAllDocs<User>("users"); }
  async getUserById(id: string): Promise<User | undefined> { return getDocById<User>("users", id); }
  async createUser(user: InsertUser): Promise<User> { return createDoc<User>("users", user); }
  async updateUser(id: string, user: Partial<User>): Promise<User> { return updateDoc<User>("users", id, user); }
  async deleteUser(id: string): Promise<void> { await deleteDoc("users", id); }

  // Identities
  async getUserIdentities(): Promise<UserIdentity[]> { return getAllDocs<UserIdentity>("userIdentities"); }
  async getUserIdentitiesByUserId(userId: string): Promise<UserIdentity[]> {
    const all = await this.getUserIdentities();
    return all.filter(i => i.userId === userId);
  }
  async createUserIdentity(identity: InsertUserIdentity): Promise<UserIdentity> {
    return createDoc<UserIdentity>("userIdentities", identity);
  }
  async deleteUserIdentity(id: string): Promise<void> { await deleteDoc("userIdentities", id); }

  // Clients
  async getAllClients(): Promise<Client[]> { return getAllDocs<Client>("clients"); }
  async getClient(id: string): Promise<Client | undefined> { return getDocById<Client>("clients", id); }
  async createClient(client: InsertClient): Promise<Client> { return createDoc<Client>("clients", client); }
  async updateClient(id: string, client: Partial<Client>): Promise<Client | undefined> {
    return updateDoc<Client>("clients", id, client);
  }
  async deleteClient(id: string): Promise<void> { await deleteDoc("clients", id); }

  // Client Users
  async getClientUsers(clientId: string): Promise<ClientUser[]> {
    const all = await getAllDocs<ClientUser>("clientUsers");
    return all.filter(cu => cu.clientId === clientId);
  }
  async getUserClients(userId: string): Promise<Client[]> {
    const allClientUsers = await getAllDocs<ClientUser>("clientUsers");
    const userClientIds = allClientUsers.filter(cu => cu.userId === userId).map(cu => cu.clientId);
    const allClients = await this.getAllClients();
    return allClients.filter(c => userClientIds.includes(c.id));
  }
  async createClientUser(clientUser: InsertClientUser): Promise<ClientUser> {
    return createDoc<ClientUser>("clientUsers", clientUser);
  }
  async updateClientUserRole(clientId: string, userId: string, role: string): Promise<ClientUser | undefined> {
    const all = await getAllDocs<ClientUser>("clientUsers");
    const record = all.find(cu => cu.clientId === clientId && cu.userId === userId);
    if (!record) return undefined;
    return updateDoc<ClientUser>("clientUsers", record.id, { role });
  }
  async deleteClientUser(clientId: string, userId: string): Promise<void> {
    const all = await getAllDocs<ClientUser>("clientUsers");
    const record = all.find(cu => cu.clientId === clientId && cu.userId === userId);
    if (record) await deleteDoc("clientUsers", record.id);
  }

  // Projects
  async getProjects(): Promise<Project[]> { return getAllDocs<Project>("projects"); }
  async getProjectById(id: string): Promise<Project | undefined> { return getDocById<Project>("projects", id); }
  async createProject(project: InsertProject): Promise<Project> { return createDoc<Project>("projects", project); }
  async updateProject(id: string, project: Partial<Project>): Promise<Project> {
    return updateDoc<Project>("projects", id, project);
  }
  async deleteProject(id: string): Promise<void> { await deleteDoc("projects", id); }

  async getProjectsPaginated(params: {
    limit?: number;
    offset?: number;
    search?: string;
    status?: string;
    riskLevel?: string;
    userId?: string;
    role?: string;
    favoriteOnly?: boolean;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<{ data: Project[]; total: number; limit: number; offset: number }> {
    let list = await this.getProjects();
    
    if (params.search) {
      const s = params.search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(s) || (p.description && p.description.toLowerCase().includes(s)));
    }
    if (params.status) {
      list = list.filter(p => p.status === params.status);
    }
    if (params.riskLevel) {
      list = list.filter(p => p.riskLevel === params.riskLevel);
    }
    if (params.userId) {
      const team = await getAllDocs<ProjectTeamMember>("projectTeamMembers");
      const userProjects = team.filter(t => t.userId === params.userId).map(t => t.projectId);
      list = list.filter(p => p.ownerId === params.userId || userProjects.includes(p.id));
    }
    if (params.favoriteOnly && params.userId) {
      const favs = await getAllDocs<ProjectFavorite>("projectFavorites");
      const favProjectIds = favs.filter(f => f.userId === params.userId).map(f => f.projectId);
      list = list.filter(p => favProjectIds.includes(p.id));
    }
    
    const sortField = params.sortField || "createdAt";
    const dir = params.sortDirection === "desc" ? -1 : 1;
    list.sort((a: any, b: any) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (valA < valB) return -1 * dir;
      if (valA > valB) return 1 * dir;
      return 0;
    });

    const total = list.length;
    const limit = params.limit || 10;
    const offset = params.offset || 0;
    const paginated = list.slice(offset, offset + limit);

    return { data: paginated, total, limit, offset };
  }

  // Deliverables
  async getDeliverables(): Promise<Deliverable[]> { return getAllDocs<Deliverable>("deliverables"); }
  async getDeliverableById(id: string): Promise<Deliverable | undefined> { return getDocById<Deliverable>("deliverables", id); }
  async getDeliverablesByProjectId(projectId: string): Promise<Deliverable[]> {
    const all = await this.getDeliverables();
    return all.filter(d => d.projectId === projectId);
  }
  async createDeliverable(deliverable: InsertDeliverable): Promise<Deliverable> { return createDoc<Deliverable>("deliverables", deliverable); }
  async updateDeliverable(id: string, deliverable: Partial<Deliverable>): Promise<Deliverable> {
    return updateDoc<Deliverable>("deliverables", id, deliverable);
  }
  async deleteDeliverable(id: string): Promise<void> { await deleteDoc("deliverables", id); }

  // Epics
  async getEpics(): Promise<Epic[]> { return getAllDocs<Epic>("epics"); }
  async getEpicById(id: string): Promise<Epic | undefined> { return getDocById<Epic>("epics", id); }
  async getEpicsByDeliverableId(deliverableId: string): Promise<Epic[]> {
    const all = await this.getEpics();
    return all.filter(e => e.deliverableId === deliverableId);
  }
  async createEpic(epic: InsertEpic): Promise<Epic> { return createDoc<Epic>("epics", epic); }
  async updateEpic(id: string, epic: Partial<Epic>): Promise<Epic> {
    return updateDoc<Epic>("epics", id, epic);
  }
  async deleteEpic(id: string): Promise<void> { await deleteDoc("epics", id); }
  async getEpicsByProjectId(projectId: string): Promise<Epic[]> {
    const dels = await this.getDeliverablesByProjectId(projectId);
    const delIds = dels.map(d => d.id);
    const allEpics = await this.getEpics();
    return allEpics.filter(e => delIds.includes(e.deliverableId));
  }

  // Tasks
  async getTasks(): Promise<Task[]> { return getAllDocs<Task>("tasks"); }
  async getTaskById(id: string): Promise<Task | undefined> { return getDocById<Task>("tasks", id); }
  async getTasksByProjectId(projectId: string): Promise<Task[]> {
    const all = await this.getTasks();
    return all.filter(t => t.projectId === projectId);
  }
  async createTask(task: InsertTask): Promise<Task> { return createDoc<Task>("tasks", task); }
  async updateTask(id: string, task: Partial<Task>): Promise<Task> {
    return updateDoc<Task>("tasks", id, task);
  }
  async deleteTask(id: string): Promise<void> { await deleteDoc("tasks", id); }

  async getProjectTasksPaginated(options: {
    projectId: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    search?: string;
    statuses?: string[];
    priorities?: string[];
    stageIds?: string[];
    epicIds?: string[];
    assigneeIds?: string[];
    sprintIds?: string[];
    taskTypeIds?: string[];
    dueDateFrom?: string;
    dueDateTo?: string;
    myTasksOnly?: string;
  }): Promise<{ tasks: Task[]; total: number; page: number; pageSize: number; totalPages: number }> {
    let list = await this.getTasks();
    list = list.filter(t => t.projectId === options.projectId);

    if (options.search) {
      const s = options.search.toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(s) || (t.description && t.description.toLowerCase().includes(s)));
    }
    if (options.statuses && options.statuses.length > 0) {
      list = list.filter(t => options.statuses!.includes(t.status));
    }
    if (options.priorities && options.priorities.length > 0) {
      list = list.filter(t => options.priorities!.includes(t.priority));
    }
    if (options.stageIds && options.stageIds.length > 0) {
      list = list.filter(t => t.stageId && options.stageIds!.includes(t.stageId));
    }
    if (options.epicIds && options.epicIds.length > 0) {
      list = list.filter(t => t.epicId && options.epicIds!.includes(t.epicId));
    }
    if (options.assigneeIds && options.assigneeIds.length > 0) {
      list = list.filter(t => t.assigneeId && options.assigneeIds!.includes(t.assigneeId));
    }
    if (options.sprintIds && options.sprintIds.length > 0) {
      list = list.filter(t => t.sprintId && options.sprintIds!.includes(t.sprintId));
    }
    if (options.taskTypeIds && options.taskTypeIds.length > 0) {
      list = list.filter(t => t.taskTypeId && options.taskTypeIds!.includes(t.taskTypeId));
    }

    const sortField = options.sortBy || "createdAt";
    const dir = options.sortDirection === "desc" ? -1 : 1;
    list.sort((a: any, b: any) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (valA < valB) return -1 * dir;
      if (valA > valB) return 1 * dir;
      return 0;
    });

    const total = list.length;
    const page = options.page || 1;
    const pageSize = options.limit || 10;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const offset = (page - 1) * pageSize;
    const paginated = list.slice(offset, offset + pageSize);

    return { tasks: paginated, total, page, pageSize, totalPages };
  }

  // Milestones
  async getMilestones(): Promise<Milestone[]> { return getAllDocs<Milestone>("milestones"); }
  async getMilestoneById(id: string): Promise<Milestone | undefined> { return getDocById<Milestone>("milestones", id); }
  async getMilestonesByProjectId(projectId: string): Promise<Milestone[]> {
    const all = await this.getMilestones();
    return all.filter(m => m.projectId === projectId);
  }
  async createMilestone(milestone: InsertMilestone): Promise<Milestone> { return createDoc<Milestone>("milestones", milestone); }
  async updateMilestone(id: string, milestone: Partial<Milestone>): Promise<Milestone> {
    return updateDoc<Milestone>("milestones", id, milestone);
  }
  async deleteMilestone(id: string): Promise<void> { await deleteDoc("milestones", id); }

  // Milestone Scope Rules
  async getMilestoneScopeRules(): Promise<MilestoneScopeRule[]> { return getAllDocs<MilestoneScopeRule>("milestoneScopeRules"); }
  async getMilestoneScopeRuleById(id: string): Promise<MilestoneScopeRule | undefined> {
    return getDocById<MilestoneScopeRule>("milestoneScopeRules", id);
  }
  async getMilestoneScopeRulesByMilestoneId(milestoneId: string): Promise<MilestoneScopeRule[]> {
    const all = await this.getMilestoneScopeRules();
    return all.filter(r => r.milestoneId === milestoneId);
  }
  async createMilestoneScopeRule(rule: InsertMilestoneScopeRule): Promise<MilestoneScopeRule> {
    return createDoc<MilestoneScopeRule>("milestoneScopeRules", rule);
  }
  async updateMilestoneScopeRule(id: string, rule: Partial<MilestoneScopeRule>): Promise<MilestoneScopeRule> {
    return updateDoc<MilestoneScopeRule>("milestoneScopeRules", id, rule);
  }
  async deleteMilestoneScopeRule(id: string): Promise<void> { await deleteDoc("milestoneScopeRules", id); }

  // Milestone Task Links
  async getMilestoneTaskLinks(): Promise<MilestoneTaskLink[]> { return getAllDocs<MilestoneTaskLink>("milestoneTaskLinks"); }
  async getMilestoneTaskLinkById(id: string): Promise<MilestoneTaskLink | undefined> {
    return getDocById<MilestoneTaskLink>("milestoneTaskLinks", id);
  }
  async getMilestoneTaskLinksByMilestoneId(milestoneId: string): Promise<MilestoneTaskLink[]> {
    const all = await this.getMilestoneTaskLinks();
    return all.filter(l => l.milestoneId === milestoneId);
  }
  async createMilestoneTaskLink(link: InsertMilestoneTaskLink): Promise<MilestoneTaskLink> {
    return createDoc<MilestoneTaskLink>("milestoneTaskLinks", link);
  }
  async updateMilestoneTaskLink(id: string, link: Partial<MilestoneTaskLink>): Promise<MilestoneTaskLink> {
    return updateDoc<MilestoneTaskLink>("milestoneTaskLinks", id, link);
  }
  async deleteMilestoneTaskLink(id: string): Promise<void> { await deleteDoc("milestoneTaskLinks", id); }

  // Activity
  async getActivity(): Promise<Activity[]> { return getAllDocs<Activity>("activity"); }
  async createActivity(activity: InsertActivity): Promise<Activity> { return createDoc<Activity>("activity", activity); }
  async deleteActivity(id: string): Promise<void> { await deleteDoc("activity", id); }

  // Comments
  async getComments(): Promise<Comment[]> { return getAllDocs<Comment>("comments"); }
  async getCommentById(id: string): Promise<Comment | undefined> { return getDocById<Comment>("comments", id); }
  async getCommentsByTaskId(taskId: string): Promise<Comment[]> {
    const all = await this.getComments();
    return all.filter(c => c.taskId === taskId);
  }
  async createComment(comment: InsertComment): Promise<Comment> { return createDoc<Comment>("comments", comment); }
  async updateComment(id: string, comment: Partial<Comment>): Promise<Comment> {
    return updateDoc<Comment>("comments", id, comment);
  }
  async deleteComment(id: string): Promise<void> { await deleteDoc("comments", id); }

  // Attachments
  async getAttachments(): Promise<Attachment[]> { return getAllDocs<Attachment>("attachments"); }
  async getAttachmentById(id: string): Promise<Attachment | undefined> { return getDocById<Attachment>("attachments", id); }
  async getAttachmentsByTaskId(taskId: string): Promise<Attachment[]> {
    const all = await this.getAttachments();
    return all.filter(a => a.taskId === taskId);
  }
  async createAttachment(attachment: InsertAttachment): Promise<Attachment> { return createDoc<Attachment>("attachments", attachment); }
  async updateAttachment(id: string, attachment: Partial<Attachment>): Promise<Attachment> {
    return updateDoc<Attachment>("attachments", id, attachment);
  }
  async deleteAttachment(id: string): Promise<void> { await deleteDoc("attachments", id); }

  // History
  async getHistory(): Promise<History[]> { return getAllDocs<History>("history"); }
  async getHistoryById(id: string): Promise<History | undefined> { return getDocById<History>("history", id); }
  async getHistoryByTaskId(taskId: string): Promise<History[]> {
    const all = await this.getHistory();
    return all.filter(h => h.taskId === taskId);
  }
  async createHistory(history: InsertHistory): Promise<History> { return createDoc<History>("history", history); }
  async updateHistory(id: string, history: Partial<History>): Promise<History> {
    return updateDoc<History>("history", id, history);
  }

  // Project Roles
  async getProjectRoles(): Promise<ProjectRole[]> { return getAllDocs<ProjectRole>("projectRoles"); }
  async getProjectRoleById(id: string): Promise<ProjectRole | undefined> { return getDocById<ProjectRole>("projectRoles", id); }
  async getProjectRolesByProjectId(projectId: string): Promise<ProjectRole[]> {
    const all = await this.getProjectRoles();
    return all.filter(r => r.projectId === projectId);
  }
  async createProjectRole(role: InsertProjectRole): Promise<ProjectRole> { return createDoc<ProjectRole>("projectRoles", role); }
  async updateProjectRole(id: string, role: Partial<ProjectRole>): Promise<ProjectRole> {
    return updateDoc<ProjectRole>("projectRoles", id, role);
  }
  async deleteProjectRole(id: string): Promise<void> { await deleteDoc("projectRoles", id); }

  // Project Team Members
  async getProjectTeamMembers(projectId: string): Promise<ProjectTeamMember[]> {
    const all = await getAllDocs<ProjectTeamMember>("projectTeamMembers");
    return all.filter(m => m.projectId === projectId);
  }
  async getProjectTeamMemberById(id: string): Promise<ProjectTeamMember | undefined> {
    return getDocById<ProjectTeamMember>("projectTeamMembers", id);
  }
  async getProjectTeamMemberByUserAndProject(projectId: string, userId: string): Promise<ProjectTeamMember | undefined> {
    const all = await getAllDocs<ProjectTeamMember>("projectTeamMembers");
    return all.find(m => m.projectId === projectId && m.userId === userId);
  }
  async getProjectTeamMembersByUser(userId: string): Promise<ProjectTeamMember[]> {
    const all = await getAllDocs<ProjectTeamMember>("projectTeamMembers");
    return all.filter(m => m.userId === userId);
  }
  async createProjectTeamMember(member: InsertProjectTeamMember): Promise<ProjectTeamMember> {
    return createDoc<ProjectTeamMember>("projectTeamMembers", member);
  }
  async updateProjectTeamMember(id: string, member: Partial<ProjectTeamMember>): Promise<ProjectTeamMember> {
    return updateDoc<ProjectTeamMember>("projectTeamMembers", id, member);
  }
  async deleteProjectTeamMember(id: string): Promise<void> { await deleteDoc("projectTeamMembers", id); }

  // High-Level Project Roles
  async getHighLevelRoles(teamMemberId: string): Promise<ProjectHighLevelRole[]> {
    const all = await getAllDocs<ProjectHighLevelRole>("projectHighLevelRoles");
    return all.filter(r => r.teamMemberId === teamMemberId);
  }
  async getHighLevelRolesByProject(projectId: string): Promise<ProjectHighLevelRole[]> {
    const members = await this.getProjectTeamMembers(projectId);
    const memberIds = members.map(m => m.id);
    const all = await getAllDocs<ProjectHighLevelRole>("projectHighLevelRoles");
    return all.filter(r => memberIds.includes(r.teamMemberId));
  }
  async createHighLevelRole(role: InsertProjectHighLevelRole): Promise<ProjectHighLevelRole> {
    return createDoc<ProjectHighLevelRole>("projectHighLevelRoles", role);
  }
  async deleteHighLevelRole(id: string): Promise<void> { await deleteDoc("projectHighLevelRoles", id); }
  async deleteHighLevelRolesByTeamMember(teamMemberId: string): Promise<void> {
    const all = await this.getHighLevelRoles(teamMemberId);
    for (const r of all) {
      await deleteDoc("projectHighLevelRoles", r.id);
    }
  }

  // Execution Role Assignments
  async getExecutionRoleAssignments(teamMemberId: string): Promise<ExecutionRoleAssignment[]> {
    const all = await getAllDocs<ExecutionRoleAssignment>("executionRoleAssignments");
    return all.filter(a => a.teamMemberId === teamMemberId);
  }
  async getExecutionRoleAssignmentsByProject(projectId: string): Promise<ExecutionRoleAssignment[]> {
    const members = await this.getProjectTeamMembers(projectId);
    const memberIds = members.map(m => m.id);
    const all = await getAllDocs<ExecutionRoleAssignment>("executionRoleAssignments");
    return all.filter(a => memberIds.includes(a.teamMemberId));
  }
  async createExecutionRoleAssignment(assignment: InsertExecutionRoleAssignment): Promise<ExecutionRoleAssignment> {
    return createDoc<ExecutionRoleAssignment>("executionRoleAssignments", assignment);
  }
  async deleteExecutionRoleAssignment(id: string): Promise<void> { await deleteDoc("executionRoleAssignments", id); }
  async deleteExecutionRoleAssignmentsByTeamMember(teamMemberId: string): Promise<void> {
    const all = await this.getExecutionRoleAssignments(teamMemberId);
    for (const a of all) {
      await deleteDoc("executionRoleAssignments", a.id);
    }
  }

  // Role Templates
  async getRoleTemplates(): Promise<RoleTemplate[]> { return getAllDocs<RoleTemplate>("roleTemplates"); }
  async getRoleTemplateById(id: string): Promise<RoleTemplate | undefined> { return getDocById<RoleTemplate>("roleTemplates", id); }
  async createRoleTemplate(template: InsertRoleTemplate): Promise<RoleTemplate> { return createDoc<RoleTemplate>("roleTemplates", template); }
  async updateRoleTemplate(id: string, template: Partial<RoleTemplate>): Promise<RoleTemplate> {
    return updateDoc<RoleTemplate>("roleTemplates", id, template);
  }
  async deleteRoleTemplate(id: string): Promise<void> { await deleteDoc("roleTemplates", id); }

  // Saved Views
  async getSavedViews(): Promise<SavedView[]> { return getAllDocs<SavedView>("savedViews"); }
  async getSavedViewById(id: string): Promise<SavedView | undefined> { return getDocById<SavedView>("savedViews", id); }
  async createSavedView(view: InsertSavedView): Promise<SavedView> { return createDoc<SavedView>("savedViews", view); }
  async updateSavedView(id: string, view: Partial<SavedView>): Promise<SavedView> {
    return updateDoc<SavedView>("savedViews", id, view);
  }
  async deleteSavedView(id: string): Promise<void> { await deleteDoc("savedViews", id); }

  // Guidance Items
  async getGuidanceItems(): Promise<GuidanceItem[]> { return getAllDocs<GuidanceItem>("guidanceItems"); }
  async getGuidanceItemById(id: string): Promise<GuidanceItem | undefined> { return getDocById<GuidanceItem>("guidanceItems", id); }
  async createGuidanceItem(item: InsertGuidanceItem): Promise<GuidanceItem> { return createDoc<GuidanceItem>("guidanceItems", item); }
  async updateGuidanceItem(id: string, item: Partial<GuidanceItem>): Promise<GuidanceItem> {
    return updateDoc<GuidanceItem>("guidanceItems", id, item);
  }
  async deleteGuidanceItem(id: string): Promise<void> { await deleteDoc("guidanceItems", id); }

  // Project Stages
  async getProjectStages(): Promise<ProjectStage[]> { return getAllDocs<ProjectStage>("projectStages"); }
  async getProjectStageById(id: string): Promise<ProjectStage | undefined> { return getDocById<ProjectStage>("projectStages", id); }
  async getProjectStagesByProjectId(projectId: string): Promise<ProjectStage[]> {
    const all = await this.getProjectStages();
    return all.filter(s => s.projectId === projectId);
  }
  async createProjectStage(stage: InsertProjectStage): Promise<ProjectStage> { return createDoc<ProjectStage>("projectStages", stage); }
  async updateProjectStage(id: string, stage: Partial<ProjectStage>): Promise<ProjectStage> {
    return updateDoc<ProjectStage>("projectStages", id, stage);
  }
  async deleteProjectStage(id: string): Promise<void> { await deleteDoc("projectStages", id); }

  // Framework Templates
  async getFrameworkTemplates(): Promise<FrameworkTemplate[]> { return getAllDocs<FrameworkTemplate>("frameworkTemplates"); }
  async getFrameworkTemplateById(id: string): Promise<FrameworkTemplate | undefined> {
    return getDocById<FrameworkTemplate>("frameworkTemplates", id);
  }
  async createFrameworkTemplate(template: InsertFrameworkTemplate): Promise<FrameworkTemplate> {
    return createDoc<FrameworkTemplate>("frameworkTemplates", template);
  }
  async updateFrameworkTemplate(id: string, template: Partial<FrameworkTemplate>): Promise<FrameworkTemplate> {
    return updateDoc<FrameworkTemplate>("frameworkTemplates", id, template);
  }
  async deleteFrameworkTemplate(id: string): Promise<void> { await deleteDoc("frameworkTemplates", id); }

  // Stage Templates
  async getStageTemplates(): Promise<StageTemplate[]> { return getAllDocs<StageTemplate>("stageTemplates"); }
  async getStageTemplateById(id: string): Promise<StageTemplate | undefined> { return getDocById<StageTemplate>("stageTemplates", id); }
  async createStageTemplate(template: InsertStageTemplate): Promise<StageTemplate> { return createDoc<StageTemplate>("stageTemplates", template); }
  async updateStageTemplate(id: string, template: Partial<StageTemplate>): Promise<StageTemplate> {
    return updateDoc<StageTemplate>("stageTemplates", id, template);
  }
  async deleteStageTemplate(id: string): Promise<void> { await deleteDoc("stageTemplates", id); }

  // Project Templates
  async getProjectTemplates(): Promise<ProjectTemplate[]> { return getAllDocs<ProjectTemplate>("projectTemplates"); }
  async getProjectTemplateById(id: string): Promise<ProjectTemplate | undefined> {
    return getDocById<ProjectTemplate>("projectTemplates", id);
  }
  async createProjectTemplate(template: InsertProjectTemplate): Promise<ProjectTemplate> {
    return createDoc<ProjectTemplate>("projectTemplates", template);
  }
  async updateProjectTemplate(id: string, template: Partial<ProjectTemplate>): Promise<ProjectTemplate> {
    return updateDoc<ProjectTemplate>("projectTemplates", id, template);
  }
  async deleteProjectTemplate(id: string): Promise<void> { await deleteDoc("projectTemplates", id); }

  // Deliverable Templates
  async getDeliverableTemplates(): Promise<DeliverableTemplate[]> { return getAllDocs<DeliverableTemplate>("deliverableTemplates"); }
  async getDeliverableTemplateById(id: string): Promise<DeliverableTemplate | undefined> {
    return getDocById<DeliverableTemplate>("deliverableTemplates", id);
  }
  async createDeliverableTemplate(template: InsertDeliverableTemplate): Promise<DeliverableTemplate> {
    return createDoc<DeliverableTemplate>("deliverableTemplates", template);
  }
  async updateDeliverableTemplate(id: string, template: Partial<DeliverableTemplate>): Promise<DeliverableTemplate> {
    return updateDoc<DeliverableTemplate>("deliverableTemplates", id, template);
  }
  async deleteDeliverableTemplate(id: string): Promise<void> { await deleteDoc("deliverableTemplates", id); }

  // Epic Templates
  async getEpicTemplates(): Promise<EpicTemplate[]> { return getAllDocs<EpicTemplate>("epicTemplates"); }
  async getEpicTemplateById(id: string): Promise<EpicTemplate | undefined> { return getDocById<EpicTemplate>("epicTemplates", id); }
  async createEpicTemplate(template: InsertEpicTemplate): Promise<EpicTemplate> { return createDoc<EpicTemplate>("epicTemplates", template); }
  async updateEpicTemplate(id: string, template: Partial<EpicTemplate>): Promise<EpicTemplate> {
    return updateDoc<EpicTemplate>("epicTemplates", id, template);
  }
  async deleteEpicTemplate(id: string): Promise<void> { await deleteDoc("epicTemplates", id); }

  // Task Templates
  async getTaskTemplates(): Promise<TaskTemplate[]> { return getAllDocs<TaskTemplate>("taskTemplates"); }
  async getTaskTemplateById(id: string): Promise<TaskTemplate | undefined> { return getDocById<TaskTemplate>("taskTemplates", id); }
  async createTaskTemplate(template: InsertTaskTemplate): Promise<TaskTemplate> { return createDoc<TaskTemplate>("taskTemplates", template); }
  async updateTaskTemplate(id: string, template: Partial<TaskTemplate>): Promise<TaskTemplate> {
    return updateDoc<TaskTemplate>("taskTemplates", id, template);
  }
  async deleteTaskTemplate(id: string): Promise<void> { await deleteDoc("taskTemplates", id); }

  // Mapping Templates
  async getMappingTemplates(): Promise<MappingTemplate[]> { return getAllDocs<MappingTemplate>("mappingTemplates"); }
  async getMappingTemplateById(id: string): Promise<MappingTemplate | undefined> {
    return getDocById<MappingTemplate>("mappingTemplates", id);
  }
  async createMappingTemplate(template: InsertMappingTemplate): Promise<MappingTemplate> {
    return createDoc<MappingTemplate>("mappingTemplates", template);
  }
  async updateMappingTemplate(id: string, template: Partial<MappingTemplate>): Promise<MappingTemplate> {
    return updateDoc<MappingTemplate>("mappingTemplates", id, template);
  }
  async deleteMappingTemplate(id: string): Promise<void> { await deleteDoc("mappingTemplates", id); }

  // Milestone Templates
  async getMilestoneTemplates(): Promise<MilestoneTemplate[]> { return getAllDocs<MilestoneTemplate>("milestoneTemplates"); }
  async getMilestoneTemplateById(id: string): Promise<MilestoneTemplate | undefined> {
    return getDocById<MilestoneTemplate>("milestoneTemplates", id);
  }
  async createMilestoneTemplate(template: InsertMilestoneTemplate): Promise<MilestoneTemplate> {
    return createDoc<MilestoneTemplate>("milestoneTemplates", template);
  }
  async updateMilestoneTemplate(id: string, template: Partial<MilestoneTemplate>): Promise<MilestoneTemplate> {
    return updateDoc<MilestoneTemplate>("milestoneTemplates", id, template);
  }
  async deleteMilestoneTemplate(id: string): Promise<void> { await deleteDoc("milestoneTemplates", id); }

  // Template Snippets
  async getTemplateSnippets(): Promise<TemplateSnippet[]> { return getAllDocs<TemplateSnippet>("templateSnippets"); }
  async getTemplateSnippetById(id: string): Promise<TemplateSnippet | undefined> {
    return getDocById<TemplateSnippet>("templateSnippets", id);
  }
  async createTemplateSnippet(snippet: InsertTemplateSnippet): Promise<TemplateSnippet> {
    return createDoc<TemplateSnippet>("templateSnippets", snippet);
  }
  async updateTemplateSnippet(id: string, snippet: Partial<TemplateSnippet>): Promise<TemplateSnippet> {
    return updateDoc<TemplateSnippet>("templateSnippets", id, snippet);
  }
  async deleteTemplateSnippet(id: string): Promise<void> { await deleteDoc("templateSnippets", id); }

  // Status Options
  async getStatusOptions(): Promise<StatusOption[]> { return getAllDocs<StatusOption>("statusOptions"); }
  async getStatusOptionById(id: string): Promise<StatusOption | undefined> { return getDocById<StatusOption>("statusOptions", id); }
  async getStatusOptionsByType(type: string): Promise<StatusOption[]> {
    const all = await this.getStatusOptions();
    return all.filter(o => o.type === type);
  }
  async getDefaultStatusByType(type: string): Promise<string> {
    const all = await this.getStatusOptionsByType(type);
    const def = all.find(o => o.isDefault);
    return def ? def.label : "Not Started";
  }
  async validateAndResolveStatus(status: string | null | undefined, type: string): Promise<string> {
    if (!status) return this.getDefaultStatusByType(type);
    const all = await this.getStatusOptionsByType(type);
    const match = all.find(o => o.label.toLowerCase() === status.toLowerCase());
    return match ? match.label : this.getDefaultStatusByType(type);
  }
  async createStatusOption(option: InsertStatusOption): Promise<StatusOption> { return createDoc<StatusOption>("statusOptions", option); }
  async updateStatusOption(id: string, option: Partial<StatusOption>): Promise<StatusOption> {
    return updateDoc<StatusOption>("statusOptions", id, option);
  }
  async deleteStatusOption(id: string): Promise<void> { await deleteDoc("statusOptions", id); }

  // Status Usage and Remapping
  async getStatusUsageCounts(statusLabel: string): Promise<{
    projects: number;
    deliverables: number;
    epics: number;
    tasks: number;
    sprints: number;
    milestones: number;
    projectStages: number;
    workBlocks: number;
    total: number;
  }> {
    const tasks = (await this.getTasks()).filter(t => t.status === statusLabel).length;
    const projects = (await this.getProjects()).filter(p => p.status === statusLabel).length;
    const deliverables = (await this.getDeliverables()).filter(d => d.status === statusLabel).length;
    const epics = (await this.getEpics()).filter(e => e.status === statusLabel).length;
    const sprints = (await this.getSprints()).filter(s => s.status === statusLabel).length;
    const milestones = (await this.getMilestones()).filter(m => m.status === statusLabel).length;
    const projectStages = (await this.getProjectStages()).filter(s => s.status === statusLabel).length;
    
    return {
      projects, deliverables, epics, tasks, sprints, milestones, projectStages,
      workBlocks: 0,
      total: projects + deliverables + epics + tasks + sprints + milestones + projectStages
    };
  }

  async remapStatus(oldStatus: string, newStatus: string, entityTypes?: string[]): Promise<{
    projects: number;
    deliverables: number;
    epics: number;
    tasks: number;
    sprints: number;
    milestones: number;
    projectStages: number;
    workBlocks: number;
    total: number;
  }> {
    const shouldRemap = (type: string) => !entityTypes || entityTypes.includes(type);
    let counts = { projects: 0, deliverables: 0, epics: 0, tasks: 0, sprints: 0, milestones: 0, projectStages: 0, workBlocks: 0, total: 0 };

    if (shouldRemap("project")) {
      const projects = await this.getProjects();
      for (const p of projects) {
        if (p.status === oldStatus) {
          await this.updateProject(p.id, { status: newStatus });
          counts.projects++;
        }
      }
    }
    if (shouldRemap("deliverable")) {
      const deliverables = await this.getDeliverables();
      for (const d of deliverables) {
        if (d.status === oldStatus) {
          await this.updateDeliverable(d.id, { status: newStatus });
          counts.deliverables++;
        }
      }
    }
    if (shouldRemap("epic")) {
      const epics = await this.getEpics();
      for (const e of epics) {
        if (e.status === oldStatus) {
          await this.updateEpic(e.id, { status: newStatus });
          counts.epics++;
        }
      }
    }
    if (shouldRemap("task")) {
      const tasks = await this.getTasks();
      for (const t of tasks) {
        if (t.status === oldStatus) {
          await this.updateTask(t.id, { status: newStatus });
          counts.tasks++;
        }
      }
    }
    if (shouldRemap("sprint")) {
      const sprints = await this.getSprints();
      for (const s of sprints) {
        if (s.status === oldStatus) {
          await this.updateSprint(s.id, { status: newStatus });
          counts.sprints++;
        }
      }
    }
    if (shouldRemap("milestone")) {
      const milestones = await this.getMilestones();
      for (const m of milestones) {
        if (m.status === oldStatus) {
          await this.updateMilestone(m.id, { status: newStatus });
          counts.milestones++;
        }
      }
    }
    if (shouldRemap("stage")) {
      const stages = await this.getProjectStages();
      for (const s of stages) {
        if (s.status === oldStatus) {
          await this.updateProjectStage(s.id, { status: newStatus });
          counts.projectStages++;
        }
      }
    }

    counts.total = Object.values(counts).reduce((a, b) => a + b, 0) - counts.total;
    return counts;
  }

  // Role Types
  async getRoleTypes(): Promise<RoleType[]> { return getAllDocs<RoleType>("roleTypes"); }
  async getRoleTypeById(id: string): Promise<RoleType | undefined> { return getDocById<RoleType>("roleTypes", id); }
  async createRoleType(roleType: InsertRoleType): Promise<RoleType> { return createDoc<RoleType>("roleTypes", roleType); }
  async updateRoleType(id: string, roleType: Partial<RoleType>): Promise<RoleType> {
    return updateDoc<RoleType>("roleTypes", id, roleType);
  }
  async deleteRoleType(id: string): Promise<void> { await deleteDoc("roleTypes", id); }

  // Project Task Statuses
  async getProjectTaskStatuses(): Promise<ProjectTaskStatus[]> { return getAllDocs<ProjectTaskStatus>("projectTaskStatuses"); }
  async getProjectTaskStatusById(id: string): Promise<ProjectTaskStatus | undefined> {
    return getDocById<ProjectTaskStatus>("projectTaskStatuses", id);
  }
  async getProjectTaskStatusesByProjectId(projectId: string): Promise<ProjectTaskStatus[]> {
    const all = await this.getProjectTaskStatuses();
    return all.filter(s => s.projectId === projectId);
  }
  async createProjectTaskStatus(status: InsertProjectTaskStatus): Promise<ProjectTaskStatus> {
    return createDoc<ProjectTaskStatus>("projectTaskStatuses", status);
  }
  async updateProjectTaskStatus(id: string, status: Partial<ProjectTaskStatus>): Promise<ProjectTaskStatus> {
    return updateDoc<ProjectTaskStatus>("projectTaskStatuses", id, status);
  }
  async deleteProjectTaskStatus(id: string): Promise<void> { await deleteDoc("projectTaskStatuses", id); }
  async deleteProjectTaskStatusesByProjectId(projectId: string): Promise<void> {
    const all = await this.getProjectTaskStatusesByProjectId(projectId);
    for (const s of all) {
      await deleteDoc("projectTaskStatuses", s.id);
    }
  }

  // Project Settings
  async getProjectSettings(): Promise<ProjectSettings[]> { return getAllDocs<ProjectSettings>("projectSettings"); }
  async getProjectSettingsById(id: string): Promise<ProjectSettings | undefined> {
    return getDocById<ProjectSettings>("projectSettings", id);
  }
  async getProjectSettingsByProjectId(projectId: string): Promise<ProjectSettings | undefined> {
    const all = await this.getProjectSettings();
    return all.find(s => s.projectId === projectId);
  }
  async createProjectSettings(settings: InsertProjectSettings): Promise<ProjectSettings> {
    return createDoc<ProjectSettings>("projectSettings", settings);
  }
  async updateProjectSettings(id: string, settings: Partial<ProjectSettings>): Promise<ProjectSettings> {
    return updateDoc<ProjectSettings>("projectSettings", id, settings);
  }
  async upsertProjectSettings(projectId: string, settings: Partial<InsertProjectSettings>): Promise<ProjectSettings> {
    const existing = await this.getProjectSettingsByProjectId(projectId);
    if (existing) {
      return this.updateProjectSettings(existing.id, settings);
    }
    return this.createProjectSettings({ projectId, ...settings } as InsertProjectSettings);
  }

  // Sprints
  async getSprints(): Promise<Sprint[]> { return getAllDocs<Sprint>("sprints"); }
  async getSprintById(id: string): Promise<Sprint | undefined> { return getDocById<Sprint>("sprints", id); }
  async getSprintsByProjectId(projectId: string): Promise<Sprint[]> {
    const all = await this.getSprints();
    return all.filter(s => s.projectId === projectId);
  }
  async createSprint(sprint: InsertSprint): Promise<Sprint> { return createDoc<Sprint>("sprints", sprint); }
  async updateSprint(id: string, sprint: Partial<Sprint>): Promise<Sprint> {
    return updateDoc<Sprint>("sprints", id, sprint);
  }
  async deleteSprint(id: string): Promise<void> { await deleteDoc("sprints", id); }

  // Sprint Members
  async getSprintMembers(): Promise<SprintMember[]> { return getAllDocs<SprintMember>("sprintMembers"); }
  async getSprintMemberById(id: string): Promise<SprintMember | undefined> {
    return getDocById<SprintMember>("sprintMembers", id);
  }
  async getSprintMembersBySprintId(sprintId: string): Promise<SprintMember[]> {
    const all = await this.getSprintMembers();
    return all.filter(m => m.sprintId === sprintId);
  }
  async createSprintMember(member: InsertSprintMember): Promise<SprintMember> {
    return createDoc<SprintMember>("sprintMembers", member);
  }
  async updateSprintMember(id: string, member: Partial<SprintMember>): Promise<SprintMember> {
    return updateDoc<SprintMember>("sprintMembers", id, member);
  }
  async deleteSprintMember(id: string): Promise<void> { await deleteDoc("sprintMembers", id); }

  // Sprint Scope Events
  async getSprintScopeEvents(): Promise<SprintScopeEvent[]> { return getAllDocs<SprintScopeEvent>("sprintScopeEvents"); }
  async getSprintScopeEventsBySprintId(sprintId: string): Promise<SprintScopeEvent[]> {
    const all = await this.getSprintScopeEvents();
    return all.filter(e => e.sprintId === sprintId);
  }
  async createSprintScopeEvent(event: InsertSprintScopeEvent): Promise<SprintScopeEvent> {
    return createDoc<SprintScopeEvent>("sprintScopeEvents", event);
  }

  // Sprint Scope Targets
  async getSprintScopeTargets(): Promise<SprintScopeTarget[]> { return getAllDocs<SprintScopeTarget>("sprintScopeTargets"); }
  async getSprintScopeTargetsBySprintId(sprintId: string): Promise<SprintScopeTarget[]> {
    const all = await this.getSprintScopeTargets();
    return all.filter(t => t.sprintId === sprintId);
  }
  async createSprintScopeTarget(target: InsertSprintScopeTarget): Promise<SprintScopeTarget> {
    return createDoc<SprintScopeTarget>("sprintScopeTargets", target);
  }
  async deleteSprintScopeTarget(id: string): Promise<void> { await deleteDoc("sprintScopeTargets", id); }
  async deleteSprintScopeTargetsBySprintId(sprintId: string): Promise<void> {
    const all = await this.getSprintScopeTargetsBySprintId(sprintId);
    for (const t of all) {
      await deleteDoc("sprintScopeTargets", t.id);
    }
  }

  // Sprint Pulse Updates
  async getSprintPulseUpdates(): Promise<SprintPulseUpdate[]> { return getAllDocs<SprintPulseUpdate>("sprintPulseUpdates"); }
  async getSprintPulseUpdatesBySprintId(sprintId: string): Promise<SprintPulseUpdate[]> {
    const all = await this.getSprintPulseUpdates();
    return all.filter(u => u.sprintId === sprintId);
  }
  async getSprintPulseUpdateByUserAndDate(sprintId: string, userId: string, date: string): Promise<SprintPulseUpdate | undefined> {
    const all = await this.getSprintPulseUpdates();
    return all.find(u => u.sprintId === sprintId && u.userId === userId && u.date === date);
  }
  async createSprintPulseUpdate(update: InsertSprintPulseUpdate): Promise<SprintPulseUpdate> {
    return createDoc<SprintPulseUpdate>("sprintPulseUpdates", update);
  }
  async updateSprintPulseUpdate(id: string, update: Partial<SprintPulseUpdate>): Promise<SprintPulseUpdate> {
    return updateDoc<SprintPulseUpdate>("sprintPulseUpdates", id, update);
  }
  async deleteSprintPulseUpdate(id: string): Promise<void> { await deleteDoc("sprintPulseUpdates", id); }

  // Project Favorites
  async getAllProjectFavorites(): Promise<ProjectFavorite[]> { return getAllDocs<ProjectFavorite>("projectFavorites"); }
  async getProjectFavoritesByUserId(userId: string): Promise<ProjectFavorite[]> {
    const all = await this.getAllProjectFavorites();
    return all.filter(f => f.userId === userId);
  }
  async createProjectFavorite(favorite: InsertProjectFavorite): Promise<ProjectFavorite> {
    return createDoc<ProjectFavorite>("projectFavorites", favorite);
  }
  async deleteProjectFavorite(userId: string, projectId: string): Promise<void> {
    const all = await this.getAllProjectFavorites();
    const match = all.find(f => f.userId === userId && f.projectId === projectId);
    if (match) await deleteDoc("projectFavorites", match.id);
  }
  async isProjectFavorite(userId: string, projectId: string): Promise<boolean> {
    const all = await this.getAllProjectFavorites();
    return all.some(f => f.userId === userId && f.projectId === projectId);
  }

  // User Preferences
  async getAllUserPreferences(): Promise<UserPreferences[]> { return getAllDocs<UserPreferences>("userPreferences"); }

  // Work Blocks
  async getAllWorkBlocks(): Promise<WorkBlock[]> { return getAllDocs<WorkBlock>("workBlocks"); }

  // Day Plans
  async getAllDayPlans(): Promise<DayPlan[]> { return getAllDocs<DayPlan>("dayPlans"); }

  // User Role Eligibility
  async getUserRoleEligibility(): Promise<UserRoleEligibility[]> { return getAllDocs<UserRoleEligibility>("userRoleEligibility"); }

  // App Settings
  async getAppSettings(): Promise<AppSettings | undefined> {
    const all = await getAllDocs<AppSettings>("appSettings");
    return all[0];
  }
  async updateAppSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const existing = await this.getAppSettings();
    if (existing) {
      return updateDoc<AppSettings>("appSettings", existing.id, settings);
    }
    return createDoc<AppSettings>("appSettings", settings);
  }

  // Task Types
  async getTaskTypes(): Promise<TaskType[]> { return getAllDocs<TaskType>("taskTypes"); }
  async getTaskTypeById(id: string): Promise<TaskType | undefined> { return getDocById<TaskType>("taskTypes", id); }
  async createTaskType(taskType: InsertTaskType): Promise<TaskType> { return createDoc<TaskType>("taskTypes", taskType); }
  async updateTaskType(id: string, taskType: Partial<TaskType>): Promise<TaskType> {
    return updateDoc<TaskType>("taskTypes", id, taskType);
  }
  async deleteTaskType(id: string): Promise<void> { await deleteDoc("taskTypes", id); }

  // Project Task Types
  async getProjectTaskTypes(): Promise<ProjectTaskType[]> { return getAllDocs<ProjectTaskType>("projectTaskTypes"); }
  async getProjectTaskTypeById(id: string): Promise<ProjectTaskType | undefined> {
    return getDocById<ProjectTaskType>("projectTaskTypes", id);
  }
  async getProjectTaskTypesByProjectId(projectId: string): Promise<ProjectTaskType[]> {
    const all = await this.getProjectTaskTypes();
    return all.filter(t => t.projectId === projectId);
  }
  async createProjectTaskType(projectTaskType: InsertProjectTaskType): Promise<ProjectTaskType> {
    return createDoc<ProjectTaskType>("projectTaskTypes", projectTaskType);
  }
  async updateProjectTaskType(id: string, projectTaskType: Partial<ProjectTaskType>): Promise<ProjectTaskType> {
    return updateDoc<ProjectTaskType>("projectTaskTypes", id, projectTaskType);
  }
  async deleteProjectTaskType(id: string): Promise<void> { await deleteDoc("projectTaskTypes", id); }
  async deleteProjectTaskTypesByProjectId(projectId: string): Promise<void> {
    const all = await this.getProjectTaskTypesByProjectId(projectId);
    for (const t of all) {
      await deleteDoc("projectTaskTypes", t.id);
    }
  }

  // Task Dependencies
  async getTaskDependencies(): Promise<TaskDependency[]> { return getAllDocs<TaskDependency>("taskDependencies"); }
  async getTaskDependencyById(id: string): Promise<TaskDependency | undefined> {
    return getDocById<TaskDependency>("taskDependencies", id);
  }
  async getTaskDependenciesByTaskId(taskId: string): Promise<TaskDependency[]> {
    const all = await this.getTaskDependencies();
    return all.filter(d => d.taskId === taskId);
  }
  async getDependentTasksByTaskId(taskId: string): Promise<TaskDependency[]> {
    const all = await this.getTaskDependencies();
    return all.filter(d => d.dependsOnTaskId === taskId);
  }
  async createTaskDependency(dependency: InsertTaskDependency): Promise<TaskDependency> {
    return createDoc<TaskDependency>("taskDependencies", dependency);
  }
  async updateTaskDependency(id: string, dependency: Partial<TaskDependency>): Promise<TaskDependency> {
    return updateDoc<TaskDependency>("taskDependencies", id, dependency);
  }
  async deleteTaskDependency(id: string): Promise<void> { await deleteDoc("taskDependencies", id); }
  async deleteTaskDependenciesByTaskId(taskId: string): Promise<void> {
    const all = await this.getTaskDependenciesByTaskId(taskId);
    for (const d of all) {
      await deleteDoc("taskDependencies", d.id);
    }
  }

  // Task Dependency Scope Rules
  async getTaskDependencyScopeRules(): Promise<TaskDependencyScopeRule[]> {
    return getAllDocs<TaskDependencyScopeRule>("taskDependencyScopeRules");
  }
  async getTaskDependencyScopeRuleById(id: string): Promise<TaskDependencyScopeRule | undefined> {
    return getDocById<TaskDependencyScopeRule>("taskDependencyScopeRules", id);
  }
  async getTaskDependencyScopeRulesByTaskId(taskId: string): Promise<TaskDependencyScopeRule[]> {
    const all = await this.getTaskDependencyScopeRules();
    return all.filter(r => r.taskId === taskId);
  }
  async createTaskDependencyScopeRule(rule: InsertTaskDependencyScopeRule): Promise<TaskDependencyScopeRule> {
    return createDoc<TaskDependencyScopeRule>("taskDependencyScopeRules", rule);
  }
  async updateTaskDependencyScopeRule(id: string, rule: Partial<TaskDependencyScopeRule>): Promise<TaskDependencyScopeRule> {
    return updateDoc<TaskDependencyScopeRule>("taskDependencyScopeRules", id, rule);
  }
  async deleteTaskDependencyScopeRule(id: string): Promise<void> { await deleteDoc("taskDependencyScopeRules", id); }

  // Epic Types
  async getEpicTypes(): Promise<EpicType[]> { return getAllDocs<EpicType>("epicTypes"); }
  async getEpicTypeById(id: string): Promise<EpicType | undefined> { return getDocById<EpicType>("epicTypes", id); }
  async createEpicType(epicType: InsertEpicType): Promise<EpicType> { return createDoc<EpicType>("epicTypes", epicType); }
  async updateEpicType(id: string, epicType: Partial<EpicType>): Promise<EpicType> {
    return updateDoc<EpicType>("epicTypes", id, epicType);
  }
  async deleteEpicType(id: string): Promise<void> { await deleteDoc("epicTypes", id); }

  // Deliverable Types
  async getDeliverableTypes(): Promise<DeliverableType[]> { return getAllDocs<DeliverableType>("deliverableTypes"); }
  async getDeliverableTypeById(id: string): Promise<DeliverableType | undefined> {
    return getDocById<DeliverableType>("deliverableTypes", id);
  }
  async createDeliverableType(deliverableType: InsertDeliverableType): Promise<DeliverableType> {
    return createDoc<DeliverableType>("deliverableTypes", deliverableType);
  }
  async updateDeliverableType(id: string, deliverableType: Partial<DeliverableType>): Promise<DeliverableType> {
    return updateDoc<DeliverableType>("deliverableTypes", id, deliverableType);
  }
  async deleteDeliverableType(id: string): Promise<void> { await deleteDoc("deliverableTypes", id); }

  // Subtasks
  async getSubtasksByParentId(parentTaskId: string): Promise<Task[]> {
    const all = await this.getTasks();
    return all.filter(t => t.parentTaskId === parentTaskId);
  }

  // Themes
  async getThemes(): Promise<Theme[]> { return getAllDocs<Theme>("themes"); }
  async getThemeById(id: string): Promise<Theme | undefined> { return getDocById<Theme>("themes", id); }
  async getActiveTheme(): Promise<Theme | undefined> {
    const all = await this.getThemes();
    return all.find(t => t.status === "published" || t.isDefault);
  }
  async createTheme(theme: InsertTheme & { id: string }): Promise<Theme> { return createDoc<Theme>("themes", theme); }
  async updateTheme(id: string, theme: Partial<Theme>): Promise<Theme> {
    return updateDoc<Theme>("themes", id, theme);
  }
  async deleteTheme(id: string): Promise<void> { await deleteDoc("themes", id); }
  async publishTheme(id: string, publishedBy: string): Promise<Theme> {
    // Unpublish all other themes first
    const all = await this.getThemes();
    for (const t of all) {
      if (t.status === "published") {
        await updateDoc("themes", t.id, { status: "draft" });
      }
    }
    return updateDoc<Theme>("themes", id, { status: "published", publishedBy, publishedAt: new Date() });
  }
  async setDefaultTheme(id: string): Promise<Theme> {
    const all = await this.getThemes();
    for (const t of all) {
      if (t.isDefault) {
        await updateDoc("themes", t.id, { isDefault: false });
      }
    }
    return updateDoc<Theme>("themes", id, { isDefault: true });
  }

  // Additional aggregation and preference methods
  async getAllProjectTeamMembers(): Promise<ProjectTeamMember[]> {
    return getAllDocs<ProjectTeamMember>("projectTeamMembers");
  }
  async getTasksForUserHome(userId: string): Promise<any[]> {
    const allTasks = await this.getTasks();
    return allTasks.filter(t => t.assigneeId === userId);
  }
  async getUpcomingMilestones(): Promise<any[]> {
    const allMilestones = await this.getMilestones();
    return allMilestones.filter(m => m.status === "planned");
  }
  async getActiveProjectsWithProgress(): Promise<any[]> {
    const allProjects = await this.getProjects();
    return allProjects.filter(p => p.status === "Execution" || p.status === "In Progress");
  }
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const all = await this.getAllUserPreferences();
    return all.find(p => p.userId === userId);
  }
  async updateUserPreferences(userId: string, prefs: any): Promise<UserPreferences> {
    const existing = await this.getUserPreferences(userId);
    if (existing) {
      return updateDoc<UserPreferences>("userPreferences", existing.id, prefs);
    }
    return createDoc<UserPreferences>("userPreferences", { userId, ...prefs });
  }
  async createUserPreferences(prefs: any): Promise<UserPreferences> {
    return createDoc<UserPreferences>("userPreferences", prefs);
  }
  async getWorkBlocksByUserAndDate(userId: string, date: string): Promise<WorkBlock[]> {
    const all = await this.getAllWorkBlocks();
    return all.filter(b => b.userId === userId && b.date === date);
  }
  async createWorkBlock(block: any): Promise<WorkBlock> {
    return createDoc<WorkBlock>("workBlocks", block);
  }
  async updateWorkBlock(id: string, block: any): Promise<WorkBlock> {
    return updateDoc<WorkBlock>("workBlocks", id, block);
  }
  async deleteWorkBlock(id: string): Promise<void> {
    await deleteDoc("workBlocks", id);
  }
  async getDayPlan(userId: string, date: string): Promise<DayPlan | undefined> {
    const all = await this.getAllDayPlans();
    return all.find(p => p.userId === userId && p.date === date);
  }
  async updateDayPlan(userId: string, date: string, plan: any): Promise<DayPlan> {
    const existing = await this.getDayPlan(userId, date);
    if (!existing) throw new Error("Day plan not found");
    return updateDoc<DayPlan>("dayPlans", existing.id, plan);
  }
  async createDayPlan(plan: any): Promise<DayPlan> {
    return createDoc<DayPlan>("dayPlans", plan);
  }
}

export const storage = new DatabaseStorage();
