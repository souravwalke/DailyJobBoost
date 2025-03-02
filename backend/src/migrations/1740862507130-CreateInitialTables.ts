import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateInitialTables1740862507130 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create Users table
        await queryRunner.createTable(new Table({
            name: "users",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "email",
                    type: "varchar",
                    isUnique: true
                },
                {
                    name: "timezone",
                    type: "varchar"
                },
                {
                    name: "isActive",
                    type: "boolean",
                    default: true
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "now()"
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "now()"
                }
            ]
        }), true);

        // Create Quotes table
        await queryRunner.createTable(new Table({
            name: "quotes",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "content",
                    type: "text"
                },
                {
                    name: "author",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "now()"
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "now()"
                }
            ]
        }), true);

        // Create EmailLogs table
        await queryRunner.createTable(new Table({
            name: "email_logs",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "userId",
                    type: "int"
                },
                {
                    name: "quoteId",
                    type: "int",
                    isNullable: true
                },
                {
                    name: "status",
                    type: "varchar"
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "now()"
                }
            ],
            foreignKeys: [
                {
                    columnNames: ["userId"],
                    referencedTableName: "users",
                    referencedColumnNames: ["id"],
                    onDelete: "CASCADE"
                },
                {
                    columnNames: ["quoteId"],
                    referencedTableName: "quotes",
                    referencedColumnNames: ["id"],
                    onDelete: "SET NULL"
                }
            ]
        }), true);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("email_logs");
        await queryRunner.dropTable("quotes");
        await queryRunner.dropTable("users");
    }

}
