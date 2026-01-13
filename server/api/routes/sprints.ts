import type { Express } from "express";
import { storage } from "../../data/storage";
import { 
  insertSprintSchema,
  insertSprintMemberSchema,
  insertSprintPulseUpdateSchema,
} from "@shared/schema";
import { getCompletedStatusLabels } from "../../utils/completed-statuses";

export function registerSprintRoutes(
  app: Express,
  getAuthUserId: (req: any) => string | null
): void {
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

      const completedLabels = await getCompletedStatusLabels();
      const doneTasks = userTasks.filter(t => 
        t.status ? completedLabels.has(t.status) : false
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
}
