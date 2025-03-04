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
    // Check if database is connected
    if (AppDataSource.isInitialized) {
      // Verify connection with a simple query
      await AppDataSource.query('SELECT 1');
      res.status(200).json({ status: "healthy" });
    } else {
      res.status(503).json({ 
        status: "unhealthy", 
        message: "Database not connected",
        initialized: false
      });
    }
  } catch (error: any) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: "unhealthy", 
      message: "Database connection error",
      error: error.message || 'Unknown error'
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

async function startServer() {
  try {
    console.log("Starting server initialization...");
    
    // Initialize database connection
    console.log("Attempting to connect to database...");
    const connected = await connectWithRetry();
    
    if (connected) {
      console.log("Database connection successful");
      
      // Initialize cron service
      console.log("Initializing cron service...");
      const cronService = new CronService();
      cronService.startDailyEmailJobs();
      console.log("Cron service initialized and jobs started");
    } else {
      console.error("Failed to connect to database after multiple attempts");
      // Don't exit process, let health check handle it
    }

    // Start server
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Database URL: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
      console.log(`Email service: ${process.env.EMAIL_SERVICE ? 'Configured' : 'Not configured'}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer(); 