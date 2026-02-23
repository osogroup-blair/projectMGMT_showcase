
import { db, pool } from "../server/db";
import { taskTemplates, stageTemplates, frameworkTemplates } from "@shared/schema";
import { eq } from "drizzle-orm";

async function check() {
    console.log("Checking Framework Templates...");
    const frameworks = await db.select().from(frameworkTemplates);
    console.log(`Found ${frameworks.length} frameworks.`);

    console.log("\nChecking Stage Templates...");
    const stages = await db.select().from(stageTemplates);
    console.log(`Found ${stages.length} stages.`);

    for (const stage of stages) {
        console.log(`- Stage: ${stage.name} (Framework: ${stage.frameworkId})`);
        console.log(`  Default Tasks: ${stage.defaultTasks?.length || 0}`);
    }

    console.log("\nChecking Task Templates...");
    const tasks = await db.select().from(taskTemplates);
    console.log(`Found ${tasks.length} task templates.`);

    pool.end();
}

check();
