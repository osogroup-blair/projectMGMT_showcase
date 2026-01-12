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
- `systemRole` field: 'admin' | 'manager' | 'member' | 'viewer' | 'demo' (default: 'member')
- `permissions` array: Granular permission strings
- `AuthGuard` component accepts `requiredRoles` and `requiredPermissions` props
- Permission middleware in `server/middleware/require-permission.ts` enforces route-level access control
- Admin pages (`/admin/*`) protected with AuthGuard requiring admin or manager roles
- **Demo role**: Can impersonate users (like admin) but cannot access admin pages or other admin-only features

**Audit Logging:**
- Core entities (projects, deliverables, epics, tasks, milestones, sprints) track `createdBy`, `updatedBy`, `createdAt`, and `updatedAt` fields
- API routes automatically populate `createdBy` and `updatedBy` from the authenticated session user
- Helper function `getAuthUserId(req)` extracts user ID from `req.user.claims.sub`

**Admin Impersonation:**
- Allows admins and demo users to view the platform as any other user
- API endpoints: `POST /api/admin/impersonate/:userId` and `POST /api/admin/stop-impersonate`
- Session stores `impersonatedUserId` for the duration of the impersonation
- `/api/auth/user` returns impersonated user data with `isImpersonating: true` and `realUser` object containing admin's info
- UI: Dropdown on right side of breadcrumb nav (visible to admins and demo users via `canImpersonate` flag)
- Visual indicator: Amber banner showing "Viewing as: [user name]" when impersonating
- Key files: `server/replit_integrations/auth/routes.ts`, `client/src/hooks/use-auth.ts`, `client/src/components/layout/breadcrumb-nav.tsx`

**User Management Architecture:**
- Contracts: `shared/contracts/user-management.ts` defines request/response schemas and permission constants
- Services: `server/services/user-management/` contains business logic (list, get, create, update, deactivate)
- Client hooks: `client/src/features/user-management/hooks/use-users-api.ts` provides TanStack Query hooks
- Admin page: `client/src/pages/admin/user-management.tsx` protected by AuthGuard requiring admin or manager role
- API response format: `/api/users` returns `{ users: [...], total: number }` for pagination support

### API Structure (Modularized)

The API layer uses a modular route architecture for maintainability. Routes are organized by domain in `server/api/routes/`:

| Module | Endpoints | Description |
|--------|-----------|-------------|
| `admin.ts` | `/api/seed`, `/api/admin/sample-data/*` | Database seeding and sample data |
| `projects.ts` | `/api/projects/*`, deliverables, epics | Core project hierarchy CRUD |
| `tasks.ts` | `/api/tasks/*`, dependencies | Task management |
| `milestones.ts` | `/api/milestones/*`, scope rules, task links | Milestone tracking |
| `users.ts` | `/api/users/*`, identities, preferences | User management |
| `templates.ts` | `/api/*Templates`, snippets | Template CRUD |
| `sprints.ts` | `/api/sprints/*`, members, scope, pulse | Sprint planning |
| `config.ts` | `/api/statusOptions`, roleTypes, taskTypes | System configuration |
| `import-export.ts` | `/api/imports`, `/api/export/*` | Bulk data operations |
| `schedule-sync.ts` | `/api/schedule-sync/*` | Date synchronization |

Each module exports a `register*Routes(app, getAuthUserId)` function called from `server/api/index.ts`.

### Data Layer (Repository Pattern)

The data access layer uses the repository pattern in `server/data/repositories/`:

| Repository | Entities |
|------------|----------|
| `user-repository.ts` | Users, UserIdentities |
| `task-repository.ts` | Tasks, TaskDependencies |
| `milestone-repository.ts` | Milestones, ScopeRules, TaskLinks |
| `sprint-repository.ts` | Sprints, Members, ScopeEvents, PulseUpdates |

The `DatabaseStorage` class in `storage.ts` composes these repositories while maintaining the `IStorage` interface for backwards compatibility.

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

### Homepage Current Projects Kanban

The Homepage (`/`) Current Projects tab displays an interactive Kanban board for each project where the current user has active tasks:
- **Kanban View**: Tasks displayed in draggable columns by status (Todo, In Progress, Done, etc.)
- **Filter Support**: Filter tasks by Assignee, Epic, Milestone, and Sprint
- **PortableKanban Component**: Reusable Kanban component (`client/src/components/kanban/portable-kanban.tsx`) with built-in filtering
- **Data Hooks**: Uses `useSprints`, `useMilestones`, `useUsers` from `client/src/hooks/use-nexus-data.ts`

### Identity Linking System

The platform supports linking multiple external accounts to a single Nexus user profile:
- **User Identities Table**: `user_identities` stores external account connections with sync metadata
- **Supported Systems**: ClickUp, Jira, Asana, Monday, Trello, Google, Microsoft, Slack, GitHub, GitLab
- **Profile Page**: Users can manage their linked identities at `/profile`
- **Admin Management**: Admins can manage any user's identities via User Management (`/admin/users`)
- **User Merge**: Allows merging duplicate user accounts, transferring all identities to target user
- **Key Files**:
  - Contracts: `shared/contracts/user-identity.ts`
  - Service: `server/services/user-management/identity-service.ts`
  - Client hooks: `client/src/features/user-management/hooks/use-identity-api.ts`

### File Structure

The codebase is structured feature-first. The `client/src/` directory contains global UI components (`components/`), React contexts (`context/`), feature-specific components and logic (`features/`), custom hooks (`hooks/`), utilities (`lib/`), and page-level components (`pages/`). The `server/` directory organizes Express application setup, API routes, database connection, and data access layers. Shared types are defined in `shared/schema.ts`.

### Frontend Decomposition (In Progress)

Large page components are being decomposed into modular feature folders for maintainability:

**Sprint Detail Page** (`client/src/features/sprints/detail/`):
- `hooks/use-sprint-data.ts` - Data fetching, derived state, memoized selectors
- `hooks/use-sprint-actions.ts` - Business logic handlers (mutations, API calls)
- `components/` - SprintHeader, AddTasksDialog, CreateTaskDialog, BulkEditDialog
- `tabs/` - PlanTab (scope definition), RunTab (kanban + pulse), SettingsTab
- `types.ts` - Shared interfaces and config objects

**Import/Export Page** (`client/src/features/import-export/`):
- `hooks/use-export.ts` - Export state, format selection, nested/selective export, file generation
- `hooks/use-import.ts` - Import state, file parsing, nested JSON flattening, record processing
- `components/` - SampleDataCard, FormatCard, SchemaPreview, ImportDropzone, ExportOptions
- `container.tsx` - Orchestrates hooks and composes components
- `types.ts` - ImportState, ExportFormat, ExportTab, SchemaDefinition
- `constants.ts` - SCHEMA_DEFINITIONS, ENTITY_TO_COLLECTION, IMPORT_ORDER
- `utils.ts` - normalizeRecord, serialize, deserialize, flattenNestedImport

**Decomposition Pattern**:
1. Extract custom hooks for data (use*Data) and actions (use*Actions)
2. Break UI into reusable components and tab-level containers
3. Container component orchestrates state and composes child modules
4. Page component imports container, handles routing params

**Remaining Large Files** (candidates for future decomposition):
- `milestone-overview.tsx` (2,037 LOC)
- `user-management.tsx` (1,559 LOC)
- `deliverables.tsx` (1,504 LOC)
- `project/index.tsx` (1,496 LOC)

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