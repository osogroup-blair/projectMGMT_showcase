import type { Express } from "express";
import { storage } from "../../data/storage";
import { db } from "../../db";
import { 
  insertActivitySchema,
  insertCommentSchema,
  insertAttachmentSchema,
  insertHistorySchema,
  insertProjectRoleSchema,
  insertRoleAssignmentSchema,
  insertSavedViewSchema,
  insertGuidanceItemSchema,
  insertProjectStageSchema,
  insertUserPreferencesSchema,
  insertWorkBlockSchema,
  insertDayPlanSchema,
  insertTaskDependencySchema,
  insertTaskSchema,
} from "@shared/schema";
import { fullProjectCreatePayloadSchema, type EntityType, type UnresolvedAssigneeWarning } from "@shared/creation-result-types";

interface UserMappingEntry {
  sourceId: string;
  sourceName?: string;
  sourceEmail?: string;
  mappedToId?: string;
  mappedToName?: string;
  confidence: 'high' | 'medium' | 'low' | 'unmapped';
  action: 'map' | 'create' | 'skip' | 'unassigned';
}

interface AssigneeResolutionResult {
  resolvedAssigneeId: string | null;
  warning?: UnresolvedAssigneeWarning;
}

async function validateAndResolveAssignees(
  tasks: Array<{ id: string; title: string; assigneeId?: string | null }>,
  userMappings: UserMappingEntry[] | undefined,
  storage: any
): Promise<{
  resolvedTasks: Map<string, string | null>;
  warnings: UnresolvedAssigneeWarning[];
  validUserIds: Set<string>;
}> {
  const resolvedTasks = new Map<string, string | null>();
  const warnings: UnresolvedAssigneeWarning[] = [];
  const validUserIds = new Set<string>();
  const userExistenceCache = new Map<string, boolean>();
  
  const userMappingsBySourceId = new Map<string, UserMappingEntry>();
  if (userMappings) {
    for (const mapping of userMappings) {
      userMappingsBySourceId.set(mapping.sourceId, mapping);
    }
  }
  
  async function checkUserExists(userId: string): Promise<boolean> {
    if (userExistenceCache.has(userId)) {
      return userExistenceCache.get(userId)!;
    }
    try {
      const user = await storage.getUserById(userId);
      const exists = !!user;
      userExistenceCache.set(userId, exists);
      return exists;
    } catch {
      userExistenceCache.set(userId, false);
      return false;
    }
  }
  
  for (const task of tasks) {
    if (!task.assigneeId) {
      resolvedTasks.set(task.id, null);
      continue;
    }
    
    let finalAssigneeId: string | null = task.assigneeId;
    let warningReason: 'not_found' | 'not_mapped' | 'skipped' | 'invalid' | null = null;
    
    const mapping = userMappingsBySourceId.get(task.assigneeId);
    
    if (mapping) {
      switch (mapping.action) {
        case 'map':
          if (mapping.mappedToId) {
            const mappedUserExists = await checkUserExists(mapping.mappedToId);
            if (mappedUserExists) {
              finalAssigneeId = mapping.mappedToId;
              validUserIds.add(finalAssigneeId);
            } else {
              warningReason = 'not_found';
              finalAssigneeId = null;
            }
          } else {
            warningReason = 'not_mapped';
            finalAssigneeId = null;
          }
          break;
          
        case 'skip':
        case 'unassigned':
          warningReason = 'skipped';
          finalAssigneeId = null;
          break;
          
        case 'create':
          warningReason = 'not_found';
          finalAssigneeId = null;
          break;
      }
    } else {
      const userExists = await checkUserExists(task.assigneeId);
      if (userExists) {
        validUserIds.add(task.assigneeId);
      } else {
        warningReason = 'not_found';
        finalAssigneeId = null;
      }
    }
    
    resolvedTasks.set(task.id, finalAssigneeId);
    
    if (warningReason) {
      warnings.push({
        taskId: task.id,
        taskTitle: task.title,
        originalAssigneeId: task.assigneeId,
        reason: warningReason,
        resolution: finalAssigneeId ? 'kept_original' : 'cleared'
      });
    }
  }
  
  return { resolvedTasks, warnings, validUserIds };
}

