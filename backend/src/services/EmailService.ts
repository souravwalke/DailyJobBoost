import nodemailer from "nodemailer";
import { User } from "../models/User";
import { Quote } from "../models/Quote";
import { EmailLog } from "../models/EmailLog";
import { AppDataSource } from "../config/database";

// EmailService.ts - Handles email operations
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
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

  // Sends formatted email to user
  async sendDailyQuote(user: User, quote: Quote): Promise<void> {
    try {
      const emailContent = this.generateEmailContent(quote);
      
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || "motivation@dailyjobboost.com",
        to: user.email,
        subject: "Your Daily Motivation 🌟",
        html: emailContent,
      });

      // Logs the email delivery
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

  private generateEmailContent(quote: Quote): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #3b82f6; text-align: center;">Your Daily Motivation</h1>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 20px; color: #1e293b; text-align: center; font-style: italic;">
            "${quote.content}"
          </p>
          ${quote.author ? `<p style="text-align: right; color: #64748b;">- ${quote.author}</p>` : ''}
        </div>
        <p style="color: #64748b; text-align: center; font-size: 14px;">
          Keep pushing forward. Your success story is being written every day.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #94a3b8; text-align: center; font-size: 12px;">
          You're receiving this because you subscribed to DailyJobBoost.
          <br>
          To unsubscribe, <a href="{unsubscribe_link}" style="color: #3b82f6;">click here</a>.
        </p>
      </div>
    `;
  }
} 