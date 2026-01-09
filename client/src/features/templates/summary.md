# Templates Feature

## Purpose
Contains components for creating and editing reusable templates (stage templates, framework templates, etc.) used in project configuration.

## Structure

```
templates/
├── stage-template-editor.tsx  # Stage template creation/editing
└── summary.md
```

## Key Components
- `StageTemplateEditor` - UI for defining stage templates with phases, entry/exit criteria, and workflow rules

## Usage
Used by the admin hub for template management and by the project wizard for applying templates to new projects.

## Related Entities
- Stage Templates - Reusable stage configurations
- Framework Templates - Project framework definitions
- Role Templates - Standard role definitions

## Adding New Components
1. Add template editor components here
2. Keep template-specific types in the component file or create a `types.ts` if shared
3. Wire into admin hub or project wizard as needed