export function registerImportExportRoutes(
  app: Express,
  getAuthUserId: (req: any) => string | null
): void {
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

  // Project Team Members (global - for team size aggregation)
  app.get("/api/projectTeamMembers", async (req, res) => {
    const members = await storage.getAllProjectTeamMembers();
    res.json(members);
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

  app.patch("/api/tasks/:taskId/dependencies/:id", async (req, res) => {
    try {
      const dependency = await storage.updateTaskDependency(req.params.id, req.body);
      res.json(dependency);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/tasks/:taskId/dependencies/:id", async (req, res) => {
    await storage.deleteTaskDependency(req.params.id);
    res.status(204).send();
  });

  // Task Dependency Scope Rules
  app.get("/api/taskDependencyScopeRules", async (req, res) => {
    const rules = await storage.getTaskDependencyScopeRules();
    res.json(rules);
  });

  app.get("/api/tasks/:taskId/dependencyScopeRules", async (req, res) => {
    const rules = await storage.getTaskDependencyScopeRulesByTaskId(req.params.taskId);
    res.json(rules);
  });

  app.post("/api/taskDependencyScopeRules", async (req, res) => {
    try {
      const rule = await storage.createTaskDependencyScopeRule(req.body);
      res.status(201).json(rule);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/taskDependencyScopeRules/:id", async (req, res) => {
    try {
      const rule = await storage.updateTaskDependencyScopeRule(req.params.id, req.body);
      res.json(rule);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/taskDependencyScopeRules/:id", async (req, res) => {
    await storage.deleteTaskDependencyScopeRule(req.params.id);
    res.status(204).send();
  });

  // Subtasks
  app.get("/api/tasks/:taskId/subtasks", async (req, res) => {
    const subtasks = await storage.getSubtasksByParentId(req.params.taskId);
    res.json(subtasks);
  });

  app.post("/api/tasks/:taskId/subtasks", async (req, res) => {
    try {
      const parentTaskId = req.params.taskId;
      
      // Get parent task to inherit values
      const parentTask = await storage.getTaskById(parentTaskId);
      if (!parentTask) {
        return res.status(404).json({ error: "Parent task not found" });
      }
      
      const projectId = req.body.projectId || parentTask.projectId;
      
      // Determine task type - try to inherit, otherwise get project default
      let taskTypeId = req.body.taskTypeId || parentTask.taskTypeId;
      if (!taskTypeId && projectId) {
        const taskTypes = await storage.getProjectTaskTypesByProjectId(projectId);
        taskTypeId = taskTypes.length > 0 ? taskTypes[0].id : null;
      }
      
      // Build subtask data, inheriting from parent where needed
      const subtaskData = {
        ...req.body,
        parentTaskId,
        // Inherit project from parent if not provided
        project: req.body.project || parentTask.project,
        projectId: projectId,
        // Make deadline optional, inherit from parent if not provided
        deadline: req.body.deadline || parentTask.deadline || null,
        // Inherit epicId, stageId from parent if not provided
        epicId: req.body.epicId || parentTask.epicId,
        stageId: req.body.stageId || parentTask.stageId,
        taskTypeId: taskTypeId,
      };
      
      // Validate with schema
      const validated = insertTaskSchema.parse(subtaskData);
      
      // Server-side validation: Epic is required, Stage and TaskType are optional
      if (!validated.epicId) {
        return res.status(400).json({ error: "Epic is required for subtask creation" });
      }
      
      const subtask = await storage.createTask(validated);
      res.status(201).json(subtask);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
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
        const deadline = parseDate(task.deadline);
        if (!deadline) return false;
        const daysUntilDue = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Overdue
        if (daysUntilDue < 0) return true;
        // Due soon but not started
        if (daysUntilDue <= 3 && task.status === 'Todo') return true;
        // Blocked
        if (task.blocked) return true;
        
        return false;
      };

      // TODAY - Focus items
      const todayTasks = allTasks.filter(t => {
        const deadline = parseDate(t.deadline);
        if (!deadline) return false;
        return deadline.toDateString() === startOfToday.toDateString();
      });

      const overdueTasks = allTasks.filter(t => {
        const deadline = parseDate(t.deadline);
        if (!deadline) return false;
        return deadline < startOfToday && !['Complete', 'Done', 'Closed'].includes(t.status || '');
      });

      const blockedTasks = allTasks.filter(t => t.blocked);

      // THIS WEEK
      const thisWeekTasks = allTasks.filter(t => {
        const deadline = parseDate(t.deadline);
        if (!deadline) return false;
        return deadline >= thisWeekStart && deadline <= thisWeekEnd;
      });

      const thisWeekMilestones = allMilestones.filter(m => {
        const targetDate = parseDate(m.targetDate);
        if (!targetDate) return false;
        return targetDate >= thisWeekStart && targetDate <= thisWeekEnd;
      });

      // NEXT WEEK
      const nextWeekTasks = allTasks.filter(t => {
        const deadline = parseDate(t.deadline);
        if (!deadline) return false;
        return deadline >= nextWeekStart && deadline <= nextWeekEnd;
      });

      const nextWeekMilestones = allMilestones.filter(m => {
        const targetDate = parseDate(m.targetDate);
        if (!targetDate) return false;
        return targetDate >= nextWeekStart && targetDate <= nextWeekEnd;
      });

      // Capacity preview for next week
      const notStartedNextWeek = nextWeekTasks.filter(t => t.status === 'Todo').length;
      const capacityLevel = notStartedNextWeek > 10 ? 'heavy' : notStartedNextWeek > 5 ? 'moderate' : 'light';

      // FUTURE - Trajectory
      const futureMilestones = allMilestones.filter(m => {
        const targetDate = parseDate(m.targetDate);
        if (!targetDate) return false;
        return targetDate > nextWeekEnd && targetDate <= futureEndDate;
      });

      // Stage progress
      const stageProgress = allStages.map(stage => {
        const stageTasks = allTasks.filter(t => t.stageId === stage.id);
        const completedTasks = stageTasks.filter(t => ['Complete', 'Done', 'Closed'].includes(t.status || ''));
        return {
          stageId: stage.id,
          stageName: stage.name,
          projectId: stage.projectId,
          projectName: allProjects.find(p => p.id === stage.projectId)?.name,
          totalTasks: stageTasks.length,
          completedTasks: completedTasks.length,
          progress: stageTasks.length > 0 ? Math.round((completedTasks.length / stageTasks.length) * 100) : 0
        };
      });

      // Long-running tasks (tasks that have been in progress for > 7 days without progress)
      const longRunningTasks = allTasks.filter(t => {
        if (t.status !== 'In Progress') return false;
        // This would ideally check task history, but we'll use a simpler heuristic
        const deadline = parseDate(t.deadline);
        if (!deadline) return false;
        const daysUntilDue = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilDue < 3; // In progress but due very soon
      });

      // Milestone confidence calculation
      const getMilestoneConfidence = (milestone: typeof allMilestones[0]): 'on_track' | 'at_risk' | 'behind' => {
        const targetDate = parseDate(milestone.targetDate);
        if (!targetDate) return 'at_risk';
        
        const daysUntilDue = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const progress = milestone.progressPercentComplete || 0;
        
        // Behind if overdue or very low progress with deadline approaching
        if (daysUntilDue < 0 && progress < 100) return 'behind';
        if (daysUntilDue <= 7 && progress < 50) return 'behind';
        if (daysUntilDue <= 14 && progress < 30) return 'at_risk';
        
        return 'on_track';
      };

      // Group tasks by project with focus items
      const projectFocus = allProjects.map(project => {
        const projectTasks = allTasks.filter(t => t.projectId === project.id);
        const focusTasks = projectTasks
          .filter(t => !['Complete', 'Done', 'Closed'].includes(t.status || ''))
          .map(t => ({ ...t, priorityScore: calculatePriorityScore(t), atRisk: isAtRisk(t) }))
          .sort((a, b) => b.priorityScore - a.priorityScore)
          .slice(0, 3);
        
        const blockedCount = projectTasks.filter(t => t.blocked).length;
        const overdueCount = projectTasks.filter(t => {
          const deadline = parseDate(t.deadline);
          return deadline && deadline < startOfToday && !['Complete', 'Done', 'Closed'].includes(t.status || '');
        }).length;

        return {
          projectId: project.id,
          projectName: project.name,
          status: project.status,
          blockedCount,
          overdueCount,
          health: overdueCount > 3 || blockedCount > 2 ? 'critical' : 
                  overdueCount > 0 || blockedCount > 0 ? 'warning' : 'healthy',
          nextMilestone: allMilestones
            .filter(m => m.projectId === project.id)
            .filter(m => {
              const targetDate = parseDate(m.targetDate);
              return targetDate && targetDate >= startOfToday;
            })
            .sort((a, b) => {
              const dateA = parseDate(a.targetDate);
              const dateB = parseDate(b.targetDate);
              return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
            })[0] || null,
          tasks: focusTasks
        };
      }).filter(p => p.tasks.length > 0 || p.blockedCount > 0 || p.overdueCount > 0);

      const response = {
        generatedAt: now.toISOString(),
        range,
        filters: { projectIds, assigneeScope, userId },
        today: {
          dueTasks: todayTasks.map(t => ({
            id: t.id,
            title: t.title,
            projectId: t.projectId,
            projectName: allProjects.find(p => p.id === t.projectId)?.name,
            status: t.status,
            priority: t.priority,
            assigneeId: t.assigneeId
          })),
          overdueTasks: overdueTasks.map(t => ({
            id: t.id,
            title: t.title,
            projectId: t.projectId,
            projectName: allProjects.find(p => p.id === t.projectId)?.name,
            deadline: t.deadline,
            daysOverdue: Math.ceil((startOfToday.getTime() - new Date(t.deadline!).getTime()) / (1000 * 60 * 60 * 24))
          })),
          blockedTasks: blockedTasks.map(t => ({
            id: t.id,
            title: t.title,
            projectId: t.projectId,
            projectName: allProjects.find(p => p.id === t.projectId)?.name,
            blockerReason: t.blockerReason
          })),
          counts: {
            dueToday: todayTasks.length,
            overdue: overdueTasks.length,
            blocked: blockedTasks.length,
            inProgress: allTasks.filter(t => t.status === 'In Progress').length
          }
        },
        thisWeek: {
          milestones: thisWeekMilestones.map(m => ({
            id: m.id,
            name: m.name,
            projectId: m.projectId,
            projectName: allProjects.find(p => p.id === m.projectId)?.name,
            targetDate: m.targetDate,
            status: m.status,
            confidence: getMilestoneConfidence(m)
          })),
          projectFocus: projectFocus.map(f => ({
            projectId: f.projectId,
            projectName: f.projectName,
            health: f.health,
            blockedCount: f.blockedCount,
            overdueCount: f.overdueCount,
            nextMilestone: f.nextMilestone ? {
              id: f.nextMilestone.id,
              name: f.nextMilestone.name,
              targetDate: f.nextMilestone.targetDate
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
      entityType: EntityType;
      id: string;
      name: string;
      success: boolean;
      error?: string;
      parentId?: string;
    }> = [];
    
    let projectId: string | null = null;
    let projectName = '';
    
    // Validate payload with Zod schema
    const validationResult = fullProjectCreatePayloadSchema.safeParse(req.body);
    if (!validationResult.success) {
      const validationErrors = validationResult.error.errors.map(e => 
        `${e.path.join('.')}: ${e.message}`
      );
      console.error('[FULL-CREATE] Validation failed:', validationErrors);
      return res.status(400).json({
        success: false,
        error: 'Invalid payload',
        validationErrors,
        projectId: null,
        projectName: req.body?.project?.name || 'Unknown',
        startedAt,
        completedAt: new Date().toISOString()
      });
    }
    
    const payload = validationResult.data;
    
    try {
      projectName = payload.project.name;
      
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
      
      // Track sprint ID mappings (payload sprint ID -> created sprint ID)
      const sprintIdMap = new Map<string, string>();
      
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
        
        // Create sprints from payload (imported sprints) instead of auto-generating
        const payloadSprints = payload.sprints || [];
        if (payloadSprints.length > 0) {
          console.log(`[FULL-CREATE] Creating ${payloadSprints.length} imported sprints`);
          for (const sprint of payloadSprints) {
            try {
              const createdSprint = await storage.createSprint({
                projectId: project.id,
                name: sprint.name,
                goal: sprint.goal || null,
                startDate: sprint.startDate,
                endDate: sprint.endDate,
                status: sprint.status || 'Planned',
                capacityHours: sprint.capacityHours || null
              });
              
              // Map payload sprint ID to created sprint ID for task linkage
              if (sprint.id) {
                sprintIdMap.set(sprint.id, createdSprint.id);
              }
              console.log(`[FULL-CREATE] Created sprint: ${sprint.name} (${sprint.id} -> ${createdSprint.id})`);
              
              entityResults.push({
                entityType: 'sprint',
                id: createdSprint.id,
                name: sprint.name,
                success: true,
                parentId: project.id
              });
            } catch (e: any) {
              console.log(`Sprint "${sprint.name}" creation failed: ${e.message}`);
              entityResults.push({
                entityType: 'sprint',
                id: sprint.id || 'unknown',
                name: sprint.name,
                success: false,
                error: e.message,
                parentId: project.id
              });
            }
          }
        } else {
          console.log(`[FULL-CREATE] No sprints in payload - skipping sprint creation`);
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
      
      // 2. Create team members with high-level and execution roles (BEFORE stages so assignees exist)
      // First, collect all tasks to validate and resolve their assignee IDs
      const allTasksForValidation: Array<{ id: string; title: string; assigneeId?: string | null }> = [];
      
      (payload.stages || []).forEach((stage: any) => {
        (stage.tasks || []).forEach((task: any) => {
          allTasksForValidation.push({
            id: task.id,
            title: task.title,
            assigneeId: task.assigneeId || null
          });
        });
      });
      (payload.deliverables || []).forEach((del: any) => {
        (del.epics || []).forEach((epic: any) => {
          (epic.tasks || []).forEach((task: any) => {
            allTasksForValidation.push({
              id: task.id,
              title: task.title,
              assigneeId: task.assigneeId || null
            });
          });
        });
      });
      
      // Validate and resolve all assignee IDs using userMappings
      const { resolvedTasks, warnings: assigneeWarnings, validUserIds } = await validateAndResolveAssignees(
        allTasksForValidation,
        payload.userMappings,
        storage
      );
      
      // Track unresolved assignee warnings
      const unresolvedAssignees: UnresolvedAssigneeWarning[] = assigneeWarnings;
      
      if (assigneeWarnings.length > 0) {
        console.log(`[FULL-CREATE] ${assigneeWarnings.length} unresolved assignees found:`, 
          assigneeWarnings.map(w => `${w.taskTitle}: ${w.originalAssigneeId} (${w.reason})`));
      }
      
      // Merge validated task assignees with roles - add any missing as 'member' roles
      const roles = payload.roles || [];
      const rolesUserIds = new Set(roles.filter((r: any) => r.userId).map((r: any) => r.userId));
      
      // De-duplicate by userId before creating team members
      const userIdsToAdd = new Set<string>();
      validUserIds.forEach(assigneeId => {
        if (!rolesUserIds.has(assigneeId) && !userIdsToAdd.has(assigneeId)) {
          userIdsToAdd.add(assigneeId);
        }
      });
      
      userIdsToAdd.forEach(assigneeId => {
        roles.push({
          id: `role-auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          roleType: 'member',
          roleTypeId: null,
          userId: assigneeId,
          allocation: 100
        });
        console.log(`[FULL-CREATE] Auto-adding validated task assignee ${assigneeId} as team member`);
      });
      
      const addedUserIds = new Set<string>();
      const teamMemberMap = new Map<string, string>(); // userId -> teamMemberId
      
      if (roles.length > 0) {
        console.log(`[FULL-CREATE] Creating ${roles.length} team members with roles`);
        
        for (const role of roles) {
          if (!role.userId) continue;
          
          try {
            let teamMemberId: string;
            
            // Check if user is already a team member
            if (addedUserIds.has(role.userId)) {
              // Find existing team member
              const existingMembers = await storage.getProjectTeamMembers(projectId!);
              const existing = existingMembers.find(m => m.userId === role.userId);
              if (existing) {
                teamMemberId = existing.id;
              } else {
                continue;
              }
            } else {
              // Create new team member
              const newTeamMember = await storage.createProjectTeamMember({
                projectId: projectId!,
                userId: role.userId,
                allocationPercent: role.allocation || 100
              });
              teamMemberId = newTeamMember.id;
              addedUserIds.add(role.userId);
              teamMemberMap.set(role.userId, teamMemberId);
              
              entityResults.push({
                entityType: 'team_member',
                id: teamMemberId,
                name: `Team Member (${role.roleType || 'member'})`,
                success: true,
                parentId: projectId!
              });
            }
            
            // Add high-level role if it's a project role (owner, manager, stakeholder, member)
            const highLevelRoleTypes = ['owner', 'manager', 'stakeholder', 'member'];
            if (highLevelRoleTypes.includes(role.roleType?.toLowerCase())) {
              await storage.createHighLevelRole({
                teamMemberId,
                roleType: role.roleType.toLowerCase()
              });
              
              // If owner, also update project.ownerId
              if (role.roleType.toLowerCase() === 'owner') {
                await storage.updateProject(projectId!, { ownerId: role.userId });
              }
            }
            
            // Add execution role assignment if roleTypeId is provided
            if (role.roleTypeId && !highLevelRoleTypes.includes(role.roleType?.toLowerCase())) {
              await storage.createExecutionRoleAssignment({
                teamMemberId,
                roleId: role.roleTypeId
              });
            }
          } catch (e: any) {
            console.error(`[FULL-CREATE] Error creating team member for role:`, e.message);
            entityResults.push({
              entityType: 'team_member',
              id: 'error',
              name: `Team Member (${role.roleType || 'unknown'})`,
              success: false,
              error: e.message,
              parentId: projectId!
            });
          }
        }
      }
      
      // 3. Create stages
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
      
      // 4. Create milestones (BEFORE deliverables/epics/tasks)
      const milestones = payload.milestones || [];
      const milestoneIdMap = new Map<string, string>(); // wizard ID -> created ID
      
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
          
          // Track milestone ID mapping
          if (milestone.id) {
            milestoneIdMap.set(milestone.id, milestoneId);
          }
          
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
      
      // 5. Create management deliverable and epics (auto-created)
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
        
        // Create Client Management epic
        const clientEpicId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await storage.createEpic({
          id: clientEpicId,
          deliverableId: mgmtDeliverableId,
          title: "Client Management",
          description: "Client communication, stakeholder management, and relationship activities",
          status: "Active",
          ownerId: payload.project.ownerId || "1",
          startDate: payload.project.startDate,
          endDate: payload.project.deadline,
          progress: 0,
          stageIds: allStageIds
        } as any);
        
        entityResults.push({
          entityType: 'epic',
          id: clientEpicId,
          name: 'Client Management',
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
      
      // 6. Create business deliverables and epics
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
                
                // Create tasks directly defined on this epic (from Work Breakdown step)
                if (epic.tasks?.length > 0) {
                  console.log(`[FULL-CREATE] Creating ${epic.tasks.length} tasks for epic "${epic.title}"`);
                  for (const epicTask of epic.tasks) {
                    const epicTaskId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    try {
                      const resolvedStageId = epicTask.stageId ? stageIdMap.get(epicTask.stageId) || null : null;
                      // Resolve milestone ID if provided
                      const resolvedMilestoneId = epicTask.milestoneId 
                        ? milestoneIdMap.get(epicTask.milestoneId) || epicTask.milestoneId 
                        : null;
                      // Resolve sprint ID from payload ID to created ID
                      const resolvedSprintId = epicTask.sprintId 
                        ? sprintIdMap.get(epicTask.sprintId) || epicTask.sprintId 
                        : null;
                      // Resolve assignee ID using validated user mappings
                      const resolvedAssigneeId = resolvedTasks.get(epicTask.id) ?? null;
                      await storage.createTask({
                        id: epicTaskId,
                        project: projectName,
                        projectId: projectId!,
                        title: epicTask.title,
                        description: epicTask.description || "",
                        status: await storage.validateAndResolveStatus(epicTask.status, "task"),
                        priority: epicTask.priority || "Medium",
                        stageId: resolvedStageId,
                        epicId: newEpic.id,
                        milestoneId: resolvedMilestoneId,
                        sprintId: resolvedSprintId,
                        effort: 1,
                        deadline: payload.project.deadline,
                        estimateHours: epicTask.estimateHours || 0,
                        assigneeId: resolvedAssigneeId,
                        taskTypeId: epicTask.taskTypeId || null,
                        tags: epicTask.tags || []
                      } as any);
                      
                      entityResults.push({
                        entityType: 'task',
                        id: epicTaskId,
                        name: epicTask.title,
                        success: true,
                        parentId: newEpic.id
                      });
                    } catch (taskErr: any) {
                      entityResults.push({
                        entityType: 'task',
                        id: epicTaskId,
                        name: epicTask.title || 'Unknown Epic Task',
                        success: false,
                        error: taskErr.message,
                        parentId: newEpic.id
                      });
                    }
                  }
                }
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
      
      // 7. Create tasks based on stage task templates
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
                // Resolve milestone ID if provided
                const resolvedMilestoneId = taskDraft.milestoneId 
                  ? milestoneIdMap.get(taskDraft.milestoneId) || taskDraft.milestoneId 
                  : null;
                
                // Resolve sprint ID from payload ID to created ID
                const resolvedSprintId = taskDraft.sprintId 
                  ? sprintIdMap.get(taskDraft.sprintId) || taskDraft.sprintId 
                  : null;
                
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
                  milestoneId: resolvedMilestoneId,
                  sprintId: resolvedSprintId,
                  effort: 1,
                  deadline: taskDeadline,
                  estimateHours: taskDraft.estimateHours || 0,
                  assigneeId: resolvedTasks.get(taskDraft.id) ?? null,
                  taskTypeId: taskDraft.taskTypeId || null,
                  tags: taskDraft.tags || []
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
              const resolvedMilestoneId = taskDraft.milestoneId 
                ? milestoneIdMap.get(taskDraft.milestoneId) || taskDraft.milestoneId 
                : null;
              const resolvedSprintId = taskDraft.sprintId 
                ? sprintIdMap.get(taskDraft.sprintId) || taskDraft.sprintId 
                : null;
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
                  milestoneId: resolvedMilestoneId,
                  sprintId: resolvedSprintId,
                  effort: 1,
                  deadline: taskDeadline,
                  estimateHours: taskDraft.estimateHours || 0,
                  assigneeId: resolvedTasks.get(taskDraft.id) ?? null,
                  taskTypeId: taskDraft.taskTypeId || null,
                  tags: taskDraft.tags || []
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
            const resolvedMilestoneId = taskDraft.milestoneId 
              ? milestoneIdMap.get(taskDraft.milestoneId) || taskDraft.milestoneId 
              : null;
            const resolvedSprintId = taskDraft.sprintId 
              ? sprintIdMap.get(taskDraft.sprintId) || taskDraft.sprintId 
              : null;
            
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
                    milestoneId: resolvedMilestoneId,
                    sprintId: resolvedSprintId,
                    effort: 1,
                    deadline: taskDeadline,
                    estimateHours: taskDraft.estimateHours || 0,
                    assigneeId: resolvedTasks.get(taskDraft.id) ?? null,
                    taskTypeId: taskDraft.taskTypeId || null,
                    tags: taskDraft.tags || []
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
                  milestoneId: resolvedMilestoneId,
                  sprintId: resolvedSprintId,
                  effort: 1,
                  deadline: taskDeadline,
                  estimateHours: taskDraft.estimateHours || 0,
                  assigneeId: resolvedTasks.get(taskDraft.id) ?? null,
                  taskTypeId: taskDraft.taskTypeId || null,
                  tags: taskDraft.tags || []
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
              const resolvedMilestoneId = taskDraft.milestoneId 
                ? milestoneIdMap.get(taskDraft.milestoneId) || taskDraft.milestoneId 
                : null;
              const resolvedSprintId = taskDraft.sprintId 
                ? sprintIdMap.get(taskDraft.sprintId) || taskDraft.sprintId 
                : null;
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
                  milestoneId: resolvedMilestoneId,
                  sprintId: resolvedSprintId,
                  effort: 1,
                  deadline: taskDeadline,
                  estimateHours: taskDraft.estimateHours || 0,
                  assigneeId: resolvedTasks.get(taskDraft.id) ?? null,
                  taskTypeId: taskDraft.taskTypeId || null,
                  tags: taskDraft.tags || []
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
        breakdownByType,
        unresolvedAssignees: unresolvedAssignees.length > 0 ? unresolvedAssignees : undefined
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
        unresolvedAssignees: unresolvedAssignees.length > 0 ? unresolvedAssignees : undefined,
        fatalError: error.message
      });
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

      const camelToSnake = (str: string): string => {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      };

      const generateInserts = (tableName: string, rows: any[]): string => {
        if (!rows || rows.length === 0) return '';
        const columns = Object.keys(rows[0]);
        const snakeColumns = columns.map(camelToSnake);
        const lines = rows.map(row => {
          const values = columns.map(col => escapeValue(row[col]));
          return `INSERT INTO "${tableName}" ("${snakeColumns.join('", "')}") VALUES (${values.join(', ')});`;
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
}
