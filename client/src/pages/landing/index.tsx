import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Layers, 
  CheckCircle2, 
  Users, 
  BarChart3, 
  Play, 
  ArrowRight,
  Target,
  Calendar,
  Clock,
  GitBranch,
  Milestone,
  ListTodo,
  UserCheck,
  Eye,
  Zap,
  AlertTriangle,
  TrendingUp,
  Shuffle,
  Settings2,
  XCircle,
  Shield
} from "lucide-react";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoAdminLoading, setIsDemoAdminLoading] = useState(false);
  const [demoAvailable, setDemoAvailable] = useState(false);
  const [demoAdminEnabled, setDemoAdminEnabled] = useState(false);
  const [demoChecked, setDemoChecked] = useState(false);
  const [microsoftEnabled, setMicrosoftEnabled] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [authError, setAuthError] = useState<{ type: string; details?: string } | null>(null);

  useEffect(() => {
    fetch("/api/demo-status")
      .then(res => res.json())
      .then(data => {
        setDemoAvailable(data.demoAvailable === true);
        setDemoAdminEnabled(data.demoAdminPassthroughEnabled === true);
        setDemoChecked(true);
      })
      .catch(() => {
        setDemoChecked(true);
      });

    fetch("/api/auth/config")
      .then(res => res.json())
      .then(data => {
        setMicrosoftEnabled(data.microsoft?.enabled === true);
        setGoogleEnabled(data.google?.enabled === true);
      })
      .catch(() => {});

    // Check for auth errors in URL
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const details = params.get("details");
    if (error) {
      setAuthError({ type: error, details: details || undefined });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/demo-login", {
        method: "POST",
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.redirectTo || "/";
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
    }
  };

  const handleDemoAdminLogin = async () => {
    setIsDemoAdminLoading(true);
    try {
      const response = await fetch("/api/demo-admin-login", {
        method: "POST",
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.redirectTo || "/";
      } else {
        setIsDemoAdminLoading(false);
      }
    } catch (error) {
      setIsDemoAdminLoading(false);
    }
  };

  const getErrorTitle = (type: string) => {
    const titles: Record<string, string> = {
      microsoft_disabled: "Microsoft Sign-in Disabled",
      microsoft_auth_failed: "Authentication Failed",
      microsoft_oauth_error: "OAuth Error",
      microsoft_auth_error: "Authentication Error",
      microsoft_login_error: "Login Error",
      microsoft_unexpected_error: "Unexpected Error",
      google_disabled: "Google Sign-in Disabled",
      google_auth_failed: "Authentication Failed",
      google_oauth_error: "OAuth Error",
      google_auth_error: "Authentication Error",
      google_login_error: "Login Error",
      google_unexpected_error: "Unexpected Error",
    };
    return titles[type] || "Sign-in Failed";
  };

  const getErrorDescription = (type: string) => {
    const descriptions: Record<string, string> = {
      microsoft_disabled: "Microsoft sign-in has been disabled by an administrator.",
      microsoft_auth_failed: "Microsoft authentication did not complete successfully.",
      microsoft_oauth_error: "Microsoft returned an error during the OAuth flow.",
      microsoft_auth_error: "An error occurred during authentication.",
      microsoft_login_error: "Failed to complete the login process.",
      microsoft_unexpected_error: "An unexpected error occurred during sign-in.",
      google_disabled: "Google sign-in has been disabled by an administrator.",
      google_auth_failed: "Google authentication did not complete successfully.",
      google_oauth_error: "Google returned an error during the OAuth flow.",
      google_auth_error: "An error occurred during authentication.",
      google_login_error: "Failed to complete the login process.",
      google_unexpected_error: "An unexpected error occurred during sign-in.",
    };
    return descriptions[type] || "Authentication failed. Please try again.";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {authError && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
          <Alert variant="destructive" className="bg-red-900/95 border-red-700 text-white shadow-2xl">
            <XCircle className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">{getErrorTitle(authError.type)}</AlertTitle>
            <AlertDescription className="mt-2 space-y-3">
              <p className="text-red-100">{getErrorDescription(authError.type)}</p>
              {authError.details && (
                <div className="mt-3 p-3 bg-red-950/50 rounded border border-red-800">
                  <p className="text-xs font-medium text-red-300 mb-1">Error Details:</p>
                  <p className="text-sm text-red-100 font-mono break-all">{authError.details}</p>
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-red-800">
                <p className="text-xs text-red-300">
                  If this is a redirect URI mismatch, go to Admin → Authentication to see the correct callback URL to register in Azure Portal.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Project Management</span>
          </div>
          <div className="flex items-center gap-3">
            {demoChecked && demoAdminEnabled && (
              <Button 
                variant="outline"
                onClick={handleDemoAdminLogin}
                disabled={isDemoAdminLoading}
                className="border-red-500/50 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                data-testid="nav-demo-admin-button"
              >
                <Shield className="w-4 h-4 mr-2" />
                {isDemoAdminLoading ? "Loading..." : "Demo Admin"}
              </Button>
            )}
            {demoChecked && demoAvailable && (
              <Button 
                variant="outline"
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200"
                data-testid="nav-demo-button"
              >
                <Play className="w-4 h-4 mr-2" />
                {isLoading ? "Loading..." : "Try Demo"}
              </Button>
            )}
            {googleEnabled && (
              <a href="/api/auth/google" data-testid="google-login-button">
                <Button variant="outline" size="default" className="border-slate-500 text-slate-200 hover:bg-slate-700 gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </Button>
              </a>
            )}
            {microsoftEnabled && (
              <a href="/api/auth/microsoft" data-testid="microsoft-login-button">
                <Button variant="outline" size="default" className="border-slate-500 text-slate-200 hover:bg-slate-700 gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                    <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                  </svg>
                  Microsoft
                </Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6">
        <section className="max-w-5xl mx-auto text-center mb-32">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
            Structured Project Delivery
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              for Service Teams
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            A project management platform built for service delivery organizations. 
            Every project is broken down into a clear hierarchy, organized by time-based containers, 
            and tracked with unified status management across your entire portfolio.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {demoChecked && demoAdminEnabled && (
              <Button 
                size="lg" 
                onClick={handleDemoAdminLogin}
                disabled={isDemoAdminLoading}
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-8 py-6 text-lg"
                data-testid="hero-demo-admin-button"
              >
                <Shield className="w-5 h-5 mr-2" />
                {isDemoAdminLoading ? "Loading..." : "Demo Admin Access"}
              </Button>
            )}
            {demoChecked && demoAvailable && (
              <Button 
                size="lg" 
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-6 text-lg"
                data-testid="hero-demo-button"
              >
                <Play className="w-5 h-5 mr-2" />
                {isLoading ? "Loading..." : "Explore the Demo"}
              </Button>
            )}
            {googleEnabled && (
              <a href="/api/auth/google" data-testid="hero-google-button">
                <Button size="lg" className="bg-white hover:bg-gray-100 text-gray-800 px-8 py-6 text-lg gap-3">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </Button>
              </a>
            )}
            {microsoftEnabled && (
              <a href="/api/auth/microsoft" data-testid="hero-microsoft-button">
                <Button size="lg" className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-6 text-lg gap-3">
                  <svg className="w-6 h-6" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                    <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                  </svg>
                  Continue with Microsoft
                </Button>
              </a>
            )}
          </div>
        </section>

        <section className="max-w-6xl mx-auto mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              The Work Breakdown Structure
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Every piece of work follows a clear hierarchy. This structure ensures nothing falls through the cracks and everyone understands where their work fits.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            <HierarchyCard
              level="1"
              title="Project"
              description="The top-level container for all work. Represents a client engagement, product initiative, or major program."
              icon={<Layers className="w-6 h-6" />}
              color="from-blue-500 to-blue-600"
            />
            <HierarchyCard
              level="2"
              title="Deliverable"
              description="Major outcomes or work packages within a project. What you're contractually delivering to the client."
              icon={<Target className="w-6 h-6" />}
              color="from-indigo-500 to-indigo-600"
            />
            <HierarchyCard
              level="3"
              title="Epic"
              description="Large bodies of work within a deliverable. Groups related tasks that achieve a specific objective."
              icon={<GitBranch className="w-6 h-6" />}
              color="from-purple-500 to-purple-600"
            />
            <HierarchyCard
              level="4"
              title="Task"
              description="The atomic unit of work. Assigned to one person, tracked through a standard workflow, and completed in hours or days."
              icon={<CheckCircle2 className="w-6 h-6" />}
              color="from-pink-500 to-pink-600"
            />
          </div>
          
          <div className="mt-8 p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl">
            <p className="text-center text-slate-400">
              <span className="text-white font-medium">Project</span> → 
              <span className="text-white font-medium mx-2">Deliverable</span> → 
              <span className="text-white font-medium mx-2">Epic</span> → 
              <span className="text-white font-medium mx-2">Task</span>
              <span className="block mt-2 text-sm">This hierarchy flows from strategic objectives down to daily work items.</span>
            </p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Organize Work in Time
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Tasks don't just belong to epics—they're also organized by when they happen. Three time-based containers help you plan, execute, and track progress.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <TimeCard
              title="Stages"
              description="Sequential phases of project delivery (e.g., Discovery, Design, Build, Test, Launch). Each stage has a defined timeframe and gates that work must pass through."
              icon={<Settings2 className="w-8 h-8" />}
              examples={["Requirements", "Design", "Development", "QA", "Deployment"]}
              color="blue"
            />
            <TimeCard
              title="Sprints"
              description="Time-boxed iterations (typically 2 weeks) where the team commits to completing a set of tasks. Used for capacity planning and velocity tracking."
              icon={<Clock className="w-8 h-8" />}
              examples={["Sprint 1: Nov 1-14", "Sprint 2: Nov 15-28", "Sprint 3: Nov 29-Dec 12"]}
              color="indigo"
            />
            <TimeCard
              title="Milestones"
              description="Key dates or achievement targets within a project. Often tied to client commitments, billing gates, or major deliverables."
              icon={<Milestone className="w-8 h-8" />}
              examples={["Requirements Sign-off", "Beta Release", "Go Live"]}
              color="purple"
            />
          </div>
        </section>

        <section className="max-w-6xl mx-auto mb-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Unified Status Management
              </h2>
              <p className="text-lg text-slate-400 mb-6">
                Unlike other tools where every project can have different status options, this platform uses a consistent set of statuses across your entire organization. This means:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                  </div>
                  <span className="text-slate-300">All tasks use the same status workflow (Backlog → In Progress → Review → Done)</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                  </div>
                  <span className="text-slate-300">Progress metrics are comparable across projects</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                  </div>
                  <span className="text-slate-300">Team members move between projects without learning new workflows</span>
                </li>
              </ul>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-400" />
                Single Assignee Model
              </h3>
              <p className="text-slate-400 mb-6">
                Every task has exactly one owner. This eliminates confusion about who's responsible and makes workload balancing straightforward.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">JD</div>
                  <div>
                    <div className="text-white text-sm font-medium">Build login page</div>
                    <div className="text-slate-400 text-xs">Assigned to John Doe</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-medium">SM</div>
                  <div>
                    <div className="text-white text-sm font-medium">Design dashboard</div>
                    <div className="text-slate-400 text-xs">Assigned to Sarah Miller</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto mb-32">
          <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-3xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full mb-6">
                  <Play className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-300 text-sm font-medium">Interactive Demo</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Experience It Before You Commit
                </h2>
                <p className="text-lg text-slate-300 mb-6">
                  Our demo environment comes pre-loaded with realistic project data—multiple projects at different completion stages, team members with various roles, and tasks across all statuses.
                </p>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <Eye className="w-5 h-5 text-purple-400 mt-1 shrink-0" />
                    <div>
                      <span className="text-white font-medium">Impersonate Team Members</span>
                      <p className="text-slate-400 text-sm">Switch between demo users to see the app from different perspectives—view as a Solution Consultant, Product Designer, Developer, or QA Engineer.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Layers className="w-5 h-5 text-purple-400 mt-1 shrink-0" />
                    <div>
                      <span className="text-white font-medium">Real Project Scenarios</span>
                      <p className="text-slate-400 text-sm">Explore a CRM System (60% complete), Task Management App (30% complete), and Time Entry System (10% complete) with full task hierarchies.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-purple-400 mt-1 shrink-0" />
                    <div>
                      <span className="text-white font-medium">No Setup Required</span>
                      <p className="text-slate-400 text-sm">Jump straight in and explore. All demo data resets periodically, so feel free to make changes.</p>
                    </div>
                  </div>
                </div>
                {demoChecked && demoAvailable && (
                  <Button 
                    size="lg" 
                    onClick={handleDemoLogin}
                    disabled={isLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    data-testid="demo-section-button"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    {isLoading ? "Loading..." : "Launch Demo"}
                  </Button>
                )}
              </div>
              <div className="hidden md:block">
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6">
                  <div className="text-sm text-slate-400 mb-4">Demo Users Available:</div>
                  <div className="space-y-3">
                    {[
                      { name: "Demo Admin", role: "Full access to all features", color: "bg-red-500" },
                      { name: "Demo Solution Consultant", role: "Project planning & client work", color: "bg-blue-500" },
                      { name: "Demo Product Designer", role: "Design tasks & reviews", color: "bg-purple-500" },
                      { name: "Demo Developer Lead", role: "Development & code reviews", color: "bg-green-500" },
                      { name: "Demo QA Engineer", role: "Testing & quality assurance", color: "bg-orange-500" },
                    ].map((user) => (
                      <div key={user.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 transition-colors">
                        <div className={`w-8 h-8 rounded-full ${user.color} flex items-center justify-center text-white text-xs font-medium`}>
                          {user.name.split(" ").slice(1).map(n => n[0]).join("")}
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">{user.name}</div>
                          <div className="text-slate-400 text-xs">{user.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              The Problems We Solve
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Common project management pain points—and how we address them.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <ProblemSolutionCard
              problem="Work gets lost in flat task lists"
              solution="Hierarchical structure (Project → Deliverable → Epic → Task) ensures every task has context and nothing falls through the cracks."
              problemIcon={<AlertTriangle className="w-5 h-5" />}
              solutionIcon={<GitBranch className="w-5 h-5" />}
            />
            <ProblemSolutionCard
              problem="Every project uses different statuses"
              solution="Unified status options across all projects means consistent reporting, predictable workflows, and easier team transitions."
              problemIcon={<Shuffle className="w-5 h-5" />}
              solutionIcon={<Settings2 className="w-5 h-5" />}
            />
            <ProblemSolutionCard
              problem="Unclear ownership leads to dropped balls"
              solution="Single assignee per task eliminates ambiguity. One person is always accountable for each piece of work."
              problemIcon={<Users className="w-5 h-5" />}
              solutionIcon={<UserCheck className="w-5 h-5" />}
            />
            <ProblemSolutionCard
              problem="Hard to see the big picture"
              solution="Milestones, sprints, and stages provide multiple lenses to view progress—from daily tasks to quarterly goals."
              problemIcon={<AlertTriangle className="w-5 h-5" />}
              solutionIcon={<TrendingUp className="w-5 h-5" />}
            />
          </div>
        </section>

        <section className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-3xl p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Get Organized?
            </h2>
            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
              Whether you're managing a single project or coordinating across multiple teams, this platform gives you the structure you need to deliver with confidence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {demoChecked && demoAvailable && (
                <Button 
                  size="lg" 
                  onClick={handleDemoLogin}
                  disabled={isLoading}
                  variant="outline"
                  className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200 px-8 py-6 text-lg"
                  data-testid="cta-demo-button"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {isLoading ? "Loading..." : "Try the Demo"}
                </Button>
              )}
              {googleEnabled && (
                <a href="/api/auth/google" data-testid="cta-google-button">
                  <Button size="lg" className="bg-white hover:bg-gray-100 text-gray-800 px-8 py-6 text-lg gap-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </Button>
                </a>
              )}
              {microsoftEnabled && (
                <a href="/api/auth/microsoft" data-testid="cta-microsoft-button">
                  <Button size="lg" className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-6 text-lg gap-3">
                    <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                      <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                      <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                      <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                    </svg>
                    Microsoft
                  </Button>
                </a>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} Project Management. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function HierarchyCard({ 
  level, 
  title, 
  description, 
  icon, 
  color 
}: { 
  level: string; 
  title: string; 
  description: string; 
  icon: React.ReactNode; 
  color: string;
}) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/80 transition-colors relative">
      <div className={`absolute -top-3 left-6 px-3 py-1 rounded-full bg-gradient-to-r ${color} text-white text-xs font-bold`}>
        Level {level}
      </div>
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center text-white mb-4 mt-2`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function TimeCard({ 
  title, 
  description, 
  icon, 
  examples,
  color 
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode; 
  examples: string[];
  color: "blue" | "indigo" | "purple";
}) {
  const colorClasses = {
    blue: "text-blue-400 bg-blue-500/20 border-blue-500/30",
    indigo: "text-indigo-400 bg-indigo-500/20 border-indigo-500/30",
    purple: "text-purple-400 bg-purple-500/20 border-purple-500/30",
  };
  
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/80 transition-colors">
      <div className={`w-14 h-14 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed mb-4">{description}</p>
      <div className="border-t border-slate-700/50 pt-4">
        <div className="text-xs text-slate-500 mb-2">Examples:</div>
        <div className="flex flex-wrap gap-2">
          {examples.map((example) => (
            <span key={example} className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-300">
              {example}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProblemSolutionCard({ 
  problem, 
  solution, 
  problemIcon,
  solutionIcon 
}: { 
  problem: string; 
  solution: string; 
  problemIcon: React.ReactNode;
  solutionIcon: React.ReactNode;
}) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/80 transition-colors">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
          {problemIcon}
        </div>
        <div>
          <div className="text-xs text-red-400 font-medium mb-1">PROBLEM</div>
          <p className="text-white font-medium">{problem}</p>
        </div>
      </div>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 shrink-0">
          {solutionIcon}
        </div>
        <div>
          <div className="text-xs text-green-400 font-medium mb-1">SOLUTION</div>
          <p className="text-slate-300 text-sm">{solution}</p>
        </div>
      </div>
    </div>
  );
}
