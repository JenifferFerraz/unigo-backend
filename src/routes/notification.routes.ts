import { Router } from 'express';
import NotificationController from '../controllers/NotificationController';
import Token from '../middlewares/Token';
export const notificationRoutes = Router();

notificationRoutes.use(Token.authorize.bind(Token));

notificationRoutes.get('/upcoming-classes', NotificationController.getUpcomingClasses.bind(NotificationController));

notificationRoutes.get('/classes-by-date', NotificationController.getClassesByDateRange.bind(NotificationController));

notificationRoutes.get('/course-events/:courseId', NotificationController.getCourseEvents.bind(NotificationController));