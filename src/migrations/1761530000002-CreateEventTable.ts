import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEventTable1761530000002 implements MigrationInterface {
    name = 'CreateEventTable1761530000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Criar ENUM para tipo de evento
        await queryRunner.query(`
            CREATE TYPE "public"."events_type_enum" AS ENUM(
                'academico',
                'cultural',
                'esportivo',
                'social',
                'outro'
            )
        `);

        // Criar tabela events
        await queryRunner.query(`
            CREATE TABLE "events" (
                "id" SERIAL NOT NULL,
                "title" character varying(200) NOT NULL,
                "description" text NOT NULL,
                "startDate" TIMESTAMP NOT NULL,
                "endDate" TIMESTAMP,
                "location" character varying(200),
                "type" "public"."events_type_enum" NOT NULL DEFAULT 'academico',
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_events" PRIMARY KEY ("id")
            )
        `);

        // Criar índices para otimização
        await queryRunner.query(`
            CREATE INDEX "IDX_events_start_date" ON "events" ("startDate")
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_events_type" ON "events" ("type")
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_events_is_active" ON "events" ("isActive")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover índices
        await queryRunner.query(`DROP INDEX "IDX_events_is_active"`);
        await queryRunner.query(`DROP INDEX "IDX_events_type"`);
        await queryRunner.query(`DROP INDEX "IDX_events_start_date"`);
        
        // Remover tabela
        await queryRunner.query(`DROP TABLE "events"`);
        
        // Remover ENUM
        await queryRunner.query(`DROP TYPE "public"."events_type_enum"`);
    }
}
