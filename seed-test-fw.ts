import { db } from "./server/db";
import { frameworkTemplates, stageTemplates, taskTemplates } from "./shared/schema";

async function main() {
    console.log("Creating test framework...");

    // Create Task Templates
    const tt1 = await db.insert(taskTemplates).values({
        id: "tt_test_1",
        title: "Setup Drizzle ORM",
        description: "Configure Drizzle and PostgreSQL",
        defaultPriority: "High",
        defaultEstimateHours: 2,
        scope: "per_epic"
    }).returning();

    const tt2 = await db.insert(taskTemplates).values({
        id: "tt_test_2",
        title: "Build React Components",
        description: "Build UI components",
        defaultPriority: "Medium",
        defaultEstimateHours: 4,
        scope: "per_epic"
    }).returning();

    // Create Stage Template
    const st1 = await db.insert(stageTemplates).values({
        id: "st_test_1",
        name: "Backend Setup",
        description: "Setup backend",
        defaultTasks: [tt1[0].id, tt2[0].id]
    }).returning();

    // Create Framework Template
    const fw1 = await db.insert(frameworkTemplates).values({
        id: "fw_test_1",
        name: "Test Web App Framework (Drizzle, React)",
        description: "Valid framework for testing template builder",
        defaultStages: [st1[0].id]
    }).returning();

    console.log("Created successfully!");
    process.exit(0);
}

main().catch(console.error);
