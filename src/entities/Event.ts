import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 200 })
  title!: string; 

  @Column({ type: 'text' })
  description!: string; 

  @Column({ type: 'timestamp' })
  startDate!: Date; 

  @Column({ type: 'timestamp', nullable: true })
  endDate?: Date; 

  @Column({ length: 200, nullable: true })
  location?: string; 

  @Column({ 
    type: 'enum',
    enum: ['academico', 'cultural', 'esportivo', 'social', 'outro'],
    default: 'academico'
  })
  type!: string; 

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
