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
  DB_HOST: process.env.DB_HOST ? 'Present' : 'Missing',
  DB_PORT: process.env.DB_PORT ? 'Present' : 'Missing',
  DB_NAME: process.env.DB_NAME ? 'Present' : 'Missing',
  DB_USERNAME: process.env.DB_USERNAME ? 'Present' : 'Missing',
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
      migrations: [path.join(__dirname, "../migrations/*.{ts,js}")],
      migrationsRun: true,
      synchronize: false
    };
  }

  // Fallback to individual connection parameters
  if (!process.env.DB_HOST || !process.env.DB_PORT || !process.env.DB_NAME || 
      !process.env.DB_USERNAME || !process.env.DB_PASSWORD) {
    throw new Error('Missing required database environment variables');
  }

  console.log('Using individual database connection parameters');
  return {
    type: "postgres" as const,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [User, Quote, EmailLog, Admin],
    migrations: [path.join(__dirname, "../migrations/*.{ts,js}")],
    migrationsRun: process.env.NODE_ENV === "production",
    synchronize: false // Disable synchronize in all environments
  };
};

const dbConfig = getDatabaseConfig();

export const AppDataSource = new DataSource({
  ...dbConfig,
  logging: process.env.NODE_ENV !== "production", // Only enable logging in development
  subscribers: []
}); 