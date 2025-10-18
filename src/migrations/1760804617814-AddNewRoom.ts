import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewRoom1760804617814 implements MigrationInterface {
    name = 'AddNewRoom1760804617814'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "room" (
                "id" SERIAL NOT NULL,
                "name" varchar NOT NULL,
                "description" varchar,
                "geometry" geometry,
                "centroid" geometry,
                "structureId" int NOT NULL,
                CONSTRAINT "PK_room_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_room_structure" FOREIGN KEY ("structureId") REFERENCES "structure"("id") ON DELETE CASCADE
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "room"`);
    }
}