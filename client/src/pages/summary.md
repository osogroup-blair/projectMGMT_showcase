# Pages Directory

## Overview
This directory contains route-level page components that are registered in `App.tsx`. Pages are the top-level entry points for different routes in the application.

## Structure

### Folder-Based Pages (New Pattern)
- `home/` - Home page hub (/)
- `project/` - Project workspace hub (/projects/:projectId)
- `project-new/` - New project wizard (/projects/new)
- `project-tools/` - Import/export tools hub (/project-tools)
- `admin/` - Admin hub (/admin)
- `not-found/` - 404 page

### Detail Pages (Drill-down views)
- `deliverable-detail.tsx` - Single deliverable view
- `epic-detail.tsx` - Single epic view
- `milestone-overview.tsx` - Single milestone view
- `sprint-detail.tsx` - Single sprint view
- `task-detail.tsx` - Single task view
- `stage-workspace.tsx` - Stage workspace view

### Configuration Pages
- `project-settings.tsx` - Project settings
- `project-management.tsx` - Project management controls
- `project-team.tsx` - Team management
- `project-roles.tsx` - Role configuration
- `role-assignments.tsx` - Role assignments
- `saved-views.tsx` - Saved views gallery

## Adding New Pages

1. For new hub pages: Create a folder with `index.tsx`
2. For detail/drill-down pages: Create a standalone `.tsx` file
3. Register the route in `App.tsx`
4. Feature components should live in `@/features/<feature>/`, not in pages
