import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function AIWidget() {
  return (
    <Card className="relative overflow-hidden border-0 shadow-md bg-linear-to-br from-primary via-primary/90 to-accent text-white">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-accent/30 blur-3xl"></div>
      
      <div className="relative p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-white/20 rounded-md backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-yellow-200" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">AI Summary</span>
          </div>
          <h3 className="text-lg font-heading font-medium leading-tight text-white">
            Generate a report using AI to give insights on your workload and how best to manage it.
          </h3>
        </div>
        <Button variant="secondary" className="shrink-0 bg-white text-primary hover:bg-white/90 border-0 shadow-lg">
          Generate Report <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
