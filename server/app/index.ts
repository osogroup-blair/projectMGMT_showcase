import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../api";
import { serveStatic } from "./static";
import { createServer } from "http";
import { connectWithRetry, isDatabaseConnected, setDatabaseReady } from "../db";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

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
    if (!isDatabaseConnected()) {
      return res.status(503).json({ 
        message: 'Service temporarily unavailable - database connecting',
        retryAfter: 5
      });
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
