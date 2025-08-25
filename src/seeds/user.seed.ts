import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { StudentProfile } from "../entities/StudentProfile";
import { Course } from "../entities/Course";
import * as bcrypt from 'bcryptjs';

async function seedUsers() {
    console.log("Iniciando seed de usuários...");
    
    try {
        await AppDataSource.initialize();
        console.log("Conexão com o banco de dados estabelecida");
        
        const userRepository = AppDataSource.getRepository(User);
        const studentProfileRepository = AppDataSource.getRepository(StudentProfile);
        const courseRepository = AppDataSource.getRepository(Course);
        
        const count = await userRepository.count();
        if (count > 0) {
            console.log(`Já existem ${count} usuários cadastrados. Pulando seed.`);
            return;
        }


        const course = await courseRepository.findOneBy({ id: 1 });
        if (!course) {
            console.log("Curso não encontrado. Execute primeiro o seed de cursos.");
            return;
        }

        const hashedPassword = await bcrypt.hash("123456", 10);        const user = userRepository.create({
            name: "joao",
            email: "teste@hotmail.com",
            password: hashedPassword,
            cpf: "1135165315135",
            role: "student",
            isEmailVerified: true,
            isDeleted: false,
            termsAccepted: true,
            course: course,
            gender: 'female'
        });

        const savedUser = await userRepository.save(user);     
        const studentProfile = studentProfileRepository.create({
            user: savedUser,
            studentId: "202310123", 
            phone: "62999999999",
            courseId: course.id
        });

        await studentProfileRepository.save(studentProfile);
        
        console.log("Usuário e perfil de estudante criados com sucesso!");

    } catch (error) {
        console.error("Erro ao criar usuários:", error);
    } finally {
        await AppDataSource.destroy();
    }
}

seedUsers();
