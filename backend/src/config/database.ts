import { DataSource } from "typeorm";
import { User } from "../models/User";
import { Quote } from "../models/Quote";
import { EmailLog } from "../models/EmailLog";
import { Admin } from "../models/Admin";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

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
      }
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
    database: process.env.DB_NAME || "dailyjobboost"
  };
};

const dbConfig = getDatabaseConfig();

export const AppDataSource = new DataSource({
  ...dbConfig,
  synchronize: process.env.NODE_ENV !== "production",
  logging: process.env.NODE_ENV !== "production",
  entities: [User, Quote, EmailLog, Admin],
  migrations: [path.join(__dirname, "../migrations/*.ts")],
  subscribers: []
}); 