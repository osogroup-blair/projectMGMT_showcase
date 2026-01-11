# Nymbl Workspace

## Overview

Nymbl Workspace is an AI-powered project management platform designed for service delivery organizations. It offers comprehensive project lifecycle management, including project creation, tracking, and management with configurable frameworks, hierarchical work breakdown structures (Projects → Deliverables → Epics → Tasks), milestone tracking, and team management. Key capabilities include customizable views (Kanban, Table, Timeline), stage-based workflows, and a unified interactive timeline for visualizing project progress. The platform supports advanced import/export functionalities, sprint planning, and a redesigned project creation wizard for enhanced usability and efficiency.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React 18 and TypeScript, utilizing Wouter for routing and TanStack Query for server state management. UI components are developed using shadcn/ui, based on Radix UI primitives, styled with Tailwind CSS v4, and bundled with Vite.

### Backend Architecture

The backend operates on Node.js with Express and TypeScript, exposing RESTful API endpoints. Data persistence is managed with PostgreSQL via Drizzle ORM, with a shared schema definition (`shared/schema.ts`) between frontend and backend.

### Data Model

The core data model follows a hierarchical structure: Projects, Deliverables, Epics, Tasks, Milestones, Stages, and Sprints. Supporting entities include Users, Roles, Assignments, Views, Guidance Items, and various template types. The model also incorporates User Preferences, Work Blocks, and Day Plans for personalized planning.

### Authentication

The platform uses Replit Auth with OpenID Connect for authentication, supporting Google, GitHub, Apple, and email sign-in methods.

**Key Files:**
- `server/replit_integrations/auth/` - Auto-generated auth module (avoid modifying)
- `shared/models/auth.ts` - User schema with auth fields
- `client/src/components/auth/auth-guard.tsx` - Route protection component
- `client/src/pages/landing/index.tsx` - Landing page for unauthenticated users

**Auth Flow:**
1. Unauthenticated users see landing page with "Sign in with Google" button
2. `/api/login` initiates OIDC flow
3. Callback upserts user by ID (matching email to claim existing accounts)
4. Authenticated users access protected routes

**RBAC Support:**
- `systemRole` field: 'admin' | 'manager' | 'member' | 'viewer' (default: 'member')
- `permissions` array: Granular permission strings
- `AuthGuard` component accepts `requiredRoles` and `requiredPermissions` props
- Permission middleware in `server/middleware/require-permission.ts` enforces route-level access control
- Admin pages (`/admin/*`) protected with AuthGuard requiring admin or manager roles

**Audit Logging:**
- Core entities (projects, deliverables, epics, tasks, milestones, sprints) track `createdBy`, `updatedBy`, `createdAt`, and `updatedAt` fields
- API routes automatically populate `createdBy` and `updatedBy` from the authenticated session user
- Helper function `getAuthUserId(req)` extracts user ID from `req.user.claims.sub`

**User Management Architecture:**
- Contracts: `shared/contracts/user-management.ts` defines request/response schemas and permission constants
- Services: `server/services/user-management/` contains business logic (list, get, create, update, deactivate)
- Client hooks: `client/src/features/user-management/hooks/use-users-api.ts` provides TanStack Query hooks
- Admin page: `client/src/pages/admin/user-management.tsx` protected by AuthGuard requiring admin or manager role
- API response format: `/api/users` returns `{ users: [...], total: number }` for pagination support

### API Structure

API routes are RESTful, organized logically around core entities (e.g., `/api/projects`, `/api/users`, `/api/sprints`) and nested resources (e.g., `/api/projects/:projectId/deliverables`). Specific endpoints handle project import workflows and home page data aggregation.

### Project Creation Wizard

The project creation wizard (`/projects/new`) provides a 6-step flow:
1. **Project Basics** - Name, dates, template selection, and basic settings
2. **Work Breakdown** - Define deliverables and epics hierarchy
3. **Task Alignment** - Map imported tasks to epics (import mode only)
4. **Stage Configuration** - Set up workflow stages, tasks, and milestones
5. **Assignments & Roles** - Assign team members by role
6. **Review & Summary** - Preview all entities before creation

Task-Epic Alignment (step 3) features:
- Automatic epic matching via ID or fuzzy title matching during import
- Task tracking with `mappingStatus`: mapped, orphaned, manual, skipped
- Bulk and individual task-to-epic assignment controls
- Validation gate blocks advancement when per_epic tasks remain orphaned
- Non-import flows bypass validation and show informational message

Project creation uses orchestrated endpoint (`POST /api/projects/full-create`) that:
- Creates project and all entities in a single transaction
- Returns detailed CreationReport with per-entity success/failure tracking
- Supports partial failure with error details per entity

### Import/Export System

The import wizard (`/projects/import`) supports multi-format imports (JSON, Excel/CSV, YAML) with a 6-step workflow:
1. **Upload File** - File selection with format auto-detection
2. **Entity Mapping** - Map source fields to target schema
3. **User Mapping** - Map source users to existing system users
4. **Status Mapping** - Map source statuses to system statuses
5. **Preview & Import** - Review data before import
6. **Results** - View import summary with per-entity breakdowns and error details

Key import features:
- **Nested Nexus export format support**: Automatically detects and flattens hierarchical exports where Projects contain Deliverables, Deliverables contain Epics, and Epics contain Tasks
- Array field normalization for `stageIds` and `tags` (handles strings, JSON strings, native arrays)
- Foreign key validation with fallback chains (e.g., ownerId → defaults.ownerId → first user)
- External source tracking via `externalRefs` metadata arrays
- Task-Epic alignment via `import-to-wizard-adapter.ts` with fuzzy matching
- ID relationship preservation during flattening (epicId, deliverableId, projectId)

### File Structure

The codebase is structured feature-first. The `client/src/` directory contains global UI components (`components/`), React contexts (`context/`), feature-specific components and logic (`features/`), custom hooks (`hooks/`), utilities (`lib/`), and page-level components (`pages/`). The `server/` directory organizes Express application setup, API routes, database connection, and data access layers. Shared types are defined in `shared/schema.ts`.

## External Dependencies

### Database

- **PostgreSQL**: Primary data store.
- **Drizzle ORM**: For database schema management and interaction.

### UI Libraries

- **Radix UI**: Provides accessible and unstyled UI primitives.
- **dnd-kit**: Enables drag-and-drop interactions.
- **Lucide React**: Icon library.
- **date-fns**: Utility library for date manipulation.

### Data Processing

- **xlsx**: Used for parsing Excel files during import/export.
- **js-yaml**: For processing YAML configurations.
- **file-saver**: Facilitates client-side file downloads.
- **zod**: Utilized for API input validation.

### Fonts

- **Google Fonts**: Montserrat and Raleway are used for typography.