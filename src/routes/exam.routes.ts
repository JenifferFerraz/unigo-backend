import { Router } from 'express';
import ExamController from '../controllers/ExamController';

const examRoutes = Router();

examRoutes.get('/', ExamController.findAll.bind(ExamController));

export { examRoutes };
