import type { Express } from "express";
import { storage } from "../../data/storage";
import { 
  insertMilestoneSchema,
  insertMilestoneScopeRuleSchema,
  insertMilestoneTaskLinkSchema,
} from "@shared/schema";

export function registerMilestoneRoutes(
  app: Express,
  getAuthUserId: (req: any) => string | null
): void {
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
}
