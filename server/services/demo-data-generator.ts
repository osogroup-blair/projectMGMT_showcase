import { storage } from "../data/storage";
import type { User, FrameworkTemplate, StageTemplate, MilestoneTemplate, TaskTemplate } from "@shared/schema";

// Demo project IDs - 7 projects total
const DEMO_PROJECT_IDS = {
  // Client Delivery Projects (3)
  CRM_IMPLEMENTATION: "demo-crm-implementation",
  DATA_WAREHOUSE: "demo-data-warehouse",
  CASE_MANAGEMENT: "demo-case-management",
  // Alliance Project (1)
  SERVICENOW_ALLIANCE: "demo-servicenow-alliance",
  // Internal Projects (2)
  WEBINAR_EXECUTION: "demo-webinar-execution",
  EMPLOYEE_ONSITE: "demo-employee-onsite",
  // Support Project (1)
  CLIENT_SUPPORT_OPS: "demo-client-support-ops",
};

// Demo user IDs  
const DEMO_USER_IDS = {
  ADMIN: "demo-admin",
  SOLUTION_CONSULTANT: "demo-solution-consultant",
  PRODUCT_DESIGNER: "demo-product-designer",
  DEVELOPER_LEAD: "demo-developer-lead",
  QA_ENGINEER: "demo-qa-engineer",
  DOC_MANAGER: "demo-documentation-manager",
  STAKEHOLDER: "demo-stakeholder",
  SUPPORT_LEAD: "demo-support-lead",
};

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// App Default task statuses - MUST match exactly what's in status_options table
const TASK_STATUS = {
  BACKLOGGED: "BACKLOGGED",
  NEXT_UP: "NEXT UP",
  IN_PROGRESS: "IN PROGRESS",
  BLOCKED: "BLOCKED",
  IN_REVIEW: "IN REVIEW",
  ACCEPTED: "ACCEPTED",
  DONE: "DONE",
  DEFERRED: "DEFERRED",
  ONGOING: "ONGOING",
  ARCHIVED: "ARCHIVED",
} as const;

// Epic/Deliverable status values
const EPIC_STATUS = {
  NOT_STARTED: "not-started",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
  BLOCKED: "blocked",
} as const;

// Stage mapping for Management Activities based on framework type
const STAGE_MAPPING: Record<string, Record<string, string>> = {
  // Delivery Framework: Requirements, Design, Development, QA, Documentation
  DELIVERY: {
    governance: "Development",
    communications: "Development",
    risk: "Requirements",
    change: "QA",
  },
  // Generic Project: Discover, Plan, Execute, Review, Deliver, Close
  GENERIC: {
    governance: "Execute",
    communications: "Execute",
    risk: "Plan",
    change: "Review",
  },
  // Alliance Partnership: Discovery, Evaluation, Negotiation, Integration, Launch
  ALLIANCE: {
    governance: "Integration",
    communications: "Launch",
    risk: "Evaluation",
    change: "Negotiation",
  },
  // Support Project: Normal Operations, Incident Response, Release Support, Stabilization
  SUPPORT: {
    governance: "Normal Operations",
    communications: "Normal Operations",
    risk: "Incident Response",
    change: "Stabilization",
  },
};

