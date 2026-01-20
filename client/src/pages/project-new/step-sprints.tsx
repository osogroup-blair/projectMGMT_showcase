import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2, RefreshCw, Plus, Calendar, AlertCircle, ChevronDown, CalendarPlus } from "lucide-react";
import { ProjectData } from "./types";
import { cn } from "@/lib/utils";

type SprintCadence = "none" | "imported" | "1" | "2" | "3" | "4";

interface SprintData {
  id: string;
  name: string;
  goal?: string | null;
  startDate: string;
  endDate: string;
  status?: string;
  capacityHours?: number | null;
}

interface StepSprintsProps {
  projectData: ProjectData;
  sprints: SprintData[];
  setSprints: React.Dispatch<React.SetStateAction<SprintData[]>>;
  hasImportedSprints: boolean;
}

function generateSprintsFromCadence(
  cadenceWeeks: number,
  projectStartDate: string,
  projectEndDate: string
): SprintData[] {
  if (cadenceWeeks <= 0 || !projectStartDate || !projectEndDate) {
    return [];
  }

  const sprints: SprintData[] = [];
  const start = new Date(projectStartDate);
  const end = new Date(projectEndDate);
  const sprintDurationMs = cadenceWeeks * 7 * 24 * 60 * 60 * 1000;

  let sprintNumber = 1;
  let currentStart = new Date(start);

  while (currentStart < end) {
    const currentEnd = new Date(currentStart.getTime() + sprintDurationMs - 24 * 60 * 60 * 1000);
    if (currentEnd > end) {
      currentEnd.setTime(end.getTime());
    }

    sprints.push({
      id: `sprint-${sprintNumber}-${Date.now()}`,
      name: `Sprint ${sprintNumber}`,
      startDate: currentStart.toISOString().split('T')[0],
      endDate: currentEnd.toISOString().split('T')[0],
    });

    currentStart = new Date(currentEnd.getTime() + 24 * 60 * 60 * 1000);
    sprintNumber++;
  }

  return sprints;
}

