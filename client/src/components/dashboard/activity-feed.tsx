import { ACTIVITY } from "@/lib/mock-data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ActivityFeed() {
  return (
    <Card className="shadow-sm border-none bg-transparent shadow-none">
      <CardHeader className="px-0 pt-0 pb-4">
        <CardTitle className="text-base font-semibold">Updates</CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-6">
        {ACTIVITY.map((item, i) => (
          <div key={item.id} className="flex gap-4 relative">
            {i !== ACTIVITY.length - 1 && (
              <div className="absolute left-[19px] top-10 bottom-[-24px] w-px bg-border border-dashed" />
            )}
            <Avatar className="h-10 w-10 border bg-background shrink-0 z-10">
              <AvatarImage src={`https://i.pravatar.cc/150?u=${item.user}`} />
              <AvatarFallback>{item.user.charAt(0)}</AvatarFallback>
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
              <p className="text-xs text-muted-foreground line-clamp-2 bg-muted/30 p-2 rounded-md border border-border/50">
                {item.details}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
