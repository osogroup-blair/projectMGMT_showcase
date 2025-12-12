import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProjectSchema,
  insertDeliverableSchema,
  insertEpicSchema,
  insertTaskSchema,
  insertMilestoneSchema,
  insertMilestoneScopeRuleSchema,
  insertMilestoneTaskLinkSchema,
  insertUserSchema,
  insertActivitySchema,
  insertCommentSchema,
  insertAttachmentSchema,
  insertHistorySchema,
  insertProjectRoleSchema,
  insertRoleAssignmentSchema,
  insertRoleTemplateSchema,
  insertSavedViewSchema,
  insertGuidanceItemSchema,
  insertProjectStageSchema,
  insertFrameworkTemplateSchema,
  insertStageTemplateSchema,
  insertProjectTemplateSchema,
  insertDeliverableTemplateSchema,
  insertEpicTemplateSchema,
  insertTaskTemplateSchema,
  insertMappingTemplateSchema,
  insertStatusOptionSchema,
  insertRoleTypeSchema,
} from "@shared/schema";

// Import seed function
import { seedDatabase } from "./seed";

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
      const validated = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validated);
      res.status(201).json(project);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.updateProject(req.params.id, req.body);
      res.json(project);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    await storage.deleteProject(req.params.id);
    res.status(204).send();
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
      const validated = insertDeliverableSchema.parse(req.body);
      const deliverable = await storage.createDeliverable(validated);
      res.status(201).json(deliverable);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/deliverables/:id", async (req, res) => {
    try {
      const deliverable = await storage.updateDeliverable(req.params.id, req.body);
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
      const validated = insertEpicSchema.parse(req.body);
      const epic = await storage.createEpic(validated);
      res.status(201).json(epic);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/epics/:id", async (req, res) => {
    try {
      const epic = await storage.updateEpic(req.params.id, req.body);
      res.json(epic);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/epics/:id", async (req, res) => {
    await storage.deleteEpic(req.params.id);
    res.status(204).send();
  });

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
      const validated = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validated);
      res.status(201).json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.updateTask(req.params.id, req.body);
      res.json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    await storage.deleteTask(req.params.id);
    res.status(204).send();
  });

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
      const validated = insertMilestoneSchema.parse(req.body);
      const milestone = await storage.createMilestone(validated);
      res.status(201).json(milestone);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/milestones/:id", async (req, res) => {
    try {
      const milestone = await storage.updateMilestone(req.params.id, req.body);
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

  // Users
  app.get("/api/users", async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  app.get("/api/users/:id", async (req, res) => {
    const user = await storage.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validated = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validated);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    await storage.deleteUser(req.params.id);
    res.status(204).send();
  });

  // Activity
  app.get("/api/activity", async (req, res) => {
    const activity = await storage.getActivity();
    res.json(activity);
  });

  app.post("/api/activity", async (req, res) => {
    try {
      const validated = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(validated);
      res.status(201).json(activity);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/activity/:id", async (req, res) => {
    await storage.deleteActivity(req.params.id);
    res.status(204).send();
  });

  // Project Roles
  app.get("/api/projectRoles", async (req, res) => {
    const roles = await storage.getProjectRoles();
    res.json(roles);
  });

  app.post("/api/projectRoles", async (req, res) => {
    try {
      const validated = insertProjectRoleSchema.parse(req.body);
      const role = await storage.createProjectRole(validated);
      res.status(201).json(role);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/projectRoles/:id", async (req, res) => {
    try {
      const role = await storage.updateProjectRole(req.params.id, req.body);
      res.json(role);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/projectRoles/:id", async (req, res) => {
    await storage.deleteProjectRole(req.params.id);
    res.status(204).send();
  });

  // Role Assignments
  app.get("/api/roleAssignments", async (req, res) => {
    const assignments = await storage.getRoleAssignments();
    res.json(assignments);
  });

  app.post("/api/roleAssignments", async (req, res) => {
    try {
      const validated = insertRoleAssignmentSchema.parse(req.body);
      const assignment = await storage.createRoleAssignment(validated);
      res.status(201).json(assignment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/roleAssignments/:id", async (req, res) => {
    try {
      const assignment = await storage.updateRoleAssignment(req.params.id, req.body);
      res.json(assignment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/roleAssignments/:id", async (req, res) => {
    await storage.deleteRoleAssignment(req.params.id);
    res.status(204).send();
  });

  // Saved Views
  app.get("/api/savedViews", async (req, res) => {
    const views = await storage.getSavedViews();
    res.json(views);
  });

  app.post("/api/savedViews", async (req, res) => {
    try {
      const validated = insertSavedViewSchema.parse(req.body);
      const view = await storage.createSavedView(validated);
      res.status(201).json(view);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/savedViews/:id", async (req, res) => {
    try {
      const view = await storage.updateSavedView(req.params.id, req.body);
      res.json(view);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/savedViews/:id", async (req, res) => {
    await storage.deleteSavedView(req.params.id);
    res.status(204).send();
  });

  // Guidance Items
  app.get("/api/guidanceItems", async (req, res) => {
    const items = await storage.getGuidanceItems();
    res.json(items);
  });

  app.post("/api/guidanceItems", async (req, res) => {
    try {
      const validated = insertGuidanceItemSchema.parse(req.body);
      const item = await storage.createGuidanceItem(validated);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/guidanceItems/:id", async (req, res) => {
    try {
      const item = await storage.updateGuidanceItem(req.params.id, req.body);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/guidanceItems/:id", async (req, res) => {
    await storage.deleteGuidanceItem(req.params.id);
    res.status(204).send();
  });

  // Project Stages
  app.get("/api/projectStages", async (req, res) => {
    const stages = await storage.getProjectStages();
    res.json(stages);
  });

  app.post("/api/projectStages", async (req, res) => {
    try {
      const validated = insertProjectStageSchema.parse(req.body);
      const stage = await storage.createProjectStage(validated);
      res.status(201).json(stage);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/projectStages/:id", async (req, res) => {
    try {
      const stage = await storage.updateProjectStage(req.params.id, req.body);
      res.json(stage);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/projectStages/:id", async (req, res) => {
    await storage.deleteProjectStage(req.params.id);
    res.status(204).send();
  });

  // Framework Templates
  app.get("/api/frameworkTemplates", async (req, res) => {
    const templates = await storage.getFrameworkTemplates();
    res.json(templates);
  });

  app.post("/api/frameworkTemplates", async (req, res) => {
    try {
      const validated = insertFrameworkTemplateSchema.parse(req.body);
      const template = await storage.createFrameworkTemplate(validated);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/frameworkTemplates/:id", async (req, res) => {
    try {
      const template = await storage.updateFrameworkTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/frameworkTemplates/:id", async (req, res) => {
    await storage.deleteFrameworkTemplate(req.params.id);
    res.status(204).send();
  });

  // Stage Templates
  app.get("/api/stageTemplates", async (req, res) => {
    const templates = await storage.getStageTemplates();
    res.json(templates);
  });

  app.post("/api/stageTemplates", async (req, res) => {
    try {
      const validated = insertStageTemplateSchema.parse(req.body);
      const template = await storage.createStageTemplate(validated);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/stageTemplates/:id", async (req, res) => {
    try {
      const template = await storage.updateStageTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/stageTemplates/:id", async (req, res) => {
    await storage.deleteStageTemplate(req.params.id);
    res.status(204).send();
  });

  // Project Templates
  app.get("/api/projectTemplates", async (req, res) => {
    const templates = await storage.getProjectTemplates();
    res.json(templates);
  });

  app.post("/api/projectTemplates", async (req, res) => {
    try {
      const validated = insertProjectTemplateSchema.parse(req.body);
      const template = await storage.createProjectTemplate(validated);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/projectTemplates/:id", async (req, res) => {
    try {
      const template = await storage.updateProjectTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/projectTemplates/:id", async (req, res) => {
    await storage.deleteProjectTemplate(req.params.id);
    res.status(204).send();
  });

  // Deliverable Templates
  app.get("/api/deliverableTemplates", async (req, res) => {
    const templates = await storage.getDeliverableTemplates();
    res.json(templates);
  });

  app.post("/api/deliverableTemplates", async (req, res) => {
    try {
      const validated = insertDeliverableTemplateSchema.parse(req.body);
      const template = await storage.createDeliverableTemplate(validated);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/deliverableTemplates/:id", async (req, res) => {
    try {
      const template = await storage.updateDeliverableTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/deliverableTemplates/:id", async (req, res) => {
    await storage.deleteDeliverableTemplate(req.params.id);
    res.status(204).send();
  });

  // Epic Templates
  app.get("/api/epicTemplates", async (req, res) => {
    const templates = await storage.getEpicTemplates();
    res.json(templates);
  });

  app.post("/api/epicTemplates", async (req, res) => {
    try {
      const validated = insertEpicTemplateSchema.parse(req.body);
      const template = await storage.createEpicTemplate(validated);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/epicTemplates/:id", async (req, res) => {
    try {
      const template = await storage.updateEpicTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/epicTemplates/:id", async (req, res) => {
    await storage.deleteEpicTemplate(req.params.id);
    res.status(204).send();
  });

  // Task Templates
  app.get("/api/taskTemplates", async (req, res) => {
    const templates = await storage.getTaskTemplates();
    res.json(templates);
  });

  app.post("/api/taskTemplates", async (req, res) => {
    try {
      const validated = insertTaskTemplateSchema.parse(req.body);
      const template = await storage.createTaskTemplate(validated);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/taskTemplates/:id", async (req, res) => {
    try {
      const template = await storage.updateTaskTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/taskTemplates/:id", async (req, res) => {
    await storage.deleteTaskTemplate(req.params.id);
    res.status(204).send();
  });

  // Role Templates
  app.get("/api/roleTemplates", async (req, res) => {
    const templates = await storage.getRoleTemplates();
    res.json(templates);
  });

  app.post("/api/roleTemplates", async (req, res) => {
    try {
      const validated = insertRoleTemplateSchema.parse(req.body);
      const template = await storage.createRoleTemplate(validated);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/roleTemplates/:id", async (req, res) => {
    try {
      const template = await storage.updateRoleTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/roleTemplates/:id", async (req, res) => {
    await storage.deleteRoleTemplate(req.params.id);
    res.status(204).send();
  });

  // Mapping Templates
  app.get("/api/mappingTemplates", async (req, res) => {
    const templates = await storage.getMappingTemplates();
    res.json(templates);
  });

  app.post("/api/mappingTemplates", async (req, res) => {
    try {
      const validated = insertMappingTemplateSchema.parse(req.body);
      const template = await storage.createMappingTemplate(validated);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/mappingTemplates/:id", async (req, res) => {
    try {
      const template = await storage.updateMappingTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/mappingTemplates/:id", async (req, res) => {
    await storage.deleteMappingTemplate(req.params.id);
    res.status(204).send();
  });

  // Sample Template Download
  app.get("/api/templates/sample", (req, res) => {
    const sampleData = {
      version: "1.0",
      exportedAt: "2025-01-01T00:00:00.000Z",
      description: "Sample template file showing all attributes for each template type. Use this as a reference when creating your own templates.",
      templates: {
        framework: [
          {
            id: "fw_implementation",
            name: "Implementation Framework",
            description: "Standard 4-phase implementation delivery framework for enterprise projects",
            defaultStages: ["st_discovery", "st_design", "st_build", "st_deploy"]
          }
        ],
        stage: [
          {
            id: "st_discovery",
            name: "Discovery & Planning",
            description: "Initial discovery phase for requirements gathering and project planning",
            defaultTasks: ["tt_kickoff", "tt_requirements"],
            defaultRoles: ["rt_pm", "rt_ba"],
            entryCriteria: "Project charter signed, budget approved",
            exitCriteria: "Requirements document approved, project plan finalized",
            allowedTaskStatuses: ["Todo", "In Progress", "Review", "Done"]
          }
        ],
        project: [
          {
            id: "pt_enterprise",
            name: "Enterprise Implementation",
            description: "Full-scale enterprise implementation project template",
            defaultFrameworkId: "fw_implementation",
            defaultRoles: ["rt_pm", "rt_ba", "rt_dev_lead", "rt_developer"],
            defaultDeliverables: ["dt_discovery_docs", "dt_implementation"],
            thumbnail: "enterprise"
          }
        ],
        deliverable: [
          {
            id: "dt_discovery_docs",
            title: "Discovery Documentation",
            description: "Complete discovery phase documentation including requirements and stakeholder analysis",
            defaultEpics: ["et_requirements", "et_stakeholder_analysis"]
          }
        ],
        epic: [
          {
            id: "et_requirements",
            title: "Requirements Gathering",
            description: "Complete business and functional requirements documentation",
            defaultStages: ["st_discovery"]
          }
        ],
        task: [
          {
            id: "tt_kickoff",
            title: "Project Kickoff Meeting",
            description: "Conduct project kickoff meeting with all stakeholders",
            defaultPriority: "High",
            defaultEstimateHours: 4,
            requiredRole: "Management",
            assignedRoleId: "rt_pm"
          },
          {
            id: "tt_requirements",
            title: "Requirements Workshop",
            description: "Facilitate requirements gathering workshops with business stakeholders",
            defaultPriority: "High",
            defaultEstimateHours: 16,
            requiredRole: "Business Analysis",
            assignedRoleId: "rt_ba"
          }
        ],
        role: [
          {
            id: "rt_pm",
            name: "Project Manager",
            description: "Responsible for overall project delivery, timeline, and budget",
            defaultRoleType: "Management",
            defaultPermissions: ["manage_project", "manage_budget", "assign_tasks", "view_reports"]
          },
          {
            id: "rt_ba",
            name: "Business Analyst",
            description: "Gathers requirements, creates user stories, manages backlog",
            defaultRoleType: "Analysis",
            defaultPermissions: ["manage_requirements", "create_stories", "view_reports"]
          },
          {
            id: "rt_dev_lead",
            name: "Development Lead",
            description: "Technical lead for code reviews and architecture decisions",
            defaultRoleType: "Development",
            defaultPermissions: ["manage_code", "approve_pr", "deploy", "assign_tasks"]
          },
          {
            id: "rt_developer",
            name: "Software Developer",
            description: "Implements features, writes tests, fixes bugs",
            defaultRoleType: "Development",
            defaultPermissions: ["write_code", "create_pr", "update_task_status"]
          }
        ],
        mapping: [
          {
            id: "mt_jira",
            name: "Jira Import Mapping",
            dataType: "Tasks"
          },
          {
            id: "mt_csv",
            name: "CSV Standard Mapping",
            dataType: "Mixed"
          }
        ]
      }
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="sample-templates.json"');
    res.json(sampleData);
  });

  // Template Export/Import
  app.get("/api/templates/export", async (req, res) => {
    try {
      const [
        frameworkTemplates,
        stageTemplates,
        projectTemplates,
        deliverableTemplates,
        epicTemplates,
        taskTemplates,
        roleTemplates,
        mappingTemplates
      ] = await Promise.all([
        storage.getFrameworkTemplates(),
        storage.getStageTemplates(),
        storage.getProjectTemplates(),
        storage.getDeliverableTemplates(),
        storage.getEpicTemplates(),
        storage.getTaskTemplates(),
        storage.getRoleTemplates(),
        storage.getMappingTemplates()
      ]);

      const exportData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        templates: {
          framework: frameworkTemplates,
          stage: stageTemplates,
          project: projectTemplates,
          deliverable: deliverableTemplates,
          epic: epicTemplates,
          task: taskTemplates,
          role: roleTemplates,
          mapping: mappingTemplates
        }
      };

      res.json(exportData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/templates/import", async (req, res) => {
    try {
      const { templates, mode = "skip" } = req.body;
      // mode: "skip" = skip existing, "overwrite" = update existing
      
      const results = {
        framework: { created: 0, updated: 0, skipped: 0 },
        stage: { created: 0, updated: 0, skipped: 0 },
        project: { created: 0, updated: 0, skipped: 0 },
        deliverable: { created: 0, updated: 0, skipped: 0 },
        epic: { created: 0, updated: 0, skipped: 0 },
        task: { created: 0, updated: 0, skipped: 0 },
        role: { created: 0, updated: 0, skipped: 0 },
        mapping: { created: 0, updated: 0, skipped: 0 }
      };

      // Sanitizers to add default values for missing required fields
      const sanitizeTask = (item: any) => ({
        id: item.id,
        title: item.title || "Untitled Task",
        description: item.description || "",
        defaultPriority: item.defaultPriority || "Medium",
        defaultEstimateHours: item.defaultEstimateHours || 0,
        requiredRole: item.requiredRole || null,
        assignedRoleId: item.assignedRoleId || null,
      });

      const sanitizeRole = (item: any) => ({
        id: item.id,
        name: item.name || "Untitled Role",
        description: item.description || "",
        defaultRoleType: item.defaultRoleType || "Development",
        defaultPermissions: item.defaultPermissions || [],
      });

      const sanitizeStage = (item: any) => ({
        id: item.id,
        name: item.name || "Untitled Stage",
        description: item.description || "",
        defaultTasks: item.defaultTasks || [],
        defaultRoles: item.defaultRoles || [],
        entryCriteria: item.entryCriteria || "",
        exitCriteria: item.exitCriteria || "",
        allowedTaskStatuses: item.allowedTaskStatuses || [],
      });

      const sanitizeFramework = (item: any) => ({
        id: item.id,
        name: item.name || "Untitled Framework",
        description: item.description || "",
        defaultStages: item.defaultStages || [],
      });

      const sanitizeProject = (item: any) => ({
        id: item.id,
        name: item.name || "Untitled Project Template",
        description: item.description || "",
        defaultFrameworkId: item.defaultFrameworkId || null,
        defaultDeliverables: item.defaultDeliverables || [],
        defaultRoles: item.defaultRoles || [],
      });

      const sanitizeDeliverable = (item: any) => ({
        id: item.id,
        title: item.title || "Untitled Deliverable",
        description: item.description || "",
        defaultEpics: item.defaultEpics || [],
      });

      const sanitizeEpic = (item: any) => ({
        id: item.id,
        title: item.title || "Untitled Epic",
        description: item.description || "",
        defaultTasks: item.defaultTasks || [],
        defaultStageIds: item.defaultStageIds || [],
      });

      // Helper to import a template type
      async function importTemplates(
        items: any[],
        getAll: () => Promise<any[]>,
        create: (data: any) => Promise<any>,
        update: (id: string, data: any) => Promise<any>,
        key: keyof typeof results,
        sanitize?: (item: any) => any
      ) {
        if (!items?.length) return;
        const existing = await getAll();
        const existingIds = new Set(existing.map((e: any) => e.id));

        for (const item of items) {
          const sanitized = sanitize ? sanitize(item) : item;
          if (existingIds.has(sanitized.id)) {
            if (mode === "overwrite") {
              await update(sanitized.id, sanitized);
              results[key].updated++;
            } else {
              results[key].skipped++;
            }
          } else {
            await create(sanitized);
            results[key].created++;
          }
        }
      }

      await importTemplates(
        templates.framework,
        () => storage.getFrameworkTemplates(),
        (d) => storage.createFrameworkTemplate(d),
        (id, d) => storage.updateFrameworkTemplate(id, d),
        "framework",
        sanitizeFramework
      );
      await importTemplates(
        templates.stage,
        () => storage.getStageTemplates(),
        (d) => storage.createStageTemplate(d),
        (id, d) => storage.updateStageTemplate(id, d),
        "stage",
        sanitizeStage
      );
      await importTemplates(
        templates.project,
        () => storage.getProjectTemplates(),
        (d) => storage.createProjectTemplate(d),
        (id, d) => storage.updateProjectTemplate(id, d),
        "project",
        sanitizeProject
      );
      await importTemplates(
        templates.deliverable,
        () => storage.getDeliverableTemplates(),
        (d) => storage.createDeliverableTemplate(d),
        (id, d) => storage.updateDeliverableTemplate(id, d),
        "deliverable",
        sanitizeDeliverable
      );
      await importTemplates(
        templates.epic,
        () => storage.getEpicTemplates(),
        (d) => storage.createEpicTemplate(d),
        (id, d) => storage.updateEpicTemplate(id, d),
        "epic",
        sanitizeEpic
      );
      await importTemplates(
        templates.task,
        () => storage.getTaskTemplates(),
        (d) => storage.createTaskTemplate(d),
        (id, d) => storage.updateTaskTemplate(id, d),
        "task",
        sanitizeTask
      );
      await importTemplates(
        templates.role,
        () => storage.getRoleTemplates(),
        (d) => storage.createRoleTemplate(d),
        (id, d) => storage.updateRoleTemplate(id, d),
        "role",
        sanitizeRole
      );
      await importTemplates(
        templates.mapping,
        () => storage.getMappingTemplates(),
        (d) => storage.createMappingTemplate(d),
        (id, d) => storage.updateMappingTemplate(id, d),
        "mapping"
      );

      res.json({ success: true, results });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

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

  return httpServer;
}
