import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRoomFloorColumnts1760810484254 implements MigrationInterface {
    name = 'AddRoomFloorColumn.ts1760810484254'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "room" ADD "floor" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "room" DROP COLUMN "floor"`);

    }

}
