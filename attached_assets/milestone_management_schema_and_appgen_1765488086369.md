# Milestone Management: JSON Schema + AppGen Prompt

This file contains:

1. **JSON Schemas** for Milestone Management  
2. An **AppGen Prompt** to generate the Milestone Management UI (including scope builder + task matrix)

---

## 1. JSON Schemas for Milestone Management

Below are JSON Schemas (Draft-07 style) for:

- `Milestone`
- `MilestoneScopeRules`
- `MilestoneTaskLink`

These are designed to plug into your existing project / work structure (Epics, Stages, Tasks).

> Assumptions:  
> - Tasks have: `id`, `projectId`, `epicId`, `stage`, `type` (or `templateKey`), `status`.  
> - Epics have: `id`, `projectId`, `type` (e.g., `use_case`, `technical`, etc.).  
> - Milestones are **per project**.

### 1.1 Milestone Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Milestone",
  "type": "object",
  "description": "A project milestone representing a point in time when a defined set of tasks is expected to be complete.",
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique identifier for the milestone."
    },
    "projectId": {
      "type": "string",
      "description": "Identifier of the project this milestone belongs to."
    },
    "name": {
      "type": "string",
      "description": "Short, human-friendly name of the milestone."
    },
    "description": {
      "type": "string",
      "description": "Optional long-form description of the milestone purpose and scope."
    },
    "phase": {
      "type": "string",
      "enum": [
        "plan_strategy",
        "validate_blueprints",
        "develop_solution",
        "enable_users"
      ],
      "description": "Primary implementation framework phase this milestone relates to."
    },
    "targetDate": {
      "type": "string",
      "format": "date",
      "description": "Target calendar date for achieving the milestone."
    },
    "status": {
      "type": "string",
      "enum": [
        "planned",
        "in_progress",
        "achieved",
        "slipped",
        "cancelled"
      ],
      "description": "Lifecycle status of the milestone."
    },
    "ownerId": {
      "type": "string",
      "description": "ID of the user responsible for the milestone."
    },
    "scopeType": {
      "type": "string",
      "enum": ["rule_based", "manual", "mixed"],
      "description": "How tasks are associated with this milestone."
    },
    "completionMode": {
      "type": "string",
      "enum": [
        "all_tasks",
        "percentage",
        "custom_rule"
      ],
      "description": "How milestone completion is calculated from scoped tasks."
    },
    "completionTargetPercent": {
      "type": "number",
      "minimum": 0,
      "maximum": 100,
      "description": "Percent of scoped tasks that must be complete for the milestone to be considered achieved (used when completionMode = 'percentage')."
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Optional tags used for filtering and grouping milestones."
    },
    "createdAt": {
      "type": "string",
      "format": "date-time",
      "description": "Creation timestamp."
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time",
      "description": "Last update timestamp."
    },
    "progress": {
      "type": "object",
      "description": "Computed progress snapshot for the milestone (read-only in most cases).",
      "properties": {
        "totalTasks": {
          "type": "integer",
          "minimum": 0
        },
        "completedTasks": {
          "type": "integer",
          "minimum": 0
        },
        "percentComplete": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        },
        "lastCalculatedAt": {
          "type": "string",
          "format": "date-time"
        }
      }
    }
  },
  "required": [
    "id",
    "projectId",
    "name",
    "targetDate",
    "status",
    "scopeType"
  ]
}
```

---

### 1.2 Milestone Scope Rules Schema

This schema defines how tasks are **dynamically** associated with a milestone. Think of it as:  
> “Include all tasks of type X in stage Y across all epics of type Z (with optional include/exclude lists).”

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "MilestoneScopeRules",
  "type": "object",
  "description": "Rule-based configuration for associating tasks with a milestone.",
  "properties": {
    "milestoneId": {
      "type": "string",
      "description": "ID of the milestone this rule set belongs to."
    },
    "rules": {
      "type": "array",
      "description": "Rule list defining which tasks are in scope for the milestone.",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique identifier for the rule."
          },
          "label": {
            "type": "string",
            "description": "Optional human-readable name for this rule (e.g., 'Validate User Story for all Use Case Epics')."
          },
          "taskTemplateKey": {
            "type": "string",
            "description": "Key or type identifier for the task template (e.g., 'validate_user_story')."
          },
          "stage": {
            "type": "string",
            "enum": [
              "plan_strategy",
              "validate_blueprints",
              "develop_solution",
              "enable_users"
            ],
            "description": "Stage in which matching tasks must exist."
          },
          "epicType": {
            "type": "string",
            "description": "Epic type filter (e.g., 'use_case', 'technical', 'operations')."
          },
          "filters": {
            "type": "object",
            "description": "Additional optional filters to narrow scope.",
            "properties": {
              "includeEpicIds": {
                "type": "array",
                "items": {
                  "type": "string"
                },
                "description": "Only include tasks whose epicId is in this list (if non-empty)."
              },
              "excludeEpicIds": {
                "type": "array",
                "items": {
                  "type": "string"
                },
                "description": "Exclude tasks whose epicId is in this list."
              },
              "includeTaskIds": {
                "type": "array",
                "items": {
                  "type": "string"
                },
                "description": "Force-include specific tasks by ID (even if other filters would exclude them)."
              },
              "excludeTaskIds": {
                "type": "array",
                "items": {
                  "type": "string"
                },
                "description": "Exclude specific tasks by ID."
              }
            }
          },
          "active": {
            "type": "boolean",
            "description": "Whether this rule is currently active."
          }
        },
        "required": ["id", "taskTemplateKey"]
      }
    },
    "lastEvaluatedAt": {
      "type": "string",
      "format": "date-time",
      "description": "Timestamp when the rules were last evaluated and materialized into MilestoneTaskLinks."
    }
  },
  "required": [
    "milestoneId"
  ]
}
```

