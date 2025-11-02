import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateStructureAndInternalRoute1760792903326 implements MigrationInterface {
    name = 'CreateStructureAndInternalRoute1760792903326'

   public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "structure" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "description" character varying,
                "geometry" geometry(Polygon,4326) NOT NULL,
                "centroid" geometry(Point,4326) NOT NULL,
                "floors" integer[],
                CONSTRAINT "PK_structure_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "internal_route" (
                "id" SERIAL NOT NULL,
                "floor" integer NOT NULL,
                "geometry" geometry(MultiLineString,4326) NOT NULL,
                "properties" jsonb,
                "structureId" integer,
                CONSTRAINT "PK_internal_route_id" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "internal_route" DROP CONSTRAINT "FK_internal_route_structure"`);
        await queryRunner.query(`DROP TABLE "internal_route"`);
        await queryRunner.query(`DROP TABLE "structure"`);

    }
}