import { Router } from 'express';
import { RoomController } from '../controllers/RoomController';

export const roomRouter = Router();

roomRouter.get('/all', RoomController.getAll);
roomRouter.get('/:id', RoomController.getById);
roomRouter.delete('/:id', RoomController.delete);

