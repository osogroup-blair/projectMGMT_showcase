import { useState } from "react";
import { MessageSquare, Paperclip, History, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TaskActivityTabProps {
  task: any;
}

export function TaskActivityTab({ task }: TaskActivityTabProps) {
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
    <Tabs defaultValue="comments" className="w-full">
      <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
        <TabsTrigger 
          value="comments" 
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 gap-2"
          data-testid="tab-comments"
        >
          <MessageSquare className="h-4 w-4" />
          Comments ({comments.length})
        </TabsTrigger>
        <TabsTrigger 
          value="attachments" 
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 gap-2"
          data-testid="tab-attachments"
        >
          <Paperclip className="h-4 w-4" />
          Attachments
        </TabsTrigger>
        <TabsTrigger 
          value="history" 
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 gap-2"
          data-testid="tab-history"
        >
          <History className="h-4 w-4" />
          History
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="comments" className="pt-6 space-y-6">
        {/* Comment Input */}
        <div className="flex gap-4">
          <Avatar>
            <AvatarFallback>CU</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea 
              placeholder="Write a comment..." 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              data-testid="textarea-new-comment"
            />
            <div className="flex justify-end">
              <Button 
                size="sm" 
                onClick={handleAddComment} 
                disabled={!newComment.trim()}
                data-testid="button-post-comment"
              >
                <Send className="h-3 w-3 mr-2" />
                Post Comment
              </Button>
            </div>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-4 group" data-testid={`comment-${comment.id}`}>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{comment.authorName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{comment.authorName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {comment.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="attachments" className="pt-6">
        <Card className="border-dashed flex items-center justify-center p-6 hover:bg-muted/50 transition-colors cursor-pointer">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Paperclip className="h-6 w-6" />
            <span className="text-sm font-medium">Upload File</span>
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="history" className="pt-6">
        <p className="text-sm text-muted-foreground">No history available.</p>
      </TabsContent>
    </Tabs>
  );
}
