import { storage } from "../data/storage";
import type {
  InsertProject,
  InsertDeliverable,
  InsertEpic,
  InsertTask,
  InsertMilestone,
  InsertSprint,
  InsertProjectStage,
  InsertComment,
  InsertSprintMember,
  InsertTaskDependency,
  InsertActivity,
  User,
} from "@shared/schema";

const SAMPLE_PROJECT_ID = "sample-website-redesign";

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export type SampleDataSection = 
  | "core" 
  | "tasks" 
  | "milestones" 
  | "sprints" 
  | "comments" 
  | "all";

export interface SampleDataResult {
  success: boolean;
  section: SampleDataSection;
  created: {
    projects?: number;
    deliverables?: number;
    epics?: number;
    stages?: number;
    tasks?: number;
    milestones?: number;
    sprints?: number;
    sprintMembers?: number;
    comments?: number;
    dependencies?: number;
    activities?: number;
  };
  errors?: string[];
}

export async function clearSampleData(): Promise<{ success: boolean; deleted: Record<string, number> }> {
  const deleted: Record<string, number> = {};
  
  try {
    const projects = await storage.getProjects();
    const sampleProject = projects.find(p => p.id === SAMPLE_PROJECT_ID);
    
    if (sampleProject) {
      const tasks = await storage.getTasks();
      const sampleTasks = tasks.filter(t => t.projectId === SAMPLE_PROJECT_ID);
      for (const task of sampleTasks) {
        const comments = await storage.getCommentsByTaskId(task.id);
        for (const comment of comments) {
          await storage.deleteComment(comment.id);
          deleted.comments = (deleted.comments || 0) + 1;
        }
        await storage.deleteTask(task.id);
        deleted.tasks = (deleted.tasks || 0) + 1;
      }

      const milestones = await storage.getMilestones();
      const sampleMilestones = milestones.filter(m => m.projectId === SAMPLE_PROJECT_ID);
      for (const milestone of sampleMilestones) {
        await storage.deleteMilestone(milestone.id);
        deleted.milestones = (deleted.milestones || 0) + 1;
      }

      const sprints = await storage.getSprints();
      const sampleSprints = sprints.filter(s => s.projectId === SAMPLE_PROJECT_ID);
      for (const sprint of sampleSprints) {
        await storage.deleteSprint(sprint.id);
        deleted.sprints = (deleted.sprints || 0) + 1;
      }

      const epics = await storage.getEpics();
      const deliverables = await storage.getDeliverables();
      const sampleDeliverables = deliverables.filter(d => d.projectId === SAMPLE_PROJECT_ID);
      
      for (const deliverable of sampleDeliverables) {
        const deliverableEpics = epics.filter(e => e.deliverableId === deliverable.id);
        for (const epic of deliverableEpics) {
          await storage.deleteEpic(epic.id);
          deleted.epics = (deleted.epics || 0) + 1;
        }
        await storage.deleteDeliverable(deliverable.id);
        deleted.deliverables = (deleted.deliverables || 0) + 1;
      }

      const stages = await storage.getProjectStages();
      const sampleStages = stages.filter(s => s.projectId === SAMPLE_PROJECT_ID);
      for (const stage of sampleStages) {
        await storage.deleteProjectStage(stage.id);
        deleted.stages = (deleted.stages || 0) + 1;
      }

      await storage.deleteProject(SAMPLE_PROJECT_ID);
      deleted.projects = 1;
    }
    
    return { success: true, deleted };
  } catch (error: any) {
    return { success: false, deleted };
  }
}

export async function generateSampleData(
  section: SampleDataSection,
  clearFirst: boolean = false
): Promise<SampleDataResult> {
  const result: SampleDataResult = {
    success: true,
    section,
    created: {},
    errors: [],
  };

  try {
    if (clearFirst) {
      await clearSampleData();
    }

    const users = await storage.getUsers();
    if (users.length === 0) {
      result.errors?.push("No users found in the system. Please create users first.");
      result.success = false;
      return result;
    }

    const now = new Date();
    const projectStartDate = addDays(now, -30);
    const projectEndDate = addDays(now, 60);

    if (section === "core" || section === "all") {
      await generateCoreData(result, users, projectStartDate, projectEndDate);
    }

    if (section === "tasks" || section === "all") {
      await generateTaskData(result, users, projectStartDate);
    }

    if (section === "milestones" || section === "all") {
      await generateMilestoneData(result, projectStartDate);
    }

    if (section === "sprints" || section === "all") {
      await generateSprintData(result, users, now);
    }

    if (section === "comments" || section === "all") {
      await generateCommentData(result, users);
    }

    return result;
  } catch (error: any) {
    result.success = false;
    result.errors?.push(error.message);
    return result;
  }
}

