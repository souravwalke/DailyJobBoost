import { Client } from "@upstash/qstash";
import { AppDataSource } from "../config/database";
import { User } from "../models/User";
import { Quote } from "../models/Quote";
import { EmailService } from "./EmailService";
import { QuoteRotationService } from "./QuoteRotationService";
import { Repository } from "typeorm";

export class CronService {
  private userRepository: Repository<User>;
  private quoteRepository: Repository<Quote>;
  private emailService: EmailService;
  private quoteRotationService: QuoteRotationService;
  private qstash: Client;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.quoteRepository = AppDataSource.getRepository(Quote);
    this.emailService = new EmailService();
    this.quoteRotationService = new QuoteRotationService();
    this.qstash = new Client({
      token: process.env.QSTASH_TOKEN || "",
    });
  }

  async startDailyEmailJobs() {
    console.log("🚀 Starting to schedule daily email jobs...");
    
    try {
      // First, list and delete all existing schedules
      console.log("🗑️ Cleaning up existing schedules...");
      const existingSchedules = await this.qstash.schedules.list();
      for (const schedule of existingSchedules) {
        console.log(`Deleting schedule ${schedule.scheduleId}...`);
        await this.qstash.schedules.delete(schedule.scheduleId);
      }
      console.log("✅ Existing schedules cleaned up");

      // Schedule a single job that runs every hour to check all timezones
      const schedule = await this.qstash.schedules.create({
        cron: "0 * * * *", // Run every hour
        destination: `${process.env.API_URL}/api/cron/send-emails`,
        body: JSON.stringify({ checkAllTimezones: true }),
        headers: {
          "Content-Type": "application/json"
        }
      });

      console.log("✅ Scheduled hourly check with QStash:", {
        scheduleId: schedule.scheduleId,
        destination: `${process.env.API_URL}/api/cron/send-emails`,
        cron: "0 * * * *"
      });
    } catch (error) {
      console.error("❌ Error scheduling main job:", error);
    }
  }

  async sendEmailsForTimezone(timezone: string) {
    try {
      // Get current hour in the timezone
      const now = new Date();
      const tzTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
      const hour = tzTime.getHours();

      console.log(`🕒 Checking ${timezone}:`, {
        currentTime: tzTime.toLocaleString(),
        hour,
        targetHour: 9
      });

      // Only send emails if it's 9 AM in this timezone
      if (hour !== 9) {
        console.log(`⏭️ Skipping ${timezone} - current hour is ${hour}`);
        return;
      }

      console.log(`📬 Sending emails for ${timezone}...`);
      const users = await this.userRepository.find({ where: { timezone, isActive: true } });

      if (!users.length) {
        console.log(`ℹ️ No active users in ${timezone}`);
        return;
      }

      console.log(`👥 Found ${users.length} active users in ${timezone}`);
      const quote = await this.quoteRotationService.getNextQuoteForTimezone(users);
      console.log(`💭 Selected quote: "${quote.content}" by ${quote.author || 'Anonymous'}`);

      const results = await Promise.allSettled(users.map(user => this.emailService.sendDailyQuote(user, quote)));
      const successful = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;

      console.log(`📊 Email results for ${timezone}: Success ${successful}, Failed ${failed}`);
    } catch (error) {
      console.error(`❌ Error sending emails for ${timezone}:`, error);
    }
  }

  async checkAllTimezones() {
    const timezones = [
      "America/Los_Angeles", "America/Denver", "America/Chicago", "America/New_York",
      "GMT", "Europe/Paris", "Asia/Kolkata", "Asia/Tokyo", "Australia/Sydney"
    ];

    console.log(`🌍 Checking all timezones at ${new Date().toISOString()}`);
    for (const tz of timezones) {
      await this.sendEmailsForTimezone(tz);
    }
    console.log(`✅ Completed timezone checks at ${new Date().toISOString()}`);
  }
}
