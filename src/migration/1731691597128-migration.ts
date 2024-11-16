import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1731691597128 implements MigrationInterface {
    name = "Migration1731691597128";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" ADD "gender" character varying NOT NULL`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "gender"`);
    }
}
