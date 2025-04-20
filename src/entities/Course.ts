import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { User } from "./User";

@Entity('courses')
export class Course {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    period: number;

    @Column({
        type: 'enum',
        enum: ['matutino', 'vespertino', 'noturno', 'integral'],
        default: 'matutino'
    })
    shift: 'matutino' | 'vespertino' | 'noturno' | 'integral';

    @Column()
    className: string;

    @OneToMany(() => User, user => user.course)
    students: User[];

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}