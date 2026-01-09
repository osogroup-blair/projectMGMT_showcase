# Project Feature

## Purpose
Contains all components, views, and types for project management functionality. This is the largest feature module, covering the project workspace hub and all its sub-views.

## Structure

```
project/
├── dashboard/                 # Project dashboard/overview
│   ├── project-dashboard-page.tsx   # Main dashboard component
│   └── types.ts                     # Dashboard types (ProjectDashboard, StatusSnapshot, etc.)
├── milestones/                # Milestone management
│   └── milestones-content.tsx       # Milestones tab content
├── sprints/                   # Sprint management
│   └── sprints-content.tsx          # Sprints tab content
├── stages/                    # Stage/workflow management
│   ├── stage-tab-content.tsx        # Stage tab content
│   └── stages-content.tsx           # Stages list content
├── tasks/                     # Task management within projects
│   ├── task-filter-modal.tsx        # Task filtering modal
│   └── task-list-content.tsx        # Tasks tab content
├── timeline/                  # Unified timeline visualization
│   └── unified-timeline/            # Timeline components
│       ├── layers/                  # Timeline layer components
│       │   ├── deliverables-layer.tsx
│       │   ├── milestones-layer.tsx
│       │   ├── sprints-layer.tsx
│       │   └── stages-layer.tsx
│       ├── index.ts
│       ├── timeline-axis.tsx
│       ├── timeline-grid.tsx
│       ├── timeline-header.tsx
│       ├── timeline-utils.ts
│       ├── types.ts
│       └── unified-timeline.tsx
└── summary.md
```

## Key Components
- `ProjectDashboardPage` - Project health, metrics, and activity overview
- `MilestonesContent` - Milestone list and management
- `SprintsContent` - Sprint list and lifecycle management
- `StagesContent` - Stage workflow visualization
- `TaskListContent` - Project tasks with filtering
- `UnifiedTimeline` - Interactive timeline with multiple layers

## Usage
The project hub page (`pages/project/index.tsx`) renders these components based on the active tab (overview, tasks, deliverables, timeline, milestones, stages, sprints).

## Adding New Features
1. Create a new subfolder for the feature domain
2. Add types.ts if feature-specific types are needed
3. Wire the component into the project hub's tab system
