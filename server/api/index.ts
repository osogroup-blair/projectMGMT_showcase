import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "../data/storage";
import * as userManagementService from "../services/user-management";
import * as identityService from "../services/user-management/identity-service";
import { requireAuth, requirePermission, requireRole, requireSelfOrRole } from "../middleware/require-permission";
import { 
  UserPermissions,
  createUserRequestSchema,
  updateUserRequestSchema,
} from "@shared/contracts/user-management";
import { 
  linkIdentityRequestSchema,
  updateIdentityRequestSchema,
  updateProfileRequestSchema,
  AvailableSystems,
} from "@shared/contracts/user-identity";
import { 
  insertProjectSchema,
  insertDeliverableSchema,
  insertEpicSchema,
  insertTaskSchema,
  insertMilestoneSchema,
  insertMilestoneScopeRuleSchema,
  insertMilestoneTaskLinkSchema,
  insertSprintSchema,
  insertSprintMemberSchema,
  insertSprintScopeEventSchema,
  insertUserSchema,
  insertActivitySchema,
  insertCommentSchema,
  insertAttachmentSchema,
  insertHistorySchema,
  insertProjectRoleSchema,
  insertRoleAssignmentSchema,
  insertRoleTemplateSchema,
  insertSavedViewSchema,
  insertGuidanceItemSchema,
  insertProjectStageSchema,
  insertFrameworkTemplateSchema,
  insertStageTemplateSchema,
  insertProjectTemplateSchema,
  insertDeliverableTemplateSchema,
  insertEpicTemplateSchema,
  insertTaskTemplateSchema,
  insertMappingTemplateSchema,
  insertMilestoneTemplateSchema,
  insertTemplateSnippetSchema,
  insertStatusOptionSchema,
  insertProjectTaskStatusSchema,
  insertProjectSettingsSchema,
  insertRoleTypeSchema,
  insertUserPreferencesSchema,
  insertWorkBlockSchema,
  insertDayPlanSchema,
  insertSprintPulseUpdateSchema,
  insertTaskTypeSchema,
  insertProjectTaskTypeSchema,
  insertTaskDependencySchema,
  insertEpicTypeSchema,
  insertDeliverableTypeSchema,
} from "@shared/schema";

// Import seed function
import { seedDatabase } from "../db/seed";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { users } from "@shared/models/auth";
import { tasks, projects } from "@shared/schema";
import { generateSampleData, clearSampleData, hasSampleData, type SampleDataSection } from "../services/sample-data-generator";

