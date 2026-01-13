import { storage } from "../data/storage";
import type { User } from "@shared/schema";

// Demo project IDs
const DEMO_PROJECT_IDS = {
  CRM: "demo-crm-system",
  TASK_MGMT: "demo-task-management",
  TIME_ENTRY: "demo-time-entry",
};

const DEMO_FRAMEWORK_ID = "demo-framework-delivery";

// Demo user IDs  
const DEMO_USER_IDS = {
  SOLUTION_CONSULTANT: "demo-solution-consultant",
  PRODUCT_DESIGNER: "demo-product-designer",
  DEVELOPER_LEAD: "demo-developer-lead",
  QA_ENGINEER: "demo-qa-engineer",
  DOC_MANAGER: "demo-documentation-manager",
};

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toDateString(date: Date): string {
  return date.toISOString();
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
  };
  errors?: string[];
}

// Demo users with role-based names
const DEMO_USERS = [
  {
    id: DEMO_USER_IDS.SOLUTION_CONSULTANT,
    email: "demo.solution.consultant@nymbl.demo",
    firstName: "DEMO-SOLUTION CONSULTANT",
    lastName: "User",
    name: "DEMO-SOLUTION CONSULTANT User",
    jobTitle: "Solution Consultant",
    systemRole: "member",
    stage: "Requirements",
  },
  {
    id: DEMO_USER_IDS.PRODUCT_DESIGNER,
    email: "demo.product.designer@nymbl.demo",
    firstName: "DEMO-PRODUCT DESIGNER",
    lastName: "User",
    name: "DEMO-PRODUCT DESIGNER User",
    jobTitle: "Product Designer",
    systemRole: "member",
    stage: "Design",
  },
  {
    id: DEMO_USER_IDS.DEVELOPER_LEAD,
    email: "demo.developer.lead@nymbl.demo",
    firstName: "DEMO-DEVELOPER LEAD",
    lastName: "User",
    name: "DEMO-DEVELOPER LEAD User",
    jobTitle: "Developer Lead",
    systemRole: "member",
    stage: "Development",
  },
  {
    id: DEMO_USER_IDS.QA_ENGINEER,
    email: "demo.qa.engineer@nymbl.demo",
    firstName: "DEMO-QA ENGINEER",
    lastName: "User",
    name: "DEMO-QA ENGINEER User",
    jobTitle: "QA Engineer",
    systemRole: "member",
    stage: "QA",
  },
  {
    id: DEMO_USER_IDS.DOC_MANAGER,
    email: "demo.doc.manager@nymbl.demo",
    firstName: "DEMO-DOCUMENTATION MANAGER",
    lastName: "User",
    name: "DEMO-DOCUMENTATION MANAGER User",
    jobTitle: "Documentation Manager",
    systemRole: "member",
    stage: "Documentation",
  },
];

// Stage definitions for Delivery Framework
const DELIVERY_STAGES = [
  { name: "Requirements", description: "Business requirements gathering and analysis", order: 1, type: "planning" },
  { name: "Design", description: "UI/UX and technical design", order: 2, type: "design" },
  { name: "Development", description: "Implementation and coding", order: 3, type: "development" },
  { name: "QA", description: "Quality assurance and testing", order: 4, type: "testing" },
  { name: "Documentation", description: "User guides and technical documentation", order: 5, type: "documentation" },
];

