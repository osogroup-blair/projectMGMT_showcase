import { storage } from "../data/storage";
import type { User } from "@shared/schema";

const SAMPLE_PROJECT_ID = "sample-website-redesign";

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
      await generateMilestoneData(result, users, projectStartDate);
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
  
  const project = {
    id: SAMPLE_PROJECT_ID,
    name: "Website Redesign Project",
    description: "Complete redesign of the company website with modern UI/UX, improved performance, and new features. This sample project demonstrates all capabilities of the project management system.",
    status: "active",
    startDate: toDateString(startDate),
    deadline: toDateString(endDate),
    progress: 35,
    ownerId: owner.id,
    client: "Acme Corporation",
    riskLevel: "medium",
    sprintDurationWeeks: 2,
  };
  await storage.createProject(project as any);
  result.created.projects = 1;

  const stageData = [
    { name: "Discovery", description: "Research and requirements gathering", order: 1, type: "planning", status: "completed", startOffset: 0, endOffset: 14 },
    { name: "Design", description: "UI/UX design and prototyping", order: 2, type: "design", status: "active", startOffset: 14, endOffset: 35 },
    { name: "Development", description: "Frontend and backend implementation", order: 3, type: "development", status: "pending", startOffset: 35, endOffset: 70 },
    { name: "Testing", description: "QA and user acceptance testing", order: 4, type: "testing", status: "pending", startOffset: 70, endOffset: 84 },
    { name: "Launch", description: "Deployment and go-live", order: 5, type: "deployment", status: "pending", startOffset: 84, endOffset: 90 },
  ];
  
  for (const s of stageData) {
    const stage = {
      id: generateId("stage"),
      projectId: SAMPLE_PROJECT_ID,
      name: s.name,
      description: s.description,
      order: s.order,
      type: s.type,
      status: s.status,
      startDate: toDateString(addDays(startDate, s.startOffset)),
      endDate: toDateString(addDays(startDate, s.endOffset)),
    };
    await storage.createProjectStage(stage as any);
    result.created.stages = (result.created.stages || 0) + 1;
  }

  const deliverableConfigs = [
    {
      title: "Design System",
      description: "Complete design system with components, patterns, and guidelines",
      status: "in-progress",
      ownerId: users[0]?.id,
      startOffset: 0,
      dueOffset: 35,
      progress: 60,
      epics: [
        { title: "Brand Guidelines", description: "Color palette, typography, and visual identity", status: "completed", progress: 100, startOffset: 0, endOffset: 10 },
        { title: "Component Library", description: "Reusable UI components", status: "in-progress", progress: 45, startOffset: 10, endOffset: 28 },
        { title: "Documentation", description: "Usage guidelines and examples", status: "not-started", progress: 0, startOffset: 28, endOffset: 35 },
      ],
    },
    {
      title: "Frontend Development",
      description: "React-based frontend with responsive design",
      status: "not-started",
      ownerId: users[1]?.id || users[0]?.id,
      startOffset: 35,
      dueOffset: 70,
      progress: 10,
      epics: [
        { title: "Homepage", description: "Landing page with hero section and features", status: "not-started", progress: 0, startOffset: 35, endOffset: 45 },
        { title: "Product Pages", description: "Product catalog and detail pages", status: "not-started", progress: 0, startOffset: 45, endOffset: 55 },
        { title: "User Dashboard", description: "Account management and user profile", status: "not-started", progress: 0, startOffset: 55, endOffset: 70 },
      ],
    },
    {
      title: "Backend API",
      description: "RESTful API with authentication and data management",
      status: "not-started",
      ownerId: users[2]?.id || users[0]?.id,
      startOffset: 35,
      dueOffset: 70,
      progress: 5,
      epics: [
        { title: "Authentication", description: "User login, registration, and OAuth", status: "not-started", progress: 0, startOffset: 35, endOffset: 45 },
        { title: "Product API", description: "CRUD operations for products and categories", status: "not-started", progress: 0, startOffset: 45, endOffset: 60 },
        { title: "Integration", description: "Third-party service integrations", status: "not-started", progress: 0, startOffset: 60, endOffset: 70 },
      ],
    },
    {
      title: "Management Activities",
      description: "Project management and coordination tasks",
      status: "in-progress",
      ownerId: users[0]?.id,
      startOffset: 0,
      dueOffset: 90,
      progress: 40,
      epics: [
        { title: "Project Management", description: "Planning, tracking, and coordination", status: "in-progress", progress: 40, startOffset: 0, endOffset: 90 },
      ],
    },
  ];

  for (const config of deliverableConfigs) {
    const deliverableId = generateId("del");
    const deliverable = {
      id: deliverableId,
      projectId: SAMPLE_PROJECT_ID,
      title: config.title,
      description: config.description,
      status: config.status,
      ownerId: config.ownerId,
      startDate: toDateString(addDays(startDate, config.startOffset)),
      dueDate: toDateString(addDays(startDate, config.dueOffset)),
      progress: config.progress,
    };
    await storage.createDeliverable(deliverable as any);
    result.created.deliverables = (result.created.deliverables || 0) + 1;
    
    for (const epicConfig of config.epics) {
      const epic = {
        id: generateId("epic"),
        deliverableId,
        title: epicConfig.title,
        description: epicConfig.description,
        status: epicConfig.status,
        ownerId: users[Math.floor(Math.random() * users.length)]?.id,
        startDate: toDateString(addDays(startDate, epicConfig.startOffset)),
        endDate: toDateString(addDays(startDate, epicConfig.endOffset)),
        progress: epicConfig.progress,
      };
      await storage.createEpic(epic as any);
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
    { title: "Research and Analysis", description: "Conduct research and document findings", priority: "high", effort: 2, estimateHours: 8 },
    { title: "Create Wireframes", description: "Design low-fidelity wireframes", priority: "high", effort: 3, estimateHours: 16 },
    { title: "Design Mockups", description: "Create high-fidelity design mockups", priority: "high", effort: 3, estimateHours: 24 },
    { title: "Review and Feedback", description: "Collect stakeholder feedback", priority: "medium", effort: 1, estimateHours: 4 },
    { title: "Implementation", description: "Develop the feature", priority: "high", effort: 5, estimateHours: 40 },
    { title: "Unit Testing", description: "Write and run unit tests", priority: "medium", effort: 2, estimateHours: 8 },
    { title: "Code Review", description: "Peer review of code changes", priority: "medium", effort: 1, estimateHours: 4 },
    { title: "Documentation", description: "Update technical documentation", priority: "low", effort: 1, estimateHours: 4 },
    { title: "Integration Testing", description: "Test integration with other components", priority: "medium", effort: 2, estimateHours: 8 },
    { title: "Bug Fixes", description: "Fix reported issues", priority: "high", effort: 2, estimateHours: 8 },
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
      
      const taskId = generateId("task");
      const task = {
        id: taskId,
        title: `${template.title} - ${epic.title}`,
        description: template.description,
        project: "Website Redesign Project",
        projectId: SAMPLE_PROJECT_ID,
        epicId: epic.id,
        status,
        assigneeId: randomElement(users).id,
        deadline: toDateString(addDays(projectStartDate, 30 + Math.floor(Math.random() * 30))),
        priority: template.priority,
        estimateHours: template.estimateHours,
        effort: template.effort,
        tags: randomElement([["frontend"], ["backend"], ["design"], ["testing"], ["documentation"], []]),
        blocked: Math.random() < 0.1,
        blockerReason: Math.random() < 0.1 ? "Waiting for design approval" : undefined,
      };
      
      await storage.createTask(task as any);
      createdTaskIds.push(taskId);
      result.created.tasks = (result.created.tasks || 0) + 1;
    }
  }

  const numDependencies = Math.min(5, Math.floor(createdTaskIds.length / 4));
  for (let i = 0; i < numDependencies; i++) {
    const taskIdx = Math.floor(Math.random() * (createdTaskIds.length - 1)) + 1;
    const dependsOnIdx = Math.floor(Math.random() * taskIdx);
    
    const dependency = {
      id: generateId("dep"),
      taskId: createdTaskIds[taskIdx],
      dependsOnTaskId: createdTaskIds[dependsOnIdx],
      dependencyType: "finish-to-start",
    };
    
    try {
      await storage.createTaskDependency(dependency as any);
      result.created.dependencies = (result.created.dependencies || 0) + 1;
    } catch (e) {
    }
  }
}

