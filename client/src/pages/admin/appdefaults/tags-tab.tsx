import { Tags } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export function TagsTab() {
  return (
    <Card>
      <CardContent className="p-12 text-center text-muted-foreground">
        <Tags className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <h3 className="text-lg font-medium">Tag Management</h3>
        <p>Global tag configuration coming soon.</p>
      </CardContent>
    </Card>
  );
}
