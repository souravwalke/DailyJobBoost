import { Router, Request, Response } from "express";
import { CronService } from "../services/CronService";

const router = Router();
const cronService = new CronService();

router.post("/send-emails", async (req: Request, res: Response) => {
  try {
    console.log("📬 Received webhook request:", {
      body: req.body,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });

    if (req.body.checkAllTimezones) {
      console.log("🌍 Starting timezone check at:", new Date().toISOString());
      await cronService.checkAllTimezones();
      console.log("✅ Completed timezone check at:", new Date().toISOString());
    } else if (req.body.timezone) {
      console.log(`🕒 Processing single timezone: ${req.body.timezone}`);
      await cronService.sendEmailsForTimezone(req.body.timezone);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Error processing cron webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router; 