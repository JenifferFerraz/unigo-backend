import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Course } from './Course';

@Entity('academic_calendar')
export class AcademicCalendar {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 200 })
  title!: string;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ type: 'varchar', length: 50, default: 'evento' })
  type!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', nullable: true })
  semester?: number;

  @Column({ type: 'int', nullable: true })
  year?: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'int', nullable: true })
  courseId?: number;
  
  @Column({ type: 'varchar', length: 100, nullable: true })
  course?: string;
}
