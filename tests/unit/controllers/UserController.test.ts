import UserController from '../../../src/controllers/UserController';
import UserService from '../../../src/services/UserService';

// Mock UserService
jest.mock('../../../src/services/UserService');

const mockUserService = UserService as jest.Mocked<typeof UserService>;

describe('UserController', () => {
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      body: {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        cpf: '12345678901',
        role: 'student' as const,
        studentProfile: {
          phone: '1234567890',
          studentId: 'STD123456'
        }
      }
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        cpf: '12345678901',
        role: 'student' as const,
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

      mockUserService.validateCreateUser.mockImplementation(() => {});
      mockUserService.create.mockResolvedValue(mockUser);

      await UserController.createUser(mockRequest, mockResponse);

      expect(mockUserService.validateCreateUser).toHaveBeenCalledWith(mockRequest);
      expect(mockUserService.create).toHaveBeenCalledWith(mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
    });

    it('should return 400 error for validation failure', async () => {
      const validationError = new Error('Missing required field: email');
      
      mockUserService.validateCreateUser.mockImplementation(() => {
        throw validationError;
      });

      await UserController.createUser(mockRequest, mockResponse);

      expect(mockUserService.validateCreateUser).toHaveBeenCalledWith(mockRequest);
      expect(mockUserService.create).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Missing required field: email' });
    });

    it('should return 400 error for service failure', async () => {
      const serviceError = new Error('Email already registered');
      
      mockUserService.validateCreateUser.mockImplementation(() => {});
      mockUserService.create.mockRejectedValue(serviceError);

      await UserController.createUser(mockRequest, mockResponse);

      expect(mockUserService.validateCreateUser).toHaveBeenCalledWith(mockRequest);
      expect(mockUserService.create).toHaveBeenCalledWith(mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Email already registered' });
    });

    it('should handle unexpected errors', async () => {
      const unexpectedError = new Error('Unexpected error');
      
      mockUserService.validateCreateUser.mockImplementation(() => {
        throw unexpectedError;
      });

      await UserController.createUser(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unexpected error' });
    });
  });
});
