import { Sliders } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export function GeneralTab() {
  return (
    <Card>
      <CardContent className="p-12 text-center text-muted-foreground">
        <Sliders className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <h3 className="text-lg font-medium">General Settings</h3>
        <p>System-wide defaults configuration coming soon.</p>
      </CardContent>
    </Card>
  );
}
