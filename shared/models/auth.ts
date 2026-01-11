import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
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
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  // Core identity (from Google SSO)
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  
  // App-specific fields (migrated from existing schema)
  name: text("name"), // Display name (can be set by user)
  jobTitle: text("job_title"), // Role in organization (e.g., "Project Manager")
  status: text("status").default("Offline"), // Online status
  avatar: text("avatar"), // Custom avatar (overrides profileImageUrl if set)
  
  // RBAC fields (for future use)
  systemRole: text("system_role").default("member"), // admin, manager, member, viewer
  permissions: jsonb("permissions").$type<string[]>().default([]), // Granular permissions array
  
  // Import tracking fields (for matching imported users to authenticated users)
  externalId: varchar("external_id"), // Original ID from external system (e.g., ClickUp ID)
  importSource: varchar("import_source"), // Source system name (e.g., "clickup", "jira")
  importedAt: timestamp("imported_at"), // When this user was imported
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
