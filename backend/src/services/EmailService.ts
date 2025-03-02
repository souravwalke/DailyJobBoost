import nodemailer from "nodemailer";
import { User } from "../models/User";
import { Quote } from "../models/Quote";
import { EmailLog } from "../models/EmailLog";
import { AppDataSource } from "../config/database";
import { EmailTemplateService } from "./EmailTemplateService";
import * as crypto from "crypto";

// EmailService.ts - Handles email operations
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    console.log("Initializing email service with config:", {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === "true",
      user: process.env.SMTP_USER,
    });

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private generateUnsubscribeToken(userId: number): string {
    const data = `${userId}-${Date.now()}-${process.env.UNSUBSCRIBE_SECRET}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  async sendWelcomeEmail(user: User): Promise<void> {
    try {
      console.log("Preparing to send welcome email to:", user.email);
      
      const unsubscribeToken = this.generateUnsubscribeToken(user.id);
      const emailContent = EmailTemplateService.getWelcomeTemplate(unsubscribeToken);
      
      console.log("Sending welcome email with config:", {
        from: process.env.EMAIL_FROM || "welcome@dailyjobboost.com",
        to: user.email,
      });

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || "welcome@dailyjobboost.com",
        to: user.email,
        subject: "Welcome to DailyJobBoost! 🎉",
        html: emailContent,
      });

      console.log("Welcome email sent successfully");

      // Log the welcome email
      const emailLog = new EmailLog();
      emailLog.user = user;
      emailLog.status = "welcome_sent";
      await AppDataSource.manager.save(emailLog);
      
      console.log("Email log saved");
    } catch (error) {
      console.error(`Failed to send welcome email to ${user.email}:`, error);
      throw error;
    }
  }

  async sendDailyQuote(user: User, quote: Quote): Promise<void> {
    try {
      const unsubscribeToken = this.generateUnsubscribeToken(user.id);
      const emailContent = EmailTemplateService.getDailyQuoteTemplate(quote, unsubscribeToken);
      
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || "motivation@dailyjobboost.com",
        to: user.email,
        subject: "Your Daily Motivation 🌟",
        html: emailContent,
      });

      // Log the email delivery
      const emailLog = new EmailLog();
      emailLog.user = user;
      emailLog.quote = quote;
      emailLog.status = "sent";
      await AppDataSource.manager.save(emailLog);
    } catch (error) {
      console.error(`Failed to send email to ${user.email}:`, error);
      throw error;
    }
  }

  async verifyUnsubscribeToken(token: string): Promise<User | null> {
    try {
      // Get all users and verify token
      const users = await AppDataSource.manager.find(User);
      
      for (const user of users) {
        const generatedToken = this.generateUnsubscribeToken(user.id);
        if (generatedToken === token) {
          return user;
        }
      }
      
      return null;
    } catch (error) {
      console.error("Failed to verify unsubscribe token:", error);
      return null;
    }
  }
} 