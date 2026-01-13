import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../api";
import { serveStatic } from "./static";
import { createServer } from "http";
import { connectWithRetry, isDatabaseConnected, setDatabaseReady } from "../db";
import { isApplicationReady } from "./readiness";
import { setupAuth, registerAuthRoutes, setupMicrosoftAuth } from "../replit_integrations/auth";
import { generateDemoData } from "../services/demo-data-generator";
import { storage } from "../data/storage";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: '10mb' }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const port = parseInt(process.env.PORT || "5000", 10);
  
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api', (req, res, next) => {
    // Exempt auth routes from database check - they need to work during OAuth callbacks
    if (req.path.startsWith('/auth/')) {
      return next();
    }
    if (!isDatabaseConnected()) {
      return res.status(503).json({ 
        message: 'Service temporarily unavailable - database connecting',
        retryAfter: 5
      });
    }
    next();
  });

  // Fallback loading page shown during startup before Vite is ready
  app.use((req, res, next) => {
    if (isApplicationReady()) {
      return next();
    }
    // Only intercept HTML requests (not assets, API calls, etc.)
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('text/html')) {
      return res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Loading...</title>
  <style>
    body { 
      margin: 0; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      height: 100vh; 
      background: #0f172a; 
      color: #e2e8f0;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .loader { 
      text-align: center; 
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #334155;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
  <script>
    setTimeout(() => location.reload(), 1500);
  </script>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <p>Starting up...</p>
  </div>
</body>
</html>`);
    }
    next();
  });

  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    async () => {
      log(`serving on port ${port}`);
      
      const initDatabase = async () => {
        try {
          await connectWithRetry(5, 2000);
          setDatabaseReady(true);
          log('Database connection established');
          return true;
        } catch (error: any) {
          log(`Database connection failed after retries: ${error.message}`);
          return false;
        }
      };

      let dbConnected = await initDatabase();
      
      if (!dbConnected) {
        log('Starting background database reconnection...');
        const backgroundRetry = async () => {
          while (!isDatabaseConnected()) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            log('Attempting background database reconnection...');
            dbConnected = await initDatabase();
          }
        };
        backgroundRetry();
      }

      // Auto-seed demo data if database is empty
      if (dbConnected) {
        try {
          const projects = await storage.getProjects();
          const users = await storage.getUsers();
          const hasDemoData = users.some((u: any) => u.id?.startsWith('demo-'));
          
          if (projects.length === 0 || (users.length < 3 && !hasDemoData)) {
            log('Empty database detected - generating demo data...');
            const result = await generateDemoData(false);
            if (result.success) {
              log(`Demo data generated: ${result.created.projects || 0} projects, ${result.created.users || 0} users, ${result.created.tasks || 0} tasks`);
            } else {
              log(`Demo data generation had errors: ${result.errors?.join(', ')}`);
            }
          } else {
            log('Existing data found - skipping demo data generation');
          }
        } catch (error: any) {
          log(`Demo data check/generation failed: ${error.message}`);
        }
      }

      // Setup auth BEFORE registering other routes
      await setupAuth(app);
      await setupMicrosoftAuth(app);
      registerAuthRoutes(app);
      log('Auth routes configured');

      await registerRoutes(httpServer, app);
      log('API routes registered');

      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";

        res.status(status).json({ message });
        throw err;
      });

      if (process.env.NODE_ENV === "production") {
        serveStatic(app);
        log('Static files configured for production');
      } else {
        const { setupVite } = await import("./vite");
        await setupVite(httpServer, app);
        log('Vite dev server configured');
      }
      
      log('Server fully initialized');
    },
  );
})();
