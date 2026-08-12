import { storage } from "../server/data/storage";

async function check() {
    const allThemes = await storage.getThemes();
    console.log("Found themes:", allThemes.map(t => t.name));
}

check();
