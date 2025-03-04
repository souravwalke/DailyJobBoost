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
    const now = new Date();
    
    // Convert current time to PST
    const currentTimePST = new Date(now.toLocaleString('en-US', { 
      timeZone: 'America/Los_Angeles' 
    }));
    
    // Set test time to 1 PM PST
    const testTime = new Date(now.toLocaleString('en-US', { 
      timeZone: 'America/Los_Angeles' 
    }));
    testTime.setHours(13, 0, 0, 0); // 1 PM PST
    
    console.log('[TEST] Current time:', currentTimePST.toLocaleString('en-US', { 
      timeZone: 'America/Los_Angeles' 
    }));
    console.log('[TEST] Target test time:', testTime.toLocaleString('en-US', { 
      timeZone: 'America/Los_Angeles' 
    }));
    
    if (testTime > currentTimePST) {
      // Convert to UTC for cron scheduling
      const targetTimeUTC = new Date(testTime.getTime() + (8 * 60 * 60 * 1000)); // Add 8 hours for PST->UTC
      const minutes = targetTimeUTC.getMinutes();
      const hours = targetTimeUTC.getHours();
      const testCronExpression = `${minutes} ${hours} * * *`;
      
      console.log(`[TEST] Creating one-time job with cron expression: ${testCronExpression}`);
      console.log(`[TEST] Job will run at: ${testTime.toLocaleString('en-US', { 
        timeZone: 'America/Los_Angeles' 
      })} PST`);
      
      const testJob = cron.schedule(testCronExpression, () => {
        console.log('----------------------------------------');
        console.log(`[TEST] One-time job triggered at ${new Date().toISOString()}`);
        console.log(`[TEST] Local time: ${new Date().toLocaleString('en-US', { 
          timeZone: 'America/Los_Angeles' 
        })}`);
        this.sendEmailsForTimezone('America/Los_Angeles');
        testJob.stop(); // Stop the job after it runs once
        console.log('[TEST] Job stopped after successful execution');
        console.log('----------------------------------------');
      });

      testJob.start();
      console.log('[TEST] One-time job scheduled successfully');
      console.log('[TEST] Waiting for execution at 1:00 PM PST...');
    } else {
      console.log('[TEST] Test time (1 PM PST) has already passed for today');
    }

    // Log all scheduled jobs
    console.log("Scheduled jobs for the next 24 hours:");
    timezones.forEach(tz => {
      // Calculate when 9 AM occurs in UTC for this timezone
      const targetUTCHour = (9 + tz.offset + 24) % 24;
      
      // Create next run time in the timezone
      const nextRun = new Date();
      nextRun.setUTCHours(targetUTCHour, 0, 0, 0);
      
      // If the time has already passed today, schedule for tomorrow
      if (nextRun < now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }

      // Log the next run time in both UTC and local timezone
      console.log(`- ${tz.display} (${tz.id}, UTC${tz.offset >= 0 ? '+' : ''}${tz.offset}): 
        Next run at ${nextRun.toISOString()} UTC
        Local time: ${nextRun.toLocaleString('en-US', { timeZone: tz.id })}
      `);
    });

    // Schedule daily jobs for each timezone
    timezones.forEach(tz => {
      // To run at 9 AM in the local timezone, we need to calculate what time that is in UTC
      const targetUTCHour = (9 + tz.offset + 24) % 24;
      const cronExpression = `0 ${targetUTCHour} * * *`;
      
      console.log(`Scheduling job for ${tz.display} (${tz.id}):
        - Local time: 9:00 AM ${tz.display}
        - UTC time: ${targetUTCHour}:00
        - Cron expression: ${cronExpression}
      `);
      
      const job = cron.schedule(cronExpression, () => {
        console.log('----------------------------------------');
        console.log(`[CRON] Job triggered for timezone ${tz.display} (${tz.id})`);
        console.log(`[CRON] Current UTC time: ${new Date().toISOString()}`);
        console.log(`[CRON] Current ${tz.display} time: ${new Date().toLocaleString('en-US', { timeZone: tz.id })}`);
        this.sendEmailsForTimezone(tz.id);
        console.log('----------------------------------------');
      });

      job.start();
      console.log(`[CRON] Successfully scheduled job for ${tz.display}`);
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