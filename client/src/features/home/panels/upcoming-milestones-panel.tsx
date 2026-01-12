import { HomeMilestoneSummary } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flag, Calendar, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface UpcomingMilestonesPanelProps {
  milestones: HomeMilestoneSummary[];
}

export function UpcomingMilestonesPanel({ milestones }: UpcomingMilestonesPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Flag className="w-5 h-5 text-primary" />
          Upcoming Sprints
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {milestones.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center">
            No upcoming sprints.
          </div>
        ) : (
          milestones.map(milestone => (
            <div key={milestone.id} className="space-y-2 group">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                   <div className="flex items-center gap-2">
                     <span className="text-xs font-medium text-muted-foreground">{milestone.projectName}</span>
                     <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{milestone.status}</span>
                   </div>
                   <Link href={milestone.links?.milestoneUrl || "#"}>
                    <h4 className="text-sm font-medium hover:text-primary transition-colors cursor-pointer flex items-center gap-1">
                      {milestone.name}
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity -ml-1 group-hover:ml-0" />
                    </h4>
                   </Link>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium flex items-center gap-1 justify-end text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {new Date(milestone.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {milestone.daysUntil} days left
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Progress</span>
                  <span>{milestone.percentComplete}%</span>
                </div>
                <Progress value={milestone.percentComplete} className="h-1.5" />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
