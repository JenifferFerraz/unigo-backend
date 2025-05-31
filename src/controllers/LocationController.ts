import { Request, Response } from 'express';
import LocationService from '../services/LocationService';
import { LocationType } from '../entities/Location';

class LocationController {    /**
     * Cria uma nova localização
     */
    public static async create(req: Request, res: Response): Promise<Response> {
        try {
            LocationService.validateLocation(req);
            const location = await LocationService.createLocation(req.body);
            return res.status(201).json(location);
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }    /**
     * Obtém todas as localizações com filtros opcionais
     */
    public static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const filters = {
                type: req.query.type as LocationType | undefined,
                block: req.query.block as string | undefined,
                floor: req.query.floor ? Number(req.query.floor) : undefined,
                search: req.query.search as string | undefined
            };

            const locations = await LocationService.getAllLocations(filters);
            return res.status(200).json(locations);
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }    /**
     * Obtém uma única localização pelo id
     */
    public static async getById(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            const location = await LocationService.getLocationById(id);
            return res.status(200).json(location);
        } catch (error: any) {
            return res.status(404).json({ message: error.message });
        }
    }

    /**
     * Update a location
     */
    public static async update(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            const location = await LocationService.updateLocation(id, req.body);
            return res.status(200).json(location);
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    /**
     * Delete a location
     */
    public static async delete(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            await LocationService.deleteLocation(id);
            return res.status(200).json({ message: 'Location deleted successfully' });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    /**
     * Associate a course with a location
     */
    public static async assignCourse(req: Request, res: Response): Promise<Response> {
        try {
            const courseLocation = await LocationService.assignCourseToLocation(req.body);
            return res.status(201).json(courseLocation);
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    /**
     * Get all locations for a specific course
     */
    public static async getLocationsByCourse(req: Request, res: Response): Promise<Response> {
        try {
            const courseId = Number(req.params.courseId);
            const courseLocations = await LocationService.getLocationsByCourse(courseId);
            return res.status(200).json(courseLocations);
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    /**
     * Remove a course-location assignment
     */
    public static async removeCourseLocation(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            await LocationService.removeCourseFromLocation(id);
            return res.status(200).json({ message: 'Course-Location association removed successfully' });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    /**
     * Search locations
     */
    public static async search(req: Request, res: Response): Promise<Response> {
        try {
            const query = req.query.q as string;
            if (!query) {
                return res.status(400).json({ message: 'Search query is required' });
            }
            
            const locations = await LocationService.searchLocations(query);
            return res.status(200).json(locations);
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    /**
     * Get unique blocks
     */
    public static async getBlocks(req: Request, res: Response): Promise<Response> {
        try {
            const blocks = await LocationService.getUniqueBlocks();
            return res.status(200).json(blocks);
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }
}

export default LocationController;
