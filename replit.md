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

### API Structure

API routes are RESTful, organized logically around core entities (e.g., `/api/projects`, `/api/users`, `/api/sprints`) and nested resources (e.g., `/api/projects/:projectId/deliverables`). Specific endpoints handle project import workflows and home page data aggregation.

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