// Get user by stage role
function getUserForStage(stage: string, demoUsers: User[]): User | undefined {
  const stageUserMap: Record<string, string> = {
    "Requirements": DEMO_USER_IDS.SOLUTION_CONSULTANT,
    "Design": DEMO_USER_IDS.PRODUCT_DESIGNER,
    "Development": DEMO_USER_IDS.DEVELOPER_LEAD,
    "QA": DEMO_USER_IDS.QA_ENGINEER,
    "Documentation": DEMO_USER_IDS.DOC_MANAGER,
  };
  return demoUsers.find(u => u.id === stageUserMap[stage]);
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
    
    return { success: true, deleted };
  } catch (error: any) {
    return { success: false, deleted };
  }
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

    // 1. Create demo users
    const demoUsers: User[] = [];
    for (const userData of DEMO_USERS) {
      try {
        const existingUsers = await storage.getUsers();
        const existing = existingUsers.find(u => u.id === userData.id);
        if (!existing) {
          const user = await storage.createUser({
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            name: userData.name,
            jobTitle: userData.jobTitle,
            systemRole: userData.systemRole,
          } as any);
          // Update the ID to match our demo ID
          await storage.updateUser(user.id, { id: userData.id } as any);
          demoUsers.push({ ...user, id: userData.id });
          result.created.users = (result.created.users || 0) + 1;
        } else {
          demoUsers.push(existing);
        }
      } catch (e: any) {
        // Try to get existing user
        const existingUsers = await storage.getUsers();
        const existing = existingUsers.find(u => u.email === userData.email);
        if (existing) {
          demoUsers.push(existing);
        }
      }
    }

    // 2. Create or get Delivery Framework
    let frameworkId = DEMO_FRAMEWORK_ID;
    const existingFrameworks = await storage.getFrameworkTemplates();
    const existingFramework = existingFrameworks.find(f => f.id === DEMO_FRAMEWORK_ID);
    
    if (!existingFramework) {
      const framework = {
        id: DEMO_FRAMEWORK_ID,
        name: "Delivery Framework",
        description: "A comprehensive delivery framework with stages: Requirements, Design, Development, QA, Documentation",
        stageNames: DELIVERY_STAGES.map(s => s.name),
      };
      await storage.createFrameworkTemplate(framework as any);
      result.created.frameworks = 1;
    }

    const now = new Date();

    // 3. Create CRM System Project (~60% complete, in Development)
    await createCRMProject(result, demoUsers, frameworkId, now);

    // 4. Create Task Management App (~30% complete, in Design)
    await createTaskManagementProject(result, demoUsers, frameworkId, now);

    // 5. Create Time Entry System (~10% complete, in Requirements)
    await createTimeEntryProject(result, demoUsers, frameworkId, now);

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
  phase: string;
  stageId: string;
  targetDate: string;
  status: string;
}

async function createProjectWithStages(
  projectId: string,
  projectData: any,
  frameworkId: string,
  startDate: Date,
  result: DemoDataResult
): Promise<{ stageIds: Record<string, string>; stages: StageData[] }> {
  const stageIds: Record<string, string> = {};
  const stages: StageData[] = [];

  // Create project
  await storage.createProject({
    id: projectId,
    ...projectData,
    frameworkId,
  } as any);
  result.created.projects = (result.created.projects || 0) + 1;

  // Create stages with appropriate status based on project progress
  const projectDuration = 90; // days
  const stageDuration = projectDuration / DELIVERY_STAGES.length;

  for (let i = 0; i < DELIVERY_STAGES.length; i++) {
    const stageDef = DELIVERY_STAGES[i];
    const stageId = generateId("stage");
    stageIds[stageDef.name] = stageId;

    const stageStartOffset = i * stageDuration;
    const stageEndOffset = (i + 1) * stageDuration;
    const stageStartDate = addDays(startDate, stageStartOffset);
    const stageEndDate = addDays(startDate, stageEndOffset);

    // Determine stage status based on project's current stage
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
      name: stageDef.name,
      description: stageDef.description,
      order: stageDef.order,
      type: stageDef.type,
      status: stageStatus,
      startDate: toDateString(stageStartDate),
      endDate: toDateString(stageEndDate),
    } as any);
    result.created.stages = (result.created.stages || 0) + 1;

    stages.push({
      id: stageId,
      name: stageDef.name,
      startDate: toDateString(stageStartDate),
      endDate: toDateString(stageEndDate),
    });
  }

  return { stageIds, stages };
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
  milestoneConfigs: Array<{ name: string; description: string; phase: string; targetOffset: number; status: string; ownerIndex: number }>,
  projectStartDate: Date,
  stageIds: Record<string, string>,
  demoUsers: User[],
  result: DemoDataResult
): Promise<MilestoneData[]> {
  const milestones: MilestoneData[] = [];

  for (const config of milestoneConfigs) {
    const milestoneId = generateId("ms");
    const targetDate = addDays(projectStartDate, config.targetOffset);
    const stageId = stageIds[config.phase];

    await storage.createMilestone({
      id: milestoneId,
      projectId,
      name: config.name,
      description: config.description,
      phase: config.phase,
      stageId,
      targetDate: toDateString(targetDate),
      status: config.status,
      ownerId: demoUsers[config.ownerIndex]?.id,
      scopeType: "all_tasks",
      completionMode: "percentage",
      completionTargetPercent: 100,
      isBillingGate: false,
    } as any);
    result.created.milestones = (result.created.milestones || 0) + 1;

    milestones.push({
      id: milestoneId,
      name: config.name,
      phase: config.phase,
      stageId,
      targetDate: toDateString(targetDate),
      status: config.status,
    });
  }

  return milestones;
}

