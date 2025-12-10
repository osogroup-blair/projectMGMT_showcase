import { useState } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle,
  Calendar,
  User,
  Flag,
  CreditCard,
  Percent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PROJECTS, MILESTONES, TEAM, Milestone } from "@/lib/mock-data";

// Reuse Mock Stages from stage-designer.tsx since we can't easily import from there
const MOCK_STAGES = [
  { id: "s1", name: "Discovery", color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
  { id: "s2", name: "Design", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  { id: "s3", name: "Development", color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" },
  { id: "s4", name: "QA & Testing", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { id: "s5", name: "Launch", color: "text-green-500 bg-green-500/10 border-green-500/20" }
];

const STATUS_CONFIG = {
  "Pending": { icon: Circle, color: "text-slate-500" },
  "In Progress": { icon: Clock, color: "text-blue-500" },
  "Completed": { icon: CheckCircle2, color: "text-green-500" },
  "Blocked": { icon: AlertCircle, color: "text-red-500" },
  "Skipped": { icon: Flag, color: "text-slate-400" },
};

export default function MilestonesManagement() {
  const [match, params] = useRoute("/projects/:projectId/milestones");
  const projectId = params?.projectId || "1";
  const project = PROJECTS.find(p => p.id === projectId) || PROJECTS[0];
  const { toast } = useToast();

  const [milestones, setMilestones] = useState<Milestone[]>(MILESTONES);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");

  const filteredMilestones = milestones.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    const matchesStage = stageFilter === "all" || m.stageId === stageFilter;
    
    return matchesSearch && matchesStatus && matchesStage;
  });

  const handleDelete = (id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
    toast({
      title: "Milestone Deleted",
      description: "The milestone has been removed successfully.",
      variant: "destructive"
    });
  };

  const getStageName = (id: string) => MOCK_STAGES.find(s => s.id === id)?.name || "Unknown Stage";
  const getStageColor = (id: string) => MOCK_STAGES.find(s => s.id === id)?.color || "bg-slate-100 text-slate-700";
  const getOwnerName = (id: string) => TEAM.find(t => t.id === id)?.name || "Unassigned";

  return (
    <Shell>
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-primary">Milestones</h1>
              <p className="text-muted-foreground">Track key project gates, deliverables, and billing events.</p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Milestone
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search milestones..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>

              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Stage" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {MOCK_STAGES.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Milestone Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMilestones.map((milestone) => {
            const StatusIcon = STATUS_CONFIG[milestone.status as keyof typeof STATUS_CONFIG].icon;
            const statusColor = STATUS_CONFIG[milestone.status as keyof typeof STATUS_CONFIG].color;

            return (
              <Card key={milestone.id} className="flex flex-col hover:border-primary/50 transition-colors group">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <Badge variant="outline" className={cn("mb-2 font-normal", getStageColor(milestone.stageId))}>
                      {getStageName(milestone.stageId)}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(milestone.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="text-lg font-semibold leading-tight">{milestone.name}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-1.5 min-h-[40px]">
                    {milestone.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  {/* Key Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 p-2 rounded-md">
                      <Calendar className="h-4 w-4 text-primary/70" />
                      <span className="truncate">{new Date(milestone.targetDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 p-2 rounded-md">
                      <User className="h-4 w-4 text-primary/70" />
                      <span className="truncate">{getOwnerName(milestone.ownerId)}</span>
                    </div>
                  </div>
                  
                  {/* Status & Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className={cn("flex items-center gap-1.5 text-sm font-medium", statusColor)}>
                      <StatusIcon className="h-4 w-4" />
                      {milestone.status}
                    </div>
                    {milestone.isBillingGate && (
                      <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-200">
                        <CreditCard className="h-3 w-3" />
                        Billing Gate
                      </Badge>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span className="font-medium">{milestone.progressPercent}%</span>
                    </div>
                    <Progress value={milestone.progressPercent} className="h-2" />
                    <div className="flex justify-end text-[10px] text-muted-foreground">
                      Target: {milestone.requiredCompletionRatio}% required
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-0 pb-4">
                  {/* Optional footer content could go here */}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {filteredMilestones.length === 0 && (
          <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
            <div className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4">
              <Flag className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No milestones found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mt-2">
              Try adjusting your filters or search query to find what you're looking for.
            </p>
            <Button variant="outline" className="mt-6" onClick={() => { setSearchQuery(""); setStatusFilter("all"); setStageFilter("all"); }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </Shell>
  );
}
