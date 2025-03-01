import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from "typeorm";
import { User } from "./User";
import { Quote } from "./Quote";

// EmailLog.ts - Tracks email delivery status
@Entity("email_logs")
export class EmailLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.emailLogs)
  user: User;

  @ManyToOne(() => Quote, quote => quote.emailLogs)
  quote: Quote;

  @CreateDateColumn()
  sentAt: Date;

  @Column()
  status: string;
} 