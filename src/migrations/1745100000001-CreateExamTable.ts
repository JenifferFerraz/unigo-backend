import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateExamTable1745100000000 implements MigrationInterface {
    name = 'CreateExamTable1745100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "exam" (
            "id" SERIAL PRIMARY KEY,
            "day" character varying(100) NOT NULL,
            "date" character varying(20) NOT NULL,
            "subject" character varying(200) NOT NULL,
            "time" character varying(50) NOT NULL,
            "grade" character varying(20),
            "cycle" integer NOT NULL DEFAULT 1
        )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "exam"`);
    }

}
