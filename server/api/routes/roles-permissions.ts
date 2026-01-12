import { Router, Request, Response } from "express";
import { requireAuth, requirePermission } from "../../middleware/require-permission";
import { 
  seedRolesAndPermissions, 
  getRolesWithPermissions, 
  setRolePermission,
  getRoles,
  getPermissions,
} from "../../services/roles-permissions-service";

const router = Router();

router.get("/roles", requireAuth(), async (req: Request, res: Response) => {
  try {
    const roles = await getRoles();
    res.json(roles);
  } catch (error) {
    console.error("Error getting roles:", error);
    res.status(500).json({ error: "Failed to get roles" });
  }
});

router.get("/permissions", requireAuth(), async (req: Request, res: Response) => {
  try {
    const permissions = await getPermissions();
    const transformed = permissions.map(p => ({
      id: p.id,
      key: p.key,
      displayName: p.label,
      category: p.category,
    }));
    res.json(transformed);
  } catch (error) {
    console.error("Error getting permissions:", error);
    res.status(500).json({ error: "Failed to get permissions" });
  }
});

router.get("/", requireAuth(), async (req: Request, res: Response) => {
  try {
    const data = await getRolesWithPermissions();
    res.json(data);
  } catch (error) {
    console.error("Error getting roles and permissions:", error);
    res.status(500).json({ error: "Failed to get roles and permissions" });
  }
});

router.get("/matrix", requireAuth(), async (req: Request, res: Response) => {
  try {
    const data = await getRolesWithPermissions();
    res.json(data);
  } catch (error) {
    console.error("Error getting roles and permissions matrix:", error);
    res.status(500).json({ error: "Failed to get roles and permissions matrix" });
  }
});

router.post("/seed", requireAuth(), async (req: Request, res: Response) => {
  try {
    const result = await seedRolesAndPermissions();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("Error seeding roles and permissions:", error);
    res.status(500).json({ error: "Failed to seed roles and permissions" });
  }
});

router.put("/assignment", requireAuth(), async (req: Request, res: Response) => {
  try {
    const { roleId, permissionId, enabled } = req.body;
    
    if (!roleId || !permissionId || typeof enabled !== "boolean") {
      res.status(400).json({ error: "roleId, permissionId, and enabled are required" });
      return;
    }

    const result = await setRolePermission(roleId, permissionId, enabled);
    res.json(result);
  } catch (error) {
    console.error("Error updating role permission:", error);
    res.status(500).json({ error: "Failed to update role permission" });
  }
});

router.post("/toggle", requireAuth(), async (req: Request, res: Response) => {
  try {
    const { roleId, permissionId, enabled } = req.body;
    
    if (!roleId || !permissionId || typeof enabled !== "boolean") {
      res.status(400).json({ error: "roleId, permissionId, and enabled are required" });
      return;
    }

    const result = await setRolePermission(roleId, permissionId, enabled);
    res.json(result);
  } catch (error) {
    console.error("Error toggling role permission:", error);
    res.status(500).json({ error: "Failed to toggle role permission" });
  }
});

router.get("/user/:userId/effective", requireAuth(), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { getUserEffectivePermissions } = await import("../../services/roles-permissions-service");
    const permissions = await getUserEffectivePermissions(userId);
    res.json({ permissions });
  } catch (error) {
    console.error("Error getting user effective permissions:", error);
    res.status(500).json({ error: "Failed to get user effective permissions" });
  }
});

export default router;
