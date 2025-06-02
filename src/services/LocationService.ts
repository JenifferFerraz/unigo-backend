import { AppDataSource } from '../config/data-source';
import { Location, CourseLocation, LocationType } from '../entities/Location';
import { Course } from '../entities/Course';
import { CreateLocationDto, UpdateLocationDto, LocationFilterDto, CourseLocationDto } from '../dto/Location';
import { Request } from 'express';

class LocationService {
    private locationRepository = AppDataSource.getRepository(Location);
    private courseLocationRepository = AppDataSource.getRepository(CourseLocation);
    private courseRepository = AppDataSource.getRepository(Course);

    /**
     * Validate location data
     */
    public validateLocation(req: Request): void {
        const { name, code, type } = req.body;

        if (!name || !code || !type) {
            throw new Error('Name, code and type are required');
        }

        if (!Object.values(LocationType).includes(type)) {
            throw new Error('Invalid location type');
        }
    }

    /**
     * Create a new location
     */
    public async createLocation(data: CreateLocationDto): Promise<Location> {
        try {
            // Check if a location with the same code already exists
            const existingLocation = await this.locationRepository.findOne({ where: { code: data.code } });
            if (existingLocation) {
                throw new Error(`A location with code ${data.code} already exists`);
            }

            const location = this.locationRepository.create(data);
            return await this.locationRepository.save(location);
        } catch (error: any) {
            throw new Error(`Failed to create location: ${error.message}`);
        }
    }

    /**
     * Get all locations with optional filtering
     */
    public async getAllLocations(filters?: LocationFilterDto): Promise<Location[]> {
        try {
            let query = this.locationRepository.createQueryBuilder('location');

            if (filters) {
                if (filters.type) {
                    query = query.andWhere('location.type = :type', { type: filters.type });
                }

                if (filters.block) {
                    query = query.andWhere('location.block = :block', { block: filters.block });
                }

                if (filters.floor !== undefined) {
                    query = query.andWhere('location.floor = :floor', { floor: filters.floor });
                }

                if (filters.search) {
                    query = query.andWhere(
                        '(location.name ILIKE :search OR location.code ILIKE :search OR location.description ILIKE :search)',
                        { search: `%${filters.search}%` }
                    );
                }
            }

            return await query.orderBy('location.block', 'ASC')
                             .addOrderBy('location.floor', 'ASC')
                             .addOrderBy('location.name', 'ASC')
                             .getMany();
        } catch (error: any) {
            throw new Error(`Failed to fetch locations: ${error.message}`);
        }
    }

    /**
     * Get a single location by id
     */
    public async getLocationById(id: number): Promise<Location> {
        try {
            const location = await this.locationRepository.findOne({ where: { id } });
            if (!location) {
                throw new Error(`Location with id ${id} not found`);
            }
            return location;
        } catch (error: any) {
            throw new Error(`Failed to fetch location: ${error.message}`);
        }
    }

    /**
     * Update a location
     */
    public async updateLocation(id: number, data: UpdateLocationDto): Promise<Location> {
        try {
            const location = await this.getLocationById(id);
            
            // If code is being updated, check it's unique
            if (data.code && data.code !== location.code) {
                const existingLocation = await this.locationRepository.findOne({ 
                    where: { code: data.code } 
                });
                if (existingLocation && existingLocation.id !== id) {
                    throw new Error(`A location with code ${data.code} already exists`);
                }
            }

            this.locationRepository.merge(location, data);
            return await this.locationRepository.save(location);
        } catch (error: any) {
            throw new Error(`Failed to update location: ${error.message}`);
        }
    }

    /**
     * Delete a location
     */
    public async deleteLocation(id: number): Promise<void> {
        try {
            const location = await this.getLocationById(id);
            await this.locationRepository.remove(location);
        } catch (error: any) {
            throw new Error(`Failed to delete location: ${error.message}`);
        }
    }

    /**
     * Associate a course with a location (classroom scheduling)
     */
    public async assignCourseToLocation(data: CourseLocationDto): Promise<CourseLocation> {
        try {
            // Check if course exists
            const course = await this.courseRepository.findOne({ where: { id: data.courseId } });
            if (!course) {
                throw new Error(`Course with id ${data.courseId} not found`);
            }

            // Check if location exists
            const location = await this.locationRepository.findOne({ where: { id: data.locationId } });
            if (!location) {
                throw new Error(`Location with id ${data.locationId} not found`);
            }

            // Check for schedule conflicts
            const existingSchedules = await this.courseLocationRepository.find({
                where: {
                    locationId: data.locationId,
                    dayOfWeek: data.dayOfWeek
                }
            });

            const startTime = new Date(`1970-01-01T${data.startTime}`);
            const endTime = new Date(`1970-01-01T${data.endTime}`);

            const conflict = existingSchedules.some(schedule => {
                const scheduleStart = new Date(`1970-01-01T${schedule.startTime}`);
                const scheduleEnd = new Date(`1970-01-01T${schedule.endTime}`);
                
                return (
                    (startTime >= scheduleStart && startTime < scheduleEnd) ||
                    (endTime > scheduleStart && endTime <= scheduleEnd) ||
                    (startTime <= scheduleStart && endTime >= scheduleEnd)
                );
            });

            if (conflict) {
                throw new Error(`Schedule conflict detected for this location on ${data.dayOfWeek} between ${data.startTime} and ${data.endTime}`);
            }

            // Create the association
            const courseLocation = this.courseLocationRepository.create(data);
            return await this.courseLocationRepository.save(courseLocation);
        } catch (error: any) {
            throw new Error(`Failed to assign course to location: ${error.message}`);
        }
    }

    /**
     * Get all locations for a specific course
     */
    public async getLocationsByCourse(courseId: number): Promise<CourseLocation[]> {
        try {
            return await this.courseLocationRepository.find({
                where: { courseId },
                relations: ['location']
            });
        } catch (error: any) {
            throw new Error(`Failed to fetch locations for course: ${error.message}`);
        }
    }

    /**
     * Remove a course-location assignment
     */
    public async removeCourseFromLocation(id: number): Promise<void> {
        try {
            const courseLocation = await this.courseLocationRepository.findOne({ where: { id } });
            if (!courseLocation) {
                throw new Error(`Course-Location relation with id ${id} not found`);
            }
            await this.courseLocationRepository.remove(courseLocation);
        } catch (error: any) {
            throw new Error(`Failed to remove course from location: ${error.message}`);
        }
    }

    /**
     * Search locations by query string (name, code, description)
     */
    public async searchLocations(query: string): Promise<Location[]> {
        try {
            return await this.locationRepository
                .createQueryBuilder('location')
                .where('location.name ILIKE :query', { query: `%${query}%` })
                .orWhere('location.code ILIKE :query', { query: `%${query}%` })
                .orWhere('location.description ILIKE :query', { query: `%${query}%` })
                .orWhere('location.block ILIKE :query', { query: `%${query}%` })
                .orderBy('location.name', 'ASC')
                .getMany();
        } catch (error: any) {
            throw new Error(`Failed to search locations: ${error.message}`);
        }
    }

    /**
     * Get unique blocks in the campus
     */
    public async getUniqueBlocks(): Promise<string[]> {
        try {
            const result = await this.locationRepository
                .createQueryBuilder('location')
                .select('DISTINCT location.block', 'block')
                .where('location.block IS NOT NULL')
                .getRawMany();
            
            return result.map(item => item.block).sort();
        } catch (error: any) {
            throw new Error(`Failed to fetch unique blocks: ${error.message}`);
        }
    }
}

export default new LocationService();
