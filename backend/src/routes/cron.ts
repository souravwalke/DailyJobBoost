import { Router, Request, Response } from "express";
import { CronService } from "../services/CronService";
import { verifySignature } from "@upstash/qstash/nextjs";

const router = Router();
const cronService = new CronService();

router.post("/send-emails", verifySignature, async (req: Request, res: Response) => {
  try {
    console.log("📬 Received webhook from QStash:", {
      body: req.body,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });

    const { timezone } = req.body;
    if (!timezone) {
      console.error("❌ No timezone provided in webhook");
      return res.status(400).json({ error: "No timezone provided" });
    }

    console.log(`🕒 Processing emails for timezone: ${timezone}`);
    await cronService.sendEmailsForTimezone(timezone);
    
    console.log(`✅ Successfully processed emails for ${timezone}`);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Error processing cron webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router; 