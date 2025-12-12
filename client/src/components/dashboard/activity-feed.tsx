import { useActivity } from "@/hooks/use-nexus-data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

export function ActivityFeed() {
  const { data: activity, isLoading } = useActivity();

  if (isLoading) {
    return (
      <Card className="shadow-sm border-none bg-transparent shadow-none">
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-none bg-transparent shadow-none">
      <CardHeader className="px-0 pt-0 pb-4">
        <CardTitle className="text-base font-semibold">Updates</CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-6">
        {activity.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-4">
            No recent activity.
          </div>
        ) : (
          activity.map((item: any, i: number) => (
            <div key={item.id} className="flex gap-4 relative">
              {i !== activity.length - 1 && (
                <div className="absolute left-[19px] top-10 bottom-[-24px] w-px bg-border border-dashed" />
              )}
              <Avatar className="h-10 w-10 border bg-background shrink-0 z-10">
                <AvatarImage src={`https://i.pravatar.cc/150?u=${item.user}`} />
                <AvatarFallback>{item.user?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">{item.user}</span>
                  <span className="text-muted-foreground text-xs">{item.time}</span>
                </div>
                <p className="text-sm">
                  <span className="font-medium text-primary">{item.action}</span>{" "}
                  <span className="text-foreground">{item.target}</span>
                </p>
                {item.details && (
                  <p className="text-xs text-muted-foreground line-clamp-2 bg-muted/30 p-2 rounded-md border border-border/50">
                    {item.details}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
