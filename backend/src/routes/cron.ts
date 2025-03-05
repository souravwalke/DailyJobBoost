import express from "express";
import { CronService } from "../services/CronService";
import { Receiver } from "@upstash/qstash";

const router = express.Router();
const cronService = new CronService();

// Validate signing keys at startup
if (!process.env.QSTASH_CURRENT_SIGNING_KEY || !process.env.QSTASH_NEXT_SIGNING_KEY) {
  console.error("[QStash] ❌ Missing signing keys in environment variables!");
  process.exit(1); // Exit if critical env vars are missing
}

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
      console.error("[QStash] ❌ Signature verification failed. Possible causes:");
      console.error("  - Mismatched request body?");
      console.error("  - Incorrect signing key?");
      console.error("  - Tampered request?");
      console.error("Error details:", error);
      return res.status(403).json({ error: "Forbidden: Invalid signature" });
    }

    // Extract timezone from headers (case-insensitive)
    const timezone = req.headers["x-timezone"]?.toString() || req.headers["X-Timezone"]?.toString();
    if (!timezone) {
      console.error("[CronRoute] ❌ Missing 'x-timezone' header");
      return res.status(400).json({ error: "Bad Request: Missing timezone" });
    }

    console.log(`[CronRoute] ✅ Received request for timezone: ${timezone}`);

    // Process emails for the timezone
    await cronService.sendEmailsForTimezone(timezone);
    res.json({ success: true, message: `Processed emails for ${timezone}` });

  } catch (error) {
    console.error("[CronRoute] ❌ Error processing email webhook:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
