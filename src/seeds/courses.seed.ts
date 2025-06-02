import { AppDataSource } from "../config/data-source";
import { CourseService } from "../services/CourseService";

async function seedCourses() {
    await AppDataSource.initialize();
    console.log('📦 Database connected successfully');

    const courseService = new CourseService();    const courses = [
        {
            id: 1,
            name: 'Administração',
            period: 8,
            shift: 'noturno' as const,
            className: 'ADM2025/1'
        },
        {
            id: 2,
            name: 'Agronomia',
            period: 10,
            shift: 'integral' as const,
            className: 'AGRO2025/1'
        },
        {
            id: 3,
            name: 'Arquitetura e Urbanismo',
            period: 10,
            shift: 'integral' as const,
            className: 'ARQ2025/1'
        },
        {
            id: 4,
            name: 'Ciências Contábeis',
            period: 8,
            shift: 'noturno' as const,
            className: 'CONT2025/1'
        },
        {
            id: 5,
            name: 'Direito',
            period: 10,
            shift: 'noturno' as const,
            className: 'DIR2025/1'
        },
        {
            id: 6,
            name: 'Educação Física',
            period: 8,
            shift: 'noturno' as const,
            className: 'EDF2025/1'
        },
        {
            id: 7,
            name: 'Enfermagem',
            period: 10,
            shift: 'integral' as const,
            className: 'ENF2025/1'
        },
        {
            id: 8,
            name: 'Engenharia Civil',
            period: 10,
            shift: 'noturno' as const,
            className: 'ENC2025/1'
        },
        {
            id: 9,
            name: 'Engenharia de Computação',
            period: 10,
            shift: 'noturno' as const,
            className: 'ECP2025/1'
        },
        {
            id: 10,
            name: 'Engenharia de Software',
            period: 8,
            shift: 'noturno' as const,
            className: 'ESW2025/1'
        },
        {
            id: 11,
            name: 'Engenharia Mecânica',
            period: 10,
            shift: 'noturno' as const,
            className: 'EMC2025/1'
        },
        {
            id: 12,
            name: 'Farmácia',
            period: 10,
            shift: 'integral' as const,
            className: 'FAR2025/1'
        },
        {
            id: 13,
            name: 'Fisioterapia',
            period: 10,
            shift: 'integral' as const,
            className: 'FIS2025/1'
        },
        {
            id: 14,
            name: 'Medicina',
            period: 12,
            shift: 'integral' as const,
            className: 'MED2025/1'
        },
        {
            id: 15,
            name: 'Medicina Veterinária',
            period: 10,
            shift: 'integral' as const,
            className: 'VET2025/1'
        },
        {
            id: 16,
            name: 'Odontologia',
            period: 10,
            shift: 'integral' as const,
            className: 'ODO2025/1'
        },
        {
            id: 17,
            name: 'Psicologia',
            period: 10,
            shift: 'noturno' as const,
            className: 'PSI2025/1'
        }
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
