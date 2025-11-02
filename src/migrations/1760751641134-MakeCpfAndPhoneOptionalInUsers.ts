import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeCpfAndPhoneOptionalInUsers1760751641134 implements MigrationInterface {
    name = 'MakeCpfAndPhoneOptionalInUsers1760751641134'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "cpf" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "student_profiles" ALTER COLUMN "phone" DROP NOT NULL`);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
     await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "cpf" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "student_profiles" ALTER COLUMN "phone" SET NOT NULL`);
    }
}
