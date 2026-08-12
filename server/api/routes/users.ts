import type { Express } from "express";
import { storage } from "../../data/storage";
import * as userManagementService from "../../services/user-management";
import * as identityService from "../../services/user-management/identity-service";
import { requireAuth, requirePermission, requireRole, requireSelfOrRole } from "../../middleware/require-permission";
import {
  UserPermissions,
  createUserRequestSchema,
  updateUserRequestSchema,
} from "@shared/contracts/user-management";
import {
  linkIdentityRequestSchema,
  updateIdentityRequestSchema,
  updateProfileRequestSchema,
  AvailableSystems,
} from "@shared/contracts/user-identity";
import { db } from "../../db";
import { sql } from "drizzle-orm";
import { users } from "@shared/models/auth";
import { tasks, projects } from "@shared/schema";

export function registerUserRoutes(
  app: Express,
  getAuthUserId: (req: any) => string | null
): void {
  // Users with task/project counts (for impersonate dropdown)
  app.get("/api/users/with-counts", requireAuth(), async (req, res) => {
    try {
      const allUsers = await db.select().from(users);
      const taskCounts = await db
        .select({
          assigneeId: tasks.assigneeId,
          count: sql<number>`count(*)::int`
        })
        .from(tasks)
        .groupBy(tasks.assigneeId);

      const projectCounts = await db
        .select({
          ownerId: projects.ownerId,
          count: sql<number>`count(*)::int`
        })
        .from(projects)
        .groupBy(projects.ownerId);

      const taskCountMap = new Map(taskCounts.filter(t => t.assigneeId).map(t => [t.assigneeId, t.count]));
      const projectCountMap = new Map(projectCounts.filter(p => p.ownerId).map(p => [p.ownerId, p.count]));

      const usersWithCounts = allUsers.map(u => ({
        id: u.id,
        name: u.name,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        profileImageUrl: u.profileImageUrl,
        systemRole: u.systemRole,
        taskCount: taskCountMap.get(u.id) || 0,
        projectCount: projectCountMap.get(u.id) || 0,
      }));

      res.json(usersWithCounts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Users (with permission middleware)
  app.get("/api/users", async (req, res) => {
    try {
      const { search, role, status, userType, page, pageSize, sortBy, sortOrder, limit, offset } = req.query;
      const result = await userManagementService.listUsers({
        search: search as string,
        role: role as string,
        status: status as string,
        userType: userType as any,
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 20,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User Export - export all users with identities for migration to another instance (admin/manager only)
  // Note: This route must be defined BEFORE /api/users/:id to prevent "export" from being matched as an :id
  app.get("/api/users/export", requireAuth(), requireRole("admin", "manager"), async (req, res) => {
    try {
      const allUsers = await storage.getUsers();
      const allIdentities = await storage.getUserIdentities();

      const usersWithIdentities = allUsers.map((user: any) => {
        const userIdentities = allIdentities.filter((ident: any) => ident.userId === user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          status: user.status || 'Active',
          avatar: user.avatar || user.profileImageUrl,
          systemRole: user.systemRole,
          jobTitle: user.jobTitle,
          externalId: user.externalId,
          importSource: user.importSource,
          createdAt: user.createdAt,
          identities: userIdentities.map((ident: any) => ({
            identityId: ident.id,
            externalUserId: ident.externalUserId,
            externalUsername: ident.externalUsername,
            externalEmail: ident.externalEmail,
            identityType: ident.identityType,
            status: ident.status,
            system: {
              systemId: ident.systemId,
              systemType: ident.systemType,
              systemName: ident.systemName,
              workspaceId: ident.workspaceId,
            },
            auth: ident.auth,
            roles: ident.roles,
            permissions: ident.externalPermissions,
            profile: ident.profile,
            sync: {
              sourceOfTruth: ident.syncSourceOfTruth,
              lastSyncedAt: ident.lastSyncedAt,
              syncStatus: ident.syncStatus,
              lastError: ident.lastSyncError,
            },
            metadata: {
              createdBy: ident.createdBy,
              updatedBy: ident.updatedBy,
              createdAt: ident.createdAt,
              updatedAt: ident.updatedAt,
            },
          })),
        };
      });

      const exportData = {
        exportedAt: new Date().toISOString(),
        exportVersion: "1.0",
        sourceInstance: process.env.INSTANCE_NAME || "prodCo-workspace",
        Users: usersWithIdentities,
      };

      res.json(exportData);
    } catch (error: any) {
      console.error("User export error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await userManagementService.getUserById(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users", requireAuth(), requirePermission(UserPermissions.USERS_CREATE), async (req, res) => {
    try {
      const validated = createUserRequestSchema.parse(req.body);
      const user = await userManagementService.createUser(validated);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/users/:id", requireAuth(), requireSelfOrRole("id", "admin", "manager"), async (req, res) => {
    try {
      const validated = updateUserRequestSchema.parse(req.body);
      const user = await userManagementService.updateUser(req.params.id, validated);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Preflight check before deletion - shows all dependencies
  app.get("/api/users/:id/deletion-preflight", requireAuth(), requireRole("admin"), async (req, res) => {
    try {
      const preflight = await userManagementService.getUserDeletionPreflight(req.params.id);
      res.json(preflight);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Transfer ownership of entities from one user to another
  app.post("/api/users/:id/transfer-ownership", requireAuth(), requireRole("admin"), async (req, res) => {
    try {
      const { targetUserId, entityType, entityIds } = req.body;
      if (!targetUserId || !entityType || !entityIds || !Array.isArray(entityIds)) {
        return res.status(400).json({ error: "targetUserId, entityType, and entityIds array are required" });
      }
      const count = await userManagementService.transferOwnership(req.params.id, targetUserId, entityType, entityIds);
      res.json({ transferred: count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Soft delete - archives user without hard deleting
  app.post("/api/users/:id/archive", requireAuth(), requirePermission(UserPermissions.USERS_DELETE), async (req, res) => {
    try {
      await userManagementService.archiveUser(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Hard delete - permanently removes user (requires preflight check to pass)
  app.delete("/api/users/:id/permanent", requireAuth(), requireRole("admin"), async (req, res) => {
    try {
      const preflight = await userManagementService.getUserDeletionPreflight(req.params.id);
      if (!preflight.canDelete) {
        return res.status(400).json({
          error: "Cannot delete user with blocking dependencies. Use preflight check to see details.",
          blockers: preflight.blockers
        });
      }
      await userManagementService.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/users/:id", requireAuth(), requirePermission(UserPermissions.USERS_DELETE), async (req, res) => {
    try {
      await userManagementService.deactivateUser(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk user operations (admin/manager only)
  app.patch("/api/users/bulk/role", requireAuth(), requireRole("admin", "manager"), async (req, res) => {
    try {
      const { ids, role } = req.body;
      if (!ids || !Array.isArray(ids) || !role) {
        return res.status(400).json({ error: "ids array and role are required" });
      }
      const count = await userManagementService.bulkUpdateRole(ids, role);
      res.json({ updated: count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/users/bulk/deactivate", requireAuth(), requireRole("admin", "manager"), async (req, res) => {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ error: "ids array is required" });
      }
      const count = await userManagementService.bulkDeactivate(ids);
      res.json({ deactivated: count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/users/bulk/activate", requireAuth(), requireRole("admin", "manager"), async (req, res) => {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ error: "ids array is required" });
      }
      const count = await userManagementService.bulkActivate(ids);
      res.json({ activated: count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk preflight check for multiple users
  app.post("/api/users/bulk/deletion-preflight", requireAuth(), requireRole("admin"), async (req, res) => {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ error: "ids array is required" });
      }

      const results = await Promise.all(
        ids.map(async (id: string) => {
          const preflight = await userManagementService.getUserDeletionPreflight(id);
          const user = await userManagementService.getUserById(id);
          return {
            id,
            name: user?.name || user?.email || id,
            ...preflight
          };
        })
      );

      res.json({ users: results });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk delete with preflight - archives users with blockers, deletes clean users
  app.delete("/api/users/bulk", requireAuth(), requireRole("admin"), async (req, res) => {
    try {
      const { ids, mode = "archive" } = req.body;
      if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ error: "ids array is required" });
      }
      const result = await userManagementService.bulkDeleteWithPreflight(ids, mode);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Available external systems for identity linking
  app.get("/api/identity/systems", requireAuth(), async (req, res) => {
    res.json(AvailableSystems);
  });

  // User Profile with Identities
  app.get("/api/users/:id/profile", requireAuth(), requireSelfOrRole("id", "admin", "manager"), async (req, res) => {
    try {
      const profile = await identityService.getUserProfileWithIdentities(req.params.id);
      if (!profile) return res.status(404).json({ error: "User not found" });
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update user profile (not identities)
  app.patch("/api/users/:id/profile", requireAuth(), requireSelfOrRole("id", "admin", "manager"), async (req, res) => {
    try {
      const validated = updateProfileRequestSchema.parse(req.body);
      const userId = getAuthUserId(req);
      const profile = await identityService.updateUserProfile(req.params.id, validated, userId || undefined);
      if (!profile) return res.status(404).json({ error: "User not found" });
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all user identities (for import matching)
  app.get("/api/identities/all", requireAuth(), requireRole("admin", "manager"), async (req, res) => {
    try {
      const identities = await identityService.getAllUserIdentities();
      res.json(identities);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get user's project memberships with roles
  app.get("/api/users/:userId/project-memberships", async (req, res) => {
    try {
      const { userId } = req.params;
      const memberships = await storage.getProjectTeamMembersByUser(userId);

      const result = await Promise.all(memberships.map(async (m) => {
        const highLevelRoles = await storage.getHighLevelRoles(m.id);
        return {
          ...m,
          highLevelRoles: highLevelRoles.map(r => r.roleType),
        };
      }));

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get user identities
  app.get("/api/users/:userId/identities", requireAuth(), requireSelfOrRole("userId", "admin", "manager"), async (req, res) => {
    try {
      const identities = await identityService.getUserIdentities(req.params.userId);
      res.json(identities);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Link a new identity to user
  app.post("/api/users/:userId/identities", requireAuth(), requireRole("admin", "manager"), async (req, res) => {
    try {
      const validated = linkIdentityRequestSchema.parse(req.body);
      const userId = getAuthUserId(req);
      const identity = await identityService.linkIdentityToUser(req.params.userId, validated, userId || undefined);
      res.status(201).json(identity);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get single identity
  app.get("/api/identities/:identityId", requireAuth(), async (req, res) => {
    try {
      const identity = await identityService.getIdentityById(req.params.identityId);
      if (!identity) return res.status(404).json({ error: "Identity not found" });
      res.json(identity);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update identity
  app.patch("/api/identities/:identityId", requireAuth(), requireRole("admin", "manager"), async (req, res) => {
    try {
      const validated = updateIdentityRequestSchema.parse(req.body);
      const userId = getAuthUserId(req);
      const identity = await identityService.updateIdentity(req.params.identityId, validated, userId || undefined);
      if (!identity) return res.status(404).json({ error: "Identity not found" });
      res.json(identity);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Unlink identity from user
  app.delete("/api/users/:userId/identities/:identityId", requireAuth(), requireRole("admin", "manager"), async (req, res) => {
    try {
      await identityService.unlinkIdentityFromUser(req.params.userId, req.params.identityId);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Find identity by external reference
  app.get("/api/identities/lookup", requireAuth(), async (req, res) => {
    try {
      const { systemId, externalUserId, workspaceId } = req.query;
      if (!systemId || !externalUserId) {
        return res.status(400).json({ error: "systemId and externalUserId are required" });
      }
      const identity = await identityService.findIdentityByExternal(
        systemId as string,
        externalUserId as string,
        workspaceId as string | undefined
      );
      if (!identity) return res.status(404).json({ error: "Identity not found" });
      res.json(identity);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Merge users (admin only)
  app.post("/api/users/merge", requireAuth(), requireRole("admin"), async (req, res) => {
    try {
      const { sourceUserId, targetUserId, conflictResolution } = req.body;
      if (!sourceUserId || !targetUserId) {
        return res.status(400).json({ error: "sourceUserId and targetUserId are required" });
      }
      const userId = getAuthUserId(req);
      const result = await identityService.mergeUsers(
        { sourceUserId, targetUserId, conflictResolution },
        userId || 'system'
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // User Import - import users from external systems (admin/manager only)
  app.post("/api/users/import", requireAuth(), requireRole("admin", "manager"), async (req, res) => {
    try {
      const { Users: importedUsers } = req.body;

      if (!importedUsers || !Array.isArray(importedUsers)) {
        return res.status(400).json({ error: "Invalid import format. Expected { Users: [...] }" });
      }

      const results = {
        created: 0,
        updated: 0,
        errors: [] as { email: string; error: string }[],
        identitiesCreated: 0,
      };

      for (const importedUser of importedUsers) {
        try {
          // Check if user with this email already exists
          const existingUsers = await storage.getUsers();
          const existingUser = existingUsers.find((u: any) => u.email === importedUser.email);

          // Parse name into first/last
          let firstName = null;
          let lastName = null;
          if (importedUser.name) {
            const nameParts = importedUser.name.trim().split(/\s+/);
            firstName = nameParts[0] || null;
            lastName = nameParts.slice(1).join(' ') || null;
          }

          let userId: string;

          if (existingUser) {
            // Update existing user with import data
            await storage.updateUser(existingUser.id, {
              name: importedUser.name || existingUser.name,
              firstName: firstName || existingUser.firstName,
              lastName: lastName || existingUser.lastName,
              status: importedUser.status || existingUser.status,
              avatar: importedUser.avatar || existingUser.avatar,
              externalId: importedUser.id, // Store original external ID
              importSource: importedUser.identities?.[0]?.system?.systemId || 'import',
              importedAt: new Date(),
            });
            userId = existingUser.id;
            results.updated++;
          } else {
            // Create new user with external ID as primary ID
            // Use direct db insert since we need to specify the ID
            const { users } = await import("@shared/schema");
            const [newUser] = await db.insert(users).values({
              id: importedUser.id, // Use external ID as primary ID initially
              email: importedUser.email,
              name: importedUser.name || importedUser.email,
              firstName,
              lastName,
              status: importedUser.status || 'Active',
              avatar: importedUser.avatar || null,
              systemRole: 'member',
              externalId: importedUser.id,
              importSource: importedUser.identities?.[0]?.system?.systemId || 'import',
              importedAt: new Date(),
            }).returning();
            userId = newUser.id;
            results.created++;
          }

          // Store identities
          if (importedUser.identities && Array.isArray(importedUser.identities)) {
            for (const identity of importedUser.identities) {
              try {
                await storage.createUserIdentity({
                  id: identity.identityId || `ident-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  userId,
                  systemId: identity.system?.systemId || 'unknown',
                  systemType: identity.system?.systemType,
                  systemName: identity.system?.systemName,
                  workspaceId: identity.system?.workspaceId,
                  externalUserId: identity.externalUserId,
                  externalUsername: identity.externalUsername,
                  externalEmail: identity.externalEmail,
                  identityType: identity.identityType || 'user',
                  status: identity.status || 'active',
                  auth: identity.auth,
                  roles: identity.roles || [],
                  externalPermissions: identity.permissions,
                  profile: identity.profile,
                  syncSourceOfTruth: identity.sync?.sourceOfTruth || 'mixed',
                  lastSyncedAt: identity.sync?.lastSyncedAt ? new Date(identity.sync.lastSyncedAt) : null,
                  syncStatus: identity.sync?.syncStatus || 'healthy',
                  lastSyncError: identity.sync?.lastError,
                  createdBy: identity.metadata?.createdBy,
                  updatedBy: identity.metadata?.updatedBy,
                });
                results.identitiesCreated++;
              } catch (identityError: any) {
                console.error(`Failed to create identity for user ${importedUser.email}:`, identityError);
              }
            }
          }
        } catch (userError: any) {
          results.errors.push({
            email: importedUser.email || 'unknown',
            error: userError.message,
          });
        }
      }

      res.json({
        success: true,
        message: `Imported ${results.created} new users, updated ${results.updated} existing users, created ${results.identitiesCreated} identities`,
        ...results,
      });
    } catch (error: any) {
      console.error("User import error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
