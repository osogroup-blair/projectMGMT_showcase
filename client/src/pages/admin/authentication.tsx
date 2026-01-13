import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, Shield, AlertTriangle, Copy, ExternalLink, Info } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface AuthConfig {
  enabled: boolean;
  configured: boolean;
  allowedDomains: string[];
}

interface AdminAuthenticationContentProps {
  embedded?: boolean;
}

function CallbackUrlSection() {
  const { toast } = useToast();
  const callbackUrl = `${window.location.origin}/api/auth/microsoft/callback`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(callbackUrl);
      toast({
        title: "Copied!",
        description: "Callback URL copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy the URL manually",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
      <div className="flex items-start gap-2">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Azure Portal Setup</h4>
          <p className="text-sm text-muted-foreground">
            Add this Redirect URI in your Azure App Registration under "Authentication" → "Platform configurations" → "Web":
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs bg-background border rounded px-3 py-2 font-mono break-all">
          {callbackUrl}
        </code>
        <Button
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
          className="flex-shrink-0"
          data-testid="copy-callback-url"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <a
        href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
      >
        Open Azure Portal
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

export default function AdminAuthenticationContent({ embedded }: AdminAuthenticationContentProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: authConfig, isLoading } = useQuery<AuthConfig>({
    queryKey: ["auth-config"],
    queryFn: async () => {
      const res = await fetch("/api/auth/config");
      if (!res.ok) throw new Error("Failed to fetch auth config");
      return res.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await fetch("/api/auth/microsoft/toggle", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("Failed to update auth settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-config"] });
      toast({
        title: "Settings Updated",
        description: "Microsoft sign-in settings have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggle = (enabled: boolean) => {
    toggleMutation.mutate(enabled);
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
      {!embedded && (
        <div>
          <h2 className="text-xl font-semibold">Authentication Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure single sign-on and authentication providers
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                </svg>
              </div>
              <div>
                <CardTitle className="text-lg">Microsoft Sign-In</CardTitle>
                <CardDescription>
                  Allow users to sign in with their Microsoft account
                </CardDescription>
              </div>
            </div>
            <Badge variant={authConfig?.configured ? "default" : "secondary"}>
              {authConfig?.configured ? "Configured" : "Not Configured"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!authConfig?.configured && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Configuration Required</AlertTitle>
              <AlertDescription>
                Microsoft SSO requires Azure app credentials. Contact your administrator to set up:
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>MICROSOFT_CLIENT_ID - Application (client) ID from Azure Portal</li>
                  <li>MICROSOFT_CLIENT_SECRET - Client secret from Azure Portal</li>
                  <li>MICROSOFT_TENANT_ID - Directory (tenant) ID (or "common" for any Microsoft account)</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {authConfig?.configured && (
            <>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="microsoft-enabled" className="text-base font-medium">
                    Enable Microsoft Sign-In
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    When enabled, users will see a "Continue with Microsoft" button on the login page
                  </p>
                </div>
                <Switch
                  id="microsoft-enabled"
                  checked={authConfig?.enabled || false}
                  onCheckedChange={handleToggle}
                  disabled={toggleMutation.isPending || !authConfig?.configured}
                  data-testid="microsoft-sso-toggle"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                {authConfig?.enabled ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-green-700">
                      Microsoft Sign-In is active
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Microsoft Sign-In is disabled
                    </span>
                  </>
                )}
              </div>
            </>
          )}

          <CallbackUrlSection />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Replit Authentication
          </CardTitle>
          <CardDescription>
            Default authentication provider (always available as backup)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-green-700">
              Always enabled as fallback authentication
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
