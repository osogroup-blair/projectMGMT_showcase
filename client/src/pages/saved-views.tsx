import { useState } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  ArrowLeft, 
  Layout, 
  Plus, 
  MoreHorizontal, 
  Search, 
  Kanban,
  List,
  Calendar,
  BarChart2,
  Globe,
  Lock,
  Star,
  Eye,
  Trash2,
  Edit,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useRoute, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SAVED_VIEWS, SavedView } from "@/lib/mock-data";

const VIEW_TYPE_ICONS = {
  "Kanban": Kanban,
  "List": List,
  "Calendar": Calendar,
  "Gantt": BarChart2
};

export default function SavedViewsGallery() {
  const [match, params] = useRoute("/projects/:projectId/views");
  const projectId = params?.projectId || "1";
  const { toast } = useToast();

  const [views, setViews] = useState<SavedView[]>(SAVED_VIEWS);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");

  const filteredViews = views.filter(view => {
    const matchesSearch = view.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          view.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || view.viewType === typeFilter;
    const matchesVisibility = visibilityFilter === "all" || view.visibility === visibilityFilter;
    
    return matchesSearch && matchesType && matchesVisibility;
  });

  const handleDelete = (id: string) => {
    setViews(prev => prev.filter(v => v.id !== id));
    toast({
      title: "View Deleted",
      description: "The saved view has been removed.",
      variant: "destructive"
    });
  };

  const handleSetDefault = (id: string) => {
    setViews(prev => prev.map(v => ({
      ...v,
      isDefault: v.id === id
    })));
    toast({
      title: "Default View Updated",
      description: "This view is now the default for this project.",
    });
  };

  return (
    <Shell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href={`/projects/${projectId}`} className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Project
            </Link>
            <span className="text-border">|</span>
            <span>Saved Views</span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-primary">Saved Views Gallery</h1>
              <p className="text-muted-foreground">Manage and organize your project views and dashboards.</p>
            </div>
            <Link href={`/projects/${projectId}/views/new`}>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create View
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search views..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <SearchableSelect 
              value={typeFilter} 
              onValueChange={setTypeFilter}
              className="w-[140px]"
              placeholder="View Type"
              options={[
                { value: "all", label: "All Types" },
                { value: "Kanban", label: "Kanban" },
                { value: "List", label: "List" },
                { value: "Calendar", label: "Calendar" },
                { value: "Gantt", label: "Gantt" }
              ]}
            />

            <SearchableSelect 
              value={visibilityFilter} 
              onValueChange={setVisibilityFilter}
              className="w-[140px]"
              placeholder="Visibility"
              options={[
                { value: "all", label: "All Visibility" },
                { value: "Global", label: "Global" },
                { value: "Personal", label: "Personal" }
              ]}
            />
            
            <Button variant="ghost" size="icon" onClick={() => {
              setSearchQuery("");
              setTypeFilter("all");
              setVisibilityFilter("all");
            }}>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Views Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredViews.map(view => {
            const Icon = VIEW_TYPE_ICONS[view.viewType] || Layout;

            return (
              <Card key={view.id} className={cn(
                "group relative transition-all hover:shadow-md",
                view.isDefault && "border-primary/50 bg-primary/5"
              )}>
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{view.name}</CardTitle>
                        {view.isDefault && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 h-5 gap-1">
                            Default
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="line-clamp-2">{view.description}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          Open View
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSetDefault(view.id)}>
                          <Star className="mr-2 h-4 w-4" />
                          Set as Default
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDelete(view.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete View
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="gap-1.5 pl-1.5 font-normal">
                      <Icon className="h-3 w-3 text-muted-foreground" />
                      {view.viewType}
                    </Badge>
                    <Badge variant="outline" className="gap-1.5 pl-1.5 font-normal">
                      {view.visibility === "Global" ? (
                        <Globe className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      )}
                      {view.visibility}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground border-t bg-muted/20 p-3">
                  <div className="flex items-center justify-between w-full">
                    <span>Configured for {view.stageIds.length > 0 ? `${view.stageIds.length} stages` : "all stages"}</span>
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-xs hover:bg-transparent text-primary">
                      Open
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
