import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "../data/storage";
import { 
  insertProjectSchema,
  insertDeliverableSchema,
  insertEpicSchema,
  insertTaskSchema,
  insertMilestoneSchema,
  insertMilestoneScopeRuleSchema,
  insertMilestoneTaskLinkSchema,
  insertUserSchema,
} from "@shared/schema";

// Import seed function
import { seedDatabase } from "../db/seed";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { users } from "@shared/models/auth";
import { tasks, projects } from "@shared/schema";
import { generateSampleData, clearSampleData, hasSampleData, type SampleDataSection } from "../services/sample-data-generator";
import { registerProjectRoutes } from "./routes/projects";
import { registerTaskRoutes } from "./routes/tasks";
import { registerMilestoneRoutes } from "./routes/milestones";
import { registerUserRoutes } from "./routes/users";
import { registerSprintRoutes } from "./routes/sprints";
import { registerTemplateRoutes } from "./routes/templates";
import { registerConfigRoutes } from "./routes/config";
import { registerImportExportRoutes } from "./routes/import-export";
import { registerScheduleSyncRoutes } from "./routes/schedule-sync";

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

  // Register project-related routes
  registerProjectRoutes(app, getAuthUserId);

  // Register task-related routes
  registerTaskRoutes(app, getAuthUserId);

  // Register milestone-related routes
  registerMilestoneRoutes(app, getAuthUserId);

  // Register user-related routes
  registerUserRoutes(app, getAuthUserId);

  // Register sprint-related routes
  registerSprintRoutes(app, getAuthUserId);

  // Register template-related routes
  registerTemplateRoutes(app, getAuthUserId);

  // Register config-related routes (status options, role types, task types, etc.)
  registerConfigRoutes(app, getAuthUserId);

  // Register import/export and utility routes
  registerImportExportRoutes(app, getAuthUserId);

  // Register schedule-sync routes
  registerScheduleSyncRoutes(app, getAuthUserId);

  return httpServer;
}
