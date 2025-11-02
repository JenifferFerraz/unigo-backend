import { Router } from 'express';
import ScheduleController from '../controllers/ScheduleController';
import TokenNode from '../middlewares/Token';

const scheduleRoutes = Router();

// Rotas públicas (qualquer usuário autenticado)
scheduleRoutes.get(
  '/',
  TokenNode.authorize.bind(TokenNode),
  ScheduleController.findAll.bind(ScheduleController)
);

scheduleRoutes.get(
  '/:id',
  TokenNode.authorize.bind(TokenNode),
  ScheduleController.findById.bind(ScheduleController)
);

// Rotas administrativas (apenas admin)
scheduleRoutes.delete(
  '/:id',
  TokenNode.authorize.bind(TokenNode),
  TokenNode.isAdmin.bind(TokenNode),
  ScheduleController.delete.bind(ScheduleController)
);

export { scheduleRoutes };
