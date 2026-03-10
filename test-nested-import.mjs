import fs from 'fs';

const payload = {
    "projects": [
        {
            "id": "temp-4fda020c-4468-4352-86a4-5a6727e097a2",
            "name": "Enterprise Architecture Assessment & Modernization",
            "description": "Assess current state architecture and develop a 36-month modernization roadmap and future-state options.",
            "clientId": "Internal",
            "status": "Not Started",
            "startDate": "2026-03-16",
            "deadline": "2026-06-30",
            "sprintDurationWeeks": 1,
            "ownerId": "0",
            "progress": 0,
            "deliverables": [
                {
                    "id": "d-mgmt-1773124065229",
                    "projectId": "temp-4fda020c-4468-4352-86a4-5a6727e097a2",
                    "title": "Management Activities",
                    "description": "Project management and coordination activities",
                    "status": "Not Started",
                    "type": null,
                    "templateId": null,
                    "epics": [
                        {
                            "id": "e-mgmt-1773124065229-1",
                            "projectId": "temp-4fda020c-4468-4352-86a4-5a6727e097a2",
                            "deliverableId": "d-mgmt-1773124065229",
                            "title": "General",
                            "description": "Auto-created epic for task alignment",
                            "status": "Not Started",
                            "progress": 0,
                            "tasks": []
                        }
                    ]
                }
            ],
            "milestones": [],
            "roles": [
                {
                    "id": "r-1773124065228-0.08271018260170067",
                    "projectId": "temp-4fda020c-4468-4352-86a4-5a6727e097a2",
                    "templateId": "tmpl-role-sponsor",
                    "name": "Project Sponsor",
                    "description": "Executive champion",
                    "roleType": "sponsor",
                    "isCore": true,
                    "assigneeId": null
                }
            ]
        }
    ]
};

// Simulate what client/src/features/import-export/hooks/use-import.ts does
const flattenNestedImport = (nested) => {
    const flat = {
        Projects: [], ProjectRoles: [], Deliverables: [], Epics: [], Tasks: [], Milestones: [], ProjectStages: [], Sprints: [],
    };

    if (nested.projects && Array.isArray(nested.projects)) {
        flat.FullProjectsForCreate = [];

        nested.projects.forEach((project) => {
            const { deliverables, milestones, stages, sprints, roles, ...rawProjectData } = project;
            const projectData = { ...rawProjectData };

            if (projectData.ownerId === '0') delete projectData.ownerId;
            if (projectData.clientId === 'Internal') delete projectData.clientId;
            if (projectData.client) delete projectData.client;

            flat.FullProjectsForCreate.push({
                project: {
                    name: projectData.name,
                    description: projectData.description || '',
                    status: projectData.status || 'Upcoming',
                    startDate: projectData.startDate,
                    deadline: projectData.deadline,
                    frameworkId: projectData.frameworkId || null,
                    sprintDurationWeeks: projectData.sprintDurationWeeks || null,
                    ownerId: projectData.ownerId || null,
                    clientId: projectData.clientId || null,
                    riskLevel: projectData.riskLevel || null
                },
                stages: Array.isArray(stages) ? stages : [],
                deliverables: Array.isArray(deliverables) ? deliverables : [],
                milestones: Array.isArray(milestones) ? milestones : [],
                roles: Array.isArray(roles) ? roles.map(r => ({ ...r, roleTypeId: r.roleTypeId || r.templateId })) : [],
                sprints: Array.isArray(sprints) ? sprints : []
            });

            flat.Projects.push(projectData);
        });
    }
    return flat;
};

const flatData = flattenNestedImport(payload);

async function testFullCreate() {
    const projectBody = flatData.FullProjectsForCreate[0];

    try {
        const res = await fetch('http://localhost:8080/api/projects/full-create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectBody)
        });

        console.log('Project full-create response status:', res.status);
        const body = await res.text();
        console.log('Response body:', body);
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

testFullCreate();
