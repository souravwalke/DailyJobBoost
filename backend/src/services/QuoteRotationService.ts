import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { Quote } from "../models/Quote";
import { User } from "../models/User";
import { EmailLog } from "../models/EmailLog";

export class QuoteRotationService {
  private quoteRepository: Repository<Quote>;
  private emailLogRepository: Repository<EmailLog>;

  constructor() {
    this.quoteRepository = AppDataSource.getRepository(Quote);
    this.emailLogRepository = AppDataSource.getRepository(EmailLog);
  }

  async getNextQuote(user: User): Promise<Quote> {
    try {
      // Get total number of quotes
      const totalQuotes = await this.quoteRepository.count();
      
      // Get quotes that have been sent to this user in the last cycle
      const recentQuotes = await this.emailLogRepository
        .createQueryBuilder("emailLog")
        .select("emailLog.quoteId")
        .where("emailLog.userId = :userId", { userId: user.id })
        .orderBy("emailLog.sentAt", "DESC")
        .limit(totalQuotes - 1) // Leave at least one quote that hasn't been sent
        .getMany();

      const recentQuoteIds = recentQuotes.map(log => log.quote?.id).filter(id => id !== undefined);

      // If we've sent all quotes, start over
      if (recentQuoteIds.length >= totalQuotes - 1) {
        console.log(`All quotes have been sent to user ${user.email}, starting new cycle`);
        recentQuoteIds.length = 0;
      }

      // Get a random quote that hasn't been sent recently
      const [quote] = await this.quoteRepository
        .createQueryBuilder("quote")
        .where(recentQuoteIds.length > 0 ? "quote.id NOT IN (:...recentQuoteIds)" : "1=1", {
          recentQuoteIds
        })
        .orderBy("RANDOM()")
        .limit(1)
        .getMany();

      if (!quote) {
        throw new Error("No quotes available");
      }

      console.log(`Selected quote ${quote.id} for user ${user.email}`);
      return quote;
    } catch (error) {
      console.error("Error in getNextQuote:", error);
      throw error;
    }
  }

  async getNextQuoteForTimezone(users: User[]): Promise<Quote> {
    try {
      // Get total number of quotes
      const totalQuotes = await this.quoteRepository.count();
      
      // Get recently sent quotes for all users in this timezone
      const recentQuotes = await this.emailLogRepository
        .createQueryBuilder("emailLog")
        .select("emailLog.quoteId")
        .where("emailLog.userId IN (:...userIds)", { userIds: users.map(u => u.id) })
        .orderBy("emailLog.sentAt", "DESC")
        .limit(totalQuotes - 1)
        .getMany();

      const recentQuoteIds = recentQuotes.map(log => log.quote?.id).filter(id => id !== undefined);

      // If we've sent most quotes, start over
      if (recentQuoteIds.length >= totalQuotes - 1) {
        console.log(`All quotes have been sent to timezone group, starting new cycle`);
        recentQuoteIds.length = 0;
      }

      // Get a random quote that hasn't been sent recently to this timezone group
      const [quote] = await this.quoteRepository
        .createQueryBuilder("quote")
        .where(recentQuoteIds.length > 0 ? "quote.id NOT IN (:...recentQuoteIds)" : "1=1", {
          recentQuoteIds
        })
        .orderBy("RANDOM()")
        .limit(1)
        .getMany();

      if (!quote) {
        throw new Error("No quotes available");
      }

      console.log(`Selected quote ${quote.id} for timezone group of ${users.length} users`);
      return quote;
    } catch (error) {
      console.error("Error in getNextQuoteForTimezone:", error);
      throw error;
    }
  }
} 