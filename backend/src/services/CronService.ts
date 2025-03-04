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
    console.log("Starting to schedule daily email jobs...");
    console.log(`Current server time: ${new Date().toISOString()}`);
    
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

    // Log all scheduled jobs
    console.log("Scheduled jobs for the next 24 hours:");
    const now = new Date();
    timezones.forEach(tz => {
      const hour = Math.round((9 - tz.offset + 24) % 24);
      const nextRun = new Date(now);
      nextRun.setHours(hour, 0, 0, 0);
      if (nextRun < now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      console.log(`- ${tz.id} (UTC+${tz.offset}): Next run at ${nextRun.toISOString()} (${nextRun.toLocaleString()})`);
    });

    // TEST: Schedule a job to run in 2 minutes
    const testJob = cron.schedule('*/2 * * * *', () => {
      console.log(`[CRON] Test job triggered at ${new Date().toISOString()}`);
      this.sendEmailsForTimezone('America/Los_Angeles');
    });
    testJob.start();
    console.log('[CRON] Test job scheduled to run every 2 minutes');

    // Original timezone-based jobs
    timezones.forEach(tz => {
      const hour = Math.round((9 - tz.offset + 24) % 24);
      const cronExpression = `0 ${hour} * * *`;
      console.log(`Scheduling job for timezone ${tz.id} (UTC+${tz.offset}) at ${hour}:00 UTC (${cronExpression})`);
      
      const job = cron.schedule(cronExpression, () => {
        console.log(`[CRON] Job triggered for timezone ${tz.id} at ${new Date().toISOString()}`);
        console.log(`[CRON] Current server time: ${new Date().toISOString()}`);
        this.sendEmailsForTimezone(tz.id);
      });

      job.start();
      console.log(`[CRON] Successfully scheduled job for timezone ${tz.id}`);
    });

    console.log("Daily email jobs scheduling completed");
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
      console.log(`Starting to send emails for timezone ${timezone}`);
      
      // Get all active users in this timezone
      const users = await this.userRepository.find({
        where: {
          timezone,
          isActive: true
        }
      });

      if (users.length === 0) {
        console.log(`No active users found in timezone ${timezone}`);
        return;
      }

      console.log(`Found ${users.length} active users in timezone ${timezone}`);

      // Get next quote using rotation service
      const quote = await this.quoteRotationService.getNextQuoteForTimezone(users);

      console.log(`Selected quote for timezone ${timezone}: "${quote.content}" by ${quote.author || 'Anonymous'}`);

      // Send emails to all users in parallel
      const results = await Promise.allSettled(
        users.map(user => this.emailService.sendDailyQuote(user, quote))
      );

      // Log results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`Email sending complete for timezone ${timezone}:
        - Total attempts: ${users.length}
        - Successful: ${successful}
        - Failed: ${failed}
      `);

    } catch (error) {
      console.error(`Failed to send emails for timezone ${timezone}:`, error);
    }
  }
} 