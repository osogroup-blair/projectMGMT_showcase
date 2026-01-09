import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useUsers } from "@/hooks/use-nexus-data";

interface CurrentUserContextType {
  currentUserId: string;
  setCurrentUserId: (id: string) => void;
  currentUser: any | null;
  users: any[];
  isLoading: boolean;
}

const CurrentUserContext = createContext<CurrentUserContextType | undefined>(undefined);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const { data: users, isLoading: usersLoading } = useUsers();
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!usersLoading && users !== undefined && !hasInitialized) {
      if (users.length > 0) {
        setCurrentUserId(users[0].id);
      }
      setHasInitialized(true);
    } else if (users && users.length > 0 && currentUserId && !users.find((u: any) => u.id === currentUserId)) {
      setCurrentUserId(users[0].id);
    }
  }, [users, usersLoading, currentUserId, hasInitialized]);

  const currentUser = users?.find((u: any) => u.id === currentUserId) || null;
  
  const isLoading = usersLoading || !hasInitialized;

  return (
    <CurrentUserContext.Provider value={{ 
      currentUserId, 
      setCurrentUserId, 
      currentUser, 
      users: users || [],
      isLoading 
    }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const context = useContext(CurrentUserContext);
  if (context === undefined) {
    throw new Error("useCurrentUser must be used within a CurrentUserProvider");
  }
  return context;
}
