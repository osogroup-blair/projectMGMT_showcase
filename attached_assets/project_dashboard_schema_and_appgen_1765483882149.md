# Project Dashboard Definition

This file contains:
1. A **JSON Schema** for the Project Dashboard modules.
2. An **AppGen Prompt** to generate the Dashboard page UI.

---

## 1. JSON Schema for Project Dashboard Modules

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ProjectDashboard",
  "type": "object",
  "description": "Schema for a project overview dashboard with status, financials/resources, upcoming work, risks/issues, and recent activity.",
  "properties": {
    "projectId": {
      "type": "string",
      "description": "Unique identifier of the project."
    },
    "projectName": {
      "type": "string",
      "description": "Display name of the project."
    },
    "lastUpdated": {
      "type": "string",
      "format": "date-time",
      "description": "Timestamp of the last dashboard data refresh."
    },
    "statusSnapshot": {
      "type": "object",
      "description": "High-level project status summary (Section 1).",
      "properties": {
        "health": {
          "type": "string",
          "enum": ["green", "yellow", "red"],
          "description": "Overall project health indicator."
        },
        "phase": {
          "type": "string",
          "enum": [
            "plan_strategy",
            "validate_blueprints",
            "develop_solution",
            "enable_users"
          ],
          "description": "Current implementation framework phase."
        },
        "percentComplete": {
          "type": "number",
          "minimum": 0,
          "maximum": 100,
          "description": "Overall completion percentage for the project."
        },
        "originalEndDate": {
          "type": "string",
          "format": "date",
          "description": "Original planned end date."
        },
        "projectedEndDate": {
          "type": "string",
          "format": "date",
          "description": "Current projected end date based on progress."
        },
        "daysRemaining": {
          "type": "integer",
          "description": "Number of calendar days remaining to projected end date."
        },
        "openRisksCount": {
          "type": "integer",
          "minimum": 0,
          "description": "Number of open risks."
        },
        "openIssuesCount": {
          "type": "integer",
          "minimum": 0,
          "description": "Number of open issues."
        },
        "pendingDecisionsCount": {
          "type": "integer",
          "minimum": 0,
          "description": "Number of pending decisions/approvals."
        },
        "upcomingMilestonesCount": {
          "type": "integer",
          "minimum": 0,
          "description": "Number of upcoming milestones in the configured horizon."
        }
      },
      "required": [
        "health",
        "phase",
        "percentComplete",
        "projectedEndDate"
      ]
    },
    "financialResourceSnapshot": {
      "type": "object",
      "description": "Financial and resource overview (Section 4).",
      "properties": {
        "currency": {
          "type": "string",
          "description": "ISO currency code, e.g. USD, EUR."
        },
        "budgetPlanned": {
          "type": "number",
          "description": "Total planned budget."
        },
        "budgetUsed": {
          "type": "number",
          "description": "Amount of budget consumed to date."
        },
        "budgetForecastFinal": {
          "type": "number",
          "description": "Latest forecast of final project cost."
        },
        "hoursPlanned": {
          "type": "number",
          "description": "Total planned hours for the project."
        },
        "hoursUsed": {
          "type": "number",
          "description": "Total hours consumed so far."
        },
        "hoursForecastFinal": {
          "type": "number",
          "description": "Forecast of total hours at completion."
        },
        "spendByPhase": {
          "type": "array",
          "description": "Spend breakdown by implementation phase.",
          "items": {
            "type": "object",
            "properties": {
              "phase": {
                "type": "string",
                "enum": [
                  "plan_strategy",
                  "validate_blueprints",
                  "develop_solution",
                  "enable_users"
                ]
              },
              "budgetUsed": {
                "type": "number"
              },
              "hoursUsed": {
                "type": "number"
              }
            },
            "required": ["phase"]
          }
        },
        "resourceUtilization": {
          "type": "array",
          "description": "Summary of utilization by role or person.",
          "items": {
            "type": "object",
            "properties": {
              "entityId": {
                "type": "string",
                "description": "ID of the role or person."
              },
              "entityType": {
                "type": "string",
                "enum": ["role", "person"],
                "description": "Whether this row represents a role or an individual."
              },
              "name": {
                "type": "string"
              },
              "utilizationPercent": {
                "type": "number",
                "minimum": 0,
                "maximum": 200,
                "description": "Planned utilization relative to capacity (100 = fully allocated)."
              },
              "status": {
                "type": "string",
                "enum": ["underallocated", "healthy", "overallocated"],
                "description": "Simplified utilization status."
              }
            },
            "required": ["entityId", "entityType", "name"]
          }
        }
      }
    },
    "upcomingWork": {
      "type": "object",
      "description": "Upcoming tasks, deliverables, milestones, and approvals (Section 5).",
      "properties": {
        "horizonDaysShort": {
          "type": "integer",
          "description": "Number of days for the 'This Week' or short horizon bucket."
        },
        "horizonDaysLong": {
          "type": "integer",
          "description": "Number of days for the 'Next 2–3 Weeks' or long horizon bucket."
        },
        "items": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "type": {
                "type": "string",
                "enum": ["task", "deliverable", "milestone", "approval", "meeting"]
              },
              "title": {
                "type": "string"
              },
              "description": {
                "type": "string"
              },
              "dueDate": {
                "type": "string",
                "format": "date-time"
              },
              "horizon": {
                "type": "string",
                "enum": ["short", "long"],
                "description": "Which upcoming-time bucket the item belongs to."
              },
              "status": {
                "type": "string",
                "enum": ["not_started", "in_progress", "blocked", "complete"]
              },
              "owner": {
                "type": "string",
                "description": "Name or ID of the owner."
              },
              "relatedPhase": {
                "type": "string",
                "enum": [
                  "plan_strategy",
                  "validate_blueprints",
                  "develop_solution",
                  "enable_users"
                ],
                "description": "Phase primarily impacted."
              },
              "priority": {
                "type": "string",
                "enum": ["low", "medium", "high", "critical"]
              }
            },
            "required": ["id", "type", "title", "dueDate"]
          }
        }
      }
    },
    "riskIssuePanel": {
      "type": "object",
      "description": "Risks and issues summary (Section 6).",
      "properties": {
        "risks": {
          "type": "array",
          "description": "Top risks for the project.",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string" },
              "title": { "type": "string" },
              "description": { "type": "string" },
              "severity": {
                "type": "string",
                "enum": ["low", "medium", "high", "critical"]
              },
              "likelihood": {
                "type": "string",
                "enum": ["low", "medium", "high"]
              },
              "owner": {
                "type": "string"
              },
              "status": {
                "type": "string",
                "enum": ["open", "mitigating", "closed"]
              },
              "targetResolutionDate": {
                "type": "string",
                "format": "date"
              }
            },
            "required": ["id", "title", "severity", "likelihood", "status"]
          }
        },
        "issues": {
          "type": "array",
          "description": "Current issues and blockers.",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string" },
              "title": { "type": "string" },
              "description": { "type": "string" },
              "severity": {
                "type": "string",
                "enum": ["low", "medium", "high", "critical"]
              },
              "owner": {
                "type": "string"
              },
              "status": {
                "type": "string",
                "enum": ["open", "in_progress", "blocked", "resolved"]
              },
              "targetResolutionDate": {
                "type": "string",
                "format": "date"
              },
              "relatedPhase": {
                "type": "string",
                "enum": [
                  "plan_strategy",
                  "validate_blueprints",
                  "develop_solution",
                  "enable_users"
                ]
              }
            },
            "required": ["id", "title", "severity", "status"]
          }
        },
        "trend": {
          "type": "string",
          "enum": ["improving", "stable", "worsening"],
          "description": "High-level trend of risk/issue situation."
        }
      }
    },
    "recentActivity": {
      "type": "object",
      "description": "Recent updates and momentum view (Section 7).",
      "properties": {
        "windowDays": {
          "type": "integer",
          "description": "Number of past days to show in the feed."
        },
        "completedCount": {
          "type": "integer",
          "description": "Number of completed items in the window."
        },
        "completedChangePercentVsPrevWindow": {
          "type": "number",
          "description": "Percent change in completions vs previous window, positive or negative."
        },
        "items": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string" },
              "type": {
                "type": "string",
                "enum": [
                  "task_completed",
                  "deliverable_completed",
                  "milestone_achieved",
                  "note_added",
                  "file_uploaded",
                  "assignment_changed",
                  "status_changed"
                ]
              },
              "title": { "type": "string" },
              "description": { "type": "string" },
              "timestamp": {
                "type": "string",
                "format": "date-time"
              },
              "actor": {
                "type": "string",
                "description": "User or system that performed the action."
              },
              "relatedPhase": {
                "type": "string",
                "enum": [
                  "plan_strategy",
                  "validate_blueprints",
                  "develop_solution",
                  "enable_users"
                ]
              }
            },
            "required": ["id", "type", "title", "timestamp"]
          }
        }
      }
    }
  },
  "required": [
    "projectId",
    "projectName",
    "statusSnapshot"
  ]
}
```

---

## 2. AppGen Prompt to Generate the Dashboard Page

```markdown
You are an expert frontend and product engineer.

