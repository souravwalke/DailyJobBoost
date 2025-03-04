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
    console.log("Starting to schedule daily email jobs...");
    
    const timezones = [
      "America/Los_Angeles", "America/Denver", "America/Chicago", "America/New_York",
      "GMT", "Europe/Paris", "Asia/Kolkata", "Asia/Tokyo", "Australia/Sydney"
    ];

    for (const tz of timezones) {
      try {
        // Schedule job for 9:00 AM in each timezone
        await this.qstash.schedules.create({
          cron: "0 9 * * *",
          destination: `${process.env.API_URL}/api/cron/send-emails`,
          body: JSON.stringify({ timezone: tz }),
          headers: {
            "Content-Type": "application/json"
          }
        });

        console.log(`Scheduled job for ${tz} at 9:00 AM local time`);
      } catch (error) {
        console.error(`Error scheduling job for ${tz}:`, error);
      }
    }

    console.log("All daily email jobs scheduled successfully.");
  }

  async sendEmailsForTimezone(timezone: string) {
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
