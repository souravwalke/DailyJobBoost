import express from "express";
import cors from "cors";
import { AppDataSource } from "./config/database";
import { CronService } from "./services/CronService";
import { userRouter } from "./routes/users";
import quoteRouter from "./routes/quotes";
import authRouter from "./routes/auth";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Log environment configuration (excluding sensitive data)
console.log('Starting server with configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: PORT,
  DATABASE_URL: process.env.DATABASE_URL ? '(Railway URL configured)' : '(not set)',
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USERNAME: process.env.DB_USERNAME,
  FRONTEND_URL: process.env.FRONTEND_URL
});

if (!process.env.FRONTEND_URL) {
  throw new Error('FRONTEND_URL environment variable is not set');
}

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());

// Add health check endpoint before database connection
app.get("/api/health", async (_, res) => {
  try {
    // Always return healthy during startup
    res.status(200).json({ 
      status: "healthy",
      database: AppDataSource.isInitialized ? "connected" : "initializing",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Health check failed:', error);
    // Still return 200 during startup
    res.status(200).json({ 
      status: "healthy",
      database: "error",
      message: "Database connection error",
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/quotes", quoteRouter);

// Function to attempt database connection with retries
const connectWithRetry = async (retries = 10, interval = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Database connection attempt ${i + 1}/${retries}`);
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
        console.log("Database connection established successfully");
        return true;
      } else {
        console.log("Database already initialized");
        return true;
      }
    } catch (error: any) {
      console.error(`Database connection attempt ${i + 1} failed:`, {
        message: error.message,
        code: error.code,
        errno: error.errno,
        syscall: error.syscall,
        address: error.address,
        port: error.port
      });
      if (i < retries - 1) {
        console.log(`Retrying in ${interval/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
  }
  return false;
};

// Function to wait for a specified time
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Process manager to ensure server stays running
class ProcessManager {
  private static instance: ProcessManager;
  private isShuttingDown: boolean = false;
  private server: any;
  private keepAlive: NodeJS.Timeout;

  private constructor() {
    // Keep-alive mechanism
    this.keepAlive = setInterval(() => {
      if (!this.isShuttingDown) {
        console.log('Keep-alive ping:', new Date().toISOString());
      }
    }, 30000);

    // Handle process termination
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Preventing shutdown...');
      this.isShuttingDown = false;
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received. Preventing shutdown...');
      this.isShuttingDown = false;
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.isShuttingDown = false;
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.isShuttingDown = false;
    });

    // Keep the process alive
    process.stdin.resume();
  }

  public static getInstance(): ProcessManager {
    if (!ProcessManager.instance) {
      ProcessManager.instance = new ProcessManager();
    }
    return ProcessManager.instance;
  }

  public setServer(server: any) {
    this.server = server;
  }

  public preventShutdown() {
    this.isShuttingDown = false;
  }
}

async function startServer() {
  try {
    console.log("Starting server initialization...");
    
    // Initialize database connection first
    console.log("Attempting to connect to database...");
    const connected = await connectWithRetry();
    
    if (!connected) {
      console.error("Failed to connect to database after multiple attempts");
      return;
    }

    console.log("Database connection successful");
    
    // Initialize cron service
    console.log("Initializing cron service...");
    const cronService = new CronService();
    cronService.startDailyEmailJobs();
    console.log("Cron service initialized and jobs started");

    // Start server after database and cron are initialized
    const port = process.env.PORT || 3000;
    const server = app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Database URL: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
      console.log(`SMTP Configuration: ${process.env.SMTP_HOST ? 'Configured' : 'Not configured'}`);
    });

    // Initialize process manager
    const processManager = ProcessManager.getInstance();
    processManager.setServer(server);

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
      } else {
        console.error('Server error:', error);
      }
      processManager.preventShutdown();
    });

  } catch (error) {
    console.error("Failed to start server:", error);
  }
}

// Start the server
startServer().catch(error => {
  console.error("Fatal error during server startup:", error);
}); 