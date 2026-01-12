import { Button } from "@/components/ui/button";
import { Layers, CheckCircle2, Users, BarChart3, Play } from "lucide-react";
import { useState } from "react";

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/demo-login", {
        method: "POST",
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        // Redirect to home page
        window.location.href = data.redirectTo || "/";
      } else {
        console.error("Demo login failed");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Demo login error:", error);
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Nymbl</span>
          </div>
          <a href="/api/login" data-testid="login-button">
            <Button variant="default" size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              Sign in with Google
            </Button>
          </a>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
            Project Management
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              Made Simple
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Streamline your project delivery with powerful tools for tracking milestones, 
            managing sprints, and coordinating your team—all in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-6 text-lg"
              data-testid="demo-first-button"
            >
              <Play className="w-5 h-5 mr-2" />
              {isLoading ? "Loading..." : "Demo First"}
            </Button>
            <a href="/api/login" data-testid="get-started-button">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
                Get Started — It's Free
              </Button>
            </a>
          </div>
          <p className="text-sm text-slate-500 mt-6">No credit card required • Try the demo to explore all features</p>
        </div>

        <div className="max-w-6xl mx-auto mt-24">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<CheckCircle2 className="w-8 h-8 text-blue-400" />}
              title="Track Progress"
              description="Monitor milestones, tasks, and deliverables with real-time status updates and progress tracking."
            />
            <FeatureCard
              icon={<Users className="w-8 h-8 text-indigo-400" />}
              title="Team Collaboration"
              description="Assign roles, manage team capacity, and keep everyone aligned on project goals."
            />
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8 text-purple-400" />}
              title="Sprint Planning"
              description="Plan and execute sprints with velocity tracking, burndown charts, and capacity management."
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} Nymbl Workspace. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/80 transition-colors">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
