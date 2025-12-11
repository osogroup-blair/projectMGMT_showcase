# User Home: JSON Schemas + AppGen Prompt

This file contains:

1. **JSON Schemas** for a user-centric Home view  
2. An **AppGen Prompt** to generate the Home page UI

The Home page is for a general team member working across projects, who thinks at the **task level**, but needs quick **context** (Epic, Deliverable, Project) and the ability to **plan/sequence their day and week**.

---

## 1. JSON Schemas for User Home

Schemas are Draft-07 style for:

- `UserHomeState`
- `WorkBlock`
- `DayPlan`
- `HomeTask`
- `HomeMilestoneSummary`

They are designed to sit on top of your existing Task/Epic/Deliverable/Project models.

> Assumptions  
> - Tasks already exist with IDs and relationships: `taskId`, `epicId`, `deliverableId`, `projectId`.  
> - The Home view receives a **user-specific projection** of this data (not raw full objects).  
> - Time zone is handled elsewhere (dates/times are in ISO-8601).

### 1.1 HomeTask Schema

This is the **task projection** used on the Home page. It focuses on what the user needs to know/do.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "HomeTask",
  "type": "object",
  "description": "Task projection optimized for the user Home page.",
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique task identifier."
    },
    "projectId": {
      "type": "string"
    },
    "projectName": {
      "type": "string"
    },
    "deliverableId": {
      "type": "string"
    },
    "deliverableName": {
      "type": "string"
    },
    "epicId": {
      "type": "string"
    },
    "epicName": {
      "type": "string"
    },
    "title": {
      "type": "string",
      "description": "Short, actionable task title."
    },
    "description": {
      "type": "string"
    },
    "status": {
      "type": "string",
      "enum": [
        "not_started",
        "in_progress",
        "blocked",
        "complete"
      ]
    },
    "assignedToUserId": {
      "type": "string",
      "description": "User this task is assigned to."
    },
    "dueDateTime": {
      "type": "string",
      "format": "date-time",
      "description": "Due date/time for prioritization (may be null if unscheduled)."
    },
    "estimatedDurationMinutes": {
      "type": "integer",
      "minimum": 0,
      "description": "Estimated duration of the task in minutes."
    },
    "durationBucket": {
      "type": "string",
      "enum": [
        "quick_win",
        "small",
        "medium",
        "deep_work"
      ],
      "description": "Bucketed duration classification for grouping on the Home view."
    },
    "priority": {
      "type": "string",
      "enum": ["low", "medium", "high", "critical"]
    },
    "isOverdue": {
      "type": "boolean",
      "description": "Convenience flag based on dueDateTime and now."
    },
    "milestoneIds": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "IDs of milestones this task contributes to."
    },
    "links": {
      "type": "object",
      "description": "Optional deep links for navigation.",
      "properties": {
        "taskUrl": { "type": "string", "format": "uri" },
        "epicUrl": { "type": "string", "format": "uri" },
        "deliverableUrl": { "type": "string", "format": "uri" },
        "projectUrl": { "type": "string", "format": "uri" }
      }
    }
  },
  "required": [
    "id",
    "title",
    "status",
    "assignedToUserId"
  ]
}
```

---

### 1.2 WorkBlock Schema

A WorkBlock is a **time-boxed unit of focused work** on one or more tasks within a day.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "WorkBlock",
  "type": "object",
  "description": "Time-boxed work session for one or more tasks on a given day.",
  "properties": {
    "id": {
      "type": "string"
    },
    "userId": {
      "type": "string"
    },
    "date": {
      "type": "string",
      "format": "date",
      "description": "Calendar date of the block (local to the user)."
    },
    "startTime": {
      "type": "string",
      "format": "time",
      "description": "Local start time (HH:MM:SS)."
    },
    "endTime": {
      "type": "string",
      "format": "time",
      "description": "Local end time (HH:MM:SS)."
    },
    "label": {
      "type": "string",
      "description": "Optional user-defined label (e.g., 'Blueprint validation focus')."
    },
    "taskIds": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Tasks scheduled into this block."
    },
    "totalPlannedMinutes": {
      "type": "integer",
      "description": "Total planned minutes of work in this block."
    },
    "status": {
      "type": "string",
      "enum": [
        "planned",
        "in_progress",
        "completed",
        "cancelled"
      ]
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
    "userId",
    "date",
    "startTime",
    "endTime",
    "status"
  ]
}
```

