import { useUsers } from "@/hooks/use-nexus-data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export function TeamList() {
  const { data: team, isLoading } = useUsers();

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">People</CardTitle>
        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-primary">
          <Plus className="h-3 w-3" /> Invite
        </Button>
      </CardHeader>
      <CardContent className="p-0 pb-2">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max space-x-4 p-4 pt-0">
            {team.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-4 px-4">
                No team members yet.
              </div>
            ) : (
              team.map((member: any) => (
                <div key={member.id} className="flex flex-col items-center space-y-2 group cursor-pointer">
                  <div className="relative">
                    <Avatar className="h-14 w-14 border-2 border-transparent group-hover:border-primary transition-all">
                      <AvatarImage src={`https://i.pravatar.cc/150?u=${member.name}`} />
                      <AvatarFallback>{member.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background ${
                      member.status === 'Online' ? 'bg-green-500' :
                      member.status === 'In Meeting' ? 'bg-amber-500' :
                      'bg-gray-300'
                    }`} />
                  </div>
                  <div className="text-center space-y-0.5">
                    <div className="text-xs font-medium leading-none">{member.name?.split(' ')[0] || 'User'}</div>
                    <div className="text-[10px] text-muted-foreground">{member.role?.split(' ')[0] || 'Member'}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
