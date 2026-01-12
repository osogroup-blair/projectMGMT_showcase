import { db } from "../db";
import { systemRoles, systemPermissions, rolePermissions } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

function generateId(): string {
  return crypto.randomUUID();
}

const INITIAL_ROLES = [
  { name: "admin", label: "Admin", description: "Full platform access with all permissions", order: 0 },
  { name: "manager", label: "Manager", description: "Can manage users and projects", order: 1 },
  { name: "member", label: "Member", description: "Standard user with basic access", order: 2 },
  { name: "viewer", label: "Viewer", description: "Read-only access to projects and data", order: 3 },
  { name: "demo", label: "Demo", description: "Demo user with limited access for showcasing", order: 4 },
];

const INITIAL_PERMISSIONS = [
  { key: "users:read", label: "View Users", description: "Can view user profiles and list", category: "User Management", order: 0 },
  { key: "users:create", label: "Create Users", description: "Can create new user accounts", category: "User Management", order: 1 },
  { key: "users:update", label: "Update Users", description: "Can edit user profiles and settings", category: "User Management", order: 2 },
  { key: "users:delete", label: "Delete Users", description: "Can delete user accounts", category: "User Management", order: 3 },
  { key: "users:impersonate", label: "Impersonate Users", description: "Can log in as another user", category: "User Management", order: 4 },
  { key: "admin:access", label: "Admin Panel Access", description: "Can access the admin panel", category: "Admin Access", order: 0 },
  { key: "admin:settings", label: "Manage Settings", description: "Can modify platform settings", category: "Admin Access", order: 1 },
  { key: "admin:appdefaults", label: "Manage App Defaults", description: "Can configure app defaults", category: "Admin Access", order: 2 },
  { key: "projects:create", label: "Create Projects", description: "Can create new projects", category: "Projects", order: 0 },
  { key: "projects:delete", label: "Delete Projects", description: "Can delete projects", category: "Projects", order: 1 },
  { key: "projects:manage", label: "Manage All Projects", description: "Can manage any project regardless of ownership", category: "Projects", order: 2 },
  { key: "import:access", label: "Import Data", description: "Can import data from files", category: "Data Management", order: 0 },
  { key: "export:access", label: "Export Data", description: "Can export data to files", category: "Data Management", order: 1 },
];

const ROLE_PERMISSION_MAPPINGS: Record<string, string[]> = {
  admin: [
    "users:read", "users:create", "users:update", "users:delete", "users:impersonate",
    "admin:access", "admin:settings", "admin:appdefaults",
    "projects:create", "projects:delete", "projects:manage",
    "import:access", "export:access",
  ],
  manager: [
    "users:read", "users:update",
    "admin:access",
    "projects:create", "projects:manage",
    "import:access", "export:access",
  ],
  member: [
    "users:read",
    "projects:create",
    "import:access", "export:access",
  ],
  viewer: [
    "users:read",
    "export:access",
  ],
  demo: [
    "users:read",
    "users:impersonate",
  ],
};

export async function seedRolesAndPermissions(): Promise<{ roles: number; permissions: number; mappings: number }> {
  let rolesCreated = 0;
  let permissionsCreated = 0;
  let mappingsCreated = 0;

  const existingRoles = await db.select().from(systemRoles);
  const existingPermissions = await db.select().from(systemPermissions);

  for (const role of INITIAL_ROLES) {
    const exists = existingRoles.find(r => r.name === role.name);
    if (!exists) {
      await db.insert(systemRoles).values({
        id: `role-${role.name}`,
        ...role,
        isBuiltIn: true,
      });
      rolesCreated++;
    }
  }

  for (const perm of INITIAL_PERMISSIONS) {
    const exists = existingPermissions.find(p => p.key === perm.key);
    if (!exists) {
      await db.insert(systemPermissions).values({
        id: `perm-${perm.key.replace(":", "-")}`,
        ...perm,
      });
      permissionsCreated++;
    }
  }

  const allRoles = await db.select().from(systemRoles);
  const allPermissions = await db.select().from(systemPermissions);
  const existingMappings = await db.select().from(rolePermissions);

  for (const [roleName, permKeys] of Object.entries(ROLE_PERMISSION_MAPPINGS)) {
    const role = allRoles.find(r => r.name === roleName);
    if (!role) continue;

    for (const permKey of permKeys) {
      const perm = allPermissions.find(p => p.key === permKey);
      if (!perm) continue;

      const exists = existingMappings.find(m => m.roleId === role.id && m.permissionId === perm.id);
      if (!exists) {
        await db.insert(rolePermissions).values({
          id: generateId(),
          roleId: role.id,
          permissionId: perm.id,
        });
        mappingsCreated++;
      }
    }
  }

  return { roles: rolesCreated, permissions: permissionsCreated, mappings: mappingsCreated };
}

export async function getRoles() {
  return db.select().from(systemRoles).orderBy(systemRoles.order);
}

export async function getPermissions() {
  return db.select().from(systemPermissions).orderBy(systemPermissions.category, systemPermissions.order);
}

export async function getRolesWithPermissions() {
  const roles = await db.select().from(systemRoles).orderBy(systemRoles.order);
  const permissions = await db.select().from(systemPermissions).orderBy(systemPermissions.category, systemPermissions.order);
  const mappings = await db.select().from(rolePermissions);

  const permissionsByCategory: Record<string, typeof permissions> = {};
  for (const perm of permissions) {
    if (!permissionsByCategory[perm.category]) {
      permissionsByCategory[perm.category] = [];
    }
    permissionsByCategory[perm.category].push(perm);
  }

  const matrix: Record<string, string[]> = {};
  for (const role of roles) {
    matrix[role.id] = mappings
      .filter(m => m.roleId === role.id)
      .map(m => m.permissionId);
  }

  return {
    roles,
    permissions,
    permissionsByCategory,
    matrix,
  };
}

export async function setRolePermission(roleId: string, permissionId: string, enabled: boolean) {
  const existing = await db.select().from(rolePermissions)
    .where(eq(rolePermissions.roleId, roleId));
  
  const mapping = existing.find(m => m.permissionId === permissionId);

  if (enabled && !mapping) {
    await db.insert(rolePermissions).values({
      id: generateId(),
      roleId,
      permissionId,
    });
  } else if (!enabled && mapping) {
    await db.delete(rolePermissions).where(eq(rolePermissions.id, mapping.id));
  }

  return { success: true };
}

export async function getUserPermissions(systemRoleName: string, userPermissions: string[] = []): Promise<string[]> {
  const role = await db.select().from(systemRoles).where(eq(systemRoles.name, systemRoleName));
  if (!role.length) {
    return userPermissions;
  }

  const mappings = await db.select().from(rolePermissions).where(eq(rolePermissions.roleId, role[0].id));
  const permissions = await db.select().from(systemPermissions);

  const permissionKeys = mappings
    .map(m => permissions.find(p => p.id === m.permissionId)?.key)
    .filter((key): key is string => !!key);

  return Array.from(new Set([...permissionKeys, ...userPermissions]));
}
