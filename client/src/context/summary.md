# Context Directory

## Overview
React Context providers for application-wide state management.

## Available Contexts

### `current-user-context.tsx`
Provides the current authenticated user throughout the app.

**Usage:**
```tsx
import { useCurrentUser } from "@/context/current-user-context";

function MyComponent() {
  const user = useCurrentUser();
  return <div>Hello, {user?.name}</div>;
}
```

## Guidelines

1. **Wrap at App level**: Contexts should be provided near the root in `App.tsx`
2. **Export hooks**: Always export a custom hook (e.g., `useCurrentUser`) alongside the context
3. **Type safety**: Define proper TypeScript types for context values
4. **Default values**: Provide sensible defaults or handle undefined states
