import express from "express";
import { AppDataSource } from "../config/database";
import { User } from "../models/User";
import { EmailService } from "../services/EmailService";
import { z } from "zod";
import { QuoteRotationService } from "../services/QuoteRotationService";
import { toZonedTime } from "date-fns-tz";

const router = express.Router();
const userRepository = AppDataSource.getRepository(User);
const emailService = new EmailService();
const quoteRotationService = new QuoteRotationService();

// Subscribe endpoint
router.post("/subscribe", async (req, res) => {
  try {
    const subscribeSchema = z.object({
      email: z.string().email(),
      timezone: z.string(),
    });

    const { email, timezone } = subscribeSchema.parse(req.body);

    // Save or update user
    let user = await userRepository.findOne({ where: { email } });
    if (user) {
      user.timezone = timezone;
      user.isActive = true;
    } else {
      user = userRepository.create({ email, timezone, isActive: true });
    }
    await userRepository.save(user);

    // Send welcome email
    await emailService.sendWelcomeEmail(user);

    // Send today's quote if it's before 9 AM in their timezone
    const now = new Date();
    const userTime = toZonedTime(now, timezone);
    const targetTime = new Date(userTime);
    targetTime.setHours(9, 0, 0, 0);

    if (userTime < targetTime) {
      const quote = await quoteRotationService.getNextQuoteForTimezone([user]);
      await emailService.sendDailyQuote(user, quote);
    }

    res.status(200).json({ message: "Successfully subscribed to daily quotes" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error("Error in subscription:", error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  }
});

export default router; 