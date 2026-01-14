import { useState, useEffect } from "react";
import { Shell } from "@/components/layout/shell";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfile, useUpdateProfile, useLinkIdentity, useUnlinkIdentity, useAvailableSystems } from "@/features/user-management";
import { useRoleTemplates } from "@/hooks/use-nexus-data";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Mail, Briefcase, Link2, Unlink, Plus, Loader2, ExternalLink, Clock, CheckCircle2, AlertCircle, RefreshCw, Users } from "lucide-react";
import type { IdentityPublic, LinkIdentityRequest } from "@shared/contracts/user-identity";

function getSystemIcon(systemId: string) {
  const icons: Record<string, string> = {
    clickup: "🎯",
    jira: "🔷",
    asana: "🟠",
    monday: "📅",
    trello: "📋",
    google: "🔵",
    microsoft: "🟦",
    slack: "💬",
    github: "⚫",
    gitlab: "🦊",
  };
  return icons[systemId] || "🔗";
}

function getSyncStatusBadge(status: string | null) {
  switch (status) {
    case "healthy":
      return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Synced</Badge>;
    case "stale":
      return <Badge variant="outline" className="text-amber-600 border-amber-600"><Clock className="w-3 h-3 mr-1" /> Stale</Badge>;
    case "error":
      return <Badge variant="outline" className="text-red-600 border-red-600"><AlertCircle className="w-3 h-3 mr-1" /> Error</Badge>;
    case "syncing":
      return <Badge variant="outline" className="text-blue-600 border-blue-600"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Syncing</Badge>;
    default:
      return null;
  }
}

