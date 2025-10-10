import request from 'supertest';
import { AppDataSource } from '../../src/config/data-source';
import app from '../../src/app.test';

// Mock database connection
jest.mock('../../src/config/data-source');

const mockAppDataSource = AppDataSource as jest.Mocked<typeof AppDataSource>;

describe('Auth Integration Tests', () => {
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

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Mock successful login response
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'student',
        termsAccepted: true,
        token: 'mocked-jwt-token',
        refreshToken: 'mocked-refresh-token'
      };

      // Mock AuthService.login
      jest.doMock('../../src/services/AuthService', () => ({
        validateLogin: jest.fn(),
        login: jest.fn().mockResolvedValue(mockUser)
      }));

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.email).toBe(loginData.email);
    });

    it('should return 401 for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Mock AuthService.login to throw error
      jest.doMock('../../src/services/AuthService', () => ({
        validateLogin: jest.fn(),
        login: jest.fn().mockRejectedValue(new Error('Invalid credentials'))
      }));

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 202 when user needs to accept terms', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'student',
        termsAccepted: false,
        token: 'mocked-jwt-token',
        refreshToken: 'mocked-refresh-token'
      };

      // Mock AuthService.login
      jest.doMock('../../src/services/AuthService', () => ({
        validateLogin: jest.fn(),
        login: jest.fn().mockResolvedValue(mockUser)
      }));

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(202);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('terms and conditions');
    });
  });

  describe('POST /auth/me', () => {
    it('should return user profile successfully', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'student',
        isEmailVerified: true,
        termsAccepted: true
      };

      // Mock AuthService.getProfile
      jest.doMock('../../src/services/AuthService', () => ({
        getProfile: jest.fn().mockResolvedValue(mockUser)
      }));

      const response = await request(app)
        .post('/auth/me')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body).toEqual(mockUser);
    });

    it('should return 401 for invalid user', async () => {
      // Mock AuthService.getProfile to throw error
      jest.doMock('../../src/services/AuthService', () => ({
        getProfile: jest.fn().mockRejectedValue(new Error('User not found'))
      }));

      const response = await request(app)
        .post('/auth/me')
        .send({ email: 'nonexistent@example.com' })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /auth/request-password-reset', () => {
    it('should request password reset successfully', async () => {
      // Mock AuthService.requestPasswordReset
      jest.doMock('../../src/services/AuthService', () => ({
        validatePasswordReset: jest.fn(),
        requestPasswordReset: jest.fn().mockResolvedValue(undefined)
      }));

      const response = await request(app)
        .post('/auth/request-password-reset')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('password reset instructions');
    });

    it('should return 400 for invalid email', async () => {
      // Mock AuthService.requestPasswordReset to throw error
      jest.doMock('../../src/services/AuthService', () => ({
        validatePasswordReset: jest.fn().mockImplementation(() => {
          throw new Error('Invalid email format');
        }),
        requestPasswordReset: jest.fn()
      }));

      const response = await request(app)
        .post('/auth/request-password-reset')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should reset password successfully', async () => {
      const resetData = {
        token: 'valid-reset-token',
        newPassword: 'newpassword123'
      };

      // Mock AuthService.resetPassword
      jest.doMock('../../src/services/AuthService', () => ({
        resetPassword: jest.fn().mockResolvedValue(undefined)
      }));

      const response = await request(app)
        .post('/auth/reset-password')
        .send(resetData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('successfully reset');
    });

    it('should return 400 for missing token or password', async () => {
      const response = await request(app)
        .post('/auth/reset-password')
        .send({ token: 'valid-token' }) // Missing newPassword
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /auth/accept-terms', () => {
    it('should accept terms successfully', async () => {
      // Mock AuthService.acceptTerms
      jest.doMock('../../src/services/AuthService', () => ({
        acceptTerms: jest.fn().mockResolvedValue(undefined)
      }));

      const response = await request(app)
        .post('/auth/accept-terms')
        .send({ userId: 1 })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Terms accepted successfully');
    });

    it('should return 400 for invalid user ID', async () => {
      // Mock AuthService.acceptTerms to throw error
      jest.doMock('../../src/services/AuthService', () => ({
        acceptTerms: jest.fn().mockRejectedValue(new Error('User not found'))
      }));

      const response = await request(app)
        .post('/auth/accept-terms')
        .send({ userId: 999 })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });
});
