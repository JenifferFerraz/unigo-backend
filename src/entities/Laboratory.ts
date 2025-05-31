import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { Course } from "./Course";

@Entity('laboratories')
export class Laboratory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    code: string; // Ex: "Lab Informática 1", "Lab Química 2"

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    block: string; // Bloco onde o laboratório está localizado

    @Column({ nullable: true })
    floor: number;

    @Column({ nullable: true })
    capacity: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    latitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    longitude: number;

    // Campo para armazenar tipos de equipamentos disponíveis
    @Column({ nullable: true })
    equipments: string;

    // Campo para armazenar horários de funcionamento
    @Column({ nullable: true })
    openingHours: string;

    // Campo para armazenar responsável pelo laboratório
    @Column({ nullable: true })
    manager: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}
