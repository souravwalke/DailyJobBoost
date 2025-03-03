import { DataSource } from "typeorm";
import { User } from "../models/User";
import { Quote } from "../models/Quote";
import { EmailLog } from "../models/EmailLog";
import { Admin } from "../models/Admin";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

// Log all environment variables related to database (excluding sensitive data)
console.log('Database Configuration:', {
  DATABASE_URL: process.env.DATABASE_URL ? 'Present' : 'Missing',
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USERNAME: process.env.DB_USERNAME,
  NODE_ENV: process.env.NODE_ENV
});

// Parse DATABASE_URL if available (Railway provides this)
const getDatabaseConfig = () => {
  if (process.env.DATABASE_URL) {
    // Log that we're using the Railway database URL
    console.log('Using Railway DATABASE_URL for connection');
    return {
      url: process.env.DATABASE_URL,
      type: "postgres" as const,
      ssl: {
        rejectUnauthorized: false // Required for Railway's SSL connection
      },
      entities: [User, Quote, EmailLog, Admin],
      migrations: [path.join(__dirname, "../migrations/*.{ts,js}")], // Support both .ts and .js files
      migrationsRun: true, // Automatically run migrations
      synchronize: false // Disable synchronize in production
    };
  }

  // Fallback to individual connection parameters
  console.log('Using individual database connection parameters');
  return {
    type: "postgres" as const,
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "dailyjobboost",
    entities: [User, Quote, EmailLog, Admin],
    migrations: [path.join(__dirname, "../migrations/*.{ts,js}")],
    migrationsRun: process.env.NODE_ENV === "production", // Auto-run migrations in production
    synchronize: process.env.NODE_ENV !== "production" // Only synchronize in development
  };
};

const dbConfig = getDatabaseConfig();

export const AppDataSource = new DataSource({
  ...dbConfig,
  logging: true, // Enable logging to see SQL queries
  subscribers: []
}); 