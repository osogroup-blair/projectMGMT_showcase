import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, FileBox, Plus, Trash2, Upload } from "lucide-react";
import { StepProps, WizardEpic } from "./types";
import { useRef, useCallback } from "react";

export function StepWorkBreakdown({
  deliverables,
  setDeliverables,
  onFileUpload,
}: StepProps) {
  const epicInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const addEpic = useCallback((deliverableIndex: number, focusNew: boolean = false) => {
    const epicId = `e-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newD = [...deliverables];
    const newEpic: WizardEpic = {
      id: epicId,
      title: "",
      description: ""
    };
    newD[deliverableIndex].epics.push(newEpic);
    setDeliverables(newD);
    
    if (focusNew) {
      setTimeout(() => {
        const input = epicInputRefs.current.get(epicId);
        if (input) input.focus();
      }, 50);
    }
  }, [deliverables, setDeliverables]);

  const removeEpic = useCallback((deliverableIndex: number, epicIndex: number) => {
    const newD = [...deliverables];
    newD[deliverableIndex].epics.splice(epicIndex, 1);
    setDeliverables(newD);
  }, [deliverables, setDeliverables]);

  const handleEpicKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    deliverableIndex: number,
    epicIndex: number,
    epicTitle: string
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEpic(deliverableIndex, true);
    } else if (e.key === 'Backspace' && epicTitle === '') {
      e.preventDefault();
      if (deliverables[deliverableIndex].epics.length > 1 || epicIndex > 0) {
        removeEpic(deliverableIndex, epicIndex);
        const prevEpicIndex = epicIndex - 1;
        if (prevEpicIndex >= 0) {
          const prevEpic = deliverables[deliverableIndex].epics[prevEpicIndex];
          setTimeout(() => {
            const input = epicInputRefs.current.get(prevEpic.id);
            if (input) input.focus();
          }, 50);
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Work Breakdown Structure</h3>
          <p className="text-sm text-muted-foreground">
            Define deliverables and epics. Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Enter</kbd> to add a new epic.
          </p>
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
              title: "",
              description: "",
              epics: [{ id: `e-${Date.now()}`, title: "", description: "" }]
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
            <Button variant="link" onClick={() => setDeliverables([{
              id: `d-${Date.now()}`, 
              title: "", 
              description: "", 
              epics: [{ id: `e-${Date.now()}`, title: "", description: "" }]
            }])}>
              Add your first deliverable
            </Button>
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
                        placeholder="Enter deliverable name..."
                        data-testid={`input-deliverable-title-${dIndex}`}
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
                  <div className="pl-6 space-y-2 mt-2">
                    {deliverable.epics.map((epic, eIndex) => (
                      <div key={epic.id} className="flex items-start gap-2 group">
                        <FileBox className="h-4 w-4 text-indigo-500 mt-2.5" />
                        <div className="flex-1">
                          <Input 
                            ref={(el) => {
                              if (el) epicInputRefs.current.set(epic.id, el);
                            }}
                            value={epic.title}
                            onChange={(e) => {
                              const newD = [...deliverables];
                              newD[dIndex].epics[eIndex].title = e.target.value;
                              setDeliverables(newD);
                            }}
                            onKeyDown={(e) => handleEpicKeyDown(e, dIndex, eIndex, epic.title)}
                            className="h-9 bg-transparent border hover:border-input"
                            placeholder="Enter epic name... (press Enter for new row)"
                            data-testid={`input-epic-title-${dIndex}-${eIndex}`}
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity" 
                          onClick={() => removeEpic(dIndex, eIndex)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-6 text-xs text-muted-foreground" 
                      data-testid={`button-add-epic-${deliverable.id}`} 
                      onClick={() => addEpic(dIndex, true)}
                    >
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
