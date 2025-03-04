import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateQuotesTable1709500000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS quotes (
                id SERIAL PRIMARY KEY,
                content TEXT NOT NULL,
                author VARCHAR(255),
                category VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS quotes;`);
    }
} 