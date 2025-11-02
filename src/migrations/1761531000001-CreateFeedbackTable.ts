import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateFeedbackTable1761531000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'feedbacks',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'vinculo',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'ja_usou_app_interno',
            type: 'boolean',
          },
          {
            name: 'identificar_localizacao',
            type: 'smallint',
          },
          {
            name: 'instrucoes_claras',
            type: 'smallint',
          },
          {
            name: 'representacao_fiel',
            type: 'smallint',
          },
          {
            name: 'trajeto_facil_seguir',
            type: 'smallint',
          },
          {
            name: 'facil_usar',
            type: 'smallint',
          },
          {
            name: 'design_claro',
            type: 'smallint',
          },
          {
            name: 'interacao_sem_dificuldade',
            type: 'smallint',
          },
          {
            name: 'tempo_razoavel',
            type: 'smallint',
          },
          {
            name: 'confianca_destino',
            type: 'smallint',
          },
          {
            name: 'recomendaria',
            type: 'smallint',
          },
          {
            name: 'voltaria_usar',
            type: 'smallint',
          },
          {
            name: 'satisfacao_geral',
            type: 'smallint',
          },
          {
            name: 'o_que_agradou',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'dificuldades_encontradas',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'sugestoes_melhoria',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_anonymous',
            type: 'boolean',
            default: false,
          },
          {
            name: 'device_info',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'app_version',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Foreign key para users (opcional)
    await queryRunner.createForeignKey(
      'feedbacks',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );

    // Índices para melhorar performance
    await queryRunner.createIndex(
      'feedbacks',
      new TableIndex({
        name: 'idx_feedbacks_vinculo',
        columnNames: ['vinculo'],
      })
    );

    await queryRunner.createIndex(
      'feedbacks',
      new TableIndex({
        name: 'idx_feedbacks_is_anonymous',
        columnNames: ['is_anonymous'],
      })
    );

    await queryRunner.createIndex(
      'feedbacks',
      new TableIndex({
        name: 'idx_feedbacks_created_at',
        columnNames: ['created_at'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('feedbacks', 'idx_feedbacks_created_at');
    await queryRunner.dropIndex('feedbacks', 'idx_feedbacks_is_anonymous');
    await queryRunner.dropIndex('feedbacks', 'idx_feedbacks_vinculo');

    const table = await queryRunner.getTable('feedbacks');
    const foreignKey = table?.foreignKeys.find((fk) => fk.columnNames.indexOf('user_id') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('feedbacks', foreignKey);
    }

    await queryRunner.dropTable('feedbacks');
  }
}
