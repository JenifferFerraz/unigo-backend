import { MigrationInterface, QueryRunner } from "typeorm";

export class ExternalRoute1762532901811 implements MigrationInterface {
    name = 'ExternalRoute1762532901811'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "external_route" (
                "id" SERIAL PRIMARY KEY,
                "name" VARCHAR NOT NULL,
                "description" VARCHAR,
                "geometry" geometry(MultiLineString,4326) NOT NULL,
                "properties" jsonb
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "external_route"`);
    }
}