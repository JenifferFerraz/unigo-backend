import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeAcademicCalendarTypeToVarchar1764553552092 implements MigrationInterface {
    name = 'ChangeAcademicCalendarTypeToVarchar1764553552092'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "academic_calendar" ADD "course" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "academic_calendar" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."academic_calendar_type_enum"`);
        await queryRunner.query(`ALTER TABLE "academic_calendar" ADD "type" character varying(50) NOT NULL DEFAULT 'evento'`);
        await queryRunner.query(`ALTER TABLE "academic_calendar" ALTER COLUMN "semester" TYPE character varying(20) USING semester::text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "academic_calendar" DROP COLUMN "course"`);
        await queryRunner.query(`ALTER TABLE "academic_calendar" DROP COLUMN "type"`);
        await queryRunner.query(`CREATE TYPE "public"."academic_calendar_type_enum" AS ENUM('inicio_aulas', 'fim_aulas', 'feriado', 'prova', 'recesso', 'evento', 'outro')`);
        await queryRunner.query(`ALTER TABLE "academic_calendar" ADD "type" "public"."academic_calendar_type_enum" NOT NULL DEFAULT 'evento'`);
        await queryRunner.query(`ALTER TABLE "academic_calendar" ALTER COLUMN "semester" TYPE integer USING semester::integer`);
    }

}
