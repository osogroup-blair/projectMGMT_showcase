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
    firstName: "Demo",
    lastName: "Solution Consultant",
    name: "Demo Solution Consultant",
    jobTitle: "Solution Consultant",
    systemRole: "member",
    stage: "Requirements",
  },
  {
    id: DEMO_USER_IDS.PRODUCT_DESIGNER,
    email: "demo.product.designer@nymbl.demo",
    firstName: "Demo",
    lastName: "Product Designer",
    name: "Demo Product Designer",
    jobTitle: "Product Designer",
    systemRole: "member",
    stage: "Design",
  },
  {
    id: DEMO_USER_IDS.DEVELOPER_LEAD,
    email: "demo.developer.lead@nymbl.demo",
    firstName: "Demo",
    lastName: "Developer Lead",
    name: "Demo Developer Lead",
    jobTitle: "Developer Lead",
    systemRole: "member",
    stage: "Development",
  },
  {
    id: DEMO_USER_IDS.QA_ENGINEER,
    email: "demo.qa.engineer@nymbl.demo",
    firstName: "Demo",
    lastName: "QA Engineer",
    name: "Demo QA Engineer",
    jobTitle: "QA Engineer",
    systemRole: "member",
    stage: "QA",
  },
  {
    id: DEMO_USER_IDS.DOC_MANAGER,
    email: "demo.doc.manager@nymbl.demo",
    firstName: "Demo",
    lastName: "Documentation Manager",
    name: "Demo Documentation Manager",
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

async function createProjectWithStages(
  projectId: string,
  projectData: any,
  frameworkId: string,
  startDate: Date,
  result: DemoDataResult
): Promise<{ stageIds: Record<string, string> }> {
  const stageIds: Record<string, string> = {};

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
      startDate: toDateString(addDays(startDate, stageStartOffset)),
      endDate: toDateString(addDays(startDate, stageEndOffset)),
    } as any);
    result.created.stages = (result.created.stages || 0) + 1;
  }

  return { stageIds };
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

  const { stageIds } = await createProjectWithStages(
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

  await createDeliverablesWithEpicsAndTasks(projectId, deliverables, stageIds, demoUsers, startDate, result);

  // Add milestones
  await createMilestone(projectId, "Requirements Complete", "All requirements documented", "Requirements", addDays(startDate, 18), "completed", demoUsers[0]?.id, stageIds, result);
  await createMilestone(projectId, "Design Sign-off", "All designs approved", "Design", addDays(startDate, 36), "completed", demoUsers[1]?.id, stageIds, result);
  await createMilestone(projectId, "Beta Release", "Internal beta testing", "Development", addDays(now, 7), "on-track", demoUsers[2]?.id, stageIds, result);
  await createMilestone(projectId, "Go Live", "Production release", "Documentation", deadline, "pending", demoUsers[4]?.id, stageIds, result);

  // Add sprints
  await createSprint(projectId, "Sprint 1", "Requirements and initial design", addDays(startDate, 0), addDays(startDate, 14), "completed", demoUsers, result);
  await createSprint(projectId, "Sprint 2", "Design completion", addDays(startDate, 14), addDays(startDate, 28), "completed", demoUsers, result);
  await createSprint(projectId, "Sprint 3", "Core development", addDays(startDate, 28), addDays(startDate, 42), "completed", demoUsers, result);
  await createSprint(projectId, "Sprint 4", "Feature development", addDays(startDate, 42), addDays(startDate, 56), "active", demoUsers, result);
  await createSprint(projectId, "Sprint 5", "QA and polish", addDays(startDate, 56), addDays(startDate, 70), "planned", demoUsers, result);
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

  const { stageIds } = await createProjectWithStages(
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

  await createDeliverablesWithEpicsAndTasks(projectId, deliverables, stageIds, demoUsers, startDate, result);

  // Add milestones
  await createMilestone(projectId, "Requirements Complete", "All requirements documented", "Requirements", addDays(startDate, 18), "completed", demoUsers[0]?.id, stageIds, result);
  await createMilestone(projectId, "Design Review", "UI/UX design review", "Design", addDays(now, 14), "on-track", demoUsers[1]?.id, stageIds, result);
  await createMilestone(projectId, "MVP Launch", "Minimum viable product", "Development", addDays(now, 45), "pending", demoUsers[2]?.id, stageIds, result);

  // Add sprints
  await createSprint(projectId, "Sprint 1", "Requirements gathering", addDays(startDate, 0), addDays(startDate, 14), "completed", demoUsers, result);
  await createSprint(projectId, "Sprint 2", "UI Design", addDays(startDate, 14), addDays(startDate, 28), "active", demoUsers, result);
  await createSprint(projectId, "Sprint 3", "Development kickoff", addDays(startDate, 28), addDays(startDate, 42), "planned", demoUsers, result);
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

  const { stageIds } = await createProjectWithStages(
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

  await createDeliverablesWithEpicsAndTasks(projectId, deliverables, stageIds, demoUsers, startDate, result);

  // Add milestones
  await createMilestone(projectId, "Requirements Kickoff", "Project kickoff meeting", "Requirements", addDays(startDate, 3), "completed", demoUsers[0]?.id, stageIds, result);
  await createMilestone(projectId, "Requirements Sign-off", "All requirements approved", "Requirements", addDays(now, 14), "on-track", demoUsers[0]?.id, stageIds, result);
  await createMilestone(projectId, "Design Complete", "All designs finalized", "Design", addDays(now, 35), "pending", demoUsers[1]?.id, stageIds, result);

  // Add sprints
  await createSprint(projectId, "Sprint 1", "Discovery and requirements", addDays(startDate, 0), addDays(startDate, 14), "active", demoUsers, result);
  await createSprint(projectId, "Sprint 2", "Requirements completion", addDays(startDate, 14), addDays(startDate, 28), "planned", demoUsers, result);
}

async function createDeliverablesWithEpicsAndTasks(
  projectId: string,
  deliverables: any[],
  stageIds: Record<string, string>,
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

      await storage.createEpic({
        id: epicId,
        deliverableId,
        title: epicConfig.title,
        description: epicConfig.description,
        status: epicConfig.status,
        progress: epicConfig.progress,
        ownerId: assignee?.id || demoUsers[0]?.id,
        startDate: toDateString(addDays(projectStartDate, dayOffset)),
        endDate: toDateString(addDays(projectStartDate, dayOffset + 14)),
      } as any);
      result.created.epics = (result.created.epics || 0) + 1;

      // Create 2-4 tasks per epic
      const numTasks = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numTasks; i++) {
        const template = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
        
        let taskStatus = "BACKLOGGED";
        if (epicConfig.progress >= 100) {
          taskStatus = "DONE";
        } else if (epicConfig.progress > 50) {
          taskStatus = Math.random() < 0.5 ? "DONE" : "IN PROGRESS";
        } else if (epicConfig.progress > 0) {
          taskStatus = Math.random() < 0.3 ? "IN PROGRESS" : "BACKLOGGED";
        }

        const taskStartDate = addDays(projectStartDate, dayOffset + (i * 2));
        const taskDeadline = addDays(taskStartDate, 5);

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

async function createMilestone(
  projectId: string,
  name: string,
  description: string,
  phase: string,
  targetDate: Date,
  status: string,
  ownerId: string | undefined,
  stageIds: Record<string, string>,
  result: DemoDataResult
): Promise<void> {
  await storage.createMilestone({
    id: generateId("ms"),
    projectId,
    name,
    description,
    phase,
    stageId: stageIds[phase],
    targetDate: toDateString(targetDate),
    status,
    ownerId,
    scopeType: "all_tasks",
    completionMode: "percentage",
    completionTargetPercent: 100,
    isBillingGate: false,
  } as any);
  result.created.milestones = (result.created.milestones || 0) + 1;
}

async function createSprint(
  projectId: string,
  name: string,
  goal: string,
  startDate: Date,
  endDate: Date,
  status: string,
  demoUsers: User[],
  result: DemoDataResult
): Promise<void> {
  await storage.createSprint({
    id: generateId("sprint"),
    projectId,
    name,
    goal,
    startDate: toDateString(startDate),
    endDate: toDateString(endDate),
    status,
    capacityHours: 160,
  } as any);
  result.created.sprints = (result.created.sprints || 0) + 1;
}

export async function hasDemoData(): Promise<boolean> {
  const projects = await storage.getProjects();
  return projects.some(p => Object.values(DEMO_PROJECT_IDS).includes(p.id));
}
