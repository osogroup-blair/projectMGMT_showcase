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
├── components/     # Reusable UI components
│   └── project/
│       └── unified-timeline/  # Timeline visualization component
│           ├── unified-timeline.tsx   # Main component
│           ├── timeline-header.tsx    # Controls (view mode, layers, navigation)
│           ├── timeline-axis.tsx      # Date axis with ticks
│           ├── timeline-grid.tsx      # Grid container for layers
│           ├── types.ts               # TypeScript interfaces
│           ├── timeline-utils.ts      # Date calculations and positioning
│           └── layers/                # Individual layer components
│               ├── sprints-layer.tsx
│               ├── milestones-layer.tsx
│               ├── stages-layer.tsx
│               └── deliverables-layer.tsx
├── hooks/          # Custom React hooks
├── lib/            # Utilities and mock data
├── pages/          # Route components
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