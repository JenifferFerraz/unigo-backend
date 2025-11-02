import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAcademicCalendarTable1761530000003 implements MigrationInterface {
    name = 'CreateAcademicCalendarTable1761530000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Criar ENUM para tipo de evento acadêmico
        await queryRunner.query(`
            CREATE TYPE "public"."academic_calendar_type_enum" AS ENUM(
                'inicio_aulas',
                'fim_aulas',
                'feriado',
                'prova',
                'recesso',
                'evento',
                'outro'
            )
        `);

        // Criar tabela academic_calendar
        await queryRunner.query(`
            CREATE TABLE "academic_calendar" (
                "id" SERIAL NOT NULL,
                "title" character varying(200) NOT NULL,
                "date" date NOT NULL,
                "type" "public"."academic_calendar_type_enum" NOT NULL DEFAULT 'evento',
                "description" text,
                "semester" integer,
                "year" integer,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_academic_calendar" PRIMARY KEY ("id")
            )
        `);

        // Criar índices para otimização
        await queryRunner.query(`
            CREATE INDEX "IDX_academic_calendar_date" ON "academic_calendar" ("date")
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_academic_calendar_type" ON "academic_calendar" ("type")
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_academic_calendar_year_semester" ON "academic_calendar" ("year", "semester")
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_academic_calendar_is_active" ON "academic_calendar" ("isActive")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover índices
        await queryRunner.query(`DROP INDEX "IDX_academic_calendar_is_active"`);
        await queryRunner.query(`DROP INDEX "IDX_academic_calendar_year_semester"`);
        await queryRunner.query(`DROP INDEX "IDX_academic_calendar_type"`);
        await queryRunner.query(`DROP INDEX "IDX_academic_calendar_date"`);
        
        // Remover tabela
        await queryRunner.query(`DROP TABLE "academic_calendar"`);
        
        // Remover ENUM
        await queryRunner.query(`DROP TYPE "public"."academic_calendar_type_enum"`);
    }
}
