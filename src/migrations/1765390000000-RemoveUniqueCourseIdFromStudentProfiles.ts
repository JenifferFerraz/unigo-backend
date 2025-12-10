import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveUniqueCourseIdFromStudentProfiles1765390000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Remove a constraint UNIQUE incorreta do courseId
        // Essa constraint impedia que múltiplos alunos tivessem o mesmo curso
        await queryRunner.query(`ALTER TABLE "student_profiles" DROP CONSTRAINT IF EXISTS "UQ_aaf8d9e0e5ee595daec766880ad"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Não recriar a constraint no rollback, pois ela estava incorreta
        // await queryRunner.query(`ALTER TABLE "student_profiles" ADD CONSTRAINT "UQ_aaf8d9e0e5ee595daec766880ad" UNIQUE ("courseId")`);
    }

}
