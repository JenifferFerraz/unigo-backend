import { Router } from 'express';
import NotificationController from '../controllers/NotificationController';
import Token from '../middlewares/Token';
export const notificationRoutes = Router();

// Public route for academic calendar events (no auth required)
notificationRoutes.get('/public-events', NotificationController.getPublicEvents.bind(NotificationController));

// Protected routes (require token)
notificationRoutes.use(Token.authorize.bind(Token));

notificationRoutes.get('/upcoming-classes', NotificationController.getUpcomingClasses.bind(NotificationController));

notificationRoutes.get('/classes-by-date', NotificationController.getClassesByDateRange.bind(NotificationController));

notificationRoutes.get('/course-events/:courseId', NotificationController.getCourseEvents.bind(NotificationController));