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


// Rota de atualização de evento do calendário (admin)
academicCalendarRoutes.patch(
  '/:id',
  TokenNode.authorize.bind(TokenNode),
  TokenNode.isAdmin.bind(TokenNode),
  AcademicCalendarController.update.bind(AcademicCalendarController)
);

academicCalendarRoutes.delete(
  '/:id',
  TokenNode.authorize.bind(TokenNode),
  TokenNode.isAdmin.bind(TokenNode),
  AcademicCalendarController.delete.bind(AcademicCalendarController)
);

export { academicCalendarRoutes };
