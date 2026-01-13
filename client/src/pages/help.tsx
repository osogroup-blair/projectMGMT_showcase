import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shell } from "@/components/layout/shell";
import { 
  FolderKanban, 
  Package, 
  Layers, 
  CheckSquare, 
  Target, 
  GitBranch, 
  Calendar,
  Users,
  LayoutGrid,
  ArrowRight,
  Lightbulb,
  BookOpen,
  Workflow,
  Clock,
  ListTodo
} from "lucide-react";

export default function HelpPage() {
  return (
    <Shell>
      <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="help-title">Help & User Guide</h1>
        <p className="text-muted-foreground text-lg">
          Learn how to get the most out of Nymbl Workspace for managing your projects and teams.
        </p>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Understanding the Data Model
            </CardTitle>
            <CardDescription>
              The foundation of how work is organized in Nymbl Workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Nymbl Workspace uses a hierarchical structure to break down complex projects into manageable pieces. 
                Understanding this structure helps you organize work effectively and track progress at every level.
              </p>

              <div className="grid gap-4">
                <div className="flex gap-4 p-4 border rounded-lg">
                  <div className="shrink-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FolderKanban className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Projects</h3>
                      <Badge variant="secondary" className="text-xs">Top Level</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Projects are the highest level of organization. Each project represents a distinct initiative, 
                      product, or client engagement. Projects contain all the work items, team members, timelines, 
                      and delivery frameworks needed to complete the initiative.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 border rounded-lg">
                  <div className="shrink-0">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold">Deliverables</h3>
                    <p className="text-sm text-muted-foreground">
                      Deliverables are major outcomes or products within a project. Think of them as the key results 
                      you'll hand off to stakeholders. For example, in a website redesign project, deliverables might 
                      include "Homepage Design," "User Dashboard," and "Mobile App."
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 border rounded-lg">
                  <div className="shrink-0">
                    <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <Layers className="h-5 w-5 text-violet-500" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold">Epics</h3>
                    <p className="text-sm text-muted-foreground">
                      Epics group related tasks together under a deliverable. They represent significant features or 
                      bodies of work that may span multiple sprints. An epic might be "User Authentication" or 
                      "Payment Integration" - large enough to warrant tracking separately.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 border rounded-lg">
                  <div className="shrink-0">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <CheckSquare className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold">Tasks</h3>
                    <p className="text-sm text-muted-foreground">
                      Tasks are the atomic units of work. Each task is assignable to a team member, has a status, 
                      priority, and optionally effort points or time estimates. Tasks move through your workflow 
                      stages (like "To Do," "In Progress," "Done") as work progresses.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex gap-3 p-3 border rounded-lg">
                  <Target className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Milestones</h4>
                    <p className="text-xs text-muted-foreground">
                      Key checkpoints or deadlines in your project timeline. Use them to mark important dates 
                      like phase completions, client reviews, or launch dates.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-3 border rounded-lg">
                  <GitBranch className="h-5 w-5 text-cyan-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Stages</h4>
                    <p className="text-xs text-muted-foreground">
                      Workflow columns that represent task states. Default stages include To Do, In Progress, 
                      and Done, but you can customize them per project.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-3 border rounded-lg">
                  <Calendar className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Sprints</h4>
                    <p className="text-xs text-muted-foreground">
                      Time-boxed periods (typically 1-4 weeks) for planning and completing work. Sprints help 
                      teams focus on a manageable set of tasks.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-3 border rounded-lg">
                  <Users className="h-5 w-5 text-pink-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Team Members</h4>
                    <p className="text-xs text-muted-foreground">
                      People assigned to projects with specific roles. Each member can have a project role 
                      (Owner, Manager, etc.) and an execution role (Developer, Designer, etc.).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5 text-primary" />
              Recommended Workflow
            </CardTitle>
            <CardDescription>
              The ideal way to use Nymbl Workspace from project setup to delivery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="relative">
                <div className="absolute left-5 top-10 bottom-10 w-0.5 bg-border" />
                
                <div className="space-y-6">
                  <div className="relative flex gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold shrink-0 z-10">
                      1
                    </div>
                    <div className="pt-1">
                      <h4 className="font-semibold">Create Your Project</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Use the project wizard to set up your project. Define the project name, description, 
                        and set key dates. The wizard guides you through each step of the setup process.
                      </p>
                    </div>
                  </div>

                  <div className="relative flex gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold shrink-0 z-10">
                      2
                    </div>
                    <div className="pt-1">
                      <h4 className="font-semibold">Build Your Work Breakdown Structure</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add deliverables and epics to organize your scope. This hierarchical structure helps 
                        everyone understand what needs to be built. You can import tasks from spreadsheets or 
                        add them manually.
                      </p>
                    </div>
                  </div>

                  <div className="relative flex gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold shrink-0 z-10">
                      3
                    </div>
                    <div className="pt-1">
                      <h4 className="font-semibold">Configure Your Workflow Stages</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Select a delivery framework that matches your methodology (like "Standard Delivery" or 
                        "Agile Scrum"), or create custom stages that fit your team's process. Stages define how 
                        tasks move through your workflow.
                      </p>
                    </div>
                  </div>

                  <div className="relative flex gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold shrink-0 z-10">
                      4
                    </div>
                    <div className="pt-1">
                      <h4 className="font-semibold">Create Tasks and Milestones</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Define specific tasks and important project milestones. Assign tasks to epics and set target 
                        dates for milestones to create a clear roadmap for your project.
                      </p>
                    </div>
                  </div>

                  <div className="relative flex gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold shrink-0 z-10">
                      5
                    </div>
                    <div className="pt-1">
                      <h4 className="font-semibold">Assign Your Team</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add team members with appropriate project roles (Owner, Manager, Member) and execution 
                        roles (Developer, Designer, QA). This enables workload tracking and task assignment.
                      </p>
                    </div>
                  </div>

                  <div className="relative flex gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold shrink-0 z-10">
                      6
                    </div>
                    <div className="pt-1">
                      <h4 className="font-semibold">Plan Sprints</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Create sprints for time-boxed planning. Assign tasks to sprints to plan what gets done when, 
                        monitor team capacity, and track your project's velocity.
                      </p>
                    </div>
                  </div>

                  <div className="relative flex gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold shrink-0 z-10">
                      7
                    </div>
                    <div className="pt-1">
                      <h4 className="font-semibold">Execute & Track Progress</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Use Kanban boards to move tasks through stages. Update task status, log blockers, 
                        and track completion. The homepage dashboard shows your current work at a glance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-primary" />
              Key Features & Views
            </CardTitle>
            <CardDescription>
              Powerful tools to manage and visualize your work
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Kanban Board
                </h4>
                <p className="text-sm text-muted-foreground">
                  Drag and drop tasks between columns to update their status. Available on the homepage for 
                  your assigned tasks and within each project for all project tasks.
                </p>
              </div>

              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <ListTodo className="h-4 w-4" />
                  Table View
                </h4>
                <p className="text-sm text-muted-foreground">
                  See all tasks in a sortable, filterable table format. Great for bulk editing, 
                  exporting data, or getting a comprehensive list view.
                </p>
              </div>

              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Sprint Planning
                </h4>
                <p className="text-sm text-muted-foreground">
                  Plan what work goes into each sprint. Drag tasks from the backlog into sprints, 
                  monitor capacity, and track sprint velocity.
                </p>
              </div>

              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Timeline View
                </h4>
                <p className="text-sm text-muted-foreground">
                  Visualize tasks and milestones on a timeline. See how work is distributed over time 
                  and identify scheduling conflicts.
                </p>
              </div>

              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team Workload
                </h4>
                <p className="text-sm text-muted-foreground">
                  See how work is distributed across team members. Identify who's overloaded and 
                  who has capacity for more work.
                </p>
              </div>

              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Import/Export
                </h4>
                <p className="text-sm text-muted-foreground">
                  Import tasks from Excel, CSV, or JSON files. Export your project data for reporting 
                  or backup purposes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Common Actions Guide
            </CardTitle>
            <CardDescription>
              Step-by-step guidance for everyday tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="create-task">
                <AccordionTrigger>How do I create a new task?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-2">
                  <p>There are several ways to create tasks:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Navigate to a project and click the "Add Task" button</li>
                    <li>Use the quick-add feature on any Kanban column</li>
                    <li>Import tasks in bulk via the Import/Export feature</li>
                    <li>Create tasks during the project setup wizard</li>
                  </ul>
                  <p>Each task needs at minimum a title. You can add details like assignee, priority, 
                  effort points, and due date as needed.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="move-task">
                <AccordionTrigger>How do I move a task to a different status?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-2">
                  <p>On the Kanban board:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Drag and drop the task card to the desired column</li>
                    <li>Or hover over a task and use the left/right arrow buttons for quick moves</li>
                    <li>Or click the three-dot menu on a task to select "Move to column"</li>
                  </ul>
                  <p>You can also update task status from the task detail page.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="assign-task">
                <AccordionTrigger>How do I assign a task to someone?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-2">
                  <p>To assign a task:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Open the task detail page and select an assignee from the dropdown</li>
                    <li>On Kanban, hover over a task card and click to open the quick-assign popover</li>
                    <li>When creating a task, set the assignee in the create form</li>
                  </ul>
                  <p>Only team members added to the project can be assigned tasks.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="create-sprint">
                <AccordionTrigger>How do I create and plan a sprint?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-2">
                  <p>To work with sprints:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Go to your project and navigate to the Sprints section</li>
                    <li>Click "Create Sprint" and set the name, start date, and end date</li>
                    <li>Open the sprint to see the backlog of unassigned tasks</li>
                    <li>Drag tasks from the backlog into the sprint, or edit tasks to assign them</li>
                    <li>Monitor sprint progress on the sprint board</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="track-blockers">
                <AccordionTrigger>How do I track blockers and issues?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-2">
                  <p>When a task is blocked:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Open the task and toggle the "Blocked" status</li>
                    <li>Add a blocker reason to explain what's preventing progress</li>
                    <li>Blocked tasks appear with a visual indicator (amber border) on Kanban boards</li>
                    <li>Filter by blocked tasks to see all current blockers across the project</li>
                  </ul>
                  <p>Resolving blockers quickly is key to maintaining project velocity.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="add-team">
                <AccordionTrigger>How do I add team members to a project?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-2">
                  <p>To manage project team:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Go to your project and navigate to the Team section</li>
                    <li>Click "Add Member" to invite users to the project</li>
                    <li>Select their project role (Owner, Manager, Stakeholder, or Member)</li>
                    <li>Optionally assign an execution role (Developer, Designer, QA, etc.)</li>
                    <li>Team members can then be assigned tasks and see project data</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="milestones">
                <AccordionTrigger>How do I set up and track milestones?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-2">
                  <p>Milestones mark important project dates:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Navigate to your project's Milestones section</li>
                    <li>Click "Add Milestone" with a name and target date</li>
                    <li>Link tasks to milestones to track what needs to be done by that date</li>
                    <li>View milestones on the Timeline to see them in context with tasks</li>
                    <li>Milestone status updates automatically based on linked task completion</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="import-data">
                <AccordionTrigger>How do I import tasks from a spreadsheet?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-2">
                  <p>To import data:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Go to Admin → Import/Export</li>
                    <li>Upload your Excel, CSV, or JSON file</li>
                    <li>Map your columns to Nymbl fields (title, description, status, etc.)</li>
                    <li>Preview the import and resolve any validation issues</li>
                    <li>Complete the import to create all tasks at once</li>
                  </ul>
                  <p>You can also import during project creation to bootstrap your work breakdown structure.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="filter-tasks">
                <AccordionTrigger>How do I filter and find specific tasks?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-2">
                  <p>Use filters to narrow down what you see:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>On Kanban boards, use the filter dropdowns for Assignee, Epic, Milestone, Sprint</li>
                    <li>In Table view, click column headers to sort, or use the filter options</li>
                    <li>Use the global search bar to find tasks by name across all projects</li>
                    <li>Filter by status, priority, or blocked state to focus on specific work</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Pro Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="shrink-0 h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <span className="text-amber-500 text-sm font-medium">1</span>
                </div>
                <p className="text-sm">
                  <strong>Start with structure.</strong> Spend time setting up your deliverables and epics 
                  before creating lots of tasks. Good organization makes everything easier.
                </p>
              </div>

              <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="shrink-0 h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <span className="text-amber-500 text-sm font-medium">2</span>
                </div>
                <p className="text-sm">
                  <strong>Use effort points.</strong> Estimating task complexity helps with sprint planning 
                  and prevents overcommitment.
                </p>
              </div>

              <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="shrink-0 h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <span className="text-amber-500 text-sm font-medium">3</span>
                </div>
                <p className="text-sm">
                  <strong>Keep tasks small.</strong> Tasks that can be completed in a day or two are easier 
                  to track and less likely to get stuck.
                </p>
              </div>

              <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="shrink-0 h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <span className="text-amber-500 text-sm font-medium">4</span>
                </div>
                <p className="text-sm">
                  <strong>Update status regularly.</strong> Move tasks through stages as you work. 
                  Real-time status keeps everyone aligned.
                </p>
              </div>

              <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="shrink-0 h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <span className="text-amber-500 text-sm font-medium">5</span>
                </div>
                <p className="text-sm">
                  <strong>Flag blockers immediately.</strong> Don't wait - if something is stuck, 
                  mark it blocked so the team can help resolve it.
                </p>
              </div>

              <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="shrink-0 h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <span className="text-amber-500 text-sm font-medium">6</span>
                </div>
                <p className="text-sm">
                  <strong>Review the homepage daily.</strong> Your personal dashboard shows what's assigned 
                  to you and what needs attention.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </Shell>
  );
}
