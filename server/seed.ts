import { storage } from "./storage";

export async function seedDatabase() {
  try {
    console.log('Starting database seed...');
    
    // Seed Framework Templates
    await storage.createFrameworkTemplate({
      id: "ft_impl",
      name: "Implementation Framework",
      description: "Standard implementation delivery framework",
      defaultStages: ["st_plan", "st_validate", "st_develop", "st_enable"]
    });
    
    // Seed Users
    const users = [
      { id: "1", name: "Nym Bull", role: "Product Manager", status: "Online", email: "nym.bull@nexus.com" },
      { id: "2", name: "Jessica Lin", role: "Project Manager", status: "In Meeting", email: "jessica.lin@nexus.com" },
      { id: "3", name: "Susan Smith", role: "UX Designer", status: "Online", email: "susan.smith@nexus.com" },
      { id: "4", name: "Jason Ho", role: "CEO", status: "Offline", email: "jason.ho@nexus.com" },
      { id: "5", name: "Jason Roberts", role: "Senior Developer", status: "Online", email: "jason.roberts@nexus.com" },
      { id: "6", name: "Nigel Wong", role: "UX Designer", status: "Offline", email: "nigel.wong@nexus.com" },
      { id: "7", name: "Steven Ahmed", role: "UX Designer", status: "In Meeting", email: "steven.ahmed@nexus.com" },
    ];
    for (const user of users) {
      await storage.createUser(user);
    }
    
    // Seed Projects
    const projects = [
      { id: "1", name: "Houlihan Lokey Rebrand", status: "In Progress", startDate: "2024-10-01", deadline: "11/28", progress: 65, frameworkId: "ft_impl", defaultMappingTemplateId: "mt1" },
      { id: "2", name: "Colgate-Palmolive Retool", status: "Upcoming", startDate: "2025-01-01", deadline: "Tomorrow", progress: 0, frameworkId: "ft_impl" },
      { id: "3", name: "Kraft HR", status: "On Hold", deadline: "11/30", progress: 30, frameworkId: "ft_impl" },
      { id: "4", name: "SDMP Internal Project", status: "Completed", deadline: "Yesterday", progress: 100, frameworkId: "ft_impl" },
      { id: "5", name: "Quality Matters", status: "Overdue", deadline: "Yesterday", progress: 85, frameworkId: "ft_impl" },
    ];
    for (const project of projects) {
      await storage.createProject(project);
    }
    
    // Seed Project Stages
    const stages = [
      { id: "st_plan", name: "Plan Strategy", description: "Define the strategic direction and core requirements.", order: 1, type: "planning", status: "completed" },
      { id: "st_validate", name: "Validate Blueprints", description: "Confirm design and architecture decisions.", order: 2, type: "execution", status: "active" },
      { id: "st_develop", name: "Develop Solution", description: "Build and implement the solution components.", order: 3, type: "execution", status: "pending" },
      { id: "st_enable", name: "Enable Users", description: "Train users and prepare for go-live.", order: 4, type: "delivery", status: "pending" },
    ];
    for (const stage of stages) {
      await storage.createProjectStage(stage);
    }
    
    // Seed Deliverables
    const deliverables = [
      { id: "d1", projectId: "1", title: "Brand Strategy", description: "Complete overhaul of brand positioning and messaging framework.", status: "Completed", ownerId: "1", dueDate: "2023-12-15", progress: 100 },
      { id: "d2", projectId: "1", title: "Digital Presence", description: "New website design and development including CMS implementation.", status: "In Progress", ownerId: "2", dueDate: "2024-02-28", progress: 45 },
      { id: "d3", projectId: "1", title: "Marketing Collateral", description: "Templates for presentations, business cards, and social media assets.", status: "Not Started", ownerId: "3", dueDate: "2024-03-15", progress: 0 },
    ];
    for (const deliverable of deliverables) {
      await storage.createDeliverable(deliverable);
    }
    
    // Seed Epics
    const epics = [
      { id: "e1", deliverableId: "d2", title: "Website Redesign", description: "UX/UI design phases including wireframing and prototyping.", status: "In Progress", ownerId: "3", startDate: "2023-11-01", endDate: "2024-01-15", progress: 60, stageIds: ["st_validate", "st_develop", "st_enable"] },
      { id: "e2", deliverableId: "d2", title: "CMS Implementation", description: "Backend development and content migration to the new CMS.", status: "Not Started", ownerId: "5", startDate: "2024-01-01", endDate: "2024-02-28", progress: 0, stageIds: ["st_develop", "st_enable"] },
      { id: "e3", deliverableId: "d1", title: "Market Research", description: "Competitor analysis and stakeholder interviews.", status: "Completed", ownerId: "1", startDate: "2023-10-01", endDate: "2023-11-15", progress: 100, stageIds: ["st_plan"] },
    ];
    for (const epic of epics) {
      await storage.createEpic(epic);
    }
    
    // Seed Milestones
    const milestones = [
      { id: "m1", projectId: "1", name: "Strategy Sign-off", description: "Final approval of brand strategy and core messaging", phase: "plan_strategy", stageId: "st_plan", targetDate: "2024-12-15", status: "achieved", ownerId: "1", scopeType: "manual", completionMode: "all_tasks", completionTargetPercent: 100, tags: ["Strategy", "Client"], progressTotalTasks: 5, progressCompletedTasks: 5, progressPercentComplete: 100, progressPercent: 100, isBillingGate: true, requiredCompletionRatio: 100 },
      { id: "m2", projectId: "1", name: "Visual Identity Presentation", description: "Presenting the 3 directions for visual identity", phase: "validate_blueprints", stageId: "st_validate", targetDate: "2025-01-10", status: "in_progress", ownerId: "3", scopeType: "mixed", completionMode: "percentage", completionTargetPercent: 80, tags: ["Design", "Review"], progressTotalTasks: 10, progressCompletedTasks: 6, progressPercentComplete: 60, progressPercent: 60, isBillingGate: false, requiredCompletionRatio: 80 },
      { id: "m3", projectId: "1", name: "Alpha Release", description: "Internal release for team testing", phase: "develop_solution", stageId: "st_develop", targetDate: "2025-02-01", status: "planned", ownerId: "5", scopeType: "rule_based", completionMode: "percentage", completionTargetPercent: 90, tags: ["Dev", "Release"], progressTotalTasks: 20, progressCompletedTasks: 0, progressPercentComplete: 0, progressPercent: 0, isBillingGate: true, requiredCompletionRatio: 90 },
      { id: "m4", projectId: "1", name: "UAT Completion", description: "User acceptance testing sign-off from client", phase: "enable_users", stageId: "st_enable", targetDate: "2025-02-20", status: "planned", ownerId: "2", scopeType: "rule_based", completionMode: "all_tasks", completionTargetPercent: 100, tags: ["QA", "Client"], progressTotalTasks: 15, progressCompletedTasks: 0, progressPercentComplete: 0, progressPercent: 0, isBillingGate: false, requiredCompletionRatio: 100 },
    ];
    for (const milestone of milestones) {
      await storage.createMilestone(milestone);
    }
    
    // Seed Tasks
    const tasks = [
      { id: "1", title: "Code Review", description: "Review pull requests for the authentication module. Focus on security vulnerabilities and code style consistency.", project: "Quality Matters", stageId: "st_develop", epicId: "e2", status: "Review", deadline: "Tomorrow", priority: "High", assigneeId: "5", milestoneId: "m3", estimateHours: 4, tags: ["Backend", "Security"] },
      { id: "2", title: "Feature Implementation", description: "Implement the new dashboard widgets as per design. Ensure responsiveness on mobile devices.", project: "Houlihan Lokey", stageId: "st_develop", epicId: "e1", status: "In Progress", deadline: "11/28", priority: "Medium", assigneeId: "6", milestoneId: "m3", estimateHours: 12, tags: ["Frontend", "React"] },
      { id: "3", title: "Bug Fixing", description: "Fix the reported crash on the user profile page when uploading large avatars.", project: "Kraft HR", stageId: "st_enable", epicId: "e2", status: "Todo", deadline: "11/29", priority: "High", assigneeId: "5", milestoneId: "m4", estimateHours: 2, tags: ["Bug", "Urgent"] },
      { id: "4", title: "System Optimization", description: "Optimize database queries for faster load times on the reports page.", project: "Colgate-Palmolive", stageId: "st_develop", epicId: "e2", status: "Todo", deadline: "Tomorrow", priority: "Medium", assigneeId: "2", milestoneId: "m3", estimateHours: 8, tags: ["Database", "Performance"] },
      { id: "5", title: "API Development", description: "Create REST endpoints for the mobile app to fetch user settings.", project: "Houlihan Lokey", stageId: "st_develop", epicId: "e2", status: "Todo", deadline: "11/30", priority: "High", assigneeId: "5", milestoneId: "m3", estimateHours: 16, tags: ["API", "Backend"] },
      { id: "6", title: "Testing and QA", description: "Run regression tests before the release. Document any failures in JIRA.", project: "Kraft", stageId: "st_enable", epicId: "e2", status: "Todo", deadline: "11/30", priority: "Low", assigneeId: "7", milestoneId: "m4", estimateHours: 6, tags: ["QA", "Testing"] },
      { id: "7", title: "Design System Update", description: "Update the color palette in the design system to match the new brand guidelines.", project: "Houlihan Lokey", stageId: "st_validate", epicId: "e1", status: "Done", deadline: "Yesterday", priority: "Medium", assigneeId: "3", milestoneId: "m2", estimateHours: 4, tags: ["Design", "UI/UX"] },
      { id: "8", title: "Client Meeting Prep", description: "Prepare slides for the weekly status update. Include metrics on velocity and burn-down.", project: "Houlihan Lokey", stageId: "st_plan", epicId: "e3", status: "Done", deadline: "Last Week", priority: "High", assigneeId: "1", milestoneId: "m1", estimateHours: 2, tags: ["Management", "Client"] },
    ];
    for (const task of tasks) {
      await storage.createTask(task);
    }
    
    // Seed Activity
    const activities = [
      { id: "1", user: "Jason Roberts", action: "Commented", target: "Colgate-Palmolive: System Optimization", time: "2 hours ago", details: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium..." },
      { id: "2", user: "Susan Smith", action: "Marked Complete", target: "Kraft HR: Bug Fixing", time: "3 hours ago", details: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium..." },
      { id: "3", user: "Jessica Lin", action: "Created New Folder", target: "Quality Matters: Code Review", time: "9:34 AM", details: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium..." },
    ];
    for (const activity of activities) {
      await storage.createActivity(activity);
    }
    
    // Seed Project Roles
    const roles = [
      { id: "r1", name: "Project Manager", description: "Responsible for overall project delivery, timeline, and budget.", roleType: "Management", isRequired: true, maxAssignees: 1, permissions: ["manage_project", "manage_budget", "assign_tasks"] },
      { id: "r2", name: "Lead Designer", description: "Owns the design direction and visual language of the project.", roleType: "Design", isRequired: true, maxAssignees: 1, permissions: ["manage_design", "approve_design", "assign_tasks"] },
      { id: "r3", name: "Senior Developer", description: "Technical lead responsible for architecture and code quality.", roleType: "Development", isRequired: true, maxAssignees: 2, permissions: ["manage_code", "approve_pr", "deploy"] },
    ];
    for (const role of roles) {
      await storage.createProjectRole(role);
    }
    
    // Seed Role Assignments
    const roleAssignments = [
      { id: "ra1", roleId: "r1", userId: "2", isPrimary: true, allocationPercent: 100 },
      { id: "ra2", roleId: "r2", userId: "3", isPrimary: true, allocationPercent: 80 },
      { id: "ra3", roleId: "r3", userId: "5", isPrimary: true, allocationPercent: 100 },
    ];
    for (const assignment of roleAssignments) {
      await storage.createRoleAssignment(assignment);
    }
    
    // Seed Saved Views
    const views = [
      { id: "v1", name: "Default Kanban", description: "Standard board view for daily standups", stageIds: ["s1", "s2", "s3", "s4"], viewType: "Kanban", visibility: "Global", isDefault: true, config: { groupBy: "stage" } },
      { id: "v2", name: "My Tasks List", description: "List of tasks assigned to me", stageIds: [], viewType: "List", visibility: "Personal", isDefault: false, config: { filterBy: "assignee:me" } },
    ];
    for (const view of views) {
      await storage.createSavedView(view);
    }
    
    console.log('Database seeded successfully!');
    return { success: true };
  } catch (error: any) {
    console.error('Error seeding database:', error);
    throw error;
  }
}
