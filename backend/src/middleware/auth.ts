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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as {
      id: number;
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