import cron from "node-cron";
import { AppDataSource } from "../config/database";
import { User } from "../models/User";
import { Quote } from "../models/Quote";
import { EmailService } from "./EmailService";
import { Repository } from "typeorm";

export class CronService {
  private userRepository: Repository<User>;
  private quoteRepository: Repository<Quote>;
  private emailService: EmailService;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.quoteRepository = AppDataSource.getRepository(Quote);
    this.emailService = new EmailService();
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

      // Get a random quote
      const quotesCount = await this.quoteRepository.count();
      const randomOffset = Math.floor(Math.random() * quotesCount);
      const [quote] = await this.quoteRepository.find({
        skip: randomOffset,
        take: 1
      });

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