async function generateCoreData(
  result: SampleDataResult,
  users: User[],
  startDate: Date,
  endDate: Date
): Promise<void> {
  const existingProjects = await storage.getProjects();
  if (existingProjects.find(p => p.id === SAMPLE_PROJECT_ID)) {
    result.errors?.push("Sample project already exists. Use clear option first.");
    return;
  }

  const owner = users[0];
  
  const project: InsertProject = {
    id: SAMPLE_PROJECT_ID,
    name: "Website Redesign Project",
    description: "Complete redesign of the company website with modern UI/UX, improved performance, and new features. This sample project demonstrates all capabilities of the project management system.",
    status: "active",
    startDate: startDate,
    deadline: endDate,
    progress: 35,
    ownerId: owner.id,
    client: "Acme Corporation",
    riskLevel: "medium",
    sprintDurationWeeks: 2,
  };
  await storage.createProject(project);
  result.created.projects = 1;

  const stages: InsertProjectStage[] = [
    { id: generateId("stage"), projectId: SAMPLE_PROJECT_ID, name: "Discovery", description: "Research and requirements gathering", order: 1, type: "planning", status: "completed", startDate: startDate, endDate: addDays(startDate, 14) },
    { id: generateId("stage"), projectId: SAMPLE_PROJECT_ID, name: "Design", description: "UI/UX design and prototyping", order: 2, type: "design", status: "active", startDate: addDays(startDate, 14), endDate: addDays(startDate, 35) },
    { id: generateId("stage"), projectId: SAMPLE_PROJECT_ID, name: "Development", description: "Frontend and backend implementation", order: 3, type: "development", status: "pending", startDate: addDays(startDate, 35), endDate: addDays(startDate, 70) },
    { id: generateId("stage"), projectId: SAMPLE_PROJECT_ID, name: "Testing", description: "QA and user acceptance testing", order: 4, type: "testing", status: "pending", startDate: addDays(startDate, 70), endDate: addDays(startDate, 84) },
    { id: generateId("stage"), projectId: SAMPLE_PROJECT_ID, name: "Launch", description: "Deployment and go-live", order: 5, type: "deployment", status: "pending", startDate: addDays(startDate, 84), endDate: endDate },
  ];
  
  for (const stage of stages) {
    await storage.createProjectStage(stage);
  }
  result.created.stages = stages.length;

  const deliverables: { data: InsertDeliverable; epics: InsertEpic[] }[] = [
    {
      data: {
        id: generateId("del"),
        projectId: SAMPLE_PROJECT_ID,
        title: "Design System",
        description: "Complete design system with components, patterns, and guidelines",
        status: "in-progress",
        ownerId: users[0]?.id,
        startDate: startDate,
        dueDate: addDays(startDate, 35),
        progress: 60,
      },
      epics: [
        { id: generateId("epic"), deliverableId: "", title: "Brand Guidelines", description: "Color palette, typography, and visual identity", status: "completed", ownerId: users[0]?.id, startDate: startDate, endDate: addDays(startDate, 10), progress: 100 },
        { id: generateId("epic"), deliverableId: "", title: "Component Library", description: "Reusable UI components", status: "in-progress", ownerId: users[1]?.id || users[0]?.id, startDate: addDays(startDate, 10), endDate: addDays(startDate, 28), progress: 45 },
        { id: generateId("epic"), deliverableId: "", title: "Documentation", description: "Usage guidelines and examples", status: "not-started", ownerId: users[0]?.id, startDate: addDays(startDate, 28), endDate: addDays(startDate, 35), progress: 0 },
      ],
    },
    {
      data: {
        id: generateId("del"),
        projectId: SAMPLE_PROJECT_ID,
        title: "Frontend Development",
        description: "React-based frontend with responsive design",
        status: "not-started",
        ownerId: users[1]?.id || users[0]?.id,
        startDate: addDays(startDate, 35),
        dueDate: addDays(startDate, 70),
        progress: 10,
      },
      epics: [
        { id: generateId("epic"), deliverableId: "", title: "Homepage", description: "Landing page with hero section and features", status: "not-started", ownerId: users[1]?.id || users[0]?.id, startDate: addDays(startDate, 35), endDate: addDays(startDate, 45), progress: 0 },
        { id: generateId("epic"), deliverableId: "", title: "Product Pages", description: "Product catalog and detail pages", status: "not-started", ownerId: users[0]?.id, startDate: addDays(startDate, 45), endDate: addDays(startDate, 55), progress: 0 },
        { id: generateId("epic"), deliverableId: "", title: "User Dashboard", description: "Account management and user profile", status: "not-started", ownerId: users[1]?.id || users[0]?.id, startDate: addDays(startDate, 55), endDate: addDays(startDate, 70), progress: 0 },
      ],
    },
    {
      data: {
        id: generateId("del"),
        projectId: SAMPLE_PROJECT_ID,
        title: "Backend API",
        description: "RESTful API with authentication and data management",
        status: "not-started",
        ownerId: users[2]?.id || users[0]?.id,
        startDate: addDays(startDate, 35),
        dueDate: addDays(startDate, 70),
        progress: 5,
      },
      epics: [
        { id: generateId("epic"), deliverableId: "", title: "Authentication", description: "User login, registration, and OAuth", status: "not-started", ownerId: users[2]?.id || users[0]?.id, startDate: addDays(startDate, 35), endDate: addDays(startDate, 45), progress: 0 },
        { id: generateId("epic"), deliverableId: "", title: "Product API", description: "CRUD operations for products and categories", status: "not-started", ownerId: users[0]?.id, startDate: addDays(startDate, 45), endDate: addDays(startDate, 60), progress: 0 },
        { id: generateId("epic"), deliverableId: "", title: "Integration", description: "Third-party service integrations", status: "not-started", ownerId: users[2]?.id || users[0]?.id, startDate: addDays(startDate, 60), endDate: addDays(startDate, 70), progress: 0 },
      ],
    },
    {
      data: {
        id: generateId("del"),
        projectId: SAMPLE_PROJECT_ID,
        title: "Management Activities",
        description: "Project management and coordination tasks",
        status: "in-progress",
        ownerId: users[0]?.id,
        startDate: startDate,
        dueDate: endDate,
        progress: 40,
      },
      epics: [
        { id: generateId("epic"), deliverableId: "", title: "Project Management", description: "Planning, tracking, and coordination", status: "in-progress", ownerId: users[0]?.id, startDate: startDate, endDate: endDate, progress: 40 },
      ],
    },
  ];

  const createdEpics: { id: string; deliverableId: string }[] = [];
  
  for (const { data, epics } of deliverables) {
    await storage.createDeliverable(data);
    result.created.deliverables = (result.created.deliverables || 0) + 1;
    
    for (const epic of epics) {
      epic.deliverableId = data.id!;
      await storage.createEpic(epic);
      createdEpics.push({ id: epic.id!, deliverableId: data.id! });
      result.created.epics = (result.created.epics || 0) + 1;
    }
  }
}

