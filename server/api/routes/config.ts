import type { Express } from "express";
import { storage } from "../../data/storage";
import { 
  insertStatusOptionSchema,
  insertRoleTypeSchema,
  insertTaskTypeSchema,
  insertProjectTaskTypeSchema,
  insertProjectTaskStatusSchema,
  insertEpicTypeSchema,
  insertDeliverableTypeSchema,
} from "@shared/schema";
import { 
  getMicrosoftAuthConfig, 
  setMicrosoftAuthEnabled, 
  setMicrosoftAllowedDomains,
  getGoogleAuthConfig,
  setGoogleAuthEnabled
} from "../../replit_integrations/auth";

export function registerConfigRoutes(
  app: Express,
  getAuthUserId: (req: any) => string | null
): void {
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

  // Authentication Settings (Admin only)
  app.get("/api/auth/config", async (req, res) => {
    try {
      const [microsoftConfig, googleConfig, appSettings] = await Promise.all([
        getMicrosoftAuthConfig(),
        getGoogleAuthConfig(),
        storage.getAppSettings()
      ]);
      res.json({
        microsoft: microsoftConfig,
        google: googleConfig,
        demoAdminPassthroughEnabled: appSettings?.demoAdminPassthroughEnabled === true,
        demoAdminUserId: appSettings?.demoAdminPassthroughUserId || null
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/auth/google/toggle", async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const { enabled } = req.body;
      
      if (typeof enabled !== "boolean") {
        return res.status(400).json({ error: "enabled must be a boolean" });
      }
      
      await setGoogleAuthEnabled(enabled, userId || undefined);
      const config = await getGoogleAuthConfig();
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/auth/microsoft/toggle", async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const { enabled } = req.body;
      
      if (typeof enabled !== "boolean") {
        return res.status(400).json({ error: "enabled must be a boolean" });
      }
      
      await setMicrosoftAuthEnabled(enabled, userId || undefined);
      const config = await getMicrosoftAuthConfig();
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/auth/microsoft/domains", async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const { domains } = req.body;
      
      if (!Array.isArray(domains)) {
        return res.status(400).json({ error: "domains must be an array" });
      }
      
      await setMicrosoftAllowedDomains(domains, userId || undefined);
      const config = await getMicrosoftAuthConfig();
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Toggle demo admin passthrough (admin only - requires authentication)
  app.put("/api/auth/demo-admin-passthrough/toggle", async (req: any, res) => {
    try {
      const realUserId = getAuthUserId(req);
      
      // Require authentication
      if (!realUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // Check if user is admin (either real user or impersonated user)
      const realUser = await storage.getUserById(realUserId);
      const impersonatedUserId = req.session?.impersonatedUserId;
      
      let hasAdminAccess = realUser?.systemRole === "admin";
      
      // If impersonating, also check if the impersonated user is admin
      if (!hasAdminAccess && impersonatedUserId) {
        const impersonatedUser = await storage.getUserById(impersonatedUserId);
        hasAdminAccess = impersonatedUser?.systemRole === "admin";
      }
      
      if (!hasAdminAccess) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { enabled, demoAdminUserId } = req.body;
      
      if (typeof enabled !== "boolean") {
        return res.status(400).json({ error: "enabled must be a boolean" });
      }
      
      // Build the update object
      const updateData: { demoAdminPassthroughEnabled: boolean; demoAdminPassthroughUserId?: string | null } = {
        demoAdminPassthroughEnabled: enabled
      };
      
      // If demoAdminUserId is provided, update it
      if (demoAdminUserId !== undefined) {
        updateData.demoAdminPassthroughUserId = demoAdminUserId || null;
      }
      
      const updated = await storage.updateAppSettings(updateData);
      
      res.json({ 
        success: true, 
        demoAdminPassthroughEnabled: updated?.demoAdminPassthroughEnabled === true,
        demoAdminUserId: updated?.demoAdminPassthroughUserId || null
      });
    } catch (error: any) {
      console.error("Error toggling demo admin passthrough:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get admin users for demo passthrough dropdown (admin only)
  app.get("/api/auth/admin-users", async (req: any, res) => {
    try {
      const realUserId = getAuthUserId(req);
      
      if (!realUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // Check if user is admin
      const realUser = await storage.getUserById(realUserId);
      const impersonatedUserId = req.session?.impersonatedUserId;
      
      let hasAdminAccess = realUser?.systemRole === "admin";
      
      // If impersonating, also check if the impersonated user is admin
      if (!hasAdminAccess && impersonatedUserId) {
        const impersonatedUser = await storage.getUserById(impersonatedUserId);
        hasAdminAccess = impersonatedUser?.systemRole === "admin";
      }
      
      if (!hasAdminAccess) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      // Get all users with admin system role
      const allUsers = await storage.getUsers();
      const adminUsers = allUsers.filter(u => u.systemRole === "admin");
      
      res.json(adminUsers.map(u => ({
        id: u.id,
        name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Unknown',
        email: u.email
      })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
