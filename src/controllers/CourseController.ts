import { Request, Response } from 'express';
import { CourseService } from '../services/CourseService';
import { CreateCourseDto } from '../dto/Course';

class CourseController {
    private courseService: CourseService;

    constructor() {
        this.courseService = new CourseService();
    }

    async create(req: Request, res: Response): Promise<Response> {
        try {
            const createCourseDto: CreateCourseDto = req.body;
            const course = await this.courseService.create(createCourseDto);
            return res.status(201).json(course);
        } catch (error) {
            return res.status(500).json({ message: 'Internal server error', error });
        }
    }
    async createMany(req: Request, res: Response): Promise<Response> {
        try {
            const courses = await this.courseService.createMany(req.body);
            return res.status(201).json(courses);
        } catch (error) {
            return res.status(500).json({ message: 'Internal server error', error });
        }
}
}
export default new CourseController();