// Get Management Activities deliverable with correct stages for the framework
function getManagementActivitiesDeliverable(frameworkType: string, projectProgress: number): any {
  const stages = STAGE_MAPPING[frameworkType] || STAGE_MAPPING.GENERIC;
  const adjustedProgress = Math.min(projectProgress + 10, 80); // Management is usually slightly ahead

  return {
    title: "Management Activities",
    description: "Project governance, stakeholder communications, and risk management activities",
    status: EPIC_STATUS.IN_PROGRESS,
    progress: adjustedProgress,
    epics: [
      {
        title: "Project Governance",
        description: "Steering committee meetings, status reporting, and decision tracking",
        status: projectProgress > 30 ? EPIC_STATUS.IN_PROGRESS : EPIC_STATUS.NOT_STARTED,
        progress: Math.min(projectProgress + 20, 90),
        stage: stages.governance
      },
      {
        title: "Stakeholder Communications",
        description: "Regular updates, presentations, and stakeholder management",
        status: EPIC_STATUS.IN_PROGRESS,
        progress: Math.min(projectProgress + 15, 85),
        stage: stages.communications
      },
      {
        title: "Risk Management",
        description: "Risk identification, assessment, mitigation planning, and monitoring",
        status: projectProgress > 20 ? EPIC_STATUS.IN_PROGRESS : EPIC_STATUS.NOT_STARTED,
        progress: Math.min(projectProgress + 10, 70),
        stage: stages.risk
      },
      {
        title: "Change Management",
        description: "Change request handling and impact assessment",
        status: projectProgress > 50 ? EPIC_STATUS.IN_PROGRESS : EPIC_STATUS.NOT_STARTED,
        progress: Math.max(projectProgress - 20, 10),
        stage: stages.change
      },
    ],
  };
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export interface DemoDataResult {
  success: boolean;
  created: {
    users?: number;
    frameworks?: number;
    projects?: number;
    stages?: number;
    deliverables?: number;
    epics?: number;
    tasks?: number;
    milestones?: number;
    sprints?: number;
    pulseUpdates?: number;
    teamMembers?: number;
    projectRoles?: number;
  };
  errors?: string[];
}

// Demo users with fun, role-descriptive names (8 users for varied role assignments across 7 projects)
const DEMO_USERS = [
  {
    id: DEMO_USER_IDS.ADMIN,
    email: "demo.admin@prodCo.demo",
    firstName: "Alex",
    lastName: "the Admin",
    name: "Alex the Admin",
    jobTitle: "Project Director",
    systemRole: "admin",
  },
  {
    id: DEMO_USER_IDS.SOLUTION_CONSULTANT,
    email: "demo.solution.consultant@prodCo.demo",
    firstName: "Sam",
    lastName: "the Consultant",
    name: "Sam the Consultant",
    jobTitle: "Solution Consultant",
    systemRole: "member",
  },
  {
    id: DEMO_USER_IDS.PRODUCT_DESIGNER,
    email: "demo.product.designer@prodCo.demo",
    firstName: "Dana",
    lastName: "the Designer",
    name: "Dana the Designer",
    jobTitle: "Product Designer",
    systemRole: "member",
  },
  {
    id: DEMO_USER_IDS.DEVELOPER_LEAD,
    email: "demo.developer.lead@prodCo.demo",
    firstName: "Dev",
    lastName: "the Developer",
    name: "Dev the Developer",
    jobTitle: "Developer Lead",
    systemRole: "member",
  },
  {
    id: DEMO_USER_IDS.QA_ENGINEER,
    email: "demo.qa.engineer@prodCo.demo",
    firstName: "Quinn",
    lastName: "the QA",
    name: "Quinn the QA",
    jobTitle: "QA Engineer",
    systemRole: "member",
  },
  {
    id: DEMO_USER_IDS.DOC_MANAGER,
    email: "demo.doc.manager@prodCo.demo",
    firstName: "Doc",
    lastName: "the Writer",
    name: "Doc the Writer",
    jobTitle: "Documentation Manager",
    systemRole: "member",
  },
  {
    id: DEMO_USER_IDS.STAKEHOLDER,
    email: "demo.stakeholder@prodCo.demo",
    firstName: "Steve",
    lastName: "the Stakeholder",
    name: "Steve the Stakeholder",
    jobTitle: "Business Stakeholder",
    systemRole: "viewer",
  },
  {
    id: DEMO_USER_IDS.SUPPORT_LEAD,
    email: "demo.support.lead@prodCo.demo",
    firstName: "Sue",
    lastName: "the Support",
    name: "Sue the Support",
    jobTitle: "Support Lead",
    systemRole: "member",
  },
];

// Framework configurations
interface FrameworkConfig {
  name: string;
  stageNames: string[];
}

const FRAMEWORK_CONFIGS: Record<string, FrameworkConfig> = {
  DELIVERY: {
    name: "Delivery Framework",
    stageNames: ["Requirements", "Design", "Development", "QA", "Documentation"],
  },
  GENERIC: {
    name: "Generic Project",
    stageNames: ["Discover", "Plan", "Execute", "Review", "Deliver", "Close"],
  },
  ALLIANCE: {
    name: "Alliance Partnership Framework",
    stageNames: ["Discovery", "Evaluation", "Negotiation", "Integration", "Launch"],
  },
  SUPPORT: {
    name: "Support Project Framework",
    stageNames: ["Normal Operations", "Incident Response", "Release Support", "Stabilization"],
  },
};

export async function hasDemoData(): Promise<boolean> {
  try {
    const projects = await storage.getProjects();
    const hasProjects = projects.some(p => Object.values(DEMO_PROJECT_IDS).includes(p.id));
    const clients = await storage.getAllClients();
    const hasClient = clients.some((c: any) => c.id === "demo-client");
    return hasProjects || hasClient;
  } catch (error) {
    return false;
  }
}

export async function clearDemoData(): Promise<{ success: boolean; deleted: Record<string, number> }> {
  const deleted: Record<string, number> = {};

  try {
    // Delete all demo projects and their data
    for (const projectId of Object.values(DEMO_PROJECT_IDS)) {
      const projects = await storage.getProjects();
      const project = projects.find(p => p.id === projectId);

      if (project) {
        // Delete tasks and comments
        const tasks = await storage.getTasks();
        const projectTasks = tasks.filter(t => t.projectId === projectId);
        for (const task of projectTasks) {
          const comments = await storage.getCommentsByTaskId(task.id);
          for (const comment of comments) {
            await storage.deleteComment(comment.id);
            deleted.comments = (deleted.comments || 0) + 1;
          }
          await storage.deleteTask(task.id);
          deleted.tasks = (deleted.tasks || 0) + 1;
        }

        // Delete milestones
        const milestones = await storage.getMilestones();
        const projectMilestones = milestones.filter(m => m.projectId === projectId);
        for (const milestone of projectMilestones) {
          await storage.deleteMilestone(milestone.id);
          deleted.milestones = (deleted.milestones || 0) + 1;
        }

        // Delete sprints
        const sprints = await storage.getSprints();
        const projectSprints = sprints.filter(s => s.projectId === projectId);
        for (const sprint of projectSprints) {
          await storage.deleteSprint(sprint.id);
          deleted.sprints = (deleted.sprints || 0) + 1;
        }

        // Delete epics and deliverables
        const epics = await storage.getEpics();
        const deliverables = await storage.getDeliverables();
        const projectDeliverables = deliverables.filter(d => d.projectId === projectId);

        for (const deliverable of projectDeliverables) {
          const deliverableEpics = epics.filter(e => e.deliverableId === deliverable.id);
          for (const epic of deliverableEpics) {
            await storage.deleteEpic(epic.id);
            deleted.epics = (deleted.epics || 0) + 1;
          }
          await storage.deleteDeliverable(deliverable.id);
          deleted.deliverables = (deleted.deliverables || 0) + 1;
        }

        // Delete stages
        const stages = await storage.getProjectStages();
        const projectStages = stages.filter(s => s.projectId === projectId);
        for (const stage of projectStages) {
          await storage.deleteProjectStage(stage.id);
          deleted.stages = (deleted.stages || 0) + 1;
        }

        // Delete team members
        const teamMembers = await storage.getProjectTeamMembers(projectId);
        for (const member of teamMembers) {
          await storage.deleteProjectTeamMember(member.id);
          deleted.teamMembers = (deleted.teamMembers || 0) + 1;
        }

        // Delete project roles
        const projectRoles = await storage.getProjectRolesByProjectId(projectId);
        for (const role of projectRoles) {
          await storage.deleteProjectRole(role.id);
          deleted.projectRoles = (deleted.projectRoles || 0) + 1;
        }

        await storage.deleteProject(projectId);
        deleted.projects = (deleted.projects || 0) + 1;
      }
    }

    // Delete demo users
    for (const userId of Object.values(DEMO_USER_IDS)) {
      try {
        await storage.deleteUser(userId);
        deleted.users = (deleted.users || 0) + 1;
      } catch (e) {
        // User might not exist
      }
    }

    // Delete demo client
    try {
      await storage.deleteClient("demo-client");
      deleted.clients = (deleted.clients || 0) + 1;
    } catch (e) {
      // Client might not exist
    }

    // Reset app settings
    await storage.updateAppSettings({
      demoDataReady: false,
      demoLoginUserId: null,
    });

    return { success: true, deleted };
  } catch (error: any) {
    return { success: false, deleted };
  }
}

interface FrameworkData {
  id: string;
  name: string;
  stageTemplates: StageTemplate[];
  milestoneTemplates: MilestoneTemplate[];
  taskTemplates: TaskTemplate[];
}

async function loadFrameworks(): Promise<Record<string, FrameworkData>> {
  const frameworks: Record<string, FrameworkData> = {};
  let allFrameworkTemplates = await storage.getFrameworkTemplates();
  let allStageTemplates = await storage.getStageTemplates();
  const allMilestoneTemplates = await storage.getMilestoneTemplates();
  const allTaskTemplates = await storage.getTaskTemplates();

  // Auto-create missing framework templates for fresh databases
  for (const [key, config] of Object.entries(FRAMEWORK_CONFIGS)) {
    const existing = allFrameworkTemplates.find(f => f.name === config.name);
    if (!existing) {
      console.log(`[demo-data] Creating missing framework template: ${config.name}`);

      // Create stage templates for this framework
      const stageTemplateIds: string[] = [];
      for (let i = 0; i < config.stageNames.length; i++) {
        const stageName = config.stageNames[i];
        // Check if stage template already exists
        let stageTemplate = allStageTemplates.find(s => s.name === stageName);
        if (!stageTemplate) {
          const stageId = `st_${key.toLowerCase()}_${i + 1}`;
          stageTemplate = await storage.createStageTemplate({
            id: stageId,
            name: stageName,
            description: `${stageName} stage for ${config.name}`,
            defaultTasks: [],
            defaultRoles: [],
          } as any);
          allStageTemplates = [...allStageTemplates, stageTemplate];
        }
        stageTemplateIds.push(stageTemplate.id);
      }

      // Create the framework template
      const frameworkId = `fw_${key.toLowerCase()}`;
      const created = await storage.createFrameworkTemplate({
        id: frameworkId,
        name: config.name,
        description: `${config.name} - auto-created for demo data`,
        defaultStages: stageTemplateIds,
      } as any);
      allFrameworkTemplates = [...allFrameworkTemplates, created];
    }
  }

  // Ensure all stages have their default tasks (Repair/First Run)
  console.log(`[demo-data] Verifying task templates for stages...`);
  for (const [key, config] of Object.entries(FRAMEWORK_CONFIGS)) {
    for (const stageName of config.stageNames) {
      const stageTemplate = allStageTemplates.find(s => s.name === stageName);
      if (stageTemplate) {
        const taskTitles = getTaskTitlesForStage(stageName);
        const taskIds: string[] = [];
        let tasksChanged = false;

        for (const title of taskTitles) {
          let taskTemplate = allTaskTemplates.find(t => t.title === title);
          if (!taskTemplate) {
            console.log(`[demo-data] Creating task template: ${title}`);
            try {
              // Create task template if it doesn't exist
              const newId = `tt_${allTaskTemplates.length + taskIds.length + 1}_${Date.now()}`;
              taskTemplate = await storage.createTaskTemplate({
                id: newId,
                title,
                description: `Default task for ${stageName}`,
                defaultPriority: "Medium",
                defaultEstimateHours: 4,
                scope: "per_epic"
              } as any);
              allTaskTemplates.push(taskTemplate);
              tasksChanged = true;
            } catch (err) {
              console.error(`[demo-data] Failed to create task template ${title}:`, err);
              continue;
            }
          }
          if (taskTemplate) {
            taskIds.push(taskTemplate.id);
          }
        }

        // Update stage template if it has no tasks or fewer tasks than expected
        if (!stageTemplate.defaultTasks || stageTemplate.defaultTasks.length === 0 || (stageTemplate.defaultTasks.length < taskIds.length && tasksChanged)) {
          if (taskIds.length > 0) {
            console.log(`[demo-data] Update stage ${stageName} with ${taskIds.length} tasks`);
            await storage.updateStageTemplate(stageTemplate.id, {
              defaultTasks: taskIds
            });
            // Update local cache
            stageTemplate.defaultTasks = taskIds;
          }
        }
      }
    }
  }

  // Now load all frameworks with their templates
  for (const [key, config] of Object.entries(FRAMEWORK_CONFIGS)) {
    const template = allFrameworkTemplates.find(f => f.name === config.name);
    if (template) {
      const stageTemplates = template.defaultStages
        ?.map(stageId => allStageTemplates.find(s => s.id === stageId))
        .filter(Boolean) as StageTemplate[] || [];

      const milestoneTemplates = allMilestoneTemplates.filter(m =>
        stageTemplates.some(s => s.id === m.stageTemplateId)
      );

      const taskTemplateIds = new Set<string>();
      stageTemplates.forEach(s => {
        s.defaultTasks?.forEach(t => taskTemplateIds.add(t));
      });
      const taskTemplates = allTaskTemplates.filter(t => taskTemplateIds.has(t.id));

      frameworks[key] = {
        id: template.id,
        name: template.name,
        stageTemplates,
        milestoneTemplates,
        taskTemplates,
      };
    }
  }

  return frameworks;
}

export async function generateDemoData(clearFirst: boolean = true): Promise<DemoDataResult> {
  const result: DemoDataResult = {
    success: true,
    created: {},
    errors: [],
  };

  try {
    if (clearFirst) {
      await clearDemoData();
    }

    // 1. Create demo users (or update existing ones with new data)
    const demoUsers: User[] = [];
    for (const userData of DEMO_USERS) {
      try {
        const existingUsers = await storage.getUsers();
        const existing = existingUsers.find(u => u.id === userData.id);
        if (!existing) {
          // Create new user
          const user = await storage.createUser({
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            name: userData.name,
            jobTitle: userData.jobTitle,
            systemRole: userData.systemRole,
          } as any);
          await storage.updateUser(user.id, { id: userData.id } as any);
          demoUsers.push({ ...user, id: userData.id });
          result.created.users = (result.created.users || 0) + 1;
        } else {
          // Update existing user with current demo data (handles name changes)
          await storage.updateUser(existing.id, {
            firstName: userData.firstName,
            lastName: userData.lastName,
            name: userData.name,
            jobTitle: userData.jobTitle,
          });
          demoUsers.push({ ...existing, ...userData });
          // Don't increment created count - user already existed
        }
      } catch (e: any) {
        const existingUsers = await storage.getUsers();
        const existing = existingUsers.find(u => u.email === userData.email);
        if (existing) {
          demoUsers.push(existing);
        }
      }
    }

    // 1.5 Create Demo Client and assign users
    try {
      const existingClients = await storage.getAllClients();
      let demoClient = existingClients.find((c: any) => c.id === "demo-client");
      if (!demoClient) {
        demoClient = await storage.createClient({
          id: "demo-client",
          name: "Demo Client",
          description: "Default client for all demo users."
        } as any);
      }

      for (const user of demoUsers) {
        const userClients = await storage.getClientUsers(user.id);
        const alreadyAssigned = userClients.some(cu => cu.clientId === "demo-client");
        if (!alreadyAssigned) {
          await storage.createClientUser({
            id: generateId("cu"),
            clientId: "demo-client",
            userId: user.id,
            role: "member"
          } as any);
        }
      }
    } catch (e: any) {
      console.error("Failed to seed demo client", e);
    }

    // 2. Load framework templates from database
    const frameworks = await loadFrameworks();

    if (!frameworks.DELIVERY || !frameworks.GENERIC || !frameworks.ALLIANCE || !frameworks.SUPPORT) {
      result.errors?.push("Missing required framework templates. Please import frameworks first.");
      result.success = false;
      return result;
    }

    const now = new Date();

    // 3. Create Client Delivery Projects (3)
    await createCRMImplementation(result, demoUsers, frameworks.DELIVERY, now);
    await createDataWarehouseProject(result, demoUsers, frameworks.DELIVERY, now);
    await createCaseManagementProject(result, demoUsers, frameworks.DELIVERY, now);

    // 4. Create Alliance Project (1)
    await createServiceNowAllianceProject(result, demoUsers, frameworks.ALLIANCE, now);

    // 5. Create Internal Projects (2)
    await createWebinarExecutionProject(result, demoUsers, frameworks.GENERIC, now);
    await createEmployeeOnsiteProject(result, demoUsers, frameworks.GENERIC, now);

    // 6. Create Support Project (1)
    await createClientSupportOpsProject(result, demoUsers, frameworks.SUPPORT, now);

    // 7. Update app settings
    await storage.updateAppSettings({
      demoDataReady: true,
      demoLoginUserId: DEMO_USER_IDS.ADMIN,
    });

    return result;
  } catch (error: any) {
    result.success = false;
    result.errors?.push(error.message);
    return result;
  }
}

interface StageData {
  id: string;
  name: string;
  templateId: string;
  startDate: string;
  endDate: string;
}

interface SprintData {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface MilestoneData {
  id: string;
  name: string;
  stageName: string;
  stageId: string;
  targetDate: string;
  status: string;
}

async function createProjectWithFrameworkStages(
  projectId: string,
  projectData: any,
  framework: FrameworkData,
  startDate: Date,
  result: DemoDataResult
): Promise<{ stageIds: Record<string, string>; stages: StageData[] }> {
  const stageIds: Record<string, string> = {};
  const stages: StageData[] = [];

  // Create project
  await storage.createProject({
    id: projectId,
    ...projectData,
    frameworkId: framework.id,
  } as any);
  result.created.projects = (result.created.projects || 0) + 1;

  // Create stages from framework stage templates
  const projectDuration = 90;
  const stageDuration = projectDuration / framework.stageTemplates.length;

  for (let i = 0; i < framework.stageTemplates.length; i++) {
    const stageTemplate = framework.stageTemplates[i];
    const stageId = generateId("stage");
    stageIds[stageTemplate.name] = stageId;

    const stageStartOffset = i * stageDuration;
    const stageEndOffset = (i + 1) * stageDuration;
    const stageStartDate = addDays(startDate, stageStartOffset);
    const stageEndDate = addDays(startDate, stageEndOffset);

    let stageStatus = "pending";
    if (projectData.currentStageIndex !== undefined) {
      if (i < projectData.currentStageIndex) {
        stageStatus = "completed";
      } else if (i === projectData.currentStageIndex) {
        stageStatus = "active";
      }
    }

    await storage.createProjectStage({
      id: stageId,
      projectId,
      name: stageTemplate.name,
      description: stageTemplate.description || "",
      order: i + 1,
      type: "planning",
      status: stageStatus,
      startDate: toDateString(stageStartDate),
      endDate: toDateString(stageEndDate),
      stageTemplateId: stageTemplate.id,
    } as any);
    result.created.stages = (result.created.stages || 0) + 1;

    stages.push({
      id: stageId,
      name: stageTemplate.name,
      templateId: stageTemplate.id,
      startDate: toDateString(stageStartDate),
      endDate: toDateString(stageEndDate),
    });
  }

  return { stageIds, stages };
}

interface TeamMemberConfig {
  userId: string;
  highLevelRole: 'owner' | 'manager' | 'stakeholder' | 'member';
  executionRole?: string;
  allocationPercent?: number;
}

async function createTeamMembersForProject(
  projectId: string,
  teamConfigs: TeamMemberConfig[],
  result: DemoDataResult
): Promise<void> {
  const existingRoles = await storage.getProjectRolesByProjectId(projectId);
  const roleMap: Record<string, string> = {};
  const roleTemplates = await storage.getRoleTemplates();

  for (const config of teamConfigs) {
    if (config.executionRole && !existingRoles.find(r => r.name === config.executionRole)) {
      const template = roleTemplates.find(t => t.id === config.executionRole);
      if (template && !roleMap[config.executionRole]) {
        const role = await storage.createProjectRole({
          projectId,
          name: template.name,
          description: template.description || "",
          roleType: template.defaultRoleType || "Development",
          templateId: template.id,
        } as any);
        roleMap[config.executionRole] = role.id;
        result.created.projectRoles = (result.created.projectRoles || 0) + 1;
      }
    }
  }

  for (const config of teamConfigs) {
    const teamMember = await storage.createProjectTeamMember({
      projectId,
      userId: config.userId,
      allocationPercent: config.allocationPercent || 100,
    } as any);
    result.created.teamMembers = (result.created.teamMembers || 0) + 1;

    await storage.createHighLevelRole({
      teamMemberId: teamMember.id,
      roleType: config.highLevelRole,
    } as any);

    if (config.executionRole) {
      const template = roleTemplates.find(t => t.id === config.executionRole);
      const existingRole = existingRoles.find(r => r.name === template?.name);
      const roleId = existingRole?.id || roleMap[config.executionRole];
      if (roleId) {
        await storage.createExecutionRoleAssignment({
          teamMemberId: teamMember.id,
          roleId,
          isPrimary: true,
        } as any);
      }
    }
  }
}

// Pulse update content templates for realistic demo data
const PULSE_DID_TEMPLATES = [
  "Completed code review for the {feature} module",
  "Fixed bug in {feature} - validation was not working correctly",
  "Implemented {feature} API endpoints",
  "Updated documentation for {feature}",
  "Pair programming session on {feature} with the team",
  "Refactored {feature} component for better performance",
  "Wrote unit tests for {feature} module",
  "Attended standup and planning meeting",
  "Deployed {feature} to staging environment",
  "Addressed feedback from stakeholder review",
  "Completed data migration script for {feature}",
  "Integrated {feature} with the main application",
];

const PULSE_NEXT_TEMPLATES = [
  "Continue working on {feature} implementation",
  "Start integration testing for {feature}",
  "Review PR from team member on {feature}",
  "Begin work on {feature} UI components",
  "Write acceptance criteria for {feature}",
  "Finish remaining tasks for {feature}",
  "Address code review feedback on {feature}",
  "Prepare demo for {feature} functionality",
  "Update tests after recent changes to {feature}",
  "Sync with QA on {feature} testing status",
];

const PULSE_BLOCKER_TEMPLATES = [
  "Waiting on API documentation from backend team",
  "Need design clarification for {feature} edge cases",
  "Blocked by missing access credentials",
  "Waiting for stakeholder approval on approach",
  "", // No blocker
  "", // No blocker
  "", // No blocker - most entries won't have blockers
  "", // No blocker
];

const FEATURE_NAMES = [
  "user authentication", "dashboard", "reporting", "contact management",
  "data import", "notifications", "search functionality", "permissions",
  "API integration", "file upload", "billing", "analytics"
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePulseText(template: string): string {
  const feature = getRandomItem(FEATURE_NAMES);
  return template.replace("{feature}", feature);
}

async function createPulseUpdatesForSprint(
  sprintId: string,
  sprintStartDate: Date,
  sprintEndDate: Date,
  teamUserIds: string[],
  result: DemoDataResult
): Promise<void> {
  const today = new Date();
  const daysInSprint = Math.ceil((sprintEndDate.getTime() - sprintStartDate.getTime()) / (1000 * 60 * 60 * 24));

  // Generate pulse updates for each day up to today (or sprint end if in past)
  const endDate = sprintEndDate < today ? sprintEndDate : today;

  for (let dayOffset = 0; dayOffset < daysInSprint; dayOffset++) {
    const updateDate = addDays(sprintStartDate, dayOffset);

    // Skip future dates
    if (updateDate > endDate) break;

    // Skip weekends
    const dayOfWeek = updateDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    // Each team member submits a pulse update (not everyone every day - 70% chance)
    for (const userId of teamUserIds) {
      if (Math.random() > 0.7) continue; // 30% chance to skip this day

      const pulseId = generateId("pulse");
      const didText = generatePulseText(getRandomItem(PULSE_DID_TEMPLATES));
      const nextText = generatePulseText(getRandomItem(PULSE_NEXT_TEMPLATES));
      const blockerText = generatePulseText(getRandomItem(PULSE_BLOCKER_TEMPLATES));

      await storage.createSprintPulseUpdate({
        id: pulseId,
        sprintId,
        userId,
        date: toDateString(updateDate),
        didText,
        nextText,
        blockersText: blockerText || null,
        referencedTaskIds: [],
      } as any);
      result.created.pulseUpdates = (result.created.pulseUpdates || 0) + 1;
    }
  }
}

async function createSprintsForProject(
  projectId: string,
  sprintConfigs: Array<{ name: string; goal: string; startOffset: number; endOffset: number; status: string }>,
  projectStartDate: Date,
  demoUsers: User[],
  result: DemoDataResult
): Promise<SprintData[]> {
  const sprints: SprintData[] = [];

  for (const config of sprintConfigs) {
    const sprintId = generateId("sprint");
    const startDate = addDays(projectStartDate, config.startOffset);
    const endDate = addDays(projectStartDate, config.endOffset);

    await storage.createSprint({
      id: sprintId,
      projectId,
      name: config.name,
      goal: config.goal,
      startDate: toDateString(startDate),
      endDate: toDateString(endDate),
      status: config.status,
      capacityHours: 160,
    } as any);
    result.created.sprints = (result.created.sprints || 0) + 1;

    // Create pulse updates for active and completed sprints
    if (config.status === "active" || config.status === "completed") {
      const teamUserIds = demoUsers.slice(1, 6).map(u => u.id); // Use team members, not admin
      await createPulseUpdatesForSprint(sprintId, startDate, endDate, teamUserIds, result);
    }

    sprints.push({
      id: sprintId,
      name: config.name,
      startDate: toDateString(startDate),
      endDate: toDateString(endDate),
      status: config.status,
    });
  }

  return sprints;
}

async function createMilestonesForProject(
  projectId: string,
  milestoneConfigs: Array<{ name: string; description: string; stageName: string; targetOffset: number; status: string; ownerIndex: number }>,
  projectStartDate: Date,
  stageIds: Record<string, string>,
  demoUsers: User[],
  result: DemoDataResult
): Promise<MilestoneData[]> {
  const milestones: MilestoneData[] = [];

  for (const config of milestoneConfigs) {
    const milestoneId = generateId("ms");
    const targetDate = addDays(projectStartDate, config.targetOffset);
    const stageId = stageIds[config.stageName];

    await storage.createMilestone({
      id: milestoneId,
      projectId,
      name: config.name,
      description: config.description,
      stageId,
      targetDate: toDateString(targetDate),
      status: config.status,
      ownerId: demoUsers[config.ownerIndex]?.id,
      scopeType: "filtered",
      completionMode: "percentage",
      completionTargetPercent: 100,
      isBillingGate: false,
      scopeRules: [
        {
          id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          label: `${config.stageName} Tasks`,
          stageFilter: config.stageName,
          epicTypeFilter: "",
          taskTemplateFilter: "",
          isActive: true,
        }
      ],
    } as any);
    result.created.milestones = (result.created.milestones || 0) + 1;

    milestones.push({
      id: milestoneId,
      name: config.name,
      stageName: config.stageName,
      stageId,
      targetDate: toDateString(targetDate),
      status: config.status,
    });
  }

  return milestones;
}

async function createDeliverablesWithEpicsAndTasks(
  projectId: string,
  projectName: string,
  deliverables: any[],
  stageIds: Record<string, string>,
  stages: StageData[],
  sprints: SprintData[],
  milestones: MilestoneData[],
  demoUsers: User[],
  projectStartDate: Date,
  result: DemoDataResult
): Promise<void> {
  function findSprintForTask(taskStartDate: Date, taskDeadline: Date): { sprintId: string | undefined; sprintStatus: string | undefined } {
    if (sprints.length === 0) return { sprintId: undefined, sprintStatus: undefined };

    const taskMidpoint = (taskStartDate.getTime() + taskDeadline.getTime()) / 2;

    for (const sprint of sprints) {
      const sprintStart = new Date(sprint.startDate).getTime();
      const sprintEnd = new Date(sprint.endDate).getTime();

      if (taskMidpoint >= sprintStart && taskMidpoint <= sprintEnd) {
        return { sprintId: sprint.id, sprintStatus: sprint.status };
      }
    }

    let closestSprint = sprints[0];
    if (!closestSprint?.startDate) return { sprintId: sprints[0]?.id, sprintStatus: sprints[0]?.status };

    let closestDistance = Math.abs(taskMidpoint - new Date(closestSprint.startDate).getTime());

    for (const sprint of sprints) {
      if (!sprint.startDate) continue;
      const distance = Math.abs(taskMidpoint - new Date(sprint.startDate).getTime());
      if (distance < closestDistance) {
        closestDistance = distance;
        closestSprint = sprint;
      }
    }

    return { sprintId: closestSprint?.id, sprintStatus: closestSprint?.status };
  }

  function findMilestoneForStage(stageName: string): string | undefined {
    const milestone = milestones.find(m => m.stageName === stageName);
    return milestone?.id;
  }

  let dayOffset = 0;
  for (const delConfig of deliverables) {
    const deliverableId = generateId("del");

    await storage.createDeliverable({
      id: deliverableId,
      projectId,
      title: delConfig.title,
      description: delConfig.description,
      status: delConfig.status,
      progress: delConfig.progress,
      ownerId: demoUsers[0]?.id,
      startDate: toDateString(addDays(projectStartDate, dayOffset)),
      dueDate: toDateString(addDays(projectStartDate, dayOffset + 30)),
    } as any);
    result.created.deliverables = (result.created.deliverables || 0) + 1;

    for (const epicConfig of delConfig.epics || []) {
      const epicId = generateId("epic");
      const stageId = stageIds[epicConfig.stage];
      const stage = stages.find(s => s.name === epicConfig.stage);

      await storage.createEpic({
        id: epicId,
        deliverableId,
        title: epicConfig.title,
        description: epicConfig.description,
        status: epicConfig.status,
        progress: epicConfig.progress,
        stageId,
        ownerId: demoUsers[1]?.id,
      } as any);
      result.created.epics = (result.created.epics || 0) + 1;

      // Create tasks for each epic
      const taskCount = Math.floor(Math.random() * 3) + 2; // 2-4 tasks per epic
      const taskTitles = getTaskTitlesForStage(epicConfig.stage);

      for (let i = 0; i < taskCount && i < taskTitles.length; i++) {
        const taskId = generateId("task");
        const taskStartOffset = dayOffset + (i * 3);
        const taskEndOffset = taskStartOffset + 5;
        const taskStartDate = addDays(projectStartDate, taskStartOffset);
        const taskDeadline = addDays(projectStartDate, taskEndOffset);

        const { sprintId, sprintStatus } = findSprintForTask(taskStartDate, taskDeadline);
        const milestoneId = findMilestoneForStage(epicConfig.stage);

        // Determine task status based on epic progress - using App Default statuses
        let taskStatus: string = TASK_STATUS.BACKLOGGED;
        if (epicConfig.progress >= 100) {
          taskStatus = TASK_STATUS.DONE;
        } else if (epicConfig.progress > 0) {
          const taskProgress = (i / taskCount) * 100;
          if (taskProgress < epicConfig.progress * 0.8) {
            taskStatus = TASK_STATUS.DONE;
          } else if (taskProgress < epicConfig.progress) {
            taskStatus = TASK_STATUS.IN_PROGRESS;
          } else if (taskProgress < epicConfig.progress * 1.2) {
            taskStatus = TASK_STATUS.NEXT_UP;
          } else {
            taskStatus = TASK_STATUS.BACKLOGGED;
          }
        }

        const userIndex = (i % (demoUsers.length - 1)) + 1;

        await storage.createTask({
          id: taskId,
          project: projectName,
          projectId,
          epicId,
          title: taskTitles[i],
          description: `Task for ${epicConfig.title}`,
          status: taskStatus,
          priority: i === 0 ? "high" : "medium",
          stageId,
          assigneeId: demoUsers[userIndex]?.id,
          reporterId: demoUsers[0]?.id,
          startDate: toDateString(taskStartDate),
          deadline: toDateString(taskDeadline),
          estimatedHours: 4 + (i * 2),
          sprintId,
          milestoneId,
        } as any);
        result.created.tasks = (result.created.tasks || 0) + 1;
      }
    }

    dayOffset += 15;
  }
}

function getTaskTitlesForStage(stageName: string): string[] {
  const tasksByStage: Record<string, string[]> = {
    // Delivery Framework stages
    "Requirements": [
      "Gather stakeholder requirements",
      "Document business rules",
      "Create user stories",
      "Define acceptance criteria",
      "Review with stakeholders",
    ],
    "Design": [
      "Create wireframes",
      "Design mockups",
      "Review UI patterns",
      "Prototype interactions",
      "Design system documentation",
    ],
    "Development": [
      "Implement core functionality",
      "Build API endpoints",
      "Create frontend components",
      "Write unit tests",
      "Code review",
    ],
    "QA": [
      "Create test plan",
      "Execute test cases",
      "Bug verification",
      "Regression testing",
      "Performance testing",
    ],
    "Documentation": [
      "Write user guide",
      "Create API documentation",
      "Update help content",
      "Release notes",
      "Training materials",
    ],
    // Generic Project stages
    "Discover": [
      "Research requirements",
      "Stakeholder interviews",
      "Competitive analysis",
      "Define success criteria",
      "Initial assessment",
    ],
    "Plan": [
      "Create project plan",
      "Define milestones",
      "Resource allocation",
      "Risk assessment",
      "Communication plan",
    ],
    "Execute": [
      "Execute deliverables",
      "Team coordination",
      "Progress tracking",
      "Issue resolution",
      "Quality checks",
    ],
    "Review": [
      "Progress review",
      "Quality assessment",
      "Stakeholder feedback",
      "Adjustment planning",
      "Lessons learned",
    ],
    "Deliver": [
      "Final deliverables",
      "Acceptance testing",
      "Stakeholder sign-off",
      "Handover documentation",
      "Training delivery",
    ],
    "Close": [
      "Project closure",
      "Final documentation",
      "Archive materials",
      "Team recognition",
      "Post-project review",
    ],
    // Alliance stages
    "Discovery": [
      "Partner research",
      "Market analysis",
      "Initial outreach",
      "Capability assessment",
      "Fit evaluation",
    ],
    "Evaluation": [
      "Technical assessment",
      "Business alignment",
      "Integration feasibility",
      "Risk analysis",
      "POC planning",
    ],
    "Negotiation": [
      "Draft term sheet",
      "Legal review",
      "Commercial terms",
      "SLA definition",
      "Final negotiation",
    ],
    "Integration": [
      "Technical integration",
      "API development",
      "Testing & validation",
      "Documentation",
      "Training preparation",
    ],
    "Launch": [
      "Go-to-market plan",
      "Press release",
      "Partner announcement",
      "Sales enablement",
      "Customer communication",
    ],
    // Support stages
    "Normal Operations": [
      "Triage tickets",
      "Resolve issues",
      "Knowledge updates",
      "Metrics reporting",
      "Process improvement",
    ],
    "Incident Response": [
      "Incident triage",
      "Impact assessment",
      "Issue containment",
      "Resolution actions",
      "Stakeholder communication",
    ],
    "Release Support": [
      "Monitor release",
      "Track issues",
      "Hotfix coordination",
      "User feedback",
      "Stability verification",
    ],
    "Stabilization": [
      "Cleanup issues",
      "Root cause analysis",
      "Preventative actions",
      "Documentation update",
      "Process improvement",
    ],
  };

  return tasksByStage[stageName] || ["Task 1", "Task 2", "Task 3", "Task 4"];
}

// ==================== CLIENT DELIVERY PROJECTS ====================

async function createCRMImplementation(
  result: DemoDataResult,
  demoUsers: User[],
  framework: FrameworkData,
  now: Date
): Promise<void> {
  const projectId = DEMO_PROJECT_IDS.CRM_IMPLEMENTATION;
  const startDate = addDays(now, -60);
  const deadline = addDays(now, 30);

  const { stageIds, stages } = await createProjectWithFrameworkStages(
    projectId,
    {
      name: "CRM Implementation",
      description: "Enterprise CRM implementation for Acme Corp featuring contact management, sales pipeline, opportunity tracking, and reporting dashboards. Full deployment with data migration and user training.",
      status: "active",
      startDate: toDateString(startDate),
      deadline: toDateString(deadline),
      progress: 60,
      ownerId: demoUsers[0]?.id,
      client: "Acme Corporation",
      riskLevel: "low",
      sprintDurationWeeks: 2,
      currentStageIndex: 2,
    },
    framework,
    startDate,
    result
  );

  const sprintConfigs = [
    { name: "Sprint 1", goal: "Requirements and initial design", startOffset: 0, endOffset: 14, status: "completed" },
    { name: "Sprint 2", goal: "Design completion", startOffset: 14, endOffset: 28, status: "completed" },
    { name: "Sprint 3", goal: "Core development", startOffset: 28, endOffset: 42, status: "completed" },
    { name: "Sprint 4", goal: "Feature development", startOffset: 42, endOffset: 56, status: "active" },
    { name: "Sprint 5", goal: "QA and polish", startOffset: 56, endOffset: 70, status: "planned" },
  ];
  const sprints = await createSprintsForProject(projectId, sprintConfigs, startDate, demoUsers, result);

  const milestoneConfigs = [
    { name: "Requirements Complete", description: "All requirements documented and approved", stageName: "Requirements", targetOffset: 18, status: "completed", ownerIndex: 1 },
    { name: "Design Sign-off", description: "All designs approved by stakeholders", stageName: "Design", targetOffset: 36, status: "completed", ownerIndex: 2 },
    { name: "Beta Release", description: "Internal beta testing ready", stageName: "Development", targetOffset: 67, status: "on-track", ownerIndex: 3 },
    { name: "Go Live", description: "Production release", stageName: "Documentation", targetOffset: 90, status: "pending", ownerIndex: 5 },
  ];
  const milestones = await createMilestonesForProject(projectId, milestoneConfigs, startDate, stageIds, demoUsers, result);

  const deliverables = [
    {
      title: "Contact Management Module",
      description: "Core contact and company management features including import, search, and relationship mapping",
      status: EPIC_STATUS.IN_PROGRESS,
      progress: 70,
      epics: [
        { title: "Contact CRUD", description: "Create, read, update, delete contacts", status: EPIC_STATUS.COMPLETED, progress: 100, stage: "Development" },
        { title: "Company Profiles", description: "Company management and linking", status: EPIC_STATUS.IN_PROGRESS, progress: 60, stage: "Development" },
        { title: "Contact Import", description: "Bulk import from CSV/Excel", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Development" },
      ],
    },
    {
      title: "Sales Pipeline",
      description: "Deal tracking, pipeline visualization, and sales forecasting",
      status: EPIC_STATUS.IN_PROGRESS,
      progress: 40,
      epics: [
        { title: "Pipeline Stages", description: "Customizable sales stages", status: EPIC_STATUS.COMPLETED, progress: 100, stage: "Design" },
        { title: "Deal Management", description: "Deal creation and tracking", status: EPIC_STATUS.IN_PROGRESS, progress: 50, stage: "Development" },
        { title: "Pipeline Analytics", description: "Sales funnel visualization", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Design" },
      ],
    },
    {
      title: "Reporting Dashboard",
      description: "Real-time sales metrics and KPI dashboards",
      status: EPIC_STATUS.NOT_STARTED,
      progress: 10,
      epics: [
        { title: "Dashboard Framework", description: "Widget-based dashboard system", status: EPIC_STATUS.COMPLETED, progress: 100, stage: "Requirements" },
        { title: "Sales Reports", description: "Standard sales reports", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Development" },
        { title: "Custom Reports", description: "User-defined report builder", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Design" },
      ],
    },
    getManagementActivitiesDeliverable("DELIVERY", 60),
  ];

  await createDeliverablesWithEpicsAndTasks(projectId, "CRM Implementation", deliverables, stageIds, stages, sprints, milestones, demoUsers, startDate, result);

  const team: TeamMemberConfig[] = [
    { userId: DEMO_USER_IDS.ADMIN, highLevelRole: 'owner' },
    { userId: DEMO_USER_IDS.SOLUTION_CONSULTANT, highLevelRole: 'manager', executionRole: 'rt_solution_consultant' },
    { userId: DEMO_USER_IDS.PRODUCT_DESIGNER, highLevelRole: 'member', executionRole: 'rt_product_designer' },
    { userId: DEMO_USER_IDS.DEVELOPER_LEAD, highLevelRole: 'member', executionRole: 'rt_dev_lead' },
    { userId: DEMO_USER_IDS.QA_ENGINEER, highLevelRole: 'member', executionRole: 'rt_qa_engineer' },
    { userId: DEMO_USER_IDS.DOC_MANAGER, highLevelRole: 'member', executionRole: 'rt_documentation_manager' },
    { userId: DEMO_USER_IDS.STAKEHOLDER, highLevelRole: 'stakeholder' },
  ];
  await createTeamMembersForProject(projectId, team, result);
}

async function createDataWarehouseProject(
  result: DemoDataResult,
  demoUsers: User[],
  framework: FrameworkData,
  now: Date
): Promise<void> {
  const projectId = DEMO_PROJECT_IDS.DATA_WAREHOUSE;
  const startDate = addDays(now, -35);
  const deadline = addDays(now, 55);

  const { stageIds, stages } = await createProjectWithFrameworkStages(
    projectId,
    {
      name: "Data Warehouse Implementation",
      description: "Enterprise data warehouse implementation for GlobalTech Inc. Includes ETL pipelines, dimensional modeling, and BI integration for unified analytics across sales, marketing, and operations.",
      status: "active",
      startDate: toDateString(startDate),
      deadline: toDateString(deadline),
      progress: 35,
      ownerId: demoUsers[1]?.id,
      client: "GlobalTech Inc",
      riskLevel: "medium",
      sprintDurationWeeks: 2,
      currentStageIndex: 1,
    },
    framework,
    startDate,
    result
  );

  const sprintConfigs = [
    { name: "Sprint 1", goal: "Requirements and data discovery", startOffset: 0, endOffset: 14, status: "completed" },
    { name: "Sprint 2", goal: "Data model design", startOffset: 14, endOffset: 28, status: "completed" },
    { name: "Sprint 3", goal: "ETL pipeline development", startOffset: 28, endOffset: 42, status: "active" },
    { name: "Sprint 4", goal: "BI integration", startOffset: 42, endOffset: 56, status: "planned" },
  ];
  const sprints = await createSprintsForProject(projectId, sprintConfigs, startDate, demoUsers, result);

  const milestoneConfigs = [
    { name: "Data Discovery Complete", description: "All source systems documented", stageName: "Requirements", targetOffset: 14, status: "completed", ownerIndex: 1 },
    { name: "Data Model Approved", description: "Dimensional model approved", stageName: "Design", targetOffset: 28, status: "on-track", ownerIndex: 2 },
    { name: "ETL Pipeline Complete", description: "All ETL jobs operational", stageName: "Development", targetOffset: 56, status: "pending", ownerIndex: 3 },
    { name: "BI Go-Live", description: "Dashboard deployment", stageName: "Documentation", targetOffset: 75, status: "pending", ownerIndex: 5 },
  ];
  const milestones = await createMilestonesForProject(projectId, milestoneConfigs, startDate, stageIds, demoUsers, result);

  const deliverables = [
    {
      title: "Data Model",
      description: "Dimensional data model with fact and dimension tables",
      status: EPIC_STATUS.IN_PROGRESS,
      progress: 60,
      epics: [
        { title: "Source Analysis", description: "Analyze source system data", status: EPIC_STATUS.COMPLETED, progress: 100, stage: "Requirements" },
        { title: "Dimensional Model", description: "Star schema design", status: EPIC_STATUS.IN_PROGRESS, progress: 70, stage: "Design" },
        { title: "Data Dictionary", description: "Complete data documentation", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Documentation" },
      ],
    },
    {
      title: "ETL Pipeline",
      description: "Extract, transform, load processes for all data sources",
      status: EPIC_STATUS.IN_PROGRESS,
      progress: 25,
      epics: [
        { title: "Sales ETL", description: "Sales data integration", status: EPIC_STATUS.IN_PROGRESS, progress: 40, stage: "Development" },
        { title: "Marketing ETL", description: "Marketing data integration", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Development" },
        { title: "Operations ETL", description: "Operations data integration", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Development" },
      ],
    },
    {
      title: "BI Dashboards",
      description: "Executive and operational dashboards",
      status: EPIC_STATUS.NOT_STARTED,
      progress: 5,
      epics: [
        { title: "Executive Dashboard", description: "C-suite KPI dashboard", status: EPIC_STATUS.IN_PROGRESS, progress: 15, stage: "Design" },
        { title: "Sales Analytics", description: "Sales performance dashboards", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Design" },
        { title: "Self-Service BI", description: "Ad-hoc reporting", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Requirements" },
      ],
    },
    getManagementActivitiesDeliverable("DELIVERY", 35),
  ];

  await createDeliverablesWithEpicsAndTasks(projectId, "Data Warehouse Implementation", deliverables, stageIds, stages, sprints, milestones, demoUsers, startDate, result);

  const team: TeamMemberConfig[] = [
    { userId: DEMO_USER_IDS.SOLUTION_CONSULTANT, highLevelRole: 'owner', executionRole: 'rt_solution_consultant' },
    { userId: DEMO_USER_IDS.ADMIN, highLevelRole: 'manager' },
    { userId: DEMO_USER_IDS.DEVELOPER_LEAD, highLevelRole: 'member', executionRole: 'rt_dev_lead' },
    { userId: DEMO_USER_IDS.QA_ENGINEER, highLevelRole: 'member', executionRole: 'rt_qa_engineer' },
    { userId: DEMO_USER_IDS.STAKEHOLDER, highLevelRole: 'stakeholder' },
  ];
  await createTeamMembersForProject(projectId, team, result);
}

async function createCaseManagementProject(
  result: DemoDataResult,
  demoUsers: User[],
  framework: FrameworkData,
  now: Date
): Promise<void> {
  const projectId = DEMO_PROJECT_IDS.CASE_MANAGEMENT;
  const startDate = addDays(now, -10);
  const deadline = addDays(now, 80);

  const { stageIds, stages } = await createProjectWithFrameworkStages(
    projectId,
    {
      name: "Case Management System",
      description: "Custom case management solution for Riverside Legal Group. Features matter tracking, document management, billing integration, and client portal with automated workflow and deadline management.",
      status: "active",
      startDate: toDateString(startDate),
      deadline: toDateString(deadline),
      progress: 15,
      ownerId: demoUsers[0]?.id,
      client: "Riverside Legal Group",
      riskLevel: "low",
      sprintDurationWeeks: 2,
      currentStageIndex: 0,
    },
    framework,
    startDate,
    result
  );

  const sprintConfigs = [
    { name: "Sprint 1", goal: "Discovery and requirements", startOffset: 0, endOffset: 14, status: "active" },
    { name: "Sprint 2", goal: "Requirements finalization", startOffset: 14, endOffset: 28, status: "planned" },
    { name: "Sprint 3", goal: "Design phase", startOffset: 28, endOffset: 42, status: "planned" },
  ];
  const sprints = await createSprintsForProject(projectId, sprintConfigs, startDate, demoUsers, result);

  const milestoneConfigs = [
    { name: "Requirements Kickoff", description: "Project kickoff complete", stageName: "Requirements", targetOffset: 3, status: "completed", ownerIndex: 0 },
    { name: "Requirements Sign-off", description: "All requirements approved", stageName: "Requirements", targetOffset: 28, status: "on-track", ownerIndex: 1 },
    { name: "Design Complete", description: "UI/UX finalized", stageName: "Design", targetOffset: 45, status: "pending", ownerIndex: 2 },
    { name: "MVP Delivery", description: "Core functionality delivered", stageName: "Development", targetOffset: 70, status: "pending", ownerIndex: 3 },
  ];
  const milestones = await createMilestonesForProject(projectId, milestoneConfigs, startDate, stageIds, demoUsers, result);

  const deliverables = [
    {
      title: "Matter Management",
      description: "Core case/matter tracking and management",
      status: EPIC_STATUS.IN_PROGRESS,
      progress: 25,
      epics: [
        { title: "Matter Data Model", description: "Case structure and fields", status: EPIC_STATUS.IN_PROGRESS, progress: 50, stage: "Requirements" },
        { title: "Matter Workflow", description: "Status and lifecycle management", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Requirements" },
        { title: "Matter Search", description: "Advanced search and filtering", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Design" },
      ],
    },
    {
      title: "Document Management",
      description: "Document storage, versioning, and organization",
      status: EPIC_STATUS.NOT_STARTED,
      progress: 5,
      epics: [
        { title: "Document Upload", description: "File upload and storage", status: EPIC_STATUS.IN_PROGRESS, progress: 20, stage: "Requirements" },
        { title: "Document Organization", description: "Folder structure and tagging", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Requirements" },
        { title: "Version Control", description: "Document versioning", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Design" },
      ],
    },
    {
      title: "Client Portal",
      description: "Self-service client access portal",
      status: EPIC_STATUS.NOT_STARTED,
      progress: 0,
      epics: [
        { title: "Portal Authentication", description: "Secure client login", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Requirements" },
        { title: "Case View", description: "Client case visibility", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Design" },
        { title: "Communication", description: "Secure messaging", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Requirements" },
      ],
    },
    getManagementActivitiesDeliverable("DELIVERY", 15),
  ];

  await createDeliverablesWithEpicsAndTasks(projectId, "Case Management System", deliverables, stageIds, stages, sprints, milestones, demoUsers, startDate, result);

  const team: TeamMemberConfig[] = [
    { userId: DEMO_USER_IDS.ADMIN, highLevelRole: 'owner' },
    { userId: DEMO_USER_IDS.SOLUTION_CONSULTANT, highLevelRole: 'manager', executionRole: 'rt_solution_consultant' },
    { userId: DEMO_USER_IDS.PRODUCT_DESIGNER, highLevelRole: 'member', executionRole: 'rt_product_designer' },
    { userId: DEMO_USER_IDS.DEVELOPER_LEAD, highLevelRole: 'member', executionRole: 'rt_dev_lead' },
    { userId: DEMO_USER_IDS.STAKEHOLDER, highLevelRole: 'stakeholder' },
  ];
  await createTeamMembersForProject(projectId, team, result);
}

// ==================== ALLIANCE PROJECT ====================

async function createServiceNowAllianceProject(
  result: DemoDataResult,
  demoUsers: User[],
  framework: FrameworkData,
  now: Date
): Promise<void> {
  const projectId = DEMO_PROJECT_IDS.SERVICENOW_ALLIANCE;
  const startDate = addDays(now, -28);
  const deadline = addDays(now, 62);

  const { stageIds, stages } = await createProjectWithFrameworkStages(
    projectId,
    {
      name: "ServiceNow Alliance Engagement",
      description: "Strategic partnership initiative with ServiceNow to become a certified implementation partner. Includes technical certification, joint solution development, and go-to-market collaboration.",
      status: "active",
      startDate: toDateString(startDate),
      deadline: toDateString(deadline),
      progress: 40,
      ownerId: demoUsers[0]?.id,
      client: "ServiceNow Partnership",
      riskLevel: "medium",
      sprintDurationWeeks: 2,
      currentStageIndex: 1,
    },
    framework,
    startDate,
    result
  );

  const sprintConfigs = [
    { name: "Sprint 1", goal: "Partner discovery and alignment", startOffset: 0, endOffset: 14, status: "completed" },
    { name: "Sprint 2", goal: "Technical evaluation", startOffset: 14, endOffset: 28, status: "completed" },
    { name: "Sprint 3", goal: "Partnership proposal", startOffset: 28, endOffset: 42, status: "active" },
    { name: "Sprint 4", goal: "Agreement negotiation", startOffset: 42, endOffset: 56, status: "planned" },
  ];
  const sprints = await createSprintsForProject(projectId, sprintConfigs, startDate, demoUsers, result);

  const milestoneConfigs = [
    { name: "Partner Alignment", description: "Strategic alignment confirmed", stageName: "Discovery", targetOffset: 14, status: "completed", ownerIndex: 0 },
    { name: "Technical Assessment Complete", description: "Certification requirements mapped", stageName: "Evaluation", targetOffset: 28, status: "on-track", ownerIndex: 1 },
    { name: "Partnership Agreement", description: "Terms agreed", stageName: "Negotiation", targetOffset: 50, status: "pending", ownerIndex: 0 },
    { name: "Partnership Launch", description: "Public announcement", stageName: "Launch", targetOffset: 70, status: "pending", ownerIndex: 5 },
  ];
  const milestones = await createMilestonesForProject(projectId, milestoneConfigs, startDate, stageIds, demoUsers, result);

  const deliverables = [
    {
      title: "Partner Discovery",
      description: "ServiceNow partnership research and alignment",
      status: EPIC_STATUS.COMPLETED,
      progress: 100,
      epics: [
        { title: "Market Research", description: "ServiceNow ecosystem analysis", status: EPIC_STATUS.COMPLETED, progress: 100, stage: "Discovery" },
        { title: "Partnership Criteria", description: "Define success metrics", status: EPIC_STATUS.COMPLETED, progress: 100, stage: "Discovery" },
        { title: "Initial Outreach", description: "Contact partner team", status: EPIC_STATUS.COMPLETED, progress: 100, stage: "Discovery" },
      ],
    },
    {
      title: "Technical Certification",
      description: "ServiceNow technical certification path",
      status: EPIC_STATUS.IN_PROGRESS,
      progress: 45,
      epics: [
        { title: "Platform Assessment", description: "Technical capabilities review", status: EPIC_STATUS.COMPLETED, progress: 100, stage: "Evaluation" },
        { title: "Certification Plan", description: "Team certification roadmap", status: EPIC_STATUS.IN_PROGRESS, progress: 60, stage: "Evaluation" },
        { title: "Demo Environment", description: "ServiceNow sandbox setup", status: EPIC_STATUS.IN_PROGRESS, progress: 30, stage: "Integration" },
      ],
    },
    {
      title: "Joint Solution",
      description: "Co-developed solution offering",
      status: EPIC_STATUS.NOT_STARTED,
      progress: 0,
      epics: [
        { title: "Solution Design", description: "Joint solution architecture", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Integration" },
        { title: "Integration Development", description: "Platform integration", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Integration" },
        { title: "Solution Documentation", description: "Technical documentation", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Launch" },
      ],
    },
    {
      title: "Go-to-Market",
      description: "Partnership launch activities",
      status: EPIC_STATUS.NOT_STARTED,
      progress: 0,
      epics: [
        { title: "Marketing Plan", description: "Joint marketing strategy", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Launch" },
        { title: "Sales Enablement", description: "Sales training and materials", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Launch" },
        { title: "Launch Event", description: "Partnership announcement", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Launch" },
      ],
    },
    getManagementActivitiesDeliverable("ALLIANCE", 45),
  ];

  await createDeliverablesWithEpicsAndTasks(projectId, "ServiceNow Alliance Engagement", deliverables, stageIds, stages, sprints, milestones, demoUsers, startDate, result);

  const team: TeamMemberConfig[] = [
    { userId: DEMO_USER_IDS.ADMIN, highLevelRole: 'owner' },
    { userId: DEMO_USER_IDS.SOLUTION_CONSULTANT, highLevelRole: 'manager', executionRole: 'rt_solution_consultant' },
    { userId: DEMO_USER_IDS.DEVELOPER_LEAD, highLevelRole: 'member', executionRole: 'rt_dev_lead' },
    { userId: DEMO_USER_IDS.DOC_MANAGER, highLevelRole: 'member', executionRole: 'rt_documentation_manager' },
    { userId: DEMO_USER_IDS.STAKEHOLDER, highLevelRole: 'stakeholder' },
  ];
  await createTeamMembersForProject(projectId, team, result);
}

// ==================== INTERNAL PROJECTS ====================

async function createWebinarExecutionProject(
  result: DemoDataResult,
  demoUsers: User[],
  framework: FrameworkData,
  now: Date
): Promise<void> {
  const projectId = DEMO_PROJECT_IDS.WEBINAR_EXECUTION;
  const startDate = addDays(now, -21);
  const deadline = addDays(now, 9);

  const { stageIds, stages } = await createProjectWithFrameworkStages(
    projectId,
    {
      name: "Q1 Product Webinar Series",
      description: "Internal initiative to execute Q1 product webinar series showcasing new platform features. Includes content creation, speaker coordination, technical setup, and post-event follow-up.",
      status: "active",
      startDate: toDateString(startDate),
      deadline: toDateString(deadline),
      progress: 70,
      ownerId: demoUsers[5]?.id,
      client: "Internal",
      riskLevel: "low",
      sprintDurationWeeks: 1,
      currentStageIndex: 3,
    },
    framework,
    startDate,
    result
  );

  const sprintConfigs = [
    { name: "Week 1", goal: "Discovery and planning", startOffset: 0, endOffset: 7, status: "completed" },
    { name: "Week 2", goal: "Content development", startOffset: 7, endOffset: 14, status: "completed" },
    { name: "Week 3", goal: "Execution and review", startOffset: 14, endOffset: 21, status: "active" },
    { name: "Week 4", goal: "Delivery and close", startOffset: 21, endOffset: 28, status: "planned" },
  ];
  const sprints = await createSprintsForProject(projectId, sprintConfigs, startDate, demoUsers, result);

  const milestoneConfigs = [
    { name: "Content Ready", description: "All webinar content finalized", stageName: "Plan", targetOffset: 14, status: "completed", ownerIndex: 5 },
    { name: "Webinar Executed", description: "Live webinar completed", stageName: "Execute", targetOffset: 21, status: "on-track", ownerIndex: 5 },
    { name: "Follow-up Complete", description: "Post-event tasks done", stageName: "Deliver", targetOffset: 28, status: "pending", ownerIndex: 5 },
  ];
  const milestones = await createMilestonesForProject(projectId, milestoneConfigs, startDate, stageIds, demoUsers, result);

  const deliverables = [
    {
      title: "Webinar Content",
      description: "Presentation and demo materials",
      status: EPIC_STATUS.COMPLETED,
      progress: 100,
      epics: [
        { title: "Presentation Deck", description: "Slide deck creation", status: EPIC_STATUS.COMPLETED, progress: 100, stage: "Plan" },
        { title: "Demo Script", description: "Live demo preparation", status: EPIC_STATUS.COMPLETED, progress: 100, stage: "Plan" },
        { title: "Speaker Notes", description: "Talking points", status: EPIC_STATUS.COMPLETED, progress: 100, stage: "Execute" },
      ],
    },
    {
      title: "Technical Setup",
      description: "Webinar platform and recording setup",
      status: EPIC_STATUS.COMPLETED,
      progress: 100,
      epics: [
        { title: "Platform Setup", description: "Configure webinar platform", status: EPIC_STATUS.COMPLETED, progress: 100, stage: "Discover" },
        { title: "Test Run", description: "Technical rehearsal", status: EPIC_STATUS.COMPLETED, progress: 100, stage: "Execute" },
        { title: "Recording Setup", description: "Recording configuration", status: EPIC_STATUS.COMPLETED, progress: 100, stage: "Execute" },
      ],
    },
    {
      title: "Post-Event",
      description: "Follow-up activities and metrics",
      status: EPIC_STATUS.IN_PROGRESS,
      progress: 30,
      epics: [
        { title: "Recording Edit", description: "Edit and publish recording", status: EPIC_STATUS.IN_PROGRESS, progress: 50, stage: "Deliver" },
        { title: "Attendee Follow-up", description: "Send follow-up emails", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Deliver" },
        { title: "Metrics Report", description: "Engagement analytics", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Close" },
      ],
    },
    getManagementActivitiesDeliverable("GENERIC", 25),
  ];

  await createDeliverablesWithEpicsAndTasks(projectId, "Q1 Product Webinar Series", deliverables, stageIds, stages, sprints, milestones, demoUsers, startDate, result);

  const team: TeamMemberConfig[] = [
    { userId: DEMO_USER_IDS.DOC_MANAGER, highLevelRole: 'owner', executionRole: 'rt_documentation_manager' },
    { userId: DEMO_USER_IDS.PRODUCT_DESIGNER, highLevelRole: 'member', executionRole: 'rt_product_designer' },
    { userId: DEMO_USER_IDS.SOLUTION_CONSULTANT, highLevelRole: 'member', executionRole: 'rt_solution_consultant' },
  ];
  await createTeamMembersForProject(projectId, team, result);
}

async function createEmployeeOnsiteProject(
  result: DemoDataResult,
  demoUsers: User[],
  framework: FrameworkData,
  now: Date
): Promise<void> {
  const projectId = DEMO_PROJECT_IDS.EMPLOYEE_ONSITE;
  const startDate = addDays(now, -7);
  const deadline = addDays(now, 53);

  const { stageIds, stages } = await createProjectWithFrameworkStages(
    projectId,
    {
      name: "Spring Team Onsite Planning",
      description: "Internal project to plan and execute the spring all-hands onsite event. Includes venue selection, agenda planning, logistics, team activities, and budget management.",
      status: "active",
      startDate: toDateString(startDate),
      deadline: toDateString(deadline),
      progress: 25,
      ownerId: demoUsers[0]?.id,
      client: "Internal",
      riskLevel: "low",
      sprintDurationWeeks: 2,
      currentStageIndex: 1,
    },
    framework,
    startDate,
    result
  );

  const sprintConfigs = [
    { name: "Sprint 1", goal: "Discovery and venue search", startOffset: 0, endOffset: 14, status: "active" },
    { name: "Sprint 2", goal: "Planning and bookings", startOffset: 14, endOffset: 28, status: "planned" },
    { name: "Sprint 3", goal: "Execution prep", startOffset: 28, endOffset: 42, status: "planned" },
    { name: "Sprint 4", goal: "Event and close-out", startOffset: 42, endOffset: 56, status: "planned" },
  ];
  const sprints = await createSprintsForProject(projectId, sprintConfigs, startDate, demoUsers, result);

  const milestoneConfigs = [
    { name: "Venue Confirmed", description: "Venue booked", stageName: "Discover", targetOffset: 14, status: "on-track", ownerIndex: 0 },
    { name: "Agenda Finalized", description: "Full agenda set", stageName: "Plan", targetOffset: 28, status: "pending", ownerIndex: 0 },
    { name: "Event Complete", description: "Onsite executed", stageName: "Deliver", targetOffset: 50, status: "pending", ownerIndex: 0 },
  ];
  const milestones = await createMilestonesForProject(projectId, milestoneConfigs, startDate, stageIds, demoUsers, result);

  const deliverables = [
    {
      title: "Venue & Logistics",
      description: "Location, accommodations, and travel",
      status: EPIC_STATUS.IN_PROGRESS,
      progress: 40,
      epics: [
        { title: "Venue Search", description: "Identify and evaluate venues", status: EPIC_STATUS.IN_PROGRESS, progress: 60, stage: "Discover" },
        { title: "Accommodation", description: "Hotel block booking", status: EPIC_STATUS.IN_PROGRESS, progress: 30, stage: "Plan" },
        { title: "Travel Coordination", description: "Flight and transport", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Plan" },
      ],
    },
    {
      title: "Event Agenda",
      description: "Sessions, activities, and schedule",
      status: EPIC_STATUS.NOT_STARTED,
      progress: 10,
      epics: [
        { title: "Session Planning", description: "Meeting agenda", status: EPIC_STATUS.IN_PROGRESS, progress: 20, stage: "Plan" },
        { title: "Team Activities", description: "Team building events", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Plan" },
        { title: "Evening Events", description: "Social activities", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Plan" },
      ],
    },
    {
      title: "Budget & Admin",
      description: "Budget tracking and admin tasks",
      status: EPIC_STATUS.IN_PROGRESS,
      progress: 20,
      epics: [
        { title: "Budget Tracking", description: "Cost management", status: EPIC_STATUS.IN_PROGRESS, progress: 40, stage: "Discover" },
        { title: "Attendee List", description: "Headcount and RSVPs", status: EPIC_STATUS.IN_PROGRESS, progress: 50, stage: "Execute" },
        { title: "Post-Event Survey", description: "Feedback collection", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Close" },
      ],
    },
    getManagementActivitiesDeliverable("GENERIC", 30),
  ];

  await createDeliverablesWithEpicsAndTasks(projectId, "Spring Team Onsite Planning", deliverables, stageIds, stages, sprints, milestones, demoUsers, startDate, result);

  const team: TeamMemberConfig[] = [
    { userId: DEMO_USER_IDS.ADMIN, highLevelRole: 'owner' },
    { userId: DEMO_USER_IDS.DOC_MANAGER, highLevelRole: 'member', executionRole: 'rt_documentation_manager' },
    { userId: DEMO_USER_IDS.STAKEHOLDER, highLevelRole: 'stakeholder' },
  ];
  await createTeamMembersForProject(projectId, team, result);
}

// ==================== SUPPORT PROJECT ====================

async function createClientSupportOpsProject(
  result: DemoDataResult,
  demoUsers: User[],
  framework: FrameworkData,
  now: Date
): Promise<void> {
  const projectId = DEMO_PROJECT_IDS.CLIENT_SUPPORT_OPS;
  const startDate = addDays(now, -45);
  const deadline = addDays(now, 45);

  const { stageIds, stages } = await createProjectWithFrameworkStages(
    projectId,
    {
      name: "Client Support Operations",
      description: "Ongoing support operations project tracking client support activities, incident management, release support cycles, and continuous improvement initiatives.",
      status: "active",
      startDate: toDateString(startDate),
      deadline: toDateString(deadline),
      progress: 50,
      ownerId: demoUsers[7]?.id,
      client: "All Clients",
      riskLevel: "low",
      sprintDurationWeeks: 2,
      currentStageIndex: 0,
    },
    framework,
    startDate,
    result
  );

  const sprintConfigs = [
    { name: "Support Cycle 1", goal: "Normal operations baseline", startOffset: 0, endOffset: 14, status: "completed" },
    { name: "Support Cycle 2", goal: "Release v2.5 support", startOffset: 14, endOffset: 28, status: "completed" },
    { name: "Support Cycle 3", goal: "Incident response and stabilization", startOffset: 28, endOffset: 42, status: "completed" },
    { name: "Support Cycle 4", goal: "Normal operations", startOffset: 42, endOffset: 56, status: "active" },
    { name: "Support Cycle 5", goal: "Release v2.6 prep", startOffset: 56, endOffset: 70, status: "planned" },
  ];
  const sprints = await createSprintsForProject(projectId, sprintConfigs, startDate, demoUsers, result);

  const milestoneConfigs = [
    { name: "Ops Baseline Established", description: "Normal operations documented", stageName: "Normal Operations", targetOffset: 14, status: "completed", ownerIndex: 7 },
    { name: "v2.5 Stable", description: "Release confirmed stable", stageName: "Release Support", targetOffset: 28, status: "completed", ownerIndex: 7 },
    { name: "Incident Resolved", description: "Major incident closed", stageName: "Incident Response", targetOffset: 35, status: "completed", ownerIndex: 7 },
    { name: "Q1 Improvement Complete", description: "Process improvements done", stageName: "Stabilization", targetOffset: 60, status: "on-track", ownerIndex: 7 },
  ];
  const milestones = await createMilestonesForProject(projectId, milestoneConfigs, startDate, stageIds, demoUsers, result);

  const deliverables = [
    {
      title: "Normal Operations",
      description: "Standard support operations and ticket handling",
      status: EPIC_STATUS.IN_PROGRESS,
      progress: 65,
      epics: [
        { title: "Ticket Triage", description: "Daily ticket triage process", status: EPIC_STATUS.COMPLETED, progress: 100, stage: "Normal Operations" },
        { title: "Issue Resolution", description: "Standard issue handling", status: EPIC_STATUS.IN_PROGRESS, progress: 70, stage: "Normal Operations" },
        { title: "Knowledge Base", description: "KB article updates", status: EPIC_STATUS.IN_PROGRESS, progress: 50, stage: "Normal Operations" },
      ],
    },
    {
      title: "Release v2.5 Support",
      description: "Support activities for v2.5 release",
      status: EPIC_STATUS.COMPLETED,
      progress: 100,
      epics: [
        { title: "Release Monitoring", description: "Post-release monitoring", status: EPIC_STATUS.COMPLETED, progress: 100, stage: "Release Support" },
        { title: "Issue Tracking", description: "Release issue management", status: EPIC_STATUS.COMPLETED, progress: 100, stage: "Release Support" },
        { title: "Hotfix Support", description: "Emergency fix coordination", status: EPIC_STATUS.COMPLETED, progress: 100, stage: "Release Support" },
      ],
    },
    {
      title: "March Incident Response",
      description: "Major database incident handling",
      status: EPIC_STATUS.COMPLETED,
      progress: 100,
      epics: [
        { title: "Incident Containment", description: "Issue isolation", status: EPIC_STATUS.COMPLETED, progress: 100, stage: "Incident Response" },
        { title: "Resolution", description: "Fix implementation", status: EPIC_STATUS.COMPLETED, progress: 100, stage: "Incident Response" },
        { title: "Post-Incident Review", description: "RCA and documentation", status: EPIC_STATUS.COMPLETED, progress: 100, stage: "Stabilization" },
      ],
    },
    {
      title: "Q1 Process Improvements",
      description: "Continuous improvement initiatives",
      status: EPIC_STATUS.IN_PROGRESS,
      progress: 35,
      epics: [
        { title: "SLA Review", description: "SLA metrics and targets", status: EPIC_STATUS.COMPLETED, progress: 100, stage: "Stabilization" },
        { title: "Runbook Updates", description: "Operational runbook refresh", status: EPIC_STATUS.IN_PROGRESS, progress: 40, stage: "Stabilization" },
        { title: "Automation", description: "Support automation initiatives", status: EPIC_STATUS.NOT_STARTED, progress: 0, stage: "Normal Operations" },
      ],
    },
    getManagementActivitiesDeliverable("SUPPORT", 50),
  ];

  await createDeliverablesWithEpicsAndTasks(projectId, "Client Support Operations", deliverables, stageIds, stages, sprints, milestones, demoUsers, startDate, result);

  const team: TeamMemberConfig[] = [
    { userId: DEMO_USER_IDS.SUPPORT_LEAD, highLevelRole: 'owner' },
    { userId: DEMO_USER_IDS.ADMIN, highLevelRole: 'manager' },
    { userId: DEMO_USER_IDS.DEVELOPER_LEAD, highLevelRole: 'member', executionRole: 'rt_dev_lead' },
    { userId: DEMO_USER_IDS.QA_ENGINEER, highLevelRole: 'member', executionRole: 'rt_qa_engineer' },
    { userId: DEMO_USER_IDS.DOC_MANAGER, highLevelRole: 'member', executionRole: 'rt_documentation_manager' },
  ];
  await createTeamMembersForProject(projectId, team, result);
}
