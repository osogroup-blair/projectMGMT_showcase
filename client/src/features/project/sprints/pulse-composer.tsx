import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Plus, Sparkles, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompletedStatuses } from "@/hooks/use-completed-statuses";

interface Task {
  id: string;
  title: string;
  status: string;
  blocked?: boolean;
  blockerReason?: string;
}

interface PulseComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
  sprintId: string;
  onSubmit: (data: {
    didText: string;
    nextText: string;
    blockersText: string;
    referencedTaskIds: string[];
  }) => void;
}

export function PulseComposer({
  open,
  onOpenChange,
  tasks,
  sprintId,
  onSubmit,
}: PulseComposerProps) {
  const [didText, setDidText] = useState("");
  const [nextText, setNextText] = useState("");
  const [blockersText, setBlockersText] = useState("");
  const [referencedTaskIds, setReferencedTaskIds] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { isTaskComplete } = useCompletedStatuses();

  const doneTasks = tasks.filter(t => isTaskComplete(t.status));
  const inProgressTasks = tasks.filter(t => t.status === "In Progress");
  const blockedTasks = tasks.filter(t => t.blocked);

  const handleSuggestDid = () => {
    if (doneTasks.length > 0) {
      const titles = doneTasks.map(t => t.title).join(", ");
      setDidText(titles);
      setReferencedTaskIds(prev => Array.from(new Set([...prev, ...doneTasks.map(t => t.id)])));
    }
  };

  const handleSuggestNext = () => {
    if (inProgressTasks.length > 0) {
      const titles = inProgressTasks.map(t => t.title).join(", ");
      setNextText(titles);
      setReferencedTaskIds(prev => Array.from(new Set([...prev, ...inProgressTasks.map(t => t.id)])));
    }
  };

  const handleSuggestBlockers = () => {
    if (blockedTasks.length > 0) {
      const blockerInfo = blockedTasks.map(t => 
        t.blockerReason ? `${t.title}: ${t.blockerReason}` : t.title
      ).join("; ");
      setBlockersText(blockerInfo);
      setReferencedTaskIds(prev => Array.from(new Set([...prev, ...blockedTasks.map(t => t.id)])));
    }
  };

  const handleSubmit = () => {
    if (!didText.trim() && !nextText.trim() && !blockersText.trim()) return;
    
    onSubmit({
      didText: didText.trim(),
      nextText: nextText.trim(),
      blockersText: blockersText.trim(),
      referencedTaskIds,
    });

    setDidText("");
    setNextText("");
    setBlockersText("");
    setReferencedTaskIds([]);
    onOpenChange(false);
  };

  const hasContent = didText.trim() || nextText.trim() || blockersText.trim();

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between"
          data-testid="button-compose-pulse"
        >
          <span className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Post your update
          </span>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-green-600 font-medium">What did you accomplish?</Label>
            {doneTasks.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs gap-1"
                onClick={handleSuggestDid}
                data-testid="button-suggest-did"
              >
                <Sparkles className="h-3 w-3" />
                Suggest ({doneTasks.length})
              </Button>
            )}
          </div>
          <Textarea
            placeholder="Completed tasks, achievements..."
            value={didText}
            onChange={(e) => setDidText(e.target.value)}
            className="min-h-[60px] text-sm"
            data-testid="input-did-text"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-blue-600 font-medium">What's next?</Label>
            {inProgressTasks.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs gap-1"
                onClick={handleSuggestNext}
                data-testid="button-suggest-next"
              >
                <Sparkles className="h-3 w-3" />
                Suggest ({inProgressTasks.length})
              </Button>
            )}
          </div>
          <Textarea
            placeholder="Upcoming work, focus areas..."
            value={nextText}
            onChange={(e) => setNextText(e.target.value)}
            className="min-h-[60px] text-sm"
            data-testid="input-next-text"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-amber-600 font-medium">Any blockers?</Label>
            {blockedTasks.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs gap-1"
                onClick={handleSuggestBlockers}
                data-testid="button-suggest-blockers"
              >
                <Sparkles className="h-3 w-3" />
                Suggest ({blockedTasks.length})
              </Button>
            )}
          </div>
          <Textarea
            placeholder="Issues, dependencies, help needed..."
            value={blockersText}
            onChange={(e) => setBlockersText(e.target.value)}
            className="min-h-[60px] text-sm"
            data-testid="input-blockers-text"
          />
        </div>

        {referencedTaskIds.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-muted-foreground">Linked:</span>
            {referencedTaskIds.slice(0, 3).map(id => {
              const task = tasks.find(t => t.id === id);
              return task ? (
                <Badge key={id} variant="secondary" className="text-[10px]">
                  {task.title.slice(0, 20)}...
                </Badge>
              ) : null;
            })}
            {referencedTaskIds.length > 3 && (
              <Badge variant="secondary" className="text-[10px]">
                +{referencedTaskIds.length - 3} more
              </Badge>
            )}
          </div>
        )}

        <Button 
          onClick={handleSubmit} 
          disabled={!hasContent}
          className="w-full"
          data-testid="button-submit-pulse"
        >
          <Send className="h-4 w-4 mr-2" />
          Post Update
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
}
