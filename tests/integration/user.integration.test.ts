import request from 'supertest';
import { AppDataSource } from '../../src/config/data-source';
import app from '../../src/app.test';

// Mock database connection
jest.mock('../../src/config/data-source');

const mockAppDataSource = AppDataSource as jest.Mocked<typeof AppDataSource>;

describe('User Integration Tests', () => {
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

  describe('POST /users', () => {
    it('should create a user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        cpf: '12345678901',
        role: 'student',
        studentProfile: {
          phone: '1234567890',
          studentId: 'STD123456'
        }
      };

      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        cpf: '12345678901',
        role: 'student',
        isEmailVerified: false,
        isDeleted: false,
        termsAccepted: false,
        documentId: 'STD123456',
        phone: '1234567890',
        createdAt: new Date(),
        updatedAt: new Date(),
        token: 'mocked-token',
        refreshToken: 'mocked-refresh-token'
      };

      // Mock UserService methods before importing
      const mockUserService = {
        validateCreateUser: jest.fn(),
        create: jest.fn().mockResolvedValue(mockUser)
      };

      jest.doMock('../../src/services/UserService', () => mockUserService);

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.email).toBe(userData.email);
    });

    it('should return 400 for missing required fields', async () => {
      const invalidUserData = {
        name: 'John Doe',
        email: 'john@example.com'
        // Missing password and cpf
      };

      // Mock UserService.validateCreateUser to throw error
      jest.doMock('../../src/services/UserService', () => ({
        validateCreateUser: jest.fn().mockImplementation(() => {
          throw new Error('Missing required field: password');
        }),
        create: jest.fn()
      }));

      const response = await request(app)
        .post('/users')
        .send(invalidUserData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Missing required field');
    });

    it('should return 400 for duplicate email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'existing@example.com',
        password: 'password123',
        cpf: '12345678901',
        role: 'student',
        studentProfile: {
          phone: '1234567890',
          studentId: 'STD123456'
        }
      };

      // Mock UserService.create to throw error
      jest.doMock('../../src/services/UserService', () => ({
        validateCreateUser: jest.fn(),
        create: jest.fn().mockRejectedValue(new Error('Email already registered'))
      }));

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Email already registered');
    });

    it('should return 400 for duplicate student ID', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        cpf: '12345678901',
        role: 'student',
        studentProfile: {
          phone: '1234567890',
          studentId: 'STD123456'
        }
      };

      // Mock UserService.create to throw error
      jest.doMock('../../src/services/UserService', () => ({
        validateCreateUser: jest.fn(),
        create: jest.fn().mockRejectedValue(new Error('Document ID (matrícula) already registered'))
      }));

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Document ID (matrícula) already registered');
    });

    it('should return 400 for missing student profile when role is student', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        cpf: '12345678901',
        role: 'student'
        // Missing studentProfile
      };

      // Mock UserService.validateCreateUser to throw error
      jest.doMock('../../src/services/UserService', () => ({
        validateCreateUser: jest.fn().mockImplementation(() => {
          throw new Error('Student profile is required for student role');
        }),
        create: jest.fn()
      }));

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Student profile is required');
    });
  });
});
