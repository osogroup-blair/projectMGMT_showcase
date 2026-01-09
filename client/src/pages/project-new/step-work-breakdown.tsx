import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, FileBox, Plus, Trash2, Upload } from "lucide-react";
import { StepProps } from "./types";

export function StepWorkBreakdown({
  deliverables,
  setDeliverables,
  onFileUpload,
}: StepProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Work Breakdown Structure</h3>
          <p className="text-sm text-muted-foreground">Define deliverables, epics, and initial tasks.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="file"
              accept=".xlsx, .xls"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={onFileUpload}
            />
            <Button size="sm" variant="outline">
              <Upload className="h-4 w-4 mr-2" /> Import Excel
            </Button>
          </div>
          <Button size="sm" data-testid="button-add-deliverable" onClick={() => {
            const newDeliverable = {
              id: `d-${Date.now()}`,
              title: "New Deliverable",
              description: "",
              epics: []
            };
            setDeliverables([...deliverables, newDeliverable]);
          }}>
            <Plus className="h-4 w-4 mr-2" /> Add Deliverable
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[500px] pr-4">
        {deliverables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg text-muted-foreground">
            <Package className="h-8 w-8 mb-2 opacity-50" />
            <p>No deliverables added yet.</p>
            <Button variant="link" onClick={() => setDeliverables([{id: `d-${Date.now()}`, title: "New Deliverable", description: "", epics: []}])}>Add your first deliverable</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {deliverables.map((deliverable, dIndex) => (
              <Card key={deliverable.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <Package className="h-4 w-4 text-primary" />
                      <Input 
                        value={deliverable.title} 
                        onChange={(e) => {
                          const newD = [...deliverables];
                          newD[dIndex].title = e.target.value;
                          setDeliverables(newD);
                        }}
                        className="h-8 font-medium bg-transparent border-transparent hover:border-input focus:border-input w-full max-w-sm"
                        placeholder="Deliverable Title"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                        const newD = [...deliverables];
                        newD.splice(dIndex, 1);
                        setDeliverables(newD);
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="pl-6 space-y-3 mt-2">
                    {deliverable.epics.map((epic: any, eIndex: number) => (
                      <div key={epic.id} className="flex items-start gap-2 group">
                        <FileBox className="h-4 w-4 text-indigo-500 mt-2.5" />
                        <div className="flex-1 space-y-1">
                          <Input 
                            value={epic.title}
                            onChange={(e) => {
                              const newD = [...deliverables];
                              newD[dIndex].epics[eIndex].title = e.target.value;
                              setDeliverables(newD);
                            }}
                            className="h-9 bg-transparent border hover:border-input"
                            placeholder="Epic Title"
                          />
                        </div>
                        <Button variant="ghost" size="icon" className="h-9 w-9 opacity-0 group-hover:opacity-100" onClick={() => {
                          const newD = [...deliverables];
                          newD[dIndex].epics.splice(eIndex, 1);
                          setDeliverables(newD);
                        }}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" className="ml-6 text-xs text-muted-foreground" data-testid={`button-add-epic-${deliverable.id}`} onClick={() => {
                      const newD = [...deliverables];
                      newD[dIndex].epics.push({
                        id: `e-${Date.now()}`,
                        title: "New Epic",
                        description: "",
                        tasks: []
                      });
                      setDeliverables(newD);
                    }}>
                      <Plus className="h-3 w-3 mr-2" /> Add Epic
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
