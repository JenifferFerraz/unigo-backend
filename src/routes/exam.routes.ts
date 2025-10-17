import { Router } from 'express';
import ExamController from '../controllers/ExamController';
import multer from 'multer';

const examRoutes = Router();

examRoutes.get('/', ExamController.findAll.bind(ExamController));
examRoutes.post('/upload-tabela', multer().single('file'), ExamController.uploadTable.bind(ExamController));

export { examRoutes };
