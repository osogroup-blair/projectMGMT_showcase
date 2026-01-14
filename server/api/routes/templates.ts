import type { Express } from "express";
import { storage } from "../../data/storage";
import { 
  insertFrameworkTemplateSchema,
  insertStageTemplateSchema,
  insertProjectTemplateSchema,
  insertDeliverableTemplateSchema,
  insertEpicTemplateSchema,
  insertTaskTemplateSchema,
  insertRoleTemplateSchema,
  insertMappingTemplateSchema,
  insertMilestoneTemplateSchema,
  insertTemplateSnippetSchema,
} from "@shared/schema";

export function registerTemplateRoutes(
  app: Express,
  getAuthUserId: (req: any) => string | null
): void {
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
    try {
      await storage.deleteFrameworkTemplate(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      if (error.code === '23503') {
        res.status(400).json({ error: "Cannot delete this framework template because it is being used by one or more projects. Remove it from all projects first." });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
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

  // Milestone Templates
  app.get("/api/milestoneTemplates", async (req, res) => {
    const templates = await storage.getMilestoneTemplates();
    res.json(templates);
  });

  app.post("/api/milestoneTemplates", async (req, res) => {
    try {
      const validated = insertMilestoneTemplateSchema.parse(req.body);
      const template = await storage.createMilestoneTemplate(validated);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/milestoneTemplates/:id", async (req, res) => {
    try {
      const template = await storage.updateMilestoneTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/milestoneTemplates/:id", async (req, res) => {
    await storage.deleteMilestoneTemplate(req.params.id);
    res.status(204).send();
  });

  // Template Snippets
  app.get("/api/templateSnippets", async (req, res) => {
    const snippets = await storage.getTemplateSnippets();
    res.json(snippets);
  });

  app.post("/api/templateSnippets", async (req, res) => {
    try {
      const validated = insertTemplateSnippetSchema.parse(req.body);
      const snippet = await storage.createTemplateSnippet(validated);
      res.status(201).json(snippet);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/templateSnippets/:id", async (req, res) => {
    try {
      const snippet = await storage.updateTemplateSnippet(req.params.id, req.body);
      res.json(snippet);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/templateSnippets/:id", async (req, res) => {
    await storage.deleteTemplateSnippet(req.params.id);
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
        mappingTemplates,
        milestoneTemplates
      ] = await Promise.all([
        storage.getFrameworkTemplates(),
        storage.getStageTemplates(),
        storage.getProjectTemplates(),
        storage.getDeliverableTemplates(),
        storage.getEpicTemplates(),
        storage.getTaskTemplates(),
        storage.getRoleTemplates(),
        storage.getMappingTemplates(),
        storage.getMilestoneTemplates()
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
          mapping: mappingTemplates,
          milestone: milestoneTemplates
        }
      };

      res.json(exportData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/templates/import", async (req, res) => {
    try {
      const { templates: rawTemplates, mode = "skip" } = req.body;
      // mode: "skip" = skip existing, "overwrite" = update existing
      
      // Support both formats:
      // 1. { templates: { framework: [...], stage: [...] } } - our export format
      // 2. { FrameworkTemplates: [...], StageTemplates: [...] } - root-level PascalCase format
      const source = rawTemplates || req.body;
      
      // Normalize property names: accept both PascalCase (FrameworkTemplates) and lowercase (framework)
      const templates = {
        framework: source?.framework || source?.FrameworkTemplates || [],
        stage: source?.stage || source?.StageTemplates || [],
        project: source?.project || source?.ProjectTemplates || [],
        deliverable: source?.deliverable || source?.DeliverableTemplates || [],
        epic: source?.epic || source?.EpicTemplates || [],
        task: source?.task || source?.TaskTemplates || [],
        role: source?.role || source?.RoleTemplates || [],
        mapping: source?.mapping || source?.MappingTemplates || [],
        milestone: source?.milestone || source?.MilestoneTemplates || [],
      };
      
      const results = {
        framework: { created: 0, updated: 0, skipped: 0 },
        stage: { created: 0, updated: 0, skipped: 0 },
        project: { created: 0, updated: 0, skipped: 0 },
        deliverable: { created: 0, updated: 0, skipped: 0 },
        epic: { created: 0, updated: 0, skipped: 0 },
        task: { created: 0, updated: 0, skipped: 0 },
        role: { created: 0, updated: 0, skipped: 0 },
        mapping: { created: 0, updated: 0, skipped: 0 },
        milestone: { created: 0, updated: 0, skipped: 0 }
      };

      // ID mappings: imported ID -> persisted ID (for remapping references)
      const idMappings = {
        task: new Map<string, string>(),
        role: new Map<string, string>(),
        stage: new Map<string, string>(),
        framework: new Map<string, string>(),
        epic: new Map<string, string>(),
        deliverable: new Map<string, string>(),
        project: new Map<string, string>(),
        mapping: new Map<string, string>(),
        milestone: new Map<string, string>(),
      };

      // Helper to parse array values that might be JSON strings or actual arrays
      const parseArray = (value: any): string[] => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        }
        return [];
      };

      // Helper to remap an array of IDs using the mapping
      const remapIds = (ids: any, mapping: Map<string, string>): string[] => {
        const parsed = parseArray(ids);
        if (!parsed.length) return [];
        return parsed.map(id => mapping.get(id) || id);
      };

      // Helper to remap a single ID
      const remapId = (id: string | null | undefined, mapping: Map<string, string>): string | null => {
        if (!id) return null;
        return mapping.get(id) || id;
      };

      // Sanitizers to add default values for missing required fields
      // Note: sanitizeTask needs role mappings, so roles must be imported first
      const sanitizeTask = (item: any) => ({
        id: item.id,
        title: item.title || "Untitled Task",
        description: item.description || "",
        defaultPriority: item.defaultPriority || "Medium",
        defaultEstimateHours: item.defaultEstimateHours || 0,
        requiredRole: item.requiredRole || null,
        assignedRoleId: remapId(item.assignedRoleId, idMappings.role),
      });

      const sanitizeRole = (item: any) => ({
        id: item.id,
        name: item.name || "Untitled Role",
        description: item.description || "",
        defaultRoleType: item.defaultRoleType || "Development",
        defaultPermissions: parseArray(item.defaultPermissions),
      });

      const sanitizeStage = (item: any) => ({
        id: item.id,
        name: item.name || "Untitled Stage",
        description: item.description || "",
        defaultTasks: remapIds(item.defaultTasks, idMappings.task),
        defaultRoles: remapIds(item.defaultRoles, idMappings.role),
        entryCriteria: item.entryCriteria || "",
        exitCriteria: item.exitCriteria || "",
        allowedTaskStatuses: parseArray(item.allowedTaskStatuses),
      });

      const sanitizeFramework = (item: any) => ({
        id: item.id,
        name: item.name || "Untitled Framework",
        description: item.description || "",
        defaultStages: remapIds(item.defaultStages, idMappings.stage),
      });

      const sanitizeProject = (item: any) => ({
        id: item.id,
        name: item.name || "Untitled Project Template",
        description: item.description || "",
        defaultFrameworkId: remapId(item.defaultFrameworkId, idMappings.framework),
        defaultDeliverables: remapIds(item.defaultDeliverables, idMappings.deliverable),
        defaultRoles: remapIds(item.defaultRoles, idMappings.role),
      });

      const sanitizeDeliverable = (item: any) => ({
        id: item.id,
        title: item.title || "Untitled Deliverable",
        description: item.description || "",
        defaultEpics: remapIds(item.defaultEpics, idMappings.epic),
      });

      const sanitizeEpic = (item: any) => ({
        id: item.id,
        title: item.title || "Untitled Epic",
        description: item.description || "",
        defaultTasks: remapIds(item.defaultTasks, idMappings.task),
        defaultStageIds: remapIds(item.defaultStageIds, idMappings.stage),
      });

      const sanitizeMilestone = (item: any) => ({
        id: item.id,
        name: item.name || "Untitled Milestone",
        description: item.description || "",
        phase: item.phase || "delivery",
        scopeType: item.scopeType || "deliverable",
        completionMode: item.completionMode || "percentage",
        completionTargetPercent: item.completionTargetPercent ?? 100,
        isBillingGate: item.isBillingGate ?? false,
        offsetDays: item.offsetDays ?? 0,
        stageTemplateId: remapId(item.stageTemplateId, idMappings.stage),
        order: item.order ?? 0,
      });

      // Helper to import a template type and build ID mappings
      // matchField: 'name' for stage/framework/role/mapping, 'title' for task/deliverable/epic/project
      const importTemplates = async (
        items: any[],
        getAll: () => Promise<any[]>,
        create: (data: any) => Promise<any>,
        update: (id: string, data: any) => Promise<any>,
        key: keyof typeof results,
        sanitize?: (item: any) => any,
        matchField: 'name' | 'title' = 'name'
      ) => {
        if (!items?.length) return;
        const existing = await getAll();
        const existingById = new Map(existing.map((e: any) => [e.id, e]));
        const existingByField = new Map(existing.map((e: any) => [e[matchField]?.toLowerCase?.(), e]));

        for (const item of items) {
          const sanitized = sanitize ? sanitize(item) : item;
          const fieldValue = sanitized[matchField]?.toLowerCase?.();
          const importedId = item.id;
          
          // Check by ID first, then by name/title
          let existingRecord = existingById.get(sanitized.id);
          if (!existingRecord && fieldValue) {
            existingRecord = existingByField.get(fieldValue);
          }
          
          if (existingRecord) {
            // Record the mapping from imported ID to existing ID
            idMappings[key].set(importedId, existingRecord.id);
            
            if (mode === "overwrite") {
              // Update using the existing record's ID (not the imported ID)
              await update(existingRecord.id, { ...sanitized, id: existingRecord.id });
              results[key].updated++;
            } else {
              results[key].skipped++;
            }
          } else {
            // Create new record - capture the returned record's ID for accurate mapping
            const created = await create(sanitized);
            idMappings[key].set(importedId, created.id);
            results[key].created++;
          }
        }
      }

      // Import in dependency order:
      // 1. First: Roles (leaf template, no references)
      await importTemplates(
        templates.role,
        () => storage.getRoleTemplates(),
        (d) => storage.createRoleTemplate(d),
        (id, d) => storage.updateRoleTemplate(id, d),
        "role",
        sanitizeRole,
        "name"
      );
      
      // 2. Second: Tasks (reference roles via assignedRoleId)
      await importTemplates(
        templates.task,
        () => storage.getTaskTemplates(),
        (d) => storage.createTaskTemplate(d),
        (id, d) => storage.updateTaskTemplate(id, d),
        "task",
        sanitizeTask,
        "title"
      );
      
      // 3. Third: Mappings (leaf template, no references)
      await importTemplates(
        templates.mapping,
        () => storage.getMappingTemplates(),
        (d) => storage.createMappingTemplate(d),
        (id, d) => storage.updateMappingTemplate(id, d),
        "mapping",
        undefined,
        "name"
      );

      // 4. Fourth: Stages (reference tasks and roles)
      await importTemplates(
        templates.stage,
        () => storage.getStageTemplates(),
        (d) => storage.createStageTemplate(d),
        (id, d) => storage.updateStageTemplate(id, d),
        "stage",
        sanitizeStage,
        "name"
      );

      // 5. Fifth: Milestones (reference stages via stageTemplateId)
      await importTemplates(
        templates.milestone,
        () => storage.getMilestoneTemplates(),
        (d) => storage.createMilestoneTemplate(d),
        (id, d) => storage.updateMilestoneTemplate(id, d),
        "milestone",
        sanitizeMilestone,
        "name"
      );

      // 6. Sixth: Epics (reference tasks and stages)
      await importTemplates(
        templates.epic,
        () => storage.getEpicTemplates(),
        (d) => storage.createEpicTemplate(d),
        (id, d) => storage.updateEpicTemplate(id, d),
        "epic",
        sanitizeEpic,
        "title"
      );

      // 7. Seventh: Deliverables (reference epics)
      await importTemplates(
        templates.deliverable,
        () => storage.getDeliverableTemplates(),
        (d) => storage.createDeliverableTemplate(d),
        (id, d) => storage.updateDeliverableTemplate(id, d),
        "deliverable",
        sanitizeDeliverable,
        "title"
      );

      // 8. Eighth: Frameworks (reference stages)
      await importTemplates(
        templates.framework,
        () => storage.getFrameworkTemplates(),
        (d) => storage.createFrameworkTemplate(d),
        (id, d) => storage.updateFrameworkTemplate(id, d),
        "framework",
        sanitizeFramework,
        "name"
      );

      // 9. Ninth: Projects (reference frameworks, deliverables, roles)
      await importTemplates(
        templates.project,
        () => storage.getProjectTemplates(),
        (d) => storage.createProjectTemplate(d),
        (id, d) => storage.updateProjectTemplate(id, d),
        "project",
        sanitizeProject,
        "name"
      );

      res.json({ success: true, results });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
}
