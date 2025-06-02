import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { Course } from '../entities/Course';
import { CourseLocation } from '../entities/Location';
import { StudentProfile } from '../entities/StudentProfile';

interface ClassNotification {
    userId: number;
    userName: string;
    className: string;
    courseName: string;
    locationCode: string;
    locationName: string;
    block: string;
    floor: number | null;
    startTime: string;
    endTime: string;
}

class NotificationService {
    private userRepository = AppDataSource.getRepository(User);
    private courseLocationRepository = AppDataSource.getRepository(CourseLocation);

    /**
     * Get upcoming class notifications for a specific user
     */
    public async getUserUpcomingClasses(userId: number): Promise<ClassNotification[]> {
        try {
            const user = await this.userRepository.findOne({
                where: { id: userId },
                relations: ['course']
            });

            if (!user || !user.course) {
                throw new Error('User or course information not found');
            }

            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const today = days[new Date().getDay()];
            
            const courseLocations = await this.courseLocationRepository
                .createQueryBuilder('cl')
                .leftJoinAndSelect('cl.location', 'location')
                .leftJoinAndSelect('cl.course', 'course')
                .where('cl.courseId = :courseId', { courseId: user.course.id })
                .andWhere('cl.dayOfWeek = :day', { day: today })
                .getMany();

            return courseLocations.map(cl => ({
                userId: user.id,
                userName: user.name,
                className: user.course.className,
                courseName: user.course.name,
                locationCode: cl.location.code,
                locationName: cl.location.name,
                block: cl.location.block || '',
                floor: cl.location.floor,
                startTime: cl.startTime,
                endTime: cl.endTime
            }));
        } catch (error: any) {
            throw new Error(`Failed to get upcoming classes: ${error.message}`);
        }
    }

    /**
     * Get classes by time range for a specific user
     */
    public async getClassesByTimeRange(userId: number, startDate: Date, endDate: Date): Promise<ClassNotification[]> {
        try {
            const user = await this.userRepository.findOne({
                where: { id: userId },
                relations: ['course']
            });

            if (!user || !user.course) {
                throw new Error('User or course information not found');
            }

            const courseLocations = await this.courseLocationRepository
                .createQueryBuilder('cl')
                .leftJoinAndSelect('cl.location', 'location')
                .leftJoinAndSelect('cl.course', 'course')
                .where('cl.courseId = :courseId', { courseId: user.course.id })
                .getMany();

            const startDay = startDate.getDay();
            const endDay = endDate.getDay();
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            
            let relevantDays: string[];
            if (startDay <= endDay) {
                relevantDays = days.slice(startDay, endDay + 1);
            } else {
                relevantDays = [...days.slice(startDay), ...days.slice(0, endDay + 1)];
            }

            const filteredLocations = courseLocations.filter(cl => 
                relevantDays.includes(cl.dayOfWeek)
            );

            return filteredLocations.map(cl => ({
                userId: user.id,
                userName: user.name,
                className: user.course.className,
                courseName: user.course.name,
                locationCode: cl.location.code,
                locationName: cl.location.name,
                block: cl.location.block || '',
                floor: cl.location.floor,
                startTime: cl.startTime,
                endTime: cl.endTime
            }));
        } catch (error: any) {
            throw new Error(`Failed to get classes by time range: ${error.message}`);
        }
    }

    /**
     * Get all upcoming events with locations for a specific course
     */
    public async getCourseEvents(courseId: number): Promise<any[]> {
       
        return [
            {
                eventId: 1,
                title: 'Final Exams',
                description: 'Final exams for the semester',
                locationCode: 'B101',
                date: new Date().toISOString(),
                requiresPresence: true
            }
        ];
    }
}

export default new NotificationService();
