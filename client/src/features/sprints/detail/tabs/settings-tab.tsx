import { useState, useEffect } from "react";
import { 
  Play,
  Square,
  Trash2,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

interface SettingsTabProps {
  sprint: any;
  ownerUser: any;
  isReadOnly: boolean;
  onSaveDates: (start: string, end: string, setEditing: (v: boolean) => void) => void;
  onSaveCapacity: (capacity: string, setEditing: (v: boolean) => void) => void;
  onAutoStartToggle: (checked: boolean) => void;
  onStartSprint: () => void;
  onCloseSprint: () => void;
  onDeleteSprint: () => void;
  onNotesChange: (notes: string) => void;
}

export function SettingsTab({
  sprint,
  ownerUser,
  isReadOnly,
  onSaveDates,
  onSaveCapacity,
  onAutoStartToggle,
  onStartSprint,
  onCloseSprint,
  onDeleteSprint,
  onNotesChange,
}: SettingsTabProps) {
  const [editStartDate, setEditStartDate] = useState(sprint?.startDate || "");
  const [editEndDate, setEditEndDate] = useState(sprint?.endDate || "");
  const [editCapacity, setEditCapacity] = useState(sprint?.capacityHours?.toString() || "");
  const [notes, setNotes] = useState(sprint?.notes || "");
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [isEditingCapacity, setIsEditingCapacity] = useState(false);

  useEffect(() => {
    if (sprint) {
      setEditStartDate(sprint.startDate || "");
      setEditEndDate(sprint.endDate || "");
      setEditCapacity(sprint.capacityHours?.toString() || "");
      setNotes(sprint.notes || "");
    }
  }, [sprint]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sprint Dates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditingDates && !isReadOnly ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input 
                    type="date" 
                    value={editStartDate} 
                    onChange={(e) => setEditStartDate(e.target.value)}
                    data-testid="input-start-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input 
                    type="date" 
                    value={editEndDate} 
                    onChange={(e) => setEditEndDate(e.target.value)}
                    data-testid="input-end-date"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onSaveDates(editStartDate, editEndDate, setIsEditingDates)}>Save</Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditingDates(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span>
                  {sprint?.startDate && sprint?.endDate 
                    ? `${format(new Date(sprint.startDate), "MMM d")} - ${format(new Date(sprint.endDate), "MMM d, yyyy")}`
                    : "No dates set"
                  }
                </span>
              </div>
              {!isReadOnly && (
                <Button variant="outline" size="sm" onClick={() => setIsEditingDates(true)}>
                  Edit Dates
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Capacity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditingCapacity && !isReadOnly ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Total Hours</Label>
                <Input 
                  type="number" 
                  value={editCapacity} 
                  onChange={(e) => setEditCapacity(e.target.value)}
                  placeholder="Enter team capacity in hours"
                  data-testid="input-capacity"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onSaveCapacity(editCapacity, setIsEditingCapacity)}>Save</Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditingCapacity(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p>{sprint?.capacityHours ? `${sprint.capacityHours} hours` : "Not set"}</p>
              {!isReadOnly && (
                <Button variant="outline" size="sm" onClick={() => setIsEditingCapacity(true)}>
                  Edit Capacity
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sprint Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => {
              if (notes !== sprint?.notes) {
                onNotesChange(notes);
              }
            }}
            placeholder="Add notes about this sprint..."
            className="min-h-[100px]"
            disabled={isReadOnly}
            data-testid="textarea-notes"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sprint Actions</CardTitle>
          <CardDescription>Start, close, or manage this sprint</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {sprint?.status === "planned" && (
              <Button onClick={onStartSprint} className="flex-1" data-testid="button-start-sprint-settings">
                <Play className="h-4 w-4 mr-2" />
                Start Sprint
              </Button>
            )}
            {sprint?.status === "active" && (
              <Button variant="secondary" onClick={onCloseSprint} className="flex-1" data-testid="button-close-sprint-settings">
                <Square className="h-4 w-4 mr-2" />
                Close Sprint
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sprint Owner</CardTitle>
        </CardHeader>
        <CardContent>
          {ownerUser ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{ownerUser.name?.charAt(0) || "?"}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{ownerUser.name}</div>
                <div className="text-sm text-muted-foreground">{ownerUser.email || ownerUser.username}</div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No owner assigned</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Automation</CardTitle>
          <CardDescription>Configure automatic sprint lifecycle actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-start" className="text-sm font-medium">Auto-start sprint</Label>
              <p className="text-xs text-muted-foreground">
                Automatically start the sprint when the start date is reached
              </p>
            </div>
            <Switch 
              id="auto-start"
              checked={sprint?.autoStart || false}
              onCheckedChange={onAutoStartToggle}
              disabled={isReadOnly || sprint?.status !== "planned"}
              data-testid="switch-auto-start"
            />
          </div>
          {sprint?.autoStart && sprint?.status === "planned" && (
            <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
              <CalendarIcon className="h-3 w-3 inline mr-1" />
              Will auto-start on {sprint.startDate ? format(new Date(sprint.startDate), "MMM d, yyyy") : "start date (not set)"}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 border-red-200">
        <CardHeader>
          <CardTitle className="text-base text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50">
            <div>
              <div className="font-medium">Delete Sprint</div>
              <div className="text-sm text-muted-foreground">Permanently delete this sprint and remove all task associations.</div>
            </div>
            <Button variant="destructive" onClick={onDeleteSprint} data-testid="button-delete-sprint">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
