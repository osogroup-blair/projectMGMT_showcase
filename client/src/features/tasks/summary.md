# Tasks Feature

## Purpose
Contains shared task components used across multiple features (home, project, etc.). This provides a consistent task display pattern throughout the application.

## Structure

```
tasks/
├── task-card.tsx              # Reusable task card component
└── summary.md
```

## Key Components
- `TaskCard` - Displays a task with status, priority, due date, and quick actions

## Usage
Import and use in any feature that needs to display tasks:
```tsx
import { TaskCard } from "@/features/tasks/task-card";
```

## Relationship to Other Features
- `features/home/panels/task-card.tsx` - Home-specific task card with drag-and-drop
- `features/project/tasks/` - Project-scoped task management

## Adding New Components
Add shared task-related components here only if they're used by multiple features. Feature-specific task components should stay in their owning feature folder.
