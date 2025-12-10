import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { Course } from "./Course";

@Entity('student_profiles')
export class StudentProfile {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    studentId: string;

    @Column({ nullable: true })
    phone?: string;

    @Column({ nullable: true })
    courseId: number;

    @Column({ type: 'uuid', unique: true })
    userId: string;

    @OneToOne(() => User, user => user.studentProfile)
    @JoinColumn({ name: 'userId' })
    user: User;

    @OneToOne(() => Course)
    @JoinColumn()
    course: Course;
}