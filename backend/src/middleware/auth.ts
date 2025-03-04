import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { Admin } from "../models/Admin";

declare global {
  namespace Express {
    interface Request {
      admin?: Admin;
    }
  }
}

export const auth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('Auth middleware: Checking authentication...');
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      console.log('Auth middleware: No token provided');
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!process.env.JWT_SECRET) {
      console.error('Auth middleware: JWT_SECRET not set');
      throw new Error('JWT_SECRET environment variable is not set');
    }

    // Check database connection
    if (!AppDataSource.isInitialized) {
      console.log('Auth middleware: Initializing database connection...');
      await AppDataSource.initialize();
    }

    console.log('Auth middleware: Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      id: number;
      email: string;
    };
    console.log('Auth middleware: Token verified for admin:', decoded.email);

    console.log('Auth middleware: Finding admin in database...');
    const admin = await AppDataSource.getRepository(Admin).findOne({
      where: { id: decoded.id },
    });

    if (!admin) {
      console.log('Auth middleware: Admin not found in database');
      res.status(401).json({ message: "Authentication failed" });
      return;
    }

    console.log('Auth middleware: Authentication successful');
    req.admin = admin;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.error('Auth middleware: JWT verification failed:', error.message);
    } else if (error instanceof Error) {
      console.error('Auth middleware: Error:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    } else {
      console.error('Auth middleware: Unknown error:', error);
    }
    res.status(401).json({ 
      message: "Authentication failed",
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    });
  }
}; 