async function generateMilestoneData(
  result: SampleDataResult,
  users: User[],
  projectStartDate: Date
): Promise<void> {
  const existingMilestones = await storage.getMilestones();
  if (existingMilestones.some(m => m.projectId === SAMPLE_PROJECT_ID)) {
    result.errors?.push("Milestones already exist for sample project.");
    return;
  }

  const milestoneConfigs = [
    { name: "Design Approval", description: "All designs approved by stakeholders", phase: "Design", offsetDays: 28, status: "on-track", isBillingGate: true },
    { name: "Alpha Release", description: "First internal release for testing", phase: "Development", offsetDays: 56, status: "pending", isBillingGate: false },
    { name: "Beta Release", description: "External beta testing release", phase: "Testing", offsetDays: 77, status: "pending", isBillingGate: true },
    { name: "Go Live", description: "Production launch", phase: "Launch", offsetDays: 90, status: "pending", isBillingGate: true },
  ];

  for (const config of milestoneConfigs) {
    const milestone = {
      id: generateId("ms"),
      projectId: SAMPLE_PROJECT_ID,
      name: config.name,
      description: config.description,
      phase: config.phase,
      targetDate: toDateString(addDays(projectStartDate, config.offsetDays)),
      status: config.status,
      ownerId: users[0].id,
      scopeType: "all_tasks",
      completionMode: "percentage",
      completionTargetPercent: 100,
      isBillingGate: config.isBillingGate,
    };
    await storage.createMilestone(milestone as any);
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

  const sprintConfigs = [
    { name: "Sprint 1 - Discovery", goal: "Complete research and initial wireframes", startOffset: -28, endOffset: -14, status: "completed", capacityHours: 80, notes: "Focused on user research and competitive analysis" },
    { name: "Sprint 2 - Design", goal: "Complete design system components", startOffset: -14, endOffset: 0, status: "active", capacityHours: 80, notes: "Building core UI components and patterns" },
    { name: "Sprint 3 - Development Kickoff", goal: "Start frontend implementation", startOffset: 0, endOffset: 14, status: "planned", capacityHours: 100, notes: "Begin React implementation with design system" },
  ];

  for (const config of sprintConfigs) {
    const sprintId = generateId("sprint");
    const sprint = {
      id: sprintId,
      projectId: SAMPLE_PROJECT_ID,
      ownerUserId: users[0].id,
      name: config.name,
      goal: config.goal,
      startDate: toDateString(addDays(now, config.startOffset)),
      endDate: toDateString(addDays(now, config.endOffset)),
      status: config.status,
      capacityHours: config.capacityHours,
      notes: config.notes,
    };
    await storage.createSprint(sprint as any);
    result.created.sprints = (result.created.sprints || 0) + 1;

    for (let i = 0; i < Math.min(3, users.length); i++) {
      const member = {
        id: generateId("sm"),
        sprintId: sprintId,
        userId: users[i].id,
        capacityHours: 30 + Math.floor(Math.random() * 20),
        capacityPoints: 8 + Math.floor(Math.random() * 5),
      };
      await storage.createSprintMember(member as any);
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
      
      await storage.createComment(comment as any);
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
    
    const activity = {
      id: generateId("act"),
      user: user.name || "Unknown User",
      action: actType.action,
      target: actType.target,
      time: `${Math.floor(Math.random() * 24)} hours ago`,
      details: "Sample activity for demonstration",
      avatar: user.avatar,
    };
    
    await storage.createActivity(activity as any);
    result.created.activities = (result.created.activities || 0) + 1;
  }
}

export async function hasSampleData(): Promise<boolean> {
  const projects = await storage.getProjects();
  return projects.some(p => p.id === SAMPLE_PROJECT_ID);
}
