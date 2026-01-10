import { useState } from "react";
import { MessageSquare, Send, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTaskComments, useUsers } from "@/hooks/use-nexus-data";

interface TaskCommentsPanelProps {
  task: any;
  projectId: string;
}

export function TaskCommentsPanel({ task, projectId }: TaskCommentsPanelProps) {
  const [newComment, setNewComment] = useState("");
  const { data: comments, isLoading, create, remove } = useTaskComments(task?.id || "");
  const { data: users } = useUsers();
  
  const currentUser = users?.[0];

  const handleAddComment = () => {
    if (!newComment.trim() || !currentUser) return;
    
    create({
      authorId: currentUser.id,
      authorName: currentUser.name || "Unknown User",
      body: newComment,
    });
    setNewComment("");
  };

  const handleDeleteComment = (commentId: string) => {
    remove(commentId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

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
            disabled={!newComment.trim() || !currentUser}
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
              comments.map((comment: any) => (
                <div key={comment.id} className="flex gap-3 group" data-testid={`sidebar-comment-${comment.id}`}>
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="text-[10px]">{comment.authorName?.substring(0, 2).toUpperCase() || "??"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs truncate">{comment.authorName}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : ""}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 ml-auto"
                        onClick={() => handleDeleteComment(comment.id)}
                        data-testid={`button-delete-comment-${comment.id}`}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </Button>
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
