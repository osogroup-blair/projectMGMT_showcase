# Home Feature

## Purpose
Contains all components and types for the user's home/dashboard page, including task management, work planning, and project overview panels.

## Structure

```
home/
├── panels/                    # UI panels for the home page
│   ├── current-projects-panel.tsx   # Active projects overview
│   ├── daily-calendar.tsx           # Daily schedule view
│   ├── task-card.tsx                # Task display card (home-specific)
│   ├── today-tasks-panel.tsx        # Today's tasks list
│   ├── upcoming-milestones-panel.tsx # Upcoming milestones
│   ├── user-home-page.tsx           # Main home page component
│   ├── week-planner.tsx             # Weekly planning view
│   └── work-block-card.tsx          # Work block display
├── types.ts                   # Home-specific types (HomeTask, WorkBlock, DayPlan, etc.)
└── summary.md
```

## Key Types (in types.ts)
- `HomeTask` - Task representation for home page display
- `WorkBlock` - Time-boxed work session
- `DayPlan` - Daily planning container
- `HomeMilestoneSummary` - Milestone preview for home page
- `UserHomeState` - Complete home page state

## Usage
The home page (`pages/home/index.tsx`) uses `UserHomePage` as its main component, which orchestrates all the panels and drag-and-drop functionality for task planning.

## Adding New Components
1. Add panel components to `panels/`
2. Add shared types to `types.ts`
3. Wire new panels into `user-home-page.tsx`
