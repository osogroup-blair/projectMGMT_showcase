import type { Express } from "express";

export function registerScheduleSyncRoutes(
  app: Express,
  getAuthUserId: (req: any) => string | null
): void {
  const scheduleSyncServiceImport = import("../../services/schedule-sync-service");
  
  app.post("/api/schedule-sync/evaluate", async (req, res) => {
    try {
      const { scheduleSyncService } = await scheduleSyncServiceImport;
      const { entityType, entityId, proposedDates, userId } = req.body;
      
      if (!entityType || !entityId || !proposedDates) {
        return res.status(400).json({ error: "entityType, entityId, and proposedDates are required" });
      }
      
      const changePlan = await scheduleSyncService.evaluate({
        entityType,
        entityId,
        proposedDates,
        userId: userId || undefined
      });
      
      res.json(changePlan);
    } catch (error: any) {
      console.error("Schedule sync evaluate error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/schedule-sync/apply", async (req, res) => {
    try {
      const { scheduleSyncService } = await scheduleSyncServiceImport;
      const { action, changePlan, overrideReason, userId } = req.body;
      
      if (!action || !changePlan) {
        return res.status(400).json({ error: "action and changePlan are required" });
      }
      
      const result = await scheduleSyncService.apply({
        action,
        changePlan,
        overrideReason,
        userId: userId || undefined
      });
      
      res.json(result);
    } catch (error: any) {
      console.error("Schedule sync apply error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/schedule-sync/overridden", async (req, res) => {
    try {
      const { scheduleSyncService } = await scheduleSyncServiceImport;
      const projectId = req.query.projectId as string | undefined;
      const result = await scheduleSyncService.getOverriddenEntities(projectId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/schedule-sync/bulk-resolve", async (req, res) => {
    try {
      const { scheduleSyncService } = await scheduleSyncServiceImport;
      const { entityType, entityIds, userId } = req.body;
      
      if (!entityType || !entityIds || !Array.isArray(entityIds)) {
        return res.status(400).json({ error: "entityType and entityIds array are required" });
      }
      
      const resolved = await scheduleSyncService.bulkResolveOverrides(entityType, entityIds, userId || undefined);
      res.json({ resolved });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
