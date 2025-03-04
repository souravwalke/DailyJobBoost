import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSentAtColumn1740862507133 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "email_logs" 
            ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "email_logs" 
            DROP COLUMN IF EXISTS "sentAt"
        `);
    }
} 