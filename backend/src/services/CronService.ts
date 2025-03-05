import { AppDataSource } from "../config/database";
import { User } from "../models/User";
import { Quote } from "../models/Quote";
import { EmailService } from "./EmailService";
import { QuoteRotationService } from "./QuoteRotationService";
import { Repository } from "typeorm";
import { Client } from "@upstash/qstash";

// Add QStash schedule type
interface QStashSchedule {
  scheduleId: string;
  destination: string;
  cron: string;
  status: string;
  headers: Record<string, string>;
  lastRun?: string;
}

// Use a Set for O(1) lookup instead of an array
const SUPPORTED_TIMEZONES = new Set([
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "GMT",
  "Europe/Paris",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Australia/Sydney"
]);

export class CronService {
  private userRepository: Repository<User>;
  private quoteRepository: Repository<Quote>;
  private emailService: EmailService;
  private quoteRotationService: QuoteRotationService;
  private qstash: Client;

  constructor() {
    if (!process.env.QSTASH_TOKEN || !process.env.API_URL) {
      throw new Error("Missing required environment variables: QSTASH_TOKEN or API_URL");
    }

    this.userRepository = AppDataSource.getRepository(User);
    this.quoteRepository = AppDataSource.getRepository(Quote);
    this.emailService = new EmailService();
    this.quoteRotationService = new QuoteRotationService();
    this.qstash = new Client({ token: process.env.QSTASH_TOKEN });
  }

  async startDailyEmailJobs() {
    console.log("[CronService] 🚀 Setting up QStash schedules for each timezone...");
    
    // First, clean up any existing schedules
    await this.cleanupSchedules();
    
    for (const timezone of SUPPORTED_TIMEZONES) {
      try {
        const schedule = await this.qstash.schedules.create({
          cron: `0 9 * * * ${timezone}`,
          destination: `${process.env.API_URL}/api/cron/send-emails`,
          retries: 3,
          headers: {
            "Content-Type": "application/json",
            "X-Timezone": timezone
          }
        });

        if (!schedule?.scheduleId) {
          throw new Error("Failed to create schedule - no ID returned");
        }

        console.log(`[CronService] ✅ Scheduled email job for ${timezone}`);

        const createdSchedule = await this.qstash.schedules.get(schedule.scheduleId) as unknown as QStashSchedule;
        if (createdSchedule?.status !== "active") {
          throw new Error(`Schedule created but not active. Status: ${createdSchedule?.status}`);
        }
      } catch (error) {
        console.error(`[CronService] ❌ Failed to schedule email job for ${timezone}:`, error);
        throw error;
      }
    }

    console.log("[CronService] ✅ All schedules created successfully");
  }

  private async cleanupSchedules() {
    try {
      console.log("[CronService] 🧹 Cleaning up existing schedules...");
      const schedules = await this.qstash.schedules.list();

      let deletedCount = 0;
      for (const schedule of schedules) {
        if (schedule.destination.includes('/api/cron/send-emails')) {
          await this.qstash.schedules.delete(schedule.scheduleId);
          deletedCount++;
        }
      }

      console.log(`[CronService] ✅ Cleaned up ${deletedCount} old schedules`);
    } catch (error) {
      console.error("[CronService] ❌ Failed to cleanup schedules:", error);
      throw error;
    }
  }

  async sendEmailsForTimezone(timezone: string) {
    // Validate timezone with O(1) lookup
    if (!SUPPORTED_TIMEZONES.has(timezone)) {
      throw new Error(`Unsupported timezone: ${timezone}`);
    }

    try {
      console.log(`[CronService] 📬 Processing emails for ${timezone}...`);
      const users = await this.userRepository.find({ where: { timezone, isActive: true } });

      if (users.length === 0) {
        console.log(`[CronService] ℹ️ No active users in ${timezone}`);
        return;
      }

      console.log(`[CronService] 👥 Found ${users.length} active users in ${timezone}`);

      const quote = await this.quoteRotationService.getNextQuoteForTimezone(users);
      if (!quote) {
        console.warn(`[CronService] ⚠️ No available quotes for timezone ${timezone}`);
        return;
      }

      console.log(`[CronService] 💭 Selected quote: "${quote.content}" by ${quote.author || "Anonymous"}"`);

      const batchSize = 50;
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(user => this.sendWithRetry(user, quote))
        );

        const successful = results.filter(r => r.status === "fulfilled").length;
        const failed = results.filter(r => r.status === "rejected").length;

        console.log(`[CronService] 📊 Email batch results for ${timezone}: Success ${successful}, Failed ${failed}`);
        
        if (i + batchSize < users.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error(`[CronService] ❌ Error sending emails for ${timezone}:`, error);
      throw error;
    }
  }

  private async sendWithRetry(user: User, quote: Quote, maxRetries = 3): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.emailService.sendDailyQuote(user, quote);
        return;
      } catch (error) {
        if (attempt === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }
    }
  }

  async checkScheduleHealth(): Promise<{
    total: number;
    active: number;
    inactive: number;
    schedules: Array<{ timezone: string; status: string; lastRun?: string }>
  }> {
    const schedules = await this.qstash.schedules.list() as unknown as QStashSchedule[];
    const emailSchedules = schedules.filter(s => 
      s.destination.includes('/api/cron/send-emails')
    );

    return {
      total: emailSchedules.length,
      active: emailSchedules.filter(s => s.status === 'active').length,
      inactive: emailSchedules.filter(s => s.status !== 'active').length,
      schedules: emailSchedules.map(s => ({
        timezone: s.headers?.["x-timezone"]?.toString() || s.headers?.["X-Timezone"]?.toString(),
        status: s.status,
        lastRun: s.lastRun
      }))
    };
  }
}
