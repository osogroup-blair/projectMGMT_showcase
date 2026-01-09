import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TaskCommentsPanelProps {
  task: any;
  projectId: string;
}

export function TaskCommentsPanel({ task, projectId }: TaskCommentsPanelProps) {
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([
    { id: "c1", authorName: "Joy Mason", body: "Initial task setup complete.", createdAt: new Date().toISOString() }
  ]);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment = {
      id: `c_${Date.now()}`,
      authorName: "Current User",
      body: newComment,
      createdAt: new Date().toISOString()
    };
    
    setComments(prev => [...prev, comment]);
    setNewComment("");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea 
            placeholder="Write a comment..." 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] resize-none"
            data-testid="textarea-sidebar-comment"
          />
          <Button 
            size="sm" 
            className="w-full"
            onClick={handleAddComment} 
            disabled={!newComment.trim()}
            data-testid="button-sidebar-post-comment"
          >
            <Send className="h-3 w-3 mr-2" />
            Post Comment
          </Button>
        </div>

        <ScrollArea className="h-[300px]">
          <div className="space-y-4 pr-4">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3" data-testid={`sidebar-comment-${comment.id}`}>
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="text-[10px]">{comment.authorName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs truncate">{comment.authorName}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/90 leading-relaxed">
                      {comment.body}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
