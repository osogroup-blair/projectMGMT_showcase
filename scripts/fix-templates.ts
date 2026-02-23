
import { db, pool } from "../server/db";
import { generateDemoData } from "../server/services/demo-data-generator";

async function fix() {
    console.log("Starting template repair...");
    try {
        // Pass false to avoid clearing existing data, but trigger the loadFrameworks logic
        const result = await generateDemoData(false);
        console.log("Result:", result);
    } catch (error) {
        console.error("Error repairing templates:", error);
    } finally {
        await pool.end();
    }
}

fix();
