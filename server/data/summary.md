# Server Data Directory

## Overview
Data access layer implementing the repository pattern.

## Files

### `storage.ts`
Storage interface and implementation:
- Defines `IStorage` interface for all data operations
- Implements storage using Drizzle ORM queries
- Provides CRUD operations for all entities

## Usage
```typescript
import { storage } from "@/data/storage";

// Get all projects
const projects = await storage.getProjects();

// Create a project
const project = await storage.createProject(data);

// Update a project
await storage.updateProject(id, updates);
```

## Guidelines

1. **Interface-first**: Define methods in `IStorage` interface first
2. **Type safety**: Use types from `@shared/schema.ts`
3. **Transactions**: Use database transactions for atomic operations
4. **Error handling**: Let errors bubble up to route handlers
