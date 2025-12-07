import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Structure } from './Structure';

@Entity('room')
export class Room {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ nullable: true })
    description?: string;

    @Column({
        type: 'geometry',
        spatialFeatureType: 'Geometry',
        srid: 4326,
        nullable: true,
    })
    geometry?: any;

    @Column({
        type: 'geometry',
        spatialFeatureType: 'Geometry',
        srid: 4326,
        nullable: true,
    })
    centroid?: any;

    @ManyToOne(() => Structure, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'structureId' })
    structure: Structure;

    @Column()
    structureId: number;

    @Column({ type: 'int', nullable: true })
    floor?: number;

    @Column({ type: 'boolean', default: true })
    isSearchable: boolean;
}