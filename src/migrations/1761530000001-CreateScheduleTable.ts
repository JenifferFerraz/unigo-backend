import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateScheduleTable1761530000001 implements MigrationInterface {
    name = 'CreateScheduleTable1761530000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Criar tabela schedules
        await queryRunner.query(`
            CREATE TABLE "schedules" (
                "id" SERIAL NOT NULL,
                "subject" character varying(200) NOT NULL,
                "professor" character varying(100) NOT NULL,
                "time" character varying(50) NOT NULL,
                "room" character varying(50) NOT NULL,
                "dayOfWeek" character varying(20) NOT NULL,
                "course" character varying(100),
                "shift" character varying(20),
                "semester" integer NOT NULL DEFAULT 1,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_schedules" PRIMARY KEY ("id")
            )
        `);

        // Criar índices para otimização
        await queryRunner.query(`
            CREATE INDEX "IDX_schedules_day_of_week" ON "schedules" ("dayOfWeek")
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_schedules_course" ON "schedules" ("course")
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_schedules_shift" ON "schedules" ("shift")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover índices
        await queryRunner.query(`DROP INDEX "IDX_schedules_shift"`);
        await queryRunner.query(`DROP INDEX "IDX_schedules_course"`);
        await queryRunner.query(`DROP INDEX "IDX_schedules_day_of_week"`);
        
        // Remover tabela
        await queryRunner.query(`DROP TABLE "schedules"`);
    }
}