async function generateTaskData(
  result: SampleDataResult,
  users: User[],
  projectStartDate: Date
): Promise<void> {
  const epics = await storage.getEpics();
  const deliverables = await storage.getDeliverables();
  const sampleDeliverables = deliverables.filter(d => d.projectId === SAMPLE_PROJECT_ID);
  const sampleEpicIds = new Set(
    epics
      .filter(e => sampleDeliverables.some(d => d.id === e.deliverableId))
      .map(e => e.id)
  );
  
  if (sampleEpicIds.size === 0) {
    result.errors?.push("No epics found. Generate core data first.");
    return;
  }

  const sampleEpics = epics.filter(e => sampleEpicIds.has(e.id));
  
  const taskTemplates = [
    { title: "Research and Analysis", description: "Conduct research and document findings", priority: "high", effort: "medium", estimateHours: 8 },
    { title: "Create Wireframes", description: "Design low-fidelity wireframes", priority: "high", effort: "large", estimateHours: 16 },
    { title: "Design Mockups", description: "Create high-fidelity design mockups", priority: "high", effort: "large", estimateHours: 24 },
    { title: "Review and Feedback", description: "Collect stakeholder feedback", priority: "medium", effort: "small", estimateHours: 4 },
    { title: "Implementation", description: "Develop the feature", priority: "high", effort: "extra-large", estimateHours: 40 },
    { title: "Unit Testing", description: "Write and run unit tests", priority: "medium", effort: "medium", estimateHours: 8 },
    { title: "Code Review", description: "Peer review of code changes", priority: "medium", effort: "small", estimateHours: 4 },
    { title: "Documentation", description: "Update technical documentation", priority: "low", effort: "small", estimateHours: 4 },
    { title: "Integration Testing", description: "Test integration with other components", priority: "medium", effort: "medium", estimateHours: 8 },
    { title: "Bug Fixes", description: "Fix reported issues", priority: "high", effort: "medium", estimateHours: 8 },
  ];

  const statuses = ["todo", "in-progress", "review", "done"];
  const createdTaskIds: string[] = [];

  for (const epic of sampleEpics) {
    const numTasks = 3 + Math.floor(Math.random() * 4);
    const epicProgress = epic.progress || 0;
    
    for (let i = 0; i < numTasks; i++) {
      const template = randomElement(taskTemplates);
      const status = epicProgress >= 100 
        ? "done" 
        : epicProgress > 50 
          ? randomElement(["in-progress", "review", "done"])
          : randomElement(statuses);
      
      const task: InsertTask = {
        id: generateId("task"),
        title: `${template.title} - ${epic.title}`,
        description: template.description,
        project: "Website Redesign Project",
        projectId: SAMPLE_PROJECT_ID,
        epicId: epic.id,
        status,
        assigneeId: randomElement(users).id,
        deadline: addDays(projectStartDate, 30 + Math.floor(Math.random() * 30)),
        priority: template.priority as any,
        estimateHours: template.estimateHours,
        effort: template.effort,
        tags: randomElement([["frontend"], ["backend"], ["design"], ["testing"], ["documentation"], []]),
        blocked: Math.random() < 0.1,
        blockerReason: Math.random() < 0.1 ? "Waiting for design approval" : undefined,
      };
      
      await storage.createTask(task);
      createdTaskIds.push(task.id!);
      result.created.tasks = (result.created.tasks || 0) + 1;
    }
  }

  const numDependencies = Math.min(5, Math.floor(createdTaskIds.length / 4));
  for (let i = 0; i < numDependencies; i++) {
    const taskIdx = Math.floor(Math.random() * (createdTaskIds.length - 1)) + 1;
    const dependsOnIdx = Math.floor(Math.random() * taskIdx);
    
    const dependency: InsertTaskDependency = {
      id: generateId("dep"),
      taskId: createdTaskIds[taskIdx],
      dependsOnTaskId: createdTaskIds[dependsOnIdx],
      dependencyType: "finish-to-start",
    };
    
    try {
      await storage.createTaskDependency(dependency);
      result.created.dependencies = (result.created.dependencies || 0) + 1;
    } catch (e) {
    }
  }
}

