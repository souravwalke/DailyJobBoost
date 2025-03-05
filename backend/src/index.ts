import express from "express";
import cors from "cors";
import { AppDataSource } from "./config/database";
import { CronService } from "./services/CronService";
import { userRouter } from "./routes/users";
import quoteRouter from "./routes/quotes";
import authRouter from "./routes/auth";
import dotenv from "dotenv";
import cronRouter from "./routes/cron";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
let isDbConnected = false;
let isServerReady = false;

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
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  })
);
app.use(express.json());

// Enhanced health check endpoint (both /health and /api/health)
const healthCheck = async (req: express.Request, res: express.Response) => {
  try {
    // Check database connection
    const dbStatus = isDbConnected && AppDataSource.isInitialized;
    
    // Basic application status
    const status = {
      status: dbStatus && isServerReady ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      database: dbStatus ? "connected" : "disconnected",
      server: isServerReady ? "ready" : "starting",
      uptime: process.uptime()
    };

    // Send appropriate status code
    const statusCode = status.status === "healthy" ? 200 : 503;
    res.status(statusCode).json(status);
    
    // Log health check result
    console.log("Health check result:", status);
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({
      status: "unhealthy",
      error: "Health check failed",
      timestamp: new Date().toISOString()
    });
  }
};

// Register health check endpoints at both paths
app.get("/health", healthCheck);
app.get("/api/health", healthCheck);

// Routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/quotes", quoteRouter);
app.use("/api/cron", cronRouter);

// Keep track of server state
let isShuttingDown = false;

// Keep-alive ping with more details
const sendKeepAlivePing = () => {
  if (!isShuttingDown) {
    console.log(`Keep-alive ping at ${new Date().toISOString()}`, {
      dbConnected: isDbConnected,
      serverReady: isServerReady,
      uptime: process.uptime()
    });
  }
};

// Function to attempt database connection with retries
async function connectWithRetry(retries = 5, interval = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      await AppDataSource.initialize();
      isDbConnected = true;
      console.log("Database connected successfully");
      return true;
    } catch (error) {
      console.error(`Database connection attempt ${i + 1} failed:`, error);
      if (i < retries - 1) {
        console.log(`Retrying in ${interval / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
  }
  return false;
}

// Graceful shutdown handler
const handleShutdown = async () => {
  if (isShuttingDown) return;
  
  isShuttingDown = true;
  console.log("Received shutdown signal");
  
  try {
    // Close database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      isDbConnected = false;
      console.log("Database connection closed");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
};

// Start the server
async function startServer() {
  try {
    console.log("Starting server initialization...");
    
    // Connect to database
    const dbConnected = await connectWithRetry();
    if (!dbConnected) {
      console.error("Failed to connect to database after retries");
      process.exit(1);
    }

    // Initialize cron service
    const cronService = new CronService();
    await cronService.startDailyEmailJobs();
    console.log("Cron service initialized and jobs started");

    // Start server
    const server = app.listen(PORT, () => {
      isServerReady = true;
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Database URL: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
      console.log(`SMTP Configuration: ${process.env.SMTP_HOST ? 'Configured' : 'Not configured'}`);
    });

    // Add error handler for server
    server.on('error', (error) => {
      console.error('Server error:', error);
      isServerReady = false;
    });

    // Start keep-alive mechanism
    setInterval(sendKeepAlivePing, 30000); // Send ping every 30 seconds

    // Handle process signals
    process.on('SIGTERM', handleShutdown);
    process.on('SIGINT', handleShutdown);

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      isServerReady = false;
      // Don't exit the process
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Don't exit the process
    });

  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

startServer(); 