**Goal**
Build a Project Dashboard page for a project overview workspace. The Dashboard must visualize data that conforms to the `ProjectDashboard` JSON schema (provided separately) and include these five modules:

1. Project Status Snapshot
2. Financial & Resource Snapshot
3. Upcoming Work & Deadlines
4. Risk & Issue Panel
5. Recent Activity / Momentum Feed

Assume the app already has top-level tabs:
- Dashboard
- Deliverables
- Timeline
- Plan Strategy
- Validate Blueprints
- Develop Solution
- Enable Users

The Dashboard is the default landing page for a project and should NOT duplicate the detailed content of other tabs. It should act as the cross-cutting, executive + PM summary.

---

## Tech + Implementation Requirements

- Use React with TypeScript.
- Use a modern component-based layout with responsive design.
- Styling: TailwindCSS or a similar utility-first approach.
- Create reusable, composable components so this dashboard can be embedded in multiple project layouts.
- Assume dashboard data is passed as a single prop `dashboard: ProjectDashboard` that matches the JSON schema.

Export a single top-level component:

```tsx
<ProjectDashboardPage dashboard={dashboard} />
```

You may also define child components such as:
- `StatusSnapshotCard`
- `FinancialResourceSection`
- `UpcomingWorkSection`
- `RiskIssuePanel`
- `RecentActivityFeed`

