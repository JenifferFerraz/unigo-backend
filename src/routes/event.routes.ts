import { Router } from 'express';
import EventController from '../controllers/EventController';
import TokenNode from '../middlewares/Token';

const eventRoutes = Router();

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


eventRoutes.patch(
  '/:id',
  TokenNode.authorize.bind(TokenNode),
  TokenNode.isAdmin.bind(TokenNode),
  EventController.update.bind(EventController)
);

eventRoutes.delete(
  '/:id',
  TokenNode.authorize.bind(TokenNode),
  TokenNode.isAdmin.bind(TokenNode),
  EventController.delete.bind(EventController)
);

export { eventRoutes };