async function createCRMProject(
  result: DemoDataResult,
  demoUsers: User[],
  frameworkId: string,
  now: Date
): Promise<void> {
  const projectId = DEMO_PROJECT_IDS.CRM;
  const startDate = addDays(now, -60);
  const deadline = addDays(now, 30);

  const { stageIds, stages } = await createProjectWithStages(
    projectId,
    {
      name: "CRM System",
      description: "A comprehensive Customer Relationship Management system featuring contact management, sales pipeline tracking, activity logging, and reporting dashboards.",
      status: "active",
      startDate: toDateString(startDate),
      deadline: toDateString(deadline),
      progress: 60,
      ownerId: demoUsers[0]?.id,
      client: "Internal",
      riskLevel: "low",
      sprintDurationWeeks: 2,
      currentStageIndex: 2, // Development (0-indexed)
    },
    frameworkId,
    startDate,
    result
  );

  // Create sprints FIRST (before tasks)
  const sprintConfigs = [
    { name: "Sprint 1", goal: "Requirements and initial design", startOffset: 0, endOffset: 14, status: "completed" },
    { name: "Sprint 2", goal: "Design completion", startOffset: 14, endOffset: 28, status: "completed" },
    { name: "Sprint 3", goal: "Core development", startOffset: 28, endOffset: 42, status: "completed" },
    { name: "Sprint 4", goal: "Feature development", startOffset: 42, endOffset: 56, status: "active" },
    { name: "Sprint 5", goal: "QA and polish", startOffset: 56, endOffset: 70, status: "planned" },
  ];
  const sprints = await createSprintsForProject(projectId, sprintConfigs, startDate, demoUsers, result);

  // Create milestones FIRST (before tasks)
  const milestoneConfigs = [
    { name: "Requirements Complete", description: "All requirements documented", phase: "Requirements", targetOffset: 18, status: "completed", ownerIndex: 0 },
    { name: "Design Sign-off", description: "All designs approved", phase: "Design", targetOffset: 36, status: "completed", ownerIndex: 1 },
    { name: "Beta Release", description: "Internal beta testing", phase: "Development", targetOffset: 67, status: "on-track", ownerIndex: 2 },
    { name: "Go Live", description: "Production release", phase: "Documentation", targetOffset: 90, status: "pending", ownerIndex: 4 },
  ];
  const milestones = await createMilestonesForProject(projectId, milestoneConfigs, startDate, stageIds, demoUsers, result);

  // Deliverables for CRM
  const deliverables = [
    {
      title: "Contact Management",
      description: "Core contact and company management features",
      status: "in-progress",
      progress: 70,
      epics: [
        { title: "Contact CRUD", description: "Create, read, update, delete contacts", status: "completed", progress: 100, stage: "Development" },
        { title: "Company Profiles", description: "Company management and linking", status: "in-progress", progress: 60, stage: "Development" },
        { title: "Contact Import", description: "Bulk import from CSV/Excel", status: "not-started", progress: 0, stage: "Development" },
      ],
    },
    {
      title: "Sales Pipeline",
      description: "Deal tracking and pipeline visualization",
      status: "in-progress",
      progress: 40,
      epics: [
        { title: "Pipeline Stages", description: "Customizable sales stages", status: "completed", progress: 100, stage: "Design" },
        { title: "Deal Management", description: "Deal creation and tracking", status: "in-progress", progress: 50, stage: "Development" },
        { title: "Pipeline Analytics", description: "Sales funnel visualization", status: "not-started", progress: 0, stage: "Design" },
      ],
    },
    {
      title: "Activity Tracking",
      description: "Log calls, emails, meetings and notes",
      status: "not-started",
      progress: 10,
      epics: [
        { title: "Activity Types", description: "Define activity categories", status: "completed", progress: 100, stage: "Requirements" },
        { title: "Activity Logging", description: "Quick activity entry", status: "not-started", progress: 0, stage: "Development" },
        { title: "Activity Timeline", description: "Chronological activity view", status: "not-started", progress: 0, stage: "Design" },
      ],
    },
  ];

  await createDeliverablesWithEpicsAndTasks(projectId, deliverables, stageIds, stages, sprints, milestones, demoUsers, startDate, result);
}

