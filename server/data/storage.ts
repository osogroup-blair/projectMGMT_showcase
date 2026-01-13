import { db } from "../db";
import { eq, and, gte, lte, or, isNull, sql } from "drizzle-orm";
import * as schema from "@shared/schema";
import * as userRepository from "./repositories/user-repository";
import * as taskRepository from "./repositories/task-repository";
import * as milestoneRepository from "./repositories/milestone-repository";
import * as sprintRepository from "./repositories/sprint-repository";
import * as taskDependencyRepository from "./repositories/task-dependency-repository";
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
  RoleAssignment, InsertRoleAssignment,
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
  AppSettings, InsertAppSettings,
} from "@shared/schema";

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

  // Projects
  getProjects(): Promise<Project[]>;
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

  // Role Assignments (Team Members) - LEGACY
  getRoleAssignments(): Promise<RoleAssignment[]>;
  getRoleAssignmentById(id: string): Promise<RoleAssignment | undefined>;
  getRoleAssignmentsByRoleId(roleId: string): Promise<RoleAssignment[]>;
  getRoleAssignmentsByProjectId(projectId: string): Promise<RoleAssignment[]>;
  getRoleAssignmentsByMemberType(projectId: string, memberType: string): Promise<RoleAssignment[]>;
  createRoleAssignment(assignment: InsertRoleAssignment): Promise<RoleAssignment>;
  updateRoleAssignment(id: string, assignment: Partial<RoleAssignment>): Promise<RoleAssignment>;
  deleteRoleAssignment(id: string): Promise<void>;

  // Project Team Members (unified membership)
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

  // Project Task Statuses (project-level overrides)
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

  // Project Task Types (project-level overrides)
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

  // Epic Types (global)
  getEpicTypes(): Promise<EpicType[]>;
  getEpicTypeById(id: string): Promise<EpicType | undefined>;
  createEpicType(epicType: InsertEpicType): Promise<EpicType>;
  updateEpicType(id: string, epicType: Partial<EpicType>): Promise<EpicType>;
  deleteEpicType(id: string): Promise<void>;

  // Deliverable Types (global)
  getDeliverableTypes(): Promise<DeliverableType[]>;
  getDeliverableTypeById(id: string): Promise<DeliverableType | undefined>;
  createDeliverableType(deliverableType: InsertDeliverableType): Promise<DeliverableType>;
  updateDeliverableType(id: string, deliverableType: Partial<DeliverableType>): Promise<DeliverableType>;
  deleteDeliverableType(id: string): Promise<void>;

  // Subtasks
  getSubtasksByParentId(parentTaskId: string): Promise<Task[]>;
}

export class DatabaseStorage implements IStorage {
  // Users (delegated to user-repository)
  async getUsers(): Promise<User[]> {
    return userRepository.getUsers();
  }
  async getUserById(id: string): Promise<User | undefined> {
    return userRepository.getUserById(id);
  }
  async createUser(user: InsertUser): Promise<User> {
    return userRepository.createUser(user);
  }
  async updateUser(id: string, user: Partial<User>): Promise<User> {
    return userRepository.updateUser(id, user);
  }
  async deleteUser(id: string): Promise<void> {
    return userRepository.deleteUser(id);
  }

  // User Identities (delegated to user-repository)
  async getUserIdentities(): Promise<UserIdentity[]> {
    return userRepository.getUserIdentities();
  }

  async getUserIdentitiesByUserId(userId: string): Promise<UserIdentity[]> {
    return userRepository.getUserIdentitiesByUserId(userId);
  }

  async createUserIdentity(identity: InsertUserIdentity): Promise<UserIdentity> {
    return userRepository.createUserIdentity(identity);
  }

