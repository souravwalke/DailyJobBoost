import cron from "node-cron";
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

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.quoteRepository = AppDataSource.getRepository(Quote);
    this.emailService = new EmailService();
    this.quoteRotationService = new QuoteRotationService();
  }

  startDailyEmailJobs() {
    // Schedule for each timezone
    const timezones = [
      { id: "pst", offset: -8 },
      { id: "mst", offset: -7 },
      { id: "cst", offset: -6 },
      { id: "est", offset: -5 },
      { id: "gmt", offset: 0 },
      { id: "cet", offset: 1 },
      { id: "ist", offset: 5.5 },
      { id: "jst", offset: 9 },
      { id: "aest", offset: 10 }
    ];

    timezones.forEach(tz => {
      // Calculate when 9 AM occurs in each timezone
      const hour = (9 - tz.offset + 24) % 24;
      cron.schedule(`0 ${hour} * * *`, () => {
        this.sendEmailsForTimezone(tz.id);
      });
    });

    console.log("Daily email jobs scheduled successfully");
  }

  async testSendEmails() {
    console.log("Starting test email send to all active users...");
    
    try {
      // Get all active users
      const users = await this.userRepository.find({
        where: { isActive: true }
      });

      if (users.length === 0) {
        console.log("No active users found");
        return;
      }

      console.log(`Found ${users.length} active users`);

      // Get next quote using rotation service
      const quote = await this.quoteRotationService.getNextQuoteForTimezone(users);

      console.log(`Selected quote: "${quote.content}" by ${quote.author || 'Anonymous'}`);

      // Send emails to all users
      const results = await Promise.allSettled(
        users.map(user => this.emailService.sendDailyQuote(user, quote))
      );

      // Log results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`Email sending complete:
        - Total attempts: ${users.length}
        - Successful: ${successful}
        - Failed: ${failed}
      `);

    } catch (error) {
      console.error("Error in test email send:", error);
    }
  }

  private async sendEmailsForTimezone(timezone: string) {
    try {
      // Get all active users in this timezone
      const users = await this.userRepository.find({
        where: {
          timezone,
          isActive: true
        }
      });

      if (users.length === 0) return;

      // Get next quote using rotation service
      const quote = await this.quoteRotationService.getNextQuoteForTimezone(users);

      // Send emails to all users in parallel
      await Promise.all(
        users.map(user => this.emailService.sendDailyQuote(user, quote))
      );

      console.log(`Sent daily quotes to ${users.length} users in ${timezone} timezone`);
    } catch (error) {
      console.error(`Failed to send emails for timezone ${timezone}:`, error);
    }
  }
} 