async function createTaskManagementProject(
  result: DemoDataResult,
  demoUsers: User[],
  frameworkId: string,
  now: Date
): Promise<void> {
  const projectId = DEMO_PROJECT_IDS.TASK_MGMT;
  const startDate = addDays(now, -30);
  const deadline = addDays(now, 60);

  const { stageIds, stages } = await createProjectWithStages(
    projectId,
    {
      name: "Task Management App",
      description: "A collaborative task management application with kanban boards, team collaboration, due dates, and project organization.",
      status: "active",
      startDate: toDateString(startDate),
      deadline: toDateString(deadline),
      progress: 30,
      ownerId: demoUsers[1]?.id,
      client: "Internal",
      riskLevel: "medium",
      sprintDurationWeeks: 2,
      currentStageIndex: 1, // Design (0-indexed)
    },
    frameworkId,
    startDate,
    result
  );

  // Create sprints FIRST
  const sprintConfigs = [
    { name: "Sprint 1", goal: "Requirements gathering", startOffset: 0, endOffset: 14, status: "completed" },
    { name: "Sprint 2", goal: "UI Design", startOffset: 14, endOffset: 28, status: "active" },
    { name: "Sprint 3", goal: "Development kickoff", startOffset: 28, endOffset: 42, status: "planned" },
  ];
  const sprints = await createSprintsForProject(projectId, sprintConfigs, startDate, demoUsers, result);

  // Create milestones FIRST
  const milestoneConfigs = [
    { name: "Requirements Complete", description: "All requirements documented", phase: "Requirements", targetOffset: 18, status: "completed", ownerIndex: 0 },
    { name: "Design Review", description: "UI/UX design review", phase: "Design", targetOffset: 44, status: "on-track", ownerIndex: 1 },
    { name: "MVP Launch", description: "Minimum viable product", phase: "Development", targetOffset: 75, status: "pending", ownerIndex: 2 },
  ];
  const milestones = await createMilestonesForProject(projectId, milestoneConfigs, startDate, stageIds, demoUsers, result);

  const deliverables = [
    {
      title: "Task Core",
      description: "Core task management functionality",
      status: "in-progress",
      progress: 50,
      epics: [
        { title: "Task Model", description: "Task data structure and API", status: "completed", progress: 100, stage: "Requirements" },
        { title: "Task UI", description: "Task cards and list views", status: "in-progress", progress: 40, stage: "Design" },
        { title: "Task Actions", description: "Create, edit, delete, move tasks", status: "not-started", progress: 0, stage: "Development" },
      ],
    },
    {
      title: "Kanban Board",
      description: "Visual kanban board interface",
      status: "in-progress",
      progress: 25,
      epics: [
        { title: "Board Layout", description: "Column-based board design", status: "completed", progress: 100, stage: "Requirements" },
        { title: "Drag & Drop", description: "Intuitive task movement", status: "in-progress", progress: 30, stage: "Design" },
        { title: "Board Customization", description: "Custom columns and colors", status: "not-started", progress: 0, stage: "Design" },
      ],
    },
    {
      title: "Team Collaboration",
      description: "Multi-user features and notifications",
      status: "not-started",
      progress: 5,
      epics: [
        { title: "User Assignments", description: "Assign tasks to team members", status: "in-progress", progress: 20, stage: "Requirements" },
        { title: "Comments", description: "Task discussions", status: "not-started", progress: 0, stage: "Design" },
        { title: "Notifications", description: "Email and in-app alerts", status: "not-started", progress: 0, stage: "Requirements" },
      ],
    },
  ];

  await createDeliverablesWithEpicsAndTasks(projectId, deliverables, stageIds, stages, sprints, milestones, demoUsers, startDate, result);
}

