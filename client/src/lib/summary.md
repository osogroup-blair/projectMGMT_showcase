# Lib Directory

## Purpose
Contains utility functions, configuration, and shared helper code used across the application.

## Files

- **queryClient.ts** - TanStack Query client configuration
- **storage.ts** - Client-side storage utilities
- **utils.ts** - General utility functions (cn for classNames, etc.)
- **mock-data.ts** - Mock data for development and testing

## Usage
Import utilities using the `@/lib/` alias:
```tsx
import { cn } from "@/lib/utils";
import { queryClient } from "@/lib/queryClient";
```

## Adding New Utilities
1. Add utility functions to `utils.ts` for general helpers
2. Create new files for domain-specific utilities
3. Keep files focused and single-purpose
