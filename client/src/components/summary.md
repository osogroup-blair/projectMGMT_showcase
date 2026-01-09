# Components Directory

## Overview
This directory contains global, reusable components that are NOT feature-specific.

## Structure

### `ui/`
Shadcn/UI primitives and base components:
- Button, Card, Dialog, Input, Select, etc.
- These are design system building blocks
- Should NOT contain business logic

### `layout/`
Application layout components:
- `shell.tsx` - Main app shell with sidebar/navigation
- `top-nav.tsx` - Top navigation bar
- `sidebar.tsx` - Sidebar navigation
- Other structural layout components

## Guidelines

1. **Global only**: Only components used across multiple features belong here
2. **Feature components**: Feature-specific components go in `@/features/<feature>/`
3. **No business logic**: These should be pure UI components
4. **Consistent patterns**: Follow existing shadcn/ui patterns for new primitives
5. **Documentation**: Complex components should have inline documentation

## Migration Note
Previously, `components/admin/` and `components/task/` existed here. These have been moved to:
- `features/templates/` - For template-related components
- `features/tasks/` - For task-related components
