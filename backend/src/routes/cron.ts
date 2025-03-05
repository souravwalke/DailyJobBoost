import { Router, Request, Response } from "express";
import { CronService } from "../services/CronService";

const router = Router();
const cronService = new CronService();

router.post("/send-emails", async (req: Request, res: Response) => {
  try {
    // Log the request details
    console.log("📬 Received webhook request:", {
      body: req.body,
      headers: req.headers,
      timestamp: new Date().toISOString(),
      ip: req.ip
    });

    // For development/testing, allow requests without QStash verification
    if (process.env.NODE_ENV === 'development' || process.env.DISABLE_QSTASH_VERIFICATION === 'true') {
      console.log("⚠️ QStash verification disabled - processing request without verification");
    }

    // Process the request
    if (req.body.checkAllTimezones) {
      console.log("🌍 Starting timezone check at:", new Date().toISOString());
      await cronService.checkAllTimezones();
      console.log("✅ Completed timezone check at:", new Date().toISOString());
    } else if (req.body.timezone) {
      console.log(`🕒 Processing single timezone: ${req.body.timezone}`);
      await cronService.sendEmailsForTimezone(req.body.timezone);
    } else {
      console.warn("⚠️ No valid action specified in request body");
      return res.status(400).json({ error: "No valid action specified" });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Error processing cron webhook:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router; 