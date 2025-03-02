import { Quote } from "../models/Quote";

export class EmailTemplateService {
  /**
   * Generates the daily quote email template
   */
  static getDailyQuoteTemplate(quote: Quote, unsubscribeToken: string): string {
    const unsubscribeUrl = `${process.env.FRONTEND_URL}/unsubscribe?token=${unsubscribeToken}`;
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Daily Motivation</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
        <table role="presentation" style="width: 100%; border: none; margin: 0; padding: 0;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border: none; border-spacing: 0; text-align: left; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #3b82f6;">
                    <h1 style="margin: 0; font-size: 24px; color: #ffffff; text-align: center;">
                      ✨ Your Daily Motivation
                    </h1>
                  </td>
                </tr>

                <!-- Quote Content -->
                <tr>
                  <td style="padding: 40px;">
                    <div style="background-color: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
                      <p style="font-size: 20px; line-height: 1.6; color: #1e293b; text-align: center; font-style: italic; margin: 0;">
                        "${quote.content}"
                      </p>
                      ${quote.author ? `
                        <p style="text-align: right; color: #64748b; margin: 20px 0 0 0; font-size: 16px;">
                          - ${quote.author}
                        </p>
                      ` : ''}
                    </div>
                    
                    <p style="color: #64748b; text-align: center; font-size: 16px; line-height: 1.6; margin: 0;">
                      Keep pushing forward. Your success story is being written every day.
                    </p>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding: 0 40px;">
                    <div style="height: 1px; background-color: #e2e8f0;"></div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; color: #94a3b8; font-size: 14px; text-align: center;">
                    <p style="margin: 0 0 10px 0;">
                      You're receiving this because you subscribed to DailyJobBoost.
                    </p>
                    <p style="margin: 0;">
                      <a href="${unsubscribeUrl}" style="color: #3b82f6; text-decoration: none;">
                        Click here to unsubscribe
                      </a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Generates the welcome email template
   */
  static getWelcomeTemplate(unsubscribeToken: string): string {
    const unsubscribeUrl = `${process.env.FRONTEND_URL}/unsubscribe?token=${unsubscribeToken}`;
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to DailyJobBoost</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
        <table role="presentation" style="width: 100%; border: none; margin: 0; padding: 0;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border: none; border-spacing: 0; text-align: left; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #3b82f6;">
                    <h1 style="margin: 0; font-size: 24px; color: #ffffff; text-align: center;">
                      🎉 Welcome to DailyJobBoost!
                    </h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Thank you for subscribing to DailyJobBoost! We're excited to be part of your journey.
                    </p>
                    
                    <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Starting tomorrow, you'll receive a daily dose of motivation at 9 AM in your timezone. Each quote is carefully selected to inspire and energize you for the day ahead.
                    </p>

                    <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin: 0;">
                      Remember: Every small step counts towards your bigger goals. Keep pushing forward!
                    </p>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding: 0 40px;">
                    <div style="height: 1px; background-color: #e2e8f0;"></div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; color: #94a3b8; font-size: 14px; text-align: center;">
                    <p style="margin: 0 0 10px 0;">
                      You're receiving this because you subscribed to DailyJobBoost.
                    </p>
                    <p style="margin: 0;">
                      <a href="${unsubscribeUrl}" style="color: #3b82f6; text-decoration: none;">
                        Click here to unsubscribe
                      </a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
} 