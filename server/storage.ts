import { db } from "./db";
import { eq, and } from "drizzle-orm";
import * as schema from "@shared/schema";
import type {
  User, InsertUser,
  Project, InsertProject,
  Deliverable, InsertDeliverable,
  Epic, InsertEpic,
  Task, InsertTask,
  Milestone, InsertMilestone,
  MilestoneScopeRule, InsertMilestoneScopeRule,
  MilestoneTaskLink, InsertMilestoneTaskLink,
  Activity, InsertActivity,
  Comment, InsertComment,
  Attachment, InsertAttachment,
  History, InsertHistory,
  ProjectRole, InsertProjectRole,
  RoleAssignment, InsertRoleAssignment,
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
  StatusOption, InsertStatusOption,
  RoleType, InsertRoleType,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;

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
  getCommentsByTaskId(taskId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: string): Promise<void>;

  // Attachments
  getAttachmentsByTaskId(taskId: string): Promise<Attachment[]>;
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  deleteAttachment(id: string): Promise<void>;

  // History
  getHistoryByTaskId(taskId: string): Promise<History[]>;
  createHistory(history: InsertHistory): Promise<History>;

  // Project Roles
  getProjectRoles(): Promise<ProjectRole[]>;
  getProjectRoleById(id: string): Promise<ProjectRole | undefined>;
  createProjectRole(role: InsertProjectRole): Promise<ProjectRole>;
  updateProjectRole(id: string, role: Partial<ProjectRole>): Promise<ProjectRole>;
  deleteProjectRole(id: string): Promise<void>;

  // Role Assignments
  getRoleAssignments(): Promise<RoleAssignment[]>;
  getRoleAssignmentById(id: string): Promise<RoleAssignment | undefined>;
  getRoleAssignmentsByRoleId(roleId: string): Promise<RoleAssignment[]>;
  createRoleAssignment(assignment: InsertRoleAssignment): Promise<RoleAssignment>;
  updateRoleAssignment(id: string, assignment: Partial<RoleAssignment>): Promise<RoleAssignment>;
  deleteRoleAssignment(id: string): Promise<void>;

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
  getProjectStageById(id: string): Promise<ProjectStage | undefined>;
  createProjectStage(stage: InsertProjectStage): Promise<ProjectStage>;
  updateProjectStage(id: string, stage: Partial<ProjectStage>): Promise<ProjectStage>;
  deleteProjectStage(id: string): Promise<void>;

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

  // Status Options
  getStatusOptions(): Promise<StatusOption[]>;
  getStatusOptionById(id: string): Promise<StatusOption | undefined>;
  getStatusOptionsByType(type: string): Promise<StatusOption[]>;
  createStatusOption(option: InsertStatusOption): Promise<StatusOption>;
  updateStatusOption(id: string, option: Partial<StatusOption>): Promise<StatusOption>;
  deleteStatusOption(id: string): Promise<void>;

  // Role Types
  getRoleTypes(): Promise<RoleType[]>;
  getRoleTypeById(id: string): Promise<RoleType | undefined>;
  createRoleType(roleType: InsertRoleType): Promise<RoleType>;
  updateRoleType(id: string, roleType: Partial<RoleType>): Promise<RoleType>;
  deleteRoleType(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUsers(): Promise<User[]> {
    return await db.select().from(schema.users);
  }
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }
  async createUser(user: InsertUser): Promise<User> {
    const id = (user as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.users).values({ ...user, id }).returning();
    return created;
  }
  async updateUser(id: string, user: Partial<User>): Promise<User> {
    const [updated] = await db.update(schema.users).set(user).where(eq(schema.users.id, id)).returning();
    return updated;
  }
  async deleteUser(id: string): Promise<void> {
    await db.delete(schema.users).where(eq(schema.users.id, id));
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
    await db.delete(schema.projects).where(eq(schema.projects.id, id));
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
    const [created] = await db.insert(schema.deliverables).values({ ...deliverable, id }).returning();
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
    const [created] = await db.insert(schema.epics).values({ ...epic, id }).returning();
    return created;
  }
  async updateEpic(id: string, epic: Partial<Epic>): Promise<Epic> {
    const [updated] = await db.update(schema.epics).set(epic).where(eq(schema.epics.id, id)).returning();
    return updated;
  }
  async deleteEpic(id: string): Promise<void> {
    await db.delete(schema.epics).where(eq(schema.epics.id, id));
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return await db.select().from(schema.tasks);
  }
  async getTaskById(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
    return task;
  }
  async getTasksByProjectId(projectId: string): Promise<Task[]> {
    return await db.select().from(schema.tasks).where(eq(schema.tasks.projectId, projectId));
  }
  async createTask(task: InsertTask): Promise<Task> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.tasks).values({ ...task, id }).returning();
    return created;
  }
  async updateTask(id: string, task: Partial<Task>): Promise<Task> {
    const [updated] = await db.update(schema.tasks).set(task).where(eq(schema.tasks.id, id)).returning();
    return updated;
  }
  async deleteTask(id: string): Promise<void> {
    await db.delete(schema.tasks).where(eq(schema.tasks.id, id));
  }

  // Milestones
  async getMilestones(): Promise<Milestone[]> {
    return await db.select().from(schema.milestones);
  }
  async getMilestoneById(id: string): Promise<Milestone | undefined> {
    const [milestone] = await db.select().from(schema.milestones).where(eq(schema.milestones.id, id));
    return milestone;
  }
  async getMilestonesByProjectId(projectId: string): Promise<Milestone[]> {
    return await db.select().from(schema.milestones).where(eq(schema.milestones.projectId, projectId));
  }
  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.milestones).values({ ...milestone, id }).returning();
    return created;
  }
  async updateMilestone(id: string, milestone: Partial<Milestone>): Promise<Milestone> {
    const [updated] = await db.update(schema.milestones).set(milestone).where(eq(schema.milestones.id, id)).returning();
    return updated;
  }
  async deleteMilestone(id: string): Promise<void> {
    await db.delete(schema.milestones).where(eq(schema.milestones.id, id));
  }

  // Milestone Scope Rules
  async getMilestoneScopeRules(): Promise<MilestoneScopeRule[]> {
    return await db.select().from(schema.milestoneScopeRules);
  }
  async getMilestoneScopeRuleById(id: string): Promise<MilestoneScopeRule | undefined> {
    const [rule] = await db.select().from(schema.milestoneScopeRules).where(eq(schema.milestoneScopeRules.id, id));
    return rule;
  }
  async getMilestoneScopeRulesByMilestoneId(milestoneId: string): Promise<MilestoneScopeRule[]> {
    return await db.select().from(schema.milestoneScopeRules).where(eq(schema.milestoneScopeRules.milestoneId, milestoneId));
  }
  async createMilestoneScopeRule(rule: InsertMilestoneScopeRule): Promise<MilestoneScopeRule> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.milestoneScopeRules).values({ ...rule, id }).returning();
    return created;
  }
  async updateMilestoneScopeRule(id: string, rule: Partial<MilestoneScopeRule>): Promise<MilestoneScopeRule> {
    const [updated] = await db.update(schema.milestoneScopeRules).set(rule).where(eq(schema.milestoneScopeRules.id, id)).returning();
    return updated;
  }
  async deleteMilestoneScopeRule(id: string): Promise<void> {
    await db.delete(schema.milestoneScopeRules).where(eq(schema.milestoneScopeRules.id, id));
  }

  // Milestone Task Links
  async getMilestoneTaskLinks(): Promise<MilestoneTaskLink[]> {
    return await db.select().from(schema.milestoneTaskLinks);
  }
  async getMilestoneTaskLinkById(id: string): Promise<MilestoneTaskLink | undefined> {
    const [link] = await db.select().from(schema.milestoneTaskLinks).where(eq(schema.milestoneTaskLinks.id, id));
    return link;
  }
  async getMilestoneTaskLinksByMilestoneId(milestoneId: string): Promise<MilestoneTaskLink[]> {
    return await db.select().from(schema.milestoneTaskLinks).where(eq(schema.milestoneTaskLinks.milestoneId, milestoneId));
  }
  async createMilestoneTaskLink(link: InsertMilestoneTaskLink): Promise<MilestoneTaskLink> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.milestoneTaskLinks).values({ ...link, id }).returning();
    return created;
  }
  async updateMilestoneTaskLink(id: string, link: Partial<MilestoneTaskLink>): Promise<MilestoneTaskLink> {
    const [updated] = await db.update(schema.milestoneTaskLinks).set(link).where(eq(schema.milestoneTaskLinks.id, id)).returning();
    return updated;
  }
  async deleteMilestoneTaskLink(id: string): Promise<void> {
    await db.delete(schema.milestoneTaskLinks).where(eq(schema.milestoneTaskLinks.id, id));
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
  async getCommentsByTaskId(taskId: string): Promise<Comment[]> {
    return await db.select().from(schema.comments).where(eq(schema.comments.taskId, taskId));
  }
  async createComment(comment: InsertComment): Promise<Comment> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.comments).values({ ...comment, id }).returning();
    return created;
  }
  async deleteComment(id: string): Promise<void> {
    await db.delete(schema.comments).where(eq(schema.comments.id, id));
  }

  // Attachments
  async getAttachmentsByTaskId(taskId: string): Promise<Attachment[]> {
    return await db.select().from(schema.attachments).where(eq(schema.attachments.taskId, taskId));
  }
  async createAttachment(attachment: InsertAttachment): Promise<Attachment> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.attachments).values({ ...attachment, id }).returning();
    return created;
  }
  async deleteAttachment(id: string): Promise<void> {
    await db.delete(schema.attachments).where(eq(schema.attachments.id, id));
  }

  // History
  async getHistoryByTaskId(taskId: string): Promise<History[]> {
    return await db.select().from(schema.history).where(eq(schema.history.taskId, taskId));
  }
  async createHistory(history: InsertHistory): Promise<History> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.history).values({ ...history, id }).returning();
    return created;
  }

  // Project Roles
  async getProjectRoles(): Promise<ProjectRole[]> {
    return await db.select().from(schema.projectRoles);
  }
  async getProjectRoleById(id: string): Promise<ProjectRole | undefined> {
    const [role] = await db.select().from(schema.projectRoles).where(eq(schema.projectRoles.id, id));
    return role;
  }
  async createProjectRole(role: InsertProjectRole): Promise<ProjectRole> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.projectRoles).values({ ...role, id }).returning();
    return created;
  }
  async updateProjectRole(id: string, role: Partial<ProjectRole>): Promise<ProjectRole> {
    const [updated] = await db.update(schema.projectRoles).set(role).where(eq(schema.projectRoles.id, id)).returning();
    return updated;
  }
  async deleteProjectRole(id: string): Promise<void> {
    await db.delete(schema.projectRoles).where(eq(schema.projectRoles.id, id));
  }

  // Role Assignments
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
  async createRoleAssignment(assignment: InsertRoleAssignment): Promise<RoleAssignment> {
    const id = (arguments[0] as any).id || crypto.randomUUID();
    const [created] = await db.insert(schema.roleAssignments).values({ ...assignment, id }).returning();
    return created;
  }
  async updateRoleAssignment(id: string, assignment: Partial<RoleAssignment>): Promise<RoleAssignment> {
    const [updated] = await db.update(schema.roleAssignments).set(assignment).where(eq(schema.roleAssignments.id, id)).returning();
    return updated;
  }
  async deleteRoleAssignment(id: string): Promise<void> {
    await db.delete(schema.roleAssignments).where(eq(schema.roleAssignments.id, id));
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
  async getProjectStageById(id: string): Promise<ProjectStage | undefined> {
    const [stage] = await db.select().from(schema.projectStages).where(eq(schema.projectStages.id, id));
    return stage;
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
}

export const storage = new DatabaseStorage();
