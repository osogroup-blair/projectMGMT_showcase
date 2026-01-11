import { useMemo, useCallback } from "react";
import { ParseResult, extractUniqueUserIds } from "@/lib/import-parser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, UserPlus, UserX, Users, Wand2 } from "lucide-react";

interface UserMappingStepProps {
  parseResult: ParseResult | null;
  userMappings: Record<string, string>;
  onUserMappingsChange: (mappings: Record<string, string>) => void;
  userHandling: 'create' | 'unassigned' | 'skip';
  onUserHandlingChange: (handling: 'create' | 'unassigned' | 'skip') => void;
  existingUsers: any[];
}

function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

function fuzzyMatch(a: string, b: string): number {
  const normA = normalizeString(a);
  const normB = normalizeString(b);
  
  if (normA === normB) return 1;
  if (normA.includes(normB) || normB.includes(normA)) return 0.8;
  
  const words1 = a.toLowerCase().split(/[\s_\-@.]+/).filter(Boolean);
  const words2 = b.toLowerCase().split(/[\s_\-@.]+/).filter(Boolean);
  const matchingWords = words1.filter(w => words2.some(w2 => w2.includes(w) || w.includes(w2)));
  if (matchingWords.length > 0) {
    return 0.5 + (matchingWords.length / Math.max(words1.length, words2.length)) * 0.4;
  }
  
  return 0;
}

export function UserMappingStep({
  parseResult,
  userMappings,
  onUserMappingsChange,
  userHandling,
  onUserHandlingChange,
  existingUsers
}: UserMappingStepProps) {
  const externalUserIds = useMemo(() => {
    if (!parseResult) return [];
    return extractUniqueUserIds(parseResult.entities);
  }, [parseResult]);

  const handleUserMappingChange = useCallback((externalId: string, systemId: string) => {
    onUserMappingsChange({
      ...userMappings,
      [externalId]: systemId
    });
  }, [userMappings, onUserMappingsChange]);

  const handleAutoMap = useCallback(() => {
    const newMappings: Record<string, string> = { ...userMappings };
    
    for (const externalId of externalUserIds) {
      if (newMappings[externalId]) continue;
      
      let bestMatch: { userId: string; score: number } | null = null;
      
      for (const user of existingUsers) {
        const fieldsToMatch = [
          user.name,
          user.email,
          user.firstName,
          user.lastName,
          user.username,
          `${user.firstName || ''} ${user.lastName || ''}`.trim()
        ].filter(Boolean);
        
        for (const field of fieldsToMatch) {
          const score = fuzzyMatch(externalId, field);
          if (score > 0.5 && (!bestMatch || score > bestMatch.score)) {
            bestMatch = { userId: user.id, score };
          }
        }
      }
      
      if (bestMatch) {
        newMappings[externalId] = bestMatch.userId;
      }
    }
    
    onUserMappingsChange(newMappings);
  }, [externalUserIds, existingUsers, userMappings, onUserMappingsChange]);

  const unmappedCount = useMemo(() => {
    return externalUserIds.filter(id => !userMappings[id]).length;
  }, [externalUserIds, userMappings]);

  if (!parseResult) {
    return <div className="text-center text-muted-foreground">No file parsed yet</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold">User Mapping</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {externalUserIds.length > 0 
            ? `Found ${externalUserIds.length} user references. Map them to existing users or choose how to handle unmapped users.`
            : 'No user references found in the imported data.'
          }
        </p>
        {externalUserIds.length > 0 && unmappedCount > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAutoMap}
            className="mt-3"
            data-testid="auto-map-users-btn"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Auto-Map Unmapped Users ({unmappedCount})
          </Button>
        )}
      </div>

      {externalUserIds.length === 0 ? (
        <Card className="bg-muted/30">
          <CardContent className="pt-6 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No user IDs found in the import file. You can proceed to the next step.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Map External Users</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>External User ID</TableHead>
                      <TableHead>Map To</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {externalUserIds.map(externalId => {
                      const mappedTo = userMappings[externalId];
                      const mappedUser = existingUsers.find(u => u.id === mappedTo);
                      
                      return (
                        <TableRow key={externalId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-mono text-sm">{externalId.substring(0, 12)}...</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <SearchableSelect
                              value={mappedTo || '__unmapped__'}
                              onValueChange={(val) => handleUserMappingChange(externalId, val === '__unmapped__' ? '' : val)}
                              placeholder="Select user..."
                              options={[
                                { value: '__unmapped__', label: '-- Leave unmapped --' },
                                ...existingUsers.map((user: any) => ({ value: user.id, label: user.name }))
                              ]}
                              triggerClassName="w-[200px]"
                            />
                          </TableCell>
                          <TableCell>
                            {mappedUser ? (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                Mapped
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                Unmapped
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Unmapped User Handling</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={userHandling} onValueChange={(val: any) => onUserHandlingChange(val)}>
                  <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="create" id="create" className="mt-0.5" />
                    <Label htmlFor="create" className="cursor-pointer">
                      <div className="flex items-center gap-2 font-medium">
                        <UserPlus className="h-4 w-4" />
                        Create placeholder users
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Auto-create users with imported IDs for later management
                      </p>
                    </Label>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="unassigned" id="unassigned" className="mt-0.5" />
                    <Label htmlFor="unassigned" className="cursor-pointer">
                      <div className="flex items-center gap-2 font-medium">
                        <UserX className="h-4 w-4" />
                        Leave unassigned
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tasks/items will have no assignee set
                      </p>
                    </Label>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="skip" id="skip" className="mt-0.5" />
                    <Label htmlFor="skip" className="cursor-pointer">
                      <div className="flex items-center gap-2 font-medium">
                        <User className="h-4 w-4" />
                        Skip unmapped items
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Don't import items with unmapped user references
                      </p>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="text-sm">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Total user references</span>
                    <span className="font-medium">{externalUserIds.length}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Mapped</span>
                    <span className="font-medium text-green-600">
                      {Object.values(userMappings).filter(Boolean).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unmapped</span>
                    <span className="font-medium text-amber-600">
                      {externalUserIds.length - Object.values(userMappings).filter(Boolean).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
