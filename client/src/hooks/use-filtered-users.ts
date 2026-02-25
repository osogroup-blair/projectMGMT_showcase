import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useFilteredUsers(users: any[], clientId?: string | null) {
    // Fetch client users mapping to filter out client users that don't belong to the selected client
    const { data: clientUsers = [], isLoading: isLoadingClientUsers } = useQuery<{ id: string, userId: string }[]>({
        queryKey: ["/api/clients", clientId, "users"],
        queryFn: async () => {
            if (!clientId) return [];
            const res = await fetch(`/api/clients/${clientId}/users`);
            if (!res.ok) throw new Error("Failed to fetch client users");
            return res.json();
        },
        enabled: !!clientId
    });

    const validClientUserIds = useMemo(() => clientUsers.map(cu => cu.userId), [clientUsers]);

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            // Internal users are always visible everywhere
            if (!user.userType || user.userType === 'internal') {
                return true;
            }

            // Client users are only visible if they belong to the selected project client
            if (user.userType === 'client') {
                if (!clientId) return false; // If there's no client selected, client users can't be assigned
                return validClientUserIds.includes(user.id);
            }

            return false; // Fallback for unknown types
        });
    }, [users, validClientUserIds, clientId]);

    return { filteredUsers, isLoadingClientUsers };
}
