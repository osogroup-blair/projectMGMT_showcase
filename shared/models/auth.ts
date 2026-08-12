import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

// Session storage table for authentication sessions.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table - combines auth fields with app-specific fields
export const users = pgTable("users", {
  // Core identity (from SSO providers)
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),

  // Authentication provider tracking
  authProvider: varchar("auth_provider").default("microsoft"), // "microsoft", "google"
  microsoftId: varchar("microsoft_id"), // Microsoft user object ID for linking
  googleId: varchar("google_id"), // Google user object ID for linking

  // App-specific fields (migrated from existing schema)
  userType: text("user_type").default("internal"), // "internal" | "client"
  name: text("name"), // Display name (can be set by user)
  jobTitle: text("job_title"), // Role in organization (e.g., "Project Manager")
  status: text("status").default("Offline"), // Online status
  avatar: text("avatar"), // Custom avatar (overrides profileImageUrl if set)

  // RBAC fields (for future use)
  systemRole: text("system_role").default("member"), // admin, manager, member, viewer
  permissions: jsonb("permissions").$type<string[]>().default([]), // Granular permissions array
  roleTemplateIds: jsonb("role_template_ids").$type<string[]>().default([]), // Assigned role templates (e.g., Designer, Developer, QA)

  // Import tracking fields (for matching imported users to authenticated users)
  externalId: varchar("external_id"), // Original ID from external system (e.g., ClickUp ID)
  importSource: varchar("import_source"), // Source system name (e.g., "clickup", "jira")
  importedAt: timestamp("imported_at"), // When this user was imported

  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),

  // Login tracking
  lastLogin: timestamp("last_login"),
  loginCount: integer("login_count").default(0),
});

// App-wide settings including authentication configuration
export const appSettings = pgTable("app_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").unique().notNull(),
  value: jsonb("value"),
  description: text("description"),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type AppSetting = typeof appSettings.$inferSelect;
export type InsertAppSetting = typeof appSettings.$inferInsert;

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
 z.object({}); // dummy reference for zod
import { z } from "zod";
export const insertUserSchema = z.object({
  id: z.string().optional(),
  email: z.string().email().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  profileImageUrl: z.string().optional().nullable(),
  authProvider: z.string().default("microsoft"),
  microsoftId: z.string().optional().nullable(),
  googleId: z.string().optional().nullable(),
  userType: z.string().default("internal"),
  name: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  status: z.string().default("Offline"),
  avatar: z.string().optional().nullable(),
  systemRole: z.string().default("member"),
  permissions: z.array(z.string()).default([]),
  roleTemplateIds: z.array(z.string()).default([]),
  externalId: z.string().optional().nullable(),
  importSource: z.string().optional().nullable(),
  importedAt: z.date().optional().nullable(),
  lastLogin: z.date().optional().nullable(),
  loginCount: z.number().default(0),
});
export const insertAppSettingSchema = z.object({
  id: z.string().optional(),
  key: z.string(),
  value: z.any().optional(),
  description: z.string().optional().nullable(),
  updatedBy: z.string().optional().nullable(),
});
