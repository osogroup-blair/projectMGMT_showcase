import type { Express } from "express";
import { storage } from "../../data/storage";
import { insertTaskSchema } from "@shared/schema";

export function registerTaskRoutes(
  app: Express,
  getAuthUserId: (req: any) => string | null
): void {
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
}
