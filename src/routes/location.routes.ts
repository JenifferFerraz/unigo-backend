import { Router } from 'express';
import LocationController from '../controllers/LocationController';
import Token from '../middlewares/Token';

export const locationRoutes = Router();

locationRoutes.get('/search', LocationController.search.bind(LocationController));
locationRoutes.get('/blocks', LocationController.getBlocks.bind(LocationController));

locationRoutes.use(Token.authorize.bind(Token));
locationRoutes.post('/', LocationController.create.bind(LocationController));
locationRoutes.get('/', LocationController.getAll.bind(LocationController));
locationRoutes.get('/:id', LocationController.getById.bind(LocationController));
locationRoutes.put('/:id', Token.isAdmin.bind(Token), LocationController.update.bind(LocationController));
locationRoutes.delete('/:id', Token.isAdmin.bind(Token), LocationController.delete.bind(LocationController));

locationRoutes.post('/assign-course', Token.isAdmin.bind(Token), LocationController.assignCourse.bind(LocationController));
locationRoutes.get('/course/:courseId', LocationController.getLocationsByCourse.bind(LocationController));
locationRoutes.delete('/course-location/:id', Token.isAdmin.bind(Token), LocationController.removeCourseLocation.bind(LocationController));