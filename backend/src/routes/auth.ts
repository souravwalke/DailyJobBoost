import { Router } from "express";
import { AppDataSource } from "../config/database";
import { Admin } from "../models/Admin";
import { z } from "zod";
import jwt from "jsonwebtoken";

const router = Router();
const adminRepository = AppDataSource.getRepository(Admin);

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  secretKey: z.string(),
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    console.log("Login attempt for email:", req.body.email);
    const { email, password } = loginSchema.parse(req.body);

    const admin = await adminRepository.findOne({ where: { email } });
    console.log("Admin found:", admin ? "yes" : "no");

    if (!admin) {
      console.log("No admin found with email:", email);
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isValidPassword = await admin.validatePassword(password);
    console.log("Password validation result:", isValidPassword);

    if (!isValidPassword) {
      console.log("Invalid password for admin:", email);
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log("Login successful for admin:", email);
    res.json({ token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("Validation error:", error.errors);
      res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    } else {
      console.error("Login error:", error);
      res.status(500).json({
        message: "Failed to login",
      });
    }
  }
});

// Register endpoint (protected by secret key)
router.post("/register", async (req, res) => {
  try {
    const { email, password, secretKey } = registerSchema.parse(req.body);

    // Verify secret key
    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(401).json({
        message: "Invalid secret key",
      });
    }

    // Check if admin already exists
    const existingAdmin = await adminRepository.findOne({ where: { email } });

    if (existingAdmin) {
      return res.status(400).json({
        message: "Admin already exists",
      });
    }

    // Create new admin
    const admin = new Admin();
    admin.email = email;
    await admin.setPassword(password);

    await adminRepository.save(admin);

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    } else {
      console.error("Registration error:", error);
      res.status(500).json({
        message: "Failed to register",
      });
    }
  }
});

export default router; 