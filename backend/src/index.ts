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
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USERNAME: process.env.DB_USERNAME,
  FRONTEND_URL: process.env.FRONTEND_URL
});

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
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
      await AppDataSource.initialize();
      console.log("Database connection established successfully");
      return true;
    } catch (error: any) {
      console.error(`Database connection attempt ${i + 1} failed:`, error.message || 'Unknown error');
      if (i < retries - 1) {
        console.log(`Retrying in ${interval/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
  }
  return false;
};

// Start server and initialize database
const startServer = async () => {
  try {
    // Start the server first so health checks don't timeout
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Attempt to connect to the database
    const connected = await connectWithRetry();
    
    if (connected) {
      // Start the cron jobs only if database connection is successful
      const cronService = new CronService();
      cronService.startDailyEmailJobs();
      console.log('Server initialization completed successfully');
    } else {
      console.error("Failed to establish database connection after all retries");
      // Don't exit the process, let the health check handle it
    }
  } catch (error) {
    console.error("Server startup error:", error);
  }
};

startServer(); 