---

### 1.3 Milestone Task Link Schema

This schema represents the **materialized relationship** between milestones and tasks.  
It lets you calculate progress and show membership quickly.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "MilestoneTaskLink",
  "type": "object",
  "description": "Link between a milestone and a task, with metadata on how the link was created.",
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique ID for this link."
    },
    "milestoneId": {
      "type": "string",
      "description": "ID of the milestone."
    },
    "taskId": {
      "type": "string",
      "description": "ID of the task."
    },
    "projectId": {
      "type": "string",
      "description": "Project ID (for convenience and faster querying)."
    },
    "source": {
      "type": "string",
      "enum": ["rule", "manual_add"],
      "description": "How the task was added to the milestone."
    },
    "ruleId": {
      "type": "string",
      "description": "If source = 'rule', ID of the rule that created this link."
    },
    "locked": {
      "type": "boolean",
      "description": "If true, this link should not be automatically removed by rule recalculation (e.g., manually locked in)."
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": [
    "id",
    "milestoneId",
    "taskId",
    "source"
  ]
}
```

---

## 2. AppGen Prompt: Generate Milestone Management UI

Use this prompt in your AppGen / UI-generation flow to create the Milestone Management feature.

```markdown
You are an expert product + frontend engineer.

**Goal**  
Build a **Milestone Management** feature for a project workspace.  
Milestones are points in time where a grouping of tasks across all Epics and Stages must be complete.

### Core Concepts

- Each **Milestone**:
  - Belongs to a single project.
  - Has a name, description, phase, target date, status, owner.
  - Has a scope of tasks that can be defined by **rules** and/or **manual selection**.
  - Has progress derived from completion of scoped tasks.

- **Scope Rules** (rule-based):
  - Define which tasks belong to the milestone using conditions like:
    - task template key (e.g., `validate_user_story`)
    - stage (Plan / Validate / Develop / Enable)
    - epic type (e.g., `use_case`)
    - include/exclude specific epics or tasks.
  - Example: “For all Use Case Epics, include the `Validate User Story` task in the Validate stage.”

- **Task Links**:
  - Materialized links from milestones to tasks are stored in `MilestoneTaskLink`.
  - Links can come from rules or manual adds.
  - Links can be locked to prevent automatic removal.

The backend exposes data that conforms to the JSON Schemas: `Milestone`, `MilestoneScopeRules`, and `MilestoneTaskLink`.

---

## Tech + Implementation

- Use **React + TypeScript**.
- Layout with modern responsive design (e.g., TailwindCSS).
- Assume the following props / APIs are available to the page:

```ts
type MilestoneManagementProps = {
  projectId: string;
  milestones: Milestone[]; // list for this project
  selectedMilestoneId?: string;
  onMilestoneSelected?: (milestoneId: string) => void;
  onMilestoneCreated?: () => void;
  onMilestoneUpdated?: (milestone: Milestone) => void;
  onMilestoneDeleted?: (milestoneId: string) => void;

  // Scope + task data
  getScopeRules: (milestoneId: string) => Promise<MilestoneScopeRules>;
  saveScopeRules: (scope: MilestoneScopeRules) => Promise<void>;

  // For task search and matrix
  searchTasks: (query: TaskSearchQuery) => Promise<Task[]>;
  getMilestoneTaskLinks: (milestoneId: string) => Promise<MilestoneTaskLink[]>;
  saveMilestoneTaskLinks: (
    milestoneId: string,
    links: MilestoneTaskLinkUpdatePayload
  ) => Promise<void>;

  // Optionally: onTaskClicked to open a side panel
  onTaskClicked?: (taskId: string) => void;
};
```

