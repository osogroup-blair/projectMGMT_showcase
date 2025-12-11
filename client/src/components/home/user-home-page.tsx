import { UserHomeState } from "@/types/home";
import { Shell } from "@/components/layout/shell";
import { TodayTasksPanel } from "./today-tasks-panel";
import { WeekPlanner } from "./week-planner";
import { UpcomingMilestonesPanel } from "./upcoming-milestones-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Search, Plus, SlidersHorizontal, CalendarDays, LayoutDashboard, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TEAM } from "@/lib/mock-data";

interface UserHomePageProps {
  homeState: UserHomeState;
}

export function UserHomePage({ homeState }: UserHomePageProps) {
  const currentUser = TEAM.find(u => u.id === "5") || TEAM[0]; // Mock current user (Jason Roberts)

  return (
    <Shell>
      <div className="max-w-7xl mx-auto space-y-8 pb-8">
        
        {/* Top Bar / Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl border shadow-sm">
           <div>
             <h1 className="text-2xl font-bold tracking-tight text-primary">Good morning, {currentUser.name.split(' ')[0]}</h1>
             <p className="text-muted-foreground">Here's what's on your plate for today, {new Date(homeState.today).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}.</p>
           </div>
           
           <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="relative w-full md:w-64">
               <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input placeholder="Search tasks, projects..." className="pl-9 bg-background/50" />
             </div>
             <Button size="icon" variant="outline" className="shrink-0">
               <Bell className="h-4 w-4" />
             </Button>
             <Button className="shrink-0 gap-2">
               <Plus className="h-4 w-4" />
               <span className="hidden sm:inline">New Task</span>
             </Button>
           </div>
        </div>

        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="bg-transparent p-0 border-b w-full justify-start rounded-none h-auto gap-6">
            <TabsTrigger 
              value="today" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Today
            </TabsTrigger>
            <TabsTrigger 
              value="week" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium"
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              My Week
            </TabsTrigger>
            <TabsTrigger 
              value="quarter" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium"
            >
              <Target className="w-4 h-4 mr-2" />
              This Quarter
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Today's Tasks & Focus (8 cols) */}
              <div className="lg:col-span-8 space-y-8">
                <div className="bg-card/50 rounded-xl p-1">
                  <TodayTasksPanel tasks={homeState.todayTasks} />
                </div>
              </div>

              {/* Right Column: Context & Milestones (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-card rounded-xl border shadow-sm overflow-hidden h-fit">
                   <UpcomingMilestonesPanel milestones={homeState.upcomingMilestones} />
                </div>

                <div className="bg-muted/30 rounded-xl p-4 border">
                  <h3 className="font-semibold text-sm mb-3">Quick Links</h3>
                  <div className="space-y-2 text-sm">
                    <div className="p-2 hover:bg-muted rounded cursor-pointer transition-colors flex items-center justify-between group">
                      <span className="text-muted-foreground group-hover:text-foreground">My Open Pull Requests</span>
                      <Badge variant="outline" className="bg-background">3</Badge>
                    </div>
                    <div className="p-2 hover:bg-muted rounded cursor-pointer transition-colors flex items-center justify-between group">
                      <span className="text-muted-foreground group-hover:text-foreground">Team Capacity</span>
                      <Badge variant="outline" className="bg-background">85%</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="week" className="mt-0">
             <div className="space-y-6">
               <div className="bg-card/50 rounded-xl p-6 border shadow-sm">
                  <WeekPlanner dayPlans={homeState.dayPlans} />
               </div>
             </div>
          </TabsContent>

          <TabsContent value="quarter" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 space-y-6">
                  <div className="bg-card rounded-xl border shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4">Quarterly Roadmap</h2>
                    <p className="text-muted-foreground text-sm">Milestones and key deliverables for Q4 2024.</p>
                    <div className="mt-6 space-y-6">
                       {homeState.upcomingMilestones.map(milestone => (
                         <div key={milestone.id} className="flex items-start gap-4 p-4 border rounded-lg bg-background hover:border-primary/50 transition-colors">
                           <div className="mt-1">
                              <Target className="w-5 h-5 text-primary" />
                           </div>
                           <div className="flex-1 space-y-2">
                             <div className="flex justify-between">
                               <h3 className="font-medium">{milestone.name}</h3>
                               <Badge variant="outline">{milestone.status}</Badge>
                             </div>
                             <p className="text-sm text-muted-foreground">{milestone.projectName}</p>
                             <div className="flex items-center gap-4 text-xs text-muted-foreground">
                               <span>Due: {new Date(milestone.targetDate).toLocaleDateString()}</span>
                               <span>{milestone.percentComplete}% Complete</span>
                             </div>
                           </div>
                         </div>
                       ))}
                    </div>
                  </div>
               </div>
               
               <div className="space-y-6">
                  <div className="bg-muted/30 rounded-xl p-6 border">
                     <h3 className="font-semibold text-sm mb-4">Quarterly Goals</h3>
                     <ul className="space-y-3 text-sm">
                       <li className="flex items-start gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                         <span>Complete Houlihan Lokey Rebrand</span>
                       </li>
                       <li className="flex items-start gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                         <span>Launch Internal Design System v2</span>
                       </li>
                       <li className="flex items-start gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                         <span>Improve Team Velocity by 15%</span>
                       </li>
                     </ul>
                  </div>
               </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
}
