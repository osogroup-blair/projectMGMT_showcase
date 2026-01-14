import type { Express } from "express";
import { storage } from "../../data/storage";

export interface SearchResult {
  id: string;
  type: "project" | "task" | "epic" | "milestone" | "user" | "deliverable";
  title: string;
  subtitle?: string;
  url: string;
  icon?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  totalCount: number;
}

export function registerSearchRoutes(
  app: Express,
  getAuthUserId: (req: any) => string | null
): void {
  app.get("/api/search", async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const query = (req.query.q as string || "").toLowerCase().trim();
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      
      if (!query || query.length < 2) {
        return res.json({ results: [], query, totalCount: 0 });
      }

      const results: SearchResult[] = [];

      const [projects, tasks, epics, milestones, usersResult, deliverables] = await Promise.all([
        storage.getProjects(),
        storage.getTasks(),
        storage.getEpics(),
        storage.getMilestones(),
        storage.getUsers(),
        storage.getDeliverables(),
      ]);

      const projectMap = new Map(projects.map(p => [p.id, p]));

      for (const project of projects) {
        const nameMatch = project.name?.toLowerCase().includes(query);
        const descMatch = project.description?.toLowerCase().includes(query);
        const clientMatch = project.client?.toLowerCase().includes(query);
        
        if (nameMatch || descMatch || clientMatch) {
          results.push({
            id: project.id,
            type: "project",
            title: project.name,
            subtitle: project.client || project.description?.slice(0, 60),
            url: `/projects/${project.id}`,
          });
        }
      }

      for (const task of tasks) {
        const titleMatch = task.title?.toLowerCase().includes(query);
        const descMatch = task.description?.toLowerCase().includes(query);
        
        if (titleMatch || descMatch) {
          const project = task.projectId ? projectMap.get(task.projectId) : null;
          results.push({
            id: task.id,
            type: "task",
            title: task.title,
            subtitle: project?.name || task.description?.slice(0, 60),
            url: `/projects/${task.projectId}/tasks/${task.id}`,
          });
        }
      }

      for (const epic of epics) {
        const titleMatch = epic.title?.toLowerCase().includes(query);
        const descMatch = epic.description?.toLowerCase().includes(query);
        
        if (titleMatch || descMatch) {
          const deliverable = deliverables.find(d => d.id === epic.deliverableId);
          const project = deliverable?.projectId ? projectMap.get(deliverable.projectId) : null;
          
          results.push({
            id: epic.id,
            type: "epic",
            title: epic.title,
            subtitle: deliverable?.title || epic.description?.slice(0, 60),
            url: project ? `/projects/${project.id}/epics/${epic.id}` : `/epics/${epic.id}`,
          });
        }
      }

      for (const milestone of milestones) {
        const nameMatch = milestone.name?.toLowerCase().includes(query);
        const descMatch = milestone.description?.toLowerCase().includes(query);
        
        if (nameMatch || descMatch) {
          const project = milestone.projectId ? projectMap.get(milestone.projectId) : null;
          results.push({
            id: milestone.id,
            type: "milestone",
            title: milestone.name,
            subtitle: project?.name || milestone.description?.slice(0, 60),
            url: `/projects/${milestone.projectId}/milestones/${milestone.id}`,
          });
        }
      }

      for (const user of usersResult) {
        const nameMatch = user.name?.toLowerCase().includes(query);
        const firstNameMatch = user.firstName?.toLowerCase().includes(query);
        const lastNameMatch = user.lastName?.toLowerCase().includes(query);
        
        if (nameMatch || firstNameMatch || lastNameMatch) {
          results.push({
            id: user.id,
            type: "user",
            title: user.name || `${user.firstName} ${user.lastName}`,
            subtitle: user.jobTitle || undefined,
            url: `/admin/users/${user.id}`,
          });
        }
      }

      for (const deliverable of deliverables) {
        const titleMatch = deliverable.title?.toLowerCase().includes(query);
        const descMatch = deliverable.description?.toLowerCase().includes(query);
        
        if (titleMatch || descMatch) {
          const project = deliverable.projectId ? projectMap.get(deliverable.projectId) : null;
          results.push({
            id: deliverable.id,
            type: "deliverable",
            title: deliverable.title,
            subtitle: project?.name || deliverable.description?.slice(0, 60) || undefined,
            url: `/projects/${deliverable.projectId}/deliverables/${deliverable.id}`,
          });
        }
      }

      const limitedResults = results.slice(0, limit);

      res.json({
        results: limitedResults,
        query,
        totalCount: results.length,
      });
    } catch (error: any) {
      console.error("Search error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
