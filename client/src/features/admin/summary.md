# Admin Feature

## Purpose
Contains components for administrative functions including user management, system configuration, and template administration.

## Structure

```
admin/
└── summary.md
```

## Current State
Admin components are currently located in `pages/admin/` as the admin hub page handles most functionality directly. As the admin feature grows, shared components should be moved here.

## Planned Components
- User management components
- System defaults editors
- Import/export administration
- Template management (currently in `features/templates/`)

## Usage
The admin hub page (`pages/admin/index.tsx`) provides the main interface. Feature-specific components should be extracted here as the admin section grows.

## Adding New Components
1. Create components for admin-specific functionality
2. Add types.ts if admin-specific types are needed
3. Import from the admin hub page
