import { User } from '../../src/entities/User';
import { StudentProfile } from '../../src/entities/StudentProfile';
import { Course } from '../../src/entities/Course';
import { CreateUserDTO } from '../../src/dto/User';
import { CreateCourseDto } from '../../src/dto/Course';

/**
 * Test data factories for creating mock objects
 */
export class TestDataFactory {
  /**
   * Creates a mock user object
   */
  static createMockUser(overrides: Partial<User> = {}): User {
    return {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashed-password',
      cpf: '12345678901',
      avatar: null,
      role: 'student',
      isEmailVerified: false,
      isDeleted: false,
      termsAccepted: false,
      refreshToken: 'mock-refresh-token',
      createdAt: new Date(),
      updatedAt: new Date(),
      studentProfile: null,
      ...overrides
    } as User;
  }

  /**
   * Creates a mock student profile object
   */
  static createMockStudentProfile(overrides: Partial<StudentProfile> = {}): StudentProfile {
    return {
      id: 1,
      phone: '1234567890',
      studentId: 'STD123456',
      user: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    } as StudentProfile;
  }

  /**
   * Creates a mock course object
   */
  static createMockCourse(overrides: Partial<Course> = {}): Course {
    return {
      id: 1,
      name: 'Computer Science',
      code: 'CS101',
      description: 'Introduction to Computer Science',
      credits: 4,
      shift: 'morning',
      semester: '2024.1',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    } as Course;
  }

  /**
   * Creates a mock CreateUserDTO object
   */
  static createMockCreateUserDTO(overrides: Partial<CreateUserDTO> = {}): CreateUserDTO {
    return {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      cpf: '12345678901',
      role: 'student',
      studentProfile: {
        phone: '1234567890',
        studentId: 'STD123456'
      },
      ...overrides
    };
  }

  /**
   * Creates a mock CreateCourseDto object
   */
  static createMockCreateCourseDto(overrides: Partial<CreateCourseDto> = {}): CreateCourseDto {
    return {
      name: 'Computer Science',
      code: 'CS101',
      description: 'Introduction to Computer Science',
      credits: 4,
      shift: 'morning',
      semester: '2024.1',
      ...overrides
    };
  }
}

/**
 * Mock repository factory for creating mock repositories
 */
export class MockRepositoryFactory {
  /**
   * Creates a mock repository with common methods
   */
  static createMockRepository() {
    return {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      findBy: jest.fn(),
      createQueryBuilder: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      exists: jest.fn()
    };
  }

  /**
   * Creates a mock query builder
   */
  static createMockQueryBuilder() {
    return {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
      getRawOne: jest.fn(),
      getRawMany: jest.fn(),
      getCount: jest.fn(),
      execute: jest.fn()
    };
  }
}

/**
 * Test assertions helpers
 */
export class TestAssertions {
  /**
   * Asserts that a response has the expected structure
   */
  static assertUserResponse(response: any, expectedUser: Partial<User>) {
    expect(response).toHaveProperty('id');
    expect(response).toHaveProperty('name');
    expect(response).toHaveProperty('email');
    expect(response).toHaveProperty('role');
    expect(response).toHaveProperty('isEmailVerified');
    expect(response).toHaveProperty('isDeleted');
    expect(response).toHaveProperty('termsAccepted');
    expect(response).toHaveProperty('createdAt');
    expect(response).toHaveProperty('updatedAt');

    if (expectedUser.name) expect(response.name).toBe(expectedUser.name);
    if (expectedUser.email) expect(response.email).toBe(expectedUser.email);
    if (expectedUser.role) expect(response.role).toBe(expectedUser.role);
  }

  /**
   * Asserts that a response has the expected course structure
   */
  static assertCourseResponse(response: any, expectedCourse: Partial<Course>) {
    expect(response).toHaveProperty('id');
    expect(response).toHaveProperty('name');
    expect(response).toHaveProperty('code');
    expect(response).toHaveProperty('description');
    expect(response).toHaveProperty('credits');
    expect(response).toHaveProperty('shift');
    expect(response).toHaveProperty('semester');
    expect(response).toHaveProperty('createdAt');
    expect(response).toHaveProperty('updatedAt');

    if (expectedCourse.name) expect(response.name).toBe(expectedCourse.name);
    if (expectedCourse.code) expect(response.code).toBe(expectedCourse.code);
    if (expectedCourse.credits) expect(response.credits).toBe(expectedCourse.credits);
  }

  /**
   * Asserts that an error response has the expected structure
   */
  static assertErrorResponse(response: any, expectedMessage?: string) {
    expect(response).toHaveProperty('message');
    if (expectedMessage) {
      expect(response.message).toContain(expectedMessage);
    }
  }
}

/**
 * Test database helpers
 */
export class TestDatabaseHelpers {
  /**
   * Mocks a successful database transaction
   */
  static mockSuccessfulTransaction(mockData: any) {
    return jest.fn().mockImplementation(async (callback) => {
      return await callback({
        getRepository: jest.fn().mockReturnValue({
          create: jest.fn().mockReturnValue(mockData),
          save: jest.fn().mockResolvedValue(mockData),
          findOne: jest.fn().mockResolvedValue(mockData),
          createQueryBuilder: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(null)
          })
        })
      });
    });
  }

  /**
   * Mocks a failed database transaction
   */
  static mockFailedTransaction(error: Error) {
    return jest.fn().mockRejectedValue(error);
  }
}
