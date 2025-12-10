import { STATS } from "@/lib/mock-data";
import { ArrowUpRight, Clock, CheckCircle2, AlertTriangle, Flag, DollarSign, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatsGrid() {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">This Week</h3>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard 
          icon={Clock} 
          value={STATS.hoursLogged} 
          label="hours logged" 
          trend="+4%" 
          color="text-blue-500" 
          bg="bg-blue-50"
        />
        <StatCard 
          icon={CheckCircle2} 
          value={STATS.tasksCompleted} 
          label="tasks done" 
          trend="+12%" 
          color="text-green-500" 
          bg="bg-green-50"
        />
        <StatCard 
          icon={Layers} 
          value={STATS.activeProjects} 
          label="active projects" 
          color="text-indigo-500" 
          bg="bg-indigo-50"
        />
        <StatCard 
          icon={DollarSign} 
          value={`$${STATS.pendingReimbursement.toLocaleString().split('.')[0]}`} 
          label="reimbursements" 
          trend="0.5%" 
          color="text-amber-500" 
          bg="bg-amber-50"
        />
        <StatCard 
          icon={Flag} 
          value={STATS.milestones} 
          label="milestones" 
          color="text-purple-500" 
          bg="bg-purple-50"
        />
        <StatCard 
          icon={AlertTriangle} 
          value={STATS.projectRisks} 
          label="risks detected" 
          color="text-red-500" 
          bg="bg-red-50"
          alert
        />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, value, label, trend, color, bg, alert }: any) {
  return (
    <Card className={`border-none shadow-xs hover:shadow-md transition-shadow ${alert ? 'ring-2 ring-red-100 dark:ring-red-900/20' : ''}`}>
      <CardContent className="p-4 flex flex-col justify-between h-full min-h-[110px]">
        <div className="flex justify-between items-start">
          <div className={`p-2 rounded-lg ${bg} ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
          {trend && (
            <span className="text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full flex items-center">
              {trend} <ArrowUpRight className="h-2 w-2 ml-0.5" />
            </span>
          )}
        </div>
        <div>
          <div className="text-2xl font-bold tracking-tight mt-3">{value}</div>
          <div className="text-xs text-muted-foreground font-medium capitalize">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
