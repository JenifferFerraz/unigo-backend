import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class AddLocationTables1745050000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create locations table
        await queryRunner.createTable(
            new Table({
                name: "locations",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    {
                        name: "name",
                        type: "varchar"
                    },
                    {
                        name: "code",
                        type: "varchar",
                        isUnique: true
                    },
                    {
                        name: "type",
                        type: "enum",
                        enum: ["block", "building", "classroom", "laboratory", "library", "cafeteria", "auditorium", "administrative", "other"],
                        default: "'classroom'"
                    },
                    {
                        name: "description",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "floor",
                        type: "int",
                        isNullable: true
                    },
                    {
                        name: "block",
                        type: "varchar",
                        isNullable: true
                    },
                    {
                        name: "latitude",
                        type: "decimal",
                        precision: 10,
                        scale: 7,
                        isNullable: true
                    },
                    {
                        name: "longitude",
                        type: "decimal",
                        precision: 10,
                        scale: 7,
                        isNullable: true
                    },
                    {
                        name: "nearbyLandmarks",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "accessibilityNotes",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "updatedAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP"
                    }
                ]
            }),
            true
        );

        // Create course_locations table (for classroom scheduling)
        await queryRunner.createTable(
            new Table({
                name: "course_locations",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    {
                        name: "courseId",
                        type: "int"
                    },
                    {
                        name: "locationId",
                        type: "int"
                    },
                    {
                        name: "dayOfWeek",
                        type: "enum",
                        enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
                    },
                    {
                        name: "startTime",
                        type: "time"
                    },
                    {
                        name: "endTime",
                        type: "time"
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "updatedAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP"
                    }
                ]
            }),
            true
        );

        // Add foreign keys
        await queryRunner.createForeignKey(
            "course_locations",
            new TableForeignKey({
                columnNames: ["courseId"],
                referencedColumnNames: ["id"],
                referencedTableName: "courses",
                onDelete: "CASCADE"
            })
        );

        await queryRunner.createForeignKey(
            "course_locations",
            new TableForeignKey({
                columnNames: ["locationId"],
                referencedColumnNames: ["id"],
                referencedTableName: "locations",
                onDelete: "CASCADE"
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys first
        const courseLocationTable = await queryRunner.getTable("course_locations");
        if (courseLocationTable) {
            const foreignKeys = courseLocationTable.foreignKeys;
            for (const foreignKey of foreignKeys) {
                await queryRunner.dropForeignKey("course_locations", foreignKey);
            }
        }

        // Drop tables
        await queryRunner.dropTable("course_locations");
        await queryRunner.dropTable("locations");
    }
}
