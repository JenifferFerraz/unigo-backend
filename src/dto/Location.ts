import { LocationType } from '../entities/Location';

export interface CreateLocationDto {
    name: string;
    code: string;
    type: LocationType;
    description?: string;
    floor?: number;
    block?: string;
    latitude?: number;
    longitude?: number;
    nearbyLandmarks?: string;
    accessibilityNotes?: string;
}

export interface UpdateLocationDto {
    name?: string;
    code?: string;
    type?: LocationType;
    description?: string;
    floor?: number;
    block?: string;
    latitude?: number;
    longitude?: number;
    nearbyLandmarks?: string;
    accessibilityNotes?: string;
}

export interface LocationFilterDto {
    type?: LocationType;
    block?: string;
    floor?: number;
    search?: string;
}

export interface CourseLocationDto {
    courseId: number;
    locationId: number;
    dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    startTime: string;
    endTime: string;
}
