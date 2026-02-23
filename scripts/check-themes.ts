import { db, pool } from "../server/db";
import { themes } from "@shared/schema";

async function check() {
    const allThemes = await db.select().from(themes);
    console.log("Found themes:", allThemes.map(t => t.name));
    pool.end();
}

check();
