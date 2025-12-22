import { db } from "../server/db";
import { 
  users, projects, deliverables, epics, tasks, milestones, sprints,
  projectStages, projectRoles, savedViews, roleAssignments, roleTypes,
  milestoneTaskLinks, milestoneScopeRules, sprintMembers, sprintScopeEvents,
  guidanceItems, comments, attachments, history, activity, statusOptions,
  frameworkTemplates, stageTemplates, roleTemplates, projectTemplates,
  deliverableTemplates, epicTemplates, taskTemplates, mappingTemplates
} from "../shared/schema";
import * as fs from "fs";

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function escapeValue(val: any): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number") return String(val);
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (Array.isArray(val)) {
    if (val.length === 0) return "'{}'";
    const hasObjects = val.some(v => typeof v === "object" && v !== null);
    if (hasObjects) {
      return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
    }
    const escaped = val.map(v => {
      if (typeof v === "string") {
        return v.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      }
      return v;
    });
    return `'{"${escaped.join('","')}"}'`;
  }
  if (typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

function generateInserts(tableName: string, rows: any[]): string {
  if (rows.length === 0) return `-- No data in ${tableName}\n`;
  
  const camelColumns = Object.keys(rows[0]);
  const snakeColumns = camelColumns.map(col => camelToSnake(col));
  const lines: string[] = [`-- ${tableName} (${rows.length} rows)`];
  
  for (const row of rows) {
    const values = camelColumns.map(col => escapeValue(row[col]));
    lines.push(`INSERT INTO ${tableName} (${snakeColumns.join(", ")}) VALUES (${values.join(", ")});`);
  }
  
  return lines.join("\n") + "\n\n";
}

async function exportDatabase() {
  let sql = "-- Database Export from Development\n";
  sql += `-- Generated at: ${new Date().toISOString()}\n\n`;
  sql += "-- IMPORTANT: Run these statements in order due to foreign key constraints\n\n";

  const tables = [
    { name: "users", table: users },
    { name: "role_types", table: roleTypes },
    { name: "status_options", table: statusOptions },
    { name: "role_templates", table: roleTemplates },
    { name: "task_templates", table: taskTemplates },
    { name: "stage_templates", table: stageTemplates },
    { name: "framework_templates", table: frameworkTemplates },
    { name: "project_templates", table: projectTemplates },
    { name: "deliverable_templates", table: deliverableTemplates },
    { name: "epic_templates", table: epicTemplates },
    { name: "mapping_templates", table: mappingTemplates },
    { name: "projects", table: projects },
    { name: "project_stages", table: projectStages },
    { name: "project_roles", table: projectRoles },
    { name: "role_assignments", table: roleAssignments },
    { name: "deliverables", table: deliverables },
    { name: "epics", table: epics },
    { name: "sprints", table: sprints },
    { name: "sprint_members", table: sprintMembers },
    { name: "sprint_scope_events", table: sprintScopeEvents },
    { name: "tasks", table: tasks },
    { name: "milestones", table: milestones },
    { name: "milestone_task_links", table: milestoneTaskLinks },
    { name: "milestone_scope_rules", table: milestoneScopeRules },
    { name: "saved_views", table: savedViews },
    { name: "guidance_items", table: guidanceItems },
    { name: "comments", table: comments },
    { name: "attachments", table: attachments },
    { name: "history", table: history },
    { name: "activity", table: activity },
  ];

  for (const { name, table } of tables) {
    try {
      const rows = await db.select().from(table);
      sql += generateInserts(name, rows);
      console.log(`Exported ${name}: ${rows.length} rows`);
    } catch (error) {
      console.error(`Error exporting ${name}:`, error);
      sql += `-- Error exporting ${name}\n\n`;
    }
  }

  fs.writeFileSync("db-export.sql", sql);
  console.log("\nExport complete! File saved as: db-export.sql");
  process.exit(0);
}

exportDatabase().catch(console.error);
