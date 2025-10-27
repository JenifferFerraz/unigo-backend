import { Router } from 'express';
import UploadController from '../controllers/UploadController';
import TokenNode from '../middlewares/Token';
import { upload } from '../middlewares/Upload';

const uploadRoutes = Router();

// Todas as rotas de upload requerem autenticação de admin
uploadRoutes.post(
  '/schedule',
  TokenNode.authorize.bind(TokenNode),
  TokenNode.isAdmin.bind(TokenNode),
  upload.single('file'),
  UploadController.uploadSchedule.bind(UploadController)
);

uploadRoutes.post(
  '/events',
  TokenNode.authorize.bind(TokenNode),
  TokenNode.isAdmin.bind(TokenNode),
  upload.single('file'),
  UploadController.uploadEvents.bind(UploadController)
);

uploadRoutes.post(
  '/calendar',
  TokenNode.authorize.bind(TokenNode),
  TokenNode.isAdmin.bind(TokenNode),
  upload.single('file'),
  UploadController.uploadCalendar.bind(UploadController)
);

uploadRoutes.post(
  '/exams',
  TokenNode.authorize.bind(TokenNode),
  TokenNode.isAdmin.bind(TokenNode),
  upload.single('file'),
  UploadController.uploadExams.bind(UploadController)
);

// Rota para download de templates
uploadRoutes.get(
  '/template/:type',
  TokenNode.authorize.bind(TokenNode),
  TokenNode.isAdmin.bind(TokenNode),
  UploadController.downloadTemplate.bind(UploadController)
);

export { uploadRoutes };
