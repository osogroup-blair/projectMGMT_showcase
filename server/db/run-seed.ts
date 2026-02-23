import { generateDemoData } from "../services/demo-data-generator";
import { connectWithRetry } from "../db";

async function main() {
    try {
        console.log("Connecting to database for seeding...");
        await connectWithRetry(5, 2000);

        console.log("Seeding demo data...");
        const result = await generateDemoData(true); // true = clear first

        if (result.success) {
            console.log("🎉 Seeding successful!");
            console.log(`Created: ${result.created.projects || 0} projects, ${result.created.users || 0} users, ${result.created.tasks || 0} tasks`);
            process.exit(0);
        } else {
            console.error("❌ Seeding failed with errors:");
            console.error(result.errors?.join("\n"));
            process.exit(1);
        }
    } catch (error: any) {
        console.error("❌ Fatal error during seeding:", error.message);
        process.exit(1);
    }
}

main();
