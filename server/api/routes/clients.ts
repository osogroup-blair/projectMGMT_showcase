import type { Express } from "express";
import crypto from "crypto";
import { storage } from "../../data/storage";
import { insertClientSchema, insertClientUserSchema } from "@shared/schema";

export function registerClientRoutes(app: Express) {
    // --- Client Routes ---

    // Get all clients
    app.get("/api/clients", async (req, res) => {
        try {
            const clients = await storage.getAllClients();
            res.json(clients);
        } catch (error: any) {
            console.error("Failed to fetch clients:", error);
            res.status(500).json({ error: error.message });
        }
    });

    // Get single client
    app.get("/api/clients/:id", async (req, res) => {
        try {
            const client = await storage.getClient(req.params.id);
            if (!client) {
                return res.status(404).json({ error: "Client not found" });
            }
            res.json(client);
        } catch (error: any) {
            console.error("Failed to fetch client:", error);
            res.status(500).json({ error: error.message });
        }
    });

    // Create client
    app.post("/api/clients", async (req, res) => {
        try {
            const validated = insertClientSchema.parse(req.body);
            const client = await storage.createClient(validated);
            res.status(201).json(client);
        } catch (error: any) {
            console.error("Failed to create client:", error);
            res.status(400).json({ error: error.message });
        }
    });

    // Update client
    app.patch("/api/clients/:id", async (req, res) => {
        try {
            const client = await storage.updateClient(req.params.id, req.body);
            if (!client) {
                return res.status(404).json({ error: "Client not found" });
            }
            res.json(client);
        } catch (error: any) {
            console.error("Failed to update client:", error);
            res.status(400).json({ error: error.message });
        }
    });

    // Delete client
    app.delete("/api/clients/:id", async (req, res) => {
        try {
            await storage.deleteClient(req.params.id);
            res.status(204).send();
        } catch (error: any) {
            console.error("Failed to delete client:", error);
            res.status(400).json({ error: error.message });
        }
    });

    // --- Client Users Routes ---

    // Get users for a client
    app.get("/api/clients/:id/users", async (req, res) => {
        try {
            const users = await storage.getClientUsers(req.params.id);
            res.json(users);
        } catch (error: any) {
            console.error("Failed to fetch client users:", error);
            res.status(500).json({ error: error.message });
        }
    });

    // Get clients for a user
    app.get("/api/users/:userId/clients", async (req, res) => {
        try {
            const clients = await storage.getUserClients(req.params.userId);
            res.json(clients);
        } catch (error: any) {
            console.error("Failed to fetch user clients:", error);
            res.status(500).json({ error: error.message });
        }
    });

    // Add user to client
    app.post("/api/clients/:id/users", async (req, res) => {
        try {
            const validated = insertClientUserSchema.parse({
                id: crypto.randomUUID(),
                clientId: req.params.id,
                ...req.body
            });
            const clientUser = await storage.createClientUser(validated);

            // Explicitly cast user to "client" type when assigned to a client
            await storage.updateUser(validated.userId, { userType: "client" });

            res.status(201).json(clientUser);
        } catch (error: any) {
            console.error("Failed to add user to client:", error);
            res.status(400).json({ error: error.message });
        }
    });

    // Update user role in client
    app.patch("/api/clients/:id/users/:userId", async (req, res) => {
        try {
            const clientUser = await storage.updateClientUserRole(req.params.id, req.params.userId, req.body.role);
            res.json(clientUser);
        } catch (error: any) {
            console.error("Failed to update client user role:", error);
            res.status(400).json({ error: error.message });
        }
    });

    // Remove user from client
    app.delete("/api/clients/:id/users/:userId", async (req, res) => {
        try {
            await storage.deleteClientUser(req.params.id, req.params.userId);
            res.status(204).send();
        } catch (error: any) {
            console.error("Failed to remove user from client:", error);
            res.status(400).json({ error: error.message });
        }
    });
}
