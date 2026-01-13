# Nymbl Workspace - Deployment Guide

This guide covers two deployment options: Local Setup and Docker deployment.

## Prerequisites

- **PostgreSQL 14+** (local setup) or Docker (containerized)
- **Node.js 18+** (local setup only)
- **Microsoft Azure account** (optional, for Microsoft SSO)
- **Google Cloud account** (optional, for Google SSO)

---

## Option 1: Local Setup (Recommended for Development)

### Quick Start

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd nymbl-workspace

# 2. Run the setup script
chmod +x setup.sh
./setup.sh
```

The setup script will:
- Check for required dependencies (Node.js, npm, PostgreSQL)
- Create `.env` from `.env.example` if needed
- Install npm packages
- Run database migrations
- Build the application
- Optionally start the server

### Manual Setup

If you prefer to set up manually:

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env

# 3. Edit .env with your configuration
# At minimum, set:
#   - DATABASE_URL
#   - SESSION_SECRET

# 4. Run database migrations
npm run db:push

# 5. Build the application
npm run build

# 6. Start the server
npm run start        # Production mode
# or
npm run dev          # Development mode (with hot reload)
```

---

## Option 2: Docker Deployment (Recommended for Production)

### Quick Start

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd nymbl-workspace

# 2. Create environment file for Docker
cp .env.example .env

# 3. Edit .env with your configuration

# 4. Start with Docker Compose
docker-compose up -d
```

### Docker Compose Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# Remove everything including data
docker-compose down -v
```

### Custom Configuration

You can customize the deployment by setting environment variables before running docker-compose:

```bash
# Example: Custom ports and database credentials
export POSTGRES_USER=myuser
export POSTGRES_PASSWORD=mysecurepassword
export POSTGRES_DB=mydb
export APP_PORT=3000
export SESSION_SECRET=$(openssl rand -hex 32)

docker-compose up -d
```

---

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/nymbl` |
| `SESSION_SECRET` | Random string for session encryption | Use `openssl rand -hex 32` |

### Optional (Microsoft SSO)

| Variable | Description | Example |
|----------|-------------|---------|
| `MICROSOFT_CLIENT_ID` | Azure App Registration Client ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `MICROSOFT_CLIENT_SECRET` | Azure Client Secret **Value** | `your-secret-value` |
| `MICROSOFT_TENANT_ID` | Azure Tenant ID or "common" | `common` |

### Optional (Google SSO)

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `xxxxxxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-your-secret` |

### Server Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `production` |

---

## Setting Up Microsoft SSO

1. Go to [Azure Portal](https://portal.azure.com) > **App registrations**
2. Click **New registration**
3. Enter a name (e.g., "Nymbl Workspace")
4. Set **Redirect URI** to:
   - Type: Web
   - URL: `https://your-domain.com/api/auth/microsoft/callback`
5. Click **Register**
6. Copy the **Application (client) ID** → `MICROSOFT_CLIENT_ID`
7. Copy the **Directory (tenant) ID** → `MICROSOFT_TENANT_ID`
8. Go to **Certificates & secrets** > **New client secret**
9. Copy the **Value** (not the Secret ID!) → `MICROSOFT_CLIENT_SECRET`

**Important:** The secret value is only shown once. If you lose it, create a new one.

---

## Setting Up Google SSO

1. Go to [Google Cloud Console](https://console.cloud.google.com) > **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application** as the application type
4. Enter a name (e.g., "Nymbl Workspace")
5. Add **Authorized redirect URI**:
   - `https://your-domain.com/api/auth/google/callback`
6. Click **Create**
7. Copy the **Client ID** → `GOOGLE_CLIENT_ID`
8. Copy the **Client Secret** → `GOOGLE_CLIENT_SECRET`

**Note:** You may need to configure the OAuth consent screen first if you haven't already.

---

## Database Migrations

### Local Setup
```bash
npm run db:push
```

### Docker
Database migrations run automatically when the container starts.

To run migrations manually:
```bash
docker-compose exec app npm run db:push
```

---

## Health Check

The application exposes a health endpoint at `/health`:

```bash
curl http://localhost:5000/health
# Response: {"status":"ok","timestamp":"2024-01-13T12:00:00.000Z"}
```

---

## Troubleshooting

### Database connection failed
- Ensure PostgreSQL is running
- Check `DATABASE_URL` format: `postgresql://user:password@host:port/database`
- For Docker, wait for the database to be healthy before the app starts

### Microsoft SSO not working
- Verify the redirect URI in Azure Portal matches exactly
- Ensure you're using the secret **Value**, not the secret **ID**
- Check that SSO is enabled in Admin > Authentication

### Google SSO not working
- Verify the redirect URI in Google Cloud Console matches exactly
- Ensure your OAuth consent screen is properly configured
- Check that SSO is enabled in Admin > Authentication

### Port already in use
- Change the port in `.env` or use the `APP_PORT` variable for Docker
- Kill the process using the port: `lsof -i :5000` then `kill <PID>`

---

## Production Considerations

1. **Use a reverse proxy** (nginx, Caddy) for HTTPS termination
2. **Set a strong `SESSION_SECRET`** (at least 32 random characters)
3. **Enable database backups** for your PostgreSQL instance
4. **Monitor the health endpoint** with your monitoring solution
5. **Use Docker secrets** for sensitive environment variables in production

---

## Support

For issues and feature requests, please open an issue on the repository.
