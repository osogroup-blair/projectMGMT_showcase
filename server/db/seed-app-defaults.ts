import { storage } from "../data/storage";
import { seedThemes } from "../../scripts/seed-themes";
import { readFileSync } from "fs";
import { join } from "path";

export async function seedAppDefaults() {
    try {
        console.log("Loading defaults from defaults.json...");
        const defaultsPath = join(process.cwd(), "server", "db", "defaults.json");
        const defaultsRaw = readFileSync(defaultsPath, "utf-8");
        const defaultsData = JSON.parse(defaultsRaw);

        console.log("Seeding Status Options...");
        if (defaultsData.StatusOptions && defaultsData.StatusOptions.length > 0) {
            for (const item of defaultsData.StatusOptions) {
                await storage.createStatusOption(item);
            }
        }

        console.log("Seeding Role Types...");
        if (defaultsData.RoleTypes && defaultsData.RoleTypes.length > 0) {
            for (const item of defaultsData.RoleTypes) {
                await storage.createRoleType(item);
            }
        }

        console.log("Seeding Mapping Templates...");
        if (defaultsData.MappingTemplates && defaultsData.MappingTemplates.length > 0) {
            for (const item of defaultsData.MappingTemplates) {
                await storage.createMappingTemplate(item);
            }
        }

        console.log("Seeding Guidance Items...");
        if (defaultsData.GuidanceItems && defaultsData.GuidanceItems.length > 0) {
            for (const item of defaultsData.GuidanceItems) {
                await storage.createGuidanceItem({
                    id: item.id,
                    title: item.title,
                    body: item.content || item.body || "",
                    priority: item.priority || "Medium"
                } as any);
            }
        }

        console.log("Seeding Saved Views...");
        if (defaultsData.SavedViews && defaultsData.SavedViews.length > 0) {
            for (const item of defaultsData.SavedViews) {
                const stageIds = typeof item.stageIds === 'string' ? JSON.parse(item.stageIds) : item.stageIds;
                const config = typeof item.config === 'string' ? JSON.parse(item.config) : item.config;

                await storage.createSavedView({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    stageIds: stageIds,
                    viewType: item.viewType,
                    visibility: item.visibility,
                    isDefault: item.isDefault,
                    config: config
                } as any);
            }
        }

        console.log("Seeding Task Types...");
        if (defaultsData.TaskTypes && defaultsData.TaskTypes.length > 0) {
            for (const item of defaultsData.TaskTypes) {
                await storage.createTaskType({
                    id: item.id,
                    name: item.name,
                    color: item.color,
                    icon: item.icon,
                    isDefault: item.isDefault,
                    order: item.order
                } as any);
            }
        }

        console.log("Seeding Epic Types...");
        if (defaultsData.EpicTypes && defaultsData.EpicTypes.length > 0) {
            for (const item of defaultsData.EpicTypes) {
                await storage.createEpicType({
                    id: item.id,
                    name: item.name,
                    color: item.color,
                    icon: item.icon,
                    isDefault: item.isDefault,
                    order: item.order
                } as any);
            }
        }

        console.log("Seeding Deliverable Types...");
        if (defaultsData.DeliverableTypes && defaultsData.DeliverableTypes.length > 0) {
            for (const item of defaultsData.DeliverableTypes) {
                await storage.createDeliverableType({
                    id: item.id,
                    name: item.name,
                    color: item.color,
                    icon: item.icon,
                    isDefault: item.isDefault,
                    order: item.order
                } as any);
            }
        }

        console.log("Seeding Themes...");
        await seedThemes();

        console.log("Application Defaults & Themes applied successfully.");

    } catch (error) {
        console.error("Error seeding defaults:", error);
        throw error;
    }
}

if (process.argv[1] && process.argv[1].includes("seed-app-defaults")) {
    seedAppDefaults().catch((err) => {
        console.error("Fatal error seeding defaults:", err);
        process.exit(1);
    });
}
