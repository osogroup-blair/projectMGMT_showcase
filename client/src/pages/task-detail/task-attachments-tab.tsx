import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { Paperclip, Upload, File, Image, FileText, Trash2, Download, MoreHorizontal, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useTaskAttachments, useUsers } from "@/hooks/use-nexus-data";
import { toast } from "sonner";

interface TaskAttachmentsTabProps {
  task: any;
  projectId: string;
}

export function TaskAttachmentsTab({ task, projectId }: TaskAttachmentsTabProps) {
  const { data: attachments, isLoading, create, delete: deleteAttachment, isCreating, isDeleting } = useTaskAttachments(task.id);
  const { data: users } = useUsers();
  const [isDragging, setIsDragging] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getUserName = (userId: string) => {
    const user = users?.find((u: any) => u.id === userId);
    return user?.name || user?.email || userId;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="h-8 w-8 text-blue-500" />;
    if (type.includes("pdf")) return <FileText className="h-8 w-8 text-red-500" />;
    return <File className="h-8 w-8 text-muted-foreground" />;
  };

  const formatFileSize = (size: string | number) => {
    const bytes = typeof size === 'string' ? parseInt(size, 10) : size;
    if (bytes === 0 || isNaN(bytes)) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    await uploadFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFiles = async (files: File[]) => {
    for (const file of files) {
      try {
        const url = `file://${file.name}`;
        
        await create({
          fileName: file.name,
          url: url,
          fileType: file.type || 'application/octet-stream',
          size: String(file.size),
        });
        
        toast.success(`Uploaded ${file.name}`);
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  };

  const handleDelete = async () => {
    if (!attachmentToDelete) return;
    
    try {
      await deleteAttachment(attachmentToDelete);
      toast.success("Attachment deleted");
    } catch (error) {
      toast.error("Failed to delete attachment");
    } finally {
      setDeleteDialogOpen(false);
      setAttachmentToDelete(null);
    }
  };

  const confirmDelete = (attachmentId: string) => {
    setAttachmentToDelete(attachmentId);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
        <Button 
          size="sm" 
          variant="outline" 
          className="gap-2" 
          data-testid="button-upload-attachment"
          onClick={() => fileInputRef.current?.click()}
          disabled={isCreating}
        >
          {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      <Card 
        className={cn(
          "border-dashed flex items-center justify-center p-8 transition-colors cursor-pointer",
          isDragging ? "border-primary bg-primary/5" : "hover:bg-muted/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
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
          {attachments.map((attachment: any) => (
            <Card 
              key={attachment.id} 
              className="p-4 hover:shadow-md transition-shadow"
              data-testid={`attachment-${attachment.id}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {getFileIcon(attachment.fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" title={attachment.fileName}>
                    {attachment.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.size)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getUserName(attachment.uploadedBy)} • {new Date(attachment.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {attachment.url && 
                     !attachment.url.startsWith('file://') && 
                     (attachment.url.startsWith('http://') || attachment.url.startsWith('https://')) && (
                      <DropdownMenuItem className="gap-2" asChild>
                        <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          Open
                        </a>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="gap-2">
                      <Download className="h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="gap-2 text-destructive"
                      onClick={() => confirmDelete(attachment.id)}
                      disabled={isDeleting}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attachment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
