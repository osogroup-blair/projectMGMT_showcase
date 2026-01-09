# Nymbl Workspace

## Overview

Nymbl Workspace is an AI-powered project management platform designed for service delivery organizations. It provides comprehensive project lifecycle management with features including:

- **Project Management**: Create, track, and manage projects with configurable frameworks and stages
- **Work Breakdown Structure**: Hierarchical organization with Projects → Deliverables → Epics → Tasks
- **Milestone Tracking**: Define milestones with scope rules and task linking
- **Team & Role Management**: Configure project roles, permissions, and team assignments
- **Import/Export**: Excel-based data import with field mapping and round-trip export capabilities
- **Customizable Views**: Saved views with configurable layouts (Kanban, Table, Timeline)
- **Stage-based Workflow**: Configurable delivery stages with entry/exit criteria
- **Unified Timeline**: Interactive visualization showing Sprints, Milestones, Stages, and Deliverables/Epics with layer toggles, accordion patterns, and multiple view modes (day/week/month/quarter/year)
- **Sprint Planning**: Sprint detail page with Plan/Run/Insights/Settings tabs, including scope definition with sync indicators

## Recent Changes

### Architecture Refactoring (January 2026)
A refactor_workspace folder contains the work-in-progress restructured codebase:

**Server Reorganization:**
- `server/app/` - Main Express server entry (index.ts, vite.ts, static.ts)
- `server/api/` - API route definitions
- `server/db/` - Database connection and seed
- `server/data/` - Storage layer

**Client Feature-First Structure:**
- `client/src/features/` - Feature-organized components
- `client/src/context/` - React contexts (renamed from contexts)
- **AdminHub pattern** - Consolidated admin pages (users, templates, defaults, import-export) into single tabbed interface at `/admin` and `/admin/:section`

**Hub Page Pattern:**
- AdminHub supports both path-based (`/admin/templates`) and query-based (`/admin?tab=templates`) routing
- Individual admin pages support `embedded` prop for use within hub or standalone
- ProjectOverview already uses similar tabbed hub pattern for project content

### Sprint Plan Tab Redesign (January 2026)
- Added sub-navigation within Plan tab: **Tasks** and **Scope Definition** sub-tabs
- Tasks sub-tab: Sprint Goal card, Sprint Backlog table with add/remove tasks, Linked Entities (derived from sprint tasks' epics/milestones), sidebar cards (Dates, Capacity, Progress)
- Scope Definition sub-tab: Scope mode toggle (Epics/Milestones/Stages), searchable entity multi-select, scope sync indicator showing tasks matching scope vs in sprint with "Sync All to Sprint" button, inline Suggested Tasks panel with bulk selection
- Pattern matches Milestone page sub-navigation for UI consistency

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack Query for server state, React hooks for local state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **Build Tool**: Vite with custom plugins for Replit deployment

### Backend Architecture

- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful endpoints under `/api/*`
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between frontend and backend)

### Data Model

The core domain entities follow a hierarchical structure:

1. **Projects** - Top-level container with framework assignment
2. **Deliverables** - Major outcomes within a project
3. **Epics** - Work groupings within deliverables
4. **Tasks** - Individual work items within epics
5. **Milestones** - Key dates with scope rules linking to tasks
6. **Stages** - Workflow phases that epics/tasks progress through
7. **Sprints** - Time-boxed iterations with lifecycle (Planned → Active → Closed) and capacity tracking

Supporting entities include Users, Roles, Assignments, Views, Guidance Items, and various template types for reusability.

8. **User Preferences** - User settings for work hours, timezone, and display preferences
9. **Work Blocks** - Time-boxed work sessions for daily planning (start/end time, assigned tasks)
10. **Day Plans** - Daily planning container with work blocks and unassigned tasks

### API Structure

All API routes follow the pattern:
- `/api/projects` - Project CRUD
- `/api/projects/:projectId/deliverables` - Nested resources
- `/api/projects/:projectId/tasks` - Task management
- `/api/projects/:projectId/milestones` - Milestone tracking
- `/api/projects/:projectId/sprints` - Sprint management per project
- `/api/sprints` - Sprint CRUD, `/api/sprints/:id/start`, `/api/sprints/:id/close` for lifecycle
- `/api/project-import/*` - Import workflow endpoints
- `/api/users` - User management
- `/api/users/:userId/preferences` - User preferences (work hours, timezone)
- `/api/users/:userId/workblocks` - Work blocks for daily planning
- `/api/users/:userId/dayplan` - Day plan management
- `/api/home/tasks/:userId` - User's tasks for home page
- `/api/home/milestones` - Upcoming milestones for home page
- `/api/home/projects` - Active projects summary for home page
- `/api/seed` - Development database seeding

### File Structure

```
client/src/
├── components/     # Shared UI components (shadcn/ui, layout)
│   ├── layout/     # Shell, navigation components
│   └── ui/         # shadcn/ui primitives (button, card, dialog, etc.)
├── features/       # Feature-organized domain components
│   ├── admin/      # Admin hub components
│   ├── home/       # Home page panels (user-home-page, task-card, etc.)
│   │   └── panels/
│   ├── project/    # Project-related features
│   │   ├── dashboard/    # Project dashboard
│   │   ├── milestones/   # Milestones content
│   │   ├── sprints/      # Sprints content
│   │   ├── stages/       # Stages content
│   │   ├── tasks/        # Task list, filter modal
│   │   └── timeline/     # Unified timeline visualization
│   │       └── unified-timeline/
│   │           └── layers/
│   ├── tasks/      # Shared task components
│   └── templates/  # Template components
├── hooks/          # Custom React hooks
├── lib/            # Utilities and mock data
├── pages/          # Route components
│   ├── admin/      # Admin pages (AdminHub, user-management, templates, etc.)
│   └── ...         # Other page components
└── types/          # TypeScript type definitions

server/
├── index.ts        # Express server entry
├── routes.ts       # API route definitions
├── storage.ts      # Database operations
├── db.ts           # Database connection
└── seed.ts         # Development data seeding

shared/
└── schema.ts       # Drizzle schema (shared types)
```

## External Dependencies

### Database

- **PostgreSQL**: Primary data store via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema management and migrations (`drizzle-kit push` for schema sync)

### UI Libraries

- **Radix UI**: Accessible component primitives (dialogs, dropdowns, forms)
- **dnd-kit**: Drag and drop functionality for reordering
- **Lucide React**: Icon library
- **date-fns**: Date manipulation utilities

### Data Processing

- **xlsx**: Excel file parsing for import/export functionality
- **js-yaml**: YAML processing for configuration export
- **file-saver**: Client-side file downloads
- **zod**: Schema validation for API inputs

### Fonts

- **Google Fonts**: Montserrat (headings) and Raleway (body text)