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

            await queryRunner.query(`
                UPDATE external_route 
                SET properties = jsonb_set(
                    COALESCE(properties, '{}'::jsonb),
                    '{mode}',
                    '"walking"'
                )
                WHERE name LIKE '%A-Pe%' OR name LIKE '%A Pe%' OR name LIKE '%walking%' OR name LIKE '%pedestre%';
            `);

            await queryRunner.query(`
                UPDATE external_route 
                SET properties = jsonb_set(
                    COALESCE(properties, '{}'::jsonb),
                    '{mode}',
                    '"driving"'
                )
                WHERE name LIKE '%Carro%' OR name LIKE '%driving%' OR name LIKE '%veiculo%' OR name LIKE '%vehicle%';
            `);

            await queryRunner.query(`
                UPDATE external_route 
                SET properties = jsonb_set(
                    COALESCE(properties, '{}'::jsonb),
                    '{mode}',
                    '"driving"'
                )
                WHERE properties->>'felt:routeMode' = 'DRIVING';
            `);

            await queryRunner.query(`
                UPDATE external_route 
                SET properties = jsonb_set(
                    COALESCE(properties, '{}'::jsonb),
                    '{mode}',
                    '"walking"'
                )
                WHERE properties->>'mode' IS NULL;
            `);

            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS idx_external_route_mode 
                ON external_route ((properties->>'mode'));
            `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
            await queryRunner.query(`
                UPDATE external_route
                SET properties = properties - 'mode'
                WHERE properties ? 'mode';
            `);

            await queryRunner.query(`
                DROP INDEX IF EXISTS idx_external_route_mode;
            `);

            await queryRunner.query(`DROP TABLE "external_route"`);
    }
}