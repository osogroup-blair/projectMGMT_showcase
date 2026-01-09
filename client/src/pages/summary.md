# Pages Directory

## Overview
This directory contains route-level page components registered in `App.tsx`. Pages are the top-level entry points for different routes in the application.

## Architecture Pattern

### Hub Pages (Folder-Based)
Hub pages are consolidated containers that provide tabbed navigation to multiple views:

- `home/index.tsx` - Home page hub (/)
- `project/index.tsx` - Project workspace hub (/projects/:projectId) with tabs: Dashboard, Tasks, Deliverables, Timeline, Milestones, Stages, Sprints
- `project-new/index.tsx` - New project wizard (/projects/new)
- `project-tools/index.tsx` - Import/export tools hub (/project-tools) with tabs: Import, Export
- `admin/index.tsx` - Admin hub (/admin) with sections: Users, Templates, App Defaults, Import/Export
- `not-found/index.tsx` - 404 page

### Full-Featured Standalone Pages
These pages provide complete functionality beyond what hub tabs offer:

- `task-board.tsx` - Full task board with Kanban view, filtering, drag-and-drop
- `milestones-management.tsx` - Complete milestone management with scope rules
- `sprint-list.tsx` - Sprint list with lifecycle management
- `stage-designer.tsx` - Stage workflow designer
- `projects-list.tsx` - Projects listing page

### Detail Pages (Drill-down views)
These provide deep-linking to specific entities:

- `deliverable-detail.tsx` - Single deliverable view
- `epic-detail.tsx` - Single epic view  
- `milestone-overview.tsx` - Single milestone view
- `sprint-detail.tsx` - Single sprint view
- `task-detail.tsx` - Single task view
- `stage-workspace.tsx` - Stage workspace view
- `stage-view-settings.tsx` - Stage view configuration

### Configuration Pages
Project-level configuration that may be accessed from the hub:

- `project-settings.tsx` - Project settings
- `project-management.tsx` - Project management controls
- `project-team.tsx` - Team management
- `project-roles.tsx` - Role configuration
- `role-assignments.tsx` - Role assignments
- `saved-views.tsx` - Saved views gallery

### Import/Export Pages
Multi-step wizard flows:

- `project-import.tsx` - Import wizard step 1 (file upload)
- `project-import-mapping.tsx` - Import wizard step 2 (field mapping)
- `project-import-preview.tsx` - Import wizard step 3 (preview)
- `project-export.tsx` - Export functionality

## Routing

All routes are defined in `App.tsx`. The pattern follows:
- `/` - Home hub
- `/projects` - Projects list
- `/projects/new` - New project wizard
- `/projects/:projectId` - Project workspace hub
- `/projects/:projectId/*` - Project sub-pages and details
- `/project-tools` - Import/export hub
- `/admin` - Admin hub
- `/admin/:section` - Admin sub-sections

## Adding New Pages

1. **For hub pages**: Create a folder with `index.tsx` that uses tabs for internal navigation
2. **For detail pages**: Create a standalone `.tsx` file with the entity name
3. **For feature content**: Put components in `@/features/<feature>/`, pages should import from features
4. Register the route in `App.tsx`
