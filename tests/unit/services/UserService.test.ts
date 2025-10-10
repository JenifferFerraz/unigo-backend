import UserService from '../../../src/services/UserService';
import { AppDataSource } from '../../../src/config/data-source';
import { User } from '../../../src/entities/User';
import { StudentProfile } from '../../../src/entities/StudentProfile';
import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';

// Mock dependencies
jest.mock('../../../src/config/data-source');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const mockUserRepository = {
  createQueryBuilder: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
};

const mockStudentProfileRepository = {
  createQueryBuilder: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockTransaction = jest.fn();

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock AppDataSource
    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === User) return mockUserRepository;
      if (entity === StudentProfile) return mockStudentProfileRepository;
      return {};
    });
    
    (AppDataSource.transaction as jest.Mock).mockImplementation(mockTransaction);
    
    // Mock bcrypt
    (bcrypt.genSalt as jest.Mock).mockResolvedValue('mocked-salt');
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    
    // Mock JWT
    (sign as jest.Mock).mockReturnValue('mocked-token');
  });

  describe('validateCreateUser', () => {
    it('should validate required fields for user creation', () => {
      const mockReq = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          cpf: '12345678901',
          role: 'student',
          studentProfile: {
            phone: '1234567890',
            studentId: 'STD123456'
          }
        }
      };

      expect(() => UserService.validateCreateUser(mockReq as any)).not.toThrow();
    });

    it('should throw error for missing required fields', () => {
      const mockReq = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          // missing password and cpf
        }
      };

      expect(() => UserService.validateCreateUser(mockReq as any)).toThrow('Missing required field: password');
    });

    it('should throw error for missing student profile when role is student', () => {
      const mockReq = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          cpf: '12345678901',
          role: 'student'
          // missing studentProfile
        }
      };

      expect(() => UserService.validateCreateUser(mockReq as any)).toThrow('Student profile is required for student role');
    });

    it('should throw error for missing student profile fields', () => {
      const mockReq = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          cpf: '12345678901',
          role: 'student',
          studentProfile: {
            phone: '1234567890'
            // missing studentId
          }
        }
      };

      expect(() => UserService.validateCreateUser(mockReq as any)).toThrow('Missing required field in studentProfile: studentId');
    });
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        cpf: '12345678901',
        role: 'student' as const,
        termsAccepted: false,
        studentProfile: {
          phone: '1234567890',
          studentId: 'STD123456'
        }
      };

      const mockUser = {
        id: 1,
        ...userData,
        password: 'hashed-password',
        refreshToken: 'mocked-token',
        isDeleted: false,
        isEmailVerified: false,
        termsAccepted: false
      };

      const mockStudentProfile = {
        id: 1,
        ...userData.studentProfile,
        user: mockUser
      };

      // Mock transaction
      mockTransaction.mockImplementation(async (callback) => {
        return await callback({
          getRepository: (entity) => {
            if (entity === User) return mockUserRepository;
            if (entity === StudentProfile) return mockStudentProfileRepository;
            return {};
          }
        });
      });

      // Mock repository methods
      mockUserRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null) // No existing user
      });

      mockStudentProfileRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null) // No existing student profile
      });

      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockStudentProfileRepository.create.mockReturnValue(mockStudentProfile);
      mockStudentProfileRepository.save.mockResolvedValue(mockStudentProfile);
      mockUserRepository.findOne.mockResolvedValue({
        ...mockUser,
        studentProfile: mockStudentProfile
      });

      const result = await UserService.create(userData);

      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('name', 'John Doe');
      expect(result).toHaveProperty('email', 'john@example.com');
      expect(result).toHaveProperty('token', 'mocked-token');
      expect(result).toHaveProperty('refreshToken', 'mocked-token');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'mocked-salt');
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        cpf: '12345678901',
        role: 'student' as const,
        termsAccepted: false,
        studentProfile: {
          phone: '1234567890',
          studentId: 'STD123456'
        }
      };

      // Mock transaction
      mockTransaction.mockImplementation(async (callback) => {
        return await callback({
          getRepository: (entity) => {
            if (entity === User) return mockUserRepository;
            if (entity === StudentProfile) return mockStudentProfileRepository;
            return {};
          }
        });
      });

      // Mock existing user
      mockUserRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 1, email: 'john@example.com' })
      });

      await expect(UserService.create(userData)).rejects.toThrow('Email already registered');
    });

    it('should throw error if student ID already exists', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        cpf: '12345678901',
        role: 'student' as const,
        termsAccepted: false,
        studentProfile: {
          phone: '1234567890',
          studentId: 'STD123456'
        }
      };

      // Mock transaction
      mockTransaction.mockImplementation(async (callback) => {
        return await callback({
          getRepository: (entity) => {
            if (entity === User) return mockUserRepository;
            if (entity === StudentProfile) return mockStudentProfileRepository;
            return {};
          }
        });
      });

      // Mock no existing user but existing student profile
      mockUserRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null)
      });

      mockStudentProfileRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 1, studentId: 'STD123456' })
      });

      await expect(UserService.create(userData)).rejects.toThrow('Document ID (matrícula) already registered');
    });
  });
});
