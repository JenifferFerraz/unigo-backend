import { Router } from 'express';
import { StructureController } from '../controllers/StructureController';

export const structureRoutes = Router();

structureRoutes.get('/nearest', StructureController.getNearest);
structureRoutes.get('/all', StructureController.getAll);
structureRoutes.get('/:id', StructureController.getById);