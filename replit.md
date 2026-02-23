# prodCo Workspace

## Overview
prodCo Workspace is an AI-powered project management platform designed for service delivery organizations. It offers a comprehensive suite of tools for managing the entire project lifecycle, including configurable frameworks, hierarchical work breakdown structures (Projects → Deliverables → Epics → Tasks), milestone tracking, and team management. Key capabilities include customizable views (Kanban, Table, Timeline), stage-based workflows, advanced import/export functionalities, and sprint planning. The platform's core purpose is to enhance usability and efficiency in project management processes.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend is built with React 18, TypeScript, Wouter for routing, and TanStack Query for server state management. UI components are developed using shadcn/ui (based on Radix UI primitives), styled with Tailwind CSS v4, and bundled with Vite.

### Backend
The backend utilizes Node.js and Express, written in TypeScript, to provide RESTful API endpoints. Data persistence is managed with PostgreSQL and Drizzle ORM.

### Data Model
The core data model is hierarchical, encompassing Projects, Deliverables, Epics, Tasks, Milestones, Stages, Sprints, Users, Roles, Assignments, Views, Guidance Items, and various template types. It also includes User Preferences, Work Blocks, and Day Plans.

### Authentication and Authorization
The platform uses OpenID Connect for authentication, supporting Microsoft SSO (Azure AD / Entra ID) and Google OAuth. A demo login option is also available. A key architectural decision is the SSO Identity Linking Pattern, where SSO claims are stored in `user_identities` to preserve user data and allow linking multiple external accounts without overwriting core user profile fields. Role-Based Access Control (RBAC) is implemented with database-driven roles and permissions, enforced via frontend `AuthGuard` components and backend `requirePermission` middleware.

### API Structure
The API employs a modular route architecture organized by domain (e.g., `admin`, `projects`, `tasks`) in `server/api/routes/`.

### Data Layer
A repository pattern is used in `server/data/repositories/` for data access.

### Key Features
-   **Project Creation Wizard**: A guided, multi-step flow for project setup, including work breakdown definition, stage configuration, team assignment, and review. It supports importing tasks and includes features like stage configuration with framework templates, "Management Activities" deliverable with protected epics, and task count badges.
-   **Sample and Demo Data Generation**: Administrative features to generate test data for project examples and realistic multi-project demo scenarios.
-   **Data Viewer**: An administrative JSON viewer for inspecting project data structures.
-   **Import/Export System**: Supports multi-format (JSON, Excel/CSV, YAML) import with a multi-step flow including team assignment, summary, and integration with the project wizard. Features automatic reference resolution with multi-strategy matching, a tabbed UI for reference mapping, a relationship preview, and comprehensive import validation with user-friendly error messages and a task-epic validation panel.
-   **Homepage Current Projects Kanban**: An interactive Kanban board for tasks on user-involved projects with filtering capabilities.
-   **Identity Linking System**: Allows users to link multiple external accounts to their profile.
-   **Milestone Template Scope Rules**: Rule-based scoping for milestone templates to automatically match tasks.
-   **Theme Management System**: Allows full theme customization, including creation, editing, publishing, and user-selection of themes with dark/light mode toggling.

### File Structure
The codebase follows a feature-first structure, with `client/src/` for frontend concerns and `server/` for backend. Shared types are in `shared/schema.ts`.

## External Dependencies

### Database
-   **PostgreSQL**: Primary relational database.
-   **Drizzle ORM**: Object-relational mapper.

### UI Libraries
-   **Radix UI**: Accessible and unstyled UI primitives.
-   **dnd-kit**: Drag-and-drop library.
-   **Lucide React**: Icon library.
-   **date-fns**: Date utility library.

### Data Processing
-   **xlsx**: Excel file parsing.
-   **js-yaml**: YAML configuration processing.
-   **file-saver**: Client-side file download utility.
-   **zod**: Schema declaration and validation library.

### Fonts
-   **Google Fonts**: Montserrat and Raleway.