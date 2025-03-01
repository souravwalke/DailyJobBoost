import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { EmailLog } from "./EmailLog";

// Quote.ts - Stores motivational quotes
@Entity("quotes")
export class Quote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("text")
  content: string;

  @Column({ nullable: true })
  author: string;

  @Column({ nullable: true })
  category: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => EmailLog, emailLog => emailLog.quote)
  emailLogs: EmailLog[];
} 