import { storage } from "../data/storage";

export async function seedDatabase() {
      try {
            console.log('Starting database seed...');

            // Seed Task Types (global defaults)
            const taskTypes = [
                  {
                        "id": "b30b1ce2-c18a-4ddb-b900-9ef6a7852f85",
                        "name": "Requirements Task",
                        "color": "bg-blue-50 text-blue-700",
                        "icon": null,
                        "isDefault": false,
                        "order": 0,
                        "createdAt": "2026-01-10T22:57:16.643Z"
                  },
                  {
                        "id": "6e038b95-2b27-4061-acfd-796350807502",
                        "name": "QA Task",
                        "color": "bg-blue-50 text-blue-700",
                        "icon": null,
                        "isDefault": false,
                        "order": 0,
                        "createdAt": "2026-01-10T22:57:28.880Z"
                  },
                  {
                        "id": "6b015872-67a0-46f6-870f-5826150e13b4",
                        "name": "Action",
                        "color": "bg-slate-100 text-slate-700",
                        "icon": null,
                        "isDefault": false,
                        "order": 0,
                        "createdAt": "2026-01-11T06:53:42.108Z"
                  },
                  {
                        "id": "8e6bceb5-36cc-4dcc-9f99-36d2d7214169",
                        "name": "Development",
                        "color": "bg-amber-50 text-amber-700",
                        "icon": null,
                        "isDefault": false,
                        "order": 0,
                        "createdAt": "2026-01-10T22:56:49.783Z"
                  },
                  {
                        "id": "b20a2c37-4e02-4b24-bafb-ef4409642ce3",
                        "name": "Management",
                        "color": "bg-red-50 text-red-700",
                        "icon": null,
                        "isDefault": false,
                        "order": 0,
                        "createdAt": "2026-01-10T22:57:08.038Z"
                  },
                  {
                        "id": "85843765-89fe-4483-88d9-7b475b03c05d",
                        "name": "Design",
                        "color": "bg-purple-50 text-purple-700",
                        "icon": null,
                        "isDefault": false,
                        "order": 0,
                        "createdAt": "2026-01-10T22:57:24.062Z"
                  }
            ];
            for (const taskType of taskTypes) {
                  // Remove any unwanted fields like createdAt if necessary
                  delete (taskType as any).createdAt;
                  await storage.createTaskType(taskType);
            }
            console.log('Task types seeded');


            // Extra Defaults from Export
            const statusOptions = [
                  {
                        "id": "e2558f19-f7e0-48f4-a675-6ee670368008",
                        "label": "Upcoming",
                        "color": "bg-slate-100 text-slate-700",
                        "isDefault": true,
                        "type": "project",
                        "order": 0,
                        "kanbanCollapsed": false
                  },
                  {
                        "id": "0d61186a-2090-46ba-a9b3-1d60c5e8d758",
                        "label": "BACKLOGGED",
                        "color": "bg-slate-100 text-slate-700",
                        "isDefault": false,
                        "type": "task",
                        "order": 1,
                        "kanbanCollapsed": false
                  },
                  {
                        "id": "2c77dee1-0cff-4e96-9b8e-dbeb0eda1a43",
                        "label": "IN PROGRESS",
                        "color": "bg-amber-50 text-amber-700",
                        "isDefault": false,
                        "type": "task",
                        "order": 3,
                        "kanbanCollapsed": false
                  },
                  {
                        "id": "3caae050-d721-42d6-aea3-01e9477ebe97",
                        "label": "NEXT UP",
                        "color": "bg-blue-50 text-blue-700",
                        "isDefault": true,
                        "type": "task",
                        "order": 2,
                        "kanbanCollapsed": false
                  },
                  {
                        "id": "02c73e64-1cbf-479a-96ab-2a3af9169355",
                        "label": "BLOCKED",
                        "color": "bg-red-50 text-red-700",
                        "isDefault": false,
                        "type": "task",
                        "order": 4,
                        "kanbanCollapsed": true
                  },
                  {
                        "id": "35bcc0c4-e411-4909-ae91-c38ac80a6500",
                        "label": "IN REVIEW",
                        "color": "bg-purple-50 text-purple-700",
                        "isDefault": false,
                        "type": "task",
                        "order": 5,
                        "kanbanCollapsed": false
                  },
                  {
                        "id": "6c3f30de-3757-445d-854a-e9587cbeaa86",
                        "label": "ARCHIVED",
                        "color": "bg-slate-100 text-slate-700",
                        "isDefault": false,
                        "type": "task",
                        "order": 0,
                        "kanbanCollapsed": true
                  },
                  {
                        "id": "20ee1a2a-830c-4a40-8248-11e92acd4337",
                        "label": "ACCEPTED",
                        "color": "bg-green-50 text-green-700",
                        "isDefault": false,
                        "type": "task",
                        "order": 6,
                        "kanbanCollapsed": true
                  },
                  {
                        "id": "3310cf8f-443d-476f-8b2a-cbef99f95c24",
                        "label": "DONE",
                        "color": "bg-green-50 text-green-700",
                        "isDefault": false,
                        "type": "task",
                        "order": 7,
                        "kanbanCollapsed": true
                  },
                  {
                        "id": "04fced90-9d41-4305-a4b0-ed842b005c25",
                        "label": "DEFERRED",
                        "color": "bg-slate-100 text-slate-700",
                        "isDefault": false,
                        "type": "task",
                        "order": 8,
                        "kanbanCollapsed": true
                  },
                  {
                        "id": "039d532e-cd95-4b4e-ac3a-f55aa677b425",
                        "label": "ONGOING",
                        "color": "bg-slate-100 text-slate-700",
                        "isDefault": false,
                        "type": "task",
                        "order": 9,
                        "kanbanCollapsed": true
                  },
                  {
                        "id": "07ed839f-097f-4a29-bdef-612813463dd1",
                        "label": "Not Started",
                        "color": "bg-slate-100 text-slate-700",
                        "isDefault": true,
                        "type": "deliverable",
                        "order": 0,
                        "kanbanCollapsed": false
                  },
                  {
                        "id": "140663bf-6a53-48cb-b464-112dfe7e51d2",
                        "label": "In Progress",
                        "color": "bg-blue-50 text-blue-700",
                        "isDefault": false,
                        "type": "deliverable",
                        "order": 1,
                        "kanbanCollapsed": false
                  },
                  {
                        "id": "6d63bec7-9c44-4fbb-9b75-a686ad928127",
                        "label": "Blocked",
                        "color": "bg-red-50 text-red-700",
                        "isDefault": false,
                        "type": "deliverable",
                        "order": 2,
                        "kanbanCollapsed": false
                  },
                  {
                        "id": "38598d12-3c6f-4216-8bb3-fa0a1c332f8e",
                        "label": "Completed",
                        "color": "bg-green-50 text-green-700",
                        "isDefault": false,
                        "type": "deliverable",
                        "order": 3,
                        "kanbanCollapsed": false
                  },
                  {
                        "id": "70f75f9b-d17a-4a21-b888-6d92e7593386",
                        "label": "In Progress",
                        "color": "bg-amber-50 text-amber-700",
                        "isDefault": false,
                        "type": "project",
                        "order": 2,
                        "kanbanCollapsed": false
                  },
                  {
                        "id": "773ca1fe-4317-4adb-9f13-22ed741e91dd",
                        "label": "On Hold",
                        "color": "bg-orange-50 text-orange-700",
                        "isDefault": false,
                        "type": "project",
                        "order": 3,
                        "kanbanCollapsed": false
                  },
                  {
                        "id": "2b507458-b8ca-48b3-84ab-80014d1221f5",
                        "label": "Completed",
                        "color": "bg-green-50 text-green-700",
                        "isDefault": false,
                        "type": "project",
                        "order": 4,
                        "kanbanCollapsed": false
                  },
                  {
                        "id": "f9981f08-69aa-43a0-987d-99fb6bb0dbec",
                        "label": "Not Started",
                        "color": "bg-slate-100 text-slate-700",
                        "isDefault": true,
                        "type": "epic",
                        "order": 0,
                        "kanbanCollapsed": false
                  },
                  {
                        "id": "a41971d6-e370-4192-87d2-9dad69444ec7",
                        "label": "In Progress",
                        "color": "bg-blue-50 text-blue-700",
                        "isDefault": false,
                        "type": "epic",
                        "order": 1,
                        "kanbanCollapsed": false
                  },
                  {
                        "id": "6f97e748-cf85-4f1b-8176-06a08f501de8",
                        "label": "Blocked",
                        "color": "bg-red-50 text-red-700",
                        "isDefault": false,
                        "type": "epic",
                        "order": 2,
                        "kanbanCollapsed": false
                  },
                  {
                        "id": "47f4ad25-4d8e-41c7-bb23-f35e0f6bf30c",
                        "label": "Completed",
                        "color": "bg-green-50 text-green-700",
                        "isDefault": false,
                        "type": "epic",
                        "order": 3,
                        "kanbanCollapsed": false
                  },
                  {
                        "id": "c9f2cf26-f3ea-4993-b7db-2567d8579b48",
                        "label": "Active",
                        "color": "bg-blue-50 text-blue-700",
                        "isDefault": false,
                        "type": "project",
                        "order": 1,
                        "kanbanCollapsed": false
                  },
                  {
                        "id": "422b08fc-cb2d-4ca7-9486-0fb9cb5c3d54",
                        "label": "Archived",
                        "color": "bg-gray-50 text-gray-700",
                        "isDefault": false,
                        "type": "project",
                        "order": 5,
                        "kanbanCollapsed": false
                  }
            ];
            for (const option of statusOptions) {
                  await storage.createStatusOption(option);
            }

            const epicTypes = [
                  {
                        "id": "4e06a685-89d5-4118-b5ed-0af576650105",
                        "name": "Use Case",
                        "color": "bg-indigo-50 text-indigo-700",
                        "icon": null,
                        "isDefault": false,
                        "order": 0,
                        "createdAt": "2026-01-10T22:58:10.539Z"
                  },
                  {
                        "id": "4e41d691-2c25-4720-b667-1352b2cbc187",
                        "name": "Workflow",
                        "color": "bg-indigo-50 text-indigo-700",
                        "icon": null,
                        "isDefault": false,
                        "order": 0,
                        "createdAt": "2026-01-11T04:45:29.966Z"
                  },
                  {
                        "id": "bad1efc8-4a08-4434-a906-ffe3f72f3dd4",
                        "name": "Skill",
                        "color": "bg-indigo-50 text-indigo-700",
                        "icon": null,
                        "isDefault": false,
                        "order": 0,
                        "createdAt": "2026-01-11T04:49:43.701Z"
                  },
                  {
                        "id": "6456542e-ea9d-4b81-8345-5206630cbbbb",
                        "name": "System",
                        "color": "bg-indigo-50 text-indigo-700",
                        "icon": null,
                        "isDefault": false,
                        "order": 0,
                        "createdAt": "2026-01-11T04:49:49.579Z"
                  },
                  {
                        "id": "a04ec45b-0520-4970-9957-3ae58666982a",
                        "name": "Foundation",
                        "color": "bg-indigo-50 text-indigo-700",
                        "icon": null,
                        "isDefault": false,
                        "order": 0,
                        "createdAt": "2026-01-11T04:49:55.582Z"
                  }
            ];
            for (const et of epicTypes) {
                  delete (et as any).createdAt;
                  await storage.createEpicType(et);
            }

            const deliverableTypes = [
                  {
                        "id": "656acaf1-3644-4be8-94c1-bdfcfc4980f7",
                        "name": "Experience",
                        "color": "bg-teal-50 text-teal-700",
                        "icon": null,
                        "isDefault": false,
                        "order": 0,
                        "createdAt": "2026-01-11T04:50:03.456Z"
                  },
                  {
                        "id": "ccf6dbb6-ef7c-4ff6-9a2f-a20a15e6e809",
                        "name": "Workflow",
                        "color": "bg-teal-50 text-teal-700",
                        "icon": null,
                        "isDefault": false,
                        "order": 0,
                        "createdAt": "2026-01-11T04:56:34.728Z"
                  },
                  {
                        "id": "be97a372-a292-4b47-a524-4b02d613e051",
                        "name": "System",
                        "color": "bg-teal-50 text-teal-700",
                        "icon": null,
                        "isDefault": false,
                        "order": 0,
                        "createdAt": "2026-01-11T04:56:40.324Z"
                  },
                  {
                        "id": "20ece184-0a4d-4210-93ae-7fdbbca92785",
                        "name": "Foundations",
                        "color": "bg-teal-50 text-teal-700",
                        "icon": null,
                        "isDefault": false,
                        "order": 0,
                        "createdAt": "2026-01-11T07:27:00.970Z"
                  }
            ];
            for (const dt of deliverableTypes) {
                  delete (dt as any).createdAt;
                  await storage.createDeliverableType(dt);
            }

            const roleTypes = [
                  {
                        "id": "051f8377-8145-47ff-8ad8-2aa05c0d8d73",
                        "label": "Solution Consultant",
                        "description": "",
                        "isDefault": false
                  }
            ];
            for (const rt of roleTypes) {
                  await storage.createRoleType(rt);
            }

            // Seed Framework Templates
            const framework = await storage.createFrameworkTemplate({
                  name: "Implementation Framework",
                  description: "Standard implementation delivery framework",
                  defaultStages: ["st_plan", "st_validate", "st_develop", "st_enable"]
            });
            const ftId = framework.id;

            // Seed Users
            const users = [
                  // Internal Service Org Staff
                  { id: "0", name: "Blair", role: "Super Admin", status: "Online", email: "blair@oso.group", userType: "internal", systemRole: "admin" },
                  { id: "1", name: "Alex the Admin", role: "Project Director", status: "Online", email: "alex.admin@serviceorg.com", userType: "internal", systemRole: "admin" },
                  { id: "2", name: "Bella PM", role: "Project Manager", status: "In Meeting", email: "bella.pm@serviceorg.com", userType: "internal", systemRole: "manager" },
                  { id: "3", name: "Chris Designer", role: "UX Designer", status: "Online", email: "chris.design@serviceorg.com", userType: "internal", systemRole: "member" },
                  { id: "4", name: "Dan Developer", role: "Senior Developer", status: "Offline", email: "dan.dev@serviceorg.com", userType: "internal", systemRole: "member" },
                  { id: "5", name: "Eve Engineer", role: "QA Engineer", status: "Online", email: "eve.qa@serviceorg.com", userType: "internal", systemRole: "member" },

                  // Client 1 (Houlihan)
                  { id: "c1_u1", name: "Hank Hill", role: "VP Finance", status: "Online", email: "hank@acme.demo", userType: "client", systemRole: "member" },

                  // Client 2 (Colgate)
                  { id: "c2_u1", name: "Colin Crest", role: "Brand Manager", status: "Offline", email: "colin@globex.demo", userType: "client", systemRole: "member" },

                  // Client 3 (Kraft)
                  { id: "c3_u1", name: "Kelly Ketchup", role: "Operations Lead", status: "In Meeting", email: "kelly@initech.demo", userType: "client", systemRole: "member" },
            ];

            // Only attempt to create if they don't exist. Often we seed on empty.
            for (const user of users) {
                  await storage.createUser(user);
            }
            console.log('Users seeded');

            // Seed Clients
            const clients = [
                  { id: "c1", name: "Acme Corp", description: "Global conglomerate." },
                  { id: "c2", name: "Globex Corporation", description: "Advanced technology research." },
                  { id: "c3", name: "Initech", description: "Software logic solutions." },
            ];
            for (const client of clients) {
                  await storage.createClient(client);
            }
            console.log('Clients seeded');

            // Seed Client Users mapping
            const clientUsersData = [
                  { id: "cu_1", clientId: "c1", userId: "c1_u1", role: "manager" },
                  { id: "cu_2", clientId: "c2", userId: "c2_u1", role: "manager" },
                  { id: "cu_3", clientId: "c3", userId: "c3_u1", role: "manager" },
            ];

            for (const cu of clientUsersData) {
                  await storage.createClientUser(cu);
            }
            console.log('Client Users seeded');

            // Seed Projects
            const projects = [
                  { id: "p1", name: "Acme Corp M&A Platform Overhaul", clientId: "c1", ownerId: "1", status: "Execution", startDate: "2025-01-01", deadline: "2025-06-30", progress: 62, frameworkId: ftId },
                  { id: "p2", name: "Q1 Financial Audit App", clientId: "c1", ownerId: "2", status: "Planning", startDate: "2025-02-01", deadline: "2025-04-15", progress: 12, frameworkId: ftId },
                  { id: "p3", name: "Global Supply Chain Tooling", clientId: "c2", ownerId: "1", status: "On Hold", startDate: "2024-11-15", deadline: "2025-08-30", progress: 38, frameworkId: ftId },
                  { id: "p4", name: "Logistics Optimization Engine", clientId: "c2", ownerId: "2", status: "Execution", startDate: "2025-01-10", deadline: "2025-05-20", progress: 54, frameworkId: ftId },
                  { id: "p5", name: "Recipe Management Portal", clientId: "c3", ownerId: "1", status: "Enablement", startDate: "2025-01-15", deadline: "2025-05-30", progress: 88, frameworkId: ftId },
                  { id: "p6", name: "Distribution Analytics Dashboard", clientId: "c3", ownerId: "2", status: "Upcoming", startDate: "2025-04-01", deadline: "2025-08-15", progress: 0, frameworkId: ftId },
                  { id: "p7", name: "Service Org Internal Tools V2", ownerId: "1", status: "Completed", startDate: "2024-06-01", deadline: "2024-12-31", progress: 100, frameworkId: ftId },
            ];
            for (const project of projects) {
                  await storage.createProject(project);
            }
            console.log('Projects seeded');

            // Seed Project Team Members and High-Level Roles
            // Mapping: { projectId: [ { userId, roleType } ] }
            const projectAssignments = [
                  // p1 (Acme Corp - Alex Owner)
                  { projectId: "p1", userId: "1", roleType: "owner" },
                  { projectId: "p1", userId: "2", roleType: "manager" },
                  { projectId: "p1", userId: "3", roleType: "member" },
                  { projectId: "p1", userId: "4", roleType: "member" },
                  { projectId: "p1", userId: "c1_u1", roleType: "stakeholder" },

                  // p2 (Acme Corp - Bella Owner)
                  { projectId: "p2", userId: "2", roleType: "owner" },
                  { projectId: "p2", userId: "1", roleType: "manager" },
                  { projectId: "p2", userId: "3", roleType: "member" },
                  { projectId: "p2", userId: "c1_u1", roleType: "stakeholder" },

                  // p3 (Globex - Alex Owner)
                  { projectId: "p3", userId: "1", roleType: "owner" },
                  { projectId: "p3", userId: "4", roleType: "member" },
                  { projectId: "p3", userId: "5", roleType: "member" },
                  { projectId: "p3", userId: "c2_u1", roleType: "stakeholder" },

                  // p4 (Globex - Bella Owner)
                  { projectId: "p4", userId: "2", roleType: "owner" },
                  { projectId: "p4", userId: "5", roleType: "member" },
                  { projectId: "p4", userId: "c2_u1", roleType: "stakeholder" },

                  // p5 (Initech - Alex Owner)
                  { projectId: "p5", userId: "1", roleType: "owner" },
                  { projectId: "p5", userId: "4", roleType: "member" },
                  { projectId: "p5", userId: "c3_u1", roleType: "stakeholder" },

                  // p6 (Initech - Bella Owner)
                  { projectId: "p6", userId: "2", roleType: "owner" },
                  { projectId: "p6", userId: "4", roleType: "member" },
                  { projectId: "p6", userId: "c3_u1", roleType: "stakeholder" },

                  // p7 (Internal - Blair Owner)
                  { projectId: "p7", userId: "0", roleType: "owner" },
                  { projectId: "p7", userId: "1", roleType: "manager" },
                  { projectId: "p7", userId: "2", roleType: "manager" },
                  { projectId: "p7", userId: "3", roleType: "member" },
                  { projectId: "p7", userId: "4", roleType: "member" },
                  { projectId: "p7", userId: "5", roleType: "member" },
            ];

            for (const pa of projectAssignments) {
                  const teamMember = await (storage as any).createProjectTeamMember({
                        id: `tm_${pa.projectId}_${pa.userId}`,
                        projectId: pa.projectId,
                        userId: pa.userId,
                        allocationPercent: 100,
                  });
                  await (storage as any).createHighLevelRole({
                        id: `hlr_${pa.projectId}_${pa.userId}`,
                        teamMemberId: teamMember.id,
                        roleType: pa.roleType,
                  });
            }
            console.log('Project Team Members and Roles seeded');

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

            // Expanded Deliverables across all projects
            const deliverables = [
                  { id: "d1", projectId: "p1", title: "Brand Strategy", description: "Complete overhaul of brand positioning and messaging framework.", status: "Completed", ownerId: "1", dueDate: "2025-02-15", progress: 100 },
                  { id: "d2", projectId: "p1", title: "Digital Presence", description: "New website design and development including CMS implementation.", status: "In Progress", ownerId: "2", dueDate: "2025-04-28", progress: 45 },
                  { id: "d3", projectId: "p2", title: "Internal Controls Framework", description: "Defining audit parameters and risk gates.", status: "In Progress", ownerId: "2", dueDate: "2025-03-15", progress: 30 },
                  { id: "d4", projectId: "p3", title: "Supply Chain Analytics", description: "Data visualization and insights.", status: "Not Started", ownerId: "3", dueDate: "2025-06-15", progress: 0 },
                  { id: "d5", projectId: "p4", title: "Optimization Algorithm", description: "Core logistics engine.", status: "In Progress", ownerId: "2", dueDate: "2025-05-10", progress: 60 },
                  { id: "d6", projectId: "p5", title: "Recipe DB Migration", description: "Move existing recipes.", status: "In Progress", ownerId: "4", dueDate: "2025-03-01", progress: 80 },
                  { id: "d7", projectId: "p6", title: "Distribution Map UI", description: "Interactive map components.", status: "Not Started", ownerId: "2", dueDate: "2025-07-20", progress: 0 },
                  { id: "d8", projectId: "p7", title: "Admin Dashboard Rewrite", description: "Internal tooling updates.", status: "Completed", ownerId: "5", dueDate: "2024-11-01", progress: 100 },
            ];
            for (const d of deliverables) {
                  await storage.createDeliverable(d);
            }

            // Expanded Epics
            const epics = [
                  { id: "e1", deliverableId: "d2", title: "Website Redesign", description: "UX/UI design phases", status: "In Progress", ownerId: "3", startDate: "2025-01-01", endDate: "2025-02-15", progress: 60 },
                  { id: "e2", deliverableId: "d2", title: "CMS Implementation", description: "Backend development", status: "Not Started", ownerId: "4", startDate: "2025-02-01", endDate: "2025-04-28", progress: 0 },
                  { id: "e3", deliverableId: "d1", title: "Market Research", description: "Competitor analysis", status: "Completed", ownerId: "1", startDate: "2025-01-01", endDate: "2025-01-15", progress: 100 },
                  { id: "e4", deliverableId: "d4", title: "Data Pipeline", description: "Ingesting global data.", status: "In Progress", ownerId: "4", startDate: "2024-12-01", endDate: "2025-03-15", progress: 20 },
                  { id: "e5", deliverableId: "d5", title: "Route Optimization", description: "Pathfinding algorithms", status: "In Progress", ownerId: "2", startDate: "2025-01-15", endDate: "2025-04-10", progress: 70 },
                  { id: "e6", deliverableId: "d6", title: "Schema Mapping", description: "Old to new DB", status: "In Progress", ownerId: "4", startDate: "2025-01-15", endDate: "2025-02-15", progress: 90 },
            ];
            for (const e of epics) {
                  await storage.createEpic(e);
            }

            // Seed Sprints for all projects
            const sprintTypes = ["Sprint 1 (Past)", "Sprint 2 (Current)", "Sprint 3 (Future)"];
            const sprintData: any[] = [];
            for (const project of projects) {
                  for (let i = 0; i < 3; i++) {
                        const sprint = {
                              id: `s_${project.id}_${i + 1}`,
                              projectId: project.id,
                              name: `${project.name} - ${sprintTypes[i]}`,
                              goal: `Achieve objectives for ${sprintTypes[i]}`,
                              status: i === 0 ? "completed" : i === 1 ? "active" : "planned",
                              startDate: new Date(Date.now() + (i - 1) * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                              endDate: new Date(Date.now() + i * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        };
                        await storage.createSprint(sprint);
                        sprintData.push(sprint);
                  }
            }

            // Expanded Milestones for all projects
            const milestones: any[] = [];
            for (const project of projects) {
                  const m1 = {
                        id: `m_${project.id}_1`,
                        projectId: project.id,
                        name: "Project Initiation",
                        description: "Initial setup and kick-off for " + project.name,
                        phase: "plan_strategy",
                        stageId: "st_plan",
                        targetDate: "2025-01-15",
                        status: "achieved",
                        ownerId: project.ownerId || "1",
                        isBillingGate: true,
                        scopeType: "manual",
                        completionMode: "all_tasks"
                  };
                  const m2 = {
                        id: `m_${project.id}_2`,
                        projectId: project.id,
                        name: "Midpoint Review",
                        description: "Halfway assessment of " + project.name,
                        phase: "validate_blueprints",
                        stageId: "st_validate",
                        targetDate: "2025-03-20",
                        status: "in_progress",
                        ownerId: project.ownerId || "2",
                        isBillingGate: false,
                        scopeType: "manual",
                        completionMode: "percentage",
                        completionTargetPercent: 50
                  };
                  const m3 = {
                        id: `m_${project.id}_3`,
                        projectId: project.id,
                        name: "Final Presentation",
                        description: "Closing delivery for " + project.name,
                        phase: "enable_users",
                        stageId: "st_enable",
                        targetDate: project.deadline,
                        status: "planned",
                        ownerId: project.ownerId || "1",
                        isBillingGate: true,
                        scopeType: "manual",
                        completionMode: "all_tasks"
                  };

                  await storage.createMilestone(m1);
                  await storage.createMilestone(m2);
                  await storage.createMilestone(m3);
                  milestones.push(m1, m2, m3);
            }

            // Dynamic Task Generation with Deep Associations
            const taskStatusChoices = ["BACKLOG", "TODO", "IN PROGRESS", "IN REVIEW", "DONE"];
            const priorities = ["Low", "Medium", "High", "Critical"];
            const internalAssignees = ["0", "1", "2", "3", "4", "5"];
            const clientAssignees: Record<string, string[]> = {
                  "p1": ["c1_u1"], "p2": ["c1_u1"], "p3": ["c2_u1"], "p4": ["c2_u1"], "p5": ["c3_u1"], "p6": ["c3_u1"], "p7": []
            };

            let taskCounter = 1;
            for (const project of projects) {
                  // Get eligible entities for this project
                  const projDeliverables = deliverables.filter(d => d.projectId === project.id);
                  const projEpics = epics.filter(e => projDeliverables.some(d => d.id === e.deliverableId));
                  const projMilestones = milestones.filter(m => m.projectId === project.id);
                  const projSprints = sprintData.filter(s => s.projectId === project.id);

                  const numTasks = Math.floor(Math.random() * 21) + 30; // 30-50 tasks
                  for (let i = 0; i < numTasks; i++) {
                        const statusIndex = Math.floor(Math.random() * taskStatusChoices.length);
                        const priorityIndex = Math.floor(Math.random() * priorities.length);

                        let assigneeId = internalAssignees[Math.floor(Math.random() * internalAssignees.length)];
                        const availableClientUsers = clientAssignees[project.id] || [];
                        if (availableClientUsers.length > 0 && Math.random() < 0.2) {
                              assigneeId = availableClientUsers[Math.floor(Math.random() * availableClientUsers.length)];
                        }

                        const isDone = taskStatusChoices[statusIndex] === "DONE";
                        const stage = stages[Math.floor(Math.random() * stages.length)];

                        // Pick associations
                        const del = projDeliverables[Math.floor(Math.random() * projDeliverables.length)];
                        const epic = projEpics[Math.floor(Math.random() * projEpics.length)];
                        const milestone = projMilestones[Math.floor(Math.random() * projMilestones.length)];
                        const sprint = projSprints[Math.floor(Math.random() * projSprints.length)];

                        await (storage as any).createTask({
                              id: `t_dyn_${taskCounter++}`,
                              title: `${project.name} - ${["Core Implementation", "Refinement", "Optimization", "Audit", "Review", "Doc Update", "UI Polish", "API Integration", "Security Patch", "Feature A", "Feature B", "Performance Tuning"][Math.floor(Math.random() * 12)]} Phase ${i + 1}`,
                              description: `Automatically generated task for ${project.name} to simulate a fully flushed out project environment. Focus on quality and timeline achievement.`,
                              project: project.name,
                              projectId: project.id,
                              stageId: stage.id,
                              deliverableId: del?.id,
                              epicId: epic?.id,
                              milestoneId: milestone?.id,
                              sprintId: sprint?.id,
                              status: taskStatusChoices[statusIndex],
                              priority: priorities[priorityIndex],
                              assigneeId: assigneeId,
                              estimateHours: Math.floor(Math.random() * 20) + 2,
                              effort: isDone ? (Math.floor(Math.random() * 20) + 2) : 0,
                              deadline: new Date(Date.now() + (Math.random() * 60 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
                              tags: [["Backend", "Frontend", "Design", "DevOps", "Management", "QA"][Math.floor(Math.random() * 6)]].concat(Math.random() > 0.7 ? ["Critical"] : [])
                        });
                  }
            }
            console.log(`Generated ~${taskCounter - 1} dynamic tasks across all projects with full associations`);
            console.log(`Generated ~${taskCounter - 1} dynamic tasks across all projects`);

            // Seed Activity
            const activities = [
                  { id: "1", user: "Dan Developer", action: "Commented", target: "Global Supply Chain: Optimization", time: "2 hours ago", details: "Looks good to me." },
                  { id: "2", user: "Chris Designer", action: "Marked Complete", target: "M&A Platform: Bug Fixing", time: "3 hours ago", details: "Assets delivered." },
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

            // Seed Role Assignments removed

            // Seed Saved Views
            const views: any[] = [
                  {
                        id: "v1",
                        name: "Default Kanban",
                        description: "Standard board view for daily standups",
                        stageIds: ["s1", "s2", "s3", "s4"],
                        viewType: "Kanban",
                        visibility: "Global",
                        isDefault: true,
                        config: { groupBy: "stage" }
                  },
                  {
                        id: "v2",
                        name: "My Tasks List",
                        description: "List of tasks assigned to me",
                        stageIds: [],
                        viewType: "List",
                        visibility: "Personal",
                        isDefault: false,
                        config: { filterBy: "assignee:me" }
                  },
            ];
            for (const view of views) {
                  if (typeof view.config === 'string') {
                        try { view.config = JSON.parse(view.config); } catch (e) { }
                  }
                  if (typeof view.stageIds === 'string') {
                        try { view.stageIds = JSON.parse(view.stageIds); } catch (e) { }
                  }
                  await storage.createSavedView(view);
            }

            // Enable Demo Mode
            await storage.updateAppSettings({
                  demoDataReady: true,
                  demoLoginUserId: "0", // Blair
            });

            console.log('Database seeded successfully!');
            return { success: true };
      } catch (error: any) {
            console.error('Error seeding database:', error);
            throw error;
      }
}
