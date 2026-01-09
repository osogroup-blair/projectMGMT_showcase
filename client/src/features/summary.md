# Features Directory

## Overview
This directory contains feature-organized domain components. Each feature folder contains components, hooks, and utilities specific to that feature domain.

## Structure

### `home/`
Components for the home page experience:
- `panels/` - Dashboard panels (tasks, milestones, projects)
- `planner/` - Day planning functionality

### `project/`
Project workspace components:
- `dashboard/` - Project dashboard views
- `stages/` - Stage management components
- `sprints/` - Sprint management components
- `milestones/` - Milestone components
- `tasks/` - Task list and filtering
- `timeline/` - Unified timeline visualization

### `tasks/`
Shared task components used across features:
- `task-card.tsx` - Reusable task card component

### `templates/`
Template management components:
- `stage-template-editor.tsx` - Stage template designer

### `admin/`
Admin-specific feature components.

## Guidelines

1. **Feature ownership**: Components should live in the feature that owns them
2. **Cross-feature sharing**: If a component is used by multiple features, consider:
   - Moving to `components/` for UI primitives
   - Creating a shared feature (e.g., `tasks/` for task-related components)
3. **Naming**: Use descriptive names that reflect purpose, not implementation
4. **Exports**: Each feature folder should have clear exports for its public API
