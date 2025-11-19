import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { Course } from "./Course";

export enum LocationType {
    BLOCK = 'block',
    BUILDING = 'building',
    CLASSROOM = 'classroom',
    LABORATORY = 'laboratory',
    LIBRARY = 'library',
    CAFETERIA = 'cafeteria',
    AUDITORIUM = 'auditorium',
    ADMINISTRATIVE = 'administrative',
    OTHER = 'other'
}

@Entity('locations')
export class Location {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    code: string; // Ex: "B1", "E208", "J204"

    @Column({
        type: 'enum',
        enum: LocationType,
        default: LocationType.CLASSROOM
    })
    type: LocationType;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    floor: number;

    @Column({ nullable: true })
    block: string; // Ex: "B", "C", "E", "J"

    // Coordenadas para o mapa
    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    latitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    longitude: number;

    // Campo para armazenar pontos de referência próximos
    @Column({ nullable: true })
    nearbyLandmarks: string;

    // Campo para armazenar instruções de acessibilidade
    @Column({ nullable: true })
    accessibilityNotes: string;

    // Relações de cursos que utilizam este local
    @OneToMany(() => CourseLocation, courseLocation => courseLocation.location)
    coursesLocations: CourseLocation[];

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}

// Entidade de junção para relacionar cursos com localizações (salas de aula)
@Entity('course_locations')
export class CourseLocation {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Course, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'courseId' })
    course: Course;

    @Column()
    courseId: number;

    @ManyToOne(() => Location, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'locationId' })
    location: Location;

    @Column()
    locationId: number;

    @Column({ type: 'enum', enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] })
    dayOfWeek: string;

    @Column({ type: 'time' })
    startTime: string;

    @Column({ type: 'time' })
    endTime: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}
