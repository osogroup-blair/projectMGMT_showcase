import { useState } from "react";
import { useLocation } from "wouter";
import { useUsers } from "@/features/user-management";
import { Button } from "@/components/ui/button";
import { Plus, Users, Shield, UserX, CheckCircle2, Search, Mail } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

interface ServiceOrgContentProps {
    embedded?: boolean;
}

export default function ServiceOrgContent({ embedded }: ServiceOrgContentProps) {
    const [, setLocation] = useLocation();
    const [searchQuery, setSearchQuery] = useState("");

    const { data: usersData, isLoading } = useUsers({
        userType: "internal",
        search: searchQuery || undefined,
        pageSize: 1000, // Fetch top 1000 internal users for overview
    });

    const users = usersData?.users || [];

    const handleInviteStaff = () => {
        // Navigate to users tab, wait a tick, and set search query and click Add User (Wait, ideally we just navigate to /admin/users and open dialog, but for now just navigate to /admin/users)
        setLocation("/admin/users");
    };

    const getInitials = (user: any) => {
        const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '';
        return name.substring(0, 2).toUpperCase();
    };

    const getDisplayName = (user: any) => {
        return user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown Staff';
    };

    // Stats calculation
    const totalStaff = users.length;
    const activeStaff = users.filter(u => u.status === "Active" || u.status === "Online").length;
    const adminStaff = users.filter(u => u.systemRole === "admin").length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Service Organization Directory</h2>
                    <p className="text-sm text-muted-foreground">
                        Overview of all internal staff members and their roles.
                    </p>
                </div>
                <Button onClick={handleInviteStaff}>
                    <Plus className="h-4 w-4 mr-2" />
                    Manage Internal Staff
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Total Staff</h3>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold">{totalStaff}</div>
                        <p className="text-xs text-muted-foreground">Internal team members</p>
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Active Staff</h3>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold">{activeStaff}</div>
                        <p className="text-xs text-muted-foreground">Currently active in system</p>
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Admins</h3>
                        <Shield className="h-4 w-4 text-purple-500" />
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold">{adminStaff}</div>
                        <p className="text-xs text-muted-foreground">System administrators</p>
                    </div>
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <div className="p-4 border-b">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search internal staff..."
                            className="pl-9 h-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Staff Member</TableHead>
                            <TableHead>Job Title</TableHead>
                            <TableHead>System Role</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">Loading staff...</TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No staff members found.</TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={user.profileImageUrl || undefined} />
                                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                                                    {getInitials(user)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{getDisplayName(user)}</span>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Mail className="h-3 w-3" />
                                                    {user.email || "No email"}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm">{user.jobTitle || <span className="text-muted-foreground italic">Not specified</span>}</span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={`text-xs font-normal ${user.systemRole === "admin" ? "bg-purple-100 text-purple-700" :
                                                user.systemRole === "manager" ? "bg-blue-100 text-blue-700" :
                                                    "bg-slate-100 text-slate-700"
                                                }`}
                                        >
                                            {user.systemRole || "member"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={`text-xs font-normal ${user.status === "Online" || user.status === "Active" ? "bg-green-100 text-green-700" :
                                                user.status === "Deactivated" ? "bg-red-100 text-red-700" :
                                                    "bg-slate-100 text-slate-700"
                                                }`}
                                        >
                                            {user.status || "Offline"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
