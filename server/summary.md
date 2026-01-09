# Server Directory

## Overview
Node.js Express server with TypeScript. Provides RESTful API endpoints for the Nymbl Workspace application.

## Structure

### `app/`
Express application bootstrap and middleware:
- `index.ts` - Main Express app setup
- `vite.ts` - Vite dev server integration
- `static.ts` - Production static file serving

### `api/`
API route definitions:
- `index.ts` - All API routes under `/api/*`

### `db/`
Database connection and seeding:
- `index.ts` - PostgreSQL connection via Drizzle ORM
- `seed.ts` - Development data seeding

### `data/`
Data access layer:
- `storage.ts` - Repository pattern for database operations

## Entry Point
`index.ts` - Main server entry point that imports from `app/`

## Guidelines

1. **Thin routes**: Keep route handlers minimal, delegate to storage layer
2. **Validation**: Use Zod schemas from `@shared/schema.ts` for input validation
3. **Error handling**: Use proper HTTP status codes and error messages
4. **No business logic in routes**: Storage layer handles data operations
