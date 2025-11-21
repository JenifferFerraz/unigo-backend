import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Course } from './Course';

@Entity('exam')
export class Exam {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ length: 100 })
    day!: string;

    @Column({ length: 20 })
    date!: string;

    @Column({ length: 200 })
    subject!: string;

    @Column({ length: 50 })
    time!: string;

    @Column({ length: 100, nullable: true })
    grade?: string;
    
    @Column({ length: 20, nullable: true })
    shift?: string;
    
    @Column({ type: 'int', default: 1 })
    cycle!: number;

    @ManyToOne(() => Course, { nullable: true })
    course?: Course;
}

