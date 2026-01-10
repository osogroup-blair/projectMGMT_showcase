import { useState } from "react";
import { Paperclip, Upload, File, Image, FileText, Trash2, Download, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface TaskAttachmentsTabProps {
  task: any;
  projectId: string;
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  url?: string;
}

export function TaskAttachmentsTab({ task, projectId }: TaskAttachmentsTabProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="h-8 w-8 text-blue-500" />;
    if (type.includes("pdf")) return <FileText className="h-8 w-8 text-red-500" />;
    return <File className="h-8 w-8 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDelete = (attachmentId: string) => {
    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Paperclip className="h-5 w-5" />
          <h3 className="text-base font-medium text-foreground">Attachments</h3>
          {attachments.length > 0 && (
            <Badge variant="secondary">{attachments.length}</Badge>
          )}
        </div>
        <Button size="sm" variant="outline" className="gap-2" data-testid="button-upload-attachment">
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </div>

      <Card 
        className={cn(
          "border-dashed flex items-center justify-center p-8 transition-colors cursor-pointer",
          isDragging ? "border-primary bg-primary/5" : "hover:bg-muted/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-testid="dropzone-attachments"
      >
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className={cn(
            "p-4 rounded-full bg-muted/50",
            isDragging && "bg-primary/10"
          )}>
            <Upload className={cn(
              "h-8 w-8",
              isDragging && "text-primary"
            )} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">
              {isDragging ? "Drop files here" : "Drag and drop files here"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or click to browse
            </p>
          </div>
        </div>
      </Card>

      {attachments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {attachments.map((attachment) => (
            <Card 
              key={attachment.id} 
              className="p-4 hover:shadow-md transition-shadow"
              data-testid={`attachment-${attachment.id}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {getFileIcon(attachment.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" title={attachment.name}>
                    {attachment.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.size)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {attachment.uploadedBy} • {new Date(attachment.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2">
                      <Download className="h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="gap-2 text-destructive"
                      onClick={() => handleDelete(attachment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Paperclip className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-sm">No attachments yet</p>
          <p className="text-xs mt-1">Upload files to share with your team</p>
        </div>
      )}
    </div>
  );
}
