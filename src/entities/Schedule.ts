import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Course } from './Course';

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 200 })
  subject!: string; // disciplina

  @Column({ length: 100 })
  professor!: string;

  @Column({ length: 50 })
  time!: string; // horário (ex: "08:00-10:00")

  @Column({ length: 50 })
  room!: string; // sala

  @Column({ length: 20 })
  dayOfWeek!: string; // dia_semana (Segunda, Terça, etc)

  @Column({ length: 20, nullable: true })
  shift?: string; // turno (matutino, vespertino, noturno)

  @Column({ type: 'int', default: 1 })
  semester!: number; // semestre/período

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'int', nullable: true })
  courseId?: number;

  @Column({ length: 100, nullable: true })
  courseName?: string;

  @ManyToOne(() => Course, { nullable: true })
  course?: Course;
}
