import { Router, Request, Response } from "express";
import { requireAuth, requirePermission } from "../../middleware/require-permission";
import { 
  seedRolesAndPermissions, 
  getRolesWithPermissions, 
  setRolePermission 
} from "../../services/roles-permissions-service";

const router = Router();

router.get("/", requireAuth(), async (req: Request, res: Response) => {
  try {
    const data = await getRolesWithPermissions();
    res.json(data);
  } catch (error) {
    console.error("Error getting roles and permissions:", error);
    res.status(500).json({ error: "Failed to get roles and permissions" });
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

export default router;
