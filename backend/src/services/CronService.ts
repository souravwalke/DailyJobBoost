import cron from "node-cron";
import { AppDataSource } from "../config/database";
import { User } from "../models/User";
import { Quote } from "../models/Quote";
import { EmailService } from "./EmailService";
import { QuoteRotationService } from "./QuoteRotationService";
import { Repository } from "typeorm";
import { format, toZonedTime } from 'date-fns-tz';

export class CronService {
  private userRepository: Repository<User>;
  private quoteRepository: Repository<Quote>;
  private emailService: EmailService;
  private quoteRotationService: QuoteRotationService;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.quoteRepository = AppDataSource.getRepository(Quote);
    this.emailService = new EmailService();
    this.quoteRotationService = new QuoteRotationService();
  }

  startDailyEmailJobs() {
    console.log("Starting to schedule daily email jobs...");
    
    const timezones = [
      "America/Los_Angeles", "America/Denver", "America/Chicago", "America/New_York",
      "GMT", "Europe/Paris", "Asia/Kolkata", "Asia/Tokyo", "Australia/Sydney"
    ];

    timezones.forEach((tz) => {
      // Get next occurrence of 9:00 AM in this timezone
      const now = new Date();
      const zonedTime = toZonedTime(now, tz); // Convert current time to the given timezone
      const targetTime = new Date(zonedTime);
      targetTime.setHours(9, 0, 0, 0); // Set to 9:00 AM in local timezone

      // If 9 AM has already passed today, schedule for tomorrow
      if (targetTime < zonedTime) {
        targetTime.setDate(targetTime.getDate() + 1);
      }

      // Convert target time to UTC
      const targetTimeUTC = targetTime.toISOString();
      const cronMinutes = format(targetTime, "m", { timeZone: "UTC" });
      const cronHours = format(targetTime, "H", { timeZone: "UTC" });
      const cronExpression = `${cronMinutes} ${cronHours} * * *`;

      console.log(`Scheduling job for ${tz}:`);
      console.log(`  - Local 9:00 AM time: ${targetTime.toLocaleString("en-US", { timeZone: tz })}`);
      console.log(`  - UTC time: ${targetTimeUTC}`);
      console.log(`  - Cron expression: ${cronExpression}`);

      const job = cron.schedule(cronExpression, () => {
        console.log(`[CRON] Triggered job for ${tz} at ${new Date().toISOString()} UTC`);
        console.log(`[CRON] Local time in ${tz}: ${new Date().toLocaleString("en-US", { timeZone: tz })}`);
        this.sendEmailsForTimezone(tz);
      });

      job.start();
    });

    console.log("All daily email jobs scheduled successfully.");
  }

  private async sendEmailsForTimezone(timezone: string) {
    try {
      console.log(`Sending emails for ${timezone}...`);
      const users = await this.userRepository.find({ where: { timezone, isActive: true } });

      if (!users.length) {
        console.log(`No active users in ${timezone}`);
        return;
      }

      const quote = await this.quoteRotationService.getNextQuoteForTimezone(users);
      console.log(`Selected quote: "${quote.content}" by ${quote.author || 'Anonymous'}`);

      const results = await Promise.allSettled(users.map(user => this.emailService.sendDailyQuote(user, quote)));
      const successful = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;

      console.log(`Email results for ${timezone}: Success ${successful}, Failed ${failed}`);
    } catch (error) {
      console.error(`Error sending emails for ${timezone}:`, error);
    }
  }
} 