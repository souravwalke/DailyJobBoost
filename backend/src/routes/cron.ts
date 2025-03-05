import { Router, Request, Response } from "express";
import { CronService } from "../services/CronService";

const router = Router();
const cronService = new CronService();

router.post("/send-emails", async (req: Request, res: Response) => {
  try {
    console.log("📬 Received request to check timezones:", {
      timestamp: new Date().toISOString()
    });

    await cronService.checkAllTimezones();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Error checking timezones:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router; 