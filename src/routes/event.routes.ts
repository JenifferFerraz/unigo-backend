import { Router } from 'express';
import EventController from '../controllers/EventController';
import TokenNode from '../middlewares/Token';

const eventRoutes = Router();

// Rotas públicas (qualquer usuário autenticado)
eventRoutes.get(
  '/',
  TokenNode.authorize.bind(TokenNode),
  EventController.findAll.bind(EventController)
);

eventRoutes.get(
  '/:id',
  TokenNode.authorize.bind(TokenNode),
  EventController.findById.bind(EventController)
);

// Rotas administrativas (apenas admin)
eventRoutes.delete(
  '/:id',
  TokenNode.authorize.bind(TokenNode),
  TokenNode.isAdmin.bind(TokenNode),
  EventController.delete.bind(EventController)
);

export { eventRoutes };
