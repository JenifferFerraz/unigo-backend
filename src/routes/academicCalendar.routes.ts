import { Router } from 'express';
import AcademicCalendarController from '../controllers/AcademicCalendarController';
import TokenNode from '../middlewares/Token';

const academicCalendarRoutes = Router();

// Rotas públicas (qualquer usuário autenticado)
academicCalendarRoutes.get(
  '/',
  TokenNode.authorize.bind(TokenNode),
  AcademicCalendarController.findAll.bind(AcademicCalendarController)
);

academicCalendarRoutes.get(
  '/:id',
  TokenNode.authorize.bind(TokenNode),
  AcademicCalendarController.findById.bind(AcademicCalendarController)
);

// Rotas administrativas (apenas admin)
academicCalendarRoutes.delete(
  '/:id',
  TokenNode.authorize.bind(TokenNode),
  TokenNode.isAdmin.bind(TokenNode),
  AcademicCalendarController.delete.bind(AcademicCalendarController)
);

export { academicCalendarRoutes };
