import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database } from "lucide-react";
import { SCHEMA_DEFINITIONS } from "../constants";
import type { ExportTab } from "../types";

interface SchemaPreviewProps {
  activeTab: ExportTab;
}

export function SchemaPreview({ activeTab }: SchemaPreviewProps) {
  const [showSchema, setShowSchema] = useState(false);

  const schemas = SCHEMA_DEFINITIONS[activeTab] || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Schema Preview</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <div className="divide-y">
            {schemas.map((schema, i) => (
              <div key={i} className="p-3 text-sm hover:bg-muted/50">
                <div className="font-medium flex items-center gap-2">
                  <Database className="h-3 w-3 text-muted-foreground" />
                  {schema.sheet}
                </div>
                <div className="text-xs text-muted-foreground mt-1 truncate">
                  {showSchema 
                    ? schema.columns.join(", ")
                    : `${schema.columns.slice(0, 3).join(", ")}...`
                  }
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t p-3 bg-muted/20">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-xs"
          onClick={() => setShowSchema(!showSchema)}
        >
          {showSchema ? "Hide Details" : "View Full Schema"}
        </Button>
      </CardFooter>
    </Card>
  );
}
