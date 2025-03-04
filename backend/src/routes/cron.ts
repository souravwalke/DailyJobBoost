import { Router, Request, Response } from "express";
import { CronService } from "../services/CronService";
import { verifySignature } from "@upstash/qstash/nextjs";

const router = Router();
const cronService = new CronService();

router.post("/send-emails", verifySignature, async (req: Request, res: Response) => {
  try {
    const { timezone } = req.body;
    await cronService.sendEmailsForTimezone(timezone);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error processing cron webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router; 