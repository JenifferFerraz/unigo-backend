import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateCourseShift1745007337928 implements MigrationInterface {
    name = 'UpdateCourseShift1745007337928'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "courses" ALTER COLUMN "shift" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "courses" ALTER COLUMN "shift" TYPE VARCHAR`);
        
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."courses_shift_enum"`);
        
        await queryRunner.query(`CREATE TYPE "public"."courses_shift_enum" AS ENUM('matutino', 'vespertino', 'noturno', 'integral')`);
        
        await queryRunner.query(`ALTER TABLE "courses" ALTER COLUMN "shift" TYPE "public"."courses_shift_enum" USING shift::text::"public"."courses_shift_enum"`);
        await queryRunner.query(`ALTER TABLE "courses" ALTER COLUMN "shift" SET DEFAULT 'matutino'`);
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
        await queryRunner.query(`CREATE TYPE "public"."courses_shift_enum_old" AS ENUM('matutino', 'vespertino', 'noturno')`);
        await queryRunner.query(`ALTER TABLE "courses" ALTER COLUMN "shift" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "courses" ALTER COLUMN "shift" TYPE "public"."courses_shift_enum_old" USING "shift"::"text"::"public"."courses_shift_enum_old"`);
        await queryRunner.query(`ALTER TABLE "courses" ALTER COLUMN "shift" SET DEFAULT 'matutino'`);
        await queryRunner.query(`DROP TYPE "public"."courses_shift_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."courses_shift_enum_old" RENAME TO "courses_shift_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_courses" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "student_profiles" ADD CONSTRAINT "FK_student_profiles_courses" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "student_profiles" ADD CONSTRAINT "FK_student_profiles_users" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
