import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShiftToExam1745200000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exam" ADD COLUMN "shift" character varying(20)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exam" DROP COLUMN "shift"`);
    }
}
