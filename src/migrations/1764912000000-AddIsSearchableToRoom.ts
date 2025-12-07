import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsSearchableToRoom1764912000000 implements MigrationInterface {
    name = 'AddIsSearchableToRoom1764912000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "room" ADD "isSearchable" boolean NOT NULL DEFAULT true`
        );

        await queryRunner.query(`
            UPDATE "room" 
            SET "isSearchable" = false 
            WHERE LOWER(name) LIKE '%buraco%' 
               OR LOWER(name) LIKE '%estrutura%'
               OR LOWER(name) LIKE '%vazio%'
               OR LOWER(name) = 'b2c estrutura'
               OR LOWER(name) LIKE '%rampa%pátio%'
               OR LOWER(name) LIKE 'dml%'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "room" DROP COLUMN "isSearchable"`);
    }
}
