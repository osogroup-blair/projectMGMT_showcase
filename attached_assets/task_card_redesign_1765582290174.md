# Task Card Interface Redesign Prompt

You are updating the **Task Card interface** for the Project Management app.

## Goal
Redesign the Task Card UI and interactions so that it behaves like a rich list-style card (full-width), but also supports a layout toggle to show **1, 2, or 3 cards per row**. The focus is on making core task management actions fast and obvious, and surfacing context (Epic, Milestones, Stage) clearly.

---

## Context
- A **Task** belongs to:
  - An **Epic**
  - A **Stage** (e.g., Plan / Validate / Develop / Enable)
  - Zero or more **Milestones**
- Tasks have:
  - Name / Title
  - Status
  - Assigned User
  - Due Date
  - Effort / Estimate (e.g., hours)
  - IDs linking to Epic, Stage, and Milestones

### Example Task Type
```ts
type Task = {
  id: string;
  name: string;
  statusId: string;
  assigneeId?: string;
  dueDate?: string;
  effortHours?: number;
  epicName?: string;
  stageName?: string;
  milestoneNames?: string[];
};
```

---

## Functional Requirements

### 1. Core Actions on the Task Card
Each Task Card should make the following actions **directly accessible**:

1. **Change status**  
2. **Edit task name inline**  
3. **Assign user**  
4. **Change due date**  
5. **Change effort estimate**  
6. **View which Epic the task belongs to** (Epic name displayed above task title)  
7. **See Milestones** associated with the task  
8. **See Stage** the task is in  

---

## Layout & Responsiveness

### 2. Card Layout
The card should support both full-width list-style display and grid-style display.

**Layout Structure:**
- **Top Row:** Epic name (small), Stage label, Status control  
- **Middle Row:** Task name (editable, primary content)  
- **Bottom Row:** Assignee, Due Date, Effort, Milestone chips  

### 3. Layout Toggle (1 / 2 / 3 Cards per Row)
Implement a layout toggle control with options for:
- 1-column list view  
- 2-column grid  
- 3-column dense grid  

Cards should auto-adjust based on screen width even when a higher-density layout is selected.

---

## UX & Interaction Details
- Inline edits should provide confirmation/feedback  
- Status changes should update immediately  
- Clickable regions should be accessible and easy to target  
- Include ARIA labels and focus states for accessibility  

---

## Implementation Notes
Create or update a reusable `TaskCard` component with props for:
- `task`
- callbacks such as `onUpdateTask`, `onOpenEpic`, `onOpenMilestone`
- layout variant: `"one-column" | "two-column" | "three-column"`

Add a `TaskBoardToolbar` to store and update the selected layout view.

---

## Deliverable
A redesigned Task Card UI and full interaction model supporting:
- Full-width and multi-column layouts  
- Quick task actions (status, edit, assign, date, effort)  
- Context awareness (Epic, Stage, Milestones)  
