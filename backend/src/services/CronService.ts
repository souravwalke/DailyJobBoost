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

  async startDailyEmailJobs() {
    console.log("🚀 Starting daily email jobs (TEST MODE)...");
    console.log("✅ Test mode enabled - will check timezones every minute");
  }

  async sendEmailsForTimezone(timezone: string, isTest = false) {
    try {
      // Get current time in the timezone
      const now = new Date();
      const tzTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
      const hour = tzTime.getHours();
      const minute = tzTime.getMinutes();

      console.log(`🕒 Checking ${timezone}:`, {
        currentTime: tzTime.toLocaleString(),
        hour,
        minute,
        targetTime: isTest ? '23:45' : '09:00',
        isTestMode: isTest
      });

      // For test mode, send email at 11:45 PM PST
      const shouldSendEmail = isTest 
        ? (timezone === 'America/Los_Angeles' && hour === 23 && minute === 45)
        : (hour === 9);

      if (!shouldSendEmail) {
        console.log(`⏭️ Skipping ${timezone} - Current time: ${hour}:${minute.toString().padStart(2, '0')}`);
        return;
      }

      console.log(`📬 ${isTest ? 'TEST MODE:' : ''} Sending emails for ${timezone}...`);
      const users = await this.userRepository.find({ where: { timezone, isActive: true } });

      if (!users.length) {
        console.log(`ℹ️ No active users in ${timezone}`);
        return;
      }

      console.log(`👥 Found ${users.length} active users in ${timezone}`);
      const quote = await this.quoteRotationService.getNextQuoteForTimezone(users);
      console.log(`💭 Selected quote: "${quote.content}" by ${quote.author || 'Anonymous'}`);

      // Actually send emails even in test mode
      const results = await Promise.allSettled(users.map(user => this.emailService.sendDailyQuote(user, quote)));
      const successful = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;

      console.log(`📊 ${isTest ? 'TEST ' : ''}Email results for ${timezone}: Success ${successful}, Failed ${failed}`);
    } catch (error) {
      console.error(`❌ Error sending emails for ${timezone}:`, error);
    }
  }

  async checkAllTimezones() {
    const timezones = [
      "America/Los_Angeles", "America/Denver", "America/Chicago", "America/New_York",
      "GMT", "Europe/Paris", "Asia/Kolkata", "Asia/Tokyo", "Australia/Sydney"
    ];

    const isTestMode = true; // Enable test mode
    console.log(`🌍 TEST MODE: Checking all timezones at ${new Date().toISOString()}`);
    
    for (const tz of timezones) {
      await this.sendEmailsForTimezone(tz, isTestMode);
    }
    
    console.log(`✅ Completed test timezone checks at ${new Date().toISOString()}`);
  }
}
