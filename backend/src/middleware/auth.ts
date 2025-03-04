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
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      id: number;
      email: string;
    };

    const admin = await AppDataSource.getRepository(Admin).findOne({
      where: { id: decoded.id },
    });

    if (!admin) {
      res.status(401).json({ message: "Authentication failed" });
      return;
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication failed" });
  }
}; 