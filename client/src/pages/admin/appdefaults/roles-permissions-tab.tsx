import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SystemRole {
  id: string;
  name: string;
  label: string;
  description: string;
  order: number;
}

interface SystemPermission {
  id: string;
  key: string;
  label: string;
  description: string;
  category: string;
  order: number;
}

interface RolePermissionMatrix {
  roles: SystemRole[];
  permissions: SystemPermission[];
  matrix: Record<string, string[]>;
}

export function RolesPermissionsTab() {
  const queryClient = useQueryClient();
  const [updating, setUpdating] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<RolePermissionMatrix>({
    queryKey: ["/api/roles-permissions/matrix"],
    queryFn: async () => {
      const res = await fetch("/api/roles-permissions/matrix");
      if (!res.ok) throw new Error("Failed to fetch roles and permissions");
      return res.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ roleId, permissionId, enabled }: { roleId: string; permissionId: string; enabled: boolean }) => {
      const res = await fetch("/api/roles-permissions/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId, permissionId, enabled }),
      });
      if (!res.ok) throw new Error("Failed to update permission");
      return res.json();
    },
    onMutate: ({ roleId, permissionId }) => {
      setUpdating(`${roleId}-${permissionId}`);
    },
    onSettled: () => {
      setUpdating(null);
      queryClient.invalidateQueries({ queryKey: ["/api/roles-permissions/matrix"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Failed to load roles and permissions
        </CardContent>
      </Card>
    );
  }

  const { roles, permissions, matrix } = data;

  const permissionsByCategory = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, SystemPermission[]>);

  const categoryOrder = ["User Management", "Admin Access", "Projects", "Data Management"];
  const sortedCategories = Object.keys(permissionsByCategory).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  );

  const hasPermission = (roleId: string, permissionId: string) => {
    return matrix[roleId]?.includes(permissionId) || false;
  };

  const handleToggle = (role: SystemRole, permission: SystemPermission) => {
    const enabled = !hasPermission(role.id, permission.id);
    toggleMutation.mutate({ roleId: role.id, permissionId: permission.id, enabled });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Role-Permission Matrix</CardTitle>
          </div>
          <CardDescription>
            Configure which permissions are granted to each system role. 
            Users inherit permissions from their assigned role, plus any additional permissions granted directly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" data-testid="roles-permissions-matrix">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground w-64">
                    Permission
                  </th>
                  {roles.map((role) => (
                    <th 
                      key={role.id} 
                      className="text-center py-3 px-4 font-medium min-w-24"
                      data-testid={`role-header-${role.name}`}
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex flex-col items-center gap-1">
                              <Badge variant={role.name === "admin" ? "default" : "secondary"}>
                                {role.label}
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{role.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedCategories.map((category) => (
                  <>
                    <tr key={`cat-${category}`} className="bg-muted/50">
                      <td colSpan={roles.length + 1} className="py-2 px-4 font-semibold text-sm text-muted-foreground">
                        {category}
                      </td>
                    </tr>
                    {permissionsByCategory[category].map((permission) => (
                      <tr key={permission.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{permission.label}</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">{permission.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </td>
                        {roles.map((role) => {
                          const isChecked = hasPermission(role.id, permission.id);
                          const isUpdating = updating === `${role.id}-${permission.id}`;
                          
                          return (
                            <td key={`${role.id}-${permission.id}`} className="text-center py-3 px-4">
                              <div className="flex justify-center">
                                {isUpdating ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                ) : (
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={() => handleToggle(role, permission)}
                                    data-testid={`permission-${role.name}-${permission.key}`}
                                  />
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About Roles & Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 className="font-medium text-foreground mb-1">System Roles</h4>
            <ul className="list-disc ml-4 space-y-1">
              {roles.map((role) => (
                <li key={role.id}>
                  <span className="font-medium">{role.label}</span>: {role.description}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-1">How Permissions Work</h4>
            <p>
              Users are assigned a system role which grants them a base set of permissions. 
              Administrators can also grant additional individual permissions to specific users 
              via the User Management page.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
