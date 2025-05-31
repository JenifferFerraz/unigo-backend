import { Router } from 'express';
import CourseController from '../controllers/CourseController';

const courseRoutes = Router();

courseRoutes.get('/', CourseController.findAll.bind(CourseController));
courseRoutes.post('/', CourseController.create.bind(CourseController));
courseRoutes.post('/bulk', CourseController.createMany.bind(CourseController));

export { courseRoutes };