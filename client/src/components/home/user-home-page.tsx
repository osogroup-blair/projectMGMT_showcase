import { UserHomeState } from "@/types/home";
import { Shell } from "@/components/layout/shell";
import { TodayTasksPanel } from "./today-tasks-panel";
import { WeekPlanner } from "./week-planner";
import { UpcomingMilestonesPanel } from "./upcoming-milestones-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Search, Plus, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Today's Tasks & Focus (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Today's Focus Panel */}
            <div className="bg-card/50 rounded-xl p-1">
              <TodayTasksPanel tasks={homeState.todayTasks} />
            </div>

            {/* Week Planner */}
            <div className="pt-4 border-t">
              <WeekPlanner dayPlans={homeState.dayPlans} />
            </div>
            
          </div>

          {/* Right Column: Context & Milestones (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick Stats / Context Widget could go here */}
            
            {/* Upcoming Milestones */}
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden h-fit sticky top-6">
               <UpcomingMilestonesPanel milestones={homeState.upcomingMilestones} />
            </div>

            {/* Recently Viewed / Quick Links could go here */}
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
      </div>
    </Shell>
  );
}
