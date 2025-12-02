import { AppDataSource } from "../config/data-source";
import { CourseService } from "../services/CourseService";

async function seedCourses() {
    await AppDataSource.initialize();
    console.log('📦 Database connected successfully');

    const courseService = new CourseService();
    const courses = [
        { name: 'Administração', period: 8 },
        { name: 'Agronomia', period: 10 },
        { name: 'Arquitetura e Urbanismo', period: 10 },
        { name: 'Biomedicina', period: 8 },
        { name: 'Ciências Biológicas', period: 8 },
        { name: 'Ciências Contábeis', period: 8 },
        { name: 'Comunicação Social: Publicidade e Propaganda', period: 8 },
        { name: 'Design Gráfico', period: 8 },
        { name: 'Direito', period: 10 },
        { name: 'Educação Física', period: 8 },
        { name: 'Enfermagem', period: 10 },
        { name: 'Engenharia Civil', period: 10 },
        { name: 'Engenharia de Software', period: 8 },
        { name: 'Engenharia Elétrica', period: 10 },
        { name: 'Engenharia Mecânica', period: 10 },
        { name: 'Estética e Cosmética', period: 8 },
        { name: 'Farmácia', period: 10 },
        { name: 'Fisioterapia', period: 10 },
        { name: 'Gastronomia', period: 8 },
        { name: 'Gestão Pública', period: 8 },
        { name: 'Psicologia', period: 10 },
        { name: 'Medicina', period: 12 },
        { name: 'Relações Internacionais', period: 8 }
    ];

    try {
        await courseService.createMany(courses);
        console.log('✅ Courses seeded successfully');
    } catch (error) {
        console.error('❌ Error seeding courses:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

seedCourses();
