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
app.get("/api/health", (_, res) => {
  // Only return healthy if database is connected
  if (AppDataSource.isInitialized) {
    res.status(200).json({ status: "healthy" });
  } else {
    res.status(503).json({ status: "unhealthy", message: "Database not connected" });
  }
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/quotes", quoteRouter);

// Function to attempt database connection with retries
const connectWithRetry = async (retries = 5, interval = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await AppDataSource.initialize();
      console.log("Database connection established");
      return true;
    } catch (error) {
      console.error(`Database connection attempt ${i + 1} failed:`, error);
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
    } else {
      console.error("Failed to establish database connection after retries");
      // Don't exit the process, let the health check handle it
    }
  } catch (error) {
    console.error("Server startup error:", error);
  }
};

startServer(); 