import { Router } from 'express';
import CourseController from '../controllers/CourseController';

const courseRoutes = Router();

courseRoutes.post('/courses', CourseController.create.bind(CourseController));
courseRoutes.post('/courses/bulk', CourseController.createMany.bind(CourseController));

export { courseRoutes };