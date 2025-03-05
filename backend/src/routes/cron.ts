import { Router, Request, Response } from "express";
import { CronService } from "../services/CronService";
import { Receiver } from "@upstash/qstash";

const router = Router();
const cronService = new CronService();

// Initialize QStash receiver with signing key
const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || "",
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || "",
});

router.post("/send-emails", async (req: Request, res: Response) => {
  try {
    // Skip signature verification in development or if explicitly disabled
    if (process.env.NODE_ENV !== "production" || process.env.SKIP_QSTASH_VERIFICATION === "true") {
      console.log("⚠️ Skipping QStash signature verification");
    } else {
      const signature = req.headers["upstash-signature"] as string;
      if (!signature) {
        console.error("❌ No QStash signature found in request headers");
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Verify the request
      const isValid = await receiver.verify({
        signature,
        body: JSON.stringify(req.body),
      });

      if (!isValid) {
        console.error("❌ Invalid QStash signature");
        return res.status(401).json({ error: "Invalid signature" });
      }
    }

    console.log("📬 Received webhook from QStash:", {
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