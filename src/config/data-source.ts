import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { Course } from "../entities/Course";
import * as dotenv from 'dotenv';
import { StudentProfile } from "../entities/StudentProfile";
import { Location, CourseLocation } from "../entities/Location";

dotenv.config();
//** - Configuração do banco de dados
export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: false,
    logging: true,
    entities: [User, Course, StudentProfile, Location, CourseLocation],
    migrations: [__dirname + '/../migrations/*.{ts,js}'],
    subscribers: []
});