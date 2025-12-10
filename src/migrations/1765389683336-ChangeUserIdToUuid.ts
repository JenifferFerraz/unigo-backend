import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeUserIdToUuid1765389683336 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Adicionar coluna UUID temporária na tabela users
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "uuid" UUID DEFAULT gen_random_uuid()`);
        
        // 2. Preencher UUIDs para todos os usuários existentes
        await queryRunner.query(`UPDATE "users" SET "uuid" = gen_random_uuid() WHERE "uuid" IS NULL`);
        
        // 3. Tratar tabela student_profiles
        await queryRunner.query(`ALTER TABLE "student_profiles" ADD COLUMN "userId_temp" UUID`);
        await queryRunner.query(`
            UPDATE "student_profiles" sp 
            SET "userId_temp" = u.uuid 
            FROM "users" u 
            WHERE sp."userId" = u.id
        `);
        await queryRunner.query(`ALTER TABLE "student_profiles" DROP CONSTRAINT IF EXISTS "FK_studentprofile_user"`);
        await queryRunner.query(`ALTER TABLE "student_profiles" DROP CONSTRAINT IF EXISTS "REL_studentprofile_user"`);
        await queryRunner.query(`ALTER TABLE "student_profiles" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "student_profiles" RENAME COLUMN "userId_temp" TO "userId"`);
        
        // 4. Tratar tabela feedbacks
        await queryRunner.query(`ALTER TABLE "feedbacks" ADD COLUMN "user_id_temp" UUID`);
        await queryRunner.query(`
            UPDATE "feedbacks" f 
            SET "user_id_temp" = u.uuid 
            FROM "users" u 
            WHERE f."user_id"::text = u.id::text
        `);
        // Remover a constraint FK existente
        await queryRunner.query(`ALTER TABLE "feedbacks" DROP CONSTRAINT IF EXISTS "FK_4334f6be2d7d841a9d5205a100e"`);
        await queryRunner.query(`ALTER TABLE "feedbacks" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "feedbacks" RENAME COLUMN "user_id_temp" TO "user_id"`);
        
        // 5. Remover PK antiga e adicionar nova no users
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "PK_users"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "uuid" TO "id"`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "PK_users" PRIMARY KEY ("id")`);
        
        // 6. Adicionar constraints nas tabelas dependentes
        await queryRunner.query(`ALTER TABLE "student_profiles" ADD CONSTRAINT "FK_studentprofile_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "student_profiles" ADD CONSTRAINT "REL_studentprofile_user" UNIQUE ("userId")`);
        await queryRunner.query(`ALTER TABLE "feedbacks" ADD CONSTRAINT "FK_feedbacks_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rollback não recomendado após migration com UUID
        throw new Error("Cannot rollback UUID migration - data loss would occur");
    }

}