You do not need to implement backend API calls; just define where they would be invoked.

---

## UX Requirements

### 1. Milestone List View (Left Panel)

- Show a searchable/sortable list of milestones for the project.
- Each row shows:
  - name
  - phase
  - target date
  - status (planned, in progress, achieved, slipped, cancelled)
  - percent complete
- Allow:
  - create new milestone
  - duplicate milestone
  - delete milestone (with confirm)
- Selecting a milestone loads its details in the right panel.

### 2. Milestone Detail View (Right Panel)

The right panel has multiple sections:

#### 2.1 Header

- Show:
  - name (editable)
  - phase (select)
  - target date (date picker)
  - status (pill selector)
  - owner (select)
- Show a **progress bar**: `completedTasks / totalTasks (percentComplete)`.
- Show tags if present.
- Provide Save/Update actions and indicate unsaved changes.

#### 2.2 Scope Builder

Split into two tabs or stacked sections:

##### A. Rule-Based Scope Tab

- UI to add/edit/remove rules (mapping to `MilestoneScopeRules.rules`):
  - Task Template (dropdown; e.g., `Validate User Story`)
  - Stage (dropdown; Plan / Validate / Develop / Enable)
  - Epic Type (dropdown or multi-select; e.g., `Use Case`)
  - Optional include/exclude epic lists
  - Optional include/exclude specific task IDs
  - Active toggle
- For each rule, show a **live preview count**:
  - “Matches 10 tasks across 10 epics.”
- Provide buttons:
  - **Add Rule**
  - **Duplicate Rule**
  - **Delete Rule**
- Persist rules via `saveScopeRules` and re-materialize links (simulated client-side for the demo).

##### B. Manual Adjustments Tab

- Task search + filter area:
  - Filter by epic, stage, status, task template.
- Results table with:
  - checkbox to add/remove task from milestone
  - columns: task name, epic, stage, status, assignee, due date.
- Display membership indicator for each task:
  - from rule / manual / not in milestone
- Allow manual add/remove actions which update `MilestoneTaskLink` objects via `saveMilestoneTaskLinks`.
- Allow “lock” toggle on individual links to prevent them from being removed when rules change.

#### 2.3 Task Matrix View (Optional but Valuable)

- A visual matrix to understand coverage across epics:
  - Rows: Epics (e.g., all Use Case Epics)
  - Columns: key task templates or stages (e.g., Plan, Build, Validate)
- Each cell shows:
  - whether a matching task exists
  - whether it is included in the milestone
  - completion status
- This is especially useful for milestones like “Validate All User Stories”, where you want to see one validate task per epic.

---

## Interaction & Behavior

- When rules change:
  - Recalculate which tasks are in scope.
  - Show a confirm dialog if recalculation will **remove** existing links, with options:
    - “Apply changes and remove affected tasks”
    - “Keep tasks that were previously included (lock them)”
- When tasks change status externally (e.g., via another part of the app):
  - The milestone progress should update on next data refresh.
- Handle large sets of tasks with:
  - Pagination or virtualized lists
  - Clear filters and search inputs.

- Empty states:
  - No milestones yet → show CTA “Create your first milestone”.
  - No tasks match current rules → show helpful text hints.
  - No tasks selected in manual tab → instruct user to search/filter.

---

## Visual + Design Guidelines

- Clean, calm visual design; avoid clutter.
- Use consistent iconography for:
  - Milestones
  - Rules
  - Tasks
- Use color sparingly to highlight:
  - Overdue milestones
  - Slipped status
  - Critical tasks or high-severity issues.
- Ensure responsive behavior for narrower layouts: list collapses into top selector and detail view stacks vertically.

---

## Output Expectations

- Provide a fully typed React + TypeScript implementation of:

  - `MilestoneManagementPage`
  - `MilestoneListPanel`
  - `MilestoneDetailPanel`
  - `MilestoneScopeBuilder`
  - `MilestoneTaskMatrix` (even if basic)
  - Supporting types and mock data.

- Include example usage with mocked data for:
  - a milestone like “Validate All User Stories” spanning 10 Use Case epics with 10 matching tasks.

- Code should be drop-in ready into a `MilestoneManagementPage.tsx` file, requiring only actual data wiring to be production-ready.
```

---

End of file.
