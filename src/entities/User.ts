import { Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne, JoinColumn } from "typeorm";
import { StudentProfile } from "./StudentProfile";
import { Course } from "./Course";

@Entity('users') 
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column()
    cpf:string;

    @Column({ default: false })
    termsAccepted: boolean;

    @Column({ nullable: true })
    avatar: string;

    @Column({
        type: 'enum',
        enum: ['male', 'female', 'other', 'prefer_not_to_say'],
        nullable: true
    })
    gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';


    @Column({
        type: 'enum',
        enum: ['student', 'professor', 'admin'],
        default: 'student'
    })
    role: 'student' | 'professor' | 'admin';

    @Column({ nullable: true })
    refreshToken: string;

    @OneToOne(() => StudentProfile, profile => profile.user)
    studentProfile: StudentProfile;

    @ManyToOne(() => Course, course => course.students)
    @JoinColumn({ name: 'courseId' })
    course: Course;

    @Column({ default: false })
    isEmailVerified: boolean;

    @Column({ default: false })
    isDeleted: boolean;
    
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}