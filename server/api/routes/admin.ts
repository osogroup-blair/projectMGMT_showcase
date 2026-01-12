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
}
