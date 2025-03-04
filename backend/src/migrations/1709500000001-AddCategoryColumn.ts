import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategoryColumn1709500000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE quotes 
            ADD COLUMN IF NOT EXISTS category VARCHAR(255);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE quotes 
            DROP COLUMN IF EXISTS category;
        `);
    }
} 