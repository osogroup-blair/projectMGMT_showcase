import { Shell } from "@/components/layout/shell";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { ProjectTable } from "@/components/dashboard/project-table";
import { TaskList } from "@/components/dashboard/task-list";
import { TeamList } from "@/components/dashboard/team-list";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { AIWidget } from "@/components/dashboard/ai-widget";

export default function Home() {
  return (
    <Shell>
      <StatsGrid />
      <AIWidget />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <ProjectTable />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <TaskList />
            <TeamList />
          </div>
        </div>
        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>
      </div>
    </Shell>
  );
}
