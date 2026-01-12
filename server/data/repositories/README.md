# Data Repositories

This directory contains entity-specific repository modules extracted from the original `storage.ts` for improved maintainability.

## Architecture

Each repository module exports functions for a specific entity group. The main `storage.ts` file composes these into the `DatabaseStorage` class that implements `IStorage`.

## Repository Pattern

```typescript
// Example: user-repository.ts
import { db } from "../../db";
import * as schema from "@shared/schema";
import type { User, InsertUser } from "@shared/schema";

export async function getUsers(): Promise<User[]> {
  return await db.select().from(schema.users);
}

export async function getUserById(id: string): Promise<User | undefined> {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
  return user;
}
// ... more operations
```

## Repositories

| Repository | Entities | Operations |
|------------|----------|------------|
| `user-repository.ts` | Users, UserIdentities | CRUD for user accounts and external identities |
| `project-repository.ts` | Projects, Deliverables, Epics | CRUD for project hierarchy |
| `task-repository.ts` | Tasks, TaskDependencies | CRUD for tasks and relationships |
| `milestone-repository.ts` | Milestones, ScopeRules, TaskLinks | CRUD for milestone tracking |
| `sprint-repository.ts` | Sprints, Members, ScopeEvents, PulseUpdates | CRUD for sprint planning |
| `template-repository.ts` | All template types, Snippets | CRUD for templates |
| `config-repository.ts` | StatusOptions, RoleTypes, TaskTypes | CRUD for configuration entities |

## Integration

The `DatabaseStorage` class in `storage.ts` delegates to these repository functions while maintaining the `IStorage` interface for backwards compatibility.
