import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";
import * as bcrypt from "bcrypt";

@Entity("admins")
export class Admin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  async validatePassword(password: string): Promise<boolean> {
    console.log("Validating password...");
    const result = await bcrypt.compare(password, this.password);
    console.log("Password validation result:", result);
    return result;
  }

  async setPassword(password: string): Promise<void> {
    this.password = await bcrypt.hash(password, 10);
  }
} 