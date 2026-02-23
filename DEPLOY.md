# Deployment Guide

This repository is ready for deployment to a GCP VM instance using Docker.

## Prerequisites

-   A GitHub repository.
-   A GCP Project with valid billing.
-   A GCP VM Instance (e2-medium or larger recommended) with Docker and Docker Compose installed.

## Security Warning

> [!WARNING]
> **Check `attached_assets` folder:** This folder contains files with potential AWS and other credentials. **DO NOT commit this folder to a public repository.** add `attached_assets` to your `.gitignore` file if it is not already present.

## 1. Environment Setup

Copy `.env.example` to `.env` and fill in the values.

```bash
cp .env.example .env
```

**Critical Variables:**
-   `DATABASE_URL`: In Docker, this is auto-configured but for local dev use `postgresql://prodCo:prodCo_secret@localhost:5432/prodCo`.
-   `SESSION_SECRET`: Generate a strong random string (e.g., `openssl rand -hex 32`).
-   `POSTGRES_PASSWORD`: Change this from the default for production.
-   `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: For Google OAuth.

> [!TIP]
> **Google OAuth Redirect URI:**
> Ensure you add `http://<your-vm-ip>/api/auth/google/callback` (or your domain) to the **Authorized redirect URIs** in your Google Cloud Console.

## 2. Docker Deployment (GCP VM)

1.  **Clone the repository** on your VM.
2.  **Create a `.env` file** with your production values.
3.  **Build and Run** using Docker Compose:

```bash
# Build and start the database and application
docker compose up -d --build
```

### Recommended `docker-compose.yml` for Production

Uncomment the `app` service in `docker-compose.yml` (lines 33-58) to enable the application container. Ensure ports are mapped correctly (e.g., `"80:5000"` for HTTP).

## 3. Verification

After deployment, visit `http://<your-vm-ip>` to verify the application is running (default port 5000, or 80 if modified).
