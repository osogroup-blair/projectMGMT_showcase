# Server API Directory

## Overview
RESTful API route definitions for all backend endpoints.

## Structure

### `index.ts`
Main routes file containing all API endpoints.

## API Patterns

All routes follow the pattern `/api/<resource>`:
- `/api/projects` - Project CRUD
- `/api/projects/:projectId/deliverables` - Nested deliverables
- `/api/projects/:projectId/tasks` - Project tasks
- `/api/projects/:projectId/milestones` - Milestones
- `/api/projects/:projectId/sprints` - Sprints
- `/api/users` - User management
- `/api/seed` - Development seeding

## Guidelines

1. **RESTful conventions**: Use proper HTTP methods (GET, POST, PUT, DELETE)
2. **Validation**: Validate request bodies with Zod before storage operations
3. **Storage layer**: All data operations go through `@/data/storage.ts`
4. **Error responses**: Return proper status codes and error messages