---

### 1.3 DayPlan Schema

A DayPlan is the collection of **WorkBlocks and unassigned tasks** for a user on a specific date.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "DayPlan",
  "type": "object",
  "description": "Planned work for a user on a specific date.",
  "properties": {
    "userId": {
      "type": "string"
    },
    "date": {
      "type": "string",
      "format": "date"
    },
    "workBlocks": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/WorkBlock"
      }
    },
    "unassignedTaskIds": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Tasks for this date (e.g., due today) that are not yet scheduled into a block."
    },
    "targetWorkMinutes": {
      "type": "integer",
      "description": "User's target planned minutes of focused work for the day."
    },
    "plannedMinutes": {
      "type": "integer",
      "description": "Total planned minutes across all blocks."
    }
  },
  "definitions": {
    "WorkBlock": {
      "$ref": "WorkBlock.json"
    }
  },
  "required": [
    "userId",
    "date"
  ]
}
```

---

### 1.4 HomeMilestoneSummary Schema

A lightweight milestone projection for the **Upcoming Milestones** section.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "HomeMilestoneSummary",
  "type": "object",
  "description": "Milestone summary optimized for the user Home page.",
  "properties": {
    "id": {
      "type": "string"
    },
    "projectId": {
      "type": "string"
    },
    "projectName": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "targetDate": {
      "type": "string",
      "format": "date"
    },
    "status": {
      "type": "string",
      "enum": [
        "planned",
        "in_progress",
        "achieved",
        "slipped",
        "cancelled"
      ]
    },
    "percentComplete": {
      "type": "number",
      "minimum": 0,
      "maximum": 100
    },
    "daysUntil": {
      "type": "integer",
      "description": "Convenience, can be derived from targetDate and 'today'."
    },
    "links": {
      "type": "object",
      "properties": {
        "milestoneUrl": {
          "type": "string",
          "format": "uri"
        },
        "projectUrl": {
          "type": "string",
          "format": "uri"
        }
      }
    }
  },
  "required": [
    "id",
    "name",
    "targetDate",
    "status"
  ]
}
```

---

### 1.5 UserHomeState Schema

The full payload for rendering the Home page for a specific user.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "UserHomeState",
  "type": "object",
  "description": "User-centric Home page data model for task-level work planning.",
  "properties": {
    "userId": {
      "type": "string"
    },
    "today": {
      "type": "string",
      "format": "date"
    },
    "timezone": {
      "type": "string",
      "description": "IANA timezone id (e.g., 'America/Denver')."
    },
    "preferences": {
      "type": "object",
      "properties": {
        "workdayStartTime": {
          "type": "string",
          "format": "time"
        },
        "workdayEndTime": {
          "type": "string",
          "format": "time"
        },
        "defaultTargetDailyMinutes": {
          "type": "integer"
        },
        "showOnlyActionable": {
          "type": "boolean",
          "description": "If true, only show tasks the user can act on now."
        }
      }
    },
    "todayTasks": {
      "type": "array",
      "description": "Tasks relevant for today (overdue + due today + explicitly scheduled).",
      "items": {
        "$ref": "#/definitions/HomeTask"
      }
    },
    "weekTasks": {
      "type": "array",
      "description": "Tasks due or scheduled in the current week (not limited to today).",
      "items": {
        "$ref": "#/definitions/HomeTask"
      }
    },
    "upcomingTasks": {
      "type": "array",
      "description": "Tasks beyond this week that the user may want to preview.",
      "items": {
        "$ref": "#/definitions/HomeTask"
      }
    },
    "dayPlans": {
      "type": "array",
      "description": "Day plans for the current week (and optionally +/- a few days).",
      "items": {
        "$ref": "#/definitions/DayPlan"
      }
    },
    "upcomingMilestones": {
      "type": "array",
      "description": "List of upcoming milestones across the user's projects.",
      "items": {
        "$ref": "#/definitions/HomeMilestoneSummary"
      }
    }
  },
  "definitions": {
    "HomeTask": {
      "$ref": "HomeTask.json"
    },
    "DayPlan": {
      "$ref": "DayPlan.json"
    },
    "HomeMilestoneSummary": {
      "$ref": "HomeMilestoneSummary.json"
    }
  },
  "required": [
    "userId",
    "today"
  ]
}
```

---

## 2. AppGen Prompt: Generate the User Home Page UI

Use this prompt in your AppGen / UI generation system to build the Home page.

```markdown
You are an expert product + frontend engineer.

