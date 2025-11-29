import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export class AddFeatureToCourseTable1763513015249 implements MigrationInterface {
    name = 'AddFeatureToCourseTable1763513015249'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Adicionar colunas courseId
        await queryRunner.addColumn('schedules', new TableColumn({
            name: 'courseId',
            type: 'int',
            isNullable: true,
        }));

        await queryRunner.addColumn('events', new TableColumn({
            name: 'courseId',
            type: 'int',
            isNullable: true,
        }));
           await queryRunner.addColumn('events', new TableColumn({
            name: 'link',
            type: 'varchar',
            length: '255',
            isNullable: true,
        }));

        await queryRunner.addColumn('exam', new TableColumn({
            name: 'courseId',
            type: 'int',
            isNullable: true,
        }));

        await queryRunner.addColumn('academic_calendar', new TableColumn({
            name: 'courseId',
            type: 'int',
            isNullable: true,
        }));

        // Adicionar foreign keys
        await queryRunner.createForeignKey('schedules', new TableForeignKey({
            columnNames: ['courseId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'courses',
            onDelete: 'SET NULL',
        }));

        await queryRunner.createForeignKey('events', new TableForeignKey({
            columnNames: ['courseId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'courses',
            onDelete: 'SET NULL',
        }));

        await queryRunner.createForeignKey('exam', new TableForeignKey({
            columnNames: ['courseId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'courses',
            onDelete: 'SET NULL',
        }));

        await queryRunner.createForeignKey('academic_calendar', new TableForeignKey({
            columnNames: ['courseId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'courses',
            onDelete: 'SET NULL',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover foreign keys primeiro
        const schedulesTable = await queryRunner.getTable('schedules');
        const schedulesForeignKey = schedulesTable?.foreignKeys.find(fk => fk.columnNames.indexOf('courseId') !== -1);
        if (schedulesForeignKey) {
            await queryRunner.dropForeignKey('schedules', schedulesForeignKey);
        }

        const eventsTable = await queryRunner.getTable('events');
        const eventsForeignKey = eventsTable?.foreignKeys.find(fk => fk.columnNames.indexOf('courseId') !== -1);
        if (eventsForeignKey) {
            await queryRunner.dropForeignKey('events', eventsForeignKey);
        }

        const examTable = await queryRunner.getTable('exam');
        const examForeignKey = examTable?.foreignKeys.find(fk => fk.columnNames.indexOf('courseId') !== -1);
        if (examForeignKey) {
            await queryRunner.dropForeignKey('exam', examForeignKey);
        }

        const calendarTable = await queryRunner.getTable('academic_calendar');
        const calendarForeignKey = calendarTable?.foreignKeys.find(fk => fk.columnNames.indexOf('courseId') !== -1);
        if (calendarForeignKey) {
            await queryRunner.dropForeignKey('academic_calendar', calendarForeignKey);
        }

        // Remover colunas
        await queryRunner.dropColumn('schedules', 'courseId');
        await queryRunner.dropColumn('events', 'courseId');
        await queryRunner.dropColumn('exam', 'courseId');
        await queryRunner.dropColumn('academic_calendar', 'courseId');
    }
}