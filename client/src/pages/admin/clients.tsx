import { useState } from "react";
import { useLocation } from "wouter";
import { useClients } from "@/hooks/use-clients";
import { Button } from "@/components/ui/button";
import { Eye, Plus, Pencil, Trash2, Building2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AdminClientsContentProps {
    embedded?: boolean;
}

export default function AdminClientsContent({ embedded }: AdminClientsContentProps) {
    const [, setLocation] = useLocation();
    const { allClients, isLoading, createClient, updateClient, deleteClient } = useClients();
    const { toast } = useToast();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<any>(null);
    const [formData, setFormData] = useState({ name: "", description: "" });

    if (isLoading) {
        return <div>Loading...</div>;
    }

    const handleCreate = async () => {
        try {
            await createClient.mutateAsync({ id: crypto.randomUUID(), ...formData });
            setIsCreateOpen(false);
            setFormData({ name: "", description: "" });
            toast({ title: "Success", description: "Client created successfully" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleUpdate = async () => {
        try {
            await updateClient.mutateAsync({ id: editingClient.id, ...formData });
            setEditingClient(null);
            setFormData({ name: "", description: "" });
            toast({ title: "Success", description: "Client updated successfully" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this client?")) return;
        try {
            await deleteClient.mutateAsync(id);
            toast({ title: "Success", description: "Client deleted successfully" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Clients</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage your organizations and their workspaces.
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Client
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Icon</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allClients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                                    No clients found. Click "Add Client" to create one.
                                </TableCell>
                            </TableRow>
                        ) : (
                            allClients.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell>
                                        <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </TableCell>
                                    <TableCell
                                        className="font-medium cursor-pointer hover:underline text-primary"
                                        onClick={() => setLocation(`/admin/clients/${client.id}`)}
                                    >
                                        {client.name}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 relative z-[1]">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="View Client"
                                                onClick={() => setLocation(`/admin/clients/${client.id}`)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Edit Client"
                                                onClick={() => {
                                                    setEditingClient(client);
                                                    setFormData({ name: client.name, description: client.description || "" });
                                                }}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Delete Client"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(client.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Client</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Client Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Client Description"
                            />
                        </div>
                        <div className="flex justify-end gap-2 text-sm pt-4">
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={!formData.name || createClient.isPending}>
                                {createClient.isPending ? "Creating..." : "Create Client"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Client</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Client Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Client Description"
                            />
                        </div>
                        <div className="flex justify-end gap-2 text-sm pt-4">
                            <Button variant="outline" onClick={() => setEditingClient(null)}>Cancel</Button>
                            <Button onClick={handleUpdate} disabled={!formData.name || updateClient.isPending}>
                                {updateClient.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
