import React, { createContext, useContext, useState, useEffect } from "react";
import { type Client } from "@shared/schema";

interface ClientContextType {
    activeClientId: string | null;
    setActiveClientId: (id: string | null) => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: React.ReactNode }) {
    const [activeClientId, setActiveClientId] = useState<string | null>(() => {
        return localStorage.getItem("activeClientId");
    });

    useEffect(() => {
        if (activeClientId) {
            localStorage.setItem("activeClientId", activeClientId);
        } else {
            localStorage.removeItem("activeClientId");
        }
    }, [activeClientId]);

    return (
        <ClientContext.Provider value={{ activeClientId, setActiveClientId }}>
            {children}
        </ClientContext.Provider>
    );
}

export function useClientContext() {
    const context = useContext(ClientContext);
    if (context === undefined) {
        throw new Error("useClientContext must be used within a ClientProvider");
    }
    return context;
}