**Goal**  
Build a **user-centric Home page** for a team member working across multiple projects.  
The Home page should help them:

1. See what to do **today**.
2. Plan and sequence their **day** via time-boxed work blocks.
3. Organize tasks for **this week** across days.
4. Look ahead to **upcoming tasks and milestones**.
5. Understand context (Epic, Deliverable, Project) at a glance and navigate deeper with a click.

The backend provides a `UserHomeState` object that matches the JSON schema (provided separately).

---

## Tech + Implementation

- Use **React + TypeScript**.
- Styling: TailwindCSS or similar utility-first approach.
- Assume a root component:

```tsx
<UserHomePage home={userHomeState} />
```

where `userHomeState: UserHomeState` follows the schema.

Define subcomponents such as:

- `TodayTasksPanel`
- `WeekPlanner`
- `DayPlanCalendar`
- `UpcomingMilestonesPanel`
- `TaskCard`
- `WorkBlockCard`

You do not need to implement actual API calls, only props and callbacks.

---

## Layout & UX Requirements

### 1. Top Bar (Header / Focus Controls)

- Show:
  - Today’s date
  - Greeting (e.g., “Good morning, Blair”)
- Controls:
  - Toggle: **Actionable Only** vs **All My Tasks**
  - Project filter (multi-select)
  - Quick filter chips: Overdue, Deep Work, Quick Wins

This bar should influence what is shown in the task lists below (e.g., filter `todayTasks`, `weekTasks`).

---

### 2. Today’s Focus (Task-Level View)

This is the primary section at the top of the page.

- Input: `home.todayTasks: HomeTask[]`
- Group tasks by `durationBucket`:

  - **Quick Wins** (≤ 15 min)
  - **Small** (15–30 min)
  - **Medium** (30–60 min)
  - **Deep Work** (60+ min)

For each task card, show:

- Task title
- Duration estimate (minutes)
- Status + priority
- Due date / overdue indicator
- Epic name (clickable)
- Deliverable name (subtle label)
- Project chip (color-coded)
- Milestone badge if the task feeds an upcoming milestone

Actions on each card:

- Mark complete
- Snooze (later today / pick date)
- Add to Day Plan (assign to a WorkBlock; see Day Plan section)

Visual behavior:

- Overdue tasks highlighted more strongly.
- Allow expand/collapse by bucket.

---

### 3. Week Planner (Tasks Across the Week)

Display a **weekly planner** view that helps the user place tasks onto specific days.

- Input: `home.weekTasks: HomeTask[]` and `home.dayPlans: DayPlan[]`
- Show 7-day strip (Mon–Sun or user-local week).
- Each day tile shows:
  - Date
  - Count of tasks due that day
  - Planned work minutes vs target (from DayPlan.targetWorkMinutes & plannedMinutes)

Side panel or left column: **“Unscheduled This Week”**

- Tasks due this week that are not yet assigned to any DayPlan / WorkBlock.
- Group by durationBucket for quick scanning.

