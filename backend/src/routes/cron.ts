import { Router } from "express";
import { CronService } from "../services/CronService";
import { Receiver } from "@upstash/qstash";
import { DateTime } from "luxon";
import express from "express";

const router = Router();
const cronService = new CronService();

// Initialize QStash receiver for signature verification
const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!
});

// Middleware to capture raw request body for signature verification
router.use(express.json({
  verify: (req, res, buf) => {
    (req as any).rawBody = buf.toString(); // Store raw body
  }
}));

router.post("/send-emails", async (req, res) => {
  try {
    // Get QStash signature from headers
    const signature = req.headers["upstash-signature"] as string;
    if (!signature) {
      console.error("[QStash] ❌ Missing signature in request");
      return res.status(403).json({ error: "Forbidden: Missing signature" });
    }

    // Verify QStash signature
    try {
      await receiver.verify({
        signature,
        body: (req as any).rawBody // Use raw body for verification
      });
    } catch (error) {
      console.error("[QStash] ❌ Signature verification failed:", error);
      return res.status(403).json({ error: "Forbidden: Invalid signature" });
    }

    console.log("[Cron] 🚀 Starting email job");
    
    // Get current time in UTC
    const now = DateTime.now().setZone("UTC");
    
    // Check each timezone
    for (const timezone of cronService.getSupportedTimezones()) {
      const timeInZone = now.setZone(timezone);
      
      // Only send emails if it's 9:00 AM in that timezone
      if (timeInZone.hour === 9 && timeInZone.minute === 0) {
        console.log(`[Cron] 📧 Sending emails for timezone: ${timezone}`);
        await cronService.sendEmailsForTimezone(timezone);
      }
    }

    res.json({ success: true, message: "Email job completed" });
  } catch (error) {
    console.error("[Cron] ❌ Error in email job:", error);
    res.status(500).json({ success: false, error: "Failed to process email job" });
  }
});

export default router;