  async deleteUserIdentity(id: string): Promise<void> {
    return userRepository.deleteUserIdentity(id);
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return await db.select().from(schema.projects);
  }
  async getProjectById(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, id));
    return project;
  }
  async createProject(project: InsertProject): Promise<Project> {
    const id = (project as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.projects).values({ ...project, id }).returning();
    return created;
  }
  async updateProject(id: string, project: Partial<Project>): Promise<Project> {
    const [updated] = await db.update(schema.projects).set(project).where(eq(schema.projects.id, id)).returning();
    return updated;
  }
  async deleteProject(id: string): Promise<void> {
    // Cascade delete all related entities in a transaction for atomicity
    // Order: sprint-related → milestone_task_links → tasks → milestones → 
    //        epics → deliverables → stages → assignments → project
    
    await db.transaction(async (tx) => {
      // 1. Get sprints for this project to delete related sprint data
      const sprints = await tx.select().from(schema.sprints).where(eq(schema.sprints.projectId, id));
      const sprintIds = sprints.map(s => s.id);
      
      // 2. Delete sprint-related entities
      if (sprintIds.length > 0) {
        for (const sprintId of sprintIds) {
          // Sprint pulse updates
          await tx.delete(schema.sprintPulseUpdates).where(eq(schema.sprintPulseUpdates.sprintId, sprintId));
          // Sprint scope targets
          await tx.delete(schema.sprintScopeTargets).where(eq(schema.sprintScopeTargets.sprintId, sprintId));
          // Sprint scope events
          await tx.delete(schema.sprintScopeEvents).where(eq(schema.sprintScopeEvents.sprintId, sprintId));
          // Sprint members
          await tx.delete(schema.sprintMembers).where(eq(schema.sprintMembers.sprintId, sprintId));
        }
      }
      
      // 3. Delete sprints for this project
      await tx.delete(schema.sprints).where(eq(schema.sprints.projectId, id));
      
      // 4. Delete milestone task links for this project
      await tx.delete(schema.milestoneTaskLinks).where(eq(schema.milestoneTaskLinks.projectId, id));
      
      // 5. Delete tasks for this project (comments, attachments, history cascade automatically)
      await tx.delete(schema.tasks).where(eq(schema.tasks.projectId, id));
      
      // 6. Delete milestones for this project (scope rules cascade automatically)
      await tx.delete(schema.milestones).where(eq(schema.milestones.projectId, id));
      
      // 7. Get deliverables for this project to find epics
      const deliverables = await tx.select().from(schema.deliverables).where(eq(schema.deliverables.projectId, id));
      const deliverableIds = deliverables.map(d => d.id);
      
      // 8. Delete epics belonging to these deliverables
      if (deliverableIds.length > 0) {
        for (const deliverableId of deliverableIds) {
          await tx.delete(schema.epics).where(eq(schema.epics.deliverableId, deliverableId));
        }
      }
      
      // 9. Delete deliverables for this project
      await tx.delete(schema.deliverables).where(eq(schema.deliverables.projectId, id));
      
      // 10. Delete project stages for this project
      await tx.delete(schema.projectStages).where(eq(schema.projectStages.projectId, id));
      
      // 11. Role assignments are linked to roles, not projects directly - skip
      
      // 12. Delete project task types for this project
      await tx.delete(schema.projectTaskTypes).where(eq(schema.projectTaskTypes.projectId, id));
      
      // 13. Delete project task statuses for this project
      await tx.delete(schema.projectTaskStatuses).where(eq(schema.projectTaskStatuses.projectId, id));
      
      // 14. Delete project settings for this project
      await tx.delete(schema.projectSettings).where(eq(schema.projectSettings.projectId, id));
      
      // 15. Finally delete the project itself
      await tx.delete(schema.projects).where(eq(schema.projects.id, id));
    });
  }

  // Deliverables
  async getDeliverables(): Promise<Deliverable[]> {
    return await db.select().from(schema.deliverables);
  }
  async getDeliverableById(id: string): Promise<Deliverable | undefined> {
    const [deliverable] = await db.select().from(schema.deliverables).where(eq(schema.deliverables.id, id));
    return deliverable;
  }
  async getDeliverablesByProjectId(projectId: string): Promise<Deliverable[]> {
    return await db.select().from(schema.deliverables).where(eq(schema.deliverables.projectId, projectId));
  }
  async createDeliverable(deliverable: InsertDeliverable): Promise<Deliverable> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    
    // Default dates from parent project if not provided
    let startDate = deliverable.startDate;
    let dueDate = deliverable.dueDate;
    
    if ((!startDate || !dueDate) && deliverable.projectId) {
      const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, deliverable.projectId));
      if (project) {
        if (!startDate) startDate = project.startDate;
        if (!dueDate) dueDate = project.deadline;
      }
    }
    
    // Fallback to today if still no dates
    const today = new Date().toISOString().split('T')[0];
    if (!startDate) startDate = today;
    if (!dueDate) dueDate = today;
    
    const [created] = await db.insert(schema.deliverables).values({ 
      ...deliverable, 
      id,
      startDate,
      dueDate 
    }).returning();
    return created;
  }
  async updateDeliverable(id: string, deliverable: Partial<Deliverable>): Promise<Deliverable> {
    const [updated] = await db.update(schema.deliverables).set(deliverable).where(eq(schema.deliverables.id, id)).returning();
    return updated;
  }
  async deleteDeliverable(id: string): Promise<void> {
    await db.delete(schema.deliverables).where(eq(schema.deliverables.id, id));
  }

  // Epics
  async getEpics(): Promise<Epic[]> {
    return await db.select().from(schema.epics);
  }
  async getEpicById(id: string): Promise<Epic | undefined> {
    const [epic] = await db.select().from(schema.epics).where(eq(schema.epics.id, id));
    return epic;
  }
  async getEpicsByDeliverableId(deliverableId: string): Promise<Epic[]> {
    return await db.select().from(schema.epics).where(eq(schema.epics.deliverableId, deliverableId));
  }
  async createEpic(epic: InsertEpic): Promise<Epic> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    
    // Default dates from parent deliverable if not provided
    let startDate = epic.startDate;
    let endDate = epic.endDate;
    
    if ((!startDate || !endDate) && epic.deliverableId) {
      const [deliverable] = await db.select().from(schema.deliverables).where(eq(schema.deliverables.id, epic.deliverableId));
      if (deliverable) {
        if (!startDate) startDate = deliverable.startDate;
        if (!endDate) endDate = deliverable.dueDate;
      }
    }
    
    // Fallback to today if still no dates
    const today = new Date().toISOString().split('T')[0];
    if (!startDate) startDate = today;
    if (!endDate) endDate = today;
    
    const [created] = await db.insert(schema.epics).values({ 
      ...epic, 
      id,
      startDate,
      endDate 
    }).returning();
    return created;
  }
  async updateEpic(id: string, epic: Partial<Epic>): Promise<Epic> {
    const [updated] = await db.update(schema.epics).set(epic).where(eq(schema.epics.id, id)).returning();
    return updated;
  }
  async deleteEpic(id: string): Promise<void> {
    await db.delete(schema.epics).where(eq(schema.epics.id, id));
  }

  // Tasks (delegated to task-repository)
  async getTasks(): Promise<Task[]> {
    return taskRepository.getTasks();
  }
  async getTaskById(id: string): Promise<Task | undefined> {
    return taskRepository.getTaskById(id);
  }
  async getTasksByProjectId(projectId: string): Promise<Task[]> {
    return taskRepository.getTasksByProjectId(projectId);
  }
  async createTask(task: InsertTask): Promise<Task> {
    return taskRepository.createTask(task);
  }
  async updateTask(id: string, task: Partial<Task>): Promise<Task> {
    return taskRepository.updateTask(id, task);
  }
  async deleteTask(id: string): Promise<void> {
    return taskRepository.deleteTask(id);
  }

  // Milestones (delegated to milestone-repository)
  async getMilestones(): Promise<Milestone[]> {
    return milestoneRepository.getMilestones();
  }
  async getMilestoneById(id: string): Promise<Milestone | undefined> {
    return milestoneRepository.getMilestoneById(id);
  }
  async getMilestonesByProjectId(projectId: string): Promise<Milestone[]> {
    return milestoneRepository.getMilestonesByProjectId(projectId);
  }
  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    return milestoneRepository.createMilestone(milestone);
  }
  async updateMilestone(id: string, milestone: Partial<Milestone>): Promise<Milestone> {
    return milestoneRepository.updateMilestone(id, milestone);
  }
  async deleteMilestone(id: string): Promise<void> {
    return milestoneRepository.deleteMilestone(id);
  }

  // Milestone Scope Rules (delegated to milestone-repository)
  async getMilestoneScopeRules(): Promise<MilestoneScopeRule[]> {
    return milestoneRepository.getMilestoneScopeRules();
  }
  async getMilestoneScopeRuleById(id: string): Promise<MilestoneScopeRule | undefined> {
    return milestoneRepository.getMilestoneScopeRuleById(id);
  }
  async getMilestoneScopeRulesByMilestoneId(milestoneId: string): Promise<MilestoneScopeRule[]> {
    return milestoneRepository.getMilestoneScopeRulesByMilestoneId(milestoneId);
  }
  async createMilestoneScopeRule(rule: InsertMilestoneScopeRule): Promise<MilestoneScopeRule> {
    return milestoneRepository.createMilestoneScopeRule(rule);
  }
  async updateMilestoneScopeRule(id: string, rule: Partial<MilestoneScopeRule>): Promise<MilestoneScopeRule> {
    return milestoneRepository.updateMilestoneScopeRule(id, rule);
  }
  async deleteMilestoneScopeRule(id: string): Promise<void> {
    return milestoneRepository.deleteMilestoneScopeRule(id);
  }

  // Milestone Task Links (delegated to milestone-repository)
  async getMilestoneTaskLinks(): Promise<MilestoneTaskLink[]> {
    return milestoneRepository.getMilestoneTaskLinks();
  }
  async getMilestoneTaskLinkById(id: string): Promise<MilestoneTaskLink | undefined> {
    return milestoneRepository.getMilestoneTaskLinkById(id);
  }
  async getMilestoneTaskLinksByMilestoneId(milestoneId: string): Promise<MilestoneTaskLink[]> {
    return milestoneRepository.getMilestoneTaskLinksByMilestoneId(milestoneId);
  }
  async createMilestoneTaskLink(link: InsertMilestoneTaskLink): Promise<MilestoneTaskLink> {
    return milestoneRepository.createMilestoneTaskLink(link);
  }
  async updateMilestoneTaskLink(id: string, link: Partial<MilestoneTaskLink>): Promise<MilestoneTaskLink> {
    return milestoneRepository.updateMilestoneTaskLink(id, link);
  }
  async deleteMilestoneTaskLink(id: string): Promise<void> {
    return milestoneRepository.deleteMilestoneTaskLink(id);
  }

  // Activity
  async getActivity(): Promise<Activity[]> {
    return await db.select().from(schema.activity);
  }
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.activity).values({ ...activity, id }).returning();
    return created;
  }
  async deleteActivity(id: string): Promise<void> {
    await db.delete(schema.activity).where(eq(schema.activity.id, id));
  }

  // Comments
  async getComments(): Promise<Comment[]> {
    return await db.select().from(schema.comments);
  }
  async getCommentById(id: string): Promise<Comment | undefined> {
    const [comment] = await db.select().from(schema.comments).where(eq(schema.comments.id, id));
    return comment;
  }
  async getCommentsByTaskId(taskId: string): Promise<Comment[]> {
    return await db.select().from(schema.comments).where(eq(schema.comments.taskId, taskId));
  }
  async createComment(comment: InsertComment): Promise<Comment> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.comments).values({ ...comment, id }).returning();
    return created;
  }
  async updateComment(id: string, comment: Partial<Comment>): Promise<Comment> {
    const [updated] = await db.update(schema.comments).set(comment).where(eq(schema.comments.id, id)).returning();
    return updated;
  }
  async deleteComment(id: string): Promise<void> {
    await db.delete(schema.comments).where(eq(schema.comments.id, id));
  }

  // Attachments
  async getAttachments(): Promise<Attachment[]> {
    return await db.select().from(schema.attachments);
  }
  async getAttachmentById(id: string): Promise<Attachment | undefined> {
    const [attachment] = await db.select().from(schema.attachments).where(eq(schema.attachments.id, id));
    return attachment;
  }
  async getAttachmentsByTaskId(taskId: string): Promise<Attachment[]> {
    return await db.select().from(schema.attachments).where(eq(schema.attachments.taskId, taskId));
  }
  async createAttachment(attachment: InsertAttachment): Promise<Attachment> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.attachments).values({ ...attachment, id }).returning();
    return created;
  }
  async updateAttachment(id: string, attachment: Partial<Attachment>): Promise<Attachment> {
    const [updated] = await db.update(schema.attachments).set(attachment).where(eq(schema.attachments.id, id)).returning();
    return updated;
  }
  async deleteAttachment(id: string): Promise<void> {
    await db.delete(schema.attachments).where(eq(schema.attachments.id, id));
  }

  // History
  async getHistory(): Promise<History[]> {
    return await db.select().from(schema.history);
  }
  async getHistoryById(id: string): Promise<History | undefined> {
    const [historyItem] = await db.select().from(schema.history).where(eq(schema.history.id, id));
    return historyItem;
  }
  async getHistoryByTaskId(taskId: string): Promise<History[]> {
    return await db.select().from(schema.history).where(eq(schema.history.taskId, taskId));
  }
  async createHistory(history: InsertHistory): Promise<History> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.history).values({ ...history, id }).returning();
    return created;
  }
  async updateHistory(id: string, history: Partial<History>): Promise<History> {
    const [updated] = await db.update(schema.history).set(history).where(eq(schema.history.id, id)).returning();
    return updated;
  }

  // Project Roles
  async getProjectRoles(): Promise<ProjectRole[]> {
    return await db.select().from(schema.projectRoles);
  }
  async getProjectRoleById(id: string): Promise<ProjectRole | undefined> {
    const [role] = await db.select().from(schema.projectRoles).where(eq(schema.projectRoles.id, id));
    return role;
  }
  async getProjectRolesByProjectId(projectId: string): Promise<ProjectRole[]> {
    return await db.select().from(schema.projectRoles).where(eq(schema.projectRoles.projectId, projectId));
  }
  async createProjectRole(role: InsertProjectRole): Promise<ProjectRole> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.projectRoles).values({ ...role, id }).returning();
    return created;
  }
  async updateProjectRole(id: string, role: Partial<ProjectRole>): Promise<ProjectRole> {
    const [updated] = await db.update(schema.projectRoles).set({ ...role, updatedAt: new Date() }).where(eq(schema.projectRoles.id, id)).returning();
    return updated;
  }
  async deleteProjectRole(id: string): Promise<void> {
    await db.delete(schema.projectRoles).where(eq(schema.projectRoles.id, id));
  }

  // Role Assignments (Team Members)
  async getRoleAssignments(): Promise<RoleAssignment[]> {
    return await db.select().from(schema.roleAssignments);
  }
  async getRoleAssignmentById(id: string): Promise<RoleAssignment | undefined> {
    const [assignment] = await db.select().from(schema.roleAssignments).where(eq(schema.roleAssignments.id, id));
    return assignment;
  }
  async getRoleAssignmentsByRoleId(roleId: string): Promise<RoleAssignment[]> {
    return await db.select().from(schema.roleAssignments).where(eq(schema.roleAssignments.roleId, roleId));
  }
  async getRoleAssignmentsByProjectId(projectId: string): Promise<RoleAssignment[]> {
    return await db.select().from(schema.roleAssignments).where(eq(schema.roleAssignments.projectId, projectId));
  }
  async getRoleAssignmentsByMemberType(projectId: string, memberType: string): Promise<RoleAssignment[]> {
    return await db.select().from(schema.roleAssignments)
      .where(and(eq(schema.roleAssignments.projectId, projectId), eq(schema.roleAssignments.memberType, memberType)));
  }
  async createRoleAssignment(assignment: InsertRoleAssignment): Promise<RoleAssignment> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.roleAssignments).values({ ...assignment, id }).returning();
    return created;
  }
  async updateRoleAssignment(id: string, assignment: Partial<RoleAssignment>): Promise<RoleAssignment> {
    const [updated] = await db.update(schema.roleAssignments).set({ ...assignment, updatedAt: new Date() }).where(eq(schema.roleAssignments.id, id)).returning();
    return updated;
  }
  async deleteRoleAssignment(id: string): Promise<void> {
    await db.delete(schema.roleAssignments).where(eq(schema.roleAssignments.id, id));
  }

  // Project Team Members (unified membership)
  async getProjectTeamMembers(projectId: string): Promise<ProjectTeamMember[]> {
    return await db.select().from(schema.projectTeamMembers).where(eq(schema.projectTeamMembers.projectId, projectId));
  }
  async getProjectTeamMemberById(id: string): Promise<ProjectTeamMember | undefined> {
    const [member] = await db.select().from(schema.projectTeamMembers).where(eq(schema.projectTeamMembers.id, id));
    return member;
  }
  async getProjectTeamMemberByUserAndProject(projectId: string, userId: string): Promise<ProjectTeamMember | undefined> {
    const [member] = await db.select().from(schema.projectTeamMembers)
      .where(and(eq(schema.projectTeamMembers.projectId, projectId), eq(schema.projectTeamMembers.userId, userId)));
    return member;
  }
  async getProjectTeamMembersByUser(userId: string): Promise<ProjectTeamMember[]> {
    return await db.select().from(schema.projectTeamMembers)
      .where(eq(schema.projectTeamMembers.userId, userId));
  }
  async createProjectTeamMember(member: InsertProjectTeamMember): Promise<ProjectTeamMember> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.projectTeamMembers).values({ ...member, id }).returning();
    return created;
  }
  async updateProjectTeamMember(id: string, member: Partial<ProjectTeamMember>): Promise<ProjectTeamMember> {
    const [updated] = await db.update(schema.projectTeamMembers).set({ ...member, updatedAt: new Date() }).where(eq(schema.projectTeamMembers.id, id)).returning();
    return updated;
  }
  async deleteProjectTeamMember(id: string): Promise<void> {
    await db.delete(schema.projectTeamMembers).where(eq(schema.projectTeamMembers.id, id));
  }

  // High-Level Project Roles
  async getHighLevelRoles(teamMemberId: string): Promise<ProjectHighLevelRole[]> {
    return await db.select().from(schema.projectHighLevelRoles).where(eq(schema.projectHighLevelRoles.teamMemberId, teamMemberId));
  }
  async getHighLevelRolesByProject(projectId: string): Promise<ProjectHighLevelRole[]> {
    const teamMembers = await this.getProjectTeamMembers(projectId);
    const teamMemberIds = teamMembers.map(tm => tm.id);
    if (teamMemberIds.length === 0) return [];
    return await db.select().from(schema.projectHighLevelRoles)
      .where(sql`${schema.projectHighLevelRoles.teamMemberId} = ANY(${teamMemberIds})`);
  }
  async createHighLevelRole(role: InsertProjectHighLevelRole): Promise<ProjectHighLevelRole> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.projectHighLevelRoles).values({ ...role, id }).returning();
    return created;
  }
  async deleteHighLevelRole(id: string): Promise<void> {
    await db.delete(schema.projectHighLevelRoles).where(eq(schema.projectHighLevelRoles.id, id));
  }
  async deleteHighLevelRolesByTeamMember(teamMemberId: string): Promise<void> {
    await db.delete(schema.projectHighLevelRoles).where(eq(schema.projectHighLevelRoles.teamMemberId, teamMemberId));
  }

  // Execution Role Assignments
  async getExecutionRoleAssignments(teamMemberId: string): Promise<ExecutionRoleAssignment[]> {
    return await db.select().from(schema.executionRoleAssignments).where(eq(schema.executionRoleAssignments.teamMemberId, teamMemberId));
  }
  async getExecutionRoleAssignmentsByProject(projectId: string): Promise<ExecutionRoleAssignment[]> {
    const teamMembers = await this.getProjectTeamMembers(projectId);
    const teamMemberIds = teamMembers.map(tm => tm.id);
    if (teamMemberIds.length === 0) return [];
    return await db.select().from(schema.executionRoleAssignments)
      .where(sql`${schema.executionRoleAssignments.teamMemberId} = ANY(${teamMemberIds})`);
  }
  async createExecutionRoleAssignment(assignment: InsertExecutionRoleAssignment): Promise<ExecutionRoleAssignment> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.executionRoleAssignments).values({ ...assignment, id }).returning();
    return created;
  }
  async deleteExecutionRoleAssignment(id: string): Promise<void> {
    await db.delete(schema.executionRoleAssignments).where(eq(schema.executionRoleAssignments.id, id));
  }
  async deleteExecutionRoleAssignmentsByTeamMember(teamMemberId: string): Promise<void> {
    await db.delete(schema.executionRoleAssignments).where(eq(schema.executionRoleAssignments.teamMemberId, teamMemberId));
  }

  // Role Templates
  async getRoleTemplates(): Promise<RoleTemplate[]> {
    return await db.select().from(schema.roleTemplates);
  }
  async getRoleTemplateById(id: string): Promise<RoleTemplate | undefined> {
    const [template] = await db.select().from(schema.roleTemplates).where(eq(schema.roleTemplates.id, id));
    return template;
  }
  async createRoleTemplate(template: InsertRoleTemplate): Promise<RoleTemplate> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.roleTemplates).values({ ...template, id }).returning();
    return created;
  }
  async updateRoleTemplate(id: string, template: Partial<RoleTemplate>): Promise<RoleTemplate> {
    const [updated] = await db.update(schema.roleTemplates).set(template).where(eq(schema.roleTemplates.id, id)).returning();
    return updated;
  }
  async deleteRoleTemplate(id: string): Promise<void> {
    await db.delete(schema.roleTemplates).where(eq(schema.roleTemplates.id, id));
  }

  // Saved Views
  async getSavedViews(): Promise<SavedView[]> {
    return await db.select().from(schema.savedViews);
  }
  async getSavedViewById(id: string): Promise<SavedView | undefined> {
    const [view] = await db.select().from(schema.savedViews).where(eq(schema.savedViews.id, id));
    return view;
  }
  async createSavedView(view: InsertSavedView): Promise<SavedView> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.savedViews).values({ ...view, id }).returning();
    return created;
  }
  async updateSavedView(id: string, view: Partial<SavedView>): Promise<SavedView> {
    const [updated] = await db.update(schema.savedViews).set(view).where(eq(schema.savedViews.id, id)).returning();
    return updated;
  }
  async deleteSavedView(id: string): Promise<void> {
    await db.delete(schema.savedViews).where(eq(schema.savedViews.id, id));
  }

  // Guidance Items
  async getGuidanceItems(): Promise<GuidanceItem[]> {
    return await db.select().from(schema.guidanceItems);
  }
  async getGuidanceItemById(id: string): Promise<GuidanceItem | undefined> {
    const [item] = await db.select().from(schema.guidanceItems).where(eq(schema.guidanceItems.id, id));
    return item;
  }
  async createGuidanceItem(item: InsertGuidanceItem): Promise<GuidanceItem> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.guidanceItems).values({ ...item, id }).returning();
    return created;
  }
  async updateGuidanceItem(id: string, item: Partial<GuidanceItem>): Promise<GuidanceItem> {
    const [updated] = await db.update(schema.guidanceItems).set(item).where(eq(schema.guidanceItems.id, id)).returning();
    return updated;
  }
  async deleteGuidanceItem(id: string): Promise<void> {
    await db.delete(schema.guidanceItems).where(eq(schema.guidanceItems.id, id));
  }

  // Project Stages
  async getProjectStages(): Promise<ProjectStage[]> {
    return await db.select().from(schema.projectStages);
  }
  async getProjectStagesByProjectId(projectId: string): Promise<ProjectStage[]> {
    return await db.select().from(schema.projectStages).where(eq(schema.projectStages.projectId, projectId));
  }
  async getProjectStageById(id: string): Promise<ProjectStage | undefined> {
    const [stage] = await db.select().from(schema.projectStages).where(eq(schema.projectStages.id, id));
    return stage;
  }
  
  // Get all epics for a project (through deliverables)
  async getEpicsByProjectId(projectId: string): Promise<Epic[]> {
    const deliverables = await this.getDeliverablesByProjectId(projectId);
    const allEpics: Epic[] = [];
    for (const del of deliverables) {
      const epics = await this.getEpicsByDeliverableId(del.id);
      allEpics.push(...epics);
    }
    return allEpics;
  }
  async createProjectStage(stage: InsertProjectStage): Promise<ProjectStage> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.projectStages).values({ ...stage, id }).returning();
    return created;
  }
  async updateProjectStage(id: string, stage: Partial<ProjectStage>): Promise<ProjectStage> {
    const [updated] = await db.update(schema.projectStages).set(stage).where(eq(schema.projectStages.id, id)).returning();
    return updated;
  }
  async deleteProjectStage(id: string): Promise<void> {
    await db.delete(schema.projectStages).where(eq(schema.projectStages.id, id));
  }

  // Framework Templates
  async getFrameworkTemplates(): Promise<FrameworkTemplate[]> {
    return await db.select().from(schema.frameworkTemplates);
  }
  async getFrameworkTemplateById(id: string): Promise<FrameworkTemplate | undefined> {
    const [template] = await db.select().from(schema.frameworkTemplates).where(eq(schema.frameworkTemplates.id, id));
    return template;
  }
  async createFrameworkTemplate(template: InsertFrameworkTemplate): Promise<FrameworkTemplate> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.frameworkTemplates).values({ ...template, id }).returning();
    return created;
  }
  async updateFrameworkTemplate(id: string, template: Partial<FrameworkTemplate>): Promise<FrameworkTemplate> {
    const [updated] = await db.update(schema.frameworkTemplates).set(template).where(eq(schema.frameworkTemplates.id, id)).returning();
    return updated;
  }
  async deleteFrameworkTemplate(id: string): Promise<void> {
    await db.delete(schema.frameworkTemplates).where(eq(schema.frameworkTemplates.id, id));
  }

  // Stage Templates
  async getStageTemplates(): Promise<StageTemplate[]> {
    return await db.select().from(schema.stageTemplates);
  }
  async getStageTemplateById(id: string): Promise<StageTemplate | undefined> {
    const [template] = await db.select().from(schema.stageTemplates).where(eq(schema.stageTemplates.id, id));
    return template;
  }
  async createStageTemplate(template: InsertStageTemplate): Promise<StageTemplate> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.stageTemplates).values({ ...template, id }).returning();
    return created;
  }
  async updateStageTemplate(id: string, template: Partial<StageTemplate>): Promise<StageTemplate> {
    const [updated] = await db.update(schema.stageTemplates).set(template).where(eq(schema.stageTemplates.id, id)).returning();
    return updated;
  }
  async deleteStageTemplate(id: string): Promise<void> {
    await db.delete(schema.stageTemplates).where(eq(schema.stageTemplates.id, id));
  }

  // Project Templates
  async getProjectTemplates(): Promise<ProjectTemplate[]> {
    return await db.select().from(schema.projectTemplates);
  }
  async getProjectTemplateById(id: string): Promise<ProjectTemplate | undefined> {
    const [template] = await db.select().from(schema.projectTemplates).where(eq(schema.projectTemplates.id, id));
    return template;
  }
  async createProjectTemplate(template: InsertProjectTemplate): Promise<ProjectTemplate> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.projectTemplates).values({ ...template, id }).returning();
    return created;
  }
  async updateProjectTemplate(id: string, template: Partial<ProjectTemplate>): Promise<ProjectTemplate> {
    const [updated] = await db.update(schema.projectTemplates).set(template).where(eq(schema.projectTemplates.id, id)).returning();
    return updated;
  }
  async deleteProjectTemplate(id: string): Promise<void> {
    await db.delete(schema.projectTemplates).where(eq(schema.projectTemplates.id, id));
  }

  // Deliverable Templates
  async getDeliverableTemplates(): Promise<DeliverableTemplate[]> {
    return await db.select().from(schema.deliverableTemplates);
  }
  async getDeliverableTemplateById(id: string): Promise<DeliverableTemplate | undefined> {
    const [template] = await db.select().from(schema.deliverableTemplates).where(eq(schema.deliverableTemplates.id, id));
    return template;
  }
  async createDeliverableTemplate(template: InsertDeliverableTemplate): Promise<DeliverableTemplate> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.deliverableTemplates).values({ ...template, id }).returning();
    return created;
  }
  async updateDeliverableTemplate(id: string, template: Partial<DeliverableTemplate>): Promise<DeliverableTemplate> {
    const [updated] = await db.update(schema.deliverableTemplates).set(template).where(eq(schema.deliverableTemplates.id, id)).returning();
    return updated;
  }
  async deleteDeliverableTemplate(id: string): Promise<void> {
    await db.delete(schema.deliverableTemplates).where(eq(schema.deliverableTemplates.id, id));
  }

  // Epic Templates
  async getEpicTemplates(): Promise<EpicTemplate[]> {
    return await db.select().from(schema.epicTemplates);
  }
  async getEpicTemplateById(id: string): Promise<EpicTemplate | undefined> {
    const [template] = await db.select().from(schema.epicTemplates).where(eq(schema.epicTemplates.id, id));
    return template;
  }
  async createEpicTemplate(template: InsertEpicTemplate): Promise<EpicTemplate> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.epicTemplates).values({ ...template, id }).returning();
    return created;
  }
  async updateEpicTemplate(id: string, template: Partial<EpicTemplate>): Promise<EpicTemplate> {
    const [updated] = await db.update(schema.epicTemplates).set(template).where(eq(schema.epicTemplates.id, id)).returning();
    return updated;
  }
  async deleteEpicTemplate(id: string): Promise<void> {
    await db.delete(schema.epicTemplates).where(eq(schema.epicTemplates.id, id));
  }

  // Task Templates
  async getTaskTemplates(): Promise<TaskTemplate[]> {
    return await db.select().from(schema.taskTemplates);
  }
  async getTaskTemplateById(id: string): Promise<TaskTemplate | undefined> {
    const [template] = await db.select().from(schema.taskTemplates).where(eq(schema.taskTemplates.id, id));
    return template;
  }
  async createTaskTemplate(template: InsertTaskTemplate): Promise<TaskTemplate> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.taskTemplates).values({ ...template, id }).returning();
    return created;
  }
  async updateTaskTemplate(id: string, template: Partial<TaskTemplate>): Promise<TaskTemplate> {
    const [updated] = await db.update(schema.taskTemplates).set(template).where(eq(schema.taskTemplates.id, id)).returning();
    return updated;
  }
  async deleteTaskTemplate(id: string): Promise<void> {
    await db.delete(schema.taskTemplates).where(eq(schema.taskTemplates.id, id));
  }

  // Mapping Templates
  async getMappingTemplates(): Promise<MappingTemplate[]> {
    return await db.select().from(schema.mappingTemplates);
  }
  async getMappingTemplateById(id: string): Promise<MappingTemplate | undefined> {
    const [template] = await db.select().from(schema.mappingTemplates).where(eq(schema.mappingTemplates.id, id));
    return template;
  }
  async createMappingTemplate(template: InsertMappingTemplate): Promise<MappingTemplate> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.mappingTemplates).values({ ...template, id }).returning();
    return created;
  }
  async updateMappingTemplate(id: string, template: Partial<MappingTemplate>): Promise<MappingTemplate> {
    const [updated] = await db.update(schema.mappingTemplates).set(template).where(eq(schema.mappingTemplates.id, id)).returning();
    return updated;
  }
  async deleteMappingTemplate(id: string): Promise<void> {
    await db.delete(schema.mappingTemplates).where(eq(schema.mappingTemplates.id, id));
  }

  // Milestone Templates
  async getMilestoneTemplates(): Promise<MilestoneTemplate[]> {
    return await db.select().from(schema.milestoneTemplates);
  }
  async getMilestoneTemplateById(id: string): Promise<MilestoneTemplate | undefined> {
    const [template] = await db.select().from(schema.milestoneTemplates).where(eq(schema.milestoneTemplates.id, id));
    return template;
  }
  async createMilestoneTemplate(template: InsertMilestoneTemplate): Promise<MilestoneTemplate> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.milestoneTemplates).values({ ...template, id }).returning();
    return created;
  }
  async updateMilestoneTemplate(id: string, template: Partial<MilestoneTemplate>): Promise<MilestoneTemplate> {
    const [updated] = await db.update(schema.milestoneTemplates).set(template).where(eq(schema.milestoneTemplates.id, id)).returning();
    return updated;
  }
  async deleteMilestoneTemplate(id: string): Promise<void> {
    await db.delete(schema.milestoneTemplates).where(eq(schema.milestoneTemplates.id, id));
  }

  // Template Snippets
  async getTemplateSnippets(): Promise<TemplateSnippet[]> {
    return await db.select().from(schema.templateSnippets);
  }
  async getTemplateSnippetById(id: string): Promise<TemplateSnippet | undefined> {
    const [snippet] = await db.select().from(schema.templateSnippets).where(eq(schema.templateSnippets.id, id));
    return snippet;
  }
  async createTemplateSnippet(snippet: InsertTemplateSnippet): Promise<TemplateSnippet> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.templateSnippets).values({ ...snippet, id }).returning();
    return created;
  }
  async updateTemplateSnippet(id: string, snippet: Partial<TemplateSnippet>): Promise<TemplateSnippet> {
    const [updated] = await db.update(schema.templateSnippets).set(snippet).where(eq(schema.templateSnippets.id, id)).returning();
    return updated;
  }
  async deleteTemplateSnippet(id: string): Promise<void> {
    await db.delete(schema.templateSnippets).where(eq(schema.templateSnippets.id, id));
  }

  // Status Options
  async getStatusOptions(): Promise<StatusOption[]> {
    return await db.select().from(schema.statusOptions);
  }
  async getStatusOptionById(id: string): Promise<StatusOption | undefined> {
    const [option] = await db.select().from(schema.statusOptions).where(eq(schema.statusOptions.id, id));
    return option;
  }
  async getStatusOptionsByType(type: string): Promise<StatusOption[]> {
    return await db.select().from(schema.statusOptions).where(eq(schema.statusOptions.type, type));
  }
  async getDefaultStatusByType(type: string): Promise<string> {
    const options = await this.getStatusOptionsByType(type);
    const defaultOption = options.find(o => o.isDefault);
    if (defaultOption) return defaultOption.label;
    if (options.length > 0) return options[0].label;
    return type === "task" ? "Todo" : "Active";
  }
  async validateAndResolveStatus(status: string | null | undefined, type: string): Promise<string> {
    const options = await this.getStatusOptionsByType(type);
    const validLabels = options.map(o => o.label.toLowerCase());
    if (status && validLabels.includes(status.toLowerCase())) {
      const matched = options.find(o => o.label.toLowerCase() === status.toLowerCase());
      return matched?.label || status;
    }
    return this.getDefaultStatusByType(type);
  }
  async createStatusOption(option: InsertStatusOption): Promise<StatusOption> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.statusOptions).values({ ...option, id }).returning();
    return created;
  }
  async updateStatusOption(id: string, option: Partial<StatusOption>): Promise<StatusOption> {
    const [updated] = await db.update(schema.statusOptions).set(option).where(eq(schema.statusOptions.id, id)).returning();
    return updated;
  }
  async deleteStatusOption(id: string): Promise<void> {
    await db.delete(schema.statusOptions).where(eq(schema.statusOptions.id, id));
  }

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
    const [projectsResult] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.projects).where(eq(schema.projects.status, statusLabel));
    const [deliverablesResult] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.deliverables).where(eq(schema.deliverables.status, statusLabel));
    const [epicsResult] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.epics).where(eq(schema.epics.status, statusLabel));
    const [tasksResult] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.tasks).where(eq(schema.tasks.status, statusLabel));
    const [sprintsResult] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.sprints).where(eq(schema.sprints.status, statusLabel));
    const [milestonesResult] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.milestones).where(eq(schema.milestones.status, statusLabel));
    const [projectStagesResult] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.projectStages).where(eq(schema.projectStages.status, statusLabel));
    const [workBlocksResult] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.workBlocks).where(eq(schema.workBlocks.status, statusLabel));
    
    const projects = projectsResult?.count || 0;
    const deliverables = deliverablesResult?.count || 0;
    const epics = epicsResult?.count || 0;
    const tasks = tasksResult?.count || 0;
    const sprints = sprintsResult?.count || 0;
    const milestones = milestonesResult?.count || 0;
    const projectStages = projectStagesResult?.count || 0;
    const workBlocks = workBlocksResult?.count || 0;
    
    return {
      projects,
      deliverables,
      epics,
      tasks,
      sprints,
      milestones,
      projectStages,
      workBlocks,
      total: projects + deliverables + epics + tasks + sprints + milestones + projectStages + workBlocks
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
    const shouldUpdate = (type: string) => !entityTypes || entityTypes.length === 0 || entityTypes.includes(type);
    
    let projects = 0, deliverables = 0, epics = 0, tasks = 0, sprints = 0, milestones = 0, projectStages = 0, workBlocks = 0;
    
    if (shouldUpdate('projects')) {
      const result = await db.update(schema.projects).set({ status: newStatus }).where(eq(schema.projects.status, oldStatus));
      projects = result.rowCount || 0;
    }
    if (shouldUpdate('deliverables')) {
      const result = await db.update(schema.deliverables).set({ status: newStatus }).where(eq(schema.deliverables.status, oldStatus));
      deliverables = result.rowCount || 0;
    }
    if (shouldUpdate('epics')) {
      const result = await db.update(schema.epics).set({ status: newStatus }).where(eq(schema.epics.status, oldStatus));
      epics = result.rowCount || 0;
    }
    if (shouldUpdate('tasks')) {
      const result = await db.update(schema.tasks).set({ status: newStatus }).where(eq(schema.tasks.status, oldStatus));
      tasks = result.rowCount || 0;
    }
    if (shouldUpdate('sprints')) {
      const result = await db.update(schema.sprints).set({ status: newStatus }).where(eq(schema.sprints.status, oldStatus));
      sprints = result.rowCount || 0;
    }
    if (shouldUpdate('milestones')) {
      const result = await db.update(schema.milestones).set({ status: newStatus }).where(eq(schema.milestones.status, oldStatus));
      milestones = result.rowCount || 0;
    }
    if (shouldUpdate('projectStages')) {
      const result = await db.update(schema.projectStages).set({ status: newStatus }).where(eq(schema.projectStages.status, oldStatus));
      projectStages = result.rowCount || 0;
    }
    if (shouldUpdate('workBlocks')) {
      const result = await db.update(schema.workBlocks).set({ status: newStatus }).where(eq(schema.workBlocks.status, oldStatus));
      workBlocks = result.rowCount || 0;
    }
    
    return {
      projects,
      deliverables,
      epics,
      tasks,
      sprints,
      milestones,
      projectStages,
      workBlocks,
      total: projects + deliverables + epics + tasks + sprints + milestones + projectStages + workBlocks
    };
  }

  // Role Types
  async getRoleTypes(): Promise<RoleType[]> {
    return await db.select().from(schema.roleTypes);
  }
  async getRoleTypeById(id: string): Promise<RoleType | undefined> {
    const [roleType] = await db.select().from(schema.roleTypes).where(eq(schema.roleTypes.id, id));
    return roleType;
  }
  async createRoleType(roleType: InsertRoleType): Promise<RoleType> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.roleTypes).values({ ...roleType, id }).returning();
    return created;
  }
  async updateRoleType(id: string, roleType: Partial<RoleType>): Promise<RoleType> {
    const [updated] = await db.update(schema.roleTypes).set(roleType).where(eq(schema.roleTypes.id, id)).returning();
    return updated;
  }
  async deleteRoleType(id: string): Promise<void> {
    await db.delete(schema.roleTypes).where(eq(schema.roleTypes.id, id));
  }

  // Project Task Statuses
  async getProjectTaskStatuses(): Promise<ProjectTaskStatus[]> {
    return await db.select().from(schema.projectTaskStatuses).orderBy(schema.projectTaskStatuses.order);
  }
  async getProjectTaskStatusById(id: string): Promise<ProjectTaskStatus | undefined> {
    const [status] = await db.select().from(schema.projectTaskStatuses).where(eq(schema.projectTaskStatuses.id, id));
    return status;
  }
  async getProjectTaskStatusesByProjectId(projectId: string): Promise<ProjectTaskStatus[]> {
    return await db.select().from(schema.projectTaskStatuses)
      .where(eq(schema.projectTaskStatuses.projectId, projectId))
      .orderBy(schema.projectTaskStatuses.order);
  }
  async createProjectTaskStatus(status: InsertProjectTaskStatus): Promise<ProjectTaskStatus> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.projectTaskStatuses).values({ ...status, id }).returning();
    return created;
  }
  async updateProjectTaskStatus(id: string, status: Partial<ProjectTaskStatus>): Promise<ProjectTaskStatus> {
    const [updated] = await db.update(schema.projectTaskStatuses).set(status).where(eq(schema.projectTaskStatuses.id, id)).returning();
    return updated;
  }
  async deleteProjectTaskStatus(id: string): Promise<void> {
    await db.delete(schema.projectTaskStatuses).where(eq(schema.projectTaskStatuses.id, id));
  }
  async deleteProjectTaskStatusesByProjectId(projectId: string): Promise<void> {
    await db.delete(schema.projectTaskStatuses).where(eq(schema.projectTaskStatuses.projectId, projectId));
  }

  // Project Settings
  async getProjectSettings(): Promise<ProjectSettings[]> {
    return await db.select().from(schema.projectSettings);
  }
  async getProjectSettingsById(id: string): Promise<ProjectSettings | undefined> {
    const [settings] = await db.select().from(schema.projectSettings).where(eq(schema.projectSettings.id, id));
    return settings;
  }
  async getProjectSettingsByProjectId(projectId: string): Promise<ProjectSettings | undefined> {
    const [settings] = await db.select().from(schema.projectSettings).where(eq(schema.projectSettings.projectId, projectId));
    return settings;
  }
  async createProjectSettings(settings: InsertProjectSettings): Promise<ProjectSettings> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.projectSettings).values({ ...settings, id }).returning();
    return created;
  }
  async updateProjectSettings(id: string, settings: Partial<ProjectSettings>): Promise<ProjectSettings> {
    const [updated] = await db.update(schema.projectSettings).set({ ...settings, updatedAt: new Date() }).where(eq(schema.projectSettings.id, id)).returning();
    return updated;
  }
  async upsertProjectSettings(projectId: string, settings: Partial<InsertProjectSettings>): Promise<ProjectSettings> {
    const existing = await this.getProjectSettingsByProjectId(projectId);
    if (existing) {
      return await this.updateProjectSettings(existing.id, settings);
    } else {
      return await this.createProjectSettings({ projectId, ...settings } as InsertProjectSettings);
    }
  }

  // Sprints (delegated to sprint-repository)
  async getSprints(): Promise<Sprint[]> {
    return sprintRepository.getSprints();
  }
  async getSprintById(id: string): Promise<Sprint | undefined> {
    return sprintRepository.getSprintById(id);
  }
  async getSprintsByProjectId(projectId: string): Promise<Sprint[]> {
    return sprintRepository.getSprintsByProjectId(projectId);
  }
  async createSprint(sprint: InsertSprint): Promise<Sprint> {
    return sprintRepository.createSprint(sprint);
  }
  async updateSprint(id: string, sprint: Partial<Sprint>): Promise<Sprint> {
    return sprintRepository.updateSprint(id, sprint);
  }
  async deleteSprint(id: string): Promise<void> {
    return sprintRepository.deleteSprint(id);
  }

  // Sprint Members (delegated to sprint-repository)
  async getSprintMembers(): Promise<SprintMember[]> {
    return sprintRepository.getSprintMembers();
  }
  async getSprintMemberById(id: string): Promise<SprintMember | undefined> {
    return sprintRepository.getSprintMemberById(id);
  }
  async getSprintMembersBySprintId(sprintId: string): Promise<SprintMember[]> {
    return sprintRepository.getSprintMembersBySprintId(sprintId);
  }
  async createSprintMember(member: InsertSprintMember): Promise<SprintMember> {
    return sprintRepository.createSprintMember(member);
  }
  async updateSprintMember(id: string, member: Partial<SprintMember>): Promise<SprintMember> {
    return sprintRepository.updateSprintMember(id, member);
  }
  async deleteSprintMember(id: string): Promise<void> {
    return sprintRepository.deleteSprintMember(id);
  }

  // Sprint Scope Events (delegated to sprint-repository)
  async getSprintScopeEvents(): Promise<SprintScopeEvent[]> {
    return sprintRepository.getSprintScopeEvents();
  }
  async getSprintScopeEventsBySprintId(sprintId: string): Promise<SprintScopeEvent[]> {
    return sprintRepository.getSprintScopeEventsBySprintId(sprintId);
  }
  async createSprintScopeEvent(event: InsertSprintScopeEvent): Promise<SprintScopeEvent> {
    return sprintRepository.createSprintScopeEvent(event);
  }

  // Sprint Scope Targets (delegated to sprint-repository)
  async getSprintScopeTargets(): Promise<SprintScopeTarget[]> {
    return sprintRepository.getSprintScopeTargets();
  }
  async getSprintScopeTargetsBySprintId(sprintId: string): Promise<SprintScopeTarget[]> {
    return sprintRepository.getSprintScopeTargetsBySprintId(sprintId);
  }
  async createSprintScopeTarget(target: InsertSprintScopeTarget): Promise<SprintScopeTarget> {
    return sprintRepository.createSprintScopeTarget(target);
  }
  async deleteSprintScopeTarget(id: string): Promise<void> {
    return sprintRepository.deleteSprintScopeTarget(id);
  }
  async deleteSprintScopeTargetsBySprintId(sprintId: string): Promise<void> {
    return sprintRepository.deleteSprintScopeTargetsBySprintId(sprintId);
  }

  // Sprint Pulse Updates (delegated to sprint-repository)
  async getSprintPulseUpdates(): Promise<SprintPulseUpdate[]> {
    return sprintRepository.getSprintPulseUpdates();
  }
  async getSprintPulseUpdatesBySprintId(sprintId: string): Promise<SprintPulseUpdate[]> {
    return sprintRepository.getSprintPulseUpdatesBySprintId(sprintId);
  }
  async getSprintPulseUpdateByUserAndDate(sprintId: string, userId: string, date: string): Promise<SprintPulseUpdate | undefined> {
    return sprintRepository.getSprintPulseUpdateByUserAndDate(sprintId, userId, date);
  }
  async createSprintPulseUpdate(update: InsertSprintPulseUpdate): Promise<SprintPulseUpdate> {
    return sprintRepository.createSprintPulseUpdate(update);
  }
  async updateSprintPulseUpdate(id: string, update: Partial<SprintPulseUpdate>): Promise<SprintPulseUpdate> {
    return sprintRepository.updateSprintPulseUpdate(id, update);
  }
  async deleteSprintPulseUpdate(id: string): Promise<void> {
    return sprintRepository.deleteSprintPulseUpdate(id);
  }

  // Home Page Data
  async getTasksByAssignee(assigneeId: string): Promise<Task[]> {
    return await db.select().from(schema.tasks).where(eq(schema.tasks.assigneeId, assigneeId));
  }

  async getTasksForUserHome(userId: string): Promise<any[]> {
    const tasks = await db
      .select({
        id: schema.tasks.id,
        title: schema.tasks.title,
        description: schema.tasks.description,
        status: schema.tasks.status,
        priority: schema.tasks.priority,
        deadline: schema.tasks.deadline,
        estimateHours: schema.tasks.estimateHours,
        projectId: schema.tasks.projectId,
        projectName: schema.projects.name,
        epicId: schema.tasks.epicId,
        epicTitle: schema.epics.title,
        deliverableId: schema.epics.deliverableId,
        milestoneId: schema.tasks.milestoneId,
        assigneeId: schema.tasks.assigneeId,
      })
      .from(schema.tasks)
      .leftJoin(schema.projects, eq(schema.tasks.projectId, schema.projects.id))
      .leftJoin(schema.epics, eq(schema.tasks.epicId, schema.epics.id))
      .where(eq(schema.tasks.assigneeId, userId));
    return tasks;
  }

  async getUpcomingMilestones(): Promise<any[]> {
    const milestones = await db
      .select({
        id: schema.milestones.id,
        name: schema.milestones.name,
        targetDate: schema.milestones.targetDate,
        status: schema.milestones.status,
        progressPercent: schema.milestones.progressPercent,
        projectId: schema.milestones.projectId,
        projectName: schema.projects.name,
      })
      .from(schema.milestones)
      .leftJoin(schema.projects, eq(schema.milestones.projectId, schema.projects.id));
    return milestones;
  }

  async getActiveProjectsWithProgress(): Promise<any[]> {
    const projects = await db
      .select({
        id: schema.projects.id,
        name: schema.projects.name,
        status: schema.projects.status,
        progress: schema.projects.progress,
        startDate: schema.projects.startDate,
        deadline: schema.projects.deadline,
        client: schema.projects.client,
      })
      .from(schema.projects)
      .where(
        or(
          eq(schema.projects.status, 'Active'),
          eq(schema.projects.status, 'In Progress')
        )
      );
    return projects;
  }

  // User Preferences
  async getAllUserPreferences(): Promise<UserPreferences[]> {
    return await db.select().from(schema.userPreferences);
  }
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [prefs] = await db.select().from(schema.userPreferences).where(eq(schema.userPreferences.userId, userId));
    return prefs;
  }
  async createUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences> {
    const id = crypto.randomUUID();
    const [created] = await db.insert(schema.userPreferences).values({ ...prefs, id }).returning();
    return created;
  }
  async updateUserPreferences(userId: string, prefs: Partial<UserPreferences>): Promise<UserPreferences> {
    const [updated] = await db.update(schema.userPreferences).set(prefs).where(eq(schema.userPreferences.userId, userId)).returning();
    return updated;
  }

  // Work Blocks
  async getAllWorkBlocks(): Promise<WorkBlock[]> {
    return await db.select().from(schema.workBlocks);
  }
  async getWorkBlocksByUserAndDate(userId: string, date: string): Promise<WorkBlock[]> {
    return await db.select().from(schema.workBlocks).where(
      and(eq(schema.workBlocks.userId, userId), eq(schema.workBlocks.date, date))
    );
  }
  async createWorkBlock(block: InsertWorkBlock): Promise<WorkBlock> {
    const id = crypto.randomUUID();
    const [created] = await db.insert(schema.workBlocks).values({ ...block, id }).returning();
    return created;
  }
  async updateWorkBlock(id: string, block: Partial<WorkBlock>): Promise<WorkBlock> {
    const [updated] = await db.update(schema.workBlocks).set({ ...block, updatedAt: new Date() }).where(eq(schema.workBlocks.id, id)).returning();
    return updated;
  }
  async deleteWorkBlock(id: string): Promise<void> {
    await db.delete(schema.workBlocks).where(eq(schema.workBlocks.id, id));
  }

  // Day Plans
  async getAllDayPlans(): Promise<DayPlan[]> {
    return await db.select().from(schema.dayPlans);
  }
  async getDayPlan(userId: string, date: string): Promise<DayPlan | undefined> {
    const [plan] = await db.select().from(schema.dayPlans).where(
      and(eq(schema.dayPlans.userId, userId), eq(schema.dayPlans.date, date))
    );
    return plan;
  }
  async createDayPlan(plan: InsertDayPlan): Promise<DayPlan> {
    const id = crypto.randomUUID();
    const [created] = await db.insert(schema.dayPlans).values({ ...plan, id }).returning();
    return created;
  }
  async updateDayPlan(userId: string, date: string, plan: Partial<DayPlan>): Promise<DayPlan> {
    const [updated] = await db.update(schema.dayPlans).set({ ...plan, updatedAt: new Date() }).where(
      and(eq(schema.dayPlans.userId, userId), eq(schema.dayPlans.date, date))
    ).returning();
    return updated;
  }

  // Project Favorites
  async getAllProjectFavorites(): Promise<ProjectFavorite[]> {
    return await db.select().from(schema.projectFavorites);
  }
  async getProjectFavoritesByUserId(userId: string): Promise<ProjectFavorite[]> {
    return await db.select().from(schema.projectFavorites).where(eq(schema.projectFavorites.userId, userId));
  }
  async createProjectFavorite(favorite: InsertProjectFavorite): Promise<ProjectFavorite> {
    const id = crypto.randomUUID();
    const [created] = await db.insert(schema.projectFavorites).values({ ...favorite, id }).returning();
    return created;
  }
  async deleteProjectFavorite(userId: string, projectId: string): Promise<void> {
    await db.delete(schema.projectFavorites).where(
      and(eq(schema.projectFavorites.userId, userId), eq(schema.projectFavorites.projectId, projectId))
    );
  }
  async isProjectFavorite(userId: string, projectId: string): Promise<boolean> {
    const [favorite] = await db.select().from(schema.projectFavorites).where(
      and(eq(schema.projectFavorites.userId, userId), eq(schema.projectFavorites.projectId, projectId))
    );
    return !!favorite;
  }

  // Task Types (global)
  async getTaskTypes(): Promise<TaskType[]> {
    return await db.select().from(schema.taskTypes);
  }
  async getTaskTypeById(id: string): Promise<TaskType | undefined> {
    const [taskType] = await db.select().from(schema.taskTypes).where(eq(schema.taskTypes.id, id));
    return taskType;
  }
  async createTaskType(taskType: InsertTaskType): Promise<TaskType> {
    const id = crypto.randomUUID();
    const [created] = await db.insert(schema.taskTypes).values({ ...taskType, id }).returning();
    return created;
  }
  async updateTaskType(id: string, taskType: Partial<TaskType>): Promise<TaskType> {
    const [updated] = await db.update(schema.taskTypes).set(taskType).where(eq(schema.taskTypes.id, id)).returning();
    return updated;
  }
  async deleteTaskType(id: string): Promise<void> {
    await db.delete(schema.taskTypes).where(eq(schema.taskTypes.id, id));
  }

  // Project Task Types (project-level overrides)
  async getProjectTaskTypes(): Promise<ProjectTaskType[]> {
    return await db.select().from(schema.projectTaskTypes);
  }
  async getProjectTaskTypeById(id: string): Promise<ProjectTaskType | undefined> {
    const [projectTaskType] = await db.select().from(schema.projectTaskTypes).where(eq(schema.projectTaskTypes.id, id));
    return projectTaskType;
  }
  async getProjectTaskTypesByProjectId(projectId: string): Promise<ProjectTaskType[]> {
    return await db.select().from(schema.projectTaskTypes).where(eq(schema.projectTaskTypes.projectId, projectId));
  }
  async createProjectTaskType(projectTaskType: InsertProjectTaskType): Promise<ProjectTaskType> {
    const id = crypto.randomUUID();
    const [created] = await db.insert(schema.projectTaskTypes).values({ ...projectTaskType, id }).returning();
    return created;
  }
  async updateProjectTaskType(id: string, projectTaskType: Partial<ProjectTaskType>): Promise<ProjectTaskType> {
    const [updated] = await db.update(schema.projectTaskTypes).set(projectTaskType).where(eq(schema.projectTaskTypes.id, id)).returning();
    return updated;
  }
  async deleteProjectTaskType(id: string): Promise<void> {
    await db.delete(schema.projectTaskTypes).where(eq(schema.projectTaskTypes.id, id));
  }
  async deleteProjectTaskTypesByProjectId(projectId: string): Promise<void> {
    await db.delete(schema.projectTaskTypes).where(eq(schema.projectTaskTypes.projectId, projectId));
  }

  // Task Dependencies (delegated to task-repository)
  async getTaskDependencies(): Promise<TaskDependency[]> {
    return taskRepository.getTaskDependencies();
  }
  async getTaskDependencyById(id: string): Promise<TaskDependency | undefined> {
    return taskRepository.getTaskDependencyById(id);
  }
  async getTaskDependenciesByTaskId(taskId: string): Promise<TaskDependency[]> {
    return taskRepository.getTaskDependenciesByTaskId(taskId);
  }
  async getDependentTasksByTaskId(taskId: string): Promise<TaskDependency[]> {
    return taskRepository.getDependentTasksByTaskId(taskId);
  }
  async createTaskDependency(dependency: InsertTaskDependency): Promise<TaskDependency> {
    return taskRepository.createTaskDependency(dependency);
  }
  async updateTaskDependency(id: string, dependency: Partial<TaskDependency>): Promise<TaskDependency> {
    return taskDependencyRepository.updateTaskDependency(id, dependency);
  }
  async deleteTaskDependency(id: string): Promise<void> {
    return taskRepository.deleteTaskDependency(id);
  }
  async deleteTaskDependenciesByTaskId(taskId: string): Promise<void> {
    return taskRepository.deleteTaskDependenciesByTaskId(taskId);
  }

  // Task Dependency Scope Rules (delegated to task-dependency-repository)
  async getTaskDependencyScopeRules(): Promise<TaskDependencyScopeRule[]> {
    return taskDependencyRepository.getTaskDependencyScopeRules();
  }
  async getTaskDependencyScopeRuleById(id: string): Promise<TaskDependencyScopeRule | undefined> {
    return taskDependencyRepository.getTaskDependencyScopeRuleById(id);
  }
  async getTaskDependencyScopeRulesByTaskId(taskId: string): Promise<TaskDependencyScopeRule[]> {
    return taskDependencyRepository.getTaskDependencyScopeRulesByTaskId(taskId);
  }
  async createTaskDependencyScopeRule(rule: InsertTaskDependencyScopeRule): Promise<TaskDependencyScopeRule> {
    return taskDependencyRepository.createTaskDependencyScopeRule(rule);
  }
  async updateTaskDependencyScopeRule(id: string, rule: Partial<TaskDependencyScopeRule>): Promise<TaskDependencyScopeRule> {
    return taskDependencyRepository.updateTaskDependencyScopeRule(id, rule);
  }
  async deleteTaskDependencyScopeRule(id: string): Promise<void> {
    return taskDependencyRepository.deleteTaskDependencyScopeRule(id);
  }

  // Epic Types (global)
  async getEpicTypes(): Promise<EpicType[]> {
    return await db.select().from(schema.epicTypes);
  }
  async getEpicTypeById(id: string): Promise<EpicType | undefined> {
    const [epicType] = await db.select().from(schema.epicTypes).where(eq(schema.epicTypes.id, id));
    return epicType;
  }
  async createEpicType(epicType: InsertEpicType): Promise<EpicType> {
    const id = crypto.randomUUID();
    const [created] = await db.insert(schema.epicTypes).values({ ...epicType, id }).returning();
    return created;
  }
  async updateEpicType(id: string, epicType: Partial<EpicType>): Promise<EpicType> {
    const [updated] = await db.update(schema.epicTypes).set(epicType).where(eq(schema.epicTypes.id, id)).returning();
    return updated;
  }
  async deleteEpicType(id: string): Promise<void> {
    await db.delete(schema.epicTypes).where(eq(schema.epicTypes.id, id));
  }

  // Deliverable Types (global)
  async getDeliverableTypes(): Promise<DeliverableType[]> {
    return await db.select().from(schema.deliverableTypes);
  }
  async getDeliverableTypeById(id: string): Promise<DeliverableType | undefined> {
    const [deliverableType] = await db.select().from(schema.deliverableTypes).where(eq(schema.deliverableTypes.id, id));
    return deliverableType;
  }
  async createDeliverableType(deliverableType: InsertDeliverableType): Promise<DeliverableType> {
    const id = crypto.randomUUID();
    const [created] = await db.insert(schema.deliverableTypes).values({ ...deliverableType, id }).returning();
    return created;
  }
  async updateDeliverableType(id: string, deliverableType: Partial<DeliverableType>): Promise<DeliverableType> {
    const [updated] = await db.update(schema.deliverableTypes).set(deliverableType).where(eq(schema.deliverableTypes.id, id)).returning();
    return updated;
  }
  async deleteDeliverableType(id: string): Promise<void> {
    await db.delete(schema.deliverableTypes).where(eq(schema.deliverableTypes.id, id));
  }

  // Subtasks (delegated to task-repository)
  async getSubtasksByParentId(parentTaskId: string): Promise<Task[]> {
    return taskRepository.getSubtasksByParentId(parentTaskId);
  }

  // User Role Eligibility
  async getUserRoleEligibility(): Promise<UserRoleEligibility[]> {
    return await db.select().from(schema.userRoleEligibility);
  }

  // App Settings
  async getAppSettings(): Promise<AppSettings | undefined> {
    const [settings] = await db.select().from(schema.appSettings).where(eq(schema.appSettings.id, "default"));
    return settings;
  }

  async updateAppSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const existing = await this.getAppSettings();
    if (existing) {
      const [updated] = await db.update(schema.appSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(schema.appSettings.id, "default"))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(schema.appSettings)
        .values({ id: "default", ...settings })
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
