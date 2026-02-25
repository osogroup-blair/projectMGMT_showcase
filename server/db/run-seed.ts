import { seedDatabase } from "./seed";
import { connectWithRetry } from "../db";

async function main() {
    try {
        console.log("Connecting to database for seeding...");
        await connectWithRetry(5, 2000);

        console.log("Seeding demo data...");
        const result = await seedDatabase();

        if (result.success) {
            console.log("🎉 Seeding successful!");
            process.exit(0);
        } else {
            console.error("❌ Seeding failed with errors.");
            process.exit(1);
        }
    } catch (error: any) {
        console.error("❌ Fatal error during seeding:", error.message);
        process.exit(1);
    }
}

main();