Interactions:

- Drag-and-drop (or equivalent controls) to assign tasks to specific days (creating or updating DayPlans).
- Clicking a day tile selects that day for the Day Plan view below.

---

### 4. Day Plan Calendar (Sequence the Day)

When the user selects a day (default today), show a **timeline-based Day Plan**:

- Input: `DayPlan` for the selected date, including `workBlocks` and `unassignedTaskIds`.

Layout:

- Vertical time-ordered view from `preferences.workdayStartTime` to `preferences.workdayEndTime`.
- For each `WorkBlock`:
  - Show time range (start–end).
  - Label (custom or derived from primary task).
  - Total planned minutes.
  - Summary of tasks (e.g., “3 tasks from 2 projects”).

Interactions:

- Click a WorkBlock to expand and show its tasks.
- From the expanded view:
  - Reorder tasks within the block.
  - Remove tasks from the block (they go back to “Unassigned Today”).

Unassigned Today panel:

- List tasks from `todayTasks` that are either:
  - due today, or
  - explicitly scheduled for this day, but not in any WorkBlock.
- Allow dragging tasks into specific time slots or into existing WorkBlocks.

Navigation:

- Controls to move day-by-day (`Previous Day`, `Today`, `Next Day`).
- Keyboard shortcuts (e.g., left/right arrows) for navigation are a plus.

---

### 5. Upcoming Tasks (Beyond This Week)

A lighter-weight glimpse of future work.

- Input: `home.upcomingTasks`.
- Show them in a simple list or grouped by week (e.g., “In 1–2 weeks”, “In 3–4 weeks”).

Each row:

- Task title
- Due date (relative, e.g., “in 10 days”)
- Epic name
- Project chip

Provide an action to **pull forward** tasks (e.g., “Bring into this week”) which would move them into `weekTasks` / the Week Planner.

---

### 6. Upcoming Milestones Panel

- Input: `home.upcomingMilestones`.
- Show a list of upcoming milestones across the user’s projects, sorted by `targetDate`.

Each row:

- Milestone name
- Project name
- Target date + relative (e.g., “in 5 days”)
- Status
- Percent complete (small progress bar)

Click behavior:

- Click row → open milestone in side panel or navigate to milestone detail page.

---

## Context & Navigation

For every Task card:

- Clicking **task title** → call `onTaskSelected(taskId)` prop (parent may open a side panel).
- Clicking **epic name** → call `onEpicSelected(epicId)`.
- Clicking **deliverable name** → call `onDeliverableSelected(deliverableId)`.
- Clicking **project chip** → call `onProjectSelected(projectId)`.

Define these callbacks as props on `UserHomePage` so the host app can integrate routing.

---

## Interaction & Behavior Details

- Actionable filter:
  - When **Actionable Only** is on, hide tasks where:
    - status is `complete`, or
    - task is blocked in a way the user cannot resolve (optional logic).
- Play nice with large task sets:
  - Paginate or virtualize list rendering.
  - Provide search and additional filters (project, epic, status).

- Show empty states:
  - If no tasks for today → show uplifting “You’re clear for today” state and suggest pulling tasks from later in the week.
  - If no work blocks set → suggest creating a few focus blocks.

- All time-related text should be relative and friendly where possible (e.g., “Due in 3 hours”, “2 days overdue”).

---

## Output Expectations

- Provide fully typed React + TypeScript components:
  - `UserHomePage`
  - `TodayTasksPanel`
  - `WeekPlanner`
  - `DayPlanCalendar`
  - `UpcomingMilestonesPanel`
  - `TaskCard`
  - `WorkBlockCard`

- Include example usage with mocked `UserHomeState`, demonstrating:
  - Tasks across projects
  - Duration bucket grouping
  - DayPlan with a couple of WorkBlocks for “today”
  - Several upcoming milestones.

- Organize code so that it can be dropped into a `UserHomePage.tsx` file, with mock data provided in the same file or nearby.
```

---

End of file.
