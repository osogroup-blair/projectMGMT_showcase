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

### Architecture Refactoring Complete (January 2026)
The codebase has been restructured to follow a feature-first pattern:

**Server Reorganization (Complete):**
- `server/app/` - Main Express server entry (index.ts, vite.ts, static.ts)
- `server/api/` - API route definitions
- `server/db/` - Database connection and seed
- `server/data/` - Storage layer

**Client Feature-First Structure (Complete):**
- `client/src/features/` - Feature-organized components (home, project, tasks, templates, admin)
- `client/src/context/` - React contexts (renamed from contexts)
- `client/src/components/` - Global UI primitives (ui/, layout/) only

**Hub Page Pattern:**
- Folder-based page structure: `pages/home/`, `pages/project/`, `pages/project-new/`, `pages/project-tools/`, `pages/admin/`, `pages/not-found/`
- AdminHub: Tabbed interface for Users, Templates, App Defaults, Import/Export at `/admin`
- ProjectOverview: Tabbed hub for project content (Dashboard, Tasks, Deliverables, Timeline, Milestones, Stages, Sprints)
- ProjectTools: New hub for import/export functionality at `/project-tools`

### Project Wizard Redesign (January 2026)
Redesigned project creation wizard from 6 steps to 5 steps with improved templating workflow:

**New 5-Step Flow:**
1. **Project Basics** - Name, description, client, dates, sprint duration, owner (removed framework selection)
2. **Work Breakdown** - Deliverables and Epics editor with keyboard shortcuts (Enter to add rows, Backspace on empty to remove)
3. **Stage Configuration** - Main tabs for Stages and Milestones (both in accordions), with "Apply Framework" side panel for loading pre-configured frameworks
4. **Assignments & Roles** - Role-based team assignments with eligibility filtering showing eligible user count per role
5. **Review & Summary** - Enhanced preview with task count breakdown (ONCE vs PER_EPIC calculations), warnings for large projects (>100 tasks)

**Key Features:**
- Task drafts have scope: `once` (project-wide) vs `per_epic` (replicated per epic)
- Role types filter which users are eligible for each role
- Frameworks bundle stages/tasks for quick application via side panel
- Milestones configured by scope rules (stage/deliverable/epic/all) with completion modes (all tasks or percentage)
- Batched project creation with single summary notification

### Sprint Plan Tab Redesign (January 2026)
- Added sub-navigation within Plan tab: **Tasks** and **Scope Definition** sub-tabs
- Tasks sub-tab: Sprint Goal card, Sprint Backlog table with add/remove tasks, Linked Entities (derived from sprint tasks' epics/milestones), sidebar cards (Dates, Capacity, Progress)
- Scope Definition sub-tab: Scope mode toggle (Epics/Milestones/Stages), searchable entity multi-select, scope sync indicator showing tasks matching scope vs in sprint with "Sync All to Sprint" button, inline Suggested Tasks panel with bulk selection
- Pattern matches Milestone page sub-navigation for UI consistency

### Sprint Run Tab Refactor (January 2026)
Two-pane layout (65/35 split) for active sprint execution:
- **FlowBoard** (left pane): Drag-and-drop kanban with 4 columns (To Do, In Progress, Blocked, Done)
  - Visual indicators for overdue (red) and stale (yellow) tasks
  - Blocker workflow: Moving to Blocked column triggers BlockerReasonDialog requiring a reason
  - Uses dnd-kit for smooth drag-and-drop interactions
- **PulsePanel** (right pane): Sprint Signals and async standup feed
  - Sprint Signals: Real-time counts for blocked, overdue, and stale tasks (3+ days inactive)
  - PulseComposer: Structured daily updates with "did/next/blockers" prompts
  - Auto-suggestions based on recent task activity for quick standup entries
- Database: `sprintPulseUpdates` table for standup entries, `blockerReason` field on tasks

### Dashboard Tab Improvements (January 2026)
- Removed SummaryBar from project-scoped dashboard (metrics were duplicated in summary cards)
- Moved filter controls (time range, assignee scope) to the project tab row when Overview is active
- DashboardFilterControls exported as reusable component
- TimeHorizonDashboard accepts external filters for controlled state from parent components

### Task Detail Page Restructure (January 2026)
Modular folder structure at `pages/task-detail/`:
- **index.tsx** - Main container with header (editable title, badges), 4-tab layout, sidebar with property selects (Task Type, Status, Stage, Epic, Assignee, Priority, Effort, Due Date, Milestone, Estimate)
- **task-overview-tab.tsx** - Description editing
- **task-dependencies-tab.tsx** - Enhanced dependency linking with 3 modes:
  - **Manual Selection**: Searchable/filterable task list with checkboxes
  - **Coverage Matrix**: Epic × Stage grid showing linked/total counts per cell, click cells to bulk toggle
  - **Rule-Based**: Configurable auto-suggestion rules (by stage, epic) with "Apply Rules" button
- **task-subtasks-tab.tsx** - Subtask list with progress, add/complete/toggle functionality
- **task-activity-tab.tsx** - Comments, attachments, history sub-tabs

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
├── components/     # Global UI components only
│   ├── layout/     # Shell, navigation components
│   └── ui/         # shadcn/ui primitives (button, card, dialog, etc.)
├── context/        # React context providers
│   └── current-user-context.tsx
├── features/       # Feature-organized domain components (includes types)
│   ├── admin/      # Admin hub components
│   ├── home/       # Home page panels + types.ts
│   │   ├── panels/
│   │   └── types.ts    # HomeTask, WorkBlock, DayPlan, etc.
│   ├── project/    # Project-related features
│   │   ├── dashboard/    # Project dashboard + types.ts
│   │   ├── milestones/   # Milestones content
│   │   ├── sprints/      # Sprints content
│   │   ├── stages/       # Stages content
│   │   ├── tasks/        # Task list, filter modal
│   │   └── timeline/     # Unified timeline visualization
│   ├── tasks/      # Shared task components (task-card)
│   └── templates/  # Template components (stage-template-editor)
├── hooks/          # Custom React hooks
├── lib/            # Utilities and mock data
└── pages/          # Route components (folder-based structure)
    ├── home/       # Home page hub
    ├── project/    # Project workspace hub
    ├── project-new/    # New project wizard
    ├── project-tools/  # Import/export hub
    ├── admin/      # Admin hub
    └── not-found/  # 404 page

server/
├── index.ts        # Express server entry point
├── app/            # Express app setup
│   ├── index.ts    # Main Express app
│   ├── vite.ts     # Vite dev server
│   └── static.ts   # Production static serving
├── api/            # API route definitions
│   └── index.ts
├── db/             # Database connection
│   ├── index.ts
│   └── seed.ts
└── data/           # Data access layer
    └── storage.ts

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