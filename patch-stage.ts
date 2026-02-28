import 'dotenv/config';
import { db } from './server/db';
import { stageTemplates } from './shared/schema';
import { eq } from 'drizzle-orm';

async function main() {
    console.log("Updating stage template...");
    await db.update(stageTemplates)
        .set({ defaultTasks: ["tt1772232027219imao5o", "tt1772232697049osjrp", "tt1772232697053ty5df"] })
        .where(eq(stageTemplates.id, "b9f78dcc-8aa7-4e5a-a24a-a7654607ccf6"));
    console.log("Updated Testing stage with tasks!");
    process.exit(0);
}
main().catch(console.error);
