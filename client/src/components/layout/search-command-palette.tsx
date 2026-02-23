import * as React from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  FolderKanban,
  CheckSquare,
  Layers,
  Target,
  User,
  Package,
  Clock,
  Search,
} from "lucide-react";

interface SearchResult {
  id: string;
  type: "project" | "task" | "epic" | "milestone" | "user" | "deliverable";
  title: string;
  subtitle?: string;
  url: string;
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
  totalCount: number;
}

const typeIcons: Record<SearchResult["type"], React.ReactNode> = {
  project: <FolderKanban className="h-4 w-4" />,
  task: <CheckSquare className="h-4 w-4" />,
  epic: <Layers className="h-4 w-4" />,
  milestone: <Target className="h-4 w-4" />,
  user: <User className="h-4 w-4" />,
  deliverable: <Package className="h-4 w-4" />,
};

const typeLabels: Record<SearchResult["type"], string> = {
  project: "Projects",
  task: "Tasks",
  epic: "Epics",
  milestone: "Milestones",
  user: "Users",
  deliverable: "Deliverables",
};

const RECENT_SEARCHES_KEY = "prodCo_recent_searches";
const MAX_RECENT = 5;

function getRecentSearches(): SearchResult[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(item: SearchResult): void {
  try {
    const recent = getRecentSearches().filter((r) => r.id !== item.id);
    const updated = [item, ...recent].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
  }
}

interface SearchCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchCommandPalette({ open, onOpenChange }: SearchCommandPaletteProps) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = React.useState("");
  const [recentSearches, setRecentSearches] = React.useState<SearchResult[]>([]);

  React.useEffect(() => {
    if (open) {
      setRecentSearches(getRecentSearches());
    }
  }, [open]);

  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading } = useQuery<SearchResponse>({
    queryKey: ["/api/search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return { results: [], query: debouncedQuery, totalCount: 0 };
      }
      const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=20`);
      if (!response.ok) throw new Error("Search failed");
      return response.json();
    },
    enabled: open && debouncedQuery.length >= 2,
  });

  const handleSelect = (item: SearchResult) => {
    addRecentSearch(item);
    onOpenChange(false);
    setQuery("");
    setLocation(item.url);
  };

  const groupedResults = React.useMemo(() => {
    if (!data?.results) return {};
    return data.results.reduce((acc, result) => {
      if (!acc[result.type]) acc[result.type] = [];
      acc[result.type].push(result);
      return acc;
    }, {} as Record<string, SearchResult[]>);
  }, [data?.results]);

  const hasResults = data?.results && data.results.length > 0;
  const showRecent = !query && recentSearches.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search projects, tasks, epics, milestones..."
        value={query}
        onValueChange={setQuery}
        data-testid="input-command-search"
      />
      <CommandList>
        {isLoading && query.length >= 2 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <Search className="h-4 w-4 animate-pulse inline-block mr-2" />
            Searching...
          </div>
        )}

        {!isLoading && query.length >= 2 && !hasResults && (
          <CommandEmpty>No results found for "{query}"</CommandEmpty>
        )}

        {showRecent && (
          <CommandGroup heading="Recent">
            {recentSearches.map((item) => (
              <CommandItem
                key={`recent-${item.id}`}
                value={`${item.type}-${item.id}`}
                onSelect={() => handleSelect(item)}
                className="cursor-pointer"
                data-testid={`search-result-recent-${item.id}`}
              >
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="truncate">{item.title}</span>
                  {item.subtitle && (
                    <span className="text-xs text-muted-foreground truncate">{item.subtitle}</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground capitalize">{item.type}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!query && !showRecent && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Start typing to search...
          </div>
        )}

        {hasResults && Object.entries(groupedResults).map(([type, items]) => (
          <CommandGroup key={type} heading={typeLabels[type as SearchResult["type"]] || type}>
            {items.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.type}-${item.id}-${item.title}`}
                onSelect={() => handleSelect(item)}
                className="cursor-pointer"
                data-testid={`search-result-${item.type}-${item.id}`}
              >
                <span className="mr-2 text-muted-foreground">
                  {typeIcons[item.type]}
                </span>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="truncate">{item.title}</span>
                  {item.subtitle && (
                    <span className="text-xs text-muted-foreground truncate">{item.subtitle}</span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}

        {hasResults && data.totalCount > data.results.length && (
          <div className="py-2 text-center text-xs text-muted-foreground border-t">
            Showing {data.results.length} of {data.totalCount} results
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
