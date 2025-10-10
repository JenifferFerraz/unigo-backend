import request from 'supertest';
import { AppDataSource } from '../../src/config/data-source';
import app from '../../src/app.test';

// Mock database connection
jest.mock('../../src/config/data-source');

const mockAppDataSource = AppDataSource as jest.Mocked<typeof AppDataSource>;

describe('Course Integration Tests', () => {
  beforeAll(async () => {
    // Mock database initialization
    mockAppDataSource.initialize = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(mockAppDataSource, 'isInitialized', {
      value: true,
      writable: true
    });
  });

  afterAll(async () => {
    // Clean up
    jest.clearAllMocks();
  });

  describe('POST /courses', () => {
    it('should create a course successfully', async () => {
      const courseData = {
        name: 'Computer Science',
        code: 'CS101',
        description: 'Introduction to Computer Science',
        credits: 4,
        shift: 'morning',
        semester: '2024.1'
      };

      const mockCourse = {
        id: 1,
        ...courseData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock CourseService.create
      jest.doMock('../../src/services/CourseService', () => ({
        CourseService: jest.fn().mockImplementation(() => ({
          create: jest.fn().mockResolvedValue(mockCourse)
        }))
      }));

      const response = await request(app)
        .post('/api')
        .send(courseData)
        .expect(201);

      expect(response.body).toEqual(mockCourse);
    });

    it('should return 500 for service error', async () => {
      const courseData = {
        name: 'Computer Science',
        code: 'CS101',
        description: 'Introduction to Computer Science',
        credits: 4,
        shift: 'morning',
        semester: '2024.1'
      };

      // Mock CourseService.create to throw error
      jest.doMock('../../src/services/CourseService', () => ({
        CourseService: jest.fn().mockImplementation(() => ({
          create: jest.fn().mockRejectedValue(new Error('Database connection failed'))
        }))
      }));

      const response = await request(app)
        .post('/api')
        .send(courseData)
        .expect(500);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Internal server error');
    });
  });

  describe('POST /courses/many', () => {
    it('should create multiple courses successfully', async () => {
      const coursesData = [
        {
          name: 'Computer Science',
          code: 'CS101',
          description: 'Introduction to Computer Science',
          credits: 4,
          shift: 'morning',
          semester: '2024.1'
        },
        {
          name: 'Mathematics',
          code: 'MATH101',
          description: 'Calculus I',
          credits: 3,
          shift: 'afternoon',
          semester: '2024.1'
        }
      ];

      const mockCourses = coursesData.map((course, index) => ({
        id: index + 1,
        ...course,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // Mock CourseService.createMany
      jest.doMock('../../src/services/CourseService', () => ({
        CourseService: jest.fn().mockImplementation(() => ({
          createMany: jest.fn().mockResolvedValue(mockCourses)
        }))
      }));

      const response = await request(app)
        .post('/api/bulk')
        .send(coursesData)
        .expect(201);

      expect(response.body).toEqual(mockCourses);
    });

    it('should return 500 for service error', async () => {
      const coursesData = [
        {
          name: 'Computer Science',
          code: 'CS101',
          description: 'Introduction to Computer Science',
          credits: 4,
          shift: 'morning',
          semester: '2024.1'
        }
      ];

      // Mock CourseService.createMany to throw error
      jest.doMock('../../src/services/CourseService', () => ({
        CourseService: jest.fn().mockImplementation(() => ({
          createMany: jest.fn().mockRejectedValue(new Error('Database connection failed'))
        }))
      }));

      const response = await request(app)
        .post('/api/bulk')
        .send(coursesData)
        .expect(500);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Internal server error');
    });
  });

  describe('GET /courses', () => {
    it('should return all courses successfully', async () => {
      const mockCourses = [
        {
          id: 1,
          name: 'Computer Science',
          code: 'CS101',
          description: 'Introduction to Computer Science',
          credits: 4,
          shift: 'morning',
          semester: '2024.1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          name: 'Mathematics',
          code: 'MATH101',
          description: 'Calculus I',
          credits: 3,
          shift: 'afternoon',
          semester: '2024.1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Mock CourseService.findAll
      jest.doMock('../../src/services/CourseService', () => ({
        CourseService: jest.fn().mockImplementation(() => ({
          findAll: jest.fn().mockResolvedValue(mockCourses)
        }))
      }));

      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body).toEqual(mockCourses);
    });

    it('should return empty array when no courses exist', async () => {
      // Mock CourseService.findAll to return empty array
      jest.doMock('../../src/services/CourseService', () => ({
        CourseService: jest.fn().mockImplementation(() => ({
          findAll: jest.fn().mockResolvedValue([])
        }))
      }));

      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return 500 for service error', async () => {
      // Mock CourseService.findAll to throw error
      jest.doMock('../../src/services/CourseService', () => ({
        CourseService: jest.fn().mockImplementation(() => ({
          findAll: jest.fn().mockRejectedValue(new Error('Database connection failed'))
        }))
      }));

      const response = await request(app)
        .get('/api')
        .expect(500);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Internal server error');
    });
  });
});
