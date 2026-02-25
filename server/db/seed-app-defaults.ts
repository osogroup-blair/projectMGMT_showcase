import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../../shared/schema";
import { readFileSync } from "fs";
import { join } from "path";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
}

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seedAppDefaults() {
    try {
        console.log("Loading defaults from defaults.json...");
        const defaultsPath = join(process.cwd(), "server", "db", "defaults.json");
        const defaultsRaw = readFileSync(defaultsPath, "utf-8");
        const defaultsData = JSON.parse(defaultsRaw);

        console.log("Seeding Status Options...");
        if (defaultsData.StatusOptions && defaultsData.StatusOptions.length > 0) {
            for (const item of defaultsData.StatusOptions) {
                await db.insert(schema.statusOptions).values({
                    id: item.id,
                    label: item.label,
                    color: item.color,
                    isDefault: item.isDefault,
                    type: item.type,
                    order: item.order,
                    kanbanCollapsed: item.kanbanCollapsed
                }).onConflictDoUpdate({
                    target: schema.statusOptions.id,
                    set: {
                        label: item.label,
                        color: item.color,
                        isDefault: item.isDefault,
                        type: item.type,
                        order: item.order,
                        kanbanCollapsed: item.kanbanCollapsed
                    }
                });
            }
        }

        console.log("Seeding Role Types...");
        if (defaultsData.RoleTypes && defaultsData.RoleTypes.length > 0) {
            for (const item of defaultsData.RoleTypes) {
                await db.insert(schema.roleTypes).values({
                    id: item.id,
                    label: item.label,
                    description: item.description,
                    isDefault: item.isDefault
                }).onConflictDoUpdate({
                    target: schema.roleTypes.id,
                    set: {
                        label: item.label,
                        description: item.description,
                        isDefault: item.isDefault
                    }
                });
            }
        }

        console.log("Seeding Mapping Templates...");
        if (defaultsData.MappingTemplates && defaultsData.MappingTemplates.length > 0) {
            for (const item of defaultsData.MappingTemplates) {
                await db.insert(schema.mappingTemplates).values({
                    id: item.id,
                    name: item.name,
                    dataType: item.dataType
                }).onConflictDoUpdate({
                    target: schema.mappingTemplates.id,
                    set: {
                        name: item.name,
                        dataType: item.dataType
                    }
                });
            }
        }

        console.log("Seeding Guidance Items...");
        if (defaultsData.GuidanceItems && defaultsData.GuidanceItems.length > 0) {
            for (const item of defaultsData.GuidanceItems) {
                await db.insert(schema.guidanceItems).values({
                    id: item.id,
                    title: item.title,
                    body: item.content || item.body || "",
                    priority: item.priority || "Medium"
                }).onConflictDoUpdate({
                    target: schema.guidanceItems.id,
                    set: {
                        title: item.title,
                        body: item.content || item.body || "",
                        priority: item.priority || "Medium"
                    }
                });
            }
        }
        console.log("Seeding Saved Views...");
        if (defaultsData.SavedViews && defaultsData.SavedViews.length > 0) {
            for (const item of defaultsData.SavedViews) {
                // Handle parsing of stringified fields
                const stageIds = typeof item.stageIds === 'string' ? JSON.parse(item.stageIds) : item.stageIds;
                const config = typeof item.config === 'string' ? JSON.parse(item.config) : item.config;

                await db.insert(schema.savedViews).values({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    stageIds: stageIds,
                    viewType: item.viewType,
                    visibility: item.visibility,
                    isDefault: item.isDefault,
                    config: config
                }).onConflictDoUpdate({
                    target: schema.savedViews.id,
                    set: {
                        name: item.name,
                        description: item.description,
                        stageIds: stageIds,
                        viewType: item.viewType,
                        visibility: item.visibility,
                        isDefault: item.isDefault,
                        config: config
                    }
                });
            }
        }

        console.log("Seeding Task Types...");
        if (defaultsData.TaskTypes && defaultsData.TaskTypes.length > 0) {
            for (const item of defaultsData.TaskTypes) {
                await db.insert(schema.taskTypes).values({
                    id: item.id,
                    name: item.name,
                    color: item.color,
                    icon: item.icon,
                    isDefault: item.isDefault,
                    order: item.order,
                    createdAt: item.createdAt ? new Date(item.createdAt) : undefined
                }).onConflictDoUpdate({
                    target: schema.taskTypes.id,
                    set: {
                        name: item.name,
                        color: item.color,
                        icon: item.icon,
                        isDefault: item.isDefault,
                        order: item.order
                    }
                });
            }
        }

        console.log("Seeding Epic Types...");
        if (defaultsData.EpicTypes && defaultsData.EpicTypes.length > 0) {
            for (const item of defaultsData.EpicTypes) {
                await db.insert(schema.epicTypes).values({
                    id: item.id,
                    name: item.name,
                    color: item.color,
                    icon: item.icon,
                    isDefault: item.isDefault,
                    order: item.order,
                    createdAt: item.createdAt ? new Date(item.createdAt) : undefined
                }).onConflictDoUpdate({
                    target: schema.epicTypes.id,
                    set: {
                        name: item.name,
                        color: item.color,
                        icon: item.icon,
                        isDefault: item.isDefault,
                        order: item.order
                    }
                });
            }
        }

        console.log("Seeding Deliverable Types...");
        if (defaultsData.DeliverableTypes && defaultsData.DeliverableTypes.length > 0) {
            for (const item of defaultsData.DeliverableTypes) {
                await db.insert(schema.deliverableTypes).values({
                    id: item.id,
                    name: item.name,
                    color: item.color,
                    icon: item.icon,
                    isDefault: item.isDefault,
                    order: item.order,
                    createdAt: item.createdAt ? new Date(item.createdAt) : undefined
                }).onConflictDoUpdate({
                    target: schema.deliverableTypes.id,
                    set: {
                        name: item.name,
                        color: item.color,
                        icon: item.icon,
                        isDefault: item.isDefault,
                        order: item.order
                    }
                });
            }
        }

        console.log("Application Defaults applied successfully.");

    } catch (error) {
        console.error("Error seeding defaults:", error);
        process.exit(1);
    }
}

seedAppDefaults();