export function StepSprints({
  projectData,
  sprints,
  setSprints,
  hasImportedSprints,
}: StepSprintsProps) {
  const [cadence, setCadence] = useState<SprintCadence>(() => {
    if (hasImportedSprints && sprints.length > 0) {
      return "imported";
    }
    return "none";
  });

  const [lastGeneratedCadence, setLastGeneratedCadence] = useState<SprintCadence | null>(null);

  useEffect(() => {
    if (hasImportedSprints && sprints.length > 0 && cadence === "none") {
      setCadence("imported");
    }
  }, [hasImportedSprints, sprints.length]);

  const handleCadenceChange = (newCadence: SprintCadence) => {
    setCadence(newCadence);

    if (newCadence === "none") {
      setSprints([]);
      setLastGeneratedCadence(null);
    } else if (newCadence !== "imported") {
      const weeks = parseInt(newCadence);
      const generated = generateSprintsFromCadence(weeks, projectData.startDate, projectData.dueDate);
      setSprints(generated);
      setLastGeneratedCadence(newCadence);
    }
  };

  const handleReapplyDates = () => {
    if (cadence === "none" || cadence === "imported") return;

    const weeks = parseInt(cadence);
    const generated = generateSprintsFromCadence(weeks, projectData.startDate, projectData.dueDate);
    setSprints(generated);
    setLastGeneratedCadence(cadence);
  };

  const handleSprintNameChange = (sprintId: string, name: string) => {
    setSprints(prev => prev.map(s => s.id === sprintId ? { ...s, name } : s));
  };

  const handleSprintDateChange = (sprintId: string, field: "startDate" | "endDate", value: string) => {
    setSprints(prev => prev.map(s => s.id === sprintId ? { ...s, [field]: value } : s));
  };

  const handleDeleteSprint = (sprintId: string) => {
    setSprints(prev => prev.filter(s => s.id !== sprintId));
  };

  const handleAddSprint = () => {
    const lastSprint = sprints[sprints.length - 1];
    let newStartDate = projectData.startDate;
    let newEndDate = projectData.dueDate;

    if (lastSprint?.endDate) {
      const lastEnd = new Date(lastSprint.endDate);
      lastEnd.setDate(lastEnd.getDate() + 1);
      newStartDate = lastEnd.toISOString().split('T')[0];
      
      const cadenceWeeks = cadence !== "none" && cadence !== "imported" ? parseInt(cadence) : 2;
      const newEnd = new Date(lastEnd);
      newEnd.setDate(newEnd.getDate() + cadenceWeeks * 7 - 1);
      newEndDate = newEnd.toISOString().split('T')[0];
    }

    setSprints(prev => [...prev, {
      id: `sprint-${prev.length + 1}-${Date.now()}`,
      name: `Sprint ${prev.length + 1}`,
      startDate: newStartDate,
      endDate: newEndDate,
    }]);
  };

  const handleFillRemaining = (weeks: number) => {
    if (!projectData.dueDate) return;
    
    const projectEnd = new Date(projectData.dueDate);
    const lastSprint = sprints[sprints.length - 1];
    
    let fillStartDate: Date;
    if (lastSprint?.endDate) {
      fillStartDate = new Date(lastSprint.endDate);
      fillStartDate.setDate(fillStartDate.getDate() + 1);
    } else {
      fillStartDate = new Date(projectData.startDate);
    }
    
    if (fillStartDate >= projectEnd) return;
    
    const newSprints: SprintData[] = [];
    const sprintDurationMs = weeks * 7 * 24 * 60 * 60 * 1000;
    let currentStart = new Date(fillStartDate);
    let sprintNumber = sprints.length + 1;
    
    while (currentStart < projectEnd) {
      const currentEnd = new Date(currentStart.getTime() + sprintDurationMs - 24 * 60 * 60 * 1000);
      if (currentEnd > projectEnd) {
        currentEnd.setTime(projectEnd.getTime());
      }
      
      newSprints.push({
        id: `sprint-${sprintNumber}-${Date.now()}`,
        name: `Sprint ${sprintNumber}`,
        startDate: currentStart.toISOString().split('T')[0],
        endDate: currentEnd.toISOString().split('T')[0],
      });
      
      currentStart = new Date(currentEnd.getTime() + 24 * 60 * 60 * 1000);
      sprintNumber++;
    }
    
    if (newSprints.length > 0) {
      setSprints(prev => [...prev, ...newSprints]);
    }
  };

  const hasRemainingTime = (() => {
    if (!projectData.dueDate) return false;
    const projectEnd = new Date(projectData.dueDate);
    const lastSprint = sprints[sprints.length - 1];
    if (!lastSprint?.endDate) return true;
    const lastEnd = new Date(lastSprint.endDate);
    return lastEnd < projectEnd;
  })();

  const cadenceOptions = [
    { value: "none", label: "No Sprints", description: "This project won't use sprint-based planning" },
    ...(hasImportedSprints ? [{ value: "imported", label: "Use Imported Sprints", description: `${sprints.length} sprints from your import file` }] : []),
    { value: "1", label: "1 Week Sprints", description: "Short, focused iterations" },
    { value: "2", label: "2 Week Sprints", description: "Standard agile cadence (Recommended)" },
    { value: "3", label: "3 Week Sprints", description: "Extended iteration period" },
    { value: "4", label: "4 Week Sprints", description: "Monthly sprint cycles" },
  ];

  const projectDatesValid = projectData.startDate && projectData.dueDate;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Sprint Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Choose how you want to organize work into time-boxed iterations. Sprints help teams plan and deliver work in regular cycles.
        </p>
      </div>

      {!projectDatesValid && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Please set project start and end dates in Project Basics to generate sprints.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <Label>Sprint Cadence</Label>
        <RadioGroup
          value={cadence}
          onValueChange={(v) => handleCadenceChange(v as SprintCadence)}
          className="grid gap-3"
        >
          {cadenceOptions.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors",
                cadence === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <RadioGroupItem value={option.value} className="mt-0.5" />
              <div className="flex-1">
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-muted-foreground">{option.description}</div>
              </div>
            </label>
          ))}
        </RadioGroup>
      </div>

      {cadence !== "none" && sprints.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Sprint Schedule ({sprints.length} sprints)</Label>
            <div className="flex gap-2">
              {cadence !== "imported" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReapplyDates}
                  disabled={!projectDatesValid}
                  data-testid="button-reapply-dates"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Re-apply Dates
                </Button>
              )}
              {cadence === "imported" && hasRemainingTime && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!projectDatesValid}
                      data-testid="button-fill-remaining"
                    >
                      <CalendarPlus className="h-4 w-4 mr-1" />
                      Fill Remaining
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleFillRemaining(1)} data-testid="fill-1-week">
                      1 Week Sprints
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleFillRemaining(2)} data-testid="fill-2-week">
                      2 Week Sprints
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleFillRemaining(3)} data-testid="fill-3-week">
                      3 Week Sprints
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleFillRemaining(4)} data-testid="fill-4-week">
                      4 Week Sprints
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSprint}
                data-testid="button-add-sprint"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Sprint
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {sprints.map((sprint, index) => (
              <Card key={sprint.id} className="relative">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        value={sprint.name}
                        onChange={(e) => handleSprintNameChange(sprint.id, e.target.value)}
                        placeholder="Sprint name"
                        className="h-9"
                        data-testid={`input-sprint-name-${index}`}
                      />
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <Input
                          type="date"
                          value={sprint.startDate || ""}
                          onChange={(e) => handleSprintDateChange(sprint.id, "startDate", e.target.value)}
                          className="h-9"
                          data-testid={`input-sprint-start-${index}`}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">to</span>
                        <Input
                          type="date"
                          value={sprint.endDate || ""}
                          onChange={(e) => handleSprintDateChange(sprint.id, "endDate", e.target.value)}
                          className="h-9 flex-1"
                          data-testid={`input-sprint-end-${index}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteSprint(sprint.id)}
                          data-testid={`button-delete-sprint-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {cadence !== "none" && sprints.length === 0 && projectDatesValid && (
        <div className="text-center py-8 border rounded-lg border-dashed">
          <p className="text-muted-foreground mb-2">No sprints configured</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddSprint}
            data-testid="button-add-first-sprint"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add First Sprint
          </Button>
        </div>
      )}

      <div className="bg-muted/30 rounded-lg p-4">
        <h4 className="font-medium text-sm mb-2">About Sprints</h4>
        <p className="text-sm text-muted-foreground">
          Sprints are fixed-length iterations where teams commit to completing a set of tasks. 
          You can assign tasks to sprints after the project is created, or during import if your data includes sprint assignments.
        </p>
      </div>
    </div>
  );
}
