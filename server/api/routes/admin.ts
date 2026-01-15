import type { Express } from "express";
import { seedDatabase } from "../../db/seed";
import { generateSampleData, clearSampleData, hasSampleData, type SampleDataSection } from "../../services/sample-data-generator";
import { generateDemoData, clearDemoData, hasDemoData } from "../../services/demo-data-generator";
import { storage } from "../../data/storage";

export function registerAdminRoutes(app: Express): void {
  app.post("/api/seed", async (req, res) => {
    try {
      await seedDatabase();
      res.json({ success: true, message: "Database seeded successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Sample data endpoints (Website Redesign project)
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

  // Demo data endpoints (CRM, Task Management, Time Entry projects with demo users)
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
      const projects = await storage.getProjects();
      const deliverables = await storage.getDeliverables();
      const epics = await storage.getEpics();
      const tasks = await storage.getTasks();
      const stages = await storage.getProjectStages();
      const milestones = await storage.getMilestones();
      const sprints = await storage.getSprints();
      const users = await storage.getUsers();

      // Build nested project data
      const projectData = projects.map(project => ({
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
                tasks: tasks.filter(t => t.epicId === e.id),
              })),
          })),
        milestones: milestones.filter(m => m.projectId === project.id),
        sprints: sprints.filter(s => s.projectId === project.id),
      }));

      res.json({
        projects: projectData,
        users: users.map(u => ({ id: u.id, name: u.name, email: u.email, jobTitle: u.jobTitle, systemRole: u.systemRole })),
        summary: {
          projectCount: projects.length,
          deliverableCount: deliverables.length,
          epicCount: epics.length,
          taskCount: tasks.length,
          stageCount: stages.length,
          milestoneCount: milestones.length,
          sprintCount: sprints.length,
          userCount: users.length,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Public endpoint to check if demo mode is available (for landing page)
  app.get("/api/demo-status", async (req, res) => {
    try {
      const settings = await storage.getAppSettings();
      res.json({ 
        demoAvailable: settings?.demoDataReady === true,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get app settings (admin only - includes all settings)
  app.get("/api/admin/app-settings", async (req, res) => {
    try {
      const settings = await storage.getAppSettings();
      const users = await storage.getUsers();
      
      // Get list of demo users for the dropdown (only users with demo role or demo- prefix)
      const demoUsers = users.filter(u => 
        u.systemRole === "demo" || u.id.startsWith("demo-")
      );
      
      res.json({ 
        settings: settings || { id: "default", demoDataReady: false, demoLoginUserId: null },
        demoUsers: demoUsers.map(u => ({ id: u.id, name: u.name, systemRole: u.systemRole })),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update app settings (admin only)
  app.patch("/api/admin/app-settings", async (req, res) => {
    try {
      const { demoLoginUserId } = req.body;
      
      // Validate the user exists if provided
      if (demoLoginUserId) {
        const user = await storage.getUserById(demoLoginUserId);
        if (!user) {
          return res.status(400).json({ error: "Selected user not found" });
        }
      }
      
      const updated = await storage.updateAppSettings({ demoLoginUserId });
      res.json({ success: true, settings: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Theme Management Routes
  app.get("/api/admin/themes", async (req, res) => {
    try {
      const themes = await storage.getThemes();
      res.json(themes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/themes/:id", async (req, res) => {
    try {
      const theme = await storage.getThemeById(req.params.id);
      if (!theme) {
        return res.status(404).json({ error: "Theme not found" });
      }
      res.json(theme);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/themes/active", async (req, res) => {
    try {
      const theme = await storage.getActiveTheme();
      res.json(theme || null);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/themes", async (req, res) => {
    try {
      const { name, description, lightTokens, darkTokens, isSystem } = req.body;
      const id = crypto.randomUUID();
      const userId = (req as any).user?.id;
      
      const theme = await storage.createTheme({
        id,
        name,
        description,
        lightTokens,
        darkTokens,
        isSystem: isSystem || false,
        status: "draft",
        version: 1,
        createdBy: userId,
        updatedBy: userId,
      });
      res.json(theme);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/themes/:id", async (req, res) => {
    try {
      const { name, description, lightTokens, darkTokens, status } = req.body;
      const userId = (req as any).user?.id;
      
      const updates: any = { updatedBy: userId };
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (lightTokens !== undefined) updates.lightTokens = lightTokens;
      if (darkTokens !== undefined) updates.darkTokens = darkTokens;
      if (status !== undefined) updates.status = status;
      
      const theme = await storage.updateTheme(req.params.id, updates);
      res.json(theme);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/themes/:id", async (req, res) => {
    try {
      const theme = await storage.getThemeById(req.params.id);
      if (!theme) {
        return res.status(404).json({ error: "Theme not found" });
      }
      if (theme.isSystem) {
        return res.status(400).json({ error: "Cannot delete system theme" });
      }
      if (theme.isDefault) {
        return res.status(400).json({ error: "Cannot delete default theme" });
      }
      await storage.deleteTheme(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/themes/:id/publish", async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const theme = await storage.publishTheme(req.params.id, userId);
      res.json(theme);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/themes/:id/set-default", async (req, res) => {
    try {
      const theme = await storage.getThemeById(req.params.id);
      if (!theme) {
        return res.status(404).json({ error: "Theme not found" });
      }
      if (theme.status !== "published") {
        return res.status(400).json({ error: "Only published themes can be set as default" });
      }
      const updated = await storage.setDefaultTheme(req.params.id);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/themes/:id/duplicate", async (req, res) => {
    try {
      const original = await storage.getThemeById(req.params.id);
      if (!original) {
        return res.status(404).json({ error: "Theme not found" });
      }
      const userId = (req as any).user?.id;
      const id = crypto.randomUUID();
      
      const theme = await storage.createTheme({
        id,
        name: `${original.name} (Copy)`,
        description: original.description,
        lightTokens: original.lightTokens,
        darkTokens: original.darkTokens,
        isSystem: false,
        status: "draft",
        version: 1,
        createdBy: userId,
        updatedBy: userId,
      });
      res.json(theme);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Theme import endpoint
  app.post("/api/admin/themes/import", async (req, res) => {
    try {
      const { name, lightTokens, darkTokens } = req.body;
      const userId = (req as any).user?.id;
      const id = crypto.randomUUID();
      
      const theme = await storage.createTheme({
        id,
        name: name || "Imported Theme",
        description: "Imported from JSON file",
        lightTokens,
        darkTokens,
        isSystem: false,
        status: "draft",
        version: 1,
        createdBy: userId,
        updatedBy: userId,
      });
      res.json(theme);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
