import { MigrationInterface, QueryRunner } from "typeorm";

export class IncreaseExamGradeLength1763762000000 implements MigrationInterface {
    name = 'IncreaseExamGradeLength1763762000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exam" ALTER COLUMN "grade" TYPE character varying(100)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exam" ALTER COLUMN "grade" TYPE character varying(20)`);
    }
}

