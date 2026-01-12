# API Routes Module

This directory contains modularized API route handlers, extracted from the original monolithic `api/index.ts` for improved maintainability.

## Architecture

Each route module exports a `register` function that accepts the Express app and registers its endpoints:

```typescript
import type { Express } from "express";

export function registerAdminRoutes(app: Express): void {
  app.get("/api/admin/...", ...);
}
```

## Module Responsibilities

| Module | Endpoints | Description |
|--------|-----------|-------------|
| `admin.ts` | `/api/seed`, `/api/admin/sample-data/*` | Database seeding and sample data management |
| `projects.ts` | `/api/projects/*`, deliverables, epics, stages | Core project hierarchy CRUD |
| `tasks.ts` | `/api/tasks/*`, dependencies | Task management and relationships |
| `milestones.ts` | `/api/milestones/*`, scope rules, task links | Milestone tracking and scoping |
| `users.ts` | `/api/users/*`, identities, preferences | User management and profiles |
| `templates.ts` | `/api/*Templates`, snippets, export/import | Template CRUD and portability |
| `sprints.ts` | `/api/sprints/*`, members, scope, pulse | Sprint planning and tracking |
| `config.ts` | `/api/statusOptions`, roleTypes, taskTypes | System configuration |
| `import-export.ts` | `/api/import/*`, `/api/export/*` | Bulk data import/export |
| `schedule-sync.ts` | `/api/schedule-sync/*` | Date synchronization service |

## Dependencies

All route modules depend on:
- `../data/storage` - Data access layer
- `../middleware/require-permission` - Auth middleware
- `@shared/schema` - Validation schemas

## Adding New Routes

1. Create a new file in this directory
2. Export a `register*Routes(app: Express)` function
3. Import and call it from `../index.ts`
4. Update this README
