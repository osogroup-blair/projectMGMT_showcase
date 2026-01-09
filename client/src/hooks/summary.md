# Hooks Directory

## Purpose
Contains custom React hooks for shared functionality across components.

## Files

- **use-toast.ts** - Toast notification hook (integrates with shadcn/ui toaster)
- **use-mobile.tsx** - Mobile/responsive breakpoint detection hook
- **use-nexus-data.ts** - Data fetching hooks for all domain entities (projects, tasks, milestones, etc.)

## Usage
Import hooks using the `@/hooks/` alias:
```tsx
import { useToast } from "@/hooks/use-toast";
import { useTasks, useProject, useMilestones } from "@/hooks/use-nexus-data";
```

## Adding New Hooks
1. Follow the `use-` naming convention
2. Keep hooks focused on a single concern
3. For data fetching, add to `use-nexus-data.ts` or create a new file for complex domains
