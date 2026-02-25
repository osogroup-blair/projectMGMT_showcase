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

      // Server-side validation: TaskType is required for task creation
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
      const { title, projectId, project, deliverableId, epicId, stageId, sprintId, milestoneId, deadline, priority, assigneeId } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ error: "Task title is required" });
      }
      if (!projectId) {
        return res.status(400).json({ error: "Project is required" });
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
        deliverableId,
        epicId,
        stageId,
        sprintId,
        milestoneId,
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

  // Get task history
  app.get("/api/tasks/:id/history", async (req, res) => {
    try {
      const history = await storage.getHistoryByTaskId(req.params.id);
      res.json(history);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const taskId = req.params.id;

      // Get the current task to compare changes
      const currentTask = await storage.getTaskById(taskId);
      if (!currentTask) {
        return res.status(404).json({ error: "Task not found" });
      }

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

      // Collect changes to log AFTER successful update
      const fieldsToTrack = ['status', 'priority', 'assigneeId', 'title', 'description', 'deadline', 'dueDate', 'targetDate', 'effort', 'deliverableId', 'epicId', 'stageId', 'milestoneId', 'sprintId'];
      const changesToLog: Array<{ field: string; oldValue: string; newValue: string }> = [];

      for (const field of fieldsToTrack) {
        if (field in updates && updates[field] !== (currentTask as any)[field]) {
          const oldValue = (currentTask as any)[field];
          const newValue = updates[field];

          // Only log if values are actually different
          if (String(oldValue || '') !== String(newValue || '')) {
            changesToLog.push({
              field,
              oldValue: oldValue != null ? String(oldValue) : '',
              newValue: newValue != null ? String(newValue) : '',
            });
          }
        }
      }

      // First, update the task
      const task = await storage.updateTask(taskId, updates);

      // Only log history AFTER successful update
      for (const change of changesToLog) {
        try {
          await storage.createHistory({
            taskId,
            field: change.field,
            oldValue: change.oldValue,
            newValue: change.newValue,
            changedBy: userId || 'system',
          });
        } catch (historyError) {
          console.error('Failed to log history:', historyError);
        }
      }

      res.json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    await storage.deleteTask(req.params.id);
    res.status(204).send();
  });

  // Task Attachments
  app.get("/api/tasks/:id/attachments", async (req, res) => {
    try {
      const attachments = await storage.getAttachmentsByTaskId(req.params.id);
      res.json(attachments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tasks/:id/attachments", async (req, res) => {
    try {
      const userId = getAuthUserId(req);

      // Validate URL scheme to prevent XSS
      const url = req.body.url;
      const allowedSchemes = ['http:', 'https:', 'file:'];
      try {
        const parsedUrl = new URL(url);
        if (!allowedSchemes.includes(parsedUrl.protocol)) {
          return res.status(400).json({ error: "Invalid URL scheme. Only http, https, and file URLs are allowed." });
        }
      } catch {
        return res.status(400).json({ error: "Invalid URL format" });
      }

      const attachment = await storage.createAttachment({
        taskId: req.params.id,
        fileName: req.body.fileName,
        url: url,
        fileType: req.body.fileType,
        size: req.body.size,
        uploadedBy: userId || 'system',
      });
      res.status(201).json(attachment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/tasks/:taskId/attachments/:id", async (req, res) => {
    try {
      await storage.deleteAttachment(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
}
