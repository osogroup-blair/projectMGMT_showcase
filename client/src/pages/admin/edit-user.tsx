import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Shell } from "@/components/layout/shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { 
  ArrowLeft, 
  Save, 
  User,
  Mail,
  Briefcase,
  Shield,
  Link2,
  Unlink,
  Loader2,
  X,
  Plus,
  Clock,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { 
  useUserProfile,
  useUpdateUser,
  useLinkIdentity,
  useUnlinkIdentity,
  useAvailableSystems,
} from "@/features/user-management";
import { useRoleTemplates } from "@/hooks/use-nexus-data";
import type { IdentityPublic, LinkIdentityRequest } from "@shared/contracts/user-identity";

const getSystemIcon = (systemId: string) => {
  const icons: Record<string, string> = {
    google: "🔵",
    microsoft: "🟦",
    clickup: "🟣",
    jira: "🔷",
    asana: "🔶",
    github: "⚫",
    slack: "🟡",
  };
  return icons[systemId.toLowerCase()] || "🔗";
};

export default function EditUserPage() {
  const [match, params] = useRoute("/admin/users/:userId/edit");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const userId = params?.userId;

  const { data: profileData, isLoading: profileLoading, refetch: refetchProfile } = useUserProfile(userId || undefined);
  const updateUser = useUpdateUser();
  const linkIdentity = useLinkIdentity();
  const unlinkIdentity = useUnlinkIdentity();
  const { data: systems = [] } = useAvailableSystems();
  
  const { data: systemRoles = [] } = useQuery<{ id: string; name: string; label: string; description: string }[]>({
    queryKey: ["/api/roles-permissions/roles"],
    queryFn: async () => {
      const res = await fetch("/api/roles-permissions/roles", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch roles");
      return res.json();
    },
  });

  const { data: allPermissions = [] } = useQuery<{ id: string; key: string; displayName: string; category: string }[]>({
    queryKey: ["/api/roles-permissions/permissions"],
    queryFn: async () => {
      const res = await fetch("/api/roles-permissions/permissions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch permissions");
      return res.json();
    },
  });

  const { data: roleTemplates = [] } = useRoleTemplates();

  const [formData, setFormData] = useState({
    name: "",
    jobTitle: "",
    systemRole: "member",
    permissions: [] as string[],
    roleTemplateIds: [] as string[]
  });

  const [linkForm, setLinkForm] = useState<Partial<LinkIdentityRequest>>({
    systemId: "",
    externalUserId: "",
    externalUsername: "",
    externalEmail: "",
  });

  const [unlinkConfirm, setUnlinkConfirm] = useState<IdentityPublic | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (profileData) {
      setFormData({
        name: profileData.name || "",
        jobTitle: profileData.jobTitle || "",
        systemRole: (profileData as any).systemRole || "member",
        permissions: (profileData as any).permissions || [],
        roleTemplateIds: (profileData as any).roleTemplateIds || []
      });
    }
  }, [profileData]);

  const permissionsByCategory = (() => {
    const grouped: Record<string, typeof allPermissions> = {};
    for (const perm of allPermissions) {
      if (!grouped[perm.category]) {
        grouped[perm.category] = [];
      }
      grouped[perm.category].push(perm);
    }
    return grouped;
  })();

  const togglePermission = (permKey: string) => {
    const current = formData.permissions || [];
    const newPerms = current.includes(permKey)
      ? current.filter(p => p !== permKey)
      : [...current, permKey];
    setFormData({ ...formData, permissions: newPerms });
  };

  const toggleRoleTemplate = (roleId: string) => {
    const current = formData.roleTemplateIds || [];
    const newRoles = current.includes(roleId)
      ? current.filter(r => r !== roleId)
      : [...current, roleId];
    setFormData({ ...formData, roleTemplateIds: newRoles });
  };

  const handleSelectAllRoles = () => {
    setFormData({ ...formData, roleTemplateIds: roleTemplates.map(r => r.id) });
  };

  const handleClearAllRoles = () => {
    setFormData({ ...formData, roleTemplateIds: [] });
  };

  const handleSave = async () => {
    if (!userId) return;
    
    setIsSaving(true);
    try {
      await updateUser.mutateAsync({
        id: userId,
        data: {
          name: formData.name,
          jobTitle: formData.jobTitle,
          systemRole: formData.systemRole as any,
          permissions: formData.permissions,
          roleTemplateIds: formData.roleTemplateIds
        }
      });
      toast({ title: "User Updated", description: "User profile saved successfully." });
      setLocation("/admin/users");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLinkIdentity = async () => {
    if (!userId || !linkForm.systemId || !linkForm.externalUserId) {
      toast({ title: "Validation Error", description: "System and External ID are required.", variant: "destructive" });
      return;
    }

    try {
      await linkIdentity.mutateAsync({
        userId,
        data: linkForm as LinkIdentityRequest
      });
      toast({ title: "Account Linked", description: "External account has been linked successfully." });
      setLinkForm({ systemId: "", externalUserId: "", externalUsername: "", externalEmail: "" });
      refetchProfile();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleUnlinkIdentity = async () => {
    if (!userId || !unlinkConfirm) return;

    try {
      await unlinkIdentity.mutateAsync({ userId, identityId: unlinkConfirm.id });
      toast({ title: "Account Unlinked", description: "External account has been unlinked." });
      setUnlinkConfirm(null);
      refetchProfile();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (profileLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    );
  }

  if (!profileData) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
          <p className="text-muted-foreground">User not found</p>
          <Link href="/admin/users">
            <Button variant="outline">Back to Users</Button>
          </Link>
        </div>
      </Shell>
    );
  }

  const user = profileData;
  const identities = profileData.identities || [];

  return (
    <AuthGuard requiredRoles={["admin"]}>
      <Shell>
        <div className="flex flex-col h-[calc(100vh-4rem)] w-full max-w-5xl mx-auto">
          <div className="flex items-center justify-between py-6 border-b shrink-0 bg-background/95 backdrop-blur z-10">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Link href="/admin/users" className="hover:text-primary transition-colors flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" />
                  User Management
                </Link>
                <span className="text-border">/</span>
                <span>Edit Profile</span>
              </div>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback className="text-lg">{(user.name || user.email || "U").charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {user.name || user.email}
                  </h1>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/users">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button onClick={handleSave} className="gap-2" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden py-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="w-fit mb-6">
                <TabsTrigger value="profile" className="gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="permissions" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Role & Permissions
                </TabsTrigger>
                <TabsTrigger value="identities" className="gap-2">
                  <Link2 className="h-4 w-4" />
                  Linked Accounts
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto">
                <TabsContent value="profile" className="mt-0 h-full">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5 text-muted-foreground" />
                          Basic Information
                        </CardTitle>
                        <CardDescription>Update the user's profile details</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input 
                            id="name" 
                            value={formData.name} 
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter full name"
                            data-testid="input-edit-user-name"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="email">Email Address</Label>
                          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{user.email}</span>
                            <Badge variant="outline" className="ml-auto text-xs">Read-only</Badge>
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="jobTitle">Job Title</Label>
                          <Input 
                            id="jobTitle" 
                            value={formData.jobTitle} 
                            onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                            placeholder="e.g. Project Manager"
                            data-testid="input-edit-user-job-title"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-muted-foreground" />
                          Account Information
                        </CardTitle>
                        <CardDescription>User account details</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <Badge variant={user.status === "active" ? "default" : "secondary"}>
                            {user.status}
                          </Badge>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-muted-foreground">Created</span>
                          <span className="text-sm">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-muted-foreground">Linked Accounts</span>
                          <span className="text-sm">{identities.length} connected</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="permissions" className="mt-0 h-full">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-muted-foreground" />
                          System Role
                        </CardTitle>
                        <CardDescription>Assign the user's primary role in the system</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Select
                          value={formData.systemRole}
                          onValueChange={(v) => setFormData({ ...formData, systemRole: v })}
                        >
                          <SelectTrigger data-testid="select-edit-user-role">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {systemRoles.map(role => (
                              <SelectItem key={role.id} value={role.name}>
                                <div className="flex flex-col">
                                  <span>{role.label}</span>
                                  {role.description && (
                                    <span className="text-xs text-muted-foreground">{role.description}</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Briefcase className="h-5 w-5 text-muted-foreground" />
                              Project Execution Roles
                            </CardTitle>
                            <CardDescription>Roles this user can perform in projects</CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={handleSelectAllRoles}
                              disabled={formData.roleTemplateIds.length === roleTemplates.length}
                              data-testid="button-select-all-roles"
                            >
                              Select All
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={handleClearAllRoles}
                              disabled={formData.roleTemplateIds.length === 0}
                              data-testid="button-clear-all-roles"
                            >
                              Clear All
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[200px] pr-4">
                          {roleTemplates.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-50" />
                              <p>No role templates available</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {roleTemplates.map(role => (
                                <div 
                                  key={role.id} 
                                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                                >
                                  <Checkbox
                                    id={`role-${role.id}`}
                                    checked={formData.roleTemplateIds.includes(role.id)}
                                    onCheckedChange={() => toggleRoleTemplate(role.id)}
                                    data-testid={`checkbox-role-${role.id}`}
                                  />
                                  <label htmlFor={`role-${role.id}`} className="text-sm cursor-pointer flex-1 flex items-center gap-2">
                                    {role.name}
                                    {role.description && (
                                      <span className="text-xs text-muted-foreground">- {role.description}</span>
                                    )}
                                  </label>
                                  {formData.roleTemplateIds.includes(role.id) && (
                                    <Check className="h-4 w-4 text-primary" />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                        <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm text-muted-foreground">
                          <span>{formData.roleTemplateIds.length} of {roleTemplates.length} roles selected</span>
                          {formData.roleTemplateIds.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {formData.roleTemplateIds.slice(0, 3).map(id => {
                                const role = roleTemplates.find(r => r.id === id);
                                return role ? (
                                  <Badge key={id} variant="secondary" className="text-xs">{role.name}</Badge>
                                ) : null;
                              })}
                              {formData.roleTemplateIds.length > 3 && (
                                <Badge variant="outline" className="text-xs">+{formData.roleTemplateIds.length - 3} more</Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="lg:row-span-2">
                      <CardHeader>
                        <CardTitle>Additional Permissions</CardTitle>
                        <CardDescription>Grant extra permissions beyond the user's role</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[400px] pr-4">
                          {Object.entries(permissionsByCategory).map(([category, perms]) => (
                            <div key={category} className="mb-6">
                              <p className="text-xs font-semibold text-muted-foreground uppercase mb-3 tracking-wider">{category}</p>
                              <div className="space-y-2">
                                {perms.map(perm => (
                                  <div 
                                    key={perm.key} 
                                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                                  >
                                    <Checkbox
                                      id={`perm-${perm.key}`}
                                      checked={formData.permissions.includes(perm.key)}
                                      onCheckedChange={() => togglePermission(perm.key)}
                                      data-testid={`checkbox-edit-permission-${perm.key}`}
                                    />
                                    <label htmlFor={`perm-${perm.key}`} className="text-sm cursor-pointer flex-1">
                                      {perm.displayName}
                                    </label>
                                    {formData.permissions.includes(perm.key) && (
                                      <Check className="h-4 w-4 text-primary" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="identities" className="mt-0 h-full">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Link2 className="h-5 w-5 text-muted-foreground" />
                          Linked Accounts
                        </CardTitle>
                        <CardDescription>External accounts connected to this profile</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {identities.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Link2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No linked accounts</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {identities.map((identity) => (
                              <div key={identity.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className="text-xl">{getSystemIcon(identity.systemId)}</div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{identity.systemName || identity.systemId}</span>
                                      {identity.workspaceId && (
                                        <span className="text-xs text-muted-foreground">({identity.workspaceId})</span>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {identity.externalEmail || identity.externalUsername || identity.externalUserId}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setUnlinkConfirm(identity)}
                                  className="text-muted-foreground hover:text-destructive"
                                  data-testid={`button-unlink-${identity.id}`}
                                >
                                  <Unlink className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Plus className="h-5 w-5 text-muted-foreground" />
                          Link New Account
                        </CardTitle>
                        <CardDescription>Connect an external account to this user</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-2">
                          <Label>System</Label>
                          <SearchableSelect
                            value={linkForm.systemId || ""}
                            onValueChange={(v) => setLinkForm({ ...linkForm, systemId: v })}
                            placeholder="Select system"
                            options={systems.map(s => ({ value: s.id, label: s.name }))}
                            data-testid="select-link-system"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>External User ID</Label>
                          <Input
                            value={linkForm.externalUserId || ""}
                            onChange={(e) => setLinkForm({ ...linkForm, externalUserId: e.target.value })}
                            placeholder="User ID in external system"
                            data-testid="input-link-external-id"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Username (optional)</Label>
                          <Input
                            value={linkForm.externalUsername || ""}
                            onChange={(e) => setLinkForm({ ...linkForm, externalUsername: e.target.value })}
                            placeholder="Username in external system"
                            data-testid="input-link-username"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Email (optional)</Label>
                          <Input
                            value={linkForm.externalEmail || ""}
                            onChange={(e) => setLinkForm({ ...linkForm, externalEmail: e.target.value })}
                            placeholder="Email in external system"
                            data-testid="input-link-email"
                          />
                        </div>
                        <Button 
                          onClick={handleLinkIdentity} 
                          className="w-full gap-2"
                          disabled={linkIdentity.isPending || !linkForm.systemId || !linkForm.externalUserId}
                          data-testid="button-link-account"
                        >
                          {linkIdentity.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Link2 className="h-4 w-4" />
                          )}
                          Link Account
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>

        <AlertDialog open={!!unlinkConfirm} onOpenChange={(open) => !open && setUnlinkConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unlink Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to unlink this {unlinkConfirm?.systemName || unlinkConfirm?.systemId} account? 
                This won't delete any data but the user won't be able to sign in with this account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleUnlinkIdentity}>Unlink</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Shell>
    </AuthGuard>
  );
}
