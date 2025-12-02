import { AppDataSource } from '../../../src/config/data-source';
import { User } from '../../../src/entities/User';
import bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';

// Mock dependencies BEFORE importing AuthService
jest.mock('../../../src/config/data-source');
jest.mock('bcryptjs');
jest.mock('nodemailer');
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload, secret, options) => `mock-token-${payload.email}`)
}));

// Create mock repository before importing AuthService
const mockUserRepository = {
  findOne: jest.fn(),
  save: jest.fn()
};

// Mock AppDataSource.getRepository before importing AuthService
// This must be done before AuthService is imported because userRepository is a static property
// We need to set up the mock implementation before the class loads
jest.spyOn(AppDataSource, 'getRepository').mockImplementation((entity: any) => {
  if (entity === User) return mockUserRepository as any;
  return {} as any;
});

// Now import AuthService after mocks are set up
import AuthService from '../../../src/services/AuthService';

describe('AuthService - Password Reset', () => {
  let mockTransporter: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock transporter
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue(undefined)
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    // Ensure repository mock is set up (already configured before import, but reset here)
    jest.spyOn(AppDataSource, 'getRepository').mockImplementation((entity: any) => {
      if (entity === User) return mockUserRepository as any;
      return {} as any;
    });

    // Set environment variables
    process.env.JWT_SECRET = 'test-secret';
    process.env.RESET_TOKEN_SECRET = 'reset-secret';
    process.env.FRONTEND_URL = 'http://localhost:3001';
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_USER = 'test@test.com';
    process.env.SMTP_PASS = 'test-password';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('validatePasswordReset', () => {
    it('should throw error when email is missing', () => {
      const req = { body: {} } as any;

      expect(() => {
        AuthService.validatePasswordReset(req);
      }).toThrow('Email is required');
    });

    it('should not throw when email is provided', () => {
      const req = { body: { email: 'test@example.com' } } as any;

      expect(() => {
        AuthService.validatePasswordReset(req);
      }).not.toThrow();
    });
  });

  describe('requestPasswordReset', () => {
    const mockUser: Partial<User> = {
      id: 1,
      email: 'test@example.com',
      password: 'hashed-password',
      refreshToken: null
    };

    it('should throw error when user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        AuthService.requestPasswordReset('nonexistent@example.com')
      ).rejects.toThrow('Se um usuário com este email existir');
    });

    it('should generate reset token and save to user', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      await AuthService.requestPasswordReset('test@example.com');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should send email when SMTP is configured', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      await AuthService.requestPasswordReset('test@example.com');

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const emailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(emailCall.to).toBe('test@example.com');
      expect(emailCall.subject).toContain('Redefinição de Senha');
    });

    it('should not fail when SMTP is not configured', async () => {
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      // Should not throw even without SMTP
      await expect(
        AuthService.requestPasswordReset('test@example.com')
      ).resolves.not.toThrow();
    });

    it('should handle SMTP errors gracefully', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));

      // Should not throw even if email fails
      await expect(
        AuthService.requestPasswordReset('test@example.com')
      ).resolves.not.toThrow();
    });
  });

  describe('resetPassword', () => {
    const mockUser: Partial<User> = {
      id: 1,
      email: 'test@example.com',
      password: 'old-hashed-password',
      refreshToken: 'valid-reset-token'
    };

    it('should throw error when token is invalid', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        AuthService.resetPassword('invalid-token', 'newpassword123')
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('should hash new password and save user', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');

      await AuthService.resetPassword('valid-reset-token', 'newpassword123');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { refreshToken: 'valid-reset-token' }
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should clear refreshToken after reset', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');

      await AuthService.resetPassword('valid-reset-token', 'newpassword123');

      const savedUser = mockUserRepository.save.mock.calls[0][0];
      expect(savedUser.refreshToken).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    const mockUser: Partial<User> = {
      id: 1,
      email: 'test@example.com'
    };

    it('should return user when found', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await AuthService.getUserByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
    });

    it('should return null when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await AuthService.getUserByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should throw error when email is empty', async () => {
      await expect(
        AuthService.getUserByEmail('')
      ).rejects.toThrow('Email is required');
    });
  });
});