async function generateMilestoneData(
  result: SampleDataResult,
  projectStartDate: Date
): Promise<void> {
  const existingMilestones = await storage.getMilestones();
  if (existingMilestones.some(m => m.projectId === SAMPLE_PROJECT_ID)) {
    result.errors?.push("Milestones already exist for sample project.");
    return;
  }

  const milestones: InsertMilestone[] = [
    {
      id: generateId("ms"),
      projectId: SAMPLE_PROJECT_ID,
      name: "Design Approval",
      description: "All designs approved by stakeholders",
      phase: "Design",
      targetDate: addDays(projectStartDate, 28),
      status: "on-track",
      scopeType: "all_tasks",
      completionMode: "percentage",
      completionTargetPercent: 100,
      isBillingGate: true,
    },
    {
      id: generateId("ms"),
      projectId: SAMPLE_PROJECT_ID,
      name: "Alpha Release",
      description: "First internal release for testing",
      phase: "Development",
      targetDate: addDays(projectStartDate, 56),
      status: "pending",
      scopeType: "all_tasks",
      completionMode: "percentage",
      completionTargetPercent: 80,
      isBillingGate: false,
    },
    {
      id: generateId("ms"),
      projectId: SAMPLE_PROJECT_ID,
      name: "Beta Release",
      description: "External beta testing release",
      phase: "Testing",
      targetDate: addDays(projectStartDate, 77),
      status: "pending",
      scopeType: "all_tasks",
      completionMode: "percentage",
      completionTargetPercent: 95,
      isBillingGate: true,
    },
    {
      id: generateId("ms"),
      projectId: SAMPLE_PROJECT_ID,
      name: "Go Live",
      description: "Production launch",
      phase: "Launch",
      targetDate: addDays(projectStartDate, 90),
      status: "pending",
      scopeType: "all_tasks",
      completionMode: "percentage",
      completionTargetPercent: 100,
      isBillingGate: true,
    },
  ];

  for (const milestone of milestones) {
    await storage.createMilestone(milestone);
    result.created.milestones = (result.created.milestones || 0) + 1;
  }
}

