import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailVerificationAndSoftDelete1745009450877 implements MigrationInterface {
    name = 'AddEmailVerificationAndSoftDelete1745009450877'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "isEmailVerified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "isDeleted" boolean NOT NULL DEFAULT false`);
    
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_3148e7834f4910fcc0ffa9ac9ed"`);
        await queryRunner.query(`ALTER TABLE "student_profiles" DROP CONSTRAINT "FK_aaf8d9e0e5ee595daec766880ad"`);
        await queryRunner.query(`ALTER TABLE "student_profiles" DROP CONSTRAINT "FK_064d129936a1e821d637ee8c88e"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "student_profiles" DROP CONSTRAINT "UQ_aaf8d9e0e5ee595daec766880ad"`);
        await queryRunner.query(`ALTER TABLE "student_profiles" ADD CONSTRAINT "UQ_student_profiles_documentId" UNIQUE ("documentId")`);
        await queryRunner.query(`ALTER TABLE "student_profiles" ADD CONSTRAINT "UQ_student_profiles_studentId" UNIQUE ("studentId")`);
        await queryRunner.query(`ALTER TABLE "courses" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "courses" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_courses" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "student_profiles" ADD CONSTRAINT "FK_student_profiles_courses" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "student_profiles" ADD CONSTRAINT "FK_student_profiles_users" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
