import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveShiftClassnameFromCourse1764455450607 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
           await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "shift"`);
           await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "className"`);
           await queryRunner.query(`ALTER TABLE "schedules" DROP COLUMN "feature"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
           await queryRunner.query(`ALTER TABLE "courses" ADD "shift" varchar NOT NULL DEFAULT 'matutino'`);
           await queryRunner.query(`ALTER TABLE "courses" ADD "className" varchar NOT NULL DEFAULT ''`);
           await queryRunner.query(`ALTER TABLE "schedules" ADD "feature" varchar(100)`);
    }
}