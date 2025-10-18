import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { Course } from "./Course";

@Entity('student_profiles')
export class StudentProfile {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    studentId: string;

    @Column({ nullable: true })
    phone?: string;

    @Column({ nullable: true })
    courseId: number;

    @OneToOne(() => User, user => user.studentProfile)
    @JoinColumn()
    user: User;

    @OneToOne(() => Course)
    @JoinColumn()
    course: Course;
}