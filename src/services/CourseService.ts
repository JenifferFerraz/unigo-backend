import { AppDataSource } from '../config/data-source';
import { Course } from '../entities/Course';
import { CreateCourseDto } from '../dto/Course';

export class CourseService {
    private courseRepository = AppDataSource.getRepository(Course);
    
    //** - Valida os dados de criação de curso */
    async create(createCourseDto: CreateCourseDto): Promise<Course> {
        const course = this.courseRepository.create(createCourseDto);
        return await this.courseRepository.save(course);
    }
    
    //** - Cria vários cursos */
    async createMany(createCourseDtos: CreateCourseDto[]): Promise<Course[]> {
        const courses = this.courseRepository.create(createCourseDtos);
        return await this.courseRepository.save(courses);
    }
    
    //** - Busca todos os cursos */
    async findAll(): Promise<Course[]> {
        return await this.courseRepository.find();
    }
}