async function createTimeEntryProject(
  result: DemoDataResult,
  demoUsers: User[],
  frameworkId: string,
  now: Date
): Promise<void> {
  const projectId = DEMO_PROJECT_IDS.TIME_ENTRY;
  const startDate = addDays(now, -7);
  const deadline = addDays(now, 83);

  const { stageIds, stages } = await createProjectWithStages(
    projectId,
    {
      name: "Time Entry System",
      description: "A time tracking and reporting system for project-based billing, featuring timesheets, approval workflows, and invoicing integration.",
      status: "active",
      startDate: toDateString(startDate),
      deadline: toDateString(deadline),
      progress: 10,
      ownerId: demoUsers[0]?.id,
      client: "Internal",
      riskLevel: "low",
      sprintDurationWeeks: 2,
      currentStageIndex: 0, // Requirements (0-indexed)
    },
    frameworkId,
    startDate,
    result
  );

  // Create sprints FIRST
  const sprintConfigs = [
    { name: "Sprint 1", goal: "Discovery and requirements", startOffset: 0, endOffset: 14, status: "active" },
    { name: "Sprint 2", goal: "Requirements completion", startOffset: 14, endOffset: 28, status: "planned" },
  ];
  const sprints = await createSprintsForProject(projectId, sprintConfigs, startDate, demoUsers, result);

  // Create milestones FIRST
  const milestoneConfigs = [
    { name: "Requirements Kickoff", description: "Project kickoff meeting", phase: "Requirements", targetOffset: 3, status: "completed", ownerIndex: 0 },
    { name: "Requirements Sign-off", description: "All requirements approved", phase: "Requirements", targetOffset: 21, status: "on-track", ownerIndex: 0 },
    { name: "Design Complete", description: "All designs finalized", phase: "Design", targetOffset: 42, status: "pending", ownerIndex: 1 },
  ];
  const milestones = await createMilestonesForProject(projectId, milestoneConfigs, startDate, stageIds, demoUsers, result);

  const deliverables = [
    {
      title: "Time Entry Core",
      description: "Core time tracking functionality",
      status: "in-progress",
      progress: 20,
      epics: [
        { title: "Entry Model", description: "Time entry data structure", status: "in-progress", progress: 50, stage: "Requirements" },
        { title: "Quick Entry", description: "Fast time logging UI", status: "not-started", progress: 0, stage: "Requirements" },
        { title: "Timer Widget", description: "Start/stop timer feature", status: "not-started", progress: 0, stage: "Design" },
      ],
    },
    {
      title: "Timesheets",
      description: "Weekly timesheet management",
      status: "not-started",
      progress: 5,
      epics: [
        { title: "Timesheet Layout", description: "Weekly view design", status: "in-progress", progress: 25, stage: "Requirements" },
        { title: "Timesheet Submission", description: "Submit for approval", status: "not-started", progress: 0, stage: "Requirements" },
        { title: "Approval Workflow", description: "Manager approval process", status: "not-started", progress: 0, stage: "Requirements" },
      ],
    },
    {
      title: "Reporting",
      description: "Time and billing reports",
      status: "not-started",
      progress: 0,
      epics: [
        { title: "Report Templates", description: "Standard report formats", status: "not-started", progress: 0, stage: "Requirements" },
        { title: "Export Options", description: "PDF, Excel, CSV export", status: "not-started", progress: 0, stage: "Requirements" },
      ],
    },
  ];

  await createDeliverablesWithEpicsAndTasks(projectId, deliverables, stageIds, stages, sprints, milestones, demoUsers, startDate, result);
}

