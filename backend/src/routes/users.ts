import express from "express";
import { AppDataSource } from "../config/database";
import { User } from "../models/User";
import { CronService } from "../services/CronService";
import { EmailService } from "../services/EmailService";
import { z } from "zod";

const router = express.Router();
const userRepository = AppDataSource.getRepository(User);
const cronService = new CronService();
const emailService = new EmailService();

// Validation schema
const subscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
  timezone: z.string().min(1, "Timezone is required"),
});

// Subscribe endpoint
router.post("/subscribe", async (req, res) => {
  try {
    // Validate request body
    const { email, timezone } = subscribeSchema.parse(req.body);

    // Check if user already exists
    let user = await userRepository.findOne({ where: { email } });

    if (user) {
      // Update existing user
      user.timezone = timezone;
      user.isActive = true;
    } else {
      // Create new user
      user = userRepository.create({
        email,
        timezone,
        isActive: true,
      });
    }

    // Save user
    await userRepository.save(user);

    // Send welcome email
    await emailService.sendWelcomeEmail(user);

    res.status(200).json({
      message: "Successfully subscribed to daily motivational quotes!",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    } else {
      console.error("Subscription error:", error);
      res.status(500).json({
        message: "Failed to subscribe. Please try again later.",
      });
    }
  }
});

// Unsubscribe endpoint with token
router.get("/unsubscribe/:token", async (req, res) => {
  try {
    const { token } = req.params;
    
    // Verify token and get user
    const user = await emailService.verifyUnsubscribeToken(token);

    if (!user) {
      return res.status(404).json({
        message: "Invalid or expired unsubscribe link",
      });
    }

    // Update user status
    user.isActive = false;
    await userRepository.save(user);

    res.status(200).json({
      message: "Successfully unsubscribed from daily motivational quotes.",
    });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    res.status(500).json({
      message: "Failed to unsubscribe. Please try again later.",
    });
  }
});

// Manual unsubscribe endpoint (for testing)
router.post("/unsubscribe", async (req, res) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);

    const user = await userRepository.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.isActive = false;
    await userRepository.save(user);

    res.status(200).json({
      message: "Successfully unsubscribed from daily motivational quotes.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    } else {
      console.error("Unsubscribe error:", error);
      res.status(500).json({
        message: "Failed to unsubscribe. Please try again later.",
      });
    }
  }
});

// Test endpoint to trigger daily emails
router.post("/test-daily-emails", async (req, res) => {
  try {
    await cronService.testSendEmails();
    res.status(200).json({
      message: "Test emails triggered successfully. Check server logs for details.",
    });
  } catch (error) {
    console.error("Failed to trigger test emails:", error);
    res.status(500).json({
      message: "Failed to trigger test emails. Check server logs for details.",
    });
  }
});

export const userRouter = router; 