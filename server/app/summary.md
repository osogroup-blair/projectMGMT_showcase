# Server App Directory

## Overview
Express application setup and middleware configuration.

## Files

### `index.ts`
Main Express app setup:
- Creates Express app instance
- Configures middleware (JSON parsing, CORS)
- Registers API routes
- Sets up Vite (dev) or static serving (prod)

### `vite.ts`
Vite development server integration:
- HMR (Hot Module Replacement) setup
- Index HTML transformation
- Development middleware

### `static.ts`
Production static file serving:
- Serves built client assets
- SPA fallback to index.html

## Environment Detection
Uses `NODE_ENV` to determine development vs production mode:
- Development: Uses Vite for hot reloading
- Production: Serves static built files
