import { AppDataSource } from '../config/data-source';
import { Course } from '../entities/Course';
import { CreateCourseDto } from '../dto/Course';

export class CourseService {
    private courseRepository = AppDataSource.getRepository(Course);

    async create(createCourseDto: CreateCourseDto): Promise<Course> {
        const course = this.courseRepository.create(createCourseDto);
        return await this.courseRepository.save(course);
    }
    async createMany(createCourseDtos: CreateCourseDto[]): Promise<Course[]> {
        const courses = this.courseRepository.create(createCourseDtos);
        return await this.courseRepository.save(courses);
    }
}