import { storage } from "../data/storage";
import type { User } from "@shared/schema";

// Demo project IDs
const DEMO_PROJECT_IDS = {
  CRM: "demo-crm-system",
  TASK_MGMT: "demo-task-management",
  TIME_ENTRY: "demo-time-entry",
  ALLIANCE: "demo-partner-alliance",
};

const DEMO_FRAMEWORK_ID = "demo-framework-delivery";
const ALLIANCE_FRAMEWORK_ID = "demo-framework-alliance";

// Demo user IDs  
const DEMO_USER_IDS = {
  ADMIN: "demo-admin",
  SOLUTION_CONSULTANT: "demo-solution-consultant",
  PRODUCT_DESIGNER: "demo-product-designer",
  DEVELOPER_LEAD: "demo-developer-lead",
  QA_ENGINEER: "demo-qa-engineer",
  DOC_MANAGER: "demo-documentation-manager",
  STAKEHOLDER: "demo-stakeholder",
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
  // Return date-only format (YYYY-MM-DD) without time
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

// Demo users with role-based names
const DEMO_USERS = [
  {
    id: DEMO_USER_IDS.ADMIN,
    email: "demo.admin@nymbl.demo",
    firstName: "Demo",
    lastName: "Admin",
    name: "Demo Admin",
    jobTitle: "Administrator",
    systemRole: "admin",
    stage: null,
  },
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
  {
    id: DEMO_USER_IDS.STAKEHOLDER,
    email: "demo.stakeholder@nymbl.demo",
    firstName: "DEMO-STAKEHOLDER",
    lastName: "User",
    name: "DEMO-STAKEHOLDER User",
    jobTitle: "Business Stakeholder",
    systemRole: "viewer",
    stage: null,
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

// Stage definitions for Alliance/Partnership Framework
const ALLIANCE_STAGES = [
  { name: "Discovery", description: "Partner research and initial outreach", order: 1, type: "planning" },
  { name: "Evaluation", description: "Technical and business alignment assessment", order: 2, type: "design" },
  { name: "Negotiation", description: "Terms, contracts, and partnership agreements", order: 3, type: "development" },
  { name: "Integration", description: "Technical integration and joint solution development", order: 4, type: "development" },
  { name: "Launch", description: "Go-to-market and partnership announcement", order: 5, type: "documentation" },
];

// Get user by stage role
function getUserForStage(stage: string, demoUsers: User[]): User | undefined {
  const stageUserMap: Record<string, string> = {
    "Requirements": DEMO_USER_IDS.SOLUTION_CONSULTANT,
    "Design": DEMO_USER_IDS.PRODUCT_DESIGNER,
    "Development": DEMO_USER_IDS.DEVELOPER_LEAD,
    "QA": DEMO_USER_IDS.QA_ENGINEER,
    "Documentation": DEMO_USER_IDS.DOC_MANAGER,
    "Discovery": DEMO_USER_IDS.SOLUTION_CONSULTANT,
    "Evaluation": DEMO_USER_IDS.SOLUTION_CONSULTANT,
    "Negotiation": DEMO_USER_IDS.ADMIN,
    "Integration": DEMO_USER_IDS.DEVELOPER_LEAD,
    "Launch": DEMO_USER_IDS.DOC_MANAGER,
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

        // Delete team members (cascade will handle high-level roles and execution role assignments)
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
      result.created.frameworks = (result.created.frameworks || 0) + 1;
    }

    // 2b. Create Alliance/Partnership Framework
    let allianceFrameworkId = ALLIANCE_FRAMEWORK_ID;
    const existingAllianceFramework = existingFrameworks.find(f => f.id === ALLIANCE_FRAMEWORK_ID);
    
    if (!existingAllianceFramework) {
      const allianceFramework = {
        id: ALLIANCE_FRAMEWORK_ID,
        name: "Alliance Partnership Framework",
        description: "A framework for forming technology partnerships: Discovery, Evaluation, Negotiation, Integration, Launch",
        stageNames: ALLIANCE_STAGES.map(s => s.name),
      };
      await storage.createFrameworkTemplate(allianceFramework as any);
      result.created.frameworks = (result.created.frameworks || 0) + 1;
    }

    const now = new Date();

    // 3. Create CRM System Project (~60% complete, in Development)
    await createCRMProject(result, demoUsers, frameworkId, now);

    // 4. Create Task Management App (~30% complete, in Design)
    await createTaskManagementProject(result, demoUsers, frameworkId, now);

    // 5. Create Time Entry System (~10% complete, in Requirements)
    await createTimeEntryProject(result, demoUsers, frameworkId, now);

    // 6. Create Technology Partner Alliance Project (~25% complete, in Evaluation)
    await createAllianceProject(result, demoUsers, allianceFrameworkId, now);

    // 7. Update app settings to enable demo login
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
  result: DemoDataResult,
  customStages?: typeof DELIVERY_STAGES
): Promise<{ stageIds: Record<string, string>; stages: StageData[] }> {
  const stageIds: Record<string, string> = {};
  const stages: StageData[] = [];
  const stageDefinitions = customStages || DELIVERY_STAGES;

  // Create project
  await storage.createProject({
    id: projectId,
    ...projectData,
    frameworkId,
  } as any);
  result.created.projects = (result.created.projects || 0) + 1;

  // Create stages with appropriate status based on project progress
  const projectDuration = 90; // days
  const stageDuration = projectDuration / stageDefinitions.length;

  for (let i = 0; i < stageDefinitions.length; i++) {
    const stageDef = stageDefinitions[i];
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

// Team member configuration type
interface TeamMemberConfig {
  userId: string;
  highLevelRole: 'owner' | 'manager' | 'stakeholder' | 'member';
  executionRole?: string; // role template ID like "rt_dev_lead"
  allocationPercent?: number;
}

async function createTeamMembersForProject(
  projectId: string,
  teamConfigs: TeamMemberConfig[],
  result: DemoDataResult
): Promise<void> {
  // First, ensure project has execution roles defined
  const existingRoles = await storage.getProjectRolesByProjectId(projectId);
  const roleMap: Record<string, string> = {};
  
  // Create project roles if they don't exist
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

  // Create team members with their roles
  for (const config of teamConfigs) {
    // Create team member
    const teamMember = await storage.createProjectTeamMember({
      projectId,
      userId: config.userId,
      allocationPercent: config.allocationPercent || 100,
    } as any);
    result.created.teamMembers = (result.created.teamMembers || 0) + 1;

    // Create high-level role assignment
    await storage.createHighLevelRole({
      teamMemberId: teamMember.id,
      roleType: config.highLevelRole,
    } as any);

    // Create execution role assignment if specified
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

// Sample pulse content for demo data
const PULSE_DID_SAMPLES = [
  "Completed the initial wireframes for the dashboard",
  "Finished implementing the user authentication flow",
  "Resolved the critical bug in the data sync module",
  "Updated the API documentation with new endpoints",
  "Conducted code review for the team's PRs",
  "Set up CI/CD pipeline for automated testing",
  "Completed unit tests for the core modules",
  "Optimized database queries for better performance",
  "Migrated legacy components to the new framework",
  "Implemented error handling and logging",
];

const PULSE_NEXT_SAMPLES = [
  "Starting work on the user profile feature",
  "Will begin integration testing tomorrow",
  "Planning to refactor the notification system",
  "Need to review the design specs with the team",
  "Going to implement the search functionality",
  "Will focus on accessibility improvements",
  "Starting the mobile responsive updates",
  "Planning to set up monitoring dashboards",
  "Will implement the export functionality",
  "Starting the performance optimization phase",
];

const PULSE_BLOCKER_SAMPLES = [
  "Waiting on API specs from the backend team",
  "Blocked on design approval for the new UI",
  "Need access to the staging environment",
  "Pending security review before deployment",
  "Waiting for third-party integration credentials",
  null, // Some updates don't have blockers
  null,
  null,
  null,
  null,
];

async function createPulseUpdatesForSprint(
  sprintId: string,
  sprintStatus: string,
  sprintStartDate: string,
  sprintEndDate: string,
  demoUsers: User[],
  result: DemoDataResult
): Promise<void> {
  // Only create pulse updates for active or completed sprints
  if (sprintStatus !== "active" && sprintStatus !== "completed") {
    return;
  }

  const startDate = new Date(sprintStartDate);
  const endDate = new Date(sprintEndDate);
  const now = new Date();
  
  // Determine the date range for pulse updates
  const effectiveEndDate = sprintStatus === "active" ? 
    (now < endDate ? now : endDate) : endDate;
  
  // For active sprints, create updates for the past few days
  // For completed sprints, create updates throughout the sprint
  const totalDays = Math.floor((effectiveEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Create 1-2 updates per user spread across the sprint
  const participatingUsers = demoUsers.slice(0, 4); // First 4 demo users
  
  for (const user of participatingUsers) {
    // Each user posts 1-3 updates during the sprint
    const updateCount = sprintStatus === "completed" ? 
      Math.floor(Math.random() * 2) + 2 : // 2-3 for completed
      Math.floor(Math.random() * 2) + 1;  // 1-2 for active
    
    for (let i = 0; i < updateCount; i++) {
      // Calculate a random date within the sprint
      const daysOffset = Math.floor(Math.random() * Math.max(1, totalDays - 1)) + 1;
      const updateDate = addDays(startDate, daysOffset);
      
      // Don't create future updates
      if (updateDate > now) continue;
      
      const didIdx = Math.floor(Math.random() * PULSE_DID_SAMPLES.length);
      const nextIdx = Math.floor(Math.random() * PULSE_NEXT_SAMPLES.length);
      const blockerIdx = Math.floor(Math.random() * PULSE_BLOCKER_SAMPLES.length);
      
      const pulseId = generateId("pulse");
      
      await storage.createSprintPulseUpdate({
        id: pulseId,
        sprintId,
        userId: user.id,
        date: toDateString(updateDate),
        didText: PULSE_DID_SAMPLES[didIdx],
        nextText: PULSE_NEXT_SAMPLES[nextIdx],
        blockersText: PULSE_BLOCKER_SAMPLES[blockerIdx] || null,
        referencedTaskIds: [],
      } as any);
      
      result.created.pulseUpdates = (result.created.pulseUpdates || 0) + 1;
    }
  }
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
      scopeRules: [
        {
          id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          label: "All Stage Tasks",
          stageFilter: config.phase,
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
  
  // Create pulse updates for active/completed sprints
  for (const sprint of sprints) {
    await createPulseUpdatesForSprint(sprint.id, sprint.status, sprint.startDate, sprint.endDate, demoUsers, result);
  }

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

  // Add team members with varied roles
  const crmTeam: TeamMemberConfig[] = [
    { userId: DEMO_USER_IDS.ADMIN, highLevelRole: 'owner' },
    { userId: DEMO_USER_IDS.SOLUTION_CONSULTANT, highLevelRole: 'manager', executionRole: 'rt_solution_consultant' },
    { userId: DEMO_USER_IDS.PRODUCT_DESIGNER, highLevelRole: 'member', executionRole: 'rt_product_designer' },
    { userId: DEMO_USER_IDS.DEVELOPER_LEAD, highLevelRole: 'member', executionRole: 'rt_dev_lead' },
    { userId: DEMO_USER_IDS.QA_ENGINEER, highLevelRole: 'member', executionRole: 'rt_qa_engineer' },
    { userId: DEMO_USER_IDS.DOC_MANAGER, highLevelRole: 'member', executionRole: 'rt_documentation_manager' },
    { userId: DEMO_USER_IDS.STAKEHOLDER, highLevelRole: 'stakeholder' },
  ];
  await createTeamMembersForProject(projectId, crmTeam, result);
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
  
  // Create pulse updates for active/completed sprints
  for (const sprint of sprints) {
    await createPulseUpdatesForSprint(sprint.id, sprint.status, sprint.startDate, sprint.endDate, demoUsers, result);
  }

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

  // Add team members
  const taskMgmtTeam: TeamMemberConfig[] = [
    { userId: DEMO_USER_IDS.SOLUTION_CONSULTANT, highLevelRole: 'owner', executionRole: 'rt_solution_consultant' },
    { userId: DEMO_USER_IDS.ADMIN, highLevelRole: 'manager' },
    { userId: DEMO_USER_IDS.PRODUCT_DESIGNER, highLevelRole: 'member', executionRole: 'rt_product_designer' },
    { userId: DEMO_USER_IDS.DEVELOPER_LEAD, highLevelRole: 'member', executionRole: 'rt_dev_lead' },
    { userId: DEMO_USER_IDS.STAKEHOLDER, highLevelRole: 'stakeholder' },
  ];
  await createTeamMembersForProject(projectId, taskMgmtTeam, result);
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
  
  // Create pulse updates for active/completed sprints
  for (const sprint of sprints) {
    await createPulseUpdatesForSprint(sprint.id, sprint.status, sprint.startDate, sprint.endDate, demoUsers, result);
  }

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

  // Add team members
  const timeEntryTeam: TeamMemberConfig[] = [
    { userId: DEMO_USER_IDS.ADMIN, highLevelRole: 'owner' },
    { userId: DEMO_USER_IDS.SOLUTION_CONSULTANT, highLevelRole: 'manager', executionRole: 'rt_solution_consultant' },
    { userId: DEMO_USER_IDS.PRODUCT_DESIGNER, highLevelRole: 'member', executionRole: 'rt_product_designer' },
    { userId: DEMO_USER_IDS.DEVELOPER_LEAD, highLevelRole: 'member', executionRole: 'rt_dev_lead' },
    { userId: DEMO_USER_IDS.STAKEHOLDER, highLevelRole: 'stakeholder' },
  ];
  await createTeamMembersForProject(projectId, timeEntryTeam, result);
}

async function createAllianceProject(
  result: DemoDataResult,
  demoUsers: User[],
  frameworkId: string,
  now: Date
): Promise<void> {
  const projectId = DEMO_PROJECT_IDS.ALLIANCE;
  const startDate = addDays(now, -21);
  const deadline = addDays(now, 69);

  const { stageIds, stages } = await createProjectWithStages(
    projectId,
    {
      name: "Technology Partner Alliance",
      description: "Strategic initiative to form a technology partnership with an AI platform provider, enabling joint solution offerings and market expansion.",
      status: "active",
      startDate: toDateString(startDate),
      deadline: toDateString(deadline),
      progress: 25,
      ownerId: demoUsers[0]?.id,
      client: "External Partnership",
      riskLevel: "medium",
      sprintDurationWeeks: 2,
      currentStageIndex: 1, // Evaluation (0-indexed)
    },
    frameworkId,
    startDate,
    result,
    ALLIANCE_STAGES
  );

  // Create sprints
  const sprintConfigs = [
    { name: "Sprint 1", goal: "Partner discovery and research", startOffset: 0, endOffset: 14, status: "completed" },
    { name: "Sprint 2", goal: "Technical evaluation", startOffset: 14, endOffset: 28, status: "active" },
    { name: "Sprint 3", goal: "Partnership terms", startOffset: 28, endOffset: 42, status: "planned" },
  ];
  const sprints = await createSprintsForProject(projectId, sprintConfigs, startDate, demoUsers, result);
  
  // Create pulse updates
  for (const sprint of sprints) {
    await createPulseUpdatesForSprint(sprint.id, sprint.status, sprint.startDate, sprint.endDate, demoUsers, result);
  }

  // Create milestones
  const milestoneConfigs = [
    { name: "Partner Shortlist", description: "Final list of potential partners", phase: "Discovery", targetOffset: 14, status: "completed", ownerIndex: 0 },
    { name: "Technical Assessment", description: "Complete technical fit evaluation", phase: "Evaluation", targetOffset: 28, status: "on-track", ownerIndex: 1 },
    { name: "Term Sheet Agreement", description: "Agreement on partnership terms", phase: "Negotiation", targetOffset: 45, status: "pending", ownerIndex: 0 },
    { name: "Partnership Launch", description: "Public announcement of partnership", phase: "Launch", targetOffset: 80, status: "pending", ownerIndex: 5 },
  ];
  const milestones = await createMilestonesForProject(projectId, milestoneConfigs, startDate, stageIds, demoUsers, result);

  const deliverables = [
    {
      title: "Partner Discovery",
      description: "Identify and research potential technology partners",
      status: "completed",
      progress: 100,
      epics: [
        { title: "Market Research", description: "Research AI platform landscape", status: "completed", progress: 100, stage: "Discovery" },
        { title: "Partner Criteria", description: "Define partner evaluation criteria", status: "completed", progress: 100, stage: "Discovery" },
        { title: "Initial Outreach", description: "Contact potential partners", status: "completed", progress: 100, stage: "Discovery" },
      ],
    },
    {
      title: "Technical Evaluation",
      description: "Assess technical compatibility and integration potential",
      status: "in-progress",
      progress: 40,
      epics: [
        { title: "API Assessment", description: "Evaluate partner APIs", status: "in-progress", progress: 60, stage: "Evaluation" },
        { title: "Integration POC", description: "Build proof of concept integration", status: "in-progress", progress: 30, stage: "Evaluation" },
        { title: "Security Review", description: "Security and compliance assessment", status: "not-started", progress: 0, stage: "Evaluation" },
      ],
    },
    {
      title: "Partnership Agreement",
      description: "Negotiate and finalize partnership terms",
      status: "not-started",
      progress: 0,
      epics: [
        { title: "Term Sheet", description: "Draft partnership term sheet", status: "not-started", progress: 0, stage: "Negotiation" },
        { title: "Legal Review", description: "Legal contract review", status: "not-started", progress: 0, stage: "Negotiation" },
        { title: "Executive Approval", description: "Get leadership sign-off", status: "not-started", progress: 0, stage: "Negotiation" },
      ],
    },
    {
      title: "Go-to-Market",
      description: "Plan and execute partnership launch",
      status: "not-started",
      progress: 0,
      epics: [
        { title: "Joint Solution", description: "Define joint solution offering", status: "not-started", progress: 0, stage: "Integration" },
        { title: "Launch Plan", description: "Create go-to-market plan", status: "not-started", progress: 0, stage: "Launch" },
        { title: "Press Release", description: "Partnership announcement", status: "not-started", progress: 0, stage: "Launch" },
      ],
    },
  ];

  await createDeliverablesWithEpicsAndTasks(projectId, deliverables, stageIds, stages, sprints, milestones, demoUsers, startDate, result);

  // Add team members with strategic focus
  const allianceTeam: TeamMemberConfig[] = [
    { userId: DEMO_USER_IDS.ADMIN, highLevelRole: 'owner' },
    { userId: DEMO_USER_IDS.SOLUTION_CONSULTANT, highLevelRole: 'manager', executionRole: 'rt_solution_consultant' },
    { userId: DEMO_USER_IDS.DEVELOPER_LEAD, highLevelRole: 'member', executionRole: 'rt_dev_lead' },
    { userId: DEMO_USER_IDS.STAKEHOLDER, highLevelRole: 'stakeholder' },
    { userId: DEMO_USER_IDS.DOC_MANAGER, highLevelRole: 'member', executionRole: 'rt_documentation_manager' },
  ];
  await createTeamMembersForProject(projectId, allianceTeam, result);
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
            : projectId === DEMO_PROJECT_IDS.ALLIANCE ? "Technology Partner Alliance"
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
