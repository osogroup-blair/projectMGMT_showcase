import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useClients } from "@/hooks/use-clients";

import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Building2, Users, FolderKanban, LayoutDashboard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { type User, type ClientUser, type Project } from "@shared/schema";

export default function AdminClientDetail() {
    const { clientId } = useParams<{ clientId: string }>();
    const [, setLocation] = useLocation();
    const { allClients, isLoading: isLoadingClients } = useClients();
    const [activeTab, setActiveTab] = useState("dashboard");
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [selectedRole, setSelectedRole] = useState<string>("member");

    // Create User State
    const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
    const [newUserName, setNewUserName] = useState("");
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newUserClientRole, setNewUserClientRole] = useState("member");

    // Fetch all users
    const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
        queryKey: ["/api/users"],
        queryFn: async () => {
            const res = await fetch("/api/users?limit=1000");
            if (!res.ok) throw new Error("Failed to fetch users");
            const json = await res.json();
            return json.users || [];
        }
    });

    // Fetch system roles to sync
    const { data: systemRoles = [] } = useQuery<{ id: string; name: string; label: string; description: string }[]>({
        queryKey: ["/api/roles-permissions/roles"],
        queryFn: async () => {
            const res = await fetch("/api/roles-permissions/roles");
            if (!res.ok) throw new Error("Failed to fetch roles");
            return res.json();
        }
    });

    // Fetch client users mapping
    const { data: clientUsers = [], isLoading: isLoadingClientUsers } = useQuery<ClientUser[]>({
        queryKey: ["/api/clients", clientId, "users"],
        queryFn: async () => {
            const res = await fetch(`/api/clients/${clientId}/users`);
            if (!res.ok) throw new Error("Failed to fetch client users");
            return res.json();
        }
    });

    // Fetch projects for this client
    const { data: clientProjectsResponse, isLoading: isLoadingProjects } = useQuery({
        queryKey: ["/api/projects/paginated", clientId],
        queryFn: async () => {
            const res = await fetch(`/api/projects/paginated?clientId=${clientId}&limit=100`);
            if (!res.ok) throw new Error("Failed to fetch client projects");
            return res.json();
        }
    });
    const clientProjects: Project[] = clientProjectsResponse?.data || [];

    // Mutations for managing client users
    const createUser = useMutation({
        mutationFn: async (userData: { email: string, name: string, systemRole: string, userType: string }) => {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        onSuccess: (newUser) => {
            queryClient.setQueryData(["/api/users"], (oldUsers: User[] | undefined) => {
                if (!oldUsers) return [newUser];
                return [...oldUsers, newUser];
            });
            queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        },
        onError: (err: any) => toast({ title: "Error creating user", description: err.message, variant: "destructive" })
    });

    const assignUser = useMutation({
        mutationFn: async ({ userId, role }: { userId: string, role: string }) => {
            const res = await fetch(`/api/clients/${clientId}/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, role }),
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId, "users"] });
            toast({ title: "Successfully added user to client." });
            setSelectedUserId("");
            setSelectedRole("member");
        }
    });

    const handleCreateAndAssign = async () => {
        try {
            if (!newUserName.trim() || !newUserEmail.trim()) {
                toast({ title: "Validation Error", description: "Name and Email are required.", variant: "destructive" });
                return;
            }
            const newUser = await createUser.mutateAsync({
                email: newUserEmail,
                name: newUserName,
                systemRole: newUserClientRole,
                userType: "client"
            });
            await assignUser.mutateAsync({
                userId: newUser.id,
                role: newUserClientRole
            });
            setIsCreateUserOpen(false);
            setNewUserEmail("");
            setNewUserName("");
            setNewUserClientRole("member");
        } catch (e: any) {
            // Error toast is handled by mutations
        }
    };

    const removeUser = useMutation({
        mutationFn: async (userId: string) => {
            const res = await fetch(`/api/clients/${clientId}/users/${userId}`, { method: "DELETE" });
            if (!res.ok) throw new Error(await res.text());
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId, "users"] });
            toast({ title: "Successfully removed user from client." });
        },
        onError: (err: any) => toast({ title: "Error removing user", description: err.message, variant: "destructive" })
    });

    const updateRole = useMutation({
        mutationFn: async ({ userId, role }: { userId: string, role: string }) => {
            const res = await fetch(`/api/clients/${clientId}/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role }),
            });
            if (!res.ok) throw new Error(await res.text());
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId, "users"] });
            toast({ title: "Successfully updated user role." });
        },
        onError: (err: any) => toast({ title: "Error updating role", description: err.message, variant: "destructive" })
    });

    const client = useMemo(() => allClients.find(c => c.id === clientId), [allClients, clientId]);

    if (isLoadingClients) {
        return <div>Loading...</div>;
    }

    if (!client) {
        return (
            <Shell>
                <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                    <Building2 className="h-12 w-12 text-muted-foreground" />
                    <h2 className="text-xl font-semibold">Client not found</h2>
                    <Button variant="outline" onClick={() => setLocation('/admin/clients')}>
                        Back to Clients
                    </Button>
                </div>
            </Shell>
        );
    }

    return (
        <AuthGuard requiredRoles={["admin", "manager"]}>
            <Shell>
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setLocation('/admin/clients')}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
                            <p className="text-muted-foreground">Manage client details and access</p>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="grid w-full max-w-md grid-cols-3">
                            <TabsTrigger value="dashboard" className="flex items-center gap-2">
                                <LayoutDashboard className="h-4 w-4" />
                                <span className="hidden sm:inline">Overview</span>
                            </TabsTrigger>
                            <TabsTrigger value="users" className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span className="hidden sm:inline">Users</span>
                            </TabsTrigger>
                            <TabsTrigger value="projects" className="flex items-center gap-2">
                                <FolderKanban className="h-4 w-4" />
                                <span className="hidden sm:inline">Projects</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="dashboard" className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                                <div className="rounded-xl border bg-card text-card-foreground shadow">
                                    <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                                        <h3 className="tracking-tight text-sm font-medium">Total Linked Users</h3>
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="p-6 pt-0">
                                        <div className="text-2xl font-bold">{clientUsers.length}</div>
                                    </div>
                                </div>
                                <div className="rounded-xl border bg-card text-card-foreground shadow cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => setActiveTab('projects')}
                                >
                                    <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                                        <h3 className="tracking-tight text-sm font-medium">Total Projects</h3>
                                        <FolderKanban className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="p-6 pt-0">
                                        <div className="text-2xl font-bold">{clientProjects.length}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-md border p-6 bg-card text-card-foreground shadow">
                                <h3 className="text-lg font-medium mb-2">Description</h3>
                                <p className="text-muted-foreground whitespace-pre-wrap">
                                    {client.description || "No description provided."}
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="users" className="space-y-6">
                            <div className="rounded-md border p-6 bg-card text-card-foreground flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h3 className="text-lg font-medium">Assign User</h3>
                                    <p className="text-sm text-muted-foreground">Link an existing user or create a new one.</p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 items-end w-full sm:w-auto">
                                    <div className="space-y-2 flex-1">
                                        <p className="text-sm font-medium">Select User</p>
                                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a user..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {users
                                                    // Filter out users already assigned
                                                    .filter(u => !clientUsers.some(cu => cu.userId === u.id))
                                                    .map(u => (
                                                        <SelectItem key={u.id} value={u.id}>{u.name || u.email || u.id}</SelectItem>
                                                    ))
                                                }
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <p className="text-sm font-medium">Role</p>
                                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {systemRoles.map((r) => (
                                                    <SelectItem key={r.id} value={r.name}>{r.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        onClick={() => assignUser.mutate({ userId: selectedUserId, role: selectedRole })}
                                        disabled={!selectedUserId || assignUser.isPending}
                                    >
                                        Assign Existing User
                                    </Button>
                                    <div className="h-10 border-l mx-2 hidden sm:block"></div>
                                    <Button variant="outline" onClick={() => setIsCreateUserOpen(true)}>
                                        Create New User
                                    </Button>
                                </div>
                            </div>

                            <div className="rounded-md border bg-card text-card-foreground">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoadingClientUsers ? (
                                            <TableRow><TableCell colSpan={3} className="text-center">Loading...</TableCell></TableRow>
                                        ) : clientUsers.length === 0 ? (
                                            <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No users assigned to this client.</TableCell></TableRow>
                                        ) : (
                                            clientUsers.map(cu => {
                                                const user = users.find(u => u.id === cu.userId);
                                                return (
                                                    <TableRow key={cu.id}>
                                                        <TableCell>
                                                            <div
                                                                className="flex flex-col cursor-pointer hover:underline"
                                                                onClick={() => setLocation(`/admin/users/${cu.userId}/edit`)}
                                                            >
                                                                <span className="font-medium text-primary">
                                                                    {user?.name || "Unknown User"}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {user?.email || cu.userId}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Select
                                                                value={cu.role}
                                                                onValueChange={(val) => updateRole.mutate({ userId: cu.userId, role: val })}
                                                            >
                                                                <SelectTrigger className="w-32 h-8">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {systemRoles.map((r) => (
                                                                        <SelectItem key={r.id} value={r.name}>{r.label}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeUser.mutate(cu.userId)}
                                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                disabled={removeUser.isPending}
                                                            >
                                                                Remove
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        <TabsContent value="projects" className="space-y-6">
                            <div className="rounded-md border bg-card text-card-foreground">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Project Name</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Deadline</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoadingProjects ? (
                                            <TableRow><TableCell colSpan={3} className="text-center">Loading projects...</TableCell></TableRow>
                                        ) : clientProjects.length === 0 ? (
                                            <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">No projects assigned to this client.</TableCell></TableRow>
                                        ) : (
                                            clientProjects.map(project => (
                                                <TableRow key={project.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setLocation(`/projects/${project.id}`)}>
                                                    <TableCell className="font-medium">{project.name}</TableCell>
                                                    <TableCell>{project.status || "Upcoming"}</TableCell>
                                                    <TableCell>{project.deadline ? new Date(project.deadline).toLocaleDateString() : "N/A"}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Create New User Dialog */}
                <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New User</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Name / Organization</Label>
                                <Input
                                    value={newUserName}
                                    onChange={(e) => setNewUserName(e.target.value)}
                                    placeholder="Jane Doe"
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={newUserEmail}
                                    onChange={(e) => setNewUserEmail(e.target.value)}
                                    placeholder="jane@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Role in Client</Label>
                                <Select value={newUserClientRole} onValueChange={setNewUserClientRole}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {systemRoles.map((r) => (
                                            <SelectItem key={r.id} value={r.name}>{r.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-end gap-2 text-sm pt-4">
                                <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>Cancel</Button>
                                <Button
                                    onClick={handleCreateAndAssign}
                                    disabled={!newUserName || !newUserEmail || createUser.isPending || assignUser.isPending}
                                >
                                    {(createUser.isPending || assignUser.isPending) ? "Creating & Assigning..." : "Create & Assign"}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </Shell>
        </AuthGuard>
    );
}
