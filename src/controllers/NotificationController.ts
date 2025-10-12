import { Request, Response } from 'express';
import NotificationService from '../services/NotificationService';

class NotificationController {
    /**
     * Get upcoming classes for the authenticated user
     */    public static async getUpcomingClasses(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.userId) {
                return res.status(401).json({ message: 'User not authenticated' });
            }
            const classes = await NotificationService.getUserUpcomingClasses(req.userId);
            return res.status(200).json(classes);
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    /**
     * Get classes in a date range for the authenticated user
     */
    public static async getClassesByDateRange(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.body.userId; 
            const { startDate, endDate } = req.query;
            
            if (!startDate || !endDate) {
                return res.status(400).json({ message: 'Start date and end date are required' });
            }
            
            const classes = await NotificationService.getClassesByTimeRange(
                userId,
                new Date(startDate as string),
                new Date(endDate as string)
            );
            
            return res.status(200).json(classes);
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    /**
     * Get course events (integration with Event3 or other event systems)
     */
    public static async getCourseEvents(req: Request, res: Response): Promise<Response> {
        try {
            const { courseId } = req.params;
            
            if (!courseId) {
                return res.status(400).json({ message: 'Course ID is required' });
            }
            
            const events = await NotificationService.getCourseEvents(parseInt(courseId));
            return res.status(200).json(events);
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    /**
     * Public events for academic calendar (no auth required)
     */
    public static async getPublicEvents(req: Request, res: Response): Promise<Response> {
        try {
            const events = await NotificationService.getPublicEvents();
            return res.status(200).json(events);
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }
}

export default NotificationController;
