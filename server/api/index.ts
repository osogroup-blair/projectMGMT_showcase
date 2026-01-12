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
import { generateDemoData, clearDemoData, hasDemoData } from "../services/demo-data-generator";
import { registerProjectRoutes } from "./routes/projects";
import { registerTaskRoutes } from "./routes/tasks";
import { registerMilestoneRoutes } from "./routes/milestones";
import { registerUserRoutes } from "./routes/users";
import { registerSprintRoutes } from "./routes/sprints";
import { registerTemplateRoutes } from "./routes/templates";
import { registerConfigRoutes } from "./routes/config";
import { registerImportExportRoutes } from "./routes/import-export";
import { registerScheduleSyncRoutes } from "./routes/schedule-sync";
import rolesPermissionsRoutes from "./routes/roles-permissions";
import { seedRolesAndPermissions } from "../services/roles-permissions-service";

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

  // Demo Data endpoints (CRM, Task Management, Time Entry projects with demo users)
  app.get("/api/admin/demo-data/status", async (req, res) => {
    try {
      const exists = await hasDemoData();
      res.json({ hasDemoData: exists });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/demo-data/generate", async (req, res) => {
    try {
      const { clearFirst = true } = req.body;
      const result = await generateDemoData(clearFirst);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/demo-data/clear", async (req, res) => {
    try {
      const result = await clearDemoData();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Data viewer API - returns project data as JSON
  app.get("/api/admin/data-viewer/projects", async (req, res) => {
    try {
      const allProjects = await storage.getProjects();
      const deliverables = await storage.getDeliverables();
      const epics = await storage.getEpics();
      const allTasks = await storage.getTasks();
      const stages = await storage.getProjectStages();
      const milestones = await storage.getMilestones();
      const sprints = await storage.getSprints();
      const allUsers = await storage.getUsers();

      // Build nested project data
      const projectData = allProjects.map(project => ({
        ...project,
        stages: stages.filter(s => s.projectId === project.id),
        deliverables: deliverables
          .filter(d => d.projectId === project.id)
          .map(d => ({
            ...d,
            epics: epics
              .filter(e => e.deliverableId === d.id)
              .map(e => ({
                ...e,
                tasks: allTasks.filter(t => t.epicId === e.id),
              })),
          })),
        milestones: milestones.filter(m => m.projectId === project.id),
        sprints: sprints.filter(s => s.projectId === project.id),
      }));

      res.json({
        projects: projectData,
        users: allUsers.map(u => ({ id: u.id, name: u.name, email: u.email, jobTitle: u.jobTitle, systemRole: u.systemRole })),
        summary: {
          projectCount: allProjects.length,
          deliverableCount: deliverables.length,
          epicCount: epics.length,
          taskCount: allTasks.length,
          stageCount: stages.length,
          milestoneCount: milestones.length,
          sprintCount: sprints.length,
          userCount: allUsers.length,
        },
      });
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

  // Register roles & permissions routes
  app.use("/api/roles-permissions", rolesPermissionsRoutes);

  // Seed roles and permissions on startup
  seedRolesAndPermissions().then(result => {
    if (result.roles > 0 || result.permissions > 0 || result.mappings > 0) {
      console.log(`Seeded roles/permissions: ${result.roles} roles, ${result.permissions} permissions, ${result.mappings} mappings`);
    }
  }).catch(err => {
    console.error("Failed to seed roles/permissions:", err);
  });

  return httpServer;
}
