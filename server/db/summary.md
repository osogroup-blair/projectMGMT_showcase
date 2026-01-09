# Server Database Directory

## Overview
Database connection and seeding functionality.

## Files

### `index.ts`
PostgreSQL connection setup using Drizzle ORM:
- Connects via `DATABASE_URL` environment variable
- Exports `db` instance for queries
- Exports `pool` for raw connections if needed

### `seed.ts`
Development data seeding:
- Creates sample projects, tasks, milestones, etc.
- Called via `/api/seed` endpoint
- Idempotent - can be run multiple times safely

## Schema Location
Database schema is defined in `shared/schema.ts`:
- Single source of truth for types
- Shared between frontend and backend
- Uses Drizzle schema definitions