async function createDeliverablesWithEpicsAndTasks(
  projectId: string,
  deliverables: any[],
  stageIds: Record<string, string>,
  stages: StageData[],
  sprints: SprintData[],
  milestones: MilestoneData[],
  demoUsers: User[],
  projectStartDate: Date,
  result: DemoDataResult
): Promise<void> {
  const taskTemplates = [
    { title: "Requirements gathering", priority: "high", effort: 2 },
    { title: "Stakeholder interviews", priority: "medium", effort: 1 },
    { title: "User story creation", priority: "high", effort: 2 },
    { title: "Wireframe design", priority: "high", effort: 3 },
    { title: "Mockup creation", priority: "high", effort: 3 },
    { title: "Design review", priority: "medium", effort: 1 },
    { title: "Implementation", priority: "high", effort: 5 },
    { title: "Unit tests", priority: "medium", effort: 2 },
    { title: "Code review", priority: "medium", effort: 1 },
    { title: "Test case creation", priority: "medium", effort: 2 },
    { title: "Functional testing", priority: "high", effort: 3 },
    { title: "Bug fixes", priority: "high", effort: 2 },
    { title: "User guide", priority: "low", effort: 2 },
    { title: "API documentation", priority: "medium", effort: 2 },
  ];

  // Helper: Find sprint for a task based on date overlap
  function findSprintForTask(taskStartDate: Date, taskDeadline: Date): { sprintId: string | undefined; sprintStatus: string | undefined } {
    if (sprints.length === 0) return { sprintId: undefined, sprintStatus: undefined };
    
    const taskMidpoint = (taskStartDate.getTime() + taskDeadline.getTime()) / 2;
    
    // Find sprint where task midpoint falls within sprint dates
    for (const sprint of sprints) {
      const sprintStart = new Date(sprint.startDate).getTime();
      const sprintEnd = new Date(sprint.endDate).getTime();
      
      if (taskMidpoint >= sprintStart && taskMidpoint <= sprintEnd) {
        return { sprintId: sprint.id, sprintStatus: sprint.status };
      }
    }
    
    // Fallback: find closest sprint by date
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

  // Helper: Find milestone for a stage
  function findMilestoneForStage(stageName: string): string | undefined {
    const milestone = milestones.find(m => m.phase === stageName);
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

    for (const epicConfig of delConfig.epics) {
      const epicId = generateId("epic");
      const stageId = stageIds[epicConfig.stage];
      const assignee = getUserForStage(epicConfig.stage, demoUsers);

      const epicStartDate = addDays(projectStartDate, dayOffset);
      const epicEndDate = addDays(projectStartDate, dayOffset + 14);

      await storage.createEpic({
        id: epicId,
        deliverableId,
        title: epicConfig.title,
        description: epicConfig.description,
        status: epicConfig.status,
        progress: epicConfig.progress,
        ownerId: assignee?.id || demoUsers[0]?.id,
        startDate: toDateString(epicStartDate),
        endDate: toDateString(epicEndDate),
      } as any);
      result.created.epics = (result.created.epics || 0) + 1;

      // Create 2-4 tasks per epic
      const numTasks = 2 + Math.floor(Math.random() * 3);
      const epicDurationDays = 14;
      const milestoneId = findMilestoneForStage(epicConfig.stage);

      for (let i = 0; i < numTasks; i++) {
        const template = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
        
        // Calculate task dates within epic range
        const taskStartOffset = Math.floor((i / numTasks) * epicDurationDays);
        const taskEndOffset = Math.min(taskStartOffset + 5, epicDurationDays);
        const taskStartDate = addDays(epicStartDate, taskStartOffset);
        const taskDeadline = addDays(epicStartDate, taskEndOffset);

        // Find sprint for this task based on dates
        const { sprintId, sprintStatus } = findSprintForTask(taskStartDate, taskDeadline);

        // Determine task status based on sprint status and epic progress
        let taskStatus = "BACKLOGGED";
        
        // If sprint is completed, task should be DONE
        if (sprintStatus === "completed") {
          taskStatus = "DONE";
        } else if (epicConfig.progress >= 100) {
          taskStatus = "DONE";
        } else if (epicConfig.progress > 50) {
          taskStatus = Math.random() < 0.5 ? "DONE" : "IN PROGRESS";
        } else if (epicConfig.progress > 0) {
          taskStatus = Math.random() < 0.3 ? "IN PROGRESS" : "BACKLOGGED";
        }

        await storage.createTask({
          id: generateId("task"),
          title: `${template.title} - ${epicConfig.title}`,
          description: `${template.title} for ${epicConfig.title}`,
          project: projectId === DEMO_PROJECT_IDS.CRM ? "CRM System" 
            : projectId === DEMO_PROJECT_IDS.TASK_MGMT ? "Task Management App" 
            : "Time Entry System",
          projectId,
          epicId,
          stageId,
          sprintId,
          milestoneId,
          status: taskStatus,
          priority: template.priority,
          effort: template.effort,
          assigneeId: assignee?.id || demoUsers[0]?.id,
          startDate: toDateString(taskStartDate),
          deadline: toDateString(taskDeadline),
          tags: [],
        } as any);
        result.created.tasks = (result.created.tasks || 0) + 1;
      }

      dayOffset += 5;
    }
  }
}

export async function hasDemoData(): Promise<boolean> {
  const projects = await storage.getProjects();
  return projects.some(p => Object.values(DEMO_PROJECT_IDS).includes(p.id));
}
