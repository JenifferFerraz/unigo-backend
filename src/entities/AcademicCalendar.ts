import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('academic_calendar')
export class AcademicCalendar {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 200 })
  title!: string;

  @Column({ type: 'date' })
  date!: Date; 

  @Column({
    type: 'enum',
    enum: ['inicio_aulas', 'fim_aulas', 'feriado', 'prova', 'recesso', 'evento', 'outro'],
    default: 'evento'
  })
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
}
