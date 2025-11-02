import { Router } from 'express';
import { InternalRouteController } from '../controllers/InternalRouteController';

export const internalRouteRoutes = Router();
const controller = new InternalRouteController();

internalRouteRoutes.post('/shortest-to-room', (req, res) => controller.getShortestToRoom(req, res));
internalRouteRoutes.get('/shortest', (req, res) => controller.getShortest(req, res));
internalRouteRoutes.get('/all', (req, res) => controller.getAll(req, res));
internalRouteRoutes.get('/by-structure', (req, res) => controller.getByStructure(req, res));
internalRouteRoutes.get('/:id', (req, res) => controller.getById(req, res));