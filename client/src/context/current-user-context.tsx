import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
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
  const { user: authUser, isLoading: authLoading } = useAuth();
  const { data: users, isLoading: usersLoading } = useUsers();

  const currentUserId = authUser?.id || "";
  const currentUser = authUser ? {
    ...authUser,
    name: authUser.name || `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || authUser.email,
    role: authUser.jobTitle || "Team Member",
    avatar: authUser.avatar || authUser.profileImageUrl,
  } : null;

  const isLoading = authLoading || usersLoading;

  const setCurrentUserId = (_id: string) => {
  };

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
