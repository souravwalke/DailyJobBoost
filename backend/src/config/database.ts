import { DataSource } from "typeorm";
import { User } from "../models/User";
import { Quote } from "../models/Quote";
import { EmailLog } from "../models/EmailLog";
import { Admin } from "../models/Admin";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "dailyjobboost",
  synchronize: process.env.NODE_ENV !== "production",
  logging: process.env.NODE_ENV !== "production",
  entities: [User, Quote, EmailLog, Admin],
  migrations: [path.join(__dirname, "../migrations/*.ts")],
  subscribers: [],
}); 