async function generateSprintData(
  result: SampleDataResult,
  users: User[],
  now: Date
): Promise<void> {
  const existingSprints = await storage.getSprints();
  if (existingSprints.some(s => s.projectId === SAMPLE_PROJECT_ID)) {
    result.errors?.push("Sprints already exist for sample project.");
    return;
  }

  const sprints: InsertSprint[] = [
    {
      id: generateId("sprint"),
      projectId: SAMPLE_PROJECT_ID,
      ownerUserId: users[0].id,
      name: "Sprint 1 - Discovery",
      goal: "Complete research and initial wireframes",
      startDate: addDays(now, -28),
      endDate: addDays(now, -14),
      status: "completed",
      capacityHours: 80,
      notes: "Focused on user research and competitive analysis",
    },
    {
      id: generateId("sprint"),
      projectId: SAMPLE_PROJECT_ID,
      ownerUserId: users[0].id,
      name: "Sprint 2 - Design",
      goal: "Complete design system components",
      startDate: addDays(now, -14),
      endDate: now,
      status: "active",
      capacityHours: 80,
      notes: "Building core UI components and patterns",
    },
    {
      id: generateId("sprint"),
      projectId: SAMPLE_PROJECT_ID,
      ownerUserId: users[0].id,
      name: "Sprint 3 - Development Kickoff",
      goal: "Start frontend implementation",
      startDate: now,
      endDate: addDays(now, 14),
      status: "planned",
      capacityHours: 100,
      notes: "Begin React implementation with design system",
    },
  ];

  for (const sprint of sprints) {
    await storage.createSprint(sprint);
    result.created.sprints = (result.created.sprints || 0) + 1;

    for (let i = 0; i < Math.min(3, users.length); i++) {
      const member: InsertSprintMember = {
        id: generateId("sm"),
        sprintId: sprint.id!,
        userId: users[i].id,
        capacityHours: 30 + Math.floor(Math.random() * 20),
        capacityPoints: 8 + Math.floor(Math.random() * 5),
      };
      await storage.createSprintMember(member);
      result.created.sprintMembers = (result.created.sprintMembers || 0) + 1;
    }
  }
}

async function generateCommentData(
  result: SampleDataResult,
  users: User[]
): Promise<void> {
  const tasks = await storage.getTasks();
  const sampleTasks = tasks.filter(t => t.projectId === SAMPLE_PROJECT_ID);
  
  if (sampleTasks.length === 0) {
    result.errors?.push("No tasks found. Generate task data first.");
    return;
  }

  const commentBodies = [
    "Great progress on this! Let me know if you need any help.",
    "I've updated the design based on the feedback from the last review.",
    "This is blocked by the API changes. @team please prioritize.",
    "Moving this to review. Ready for code review.",
    "Found a few edge cases we need to handle. Adding to the ticket.",
    "Completed the initial implementation. Testing now.",
    "Looks good! Just a few minor suggestions in the PR.",
    "Can we schedule a quick sync to discuss the approach here?",
    "Updated the documentation with the new API endpoints.",
    "This is ready for QA testing.",
  ];

  const tasksWithComments = sampleTasks.slice(0, Math.min(10, sampleTasks.length));
  
  for (const task of tasksWithComments) {
    const numComments = 1 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numComments; i++) {
      const author = randomElement(users);
      const comment = {
        id: generateId("comment"),
        taskId: task.id,
        authorId: author.id,
        authorName: author.name || "Unknown User",
        body: randomElement(commentBodies),
        createdAt: addDays(new Date(), -Math.floor(Math.random() * 14)),
      };
      
      await storage.createComment(comment);
      result.created.comments = (result.created.comments || 0) + 1;
    }
  }

  const activityTypes = [
    { action: "created task", target: "New Feature Implementation" },
    { action: "updated status", target: "Design Review" },
    { action: "assigned", target: "Bug Fix" },
    { action: "commented on", target: "API Integration" },
    { action: "completed", target: "Documentation Update" },
  ];

  for (let i = 0; i < 5; i++) {
    const user = randomElement(users);
    const actType = randomElement(activityTypes);
    
    const activity: InsertActivity = {
      id: generateId("act"),
      user: user.name || "Unknown User",
      action: actType.action,
      target: actType.target,
      time: `${Math.floor(Math.random() * 24)} hours ago`,
      details: "Sample activity for demonstration",
      avatar: user.avatar,
    };
    
    await storage.createActivity(activity);
    result.created.activities = (result.created.activities || 0) + 1;
  }
}

export async function hasSampleData(): Promise<boolean> {
  const projects = await storage.getProjects();
  return projects.some(p => p.id === SAMPLE_PROJECT_ID);
}
