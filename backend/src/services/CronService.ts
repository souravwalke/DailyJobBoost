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
    
    // Schedule for each timezone using IANA timezone names
    const timezones = [
      { 
        id: "America/Los_Angeles",
        offset: -8,
        display: "Pacific Time"
      },
      { id: "America/Denver", offset: -7, display: "Mountain Time" },
      { id: "America/Chicago", offset: -6, display: "Central Time" },
      { id: "America/New_York", offset: -5, display: "Eastern Time" },
      { id: "GMT", offset: 0, display: "Greenwich Mean Time" },
      { id: "Europe/Paris", offset: 1, display: "Central European Time" },
      { id: "Asia/Kolkata", offset: 5.5, display: "India Standard Time" },
      { id: "Asia/Tokyo", offset: 9, display: "Japan Standard Time" },
      { id: "Australia/Sydney", offset: 10, display: "Australian Eastern Time" }
    ];

    // TEST: Schedule a one-time job for 1 PM PST today
    const testTime = new Date();
    testTime.setHours(13, 0, 0, 0); // 1 PM
    const now = new Date();
    
    if (testTime > now) {
      const minutes = testTime.getMinutes();
      const hours = testTime.getHours();
      const testCronExpression = `${minutes} ${hours} * * *`;
      console.log(`[TEST] Scheduling one-time job for 1:00 PM PST (${testTime.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })})`);
      
      const testJob = cron.schedule(testCronExpression, () => {
        console.log(`[TEST] One-time job triggered at ${new Date().toISOString()}`);
        console.log(`[TEST] Local time: ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}`);
        this.sendEmailsForTimezone('America/Los_Angeles');
        testJob.stop(); // Stop the job after it runs once
      });

      testJob.start();
      console.log('[TEST] One-time job scheduled successfully');
    }

    // Log all scheduled jobs
    console.log("Scheduled jobs for the next 24 hours:");
    timezones.forEach(tz => {
      const hour = Math.round((9 - tz.offset + 24) % 24);
      const nextRun = new Date();
      nextRun.setHours(hour, 0, 0, 0);
      if (nextRun < now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      console.log(`- ${tz.display} (${tz.id}, UTC${tz.offset >= 0 ? '+' : ''}${tz.offset}): Next run at ${nextRun.toISOString()} (${nextRun.toLocaleString()})`);
    });

    // Original timezone-based jobs
    timezones.forEach(tz => {
      const hour = Math.round((9 - tz.offset + 24) % 24);
      const cronExpression = `0 ${hour} * * *`;
      console.log(`Scheduling job for timezone ${tz.display} (${tz.id}) at ${hour}:00 UTC (${cronExpression})`);
      
      const job = cron.schedule(cronExpression, () => {
        console.log(`[CRON] Job triggered for timezone ${tz.display} (${tz.id}) at ${new Date().toISOString()}`);
        console.log(`[CRON] Current server time: ${new Date().toISOString()}`);
        this.sendEmailsForTimezone(tz.id);
      });

      job.start();
      console.log(`[CRON] Successfully scheduled job for timezone ${tz.display} (${tz.id})`);
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