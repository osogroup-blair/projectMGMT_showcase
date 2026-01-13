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

interface ProviderConfig {
  enabled: boolean;
  configured: boolean;
  allowedDomains?: string[];
}

interface AuthConfig {
  microsoft: ProviderConfig;
  google: ProviderConfig;
}

interface AdminAuthenticationContentProps {
  embedded?: boolean;
}

function MicrosoftCallbackUrlSection() {
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
          data-testid="copy-microsoft-callback-url"
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

function GoogleCallbackUrlSection() {
  const { toast } = useToast();
  const callbackUrl = `${window.location.origin}/api/auth/google/callback`;

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
    <div className="space-y-3 p-4 border rounded-lg bg-green-50/50 dark:bg-green-950/20">
      <div className="flex items-start gap-2">
        <Info className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Google Cloud Console Setup</h4>
          <p className="text-sm text-muted-foreground">
            Add this Authorized Redirect URI in your Google Cloud Console under "APIs & Services" → "Credentials" → "OAuth 2.0 Client IDs":
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
          data-testid="copy-google-callback-url"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <a
        href="https://console.cloud.google.com/apis/credentials"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
      >
        Open Google Cloud Console
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

  const toggleMicrosoftMutation = useMutation({
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

  const toggleGoogleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await fetch("/api/auth/google/toggle", {
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
        description: "Google sign-in settings have been saved.",
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

  const handleMicrosoftToggle = (enabled: boolean) => {
    toggleMicrosoftMutation.mutate(enabled);
  };

  const handleGoogleToggle = (enabled: boolean) => {
    toggleGoogleMutation.mutate(enabled);
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
            <Badge variant={authConfig?.microsoft?.configured ? "default" : "secondary"}>
              {authConfig?.microsoft?.configured ? "Configured" : "Not Configured"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!authConfig?.microsoft?.configured && (
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

          {authConfig?.microsoft?.configured && (
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
                  checked={authConfig?.microsoft?.enabled || false}
                  onCheckedChange={handleMicrosoftToggle}
                  disabled={toggleMicrosoftMutation.isPending || !authConfig?.microsoft?.configured}
                  data-testid="microsoft-sso-toggle"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                {authConfig?.microsoft?.enabled ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
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

          <MicrosoftCallbackUrlSection />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white border flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <div>
                <CardTitle className="text-lg">Google Sign-In</CardTitle>
                <CardDescription>
                  Allow users to sign in with their Google account
                </CardDescription>
              </div>
            </div>
            <Badge variant={authConfig?.google?.configured ? "default" : "secondary"}>
              {authConfig?.google?.configured ? "Configured" : "Not Configured"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!authConfig?.google?.configured && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Configuration Required</AlertTitle>
              <AlertDescription>
                Google SSO requires OAuth credentials. Contact your administrator to set up:
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>GOOGLE_CLIENT_ID - OAuth client ID from Google Cloud Console</li>
                  <li>GOOGLE_CLIENT_SECRET - OAuth client secret from Google Cloud Console</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {authConfig?.google?.configured && (
            <>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="google-enabled" className="text-base font-medium">
                    Enable Google Sign-In
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    When enabled, users will see a "Continue with Google" button on the login page
                  </p>
                </div>
                <Switch
                  id="google-enabled"
                  checked={authConfig?.google?.enabled || false}
                  onCheckedChange={handleGoogleToggle}
                  disabled={toggleGoogleMutation.isPending || !authConfig?.google?.configured}
                  data-testid="google-sso-toggle"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                {authConfig?.google?.enabled ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      Google Sign-In is active
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Google Sign-In is disabled
                    </span>
                  </>
                )}
              </div>
            </>
          )}

          <GoogleCallbackUrlSection />
        </CardContent>
      </Card>
    </div>
  );
}
