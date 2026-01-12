import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  statusOptions: { id: string; label: string; color?: string }[];
  users: any[];
  onApply: (field: string, value: string) => void;
}

export function BulkEditDialog({
  open,
  onOpenChange,
  selectedCount,
  statusOptions,
  users,
  onApply,
}: BulkEditDialogProps) {
  const [bulkEditField, setBulkEditField] = useState("");
  const [bulkEditValue, setBulkEditValue] = useState("");

  const handleApply = () => {
    onApply(bulkEditField, bulkEditValue);
    setBulkEditField("");
    setBulkEditValue("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      onOpenChange(o);
      if (!o) {
        setBulkEditField("");
        setBulkEditValue("");
      }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Bulk Edit {selectedCount} Task{selectedCount !== 1 ? "s" : ""}
          </DialogTitle>
          <DialogDescription>
            Select a field to update for all selected tasks.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Field to update</Label>
            <Select value={bulkEditField} onValueChange={setBulkEditField}>
              <SelectTrigger data-testid="select-bulk-field">
                <SelectValue placeholder="Select a field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="effort">Effort (Story Points)</SelectItem>
                <SelectItem value="assigneeId">Assignee</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {bulkEditField === "status" && (
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={bulkEditValue} onValueChange={setBulkEditValue}>
                <SelectTrigger data-testid="select-bulk-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status: any) => (
                    <SelectItem key={status.id} value={status.label}>
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", status.color?.split(" ")[0] || "bg-gray-200")} />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {bulkEditField === "priority" && (
            <div className="space-y-2">
              <Label>New Priority</Label>
              <Select value={bulkEditValue} onValueChange={setBulkEditValue}>
                <SelectTrigger data-testid="select-bulk-priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {bulkEditField === "effort" && (
            <div className="space-y-2">
              <Label>New Effort</Label>
              <Input 
                type="number" 
                value={bulkEditValue} 
                onChange={(e) => setBulkEditValue(e.target.value)}
                placeholder="Enter story points"
                data-testid="input-bulk-effort"
              />
            </div>
          )}

          {bulkEditField === "assigneeId" && (
            <div className="space-y-2">
              <Label>New Assignee</Label>
              <Select value={bulkEditValue} onValueChange={setBulkEditValue}>
                <SelectTrigger data-testid="select-bulk-assignee">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {(users || []).map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-bulk-edit"
          >
            Cancel
          </Button>
          <Button 
            disabled={!bulkEditField || !bulkEditValue}
            onClick={handleApply}
            data-testid="button-apply-bulk-edit"
          >
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
