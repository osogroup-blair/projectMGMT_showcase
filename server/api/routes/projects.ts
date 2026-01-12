import type { Express } from "express";
import { storage } from "../../data/storage";
import { 
  insertProjectSchema,
  insertDeliverableSchema,
  insertEpicSchema,
} from "@shared/schema";

export function registerProjectRoutes(
  app: Express,
  getAuthUserId: (req: any) => string | null
): void {
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
}
