# Nymbl Workspace

## Overview

Nymbl Workspace is an AI-powered project management platform for service delivery organizations, offering comprehensive project lifecycle management. It includes configurable frameworks, hierarchical work breakdown structures (Projects → Deliverables → Epics → Tasks), milestone tracking, and team management. Key capabilities feature customizable views (Kanban, Table, Timeline), stage-based workflows, advanced import/export, and sprint planning. The platform aims to enhance usability and efficiency in project management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

The frontend is built with React 18 and TypeScript, using Wouter for routing and TanStack Query for server state management. UI components leverage shadcn/ui (based on Radix UI primitives), styled with Tailwind CSS v4, and bundled with Vite.

### Backend

The backend is developed with Node.js and Express in TypeScript, providing RESTful API endpoints. Data is persisted in PostgreSQL using Drizzle ORM, with a shared schema definition (`shared/schema.ts`).

### Data Model

The core data model is hierarchical, comprising Projects, Deliverables, Epics, Tasks, Milestones, Stages, and Sprints. It also includes Users, Roles, Assignments, Views, Guidance Items, and various template types, alongside User Preferences, Work Blocks, and Day Plans for personalized planning.

### Authentication and Authorization

The platform uses OpenID Connect for authentication with two optional SSO providers:
-   **Microsoft SSO** (Azure AD / Entra ID): Configured via `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID` environment variables
-   **Google OAuth**: Configured via `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` environment variables
-   **Demo Login**: Users can log in without credentials when demo data is generated

Authentication modules are located in `server/replit_integrations/auth/`:
-   `sessionAuth.ts`: Session management with PostgreSQL session store
-   `microsoftAuth.ts`: Microsoft SSO using openid-client
-   `googleAuth.ts`: Google OAuth using openid-client
-   `routes.ts`: Auth routes including demo login and impersonation

#### SSO Identity Linking Pattern

When users sign in via SSO (Google or Microsoft), the system follows a specific pattern to preserve user data while capturing SSO claims:

1. **User Record Behavior**:
   - If the user already exists (matched by email), their `firstName`, `lastName`, and `name` are **never overwritten** by SSO claims
   - Only truly new users get their names populated from SSO claims
   - The SSO provider ID (googleId/microsoftId) is linked to the user for future logins
   - Profile image is only updated if the user doesn't already have one

2. **Identity Records**:
   - All SSO claim data is stored in the `user_identities` table instead of overwriting user fields
   - Each SSO login creates/updates an identity record with `systemId` set to "google" or "microsoft"
   - The identity record captures: `externalUserId`, `externalEmail`, `profile.displayName`, `profile.avatarUrl`, auth scopes, and sync status
   - This allows users to link multiple external accounts and preserves the SSO-provided data

3. **Pattern for Future Integrations**:
   - When adding new external system integrations (e.g., Jira, ClickUp, Asana), follow this same pattern
   - Create identity records with `systemType: "integration"` or appropriate type
   - Store external claims in identity records rather than overwriting user profile data
   - Use `workspaceId` to track the external workspace/organization
   - Set `syncSourceOfTruth` to indicate which system owns the data

Role-Based Access Control (RBAC) is implemented with database-driven roles and permissions:

-   **System Roles**: 5 built-in roles (admin, manager, member, viewer, demo) stored in `system_roles` table
-   **Permissions**: 13 permissions across 4 categories (User Management, Admin Access, Projects, Data Management) stored in `system_permissions` table
-   **Role-Permission Mappings**: Stored in `role_permissions` table, configurable via Admin > App Defaults > Roles & Permissions
-   **User Permissions**: Users inherit permissions from their role, plus any additional permissions granted directly via `permissions` array
-   **Enforcement**: `AuthGuard` components on frontend, `requirePermission` middleware on backend reads from database

Admins and demo users can impersonate other users. Core entities track `createdBy`, `updatedBy`, `createdAt`, and `updatedAt` for audit logging.

### Deployment

Two deployment options are documented in `DEPLOYMENT.md`:
-   **Local Setup**: Using `setup.sh` script with local PostgreSQL
-   **Docker Compose**: Containerized deployment with included PostgreSQL