function IdentityCard({ 
  identity, 
  canUnlink, 
  onUnlink 
}: { 
  identity: IdentityPublic; 
  canUnlink: boolean;
  onUnlink: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card" data-testid={`identity-card-${identity.id}`}>
      <div className="flex items-center gap-4">
        <div className="text-2xl">{getSystemIcon(identity.systemId)}</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{identity.systemName || identity.systemId}</span>
            {identity.workspaceId && (
              <span className="text-sm text-muted-foreground">({identity.workspaceId})</span>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {identity.externalUsername || identity.externalEmail || identity.externalUserId}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={identity.status === "active" ? "default" : "secondary"}>
              {identity.status}
            </Badge>
            {getSyncStatusBadge(identity.syncStatus)}
          </div>
        </div>
      </div>
      {canUnlink && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onUnlink}
          className="text-destructive hover:text-destructive"
          data-testid={`unlink-identity-${identity.id}`}
        >
          <Unlink className="w-4 h-4 mr-1" />
          Unlink
        </Button>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: profile, isLoading } = useUserProfile(user?.id);
  const { data: systems = [] } = useAvailableSystems();
  const { data: roleTemplates = [] } = useRoleTemplates();
  const updateProfile = useUpdateProfile();
  const linkIdentity = useLinkIdentity();
  const unlinkIdentity = useUnlinkIdentity();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    firstName: "",
    lastName: "",
    jobTitle: "",
  });

  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkForm, setLinkForm] = useState<Partial<LinkIdentityRequest>>({
    systemId: "",
    externalUserId: "",
    externalUsername: "",
    externalEmail: "",
  });

  const [unlinkConfirm, setUnlinkConfirm] = useState<IdentityPublic | null>(null);
  const [selectedRoleTemplateIds, setSelectedRoleTemplateIds] = useState<string[]>([]);
  const [isEditingRoles, setIsEditingRoles] = useState(false);

  useEffect(() => {
    if (profile?.roleTemplateIds) {
      setSelectedRoleTemplateIds(profile.roleTemplateIds);
    }
  }, [profile?.roleTemplateIds]);

  const handleStartEdit = () => {
    if (profile) {
      setEditForm({
        name: profile.name || "",
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        jobTitle: profile.jobTitle || "",
      });
      setIsEditing(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    try {
      await updateProfile.mutateAsync({
        userId: user.id,
        data: editForm,
      });
      setIsEditing(false);
      toast({ title: "Profile updated successfully" });
    } catch (error: any) {
      toast({ title: "Failed to update profile", description: error.message, variant: "destructive" });
    }
  };

  const handleLinkIdentity = async () => {
    if (!user?.id || !linkForm.systemId || !linkForm.externalUserId) return;
    
    const selectedSystem = systems.find(s => s.id === linkForm.systemId);
    
    try {
      await linkIdentity.mutateAsync({
        userId: user.id,
        data: {
          systemId: linkForm.systemId,
          systemType: selectedSystem?.type,
          systemName: selectedSystem?.name,
          externalUserId: linkForm.externalUserId,
          externalUsername: linkForm.externalUsername || undefined,
          externalEmail: linkForm.externalEmail || undefined,
          identityType: "user",
          auth: {
            authType: "imported",
            provider: linkForm.systemId,
          },
        },
      });
      setIsLinkDialogOpen(false);
      setLinkForm({ systemId: "", externalUserId: "", externalUsername: "", externalEmail: "" });
      toast({ title: "Identity linked successfully" });
    } catch (error: any) {
      toast({ title: "Failed to link identity", description: error.message, variant: "destructive" });
    }
  };

  const handleUnlinkIdentity = async () => {
    if (!user?.id || !unlinkConfirm) return;
    try {
      await unlinkIdentity.mutateAsync({
        userId: user.id,
        identityId: unlinkConfirm.id,
      });
      setUnlinkConfirm(null);
      toast({ title: "Identity unlinked successfully" });
    } catch (error: any) {
      toast({ title: "Failed to unlink identity", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleRoleTemplate = (roleTemplateId: string) => {
    setSelectedRoleTemplateIds(prev =>
      prev.includes(roleTemplateId)
        ? prev.filter(id => id !== roleTemplateId)
        : [...prev, roleTemplateId]
    );
  };

  const handleSaveRoleTemplates = async () => {
    if (!user?.id) return;
    try {
      await updateProfile.mutateAsync({
        userId: user.id,
        data: { roleTemplateIds: selectedRoleTemplateIds },
      });
      setIsEditingRoles(false);
      toast({ title: "Roles updated successfully" });
    } catch (error: any) {
      toast({ title: "Failed to update roles", description: error.message, variant: "destructive" });
    }
  };

  const handleCancelRoleEdit = () => {
    setSelectedRoleTemplateIds(profile?.roleTemplateIds || []);
    setIsEditingRoles(false);
  };

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    );
  }

  if (!profile) {
    return (
      <Shell>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Profile not found</p>
        </div>
      </Shell>
    );
  }

  const initials = profile.name
    ? profile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : profile.email?.[0]?.toUpperCase() || "?";

  return (
    <Shell>
      <div className="max-w-4xl mx-auto space-y-8 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Profile</h1>
        </div>

        <Card data-testid="profile-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Your personal information and account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profile.avatar || profile.profileImageUrl || undefined} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">{profile.name || "No name set"}</h2>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {profile.email}
                </p>
                {profile.jobTitle && (
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    {profile.jobTitle}
                  </p>
                )}
                <Badge variant="outline">{profile.systemRole}</Badge>
              </div>
            </div>

            <Separator />

            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      data-testid="input-first-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      data-testid="input-last-name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    data-testid="input-display-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={editForm.jobTitle}
                    onChange={(e) => setEditForm({ ...editForm, jobTitle: e.target.value })}
                    data-testid="input-job-title"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveProfile} disabled={updateProfile.isPending} data-testid="button-save-profile">
                    {updateProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)} data-testid="button-cancel-edit">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">First Name:</span>
                    <p className="font-medium">{profile.firstName || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Name:</span>
                    <p className="font-medium">{profile.lastName || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Display Name:</span>
                    <p className="font-medium">{profile.name || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Job Title:</span>
                    <p className="font-medium">{profile.jobTitle || "-"}</p>
                  </div>
                </div>
                <Button variant="outline" onClick={handleStartEdit} data-testid="button-edit-profile">
                  Edit Profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="role-templates-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  My Roles
                </CardTitle>
                <CardDescription>
                  Select the roles that match your skills and responsibilities
                </CardDescription>
              </div>
              {!isEditingRoles && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditingRoles(true)}
                  data-testid="button-edit-roles"
                >
                  Edit Roles
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {roleTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No role templates available</p>
                <p className="text-sm">Contact an administrator to create role templates</p>
              </div>
            ) : isEditingRoles ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {roleTemplates.map((template: any) => (
                    <div 
                      key={template.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                      onClick={() => handleToggleRoleTemplate(template.id)}
                      data-testid={`role-template-${template.id}`}
                    >
                      <Checkbox
                        checked={selectedRoleTemplateIds.includes(template.id)}
                        onCheckedChange={() => handleToggleRoleTemplate(template.id)}
                        data-testid={`checkbox-role-${template.id}`}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{template.name}</div>
                        {template.description && (
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        )}
                        {template.defaultRoleType && (
                          <Badge variant="secondary" className="mt-1">{template.defaultRoleType}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveRoleTemplates} disabled={updateProfile.isPending} data-testid="button-save-roles">
                    {updateProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Roles
                  </Button>
                  <Button variant="outline" onClick={handleCancelRoleEdit} data-testid="button-cancel-roles">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedRoleTemplateIds.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No roles assigned. Click "Edit Roles" to select your roles.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedRoleTemplateIds.map(roleId => {
                      const template = roleTemplates.find((t: any) => t.id === roleId);
                      return template ? (
                        <Badge key={roleId} variant="default" className="px-3 py-1">
                          {template.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="linked-identities-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="w-5 h-5" />
                  Linked Accounts
                </CardTitle>
                <CardDescription>
                  External accounts connected to your profile
                </CardDescription>
              </div>
              <Button onClick={() => setIsLinkDialogOpen(true)} size="sm" data-testid="button-link-account">
                <Plus className="w-4 h-4 mr-1" />
                Link Account
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {profile.identities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Link2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No linked accounts yet</p>
                <p className="text-sm">Link external accounts to sync your profile across systems</p>
              </div>
            ) : (
              <div className="space-y-3">
                {profile.identities.map((identity) => (
                  <IdentityCard
                    key={identity.id}
                    identity={identity}
                    canUnlink={profile.identities.length > 1}
                    onUnlink={() => setUnlinkConfirm(identity)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent data-testid="link-identity-dialog">
          <DialogHeader>
            <DialogTitle>Link External Account</DialogTitle>
            <DialogDescription>
              Connect an external account to your Nexus profile
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>System</Label>
              <Select
                value={linkForm.systemId}
                onValueChange={(value) => setLinkForm({ ...linkForm, systemId: value })}
              >
                <SelectTrigger data-testid="select-system">
                  <SelectValue placeholder="Select a system" />
                </SelectTrigger>
                <SelectContent>
                  {systems.map((system) => (
                    <SelectItem key={system.id} value={system.id}>
                      {getSystemIcon(system.id)} {system.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>External User ID</Label>
              <Input
                placeholder="User ID in the external system"
                value={linkForm.externalUserId}
                onChange={(e) => setLinkForm({ ...linkForm, externalUserId: e.target.value })}
                data-testid="input-external-user-id"
              />
            </div>
            <div className="space-y-2">
              <Label>Username (optional)</Label>
              <Input
                placeholder="Username in the external system"
                value={linkForm.externalUsername}
                onChange={(e) => setLinkForm({ ...linkForm, externalUsername: e.target.value })}
                data-testid="input-external-username"
              />
            </div>
            <div className="space-y-2">
              <Label>Email (optional)</Label>
              <Input
                placeholder="Email in the external system"
                value={linkForm.externalEmail}
                onChange={(e) => setLinkForm({ ...linkForm, externalEmail: e.target.value })}
                data-testid="input-external-email"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleLinkIdentity}
              disabled={!linkForm.systemId || !linkForm.externalUserId || linkIdentity.isPending}
              data-testid="button-confirm-link"
            >
              {linkIdentity.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Link Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!unlinkConfirm} onOpenChange={() => setUnlinkConfirm(null)}>
        <AlertDialogContent data-testid="unlink-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink your {unlinkConfirm?.systemName || unlinkConfirm?.systemId} account?
              This will remove the connection between your Nexus profile and this external account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlinkIdentity}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-unlink"
            >
              {unlinkIdentity.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Unlink Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
}
