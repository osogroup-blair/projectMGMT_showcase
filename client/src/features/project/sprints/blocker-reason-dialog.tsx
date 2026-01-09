import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertOctagon } from "lucide-react";

interface BlockerReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle?: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

const COMMON_REASONS = [
  "Waiting for external dependency",
  "Waiting for review/approval",
  "Need more information",
  "Technical blocker",
  "Resource not available",
];

export function BlockerReasonDialog({
  open,
  onOpenChange,
  taskTitle,
  onConfirm,
  onCancel,
}: BlockerReasonDialogProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason.trim());
      setReason("");
    }
  };

  const handleCancel = () => {
    setReason("");
    onCancel();
  };

  const handleQuickSelect = (quickReason: string) => {
    setReason(quickReason);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) handleCancel();
      onOpenChange(o);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-amber-500" />
            Mark as Blocked
          </DialogTitle>
          <DialogDescription>
            {taskTitle ? (
              <>Marking "<span className="font-medium">{taskTitle}</span>" as blocked.</>
            ) : (
              "Please provide a reason for blocking this task."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="blocker-reason">What's blocking this task?</Label>
            <Textarea
              id="blocker-reason"
              placeholder="Describe the blocker..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
              data-testid="input-blocker-reason"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Quick select:</Label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_REASONS.map((r) => (
                <Button
                  key={r}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handleQuickSelect(r)}
                  data-testid={`quick-reason-${r.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {r}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} data-testid="button-cancel-blocker">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!reason.trim()}
            className="bg-amber-500 hover:bg-amber-600"
            data-testid="button-confirm-blocker"
          >
            Mark Blocked
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