---

## Layout Requirements

### Top Row: Project Status Snapshot (Full Width)
- Show overall health (color-coded badge: green/yellow/red).
- Show current phase using labels: Plan Strategy, Validate Blueprints, Develop Solution, Enable Users.
- Show:
  - % complete
  - original end date vs projected end date (with slippage indicator if different)
  - days remaining
- Show high-level counters:
  - open risks
  - open issues
  - pending decisions
  - upcoming milestones

Design goals:
- Clean, minimal, and readable.
- The top row should answer: “Are we on track?” in under 3 seconds.

### Middle Row: Work vs Risk (Two Columns)
**Left: Upcoming Work & Deadlines**
- Group items into two buckets based on `horizon`:
  - “This Week” (short horizon)
  - “Next Few Weeks” (long horizon)
- For each item show:
  - type icon (task, deliverable, milestone, approval, meeting)
  - title
  - due date (with countdown or “X days overdue”)
  - owner
  - status
  - priority
- Highlight overdue or critical items visually.

**Right: Risk & Issue Panel**
- Show lists of Risks and Issues in separate subsections.
- For each risk:
  - title, severity, likelihood, owner, status, target resolution date
- For each issue:
  - title, severity, status, owner, target resolution date
- Show an overall risk trend indicator (improving/stable/worsening).
- Emphasize high-severity and critical items at the top with stronger styling.

Design goals:
- The middle row should tell a PM: “What must we do next, and what might hurt us?”

### Bottom Row: Financials + Activity (Two Columns)
**Left: Financial & Resource Snapshot**
- Visualize:
  - planned vs used vs forecast budget (bars or donut)
  - planned vs used vs forecast hours
- If `spendByPhase` is provided, show a small bar chart by phase.
- For `resourceUtilization`, show a compact list or heat strip:
  - name, role/person label, utilization percent, status (under/healthy/over)
- Highlight overallocated resources in red or warning color.

**Right: Recent Activity / Momentum Feed**
- Show a chronological feed of activity items:
  - type icon
  - title
  - short description
  - timestamp
  - actor
- Show a small momentum summary at the top:
  - items completed in the current window
  - % change vs previous window
  - textual indicator like “Momentum: Increasing / Stable / Slowing”

Design goals:
- Provide confidence that work is actually moving and where effort is going.

---

## Interaction + Behavior

- All lists should be scrollable when long, without breaking the page layout.
- Clicking an item (upcoming work, risk, issue, activity) should trigger a callback prop such as `onItemSelected` with the item payload so the host app can open modals or side panels.
- Use tooltips for truncated text and icons.
- Gracefully handle empty states:
  - e.g., “No upcoming work this week”, “No critical risks open”, “No recent activity in the last X days”.

---

## Output Expectations

- Provide fully typed React + TypeScript code for all components.
- Include example usage with a mocked `dashboard` object that matches the JSON schema.
- Organize code so it can be dropped into a `ProjectDashboardPage.tsx` file and compiled without modification (aside from wiring in real data).
```
