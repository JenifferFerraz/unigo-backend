import { Router } from 'express';
import ExamController from '../controllers/ExamController';
import multer from 'multer';
import TokenNode from '../middlewares/Token';

const examRoutes = Router();

examRoutes.get('/', ExamController.findAll.bind(ExamController));
examRoutes.post('/upload-tabela', multer().single('file'), ExamController.uploadTable.bind(ExamController));
examRoutes.patch('/:id', TokenNode.authorize.bind(TokenNode),
    TokenNode.isAdmin.bind(TokenNode), ExamController.update.bind(ExamController));
examRoutes.delete('/:id', TokenNode.authorize.bind(TokenNode),
    TokenNode.isAdmin.bind(TokenNode), ExamController.delete.bind(ExamController));

export { examRoutes };
