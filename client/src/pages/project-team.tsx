import { useState } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Users,
  Shield,
  Briefcase,
  PenTool,
  Code,
  BarChart,
  UserPlus,
  ArrowRight,
  User as UserIcon,
  Crown,
  Bug,
  Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRoute, Link } from "wouter";
import { 
  PROJECT_ROLES, 
  ROLE_ASSIGNMENTS, 
  TEAM, 
  TeamMember,
  ProjectRole,
  RoleAssignment
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const ROLE_TYPE_ICONS = {
  "Management": Briefcase,
  "Discovery": Search,
  "Design": PenTool,
  "Development": Code,
  "QA & Testing": Bug,
  "Launch": Rocket
};

const ROLE_TYPE_COLORS = {
  "Management": "text-purple-600 bg-purple-100",
  "Discovery": "text-indigo-600 bg-indigo-100",
  "Design": "text-pink-600 bg-pink-100",
  "Development": "text-blue-600 bg-blue-100",
  "QA & Testing": "text-amber-600 bg-amber-100",
  "Launch": "text-green-600 bg-green-100"
};

export default function ProjectTeam() {
  const [match, params] = useRoute("/projects/:projectId/team");
  const projectId = params?.projectId || "1";
  const [searchQuery, setSearchQuery] = useState("");

  const getAssigneesForRole = (roleId: string) => {
    return ROLE_ASSIGNMENTS
      .filter(ra => ra.roleId === roleId)
      .map(ra => {
        const user = TEAM.find(u => u.id === ra.userId);
        return { ...user, assignment: ra };
      })
      .filter((u): u is TeamMember & { assignment: RoleAssignment } => !!u);
  };

  const getRolesForUser = (userId: string) => {
    return ROLE_ASSIGNMENTS
      .filter(ra => ra.userId === userId)
      .map(ra => {
        const role = PROJECT_ROLES.find(r => r.id === ra.roleId);
        return { ...role, assignment: ra };
      })
      .filter((r): r is ProjectRole & { assignment: RoleAssignment } => !!r);
  };

  const filteredRoles = PROJECT_ROLES.filter(role => 
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    role.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTeam = TEAM.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Shell>
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Team & Roles</h1>
            <p className="text-muted-foreground">Manage project team structure and role assignments.</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/projects/${projectId}/roles`}>
              <Button variant="outline" className="gap-2">
                <Shield className="h-4 w-4" />
                Manage Roles
              </Button>
            </Link>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Member
            </Button>
          </div>
        </div>

        <Tabs defaultValue="roles" className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="roles" className="gap-2">
                <Shield className="h-4 w-4" />
                Roles Overview
              </TabsTrigger>
              <TabsTrigger value="people" className="gap-2">
                <Users className="h-4 w-4" />
                Team Members
              </TabsTrigger>
            </TabsList>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <TabsContent value="roles" className="space-y-6">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Role Details</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Requirements</TableHead>
                    <TableHead>Assignees</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.map(role => {
                    const assignees = getAssigneesForRole(role.id);
                    const Icon = ROLE_TYPE_ICONS[role.roleType] || Briefcase;
                    
                    return (
                      <TableRow key={role.id}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{role.name}</span>
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {role.description}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cn("gap-1 font-normal", ROLE_TYPE_COLORS[role.roleType] || "bg-muted")}>
                            <Icon className="h-3 w-3" />
                            {role.roleType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                            {role.isRequired && (
                              <span className="text-amber-600 font-medium flex items-center gap-1">
                                <AlertCircleIcon className="h-3 w-3" /> Required
                              </span>
                            )}
                            {role.maxAssignees && (
                              <span>Max {role.maxAssignees} people</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                              {assignees.map(user => (
                                <Avatar key={user.id} className="h-8 w-8 border-2 border-background ring-1 ring-border">
                                  <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                                    {user.name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {assignees.length === 0 && (
                                <span className="text-xs text-muted-foreground italic pl-2">Unassigned</span>
                              )}
                            </div>
                            {assignees.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                ({assignees.length})
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="people">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeam.map(member => {
                const roles = getRolesForUser(member.id);
                
                return (
                  <Card key={member.id} className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center gap-4 p-4 pb-2 space-y-0">
                      <Avatar className="h-12 w-12 border-2 border-primary/10">
                        <AvatarFallback className="text-lg bg-primary/5 text-primary">
                          {member.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{member.name}</CardTitle>
                        <CardDescription className="truncate flex items-center gap-1.5">
                          <span className={cn(
                            "inline-block w-2 h-2 rounded-full",
                            member.status === "Online" ? "bg-green-500" : 
                            member.status === "In Meeting" ? "bg-amber-500" : "bg-slate-300"
                          )} />
                          {member.email}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>Edit Permissions</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Remove from Project</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="space-y-3">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Assigned Roles
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {roles.length > 0 ? roles.map(role => (
                            <Badge 
                              key={role.id} 
                              variant={role.assignment.isPrimary ? "default" : "outline"}
                              className={cn(
                                "gap-1.5 pl-1.5",
                                !role.assignment.isPrimary && "text-muted-foreground border-dashed"
                              )}
                            >
                              {role.assignment.isPrimary && <Crown className="h-3 w-3 text-yellow-300 fill-yellow-300" />}
                              {role.name}
                              <span className="ml-1 opacity-60 text-[10px]">
                                {role.assignment.allocationPercent}%
                              </span>
                            </Badge>
                          )) : (
                            <span className="text-sm text-muted-foreground italic">No specific roles assigned</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
}

function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" x2="12" y1="8" y2="12"/>
      <line x1="12" x2="12.01" y1="16" y2="16"/>
    </svg>
  )
}
