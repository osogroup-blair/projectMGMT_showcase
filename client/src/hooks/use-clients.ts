import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Client, type ClientUser, type InsertClient } from "@shared/schema";
import { useCurrentUser } from "@/context/current-user-context";
import { useToast } from "@/hooks/use-toast";

export function useClients() {
    const { currentUser } = useCurrentUser();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: userClients = [], isLoading: isLoadingUserClients } = useQuery<Client[]>({
        queryKey: ["/api/users", currentUser?.id, "clients"],
        queryFn: async () => {
            if (!currentUser?.id) return [];
            const res = await fetch(`/api/users/${currentUser.id}/clients`);
            if (!res.ok) throw new Error("Failed to fetch user clients");
            return res.json();
        },
        enabled: !!currentUser?.id,
    });

    const { data: allClients = [], isLoading: isLoadingAllClients } = useQuery<Client[]>({
        queryKey: ["/api/clients"],
        queryFn: async () => {
            const res = await fetch("/api/clients");
            if (!res.ok) throw new Error("Failed to fetch clients");
            return res.json();
        },
        enabled: currentUser?.systemRole === "admin",
    });

    const createClientMutation = useMutation({
        mutationFn: async (client: InsertClient) => {
            const res = await fetch("/api/clients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(client),
            });
            if (!res.ok) throw new Error("Failed to create client");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
            queryClient.invalidateQueries({ queryKey: ["/api/users", currentUser?.id, "clients"] });
            toast({ title: "Client created successfully" });
        },
        onError: (error: Error) => {
            toast({ title: "Failed to create client", description: error.message, variant: "destructive" });
        },
    });

    const updateClientMutation = useMutation({
        mutationFn: async ({ id, ...data }: Partial<Client> & { id: string }) => {
            const res = await fetch(`/api/clients/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update client");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
            queryClient.invalidateQueries({ queryKey: ["/api/users", currentUser?.id, "clients"] });
            toast({ title: "Client updated successfully" });
        },
        onError: (error: Error) => {
            toast({ title: "Failed to update client", description: error.message, variant: "destructive" });
        },
    });

    const deleteClientMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/clients/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete client");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
            queryClient.invalidateQueries({ queryKey: ["/api/users", currentUser?.id, "clients"] });
            toast({ title: "Client deleted successfully" });
        },
        onError: (error: Error) => {
            toast({ title: "Failed to delete client", description: error.message, variant: "destructive" });
        },
    });

    // Derived list of visible clients (admins see all, others see what they are assigned to)
    const visibleClients = currentUser?.systemRole === "admin" ? allClients : userClients;

    return {
        userClients,
        allClients,
        visibleClients,
        isLoading: isLoadingUserClients || (currentUser?.systemRole === "admin" && isLoadingAllClients),
        createClient: createClientMutation,
        updateClient: updateClientMutation,
        deleteClient: deleteClientMutation,
    };
}