// Helper to extract authenticated user ID from request
function getAuthUserId(req: any): string | null {
  return req.user?.claims?.sub || null;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Seed endpoint (for development)
  app.post("/api/seed", async (req, res) => {
    try {
      await seedDatabase();
      res.json({ success: true, message: "Database seeded successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Sample Data endpoints
  app.get("/api/admin/sample-data/status", async (req, res) => {
    try {
      const exists = await hasSampleData();
      res.json({ hasSampleData: exists });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/sample-data/generate", async (req, res) => {
    try {
      const { section = "all", clearFirst = false } = req.body;
      const validSections: SampleDataSection[] = ["core", "tasks", "milestones", "sprints", "comments", "all"];
      if (!validSections.includes(section)) {
        return res.status(400).json({ error: `Invalid section. Must be one of: ${validSections.join(", ")}` });
      }
      const result = await generateSampleData(section, clearFirst);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/sample-data/clear", async (req, res) => {
    try {
      const result = await clearSampleData();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Projects
  app.get("/api/projects", async (req, res) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });

  app.get("/api/projects/:id", async (req, res) => {
    const project = await storage.getProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const validated = insertProjectSchema.parse(req.body);
      const project = await storage.createProject({
        ...validated,
        createdBy: userId,
        updatedBy: userId,
      });
      
      // Auto-generate sprints if sprintDurationWeeks is set
      if (project && project.sprintDurationWeeks && project.sprintDurationWeeks > 0 && project.startDate && project.deadline) {
        const startDate = new Date(project.startDate);
        const endDate = new Date(project.deadline);
        const durationMs = project.sprintDurationWeeks * 7 * 24 * 60 * 60 * 1000;
        const totalMs = endDate.getTime() - startDate.getTime();
        const sprintCount = Math.max(1, Math.ceil(totalMs / durationMs));
        
        for (let i = 0; i < sprintCount; i++) {
          const sprintStart = new Date(startDate.getTime() + (i * durationMs));
          let sprintEnd = new Date(sprintStart.getTime() + durationMs - (24 * 60 * 60 * 1000));
          
          // Last sprint ends at project deadline
          if (sprintEnd > endDate || i === sprintCount - 1) {
            sprintEnd = endDate;
          }
          
          await storage.createSprint({
            projectId: project.id,
            name: `Sprint ${i + 1}`,
            goal: null,
            startDate: sprintStart.toISOString().split('T')[0],
            endDate: sprintEnd.toISOString().split('T')[0],
            status: 'Planned',
            capacityHours: null
          });
        }
      }
      
      res.status(201).json(project);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const project = await storage.updateProject(req.params.id, {
        ...req.body,
        updatedBy: userId,
        updatedAt: new Date(),
      });
      res.json(project);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      await storage.deleteProject(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting project:", error);
      res.status(500).json({ error: "Failed to delete project. " + error.message });
    }
  });

  // Nested project endpoints for deliverables, epics, stages, milestones
  app.get("/api/projects/:projectId/deliverables", async (req, res) => {
    try {
      const { projectId } = req.params;
      const deliverables = await storage.getDeliverablesByProjectId(projectId);
      res.json(deliverables);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/projects/:projectId/deliverables/:deliverableId", async (req, res) => {
    try {
      const deliverable = await storage.getDeliverableById(req.params.deliverableId);
      if (!deliverable) return res.status(404).json({ error: "Deliverable not found" });
      res.json(deliverable);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/projects/:projectId/deliverables/:deliverableId", async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const deliverable = await storage.updateDeliverable(req.params.deliverableId, {
        ...req.body,
        updatedBy: userId,
        updatedAt: new Date(),
      });
      res.json(deliverable);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/projects/:projectId/epics", async (req, res) => {
    try {
      const { projectId } = req.params;
      const epics = await storage.getEpicsByProjectId(projectId);
      res.json(epics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/projects/:projectId/epics/:epicId", async (req, res) => {
    try {
      const epic = await storage.getEpicById(req.params.epicId);
      if (!epic) return res.status(404).json({ error: "Epic not found" });
      res.json(epic);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/projects/:projectId/epics/:epicId", async (req, res) => {
    try {
      const epic = await storage.updateEpic(req.params.epicId, req.body);
      res.json(epic);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/projects/:projectId/stages", async (req, res) => {
    try {
      const { projectId } = req.params;
      const stages = await storage.getProjectStagesByProjectId(projectId);
      res.json(stages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/projects/:projectId/stages/:stageId", async (req, res) => {
    try {
      const stage = await storage.getProjectStageById(req.params.stageId);
      if (!stage) return res.status(404).json({ error: "Stage not found" });
      res.json(stage);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/projects/:projectId/stages/:stageId", async (req, res) => {
    try {
      const stage = await storage.updateProjectStage(req.params.stageId, req.body);
      res.json(stage);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/projects/:projectId/milestones", async (req, res) => {
    try {
      const { projectId } = req.params;
      const milestones = await storage.getMilestonesByProjectId(projectId);
      res.json(milestones);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/projects/:projectId/milestones/:milestoneId", async (req, res) => {
    try {
      const milestone = await storage.getMilestoneById(req.params.milestoneId);
      if (!milestone) return res.status(404).json({ error: "Milestone not found" });
      res.json(milestone);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/projects/:projectId/milestones/:milestoneId", async (req, res) => {
    try {
      const milestone = await storage.updateMilestone(req.params.milestoneId, req.body);
      res.json(milestone);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Project Favorites (global list for import/export)
  app.get("/api/projectFavorites", async (req, res) => {
    const projectFavorites = await storage.getAllProjectFavorites();
    res.json(projectFavorites);
  });

  // Project Favorites
  app.get("/api/favorites", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const favorites = await storage.getProjectFavoritesByUserId(userId);
      res.json(favorites);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/favorites/:projectId", async (req, res) => {
    try {
      const { projectId } = req.params;
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const favorite = await storage.createProjectFavorite({ userId, projectId });
      res.status(201).json(favorite);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/favorites/:projectId", async (req, res) => {
    try {
      const { projectId } = req.params;
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      await storage.deleteProjectFavorite(userId, projectId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Deliverables
  app.get("/api/deliverables", async (req, res) => {
    const deliverables = await storage.getDeliverables();
    res.json(deliverables);
  });

  app.get("/api/deliverables/:id", async (req, res) => {
    const deliverable = await storage.getDeliverableById(req.params.id);
    if (!deliverable) return res.status(404).json({ error: "Deliverable not found" });
    res.json(deliverable);
  });

  app.post("/api/deliverables", async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const validated = insertDeliverableSchema.parse(req.body);
      const deliverable = await storage.createDeliverable({
        ...validated,
        createdBy: userId,
        updatedBy: userId,
      });
      res.status(201).json(deliverable);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/deliverables/:id", async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const deliverable = await storage.updateDeliverable(req.params.id, {
        ...req.body,
        updatedBy: userId,
        updatedAt: new Date(),
      });
      res.json(deliverable);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/deliverables/:id", async (req, res) => {
    await storage.deleteDeliverable(req.params.id);
    res.status(204).send();
  });

  // Epics
  app.get("/api/epics", async (req, res) => {
    const epics = await storage.getEpics();
    res.json(epics);
  });

  app.get("/api/epics/:id", async (req, res) => {
    const epic = await storage.getEpicById(req.params.id);
    if (!epic) return res.status(404).json({ error: "Epic not found" });
    res.json(epic);
  });

  app.post("/api/epics", async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const validated = insertEpicSchema.parse(req.body);
      const epic = await storage.createEpic({
        ...validated,
        createdBy: userId,
        updatedBy: userId,
      });
      res.status(201).json(epic);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/epics/:id", async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const epic = await storage.updateEpic(req.params.id, {
        ...req.body,
        updatedBy: userId,
        updatedAt: new Date(),
      });
      res.json(epic);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/epics/:id", async (req, res) => {
    await storage.deleteEpic(req.params.id);
    res.status(204).send();
  });

  // Tasks
  app.get("/api/tasks", async (req, res) => {
    const tasks = await storage.getTasks();
    res.json(tasks);
  });

  app.get("/api/tasks/:id", async (req, res) => {
    const task = await storage.getTaskById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const validated = insertTaskSchema.parse(req.body);
      
      // Server-side validation: Epic, Stage, and TaskType are required for task creation
      if (!validated.epicId) {
        return res.status(400).json({ error: "Epic is required for task creation" });
      }
      if (!validated.stageId) {
        return res.status(400).json({ error: "Stage is required for task creation" });
      }
      if (!validated.taskTypeId) {
        return res.status(400).json({ error: "Task type is required for task creation" });
      }
      
      // Validate status against App Defaults - use default if invalid or missing
      const resolvedStatus = await storage.validateAndResolveStatus(validated.status, "task");
      
      const task = await storage.createTask({
        ...validated,
        status: resolvedStatus,
        assigneeId: validated.assigneeId || userId || null,
        createdBy: userId,
        updatedBy: userId,
      });
      res.status(201).json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Quick-create task endpoint for home page (user selects project, epic, stage)
  app.post("/api/tasks/quick-create", async (req, res) => {
    try {
      const { title, projectId, project, epicId, stageId, deadline, priority, assigneeId } = req.body;
      
      if (!title || !title.trim()) {
        return res.status(400).json({ error: "Task title is required" });
      }
      if (!projectId) {
        return res.status(400).json({ error: "Project is required" });
      }
      if (!epicId) {
        return res.status(400).json({ error: "Epic is required" });
      }
      if (!stageId) {
        return res.status(400).json({ error: "Stage is required" });
      }
      if (!deadline) {
        return res.status(400).json({ error: "Deadline is required" });
      }

      // Get project data
      const projectData = await storage.getProjectById(projectId);
      if (!projectData) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Find first available task type for this project
      const taskTypes = await storage.getProjectTaskTypesByProjectId(projectId);
      const taskTypeId = taskTypes.length > 0 ? taskTypes[0].id : null;

      // Generate unique ID
      const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const userId = getAuthUserId(req);
      
      // Get validated status from App Defaults
      const resolvedStatus = await storage.validateAndResolveStatus(null, "task");
      
      const taskData = {
        id: taskId,
        title: title.trim(),
        project: project || projectData.name,
        projectId,
        deadline,
        priority: priority || "Medium",
        assigneeId: assigneeId || userId || null,
        status: resolvedStatus,
        epicId,
        stageId,
        taskTypeId,
        createdBy: userId,
        updatedBy: userId,
      };

      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error: any) {
      console.error("Quick create task error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const updates = { ...req.body };
      if (updates.updatedAt && typeof updates.updatedAt === 'string') {
        updates.updatedAt = new Date(updates.updatedAt);
      } else {
        updates.updatedAt = new Date();
      }
      if (updates.dueDate && typeof updates.dueDate === 'string') {
        updates.dueDate = new Date(updates.dueDate);
      }
      updates.updatedBy = userId;
      const task = await storage.updateTask(req.params.id, updates);
      res.json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    await storage.deleteTask(req.params.id);
    res.status(204).send();
  });

  // Milestones
  app.get("/api/milestones", async (req, res) => {
    const milestones = await storage.getMilestones();
    res.json(milestones);
  });

  app.get("/api/milestones/:id", async (req, res) => {
    const milestone = await storage.getMilestoneById(req.params.id);
    if (!milestone) return res.status(404).json({ error: "Milestone not found" });
    res.json(milestone);
  });

  app.post("/api/milestones", async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const validated = insertMilestoneSchema.parse(req.body);
      const milestone = await storage.createMilestone({
        ...validated,
        createdBy: userId,
        updatedBy: userId,
      });
      res.status(201).json(milestone);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/milestones/:id", async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const milestone = await storage.updateMilestone(req.params.id, {
        ...req.body,
        updatedBy: userId,
        updatedAt: new Date(),
      });
      res.json(milestone);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/milestones/:id", async (req, res) => {
    await storage.deleteMilestone(req.params.id);
    res.status(204).send();
  });

  // Milestone Scope Rules
  app.get("/api/milestoneScopeRules", async (req, res) => {
    const rules = await storage.getMilestoneScopeRules();
    res.json(rules);
  });

  app.post("/api/milestoneScopeRules", async (req, res) => {
    try {
      const validated = insertMilestoneScopeRuleSchema.parse(req.body);
      const rule = await storage.createMilestoneScopeRule(validated);
      res.status(201).json(rule);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/milestoneScopeRules/:id", async (req, res) => {
    try {
      const rule = await storage.updateMilestoneScopeRule(req.params.id, req.body);
      res.json(rule);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/milestoneScopeRules/:id", async (req, res) => {
    await storage.deleteMilestoneScopeRule(req.params.id);
    res.status(204).send();
  });

  // Milestone Task Links
  app.get("/api/milestoneTaskLinks", async (req, res) => {
    const links = await storage.getMilestoneTaskLinks();
    res.json(links);
  });

  app.post("/api/milestoneTaskLinks", async (req, res) => {
    try {
      const validated = insertMilestoneTaskLinkSchema.parse(req.body);
      const link = await storage.createMilestoneTaskLink(validated);
      res.status(201).json(link);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/milestoneTaskLinks/:id", async (req, res) => {
    try {
      const link = await storage.updateMilestoneTaskLink(req.params.id, req.body);
      res.json(link);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/milestoneTaskLinks/:id", async (req, res) => {
    await storage.deleteMilestoneTaskLink(req.params.id);
    res.status(204).send();
  });

  // Users with task/project counts (for impersonate dropdown)
  app.get("/api/users/with-counts", requireAuth(), async (req, res) => {
    try {
      const allUsers = await db.select().from(users);
      const taskCounts = await db
        .select({ 
          assigneeId: tasks.assigneeId, 
          count: sql<number>`count(*)::int` 
        })
        .from(tasks)
        .groupBy(tasks.assigneeId);
      
      const projectCounts = await db
        .select({ 
          ownerId: projects.ownerId, 
          count: sql<number>`count(*)::int` 
        })
        .from(projects)
        .groupBy(projects.ownerId);

      const taskCountMap = new Map(taskCounts.filter(t => t.assigneeId).map(t => [t.assigneeId, t.count]));
      const projectCountMap = new Map(projectCounts.filter(p => p.ownerId).map(p => [p.ownerId, p.count]));

      const usersWithCounts = allUsers.map(u => ({
        id: u.id,
        name: u.name,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        profileImageUrl: u.profileImageUrl,
        systemRole: u.systemRole,
        taskCount: taskCountMap.get(u.id) || 0,
        projectCount: projectCountMap.get(u.id) || 0,
      }));

      res.json(usersWithCounts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Users (with permission middleware)
  app.get("/api/users", async (req, res) => {
    try {
      const { search, role, status, page, pageSize, sortBy, sortOrder, limit, offset } = req.query;
      const result = await userManagementService.listUsers({
        search: search as string,
        role: role as string,
        status: status as string,
        page: page ? parseInt(page as string) : undefined,
        pageSize: pageSize ? parseInt(pageSize as string) : undefined,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await userManagementService.getUserById(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users", requireAuth(), requirePermission(UserPermissions.USERS_CREATE), async (req, res) => {
    try {
      const validated = createUserRequestSchema.parse(req.body);
      const user = await userManagementService.createUser(validated);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/users/:id", requireAuth(), requireSelfOrRole("id", "admin", "manager"), async (req, res) => {
    try {
      const validated = updateUserRequestSchema.parse(req.body);
      const user = await userManagementService.updateUser(req.params.id, validated);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/users/:id", requireAuth(), requirePermission(UserPermissions.USERS_DELETE), async (req, res) => {
    try {
      await userManagementService.deactivateUser(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk user operations (admin/manager only)
  app.patch("/api/users/bulk/role", requireAuth(), requireRole("admin", "manager"), async (req, res) => {
    try {
      const { ids, role } = req.body;
      if (!ids || !Array.isArray(ids) || !role) {
        return res.status(400).json({ error: "ids array and role are required" });
      }
      const count = await userManagementService.bulkUpdateRole(ids, role);
      res.json({ updated: count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/users/bulk/deactivate", requireAuth(), requireRole("admin", "manager"), async (req, res) => {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ error: "ids array is required" });
      }
      const count = await userManagementService.bulkDeactivate(ids);
      res.json({ deactivated: count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/users/bulk/activate", requireAuth(), requireRole("admin", "manager"), async (req, res) => {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ error: "ids array is required" });
      }
      const count = await userManagementService.bulkActivate(ids);
      res.json({ activated: count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/users/bulk", requireAuth(), requireRole("admin"), async (req, res) => {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ error: "ids array is required" });
      }
      const count = await userManagementService.bulkDelete(ids);
      res.json({ deleted: count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Available external systems for identity linking
  app.get("/api/identity/systems", requireAuth(), async (req, res) => {
    res.json(AvailableSystems);
  });

  // User Profile with Identities
  app.get("/api/users/:id/profile", requireAuth(), requireSelfOrRole("id", "admin", "manager"), async (req, res) => {
    try {
      const profile = await identityService.getUserProfileWithIdentities(req.params.id);
      if (!profile) return res.status(404).json({ error: "User not found" });
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update user profile (not identities)
  app.patch("/api/users/:id/profile", requireAuth(), requireSelfOrRole("id", "admin", "manager"), async (req, res) => {
    try {
      const validated = updateProfileRequestSchema.parse(req.body);
      const userId = getAuthUserId(req);
      const profile = await identityService.updateUserProfile(req.params.id, validated, userId || undefined);
      if (!profile) return res.status(404).json({ error: "User not found" });
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all user identities (for import matching)
  app.get("/api/identities/all", requireAuth(), requireRole("admin", "manager"), async (req, res) => {
    try {
      const identities = await identityService.getAllUserIdentities();
      res.json(identities);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get user identities
  app.get("/api/users/:userId/identities", requireAuth(), requireSelfOrRole("userId", "admin", "manager"), async (req, res) => {
    try {
      const identities = await identityService.getUserIdentities(req.params.userId);
      res.json(identities);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Link a new identity to user
  app.post("/api/users/:userId/identities", requireAuth(), requireRole("admin", "manager"), async (req, res) => {
    try {
      const validated = linkIdentityRequestSchema.parse(req.body);
      const userId = getAuthUserId(req);
      const identity = await identityService.linkIdentityToUser(req.params.userId, validated, userId || undefined);
      res.status(201).json(identity);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get single identity
  app.get("/api/identities/:identityId", requireAuth(), async (req, res) => {
    try {
      const identity = await identityService.getIdentityById(req.params.identityId);
      if (!identity) return res.status(404).json({ error: "Identity not found" });
      res.json(identity);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update identity
  app.patch("/api/identities/:identityId", requireAuth(), requireRole("admin", "manager"), async (req, res) => {
    try {
      const validated = updateIdentityRequestSchema.parse(req.body);
      const userId = getAuthUserId(req);
      const identity = await identityService.updateIdentity(req.params.identityId, validated, userId || undefined);
      if (!identity) return res.status(404).json({ error: "Identity not found" });
      res.json(identity);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Unlink identity from user
  app.delete("/api/users/:userId/identities/:identityId", requireAuth(), requireRole("admin", "manager"), async (req, res) => {
    try {
      await identityService.unlinkIdentityFromUser(req.params.userId, req.params.identityId);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Find identity by external reference
  app.get("/api/identities/lookup", requireAuth(), async (req, res) => {
    try {
      const { systemId, externalUserId, workspaceId } = req.query;
      if (!systemId || !externalUserId) {
        return res.status(400).json({ error: "systemId and externalUserId are required" });
      }
      const identity = await identityService.findIdentityByExternal(
        systemId as string,
        externalUserId as string,
        workspaceId as string | undefined
      );
      if (!identity) return res.status(404).json({ error: "Identity not found" });
      res.json(identity);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Merge users (admin only)
  app.post("/api/users/merge", requireAuth(), requireRole("admin"), async (req, res) => {
    try {
      const { sourceUserId, targetUserId, conflictResolution } = req.body;
      if (!sourceUserId || !targetUserId) {
        return res.status(400).json({ error: "sourceUserId and targetUserId are required" });
      }
      const userId = getAuthUserId(req);
      const result = await identityService.mergeUsers(
        { sourceUserId, targetUserId, conflictResolution },
        userId || 'system'
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // User Import - import users from external systems (admin/manager only)
  app.post("/api/users/import", requireAuth(), requireRole("admin", "manager"), async (req, res) => {
    try {
      const { Users: importedUsers } = req.body;
      
      if (!importedUsers || !Array.isArray(importedUsers)) {
        return res.status(400).json({ error: "Invalid import format. Expected { Users: [...] }" });
      }

      const results = {
        created: 0,
        updated: 0,
        errors: [] as { email: string; error: string }[],
        identitiesCreated: 0,
      };

      for (const importedUser of importedUsers) {
        try {
          // Check if user with this email already exists
          const existingUsers = await storage.getUsers();
          const existingUser = existingUsers.find((u: any) => u.email === importedUser.email);

          // Parse name into first/last
          let firstName = null;
          let lastName = null;
          if (importedUser.name) {
            const nameParts = importedUser.name.trim().split(/\s+/);
            firstName = nameParts[0] || null;
            lastName = nameParts.slice(1).join(' ') || null;
          }

          let userId: string;

          if (existingUser) {
            // Update existing user with import data
            await storage.updateUser(existingUser.id, {
              name: importedUser.name || existingUser.name,
              firstName: firstName || existingUser.firstName,
              lastName: lastName || existingUser.lastName,
              status: importedUser.status || existingUser.status,
              avatar: importedUser.avatar || existingUser.avatar,
              externalId: importedUser.id, // Store original external ID
              importSource: importedUser.identities?.[0]?.system?.systemId || 'import',
              importedAt: new Date(),
            });
            userId = existingUser.id;
            results.updated++;
          } else {
            // Create new user with external ID as primary ID
            // Use direct db insert since we need to specify the ID
            const { users } = await import("@shared/schema");
            const [newUser] = await db.insert(users).values({
              id: importedUser.id, // Use external ID as primary ID initially
              email: importedUser.email,
              name: importedUser.name || importedUser.email,
              firstName,
              lastName,
              status: importedUser.status || 'Active',
              avatar: importedUser.avatar || null,
              systemRole: 'member',
              externalId: importedUser.id,
              importSource: importedUser.identities?.[0]?.system?.systemId || 'import',
              importedAt: new Date(),
            }).returning();
            userId = newUser.id;
            results.created++;
          }

          // Store identities
          if (importedUser.identities && Array.isArray(importedUser.identities)) {
            for (const identity of importedUser.identities) {
              try {
                await storage.createUserIdentity({
                  id: identity.identityId || `ident-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  userId,
                  systemId: identity.system?.systemId || 'unknown',
                  systemType: identity.system?.systemType,
                  systemName: identity.system?.systemName,
                  workspaceId: identity.system?.workspaceId,
                  externalUserId: identity.externalUserId,
                  externalUsername: identity.externalUsername,
                  externalEmail: identity.externalEmail,
                  identityType: identity.identityType || 'user',
                  status: identity.status || 'active',
                  auth: identity.auth,
                  roles: identity.roles || [],
                  externalPermissions: identity.permissions,
                  profile: identity.profile,
                  syncSourceOfTruth: identity.sync?.sourceOfTruth || 'mixed',
                  lastSyncedAt: identity.sync?.lastSyncedAt ? new Date(identity.sync.lastSyncedAt) : null,
                  syncStatus: identity.sync?.syncStatus || 'healthy',
                  lastSyncError: identity.sync?.lastError,
                  createdBy: identity.metadata?.createdBy,
                  updatedBy: identity.metadata?.updatedBy,
                });
                results.identitiesCreated++;
              } catch (identityError: any) {
                console.error(`Failed to create identity for user ${importedUser.email}:`, identityError);
              }
            }
          }
        } catch (userError: any) {
          results.errors.push({
            email: importedUser.email || 'unknown',
            error: userError.message,
          });
        }
      }

      res.json({
        success: true,
        message: `Imported ${results.created} new users, updated ${results.updated} existing users, created ${results.identitiesCreated} identities`,
        ...results,
      });
    } catch (error: any) {
      console.error("User import error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Activity
  app.get("/api/activity", async (req, res) => {
    const activity = await storage.getActivity();
    res.json(activity);
  });

  app.post("/api/activity", async (req, res) => {
    try {
      const validated = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(validated);
      res.status(201).json(activity);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/activity/:id", async (req, res) => {
    await storage.deleteActivity(req.params.id);
    res.status(204).send();
  });

  // Comments
  app.get("/api/comments", async (req, res) => {
    const comments = await storage.getComments();
    res.json(comments);
  });

  // Task-specific comments
  app.get("/api/tasks/:taskId/comments", async (req, res) => {
    const taskComments = await storage.getCommentsByTaskId(req.params.taskId);
    res.json(taskComments);
  });

  app.get("/api/comments/:id", async (req, res) => {
    const comment = await storage.getCommentById(req.params.id);
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    res.json(comment);
  });

  app.post("/api/comments", async (req, res) => {
    try {
      const validated = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(validated);
      res.status(201).json(comment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/comments/:id", async (req, res) => {
    try {
      // Convert date strings to Date objects for timestamp fields
      const updateData = { ...req.body };
      if (updateData.createdAt && typeof updateData.createdAt === 'string') {
        updateData.createdAt = new Date(updateData.createdAt);
      }
      const comment = await storage.updateComment(req.params.id, updateData);
      res.json(comment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/comments/:id", async (req, res) => {
    await storage.deleteComment(req.params.id);
    res.status(204).send();
  });

  // Attachments
  app.get("/api/attachments", async (req, res) => {
    const attachments = await storage.getAttachments();
    res.json(attachments);
  });

  app.get("/api/attachments/:id", async (req, res) => {
    const attachment = await storage.getAttachmentById(req.params.id);
    if (!attachment) return res.status(404).json({ error: "Attachment not found" });
    res.json(attachment);
  });

  app.post("/api/attachments", async (req, res) => {
    try {
      const validated = insertAttachmentSchema.parse(req.body);
      const attachment = await storage.createAttachment(validated);
      res.status(201).json(attachment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/attachments/:id", async (req, res) => {
    try {
      const attachment = await storage.updateAttachment(req.params.id, req.body);
      res.json(attachment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/attachments/:id", async (req, res) => {
    await storage.deleteAttachment(req.params.id);
    res.status(204).send();
  });

  // History
  app.get("/api/history", async (req, res) => {
    const history = await storage.getHistory();
    res.json(history);
  });

  app.get("/api/history/:id", async (req, res) => {
    const historyItem = await storage.getHistoryById(req.params.id);
    if (!historyItem) return res.status(404).json({ error: "History item not found" });
    res.json(historyItem);
  });

  app.post("/api/history", async (req, res) => {
    try {
      const validated = insertHistorySchema.parse(req.body);
      const historyItem = await storage.createHistory(validated);
      res.status(201).json(historyItem);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/history/:id", async (req, res) => {
    try {
      const historyItem = await storage.updateHistory(req.params.id, req.body);
      res.json(historyItem);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Project Roles
  app.get("/api/projectRoles", async (req, res) => {
    const roles = await storage.getProjectRoles();
    res.json(roles);
  });

  app.post("/api/projectRoles", async (req, res) => {
    try {
      const validated = insertProjectRoleSchema.parse(req.body);
      const role = await storage.createProjectRole(validated);
      res.status(201).json(role);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/projectRoles/:id", async (req, res) => {
    try {
      const role = await storage.updateProjectRole(req.params.id, req.body);
      res.json(role);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/projectRoles/:id", async (req, res) => {
    await storage.deleteProjectRole(req.params.id);
    res.status(204).send();
  });

  // Role Assignments
  app.get("/api/roleAssignments", async (req, res) => {
    const assignments = await storage.getRoleAssignments();
    res.json(assignments);
  });

  app.post("/api/roleAssignments", async (req, res) => {
    try {
      const validated = insertRoleAssignmentSchema.parse(req.body);
      const assignment = await storage.createRoleAssignment(validated);
      res.status(201).json(assignment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/roleAssignments/:id", async (req, res) => {
    try {
      const assignment = await storage.updateRoleAssignment(req.params.id, req.body);
      res.json(assignment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/roleAssignments/:id", async (req, res) => {
    await storage.deleteRoleAssignment(req.params.id);
    res.status(204).send();
  });

  // Saved Views
  app.get("/api/savedViews", async (req, res) => {
    const views = await storage.getSavedViews();
    res.json(views);
  });

  app.post("/api/savedViews", async (req, res) => {
    try {
      const validated = insertSavedViewSchema.parse(req.body);
      const view = await storage.createSavedView(validated);
      res.status(201).json(view);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/savedViews/:id", async (req, res) => {
    try {
      const view = await storage.updateSavedView(req.params.id, req.body);
      res.json(view);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/savedViews/:id", async (req, res) => {
    await storage.deleteSavedView(req.params.id);
    res.status(204).send();
  });

  // Guidance Items
  app.get("/api/guidanceItems", async (req, res) => {
    const items = await storage.getGuidanceItems();
    res.json(items);
  });

  app.post("/api/guidanceItems", async (req, res) => {
    try {
      const validated = insertGuidanceItemSchema.parse(req.body);
      const item = await storage.createGuidanceItem(validated);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/guidanceItems/:id", async (req, res) => {
    try {
      const item = await storage.updateGuidanceItem(req.params.id, req.body);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/guidanceItems/:id", async (req, res) => {
    await storage.deleteGuidanceItem(req.params.id);
    res.status(204).send();
  });

  // Project Stages
  app.get("/api/projectStages", async (req, res) => {
    const stages = await storage.getProjectStages();
    res.json(stages);
  });

  app.post("/api/projectStages", async (req, res) => {
    try {
      const validated = insertProjectStageSchema.parse(req.body);
      const stage = await storage.createProjectStage(validated);
      res.status(201).json(stage);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/projectStages/:id", async (req, res) => {
    try {
      const stage = await storage.updateProjectStage(req.params.id, req.body);
      res.json(stage);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/projectStages/:id", async (req, res) => {
    await storage.deleteProjectStage(req.params.id);
    res.status(204).send();
  });

  // Framework Templates
  app.get("/api/frameworkTemplates", async (req, res) => {
    const templates = await storage.getFrameworkTemplates();
    res.json(templates);
  });

  app.post("/api/frameworkTemplates", async (req, res) => {
    try {
      const validated = insertFrameworkTemplateSchema.parse(req.body);
      const template = await storage.createFrameworkTemplate(validated);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/frameworkTemplates/:id", async (req, res) => {
    try {
      const template = await storage.updateFrameworkTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/frameworkTemplates/:id", async (req, res) => {
    try {
      await storage.deleteFrameworkTemplate(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      if (error.code === '23503') {
        res.status(400).json({ error: "Cannot delete this framework template because it is being used by one or more projects. Remove it from all projects first." });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  // Stage Templates
  app.get("/api/stageTemplates", async (req, res) => {
    const templates = await storage.getStageTemplates();
    res.json(templates);
  });

  app.post("/api/stageTemplates", async (req, res) => {
    try {
      const validated = insertStageTemplateSchema.parse(req.body);
      const template = await storage.createStageTemplate(validated);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/stageTemplates/:id", async (req, res) => {
    try {
      const template = await storage.updateStageTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/stageTemplates/:id", async (req, res) => {
    await storage.deleteStageTemplate(req.params.id);
    res.status(204).send();
  });

  // Project Templates
  app.get("/api/projectTemplates", async (req, res) => {
    const templates = await storage.getProjectTemplates();
    res.json(templates);
  });

  app.post("/api/projectTemplates", async (req, res) => {
    try {
      const validated = insertProjectTemplateSchema.parse(req.body);
      const template = await storage.createProjectTemplate(validated);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/projectTemplates/:id", async (req, res) => {
    try {
      const template = await storage.updateProjectTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/projectTemplates/:id", async (req, res) => {
    await storage.deleteProjectTemplate(req.params.id);
    res.status(204).send();
  });

  // Deliverable Templates
  app.get("/api/deliverableTemplates", async (req, res) => {
    const templates = await storage.getDeliverableTemplates();
    res.json(templates);
  });

  app.post("/api/deliverableTemplates", async (req, res) => {
    try {
      const validated = insertDeliverableTemplateSchema.parse(req.body);
      const template = await storage.createDeliverableTemplate(validated);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/deliverableTemplates/:id", async (req, res) => {
    try {
      const template = await storage.updateDeliverableTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/deliverableTemplates/:id", async (req, res) => {
    await storage.deleteDeliverableTemplate(req.params.id);
    res.status(204).send();
  });

  // Epic Templates
  app.get("/api/epicTemplates", async (req, res) => {
    const templates = await storage.getEpicTemplates();
    res.json(templates);
  });

  app.post("/api/epicTemplates", async (req, res) => {
    try {
      const validated = insertEpicTemplateSchema.parse(req.body);
      const template = await storage.createEpicTemplate(validated);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/epicTemplates/:id", async (req, res) => {
    try {
      const template = await storage.updateEpicTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/epicTemplates/:id", async (req, res) => {
    await storage.deleteEpicTemplate(req.params.id);
    res.status(204).send();
  });

  // Task Templates
  app.get("/api/taskTemplates", async (req, res) => {
    const templates = await storage.getTaskTemplates();
    res.json(templates);
  });

  app.post("/api/taskTemplates", async (req, res) => {
    try {
      const validated = insertTaskTemplateSchema.parse(req.body);
      const template = await storage.createTaskTemplate(validated);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/taskTemplates/:id", async (req, res) => {
    try {
      const template = await storage.updateTaskTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/taskTemplates/:id", async (req, res) => {
    await storage.deleteTaskTemplate(req.params.id);
    res.status(204).send();
  });

  // Role Templates
  app.get("/api/roleTemplates", async (req, res) => {
    const templates = await storage.getRoleTemplates();
    res.json(templates);
  });

  app.post("/api/roleTemplates", async (req, res) => {
    try {
      const validated = insertRoleTemplateSchema.parse(req.body);
      const template = await storage.createRoleTemplate(validated);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/roleTemplates/:id", async (req, res) => {
    try {
      const template = await storage.updateRoleTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/roleTemplates/:id", async (req, res) => {
    await storage.deleteRoleTemplate(req.params.id);
    res.status(204).send();
  });

  // Mapping Templates
  app.get("/api/mappingTemplates", async (req, res) => {
    const templates = await storage.getMappingTemplates();
    res.json(templates);
  });

  app.post("/api/mappingTemplates", async (req, res) => {
    try {
      const validated = insertMappingTemplateSchema.parse(req.body);
      const template = await storage.createMappingTemplate(validated);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/mappingTemplates/:id", async (req, res) => {
    try {
      const template = await storage.updateMappingTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/mappingTemplates/:id", async (req, res) => {
    await storage.deleteMappingTemplate(req.params.id);
    res.status(204).send();
  });

  // Milestone Templates
  app.get("/api/milestoneTemplates", async (req, res) => {
    const templates = await storage.getMilestoneTemplates();
    res.json(templates);
  });

  app.post("/api/milestoneTemplates", async (req, res) => {
    try {
      const validated = insertMilestoneTemplateSchema.parse(req.body);
      const template = await storage.createMilestoneTemplate(validated);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/milestoneTemplates/:id", async (req, res) => {
    try {
      const template = await storage.updateMilestoneTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/milestoneTemplates/:id", async (req, res) => {
    await storage.deleteMilestoneTemplate(req.params.id);
    res.status(204).send();
  });

  // Template Snippets
  app.get("/api/templateSnippets", async (req, res) => {
    const snippets = await storage.getTemplateSnippets();
    res.json(snippets);
  });

  app.post("/api/templateSnippets", async (req, res) => {
    try {
      const validated = insertTemplateSnippetSchema.parse(req.body);
      const snippet = await storage.createTemplateSnippet(validated);
      res.status(201).json(snippet);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/templateSnippets/:id", async (req, res) => {
    try {
      const snippet = await storage.updateTemplateSnippet(req.params.id, req.body);
      res.json(snippet);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/templateSnippets/:id", async (req, res) => {
    await storage.deleteTemplateSnippet(req.params.id);
    res.status(204).send();
  });

  // Sample Template Download
  app.get("/api/templates/sample", (req, res) => {
    const sampleData = {
      version: "1.0",
      exportedAt: "2025-01-01T00:00:00.000Z",
      description: "Sample template file showing all attributes for each template type. Use this as a reference when creating your own templates.",
      templates: {
        framework: [
          {
            id: "fw_implementation",
            name: "Implementation Framework",
            description: "Standard 4-phase implementation delivery framework for enterprise projects",
            defaultStages: ["st_discovery", "st_design", "st_build", "st_deploy"]
          }
        ],
        stage: [
          {
            id: "st_discovery",
            name: "Discovery & Planning",
            description: "Initial discovery phase for requirements gathering and project planning",
            defaultTasks: ["tt_kickoff", "tt_requirements"],
            defaultRoles: ["rt_pm", "rt_ba"],
            entryCriteria: "Project charter signed, budget approved",
            exitCriteria: "Requirements document approved, project plan finalized",
            allowedTaskStatuses: ["Todo", "In Progress", "Review", "Done"]
          }
        ],
        project: [
          {
            id: "pt_enterprise",
            name: "Enterprise Implementation",
            description: "Full-scale enterprise implementation project template",
            defaultFrameworkId: "fw_implementation",
            defaultRoles: ["rt_pm", "rt_ba", "rt_dev_lead", "rt_developer"],
            defaultDeliverables: ["dt_discovery_docs", "dt_implementation"],
            thumbnail: "enterprise"
          }
        ],
        deliverable: [
          {
            id: "dt_discovery_docs",
            title: "Discovery Documentation",
            description: "Complete discovery phase documentation including requirements and stakeholder analysis",
            defaultEpics: ["et_requirements", "et_stakeholder_analysis"]
          }
        ],
        epic: [
          {
            id: "et_requirements",
            title: "Requirements Gathering",
            description: "Complete business and functional requirements documentation",
            defaultStages: ["st_discovery"]
          }
        ],
        task: [
          {
            id: "tt_kickoff",
            title: "Project Kickoff Meeting",
            description: "Conduct project kickoff meeting with all stakeholders",
            defaultPriority: "High",
            defaultEstimateHours: 4,
            requiredRole: "Management",
            assignedRoleId: "rt_pm"
          },
          {
            id: "tt_requirements",
            title: "Requirements Workshop",
            description: "Facilitate requirements gathering workshops with business stakeholders",
            defaultPriority: "High",
            defaultEstimateHours: 16,
            requiredRole: "Business Analysis",
            assignedRoleId: "rt_ba"
          }
        ],
        role: [
          {
            id: "rt_pm",
            name: "Project Manager",
            description: "Responsible for overall project delivery, timeline, and budget",
            defaultRoleType: "Management",
            defaultPermissions: ["manage_project", "manage_budget", "assign_tasks", "view_reports"]
          },
          {
            id: "rt_ba",
            name: "Business Analyst",
            description: "Gathers requirements, creates user stories, manages backlog",
            defaultRoleType: "Analysis",
            defaultPermissions: ["manage_requirements", "create_stories", "view_reports"]
          },
          {
            id: "rt_dev_lead",
            name: "Development Lead",
            description: "Technical lead for code reviews and architecture decisions",
            defaultRoleType: "Development",
            defaultPermissions: ["manage_code", "approve_pr", "deploy", "assign_tasks"]
          },
          {
            id: "rt_developer",
            name: "Software Developer",
            description: "Implements features, writes tests, fixes bugs",
            defaultRoleType: "Development",
            defaultPermissions: ["write_code", "create_pr", "update_task_status"]
          }
        ],
        mapping: [
          {
            id: "mt_jira",
            name: "Jira Import Mapping",
            dataType: "Tasks"
          },
          {
            id: "mt_csv",
            name: "CSV Standard Mapping",
            dataType: "Mixed"
          }
        ]
      }
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="sample-templates.json"');
    res.json(sampleData);
  });

  // Template Export/Import
  app.get("/api/templates/export", async (req, res) => {
    try {
      const [
        frameworkTemplates,
        stageTemplates,
        projectTemplates,
        deliverableTemplates,
        epicTemplates,
        taskTemplates,
        roleTemplates,
        mappingTemplates
      ] = await Promise.all([
        storage.getFrameworkTemplates(),
        storage.getStageTemplates(),
        storage.getProjectTemplates(),
        storage.getDeliverableTemplates(),
        storage.getEpicTemplates(),
        storage.getTaskTemplates(),
        storage.getRoleTemplates(),
        storage.getMappingTemplates()
      ]);

      const exportData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        templates: {
          framework: frameworkTemplates,
          stage: stageTemplates,
          project: projectTemplates,
          deliverable: deliverableTemplates,
          epic: epicTemplates,
          task: taskTemplates,
          role: roleTemplates,
          mapping: mappingTemplates
        }
      };

      res.json(exportData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/templates/import", async (req, res) => {
    try {
      const { templates, mode = "skip" } = req.body;
      // mode: "skip" = skip existing, "overwrite" = update existing
      
      const results = {
        framework: { created: 0, updated: 0, skipped: 0 },
        stage: { created: 0, updated: 0, skipped: 0 },
        project: { created: 0, updated: 0, skipped: 0 },
        deliverable: { created: 0, updated: 0, skipped: 0 },
        epic: { created: 0, updated: 0, skipped: 0 },
        task: { created: 0, updated: 0, skipped: 0 },
        role: { created: 0, updated: 0, skipped: 0 },
        mapping: { created: 0, updated: 0, skipped: 0 }
      };

      // Sanitizers to add default values for missing required fields
      const sanitizeTask = (item: any) => ({
        id: item.id,
        title: item.title || "Untitled Task",
        description: item.description || "",
        defaultPriority: item.defaultPriority || "Medium",
        defaultEstimateHours: item.defaultEstimateHours || 0,
        requiredRole: item.requiredRole || null,
        assignedRoleId: item.assignedRoleId || null,
      });

      const sanitizeRole = (item: any) => ({
        id: item.id,
        name: item.name || "Untitled Role",
        description: item.description || "",
        defaultRoleType: item.defaultRoleType || "Development",
        defaultPermissions: item.defaultPermissions || [],
      });

      const sanitizeStage = (item: any) => ({
        id: item.id,
        name: item.name || "Untitled Stage",
        description: item.description || "",
        defaultTasks: item.defaultTasks || [],
        defaultRoles: item.defaultRoles || [],
        entryCriteria: item.entryCriteria || "",
        exitCriteria: item.exitCriteria || "",
        allowedTaskStatuses: item.allowedTaskStatuses || [],
      });

      const sanitizeFramework = (item: any) => ({
        id: item.id,
        name: item.name || "Untitled Framework",
        description: item.description || "",
        defaultStages: item.defaultStages || [],
      });

      const sanitizeProject = (item: any) => ({
        id: item.id,
        name: item.name || "Untitled Project Template",
        description: item.description || "",
        defaultFrameworkId: item.defaultFrameworkId || null,
        defaultDeliverables: item.defaultDeliverables || [],
        defaultRoles: item.defaultRoles || [],
      });

      const sanitizeDeliverable = (item: any) => ({
        id: item.id,
        title: item.title || "Untitled Deliverable",
        description: item.description || "",
        defaultEpics: item.defaultEpics || [],
      });

      const sanitizeEpic = (item: any) => ({
        id: item.id,
        title: item.title || "Untitled Epic",
        description: item.description || "",
        defaultTasks: item.defaultTasks || [],
        defaultStageIds: item.defaultStageIds || [],
      });

      // Helper to import a template type
      const importTemplates = async (
        items: any[],
        getAll: () => Promise<any[]>,
        create: (data: any) => Promise<any>,
        update: (id: string, data: any) => Promise<any>,
        key: keyof typeof results,
        sanitize?: (item: any) => any
      ) => {
        if (!items?.length) return;
        const existing = await getAll();
        const existingIds = new Set(existing.map((e: any) => e.id));

        for (const item of items) {
          const sanitized = sanitize ? sanitize(item) : item;
          if (existingIds.has(sanitized.id)) {
            if (mode === "overwrite") {
              await update(sanitized.id, sanitized);
              results[key].updated++;
            } else {
              results[key].skipped++;
            }
          } else {
            await create(sanitized);
            results[key].created++;
          }
        }
      }

      await importTemplates(
        templates.framework,
        () => storage.getFrameworkTemplates(),
        (d) => storage.createFrameworkTemplate(d),
        (id, d) => storage.updateFrameworkTemplate(id, d),
        "framework",
        sanitizeFramework
      );
      await importTemplates(
        templates.stage,
        () => storage.getStageTemplates(),
        (d) => storage.createStageTemplate(d),
        (id, d) => storage.updateStageTemplate(id, d),
        "stage",
        sanitizeStage
      );
      await importTemplates(
        templates.project,
        () => storage.getProjectTemplates(),
        (d) => storage.createProjectTemplate(d),
        (id, d) => storage.updateProjectTemplate(id, d),
        "project",
        sanitizeProject
      );
      await importTemplates(
        templates.deliverable,
        () => storage.getDeliverableTemplates(),
        (d) => storage.createDeliverableTemplate(d),
        (id, d) => storage.updateDeliverableTemplate(id, d),
        "deliverable",
        sanitizeDeliverable
      );
      await importTemplates(
        templates.epic,
        () => storage.getEpicTemplates(),
        (d) => storage.createEpicTemplate(d),
        (id, d) => storage.updateEpicTemplate(id, d),
        "epic",
        sanitizeEpic
      );
      await importTemplates(
        templates.task,
        () => storage.getTaskTemplates(),
        (d) => storage.createTaskTemplate(d),
        (id, d) => storage.updateTaskTemplate(id, d),
        "task",
        sanitizeTask
      );
      await importTemplates(
        templates.role,
        () => storage.getRoleTemplates(),
        (d) => storage.createRoleTemplate(d),
        (id, d) => storage.updateRoleTemplate(id, d),
        "role",
        sanitizeRole
      );
      await importTemplates(
        templates.mapping,
        () => storage.getMappingTemplates(),
        (d) => storage.createMappingTemplate(d),
        (id, d) => storage.updateMappingTemplate(id, d),
        "mapping"
      );

      res.json({ success: true, results });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Status Options (covers projectStatuses, taskStatuses, stageTypes)
  app.get("/api/statusOptions", async (req, res) => {
    const options = await storage.getStatusOptions();
    res.json(options);
  });

  app.get("/api/projectStatuses", async (req, res) => {
    const options = await storage.getStatusOptionsByType("project");
    res.json(options);
  });

  app.get("/api/taskStatuses", async (req, res) => {
    const options = await storage.getStatusOptionsByType("task");
    res.json(options);
  });

  app.get("/api/stageTypes", async (req, res) => {
    const options = await storage.getStatusOptionsByType("stage");
    res.json(options);
  });

  app.post("/api/statusOptions", async (req, res) => {
    try {
      const validated = insertStatusOptionSchema.parse(req.body);
      const option = await storage.createStatusOption(validated);
      res.status(201).json(option);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/statusOptions/:id", async (req, res) => {
    try {
      const option = await storage.updateStatusOption(req.params.id, req.body);
      res.json(option);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/statusOptions/:id", async (req, res) => {
    await storage.deleteStatusOption(req.params.id);
    res.status(204).send();
  });

  // Status Usage Counts - get how many entities use a given status label
  app.get("/api/statusOptions/usage/:statusLabel", async (req, res) => {
    try {
      const statusLabel = decodeURIComponent(req.params.statusLabel);
      const usage = await storage.getStatusUsageCounts(statusLabel);
      res.json(usage);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk Status Remap - update all entities from oldStatus to newStatus
  app.post("/api/statusOptions/remap", async (req, res) => {
    try {
      const { oldStatus, newStatus, entityTypes } = req.body;
      if (!oldStatus || !newStatus) {
        return res.status(400).json({ error: "oldStatus and newStatus are required" });
      }
      const result = await storage.remapStatus(oldStatus, newStatus, entityTypes);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Role Types
  app.get("/api/roleTypes", async (req, res) => {
    const roleTypes = await storage.getRoleTypes();
    res.json(roleTypes);
  });

  app.post("/api/roleTypes", async (req, res) => {
    try {
      const validated = insertRoleTypeSchema.parse(req.body);
      const roleType = await storage.createRoleType(validated);
      res.status(201).json(roleType);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/roleTypes/:id", async (req, res) => {
    try {
      const roleType = await storage.updateRoleType(req.params.id, req.body);
      res.json(roleType);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/roleTypes/:id", async (req, res) => {
    await storage.deleteRoleType(req.params.id);
    res.status(204).send();
  });

  // Task Types (global defaults)
  app.get("/api/taskTypes", async (req, res) => {
    const taskTypes = await storage.getTaskTypes();
    res.json(taskTypes);
  });

  app.get("/api/taskTypes/:id", async (req, res) => {
    const taskType = await storage.getTaskTypeById(req.params.id);
    if (!taskType) return res.status(404).json({ error: "Task type not found" });
    res.json(taskType);
  });

  app.post("/api/taskTypes", async (req, res) => {
    try {
      const validated = insertTaskTypeSchema.parse(req.body);
      const taskType = await storage.createTaskType(validated);
      res.status(201).json(taskType);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/taskTypes/:id", async (req, res) => {
    try {
      const taskType = await storage.updateTaskType(req.params.id, req.body);
      res.json(taskType);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/taskTypes/:id", async (req, res) => {
    await storage.deleteTaskType(req.params.id);
    res.status(204).send();
  });

  // Project Task Types (global list for import/export)
  app.get("/api/projectTaskTypes", async (req, res) => {
    const projectTaskTypes = await storage.getProjectTaskTypes();
    res.json(projectTaskTypes);
  });

  // Project Task Types (project-level overrides)
  app.get("/api/projects/:projectId/task-types", async (req, res) => {
    const projectTaskTypes = await storage.getProjectTaskTypesByProjectId(req.params.projectId);
    res.json(projectTaskTypes);
  });

  app.post("/api/projects/:projectId/task-types", async (req, res) => {
    try {
      const validated = insertProjectTaskTypeSchema.parse({ ...req.body, projectId: req.params.projectId });
      const projectTaskType = await storage.createProjectTaskType(validated);
      res.status(201).json(projectTaskType);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/projects/:projectId/task-types/:id", async (req, res) => {
    try {
      const projectTaskType = await storage.updateProjectTaskType(req.params.id, req.body);
      res.json(projectTaskType);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/projects/:projectId/task-types/:id", async (req, res) => {
    await storage.deleteProjectTaskType(req.params.id);
    res.status(204).send();
  });

  app.put("/api/projects/:projectId/task-types", async (req, res) => {
    try {
      const { taskTypes } = req.body;
      await storage.deleteProjectTaskTypesByProjectId(req.params.projectId);
      const created = [];
      for (const taskType of taskTypes) {
        const validated = insertProjectTaskTypeSchema.parse({ ...taskType, projectId: req.params.projectId });
        const newTaskType = await storage.createProjectTaskType(validated);
        created.push(newTaskType);
      }
      res.json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Resolved Task Types (project-specific > global fallback)
  app.get("/api/projects/:projectId/resolved-task-types", async (req, res) => {
    try {
      const settings = await storage.getProjectSettingsByProjectId(req.params.projectId);
      if (settings?.useCustomTaskTypes) {
        const projectTaskTypes = await storage.getProjectTaskTypesByProjectId(req.params.projectId);
        if (projectTaskTypes.length > 0) {
          res.json(projectTaskTypes);
          return;
        }
      }
      const globalTaskTypes = await storage.getTaskTypes();
      res.json(globalTaskTypes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Epic Types (global)
  app.get("/api/epicTypes", async (req, res) => {
    const epicTypes = await storage.getEpicTypes();
    res.json(epicTypes);
  });

  app.get("/api/epicTypes/:id", async (req, res) => {
    const epicType = await storage.getEpicTypeById(req.params.id);
    res.json(epicType);
  });

  app.post("/api/epicTypes", async (req, res) => {
    try {
      const validated = insertEpicTypeSchema.parse(req.body);
      const epicType = await storage.createEpicType(validated);
      res.status(201).json(epicType);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/epicTypes/:id", async (req, res) => {
    try {
      const epicType = await storage.updateEpicType(req.params.id, req.body);
      res.json(epicType);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/epicTypes/:id", async (req, res) => {
    await storage.deleteEpicType(req.params.id);
    res.status(204).send();
  });

  // Deliverable Types (global)
  app.get("/api/deliverableTypes", async (req, res) => {
    const deliverableTypes = await storage.getDeliverableTypes();
    res.json(deliverableTypes);
  });

  app.get("/api/deliverableTypes/:id", async (req, res) => {
    const deliverableType = await storage.getDeliverableTypeById(req.params.id);
    res.json(deliverableType);
  });

  app.post("/api/deliverableTypes", async (req, res) => {
    try {
      const validated = insertDeliverableTypeSchema.parse(req.body);
      const deliverableType = await storage.createDeliverableType(validated);
      res.status(201).json(deliverableType);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/deliverableTypes/:id", async (req, res) => {
    try {
      const deliverableType = await storage.updateDeliverableType(req.params.id, req.body);
      res.json(deliverableType);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/deliverableTypes/:id", async (req, res) => {
    await storage.deleteDeliverableType(req.params.id);
    res.status(204).send();
  });

  // User Role Eligibility (for import/export)
  app.get("/api/userRoleEligibility", async (req, res) => {
    const eligibility = await storage.getUserRoleEligibility();
    res.json(eligibility);
  });

  // Task Dependencies
  app.get("/api/taskDependencies", async (req, res) => {
    const dependencies = await storage.getTaskDependencies();
    res.json(dependencies);
  });

  app.get("/api/tasks/:taskId/dependencies", async (req, res) => {
    const dependencies = await storage.getTaskDependenciesByTaskId(req.params.taskId);
    res.json(dependencies);
  });

  app.get("/api/tasks/:taskId/dependents", async (req, res) => {
    const dependents = await storage.getDependentTasksByTaskId(req.params.taskId);
    res.json(dependents);
  });

  app.post("/api/tasks/:taskId/dependencies", async (req, res) => {
    try {
      const validated = insertTaskDependencySchema.parse({ ...req.body, taskId: req.params.taskId });
      const dependency = await storage.createTaskDependency(validated);
      res.status(201).json(dependency);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/tasks/:taskId/dependencies/:id", async (req, res) => {
    await storage.deleteTaskDependency(req.params.id);
    res.status(204).send();
  });

  // Subtasks
  app.get("/api/tasks/:taskId/subtasks", async (req, res) => {
    const subtasks = await storage.getSubtasksByParentId(req.params.taskId);
    res.json(subtasks);
  });

  app.post("/api/tasks/:taskId/subtasks", async (req, res) => {
    try {
      const validated = insertTaskSchema.parse({ ...req.body, parentTaskId: req.params.taskId });
      
      // Server-side validation: Epic, Stage, and TaskType are required for subtask creation
      if (!validated.epicId) {
        return res.status(400).json({ error: "Epic is required for subtask creation" });
      }
      if (!validated.stageId) {
        return res.status(400).json({ error: "Stage is required for subtask creation" });
      }
      if (!validated.taskTypeId) {
        return res.status(400).json({ error: "Task type is required for subtask creation" });
      }
      
      const subtask = await storage.createTask(validated);
      res.status(201).json(subtask);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Project Task Statuses (global list for import/export)
  app.get("/api/projectTaskStatuses", async (req, res) => {
    const projectTaskStatuses = await storage.getProjectTaskStatuses();
    res.json(projectTaskStatuses);
  });

  // Project Task Statuses (project-level overrides)
  app.get("/api/projects/:projectId/task-statuses", async (req, res) => {
    const statuses = await storage.getProjectTaskStatusesByProjectId(req.params.projectId);
    res.json(statuses);
  });

  app.post("/api/projects/:projectId/task-statuses", async (req, res) => {
    try {
      const validated = insertProjectTaskStatusSchema.parse({ ...req.body, projectId: req.params.projectId });
      const status = await storage.createProjectTaskStatus(validated);
      res.status(201).json(status);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/projects/:projectId/task-statuses/:id", async (req, res) => {
    try {
      const status = await storage.updateProjectTaskStatus(req.params.id, req.body);
      res.json(status);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/projects/:projectId/task-statuses/:id", async (req, res) => {
    await storage.deleteProjectTaskStatus(req.params.id);
    res.status(204).send();
  });

  app.put("/api/projects/:projectId/task-statuses", async (req, res) => {
    try {
      const { statuses } = req.body;
      await storage.deleteProjectTaskStatusesByProjectId(req.params.projectId);
      const created = [];
      for (const status of statuses) {
        const validated = insertProjectTaskStatusSchema.parse({ ...status, projectId: req.params.projectId });
        const newStatus = await storage.createProjectTaskStatus(validated);
        created.push(newStatus);
      }
      res.json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Project Settings (global list for import/export)
  app.get("/api/projectSettings", async (req, res) => {
    const projectSettings = await storage.getProjectSettings();
    res.json(projectSettings);
  });

  // Project Settings
  app.get("/api/projects/:projectId/settings", async (req, res) => {
    const settings = await storage.getProjectSettingsByProjectId(req.params.projectId);
    res.json(settings || { projectId: req.params.projectId, useCustomStatuses: false });
  });

  app.put("/api/projects/:projectId/settings", async (req, res) => {
    try {
      const settings = await storage.upsertProjectSettings(req.params.projectId, req.body);
      res.json(settings);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Resolved Task Statuses (project-specific > global fallback)
  app.get("/api/projects/:projectId/resolved-task-statuses", async (req, res) => {
    try {
      const settings = await storage.getProjectSettingsByProjectId(req.params.projectId);
      if (settings?.useCustomStatuses) {
        const projectStatuses = await storage.getProjectTaskStatusesByProjectId(req.params.projectId);
        if (projectStatuses.length > 0) {
          res.json(projectStatuses);
          return;
        }
      }
      const globalStatuses = await storage.getStatusOptionsByType("task");
      res.json(globalStatuses);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Sprints
  app.get("/api/sprints", async (req, res) => {
    const sprints = await storage.getSprints();
    res.json(sprints);
  });

  app.get("/api/sprints/:id", async (req, res) => {
    const sprint = await storage.getSprintById(req.params.id);
    if (!sprint) return res.status(404).json({ error: "Sprint not found" });
    res.json(sprint);
  });

  app.get("/api/projects/:projectId/sprints", async (req, res) => {
    const sprints = await storage.getSprintsByProjectId(req.params.projectId);
    res.json(sprints);
  });

  app.post("/api/sprints", async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const validated = insertSprintSchema.parse(req.body);
      const sprint = await storage.createSprint({
        ...validated,
        createdBy: userId,
        updatedBy: userId,
      });
      res.status(201).json(sprint);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/sprints/:id", async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const sprint = await storage.updateSprint(req.params.id, {
        ...req.body,
        updatedBy: userId,
        updatedAt: new Date(),
      });
      res.json(sprint);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/sprints/:id", async (req, res) => {
    await storage.deleteSprint(req.params.id);
    res.status(204).send();
  });

  // Sprint lifecycle actions
  app.post("/api/sprints/:id/start", async (req, res) => {
    try {
      const sprint = await storage.getSprintById(req.params.id);
      if (!sprint) return res.status(404).json({ error: "Sprint not found" });
      if (sprint.status !== "planned") {
        return res.status(400).json({ error: "Only planned sprints can be started" });
      }
      // Check no other active sprint for this project
      const projectSprints = await storage.getSprintsByProjectId(sprint.projectId);
      const hasActiveSprint = projectSprints.some(s => s.status === "active" && s.id !== sprint.id);
      if (hasActiveSprint) {
        return res.status(400).json({ error: "Project already has an active sprint" });
      }
      const updated = await storage.updateSprint(req.params.id, { status: "active" });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/sprints/:id/close", async (req, res) => {
    try {
      const sprint = await storage.getSprintById(req.params.id);
      if (!sprint) return res.status(404).json({ error: "Sprint not found" });
      if (sprint.status !== "active") {
        return res.status(400).json({ error: "Only active sprints can be closed" });
      }
      const updated = await storage.updateSprint(req.params.id, { status: "closed" });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Assign/unassign tasks to sprint
  app.post("/api/sprints/:id/tasks", async (req, res) => {
    try {
      const sprint = await storage.getSprintById(req.params.id);
      if (!sprint) return res.status(404).json({ error: "Sprint not found" });
      const { taskIds } = req.body;
      if (!Array.isArray(taskIds)) {
        return res.status(400).json({ error: "taskIds must be an array" });
      }
      // Assign tasks to sprint
      const updates = await Promise.all(
        taskIds.map(taskId => storage.updateTask(taskId, { sprintId: sprint.id }))
      );
      // Log scope events
      await Promise.all(
        taskIds.map(taskId => storage.createSprintScopeEvent({
          sprintId: sprint.id,
          taskId,
          eventType: "added",
          userId: req.body.userId || null,
          note: req.body.note || null
        }))
      );
      res.json({ updated: updates.length });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/sprints/:id/tasks/remove", async (req, res) => {
    try {
      const sprint = await storage.getSprintById(req.params.id);
      if (!sprint) return res.status(404).json({ error: "Sprint not found" });
      const { taskIds } = req.body;
      if (!Array.isArray(taskIds)) {
        return res.status(400).json({ error: "taskIds must be an array" });
      }
      // Remove tasks from sprint
      const updates = await Promise.all(
        taskIds.map(taskId => storage.updateTask(taskId, { sprintId: null }))
      );
      // Log scope events
      await Promise.all(
        taskIds.map(taskId => storage.createSprintScopeEvent({
          sprintId: sprint.id,
          taskId,
          eventType: "removed",
          userId: req.body.userId || null,
          note: req.body.note || null
        }))
      );
      res.json({ updated: updates.length });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Sprint Members
  app.get("/api/sprints/:sprintId/members", async (req, res) => {
    const members = await storage.getSprintMembersBySprintId(req.params.sprintId);
    res.json(members);
  });

  app.get("/api/sprintMembers", async (req, res) => {
    const members = await storage.getSprintMembers();
    res.json(members);
  });

  app.post("/api/sprintMembers", async (req, res) => {
    try {
      const validated = insertSprintMemberSchema.parse(req.body);
      const member = await storage.createSprintMember(validated);
      res.status(201).json(member);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/sprintMembers/:id", async (req, res) => {
    try {
      const member = await storage.updateSprintMember(req.params.id, req.body);
      res.json(member);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/sprintMembers/:id", async (req, res) => {
    await storage.deleteSprintMember(req.params.id);
    res.status(204).send();
  });

  // Sprint Scope Events
  app.get("/api/sprints/:sprintId/scopeEvents", async (req, res) => {
    const events = await storage.getSprintScopeEventsBySprintId(req.params.sprintId);
    res.json(events);
  });

  app.get("/api/sprintScopeEvents", async (req, res) => {
    const events = await storage.getSprintScopeEvents();
    res.json(events);
  });

  // Sprint Scope Targets
  app.get("/api/sprints/:sprintId/scope-targets", async (req, res) => {
    try {
      const targets = await storage.getSprintScopeTargetsBySprintId(req.params.sprintId);
      res.json(targets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/sprintScopeTargets", async (req, res) => {
    const targets = await storage.getSprintScopeTargets();
    res.json(targets);
  });

  app.post("/api/sprints/:sprintId/scope-targets", async (req, res) => {
    try {
      const sprint = await storage.getSprintById(req.params.sprintId);
      if (!sprint) return res.status(404).json({ error: "Sprint not found" });
      
      const { targetType, targetId, autoSyncTasks } = req.body;
      if (!targetType || !targetId) {
        return res.status(400).json({ error: "targetType and targetId are required" });
      }
      if (!["epic", "milestone", "stage"].includes(targetType)) {
        return res.status(400).json({ error: "targetType must be epic, milestone, or stage" });
      }
      
      const target = await storage.createSprintScopeTarget({
        sprintId: req.params.sprintId,
        targetType,
        targetId,
        autoSyncTasks: autoSyncTasks || false
      });
      res.status(201).json(target);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/sprints/:sprintId/scope-targets/:targetId", async (req, res) => {
    try {
      await storage.deleteSprintScopeTarget(req.params.targetId);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Clear all scope targets for a sprint (when switching scope mode)
  app.delete("/api/sprints/:sprintId/scope-targets", async (req, res) => {
    try {
      await storage.deleteSprintScopeTargetsBySprintId(req.params.sprintId);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get suggested tasks based on scope targets
  app.get("/api/sprints/:sprintId/suggested-tasks", async (req, res) => {
    try {
      const targets = await storage.getSprintScopeTargetsBySprintId(req.params.sprintId);
      const sprint = await storage.getSprintById(req.params.sprintId);
      if (!sprint) return res.status(404).json({ error: "Sprint not found" });

      // Get all tasks for the project that are not already in this sprint
      const allTasks = await storage.getTasksByProjectId(sprint.projectId);
      const availableTasks = allTasks.filter(t => !t.sprintId);

      // Filter tasks based on scope targets
      const targetedTasks = availableTasks.filter(task => {
        return targets.some(target => {
          if (target.targetType === "epic") {
            return task.epicId === target.targetId;
          } else if (target.targetType === "milestone") {
            return task.milestoneId === target.targetId;
          } else if (target.targetType === "stage") {
            return task.stageId === target.targetId;
          }
          return false;
        });
      });

      res.json(targetedTasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Sprint Pulse Updates (async standups)
  app.get("/api/sprints/:sprintId/pulse", async (req, res) => {
    try {
      const updates = await storage.getSprintPulseUpdatesBySprintId(req.params.sprintId);
      res.json(updates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/sprintPulseUpdates", async (req, res) => {
    const updates = await storage.getSprintPulseUpdates();
    res.json(updates);
  });

  app.post("/api/sprints/:sprintId/pulse", async (req, res) => {
    try {
      const sprint = await storage.getSprintById(req.params.sprintId);
      if (!sprint) return res.status(404).json({ error: "Sprint not found" });

      const { userId, date, didText, nextText, blockersText, referencedTaskIds } = req.body;
      if (!userId || !date) {
        return res.status(400).json({ error: "userId and date are required" });
      }

      const existingUpdate = await storage.getSprintPulseUpdateByUserAndDate(
        req.params.sprintId,
        userId,
        date
      );

      if (existingUpdate) {
        const updated = await storage.updateSprintPulseUpdate(existingUpdate.id, {
          didText: didText ?? existingUpdate.didText,
          nextText: nextText ?? existingUpdate.nextText,
          blockersText: blockersText ?? existingUpdate.blockersText,
          referencedTaskIds: referencedTaskIds ?? existingUpdate.referencedTaskIds,
        });
        res.json(updated);
      } else {
        const validated = insertSprintPulseUpdateSchema.parse({
          sprintId: req.params.sprintId,
          userId,
          date,
          didText: didText || null,
          nextText: nextText || null,
          blockersText: blockersText || null,
          referencedTaskIds: referencedTaskIds || [],
        });
        const created = await storage.createSprintPulseUpdate(validated);
        res.status(201).json(created);
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/sprints/:sprintId/pulse/suggestions", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ error: "userId query param required" });
      }

      const sprint = await storage.getSprintById(req.params.sprintId);
      if (!sprint) return res.status(404).json({ error: "Sprint not found" });

      const sprintTasks = (await storage.getTasks()).filter(t => t.sprintId === sprint.id);
      const userTasks = sprintTasks.filter(t => t.assigneeId === userId);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const doneTasks = userTasks.filter(t => 
        t.status === "Done" || t.status === "Completed"
      );
      const inProgressTasks = userTasks.filter(t => 
        t.status === "In Progress" || t.status === "Review"
      );
      const blockedTasks = userTasks.filter(t => t.blocked === true);

      res.json({
        didSuggestions: doneTasks.map(t => ({ id: t.id, title: t.title })),
        nextSuggestions: inProgressTasks.map(t => ({ id: t.id, title: t.title })),
        blockerSuggestions: blockedTasks.map(t => ({
          id: t.id,
          title: t.title,
          reason: t.blockerReason
        }))
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Home Page APIs
  app.get("/api/home/tasks/:userId", async (req, res) => {
    try {
      const tasks = await storage.getTasksForUserHome(req.params.userId);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/home/milestones", async (req, res) => {
    try {
      const milestones = await storage.getUpcomingMilestones();
      res.json(milestones);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/home/projects", async (req, res) => {
    try {
      const projects = await storage.getActiveProjectsWithProgress();
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User Preferences (global list for import/export)
  app.get("/api/userPreferences", async (req, res) => {
    const userPreferences = await storage.getAllUserPreferences();
    res.json(userPreferences);
  });

  // User Preferences
  app.get("/api/users/:userId/preferences", async (req, res) => {
    try {
      const prefs = await storage.getUserPreferences(req.params.userId);
      if (!prefs) {
        return res.json({
          userId: req.params.userId,
          workdayStartTime: "09:00",
          workdayEndTime: "17:00",
          defaultTargetDailyMinutes: 480,
          showOnlyActionable: false,
          timezone: "America/New_York"
        });
      }
      res.json(prefs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users/:userId/preferences", async (req, res) => {
    try {
      const validated = insertUserPreferencesSchema.parse({ ...req.body, userId: req.params.userId });
      const existing = await storage.getUserPreferences(req.params.userId);
      if (existing) {
        const updated = await storage.updateUserPreferences(req.params.userId, validated);
        return res.json(updated);
      }
      const created = await storage.createUserPreferences(validated);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Work Blocks (global list for import/export)
  app.get("/api/workBlocks", async (req, res) => {
    const workBlocks = await storage.getAllWorkBlocks();
    res.json(workBlocks);
  });

  // Work Blocks
  app.get("/api/users/:userId/workblocks", async (req, res) => {
    try {
      const date = req.query.date as string;
      if (!date) return res.status(400).json({ error: "date query parameter required" });
      const blocks = await storage.getWorkBlocksByUserAndDate(req.params.userId, date);
      res.json(blocks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workblocks", async (req, res) => {
    try {
      const validated = insertWorkBlockSchema.parse(req.body);
      const created = await storage.createWorkBlock(validated);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/workblocks/:id", async (req, res) => {
    try {
      const updated = await storage.updateWorkBlock(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/workblocks/:id", async (req, res) => {
    try {
      await storage.deleteWorkBlock(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Dashboard API (Time-Horizon Based)
  app.get("/api/dashboard", async (req, res) => {
    try {
      const range = (req.query.range as string) || 'week';
      const projectIds = req.query.projectIds 
        ? (Array.isArray(req.query.projectIds) ? req.query.projectIds : [req.query.projectIds]) as string[]
        : undefined;
      const assigneeScope = (req.query.assigneeScope as string) || 'all';
      const userId = req.query.userId as string | undefined;

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Calculate date ranges based on range parameter
      const getWeekStart = (d: Date) => {
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.getFullYear(), d.getMonth(), diff);
      };
      
      const thisWeekStart = getWeekStart(startOfToday);
      const thisWeekEnd = new Date(thisWeekStart);
      thisWeekEnd.setDate(thisWeekEnd.getDate() + 6);
      
      const nextWeekStart = new Date(thisWeekStart);
      nextWeekStart.setDate(nextWeekStart.getDate() + 7);
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);

      // Future horizon based on range
      let futureEndDate = new Date(startOfToday);
      if (range === '30days') futureEndDate.setDate(futureEndDate.getDate() + 30);
      else if (range === '60days') futureEndDate.setDate(futureEndDate.getDate() + 60);
      else if (range === '90days') futureEndDate.setDate(futureEndDate.getDate() + 90);
      else futureEndDate.setDate(futureEndDate.getDate() + 90); // default for trajectory

      // Fetch all data
      let allTasks = await storage.getTasks();
      let allMilestones = await storage.getMilestones();
      let allProjects = await storage.getProjects();
      let allStages = await storage.getProjectStages();
      const allEpics = await storage.getEpics();

      // Filter by project scope
      if (projectIds && projectIds.length > 0) {
        allTasks = allTasks.filter(t => projectIds.includes(t.projectId || ''));
        allMilestones = allMilestones.filter(m => projectIds.includes(m.projectId || ''));
        allProjects = allProjects.filter(p => projectIds.includes(p.id));
        allStages = allStages.filter(s => projectIds.includes(s.projectId || ''));
      }

      // Filter by assignee scope
      if (assigneeScope === 'me' && userId) {
        allTasks = allTasks.filter(t => t.assigneeId === userId);
      }

      // Helper to parse date strings
      const parseDate = (d: string | null | undefined): Date | null => {
        if (!d) return null;
        const parsed = new Date(d);
        return isNaN(parsed.getTime()) ? null : parsed;
      };

      // Priority Score calculation
      const calculatePriorityScore = (task: typeof allTasks[0]): number => {
        let score = 0;
        const deadline = parseDate(task.deadline);
        if (!deadline) return score;
        
        const daysUntilDue = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Overdue: +50
        if (daysUntilDue < 0) score += 50;
        // Due in 0-2 days: +30
        else if (daysUntilDue <= 2) score += 30;
        // Due in 3-7 days: +20
        else if (daysUntilDue <= 7) score += 20;
        // Due in 8-14 days: +10
        else if (daysUntilDue <= 14) score += 10;
        
        // In progress: +5
        if (task.status === 'In Progress') score += 5;
        // Not started & due ≤7 days: +10
        if (task.status === 'Todo' && daysUntilDue <= 7) score += 10;
        
        // Priority boost
        if (task.priority === 'High') score += 10;
        if (task.priority === 'Critical') score += 20;
        
        return score;
      };

      // At-Risk detection
      const isAtRisk = (task: typeof allTasks[0]): boolean => {
        if (task.status === 'Done' || task.status === 'Completed') return false;
        
        const deadline = parseDate(task.deadline);
        if (!deadline) return false;
        
        const daysUntilDue = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Overdue
        if (daysUntilDue < 0) return true;
        // Due in ≤2 days and not In Progress/Done
        if (daysUntilDue <= 2 && task.status !== 'In Progress') return true;
        // Blocked
        if (task.status === 'Blocked') return true;
        
        return false;
      };

      // Filter incomplete tasks
      const incompleteTasks = allTasks.filter(t => 
        t.status !== 'Done' && t.status !== 'Completed'
      );

      // THIS WEEK data
      const thisWeekTasks = incompleteTasks.filter(t => {
        const deadline = parseDate(t.deadline);
        if (!deadline) return false;
        return deadline >= thisWeekStart && deadline <= thisWeekEnd;
      });

      const overdueTasks = incompleteTasks.filter(t => {
        const deadline = parseDate(t.deadline);
        if (!deadline) return false;
        return deadline < startOfToday;
      });

      const blockedTasks = incompleteTasks.filter(t => t.status === 'Blocked');

      const atRiskTasks = incompleteTasks
        .filter(isAtRisk)
        .map(t => ({ ...t, priorityScore: calculatePriorityScore(t) }))
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, 10);

      // My commitments (top 15 this week tasks)
      const myCommitments = thisWeekTasks
        .map(t => ({ ...t, priorityScore: calculatePriorityScore(t) }))
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, 15);

      // Weekly Focus per project
      const thisWeekMilestones = allMilestones.filter(m => {
        const targetDate = parseDate(m.targetDate);
        if (!targetDate) return false;
        return targetDate >= thisWeekStart && targetDate <= thisWeekEnd && m.status !== 'completed';
      });

      const weeklyFocusMap = new Map<string, { project: typeof allProjects[0]; milestone?: typeof allMilestones[0]; tasks: typeof allTasks }>();
      
      for (const project of allProjects) {
        const projectMilestones = thisWeekMilestones.filter(m => m.projectId === project.id);
        const projectTasks = thisWeekTasks
          .filter(t => t.projectId === project.id)
          .map(t => ({ ...t, priorityScore: calculatePriorityScore(t) }))
          .sort((a, b) => b.priorityScore - a.priorityScore)
          .slice(0, 3);
        
        if (projectMilestones.length > 0 || projectTasks.length > 0) {
          weeklyFocusMap.set(project.id, {
            project,
            milestone: projectMilestones[0],
            tasks: projectTasks
          });
        }
      }

      // NEXT WEEK data
      const nextWeekTasks = incompleteTasks.filter(t => {
        const deadline = parseDate(t.deadline);
        if (!deadline) return false;
        return deadline >= nextWeekStart && deadline <= nextWeekEnd;
      });

      const nextWeekMilestones = allMilestones.filter(m => {
        const targetDate = parseDate(m.targetDate);
        if (!targetDate) return false;
        return targetDate >= nextWeekStart && targetDate <= nextWeekEnd && m.status !== 'completed';
      });

      // Milestone confidence calculation
      const getMilestoneConfidence = (milestone: typeof allMilestones[0]) => {
        const linkedTasks = incompleteTasks.filter(t => t.milestoneId === milestone.id);
        const overdueLinkeds = linkedTasks.filter(t => {
          const deadline = parseDate(t.deadline);
          return deadline && deadline < startOfToday;
        });
        
        const targetDate = parseDate(milestone.targetDate);
        const daysUntilDue = targetDate ? Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 999;
        const inProgressCount = linkedTasks.filter(t => t.status === 'In Progress').length;
        
        // At risk conditions
        if (overdueLinkeds.length > 0) return 'at_risk';
        if (linkedTasks.length > 10 && daysUntilDue <= 7) return 'at_risk';
        if (daysUntilDue <= 7 && inProgressCount === 0) return 'at_risk';
        
        return 'on_track';
      };

      // Capacity preview (count-based)
      const notStartedNextWeek = nextWeekTasks.filter(t => t.status === 'Todo').length;
      let capacityLevel: 'low' | 'medium' | 'high' = 'low';
      if (notStartedNextWeek > 10) capacityLevel = 'high';
      else if (notStartedNextWeek > 5) capacityLevel = 'medium';

      // FUTURE (1-3 months) data
      const futureMilestones = allMilestones
        .filter(m => {
          const targetDate = parseDate(m.targetDate);
          if (!targetDate) return false;
          return targetDate > nextWeekEnd && targetDate <= futureEndDate && m.status !== 'completed';
        })
        .slice(0, 20);

      // Stage progress with health
      const stageProgress = allStages.map(stage => {
        const project = allProjects.find(p => p.id === stage.projectId);
        const stageTasks = incompleteTasks.filter(t => t.stageId === stage.id);
        
        let health: 'on_track' | 'at_risk' = 'on_track';
        // Simple health check based on task count
        if (stageTasks.length > 10) health = 'at_risk';
        
        return {
          ...stage,
          projectName: project?.name,
          openTaskCount: stageTasks.length,
          health
        };
      });

      // Risk Radar
      const longRunningTasks = incompleteTasks.filter(t => {
        // Tasks created more than 30 days ago (using deadline as proxy since we don't have createdAt)
        const deadline = parseDate(t.deadline);
        if (!deadline) return false;
        const daysSinceDue = Math.ceil((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceDue > 30;
      }).slice(0, 10);

      // Build response
      const response = {
        summary: {
          tasksDue: thisWeekTasks.length,
          overdue: overdueTasks.length,
          blocked: blockedTasks.length,
          milestonesDue: thisWeekMilestones.length,
          capacityLevel
        },
        thisWeek: {
          myCommitments: myCommitments.map(t => {
            const epic = allEpics.find(e => e.id === t.epicId);
            return {
              id: t.id,
              title: t.title,
              projectId: t.projectId,
              projectName: allProjects.find(p => p.id === t.projectId)?.name,
              epicId: t.epicId,
              epicName: epic?.title,
              deadline: t.deadline,
              status: t.status,
              priority: t.priority,
              priorityScore: t.priorityScore,
              isOverdue: parseDate(t.deadline) ? parseDate(t.deadline)! < startOfToday : false,
              isBlocked: t.status === 'Blocked'
            };
          }),
          atRisk: atRiskTasks.map(t => {
            const epic = allEpics.find(e => e.id === t.epicId);
            return {
              id: t.id,
              title: t.title,
              projectId: t.projectId,
              projectName: allProjects.find(p => p.id === t.projectId)?.name,
              epicId: t.epicId,
              epicName: epic?.title,
              deadline: t.deadline,
              status: t.status,
              priority: t.priority,
              priorityScore: t.priorityScore
            };
          }),
          weeklyFocus: Array.from(weeklyFocusMap.values()).map(f => ({
            projectId: f.project.id,
            projectName: f.project.name,
            milestone: f.milestone ? {
              id: f.milestone.id,
              name: f.milestone.name,
              targetDate: f.milestone.targetDate,
              status: f.milestone.status
            } : null,
            topTasks: f.tasks.map(t => ({
              id: t.id,
              title: t.title,
              deadline: t.deadline,
              status: t.status
            }))
          }))
        },
        nextWeek: {
          milestones: nextWeekMilestones.map(m => ({
            id: m.id,
            name: m.name,
            projectId: m.projectId,
            projectName: allProjects.find(p => p.id === m.projectId)?.name,
            targetDate: m.targetDate,
            status: m.status,
            confidence: getMilestoneConfidence(m)
          })),
          rollingTasks: nextWeekTasks
            .map(t => ({ ...t, priorityScore: calculatePriorityScore(t) }))
            .sort((a, b) => b.priorityScore - a.priorityScore)
            .slice(0, 15)
            .map(t => ({
              id: t.id,
              title: t.title,
              projectId: t.projectId,
              projectName: allProjects.find(p => p.id === t.projectId)?.name,
              deadline: t.deadline,
              status: t.status,
              priority: t.priority
            })),
          capacityPreview: {
            notStartedCount: notStartedNextWeek,
            capacityLevel
          }
        },
        future: {
          milestones: futureMilestones.map(m => ({
            id: m.id,
            name: m.name,
            projectId: m.projectId,
            projectName: allProjects.find(p => p.id === m.projectId)?.name,
            targetDate: m.targetDate,
            status: m.status
          })),
          stageProgress: stageProgress.slice(0, 10),
          risks: longRunningTasks.map(t => ({
            id: t.id,
            title: t.title,
            projectId: t.projectId,
            projectName: allProjects.find(p => p.id === t.projectId)?.name,
            type: 'long_running' as const,
            deadline: t.deadline
          }))
        }
      };

      res.json(response);
    } catch (error: any) {
      console.error("Dashboard API error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Day Plans (global list for import/export)
  app.get("/api/dayPlans", async (req, res) => {
    const dayPlans = await storage.getAllDayPlans();
    res.json(dayPlans);
  });

  // Day Plans
  app.get("/api/users/:userId/dayplan", async (req, res) => {
    try {
      const date = req.query.date as string;
      if (!date) return res.status(400).json({ error: "date query parameter required" });
      const plan = await storage.getDayPlan(req.params.userId, date);
      if (!plan) {
        return res.json({
          userId: req.params.userId,
          date,
          workBlocks: [],
          unassignedTaskIds: [],
          targetWorkMinutes: 480,
          plannedMinutes: 0
        });
      }
      res.json(plan);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/dayplans", async (req, res) => {
    try {
      const validated = insertDayPlanSchema.parse(req.body);
      const existing = await storage.getDayPlan(validated.userId, validated.date);
      if (existing) {
        const updated = await storage.updateDayPlan(validated.userId, validated.date, validated);
        return res.json(updated);
      }
      const created = await storage.createDayPlan(validated);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Bulk Import Endpoint - handles dependency-ordered entity creation with ID mapping
  app.post("/api/imports", async (req, res) => {
    try {
      const { entities, defaults } = req.body as {
        entities: Record<string, Record<string, any>[]>;
        defaults: {
          description?: string;
          deadline?: string;
          startDate?: string;
          ownerId?: string;
        };
      };

      if (!entities || typeof entities !== 'object') {
        return res.status(400).json({ error: "entities object is required" });
      }

      const idMappings: Record<string, Record<string, string>> = {
        Users: {},
        Projects: {},
        ProjectStages: {},
        Deliverables: {},
        Epics: {},
        Milestones: {},
        Sprints: {},
        Tasks: {},
        Comments: {}
      };

      const results: Record<string, { created: number; errors: string[] }> = {};
      const errors: string[] = [];

      const importOrder = ['Users', 'Projects', 'ProjectStages', 'Deliverables', 'Epics', 'Milestones', 'Sprints', 'Tasks', 'Comments'];

      const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Returns mapped ID if available, otherwise returns original value (for pre-existing entities)
      const remapForeignKey = (value: string | undefined, entityType: string): string | undefined => {
        if (!value) return undefined;
        // Check if we have a mapping from this import batch
        if (idMappings[entityType]?.[value]) {
          return idMappings[entityType][value];
        }
        // Return original value - it might reference a pre-existing entity
        return value;
      };

      // Cache for verified existing entity IDs to avoid repeated lookups
      const existingEntityCache: Record<string, Set<string>> = {
        Users: new Set<string>(),
        Projects: new Set<string>(),
        Deliverables: new Set<string>(),
        Epics: new Set<string>(),
        ProjectStages: new Set<string>(),
        Milestones: new Set<string>(),
        Sprints: new Set<string>(),
        Tasks: new Set<string>()
      };

      // Pre-fetch existing entities for FK validation
      const existingUsers = await storage.getUsers();
      existingUsers.forEach(u => existingEntityCache.Users.add(u.id));
      
      const existingProjects = await storage.getProjects();
      existingProjects.forEach(p => existingEntityCache.Projects.add(p.id));
      
      const existingDeliverables = await storage.getDeliverables();
      existingDeliverables.forEach(d => existingEntityCache.Deliverables.add(d.id));
      
      const existingEpics = await storage.getEpics();
      existingEpics.forEach(e => existingEntityCache.Epics.add(e.id));
      
      const existingStages = await storage.getProjectStages();
      existingStages.forEach(s => existingEntityCache.ProjectStages.add(s.id));
      
      const existingSprints = await storage.getSprints();
      existingSprints.forEach(s => existingEntityCache.Sprints.add(s.id));
      
      const existingMilestones = await storage.getMilestones();
      existingMilestones.forEach(m => existingEntityCache.Milestones.add(m.id));
      
      const existingTasks = await storage.getTasks();
      existingTasks.forEach(t => existingEntityCache.Tasks.add(t.id));

      // Cache for fallback user - fetched once when needed
      let fallbackUserId: string | undefined;
      const getFallbackUserId = async (): Promise<string | undefined> => {
        if (fallbackUserId) return fallbackUserId;
        // First try defaults.ownerId but verify it exists
        if (defaults?.ownerId && existingEntityCache.Users.has(defaults.ownerId)) {
          fallbackUserId = defaults.ownerId;
          return fallbackUserId;
        }
        // Fall back to first existing user
        fallbackUserId = existingUsers[0]?.id;
        return fallbackUserId;
      };

      // Validate ownerId - returns valid ID or undefined
      const validateOwnerId = async (ownerId: string | undefined): Promise<string | undefined> => {
        if (!ownerId) return undefined;
        // Check if it's a newly created user from this import
        const mappedId = idMappings.Users[ownerId];
        if (mappedId) return mappedId;
        // Check if it's an existing user
        if (existingEntityCache.Users.has(ownerId)) return ownerId;
        // Not found - return undefined to trigger fallback
        return undefined;
      };

      // Validate any FK - returns valid ID only if it exists (in mappings or in DB)
      const validateForeignKey = (value: string | undefined, entityType: string): string | undefined => {
        if (!value) return undefined;
        // Check if it was created in this import batch
        if (idMappings[entityType]?.[value]) {
          return idMappings[entityType][value];
        }
        // Check if it exists in the database
        if (existingEntityCache[entityType]?.has(value)) {
          return value;
        }
        // Not found - return undefined
        return undefined;
      };

      // Register newly created entity in cache for child entities to reference
      const registerCreatedEntity = (entityType: string, id: string) => {
        if (existingEntityCache[entityType]) {
          existingEntityCache[entityType].add(id);
        }
      };

      for (const entityType of importOrder) {
        const rows = entities[entityType];
        if (!rows || rows.length === 0) continue;

        results[entityType] = { created: 0, errors: [] };

        for (const row of rows) {
          try {
            const sourceId = row.sourceId || row.id || generateId();
            const newId = generateId();
            
            switch (entityType) {
              case 'Users': {
                const userData = {
                  id: newId,
                  name: row.name || 'Imported User',
                  email: row.email || `user_${newId}@import.local`,
                  role: row.role || 'Team Member',
                  status: row.status || 'Active'
                };
                await storage.createUser(userData);
                idMappings.Users[sourceId] = newId;
                results[entityType].created++;
                break;
              }

              case 'Projects': {
                // Build ownerId with fallback chain: validate existing → mapped user → defaults.ownerId → first existing user
                let projectOwnerId = await validateOwnerId(row.ownerId);
                if (!projectOwnerId) {
                  projectOwnerId = await getFallbackUserId();
                  if (row.ownerId) {
                    console.log(`Import: Project "${row.name}" ownerId "${row.ownerId}" not found, using fallback user`);
                  }
                }
                const projectData = {
                  id: newId,
                  name: row.name || 'Imported Project',
                  description: row.description || defaults?.description || 'Imported project',
                  status: row.status || 'Upcoming',
                  startDate: row.startDate || defaults?.startDate,
                  deadline: row.deadline || defaults?.deadline || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  progress: row.progress || 0,
                  ownerId: projectOwnerId,
                  frameworkId: row.frameworkId,
                  client: row.client,
                  riskLevel: row.riskLevel,
                  externalRefs: row.externalRefs
                };
                await storage.createProject(projectData);
                idMappings.Projects[sourceId] = newId;
                registerCreatedEntity('Projects', newId);
                results[entityType].created++;
                break;
              }

              case 'ProjectStages': {
                const validProjectId = validateForeignKey(row.projectId, 'Projects');
                if (!validProjectId) {
                  results[entityType].errors.push(`Stage "${row.name}": projectId "${row.projectId}" not found`);
                  continue;
                }
                const stageData = {
                  id: newId,
                  projectId: validProjectId,
                  name: row.name || 'Imported Stage',
                  description: row.description,
                  order: row.order || 0,
                  type: row.type || 'work',
                  status: row.status || 'pending',
                  startDate: row.startDate,
                  endDate: row.endDate
                };
                await storage.createProjectStage(stageData);
                idMappings.ProjectStages[sourceId] = newId;
                registerCreatedEntity('ProjectStages', newId);
                results[entityType].created++;
                break;
              }

              case 'Deliverables': {
                const validProjectId = validateForeignKey(row.projectId, 'Projects');
                if (!validProjectId) {
                  results[entityType].errors.push(`Deliverable "${row.title}": projectId "${row.projectId}" not found`);
                  continue;
                }
                let mappedOwnerId = await validateOwnerId(row.ownerId);
                if (!mappedOwnerId) {
                  mappedOwnerId = await getFallbackUserId();
                }
                if (!mappedOwnerId) {
                  results[entityType].errors.push(`Deliverable "${row.title}": No owner available`);
                  continue;
                }
                const deliverableData = {
                  id: newId,
                  projectId: validProjectId,
                  title: row.title || row.name || 'Imported Deliverable',
                  description: row.description || row.title || 'Imported deliverable',
                  status: row.status || 'Not Started',
                  ownerId: mappedOwnerId,
                  startDate: row.startDate || defaults?.startDate,
                  dueDate: row.dueDate || defaults?.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  progress: row.progress || 0,
                  externalRefs: row.externalRefs
                };
                await storage.createDeliverable(deliverableData);
                idMappings.Deliverables[sourceId] = newId;
                registerCreatedEntity('Deliverables', newId);
                results[entityType].created++;
                break;
              }

              case 'Epics': {
                const validDeliverableId = validateForeignKey(row.deliverableId, 'Deliverables');
                if (!validDeliverableId) {
                  results[entityType].errors.push(`Epic "${row.title}": deliverableId "${row.deliverableId}" not found`);
                  continue;
                }
                let epicOwnerId = await validateOwnerId(row.ownerId);
                if (!epicOwnerId) {
                  epicOwnerId = await getFallbackUserId();
                }
                if (!epicOwnerId) {
                  results[entityType].errors.push(`Epic "${row.title}": No owner available`);
                  continue;
                }
                // Ensure stageIds is an array
                let epicStageIds: string[] = [];
                if (Array.isArray(row.stageIds)) {
                  epicStageIds = row.stageIds;
                } else if (typeof row.stageIds === 'string' && row.stageIds) {
                  try {
                    const parsed = JSON.parse(row.stageIds);
                    epicStageIds = Array.isArray(parsed) ? parsed : [];
                  } catch {
                    epicStageIds = row.stageIds.split(',').map((s: string) => s.trim()).filter(Boolean);
                  }
                }
                const epicData = {
                  id: newId,
                  deliverableId: validDeliverableId,
                  title: row.title || row.name || 'Imported Epic',
                  description: row.description || row.title || 'Imported epic',
                  status: row.status || 'Not Started',
                  ownerId: epicOwnerId,
                  startDate: row.startDate || defaults?.startDate || new Date().toISOString().split('T')[0],
                  endDate: row.endDate || defaults?.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  progress: row.progress || 0,
                  stageIds: epicStageIds,
                  externalRefs: row.externalRefs
                };
                await storage.createEpic(epicData);
                idMappings.Epics[sourceId] = newId;
                registerCreatedEntity('Epics', newId);
                results[entityType].created++;
                break;
              }

              case 'Milestones': {
                const validMilestoneProjectId = validateForeignKey(row.projectId, 'Projects');
                // Log warning if projectId was provided but not found (projectId is nullable in schema)
                if (row.projectId && !validMilestoneProjectId) {
                  console.log(`Import: Milestone "${row.name}" projectId "${row.projectId}" not found, clearing reference`);
                }
                let milestoneOwnerId = await validateOwnerId(row.ownerId);
                if (!milestoneOwnerId) {
                  milestoneOwnerId = await getFallbackUserId();
                }
                if (!milestoneOwnerId) {
                  results[entityType].errors.push(`Milestone "${row.name}": No owner available`);
                  continue;
                }
                const milestoneData = {
                  id: newId,
                  projectId: validMilestoneProjectId || null,
                  name: row.name || 'Imported Milestone',
                  description: row.description || 'Imported milestone',
                  phase: row.phase || 'Planning',
                  targetDate: row.targetDate || defaults?.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  status: row.status || 'planned',
                  ownerId: milestoneOwnerId,
                  scopeType: row.scopeType || 'all',
                  completionMode: row.completionMode || 'all_tasks'
                };
                await storage.createMilestone(milestoneData);
                idMappings.Milestones[sourceId] = newId;
                registerCreatedEntity('Milestones', newId);
                results[entityType].created++;
                break;
              }

              case 'Sprints': {
                const validSprintProjectId = validateForeignKey(row.projectId, 'Projects');
                if (!validSprintProjectId) {
                  results[entityType].errors.push(`Sprint "${row.name}": projectId "${row.projectId}" not found`);
                  continue;
                }
                const sprintData = {
                  id: newId,
                  projectId: validSprintProjectId,
                  name: row.name || 'Imported Sprint',
                  goal: row.goal,
                  startDate: row.startDate || defaults?.startDate,
                  endDate: row.endDate || defaults?.deadline,
                  status: row.status || 'Planned',
                  capacityHours: row.capacityHours || row.capacity
                };
                await storage.createSprint(sprintData);
                idMappings.Sprints[sourceId] = newId;
                registerCreatedEntity('Sprints', newId);
                results[entityType].created++;
                break;
              }

              case 'Tasks': {
                // Validate task FKs - all are optional in schema, but log warnings for unmapped references
                const validEpicId = validateForeignKey(row.epicId, 'Epics');
                const validProjectId = validateForeignKey(row.projectId, 'Projects');
                const validStageId = validateForeignKey(row.stageId, 'ProjectStages');
                const validAssigneeId = await validateOwnerId(row.assigneeId);
                const validMilestoneId = validateForeignKey(row.milestoneId, 'Milestones');
                const validSprintId = validateForeignKey(row.sprintId, 'Sprints');
                
                // Log warnings for unmapped FKs but continue (they're nullable in schema)
                if (row.epicId && !validEpicId) {
                  console.log(`Import: Task "${row.title}" epicId "${row.epicId}" not found, clearing reference`);
                }
                if (row.projectId && !validProjectId) {
                  console.log(`Import: Task "${row.title}" projectId "${row.projectId}" not found, clearing reference`);
                }
                
                // Ensure tags is an array
                let taskTags: string[] = [];
                if (Array.isArray(row.tags)) {
                  taskTags = row.tags;
                } else if (typeof row.tags === 'string' && row.tags) {
                  try {
                    const parsed = JSON.parse(row.tags);
                    taskTags = Array.isArray(parsed) ? parsed : [];
                  } catch {
                    taskTags = row.tags.split(',').map((s: string) => s.trim()).filter(Boolean);
                  }
                }
                // Validate status against App Defaults
                const validatedStatus = await storage.validateAndResolveStatus(row.status, "task");
                
                const taskData = {
                  id: newId,
                  title: row.title || 'Imported Task',
                  description: row.description,
                  project: row.project || 'Imported',
                  projectId: validProjectId || null,
                  epicId: validEpicId || null,
                  stageId: validStageId || null,
                  status: validatedStatus,
                  assigneeId: validAssigneeId || null,
                  deadline: row.deadline || defaults?.deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  priority: row.priority || 'Medium',
                  milestoneId: validMilestoneId || null,
                  sprintId: validSprintId || null,
                  estimateHours: row.estimateHours,
                  effort: row.effort,
                  tags: taskTags,
                  blocked: row.blocked || false,
                  blockerReason: row.blockerReason,
                  externalRefs: row.externalRefs
                };
                await storage.createTask(taskData);
                idMappings.Tasks[sourceId] = newId;
                registerCreatedEntity('Tasks', newId);
                results[entityType].created++;
                break;
              }

              case 'Comments': {
                // Validate taskId is required for comments
                const validTaskId = validateForeignKey(row.taskId, 'Tasks');
                if (!validTaskId) {
                  results[entityType].errors.push(`Comment: taskId "${row.taskId}" not found`);
                  continue;
                }
                // Validate authorId with fallback
                let commentAuthorId = await validateOwnerId(row.authorId);
                if (!commentAuthorId) {
                  commentAuthorId = await getFallbackUserId();
                }
                if (!commentAuthorId) {
                  results[entityType].errors.push(`Comment: No author available`);
                  continue;
                }
                const commentData = {
                  id: newId,
                  taskId: validTaskId,
                  authorId: commentAuthorId,
                  authorName: row.authorName || 'Imported User',
                  body: row.body || row.content || row.text || '',
                  createdAt: row.createdAt ? new Date(row.createdAt) : new Date()
                };
                await storage.createComment(commentData);
                results[entityType].created++;
                break;
              }
            }
          } catch (err: any) {
            const errorMsg = `${entityType} row ${row.id || row.name || 'unknown'}: ${err.message}`;
            results[entityType].errors.push(errorMsg);
            errors.push(errorMsg);
          }
        }
      }

      const totalCreated = Object.values(results).reduce((sum, r) => sum + r.created, 0);
      const totalErrors = errors.length;

      res.json({
        success: totalErrors === 0,
        summary: {
          totalCreated,
          totalErrors,
          byEntity: results
        },
        idMappings,
        errors
      });
    } catch (error: any) {
      console.error("Bulk import error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Full project creation endpoint with detailed results tracking
  app.post("/api/projects/full-create", async (req, res) => {
    const startedAt = new Date().toISOString();
    const entityResults: Array<{
      entityType: string;
      id: string;
      name: string;
      success: boolean;
      error?: string;
      parentId?: string;
    }> = [];
    
    let projectId: string | null = null;
    let projectName = '';
    
    try {
      const payload = req.body;
      projectName = payload.project?.name || 'Untitled Project';
      
      // Debug logging for import flow
      console.log('[FULL-CREATE] Received payload:', {
        projectName: payload.project?.name,
        stagesCount: payload.stages?.length || 0,
        deliverablesCount: payload.deliverables?.length || 0,
        milestonesCount: payload.milestones?.length || 0,
        rolesCount: payload.roles?.length || 0,
        hasImportMetadata: !!payload.importMetadata
      });
      
      if (payload.deliverables?.length > 0) {
        console.log('[FULL-CREATE] Deliverables:', payload.deliverables.map((d: any) => ({
          id: d.id,
          title: d.title,
          epicsCount: d.epics?.length || 0
        })));
      }
      
      if (payload.stages?.length > 0) {
        console.log('[FULL-CREATE] Stages:', payload.stages.map((s: any) => ({
          id: s.id,
          name: s.name,
          tasksCount: s.tasks?.length || 0
        })));
      }
      
      // Track stage ID mappings (wizard ID -> created ID)
      const stageIdMap = new Map<string, string>();
      const createdStages: Array<{ templateId: string; createdStageId: string }> = [];
      
      // 1. Create the project
      const newProjectId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      try {
        const projectData = {
          id: newProjectId,
          name: payload.project.name,
          description: payload.project.description || '',
          status: payload.project.status || 'Upcoming',
          startDate: payload.project.startDate,
          deadline: payload.project.deadline,
          frameworkId: payload.project.frameworkId || null,
          sprintDurationWeeks: payload.project.sprintDurationWeeks || null,
          ownerId: payload.project.ownerId || null,
          client: payload.project.client || null,
          riskLevel: payload.project.riskLevel || null
        };
        
        const project = await storage.createProject(projectData);
        projectId = project.id;
        
        entityResults.push({
          entityType: 'project',
          id: project.id,
          name: project.name,
          success: true
        });
        
        // Auto-generate sprints if configured
        if (project.sprintDurationWeeks && project.sprintDurationWeeks > 0 && project.startDate && project.deadline) {
          const startDate = new Date(project.startDate);
          const endDate = new Date(project.deadline);
          const durationMs = project.sprintDurationWeeks * 7 * 24 * 60 * 60 * 1000;
          const totalMs = endDate.getTime() - startDate.getTime();
          const sprintCount = Math.max(1, Math.ceil(totalMs / durationMs));
          
          for (let i = 0; i < sprintCount; i++) {
            const sprintStart = new Date(startDate.getTime() + (i * durationMs));
            let sprintEnd = new Date(sprintStart.getTime() + durationMs - (24 * 60 * 60 * 1000));
            if (sprintEnd > endDate || i === sprintCount - 1) {
              sprintEnd = endDate;
            }
            
            try {
              await storage.createSprint({
                projectId: project.id,
                name: `Sprint ${i + 1}`,
                goal: null,
                startDate: sprintStart.toISOString().split('T')[0],
                endDate: sprintEnd.toISOString().split('T')[0],
                status: 'Planned',
                capacityHours: null
              });
            } catch (e: any) {
              // Sprint creation is non-critical, log but continue
              console.log(`Sprint ${i + 1} creation failed: ${e.message}`);
            }
          }
        }
      } catch (e: any) {
        entityResults.push({
          entityType: 'project',
          id: newProjectId,
          name: projectName,
          success: false,
          error: e.message
        });
        // Project creation is critical - can't continue without it
        throw new Error(`Failed to create project: ${e.message}`);
      }
      
      // Get validated default task status from App Defaults
      const defaultTaskStatus = await storage.getDefaultStatusByType("task");
      
      // 2. Create stages
      const stages = payload.stages || [];
      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        const newStageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        try {
          const stageData = {
            id: newStageId,
            projectId: projectId!,
            name: stage.name,
            description: stage.description || '',
            order: i,
            type: stage.type || 'standard',
            status: 'pending'
          };
          
          await storage.createProjectStage(stageData);
          stageIdMap.set(stage.id, newStageId);
          createdStages.push({ templateId: stage.id, createdStageId: newStageId });
          
          entityResults.push({
            entityType: 'stage',
            id: newStageId,
            name: stage.name,
            success: true,
            parentId: projectId!
          });
        } catch (e: any) {
          entityResults.push({
            entityType: 'stage',
            id: newStageId,
            name: stage.name || 'Unknown Stage',
            success: false,
            error: e.message,
            parentId: projectId!
          });
        }
      }
      
      // Get all created stage IDs for epics
      const allStageIds = Array.from(stageIdMap.values());
      
      // 3. Create management deliverable and epics
      let projectManagementEpicId: string | null = null;
      let productManagementEpicId: string | null = null;
      
      try {
        const mgmtDeliverableId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await storage.createDeliverable({
          id: mgmtDeliverableId,
          projectId: projectId!,
          title: "Management Activities",
          description: "Project and product management activities",
          status: "Active",
          ownerId: payload.project.ownerId || "1",
          startDate: payload.project.startDate,
          dueDate: payload.project.deadline,
          progress: 0
        } as any);
        
        entityResults.push({
          entityType: 'deliverable',
          id: mgmtDeliverableId,
          name: 'Management Activities',
          success: true,
          parentId: projectId!
        });
        
        // Create PM epic
        const pmEpicId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const pmEpic = await storage.createEpic({
          id: pmEpicId,
          deliverableId: mgmtDeliverableId,
          title: "Project Management",
          description: "Project coordination, reporting, and governance activities",
          status: "Active",
          ownerId: payload.project.ownerId || "1",
          startDate: payload.project.startDate,
          endDate: payload.project.deadline,
          progress: 0,
          stageIds: allStageIds
        } as any);
        projectManagementEpicId = pmEpic.id;
        
        entityResults.push({
          entityType: 'epic',
          id: pmEpicId,
          name: 'Project Management',
          success: true,
          parentId: mgmtDeliverableId
        });
        
        // Create Product Management epic
        const prodEpicId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const prodEpic = await storage.createEpic({
          id: prodEpicId,
          deliverableId: mgmtDeliverableId,
          title: "Product Management",
          description: "Product requirements, acceptance, and delivery activities",
          status: "Active",
          ownerId: payload.project.ownerId || "1",
          startDate: payload.project.startDate,
          endDate: payload.project.deadline,
          progress: 0,
          stageIds: allStageIds
        } as any);
        productManagementEpicId = prodEpic.id;
        
        entityResults.push({
          entityType: 'epic',
          id: prodEpicId,
          name: 'Product Management',
          success: true,
          parentId: mgmtDeliverableId
        });
      } catch (e: any) {
        entityResults.push({
          entityType: 'deliverable',
          id: 'mgmt-deliverable',
          name: 'Management Activities',
          success: false,
          error: e.message,
          parentId: projectId!
        });
      }
      
      // 4. Create business deliverables and epics
      const businessEpics: { id: string; title: string }[] = [];
      const deliverables = payload.deliverables || [];
      
      for (const deliverable of deliverables) {
        const deliverableId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        try {
          const newDeliverable = await storage.createDeliverable({
            id: deliverableId,
            projectId: projectId!,
            title: deliverable.title,
            description: deliverable.description || "",
            status: "Active",
            ownerId: payload.project.ownerId || "1",
            startDate: payload.project.startDate,
            dueDate: payload.project.deadline,
            progress: 0
          } as any);
          
          entityResults.push({
            entityType: 'deliverable',
            id: deliverableId,
            name: deliverable.title,
            success: true,
            parentId: projectId!
          });
          
          // Create epics for this deliverable
          if (deliverable.epics?.length > 0) {
            for (const epic of deliverable.epics) {
              const epicId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              
              try {
                const newEpic = await storage.createEpic({
                  id: epicId,
                  deliverableId: newDeliverable.id,
                  title: epic.title,
                  description: epic.description || "",
                  status: "Active",
                  ownerId: payload.project.ownerId || "1",
                  startDate: payload.project.startDate,
                  endDate: payload.project.deadline,
                  progress: 0,
                  stageIds: allStageIds
                } as any);
                
                businessEpics.push({ id: newEpic.id, title: epic.title });
                
                entityResults.push({
                  entityType: 'epic',
                  id: epicId,
                  name: epic.title,
                  success: true,
                  parentId: deliverableId
                });
              } catch (e: any) {
                entityResults.push({
                  entityType: 'epic',
                  id: epicId,
                  name: epic.title || 'Unknown Epic',
                  success: false,
                  error: e.message,
                  parentId: deliverableId
                });
              }
            }
          }
        } catch (e: any) {
          entityResults.push({
            entityType: 'deliverable',
            id: deliverableId,
            name: deliverable.title || 'Unknown Deliverable',
            success: false,
            error: e.message,
            parentId: projectId!
          });
        }
      }
      
      // Build epic ID mapping for imported tasks (wizard epic ID -> created epic ID)
      const epicIdMap = new Map<string, string>();
      for (const deliverable of deliverables) {
        if (deliverable.epics?.length > 0) {
          for (const epic of deliverable.epics) {
            const createdEpic = businessEpics.find(be => be.title === epic.title);
            if (createdEpic) {
              epicIdMap.set(epic.id, createdEpic.id);
            }
          }
        }
      }
      console.log('[FULL-CREATE] Epic ID mapping:', Object.fromEntries(epicIdMap));
      
      // 5. Create tasks based on stage task templates
      for (const wizardStage of stages) {
        const createdStage = createdStages.find(cs => cs.templateId === wizardStage.id);
        if (!createdStage) continue;
        
        const tasks = wizardStage.tasks || [];
        for (const taskDraft of tasks) {
          // Handle imported tasks with pre-assigned epic (from Task-Epic Alignment)
          if (taskDraft.assignedEpicId && taskDraft.mappingStatus === 'mapped') {
            const resolvedEpicId = epicIdMap.get(taskDraft.assignedEpicId);
            if (resolvedEpicId) {
              const taskId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              const taskDeadline = taskDraft.deadline || wizardStage.endDate || payload.project.deadline;
              try {
                await storage.createTask({
                  id: taskId,
                  project: projectName,
                  projectId: projectId!,
                  title: taskDraft.title,
                  description: taskDraft.description || "",
                  status: await storage.validateAndResolveStatus(taskDraft.status, "task"),
                  priority: taskDraft.priority || "Medium",
                  stageId: createdStage.createdStageId,
                  epicId: resolvedEpicId,
                  effort: 1,
                  deadline: taskDeadline,
                  estimateHours: taskDraft.estimateHours || 0,
                  assigneeId: taskDraft.assigneeId || null,
                  tags: []
                } as any);
                
                entityResults.push({
                  entityType: 'task',
                  id: taskId,
                  name: taskDraft.title,
                  success: true,
                  parentId: createdStage.createdStageId
                });
              } catch (e: any) {
                entityResults.push({
                  entityType: 'task',
                  id: taskId,
                  name: taskDraft.title || 'Unknown Task',
                  success: false,
                  error: e.message,
                  parentId: createdStage.createdStageId
                });
              }
              continue;
            }
          }
          
          if (taskDraft.scope === 'once') {
            if (productManagementEpicId) {
              const taskId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              const taskDeadline = taskDraft.deadline || wizardStage.endDate || payload.project.deadline;
              try {
                await storage.createTask({
                  id: taskId,
                  project: projectName,
                  projectId: projectId!,
                  title: taskDraft.title,
                  description: taskDraft.description || "",
                  status: await storage.validateAndResolveStatus(taskDraft.status, "task"),
                  priority: taskDraft.priority || "Medium",
                  stageId: createdStage.createdStageId,
                  epicId: productManagementEpicId,
                  effort: 1,
                  deadline: taskDeadline,
                  estimateHours: taskDraft.estimateHours || 0,
                  assigneeId: taskDraft.assigneeId || null,
                  tags: []
                } as any);
                
                entityResults.push({
                  entityType: 'task',
                  id: taskId,
                  name: taskDraft.title,
                  success: true,
                  parentId: createdStage.createdStageId
                });
              } catch (e: any) {
                entityResults.push({
                  entityType: 'task',
                  id: taskId,
                  name: taskDraft.title || 'Unknown Task',
                  success: false,
                  error: e.message,
                  parentId: createdStage.createdStageId
                });
              }
            }
          } else if (taskDraft.scope === 'per_epic') {
            const taskDeadline = taskDraft.deadline || wizardStage.endDate || payload.project.deadline;
            
            // If there are business epics, create a task for each one
            if (businessEpics.length > 0) {
              for (const businessEpic of businessEpics) {
                const taskId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                try {
                  await storage.createTask({
                    id: taskId,
                    project: projectName,
                    projectId: projectId!,
                    title: taskDraft.title,
                    description: taskDraft.description || "",
                    status: await storage.validateAndResolveStatus(taskDraft.status, "task"),
                    priority: taskDraft.priority || "Medium",
                    stageId: createdStage.createdStageId,
                    epicId: businessEpic.id,
                    effort: 1,
                    deadline: taskDeadline,
                    estimateHours: taskDraft.estimateHours || 0,
                    assigneeId: taskDraft.assigneeId || null,
                    tags: []
                  } as any);
                  
                  entityResults.push({
                    entityType: 'task',
                    id: taskId,
                    name: `${taskDraft.title} (${businessEpic.title})`,
                    success: true,
                    parentId: createdStage.createdStageId
                  });
                } catch (e: any) {
                  entityResults.push({
                    entityType: 'task',
                    id: taskId,
                    name: `${taskDraft.title} (${businessEpic.title})`,
                    success: false,
                    error: e.message,
                    parentId: createdStage.createdStageId
                  });
                }
              }
            } else if (productManagementEpicId) {
              // FALLBACK: No business epics exist, create task under Product Management epic
              console.log(`[FULL-CREATE] No business epics for per_epic task "${taskDraft.title}", falling back to Product Management epic`);
              const taskId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              try {
                await storage.createTask({
                  id: taskId,
                  project: projectName,
                  projectId: projectId!,
                  title: taskDraft.title,
                  description: taskDraft.description || "",
                  status: await storage.validateAndResolveStatus(taskDraft.status, "task"),
                  priority: taskDraft.priority || "Medium",
                  stageId: createdStage.createdStageId,
                  epicId: productManagementEpicId,
                  effort: 1,
                  deadline: taskDeadline,
                  estimateHours: taskDraft.estimateHours || 0,
                  assigneeId: taskDraft.assigneeId || null,
                  tags: []
                } as any);
                
                entityResults.push({
                  entityType: 'task',
                  id: taskId,
                  name: taskDraft.title,
                  success: true,
                  parentId: createdStage.createdStageId
                });
              } catch (e: any) {
                entityResults.push({
                  entityType: 'task',
                  id: taskId,
                  name: taskDraft.title || 'Unknown Task',
                  success: false,
                  error: e.message,
                  parentId: createdStage.createdStageId
                });
              }
            } else {
              console.log(`[FULL-CREATE] WARNING: Task "${taskDraft.title}" skipped - no epics available`);
            }
          } else {
            // CATCH-ALL: Unknown scope, create under Product Management epic as fallback
            console.log(`[FULL-CREATE] Unknown scope "${taskDraft.scope}" for task "${taskDraft.title}", falling back to Product Management epic`);
            if (productManagementEpicId) {
              const taskId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              const taskDeadline = taskDraft.deadline || wizardStage.endDate || payload.project.deadline;
              try {
                await storage.createTask({
                  id: taskId,
                  project: projectName,
                  projectId: projectId!,
                  title: taskDraft.title,
                  description: taskDraft.description || "",
                  status: await storage.validateAndResolveStatus(taskDraft.status, "task"),
                  priority: taskDraft.priority || "Medium",
                  stageId: createdStage.createdStageId,
                  epicId: productManagementEpicId,
                  effort: 1,
                  deadline: taskDeadline,
                  estimateHours: taskDraft.estimateHours || 0,
                  assigneeId: taskDraft.assigneeId || null,
                  tags: []
                } as any);
                
                entityResults.push({
                  entityType: 'task',
                  id: taskId,
                  name: taskDraft.title,
                  success: true,
                  parentId: createdStage.createdStageId
                });
              } catch (e: any) {
                entityResults.push({
                  entityType: 'task',
                  id: taskId,
                  name: taskDraft.title || 'Unknown Task',
                  success: false,
                  error: e.message,
                  parentId: createdStage.createdStageId
                });
              }
            }
          }
        }
      }
      
      // 6. Create milestones
      const milestones = payload.milestones || [];
      for (const milestone of milestones) {
        const milestoneId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        try {
          const rule = milestone.rule || { scopeType: 'all', completionMode: 'all_tasks', completionTargetPercent: 100 };
          const resolvedStageId = rule.scopeType === 'stage' && rule.scopeEntityId 
            ? stageIdMap.get(rule.scopeEntityId) || null 
            : null;
          
          await storage.createMilestone({
            id: milestoneId,
            projectId: projectId!,
            name: milestone.name,
            description: milestone.description || "",
            phase: milestone.phase || "plan_strategy",
            stageId: resolvedStageId,
            targetDate: milestone.targetDate,
            status: "planned",
            ownerId: milestone.ownerId || payload.project.ownerId || "1",
            scopeType: rule.scopeType,
            completionMode: rule.completionMode,
            completionTargetPercent: rule.completionTargetPercent || 100,
            isBillingGate: milestone.isBillingGate || false,
            tags: []
          } as any);
          
          entityResults.push({
            entityType: 'milestone',
            id: milestoneId,
            name: milestone.name,
            success: true,
            parentId: projectId!
          });
        } catch (e: any) {
          entityResults.push({
            entityType: 'milestone',
            id: milestoneId,
            name: milestone.name || 'Unknown Milestone',
            success: false,
            error: e.message,
            parentId: projectId!
          });
        }
      }
      
      // 7. Note: Roles from wizard are informational only
      // The projectRoles table is for global role definitions, not project-specific roles
      // Role assignment to projects would require a different data model (e.g., project_role_assignments table)
      // For now, we log that roles were provided but don't create them to avoid data inconsistency
      const roles = payload.roles || [];
      if (roles.length > 0) {
        console.log(`Full-create: ${roles.length} roles provided but skipped - projectRoles table is global, not project-specific`);
      }
      
      // Build summary
      const completedAt = new Date().toISOString();
      const succeeded = entityResults.filter(r => r.success).length;
      const failed = entityResults.filter(r => !r.success).length;
      
      const breakdownByType: Record<string, { total: number; succeeded: number; failed: number }> = {};
      for (const result of entityResults) {
        if (!breakdownByType[result.entityType]) {
          breakdownByType[result.entityType] = { total: 0, succeeded: 0, failed: 0 };
        }
        breakdownByType[result.entityType].total++;
        if (result.success) {
          breakdownByType[result.entityType].succeeded++;
        } else {
          breakdownByType[result.entityType].failed++;
        }
      }
      
      const report = {
        projectId,
        projectName,
        overallSuccess: failed === 0,
        startedAt,
        completedAt,
        summary: {
          total: entityResults.length,
          succeeded,
          failed
        },
        entityResults,
        breakdownByType
      };
      
      res.status(201).json(report);
    } catch (error: any) {
      console.error("Full project creation error:", error);
      
      // Return partial results even on failure
      const completedAt = new Date().toISOString();
      const succeeded = entityResults.filter(r => r.success).length;
      const failed = entityResults.filter(r => !r.success).length;
      
      const breakdownByType: Record<string, { total: number; succeeded: number; failed: number }> = {};
      for (const result of entityResults) {
        if (!breakdownByType[result.entityType]) {
          breakdownByType[result.entityType] = { total: 0, succeeded: 0, failed: 0 };
        }
        breakdownByType[result.entityType].total++;
        if (result.success) {
          breakdownByType[result.entityType].succeeded++;
        } else {
          breakdownByType[result.entityType].failed++;
        }
      }
      
      res.status(500).json({
        projectId,
        projectName,
        overallSuccess: false,
        startedAt,
        completedAt,
        summary: {
          total: entityResults.length,
          succeeded,
          failed
        },
        entityResults,
        breakdownByType,
        fatalError: error.message
      });
    }
  });

  // Schedule Sync Endpoints
  const { scheduleSyncService } = await import("../services/schedule-sync-service");
  
  app.post("/api/schedule-sync/evaluate", async (req, res) => {
    try {
      const { entityType, entityId, proposedDates, userId } = req.body;
      
      if (!entityType || !entityId || !proposedDates) {
        return res.status(400).json({ error: "entityType, entityId, and proposedDates are required" });
      }
      
      const changePlan = await scheduleSyncService.evaluate({
        entityType,
        entityId,
        proposedDates,
        userId: userId || undefined
      });
      
      res.json(changePlan);
    } catch (error: any) {
      console.error("Schedule sync evaluate error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/schedule-sync/apply", async (req, res) => {
    try {
      const { action, changePlan, overrideReason, userId } = req.body;
      
      if (!action || !changePlan) {
        return res.status(400).json({ error: "action and changePlan are required" });
      }
      
      const result = await scheduleSyncService.apply({
        action,
        changePlan,
        overrideReason,
        userId: userId || undefined
      });
      
      res.json(result);
    } catch (error: any) {
      console.error("Schedule sync apply error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/schedule-sync/overridden", async (req, res) => {
    try {
      const projectId = req.query.projectId as string | undefined;
      const result = await scheduleSyncService.getOverriddenEntities(projectId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/schedule-sync/bulk-resolve", async (req, res) => {
    try {
      const { entityType, entityIds, userId } = req.body;
      
      if (!entityType || !entityIds || !Array.isArray(entityIds)) {
        return res.status(400).json({ error: "entityType and entityIds array are required" });
      }
      
      const resolved = await scheduleSyncService.bulkResolveOverrides(entityType, entityIds, userId || undefined);
      res.json({ resolved });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // SQL Export Endpoint - generates INSERT statements for all data
  app.get("/api/export/sql", async (req, res) => {
    try {
      const escapeValue = (val: any): string => {
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
        if (typeof val === 'number') return String(val);
        if (val instanceof Date) return `'${val.toISOString()}'`;
        if (Array.isArray(val)) {
          const escaped = val.map(v => typeof v === 'string' ? v.replace(/'/g, "''") : v);
          return `ARRAY[${escaped.map(v => typeof v === 'string' ? `'${v}'` : v).join(', ')}]`;
        }
        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
        return `'${String(val).replace(/'/g, "''")}'`;
      };

      const generateInserts = (tableName: string, rows: any[]): string => {
        if (!rows || rows.length === 0) return '';
        const columns = Object.keys(rows[0]);
        const lines = rows.map(row => {
          const values = columns.map(col => escapeValue(row[col]));
          return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
        });
        return `-- ${tableName} (${rows.length} rows)\n${lines.join('\n')}\n`;
      };

      const sqlParts: string[] = [];
      sqlParts.push('-- Nexus Database Export');
      sqlParts.push(`-- Generated: ${new Date().toISOString()}`);
      sqlParts.push('-- Run these statements in your production database\n');

      // Order matters for foreign key constraints
      const tableConfigs = [
        { name: 'users', getData: () => storage.getUsers() },
        { name: 'user_identities', getData: () => storage.getUserIdentities() },
        { name: 'user_preferences', getData: () => storage.getAllUserPreferences() },
        { name: 'status_options', getData: () => storage.getStatusOptions() },
        { name: 'role_types', getData: () => storage.getRoleTypes() },
        { name: 'task_types', getData: () => storage.getTaskTypes() },
        { name: 'epic_types', getData: () => storage.getEpicTypes() },
        { name: 'deliverable_types', getData: () => storage.getDeliverableTypes() },
        { name: 'framework_templates', getData: () => storage.getFrameworkTemplates() },
        { name: 'stage_templates', getData: () => storage.getStageTemplates() },
        { name: 'deliverable_templates', getData: () => storage.getDeliverableTemplates() },
        { name: 'epic_templates', getData: () => storage.getEpicTemplates() },
        { name: 'task_templates', getData: () => storage.getTaskTemplates() },
        { name: 'milestone_templates', getData: () => storage.getMilestoneTemplates() },
        { name: 'role_templates', getData: () => storage.getRoleTemplates() },
        { name: 'project_templates', getData: () => storage.getProjectTemplates() },
        { name: 'template_snippets', getData: () => storage.getTemplateSnippets() },
        { name: 'mapping_templates', getData: () => storage.getMappingTemplates() },
        { name: 'projects', getData: () => storage.getProjects() },
        { name: 'project_favorites', getData: () => storage.getAllProjectFavorites() },
        { name: 'project_stages', getData: () => storage.getProjectStages() },
        { name: 'project_task_types', getData: () => storage.getProjectTaskTypes() },
        { name: 'deliverables', getData: () => storage.getDeliverables() },
        { name: 'epics', getData: () => storage.getEpics() },
        { name: 'milestones', getData: () => storage.getMilestones() },
        { name: 'sprints', getData: () => storage.getSprints() },
        { name: 'sprint_scope_targets', getData: () => storage.getSprintScopeTargets() },
        { name: 'tasks', getData: () => storage.getTasks() },
        { name: 'task_dependencies', getData: () => storage.getTaskDependencies() },
        { name: 'activity', getData: () => storage.getActivity() },
        { name: 'project_roles', getData: () => storage.getProjectRoles() },
        { name: 'role_assignments', getData: () => storage.getRoleAssignments() },
        { name: 'user_role_eligibility', getData: () => storage.getUserRoleEligibility() },
        { name: 'saved_views', getData: () => storage.getSavedViews() },
        { name: 'guidance_items', getData: () => storage.getGuidanceItems() },
        { name: 'work_blocks', getData: () => storage.getAllWorkBlocks() },
        { name: 'day_plans', getData: () => storage.getAllDayPlans() },
        { name: 'sprint_pulse_updates', getData: () => storage.getSprintPulseUpdates() },
        { name: 'sprint_scope_events', getData: () => storage.getSprintScopeEvents() }
      ];

      for (const config of tableConfigs) {
        try {
          const data = await config.getData();
          if (data && data.length > 0) {
            sqlParts.push(generateInserts(config.name, data));
          }
        } catch (err) {
          // Skip tables that don't have getters
          console.log(`Skipping ${config.name}: getter not available`);
        }
      }

      const sql = sqlParts.join('\n');
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename=nexus_export_${new Date().toISOString().split('T')[0]}.sql`);
      res.send(sql);
    } catch (error: any) {
      console.error("SQL export error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
