import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddSentAtToEmailLogs1740862507132 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            "email_logs",
            new TableColumn({
                name: "sentAt",
                type: "timestamp",
                default: "now()"
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("email_logs", "sentAt");
    }
} 