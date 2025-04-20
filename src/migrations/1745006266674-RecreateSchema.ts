import { MigrationInterface, QueryRunner } from "typeorm";

export class RecreateSchema1745006266674 implements MigrationInterface {
    name = 'RecreateSchema1745006266674'

    public async up(queryRunner: QueryRunner): Promise<void> {
         await queryRunner.query(`DROP TABLE IF EXISTS "student_profiles" CASCADE`);
         await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
         await queryRunner.query(`DROP TABLE IF EXISTS "courses" CASCADE`);
         await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_role_enum" CASCADE`);
         await queryRunner.query(`DROP TYPE IF EXISTS "public"."courses_shift_enum" CASCADE`);
 
         await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('student', 'professor', 'admin')`);
         await queryRunner.query(`CREATE TYPE "public"."courses_shift_enum" AS ENUM('matutino', 'vespertino', 'noturno')`);
 
         await queryRunner.query(`
             CREATE TABLE "courses" (
                 "id" SERIAL NOT NULL,
                 "name" character varying NOT NULL,
                 "period" integer NOT NULL,
                 "shift" "public"."courses_shift_enum" NOT NULL DEFAULT 'matutino',
                 "className" character varying NOT NULL,
                 "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                 "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                 CONSTRAINT "PK_courses" PRIMARY KEY ("id")
             )
         `);
 
         await queryRunner.query(`
             CREATE TABLE "users" (
                 "id" SERIAL NOT NULL,
                 "name" character varying NOT NULL,
                 "email" character varying NOT NULL,
                 "password" character varying NOT NULL,
                 "cpf" character varying NOT NULL,
                 "role" "public"."users_role_enum" NOT NULL DEFAULT 'student',
                 "refreshToken" character varying,
                 "courseId" integer,
                 "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                 "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                 CONSTRAINT "UQ_users_email" UNIQUE ("email"),
                 CONSTRAINT "PK_users" PRIMARY KEY ("id")
             )
         `);
 
   
         await queryRunner.query(`
             CREATE TABLE "student_profiles" (
                 "id" SERIAL NOT NULL,
                 "studentId" character varying NOT NULL,
                 "documentId" character varying NOT NULL,
                 "phone" character varying NOT NULL,
                 "courseId" integer,
                 "userId" integer,
                 CONSTRAINT "PK_student_profiles" PRIMARY KEY ("id"),
                 CONSTRAINT "UQ_student_profiles_studentId" UNIQUE ("studentId"),
                 CONSTRAINT "UQ_student_profiles_documentId" UNIQUE ("documentId"),
                 CONSTRAINT "REL_student_profiles_userId" UNIQUE ("userId")
             )
         `);
 
   
         await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_courses" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
         await queryRunner.query(`ALTER TABLE "student_profiles" ADD CONSTRAINT "FK_student_profiles_users" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
         await queryRunner.query(`ALTER TABLE "student_profiles" ADD CONSTRAINT "FK_student_profiles_courses" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
     }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_3148e7834f4910fcc0ffa9ac9ed"`);
        await queryRunner.query(`ALTER TABLE "student_profiles" DROP CONSTRAINT "FK_aaf8d9e0e5ee595daec766880ad"`);
        await queryRunner.query(`ALTER TABLE "student_profiles" DROP CONSTRAINT "FK_064d129936a1e821d637ee8c88e"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "student_profiles"`);
        await queryRunner.query(`DROP TABLE "courses"`);
        await queryRunner.query(`DROP TYPE "public"."courses_shift_enum"`);
    }

}
