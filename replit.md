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

The platform uses Replit Auth with OpenID Connect for authentication (supporting Google, GitHub, Apple, email). Role-Based Access Control (RBAC) is implemented with `systemRole` and granular `permissions` arrays, enforced by `AuthGuard` components and API middleware. Admins and demo users can impersonate other users. Core entities track `createdBy`, `updatedBy`, `createdAt`, and `updatedAt` for audit logging.

### API Structure

The API uses a modular route architecture organized by domain (e.g., `admin`, `projects`, `tasks`, `users`, `templates`, `sprints`, `config`, `import-export`, `schedule-sync`) in `server/api/routes/`. Each module registers its routes with the Express application.

### Data Layer

A repository pattern is used in `server/data/repositories/` for data access, with specific repositories for entities like `user`, `task`, `milestone`, and `sprint`.

### Key Features

-   **Project Creation Wizard**: A 6-step guided flow for creating projects, defining work breakdown, configuring stages, assigning teams, and reviewing. Supports importing tasks with automatic epic matching.
-   **Sample Data Generation**: An admin feature to generate comprehensive test data including projects, deliverables, epics, tasks, stages, and templates.
-   **Import/Export System**: Supports multi-format (JSON, Excel/CSV, YAML) import with a 6-step wizard for file upload, entity/user/status mapping, preview, and results. Features nested Nexus export format support, array field normalization, and foreign key validation.
-   **Homepage Current Projects Kanban**: An interactive Kanban board on the homepage displaying tasks for projects with user involvement, supporting filtering by Assignee, Epic, Milestone, and Sprint.
-   **Identity Linking System**: Allows users to link multiple external accounts (e.g., ClickUp, Jira, Asana, Google) to their Nymbl profile, managed via the profile page or by administrators. Supports user merging.

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