### API Structure

The API uses a modular route architecture organized by domain (e.g., `admin`, `projects`, `tasks`, `users`, `templates`, `sprints`, `config`, `import-export`, `schedule-sync`) in `server/api/routes/`. Each module registers its routes with the Express application.

### Data Layer

A repository pattern is used in `server/data/repositories/` for data access, with specific repositories for entities like `user`, `task`, `milestone`, and `sprint`.

### Key Features

-   **Project Creation Wizard**: A 6-step guided flow for creating projects, defining work breakdown, configuring stages, assigning teams, and reviewing. Supports importing tasks with automatic epic matching.
-   **Sample Data Generation**: An admin feature to generate test data for a Website Redesign project, available in `/admin/import-export` under the "Sample Data" tab.
-   **Demo Data Generation**: Creates realistic multi-project demo scenarios with 5 demo users, a Delivery Framework, and 3 projects at different completion stages (CRM System ~60%, Task Management App ~30%, Time Entry System ~10%). Demo users are named by role (Demo Solution Consultant, Demo Product Designer, Demo Developer Lead, Demo QA Engineer, Demo Documentation Manager). Available in `/admin/import-export` under the "Demo Data" tab.
-   **Data Viewer**: A JSON viewer at `/admin/data-viewer` to inspect generated project data structure including hierarchical views of projects, deliverables, epics, and tasks.
-   **Import/Export System**: Supports multi-format (JSON, Excel/CSV, YAML) import with a 6-step wizard for file upload, entity/user/status mapping, preview, and results. Features nested Nexus export format support, array field normalization, and foreign key validation. Includes automatic **Reference Resolution** that handles name-based references from external systems (like ClickUp exports) where entities are referenced by name instead of UUID. The reference resolver uses multi-strategy matching (exact ID → exact name → partial name → fuzzy match) with confidence scoring and displays resolution statistics in the import summary.
-   **Homepage Current Projects Kanban**: An interactive Kanban board on the homepage displaying tasks for projects with user involvement, supporting filtering by Assignee, Epic, Milestone, and Sprint.
-   **Identity Linking System**: Allows users to link multiple external accounts (e.g., ClickUp, Jira, Asana, Google) to their Nymbl profile, managed via the profile page or by administrators. Supports user merging.
-   **Milestone Template Scope Rules**: Milestone templates support rule-based scoping to automatically match tasks when applied to projects. Rules can filter by stage, epic type, and task template. Scope rules are defined in framework editor and stored in `defaultScopeRules` JSONB field with typed `MilestoneScopeRule` interface.
-   **Theme Manager**: A comprehensive theming system available at `/admin/theme` for workspace customization. Features include:
    - Color token editor with HSL-based semantic tokens matching shadcn/ui conventions
    - Live preview panel with light/dark mode toggle
    - Theme versioning with change notes and rollback capability
    - JSON import/export for sharing themes across workspaces
    - WCAG contrast validation for accessibility compliance
    - Publish workflow to activate themes for all users
    - Runtime theme application via CSS variables through `ThemeProvider` context

### File Structure

The codebase follows a feature-first structure. The `client/src/` directory contains global components, contexts, feature-specific modules, hooks, utilities, and pages. The `server/` directory organizes Express setup, API routes, and data access. Shared types are in `shared/schema.ts`. Large components are being decomposed into modular feature folders (e.g., `sprints/detail/`, `import-export/`) using custom hooks for data and actions, and reusable UI components.

## External Dependencies

### Database

-   **PostgreSQL**: Primary relational database.
-   **Drizzle ORM**: Object-relational mapper for database interaction.

### UI Libraries

-   **Radix UI**: Provides accessible and unstyled UI primitives.
-   **dnd-kit**: Drag-and-drop library.
-   **Lucide React**: Icon library.
-   **date-fns**: Date utility library.

### Data Processing

-   **xlsx**: Used for Excel file parsing.
-   **js-yaml**: For YAML configuration processing.
-   **file-saver**: Client-side file download utility.
-   **zod**: Schema declaration and validation library.

### Fonts

-   **Google Fonts**: Montserrat and Raleway for typography.