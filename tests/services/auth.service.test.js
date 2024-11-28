const { register, verifyEmail, login, verifyOtp, resendOtp } = require('../../src/services/auth.service');
const { User, Role, sequelize } = require('../../src/models');
const bcrypt = require('bcryptjs');
const notificationHelper = require('../../src/helpers/notifications.helper');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const otpHelper = require('../../src/helpers/otps.helper');
const jwtHelper = require('../../src/helpers/jwt.helper');
const awsHelper = require('../../src/helpers/aws.helper');
const { ROLES } = require('../../src/constants/constants');
const redisClient = require('../../src/config/redis');

jest.mock('../../src/models');
jest.mock('../../src/helpers/notifications.helper');
jest.mock('../../src/helpers/commonFunctions.helper');
jest.mock('../../src/helpers/otps.helper');
jest.mock('../../src/helpers/jwt.helper');
jest.mock('../../src/helpers/aws.helper');
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));
jest.mock('redis', () => {
  const mRedisClient = {
    connect: jest.fn().mockResolvedValue(),
    on: jest.fn(),
    quit: jest.fn().mockResolvedValue(),
  };
  return {
    createClient: jest.fn(() => mRedisClient),
  };
});

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const payload = {
        data: {
          name: 'John Doe',
          email: 'johndoe@example.com',
          password: 'password123',
          contact: '1234567890',
          govIssueIdType: 'Aadhar',
          fatherName: 'Father Name',
          motherName: 'Mother Name',
          address: '123 Main St',
        },
        file: { buffer: 'fileBuffer' },
      };

      const mockRole = { code: '103' };
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'johndoe@example.com',
        password: 'hashedPassword',
        contact: '1234567890',
        gov_issue_id_image: 'govIssueImageUrl',
        gov_issue_id_type: 'Aadhar',
        father_name: 'Father Name',
        mother_name: 'Mother Name',
        address: '123 Main St',
        addRole: jest.fn(),
      };

      bcrypt.hash.mockResolvedValue('hashedPassword');
      awsHelper.uploadImageToS3.mockResolvedValue('govIssueImageUrl');
      User.findOne.mockResolvedValueOnce(null);
      User.create.mockResolvedValueOnce(mockUser);
      Role.findOne.mockResolvedValue(mockRole);
      notificationHelper.sendOtp.mockResolvedValue();

      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      sequelize.transaction.mockResolvedValue(mockTransaction);

      const result = await register(payload);

      expect(result).toHaveProperty('email', 'johndoe@example.com');
      expect(result).toHaveProperty('name', 'John Doe');
      expect(notificationHelper.sendOtp).toHaveBeenCalledWith('johndoe@example.com');
      expect(mockTransaction.commit).toHaveBeenCalled(); // Ensure commit is called
      expect(mockTransaction.rollback).not.toHaveBeenCalled(); // Ensure rollback is not called
    });

    it('should return error if user with email or contact already exists', async () => {
      const payload = {
        data: {
          name: 'John Doe',
          email: 'johndoe@example.com',
          password: 'password123',
          contact: '1234567890',
          govIssueIdType: 'Aadhar',
          fatherName: 'Father Name',
          motherName: 'Mother Name',
          address: '123 Main St',
        },
        file: { buffer: 'fileBuffer' }, // Mocking file buffer
      };

      const mockExistingUser = { email: 'johndoe@example.com' };
      User.findOne.mockResolvedValue(mockExistingUser);

      const result = await register(payload);

      expect(result).toEqual(commonHelper.customError('User with email already exists', 409));
    });

    it('should return error if gov issue image is missing', async () => {
      const payload = {
        data: {
          name: 'John Doe',
          email: 'johndoe@example.com',
          password: 'password123',
          contact: '1234567890',
          govIssueIdType: 'Aadhar',
          fatherName: 'Father Name',
          motherName: 'Mother Name',
          address: '123 Main St',
        },
        file: null,
      };

      const result = await register(payload);

      expect(result).toEqual(commonHelper.customError('Please add gov_issue_id_image', 400));
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully if OTP is correct', async () => {
      const payload = { data: { email: 'johndoe@example.com', otp: '123456' } };
      const mockUser = { id: 1, email: 'johndoe@example.com', is_verified: false, update: jest.fn() };

      otpHelper.verifyOtp.mockResolvedValue(true);
      User.findOne.mockResolvedValue(mockUser);

      await verifyEmail(payload);

      expect(mockUser.update).toHaveBeenCalledWith({ is_verified: true });
      expect(otpHelper.deleteOtp).toHaveBeenCalledWith('johndoe@example.com');
    });

    it('should return error if OTP is invalid', async () => {
      const payload = { data: { email: 'johndoe@example.com', otp: 'invalidOtp' } };

      otpHelper.verifyOtp.mockResolvedValue(false);

      const result = await verifyEmail(payload);

      expect(result).toEqual(commonHelper.customError('Invalid OTP', 400));
    });
  });

  describe('login', () => {
    it('should send OTP for login if email is verified', async () => {
      const payload = { data: { email: 'johndoe@example.com' } };
      const mockUser = { id: 1, email: 'johndoe@example.com', is_verified: true };

      User.findOne.mockResolvedValue(mockUser);
      notificationHelper.sendOtp.mockResolvedValue();

      const result = await login(payload);

      expect(result).toHaveProperty('email', 'johndoe@example.com');
      expect(notificationHelper.sendOtp).toHaveBeenCalledWith('johndoe@example.com');
    });

    it('should return error if user is not verified', async () => {
      const payload = { data: { email: 'johndoe@example.com' } };
      const mockUser = { id: 1, email: 'johndoe@example.com', is_verified: false };

      User.findOne.mockResolvedValueOnce(undefined);

      const result = await login(payload);

      expect(result).toEqual(
        commonHelper.customError('User with email johndoe@example.com does not exist', 404)
      );
    });
  });

  describe('verifyOtp', () => {
    it('should generate JWT token on successful OTP verification', async () => {
      const payload = { data: { email: 'johndoe@example.com', otp: '123456' } };
      const mockUser = {
        id: 1,
        email: 'johndoe@example.com',
        Roles: [{ code: '103' }],
      };

      otpHelper.verifyOtp.mockResolvedValue(true);
      User.findOne.mockResolvedValue(mockUser);
      otpHelper.deleteOtp.mockResolvedValue();
      jwtHelper.generateToken.mockResolvedValue('jwtToken');

      const result = await verifyOtp(payload);

      expect(result).toBe('jwtToken');
      expect(otpHelper.deleteOtp).toHaveBeenCalledWith('johndoe@example.com');
    });

    it('should return error if user is not found', async () => {
      const payload = { data: { email: 'johndoe@example.com', otp: '123456' } };

      otpHelper.verifyOtp.mockResolvedValueOnce(true); // Simulating valid OTP
      User.findOne.mockResolvedValueOnce(null); // Simulating user not found

      // Expect verifyOtp to throw an error with the expected message
      await expect(verifyOtp(payload)).rejects.toEqual(commonHelper.customError('User not found', 404));
    });
  });

  describe('resendOtp', () => {
    it('should resend OTP successfully', async () => {
      const payload = { data: { email: 'johndoe@example.com' } };
      const mockUser = { id: 1, email: 'johndoe@example.com' };

      User.findOne.mockResolvedValue(mockUser);
      notificationHelper.sendOtp.mockResolvedValue();

      await resendOtp(payload);

      expect(notificationHelper.sendOtp).toHaveBeenCalledWith('johndoe@example.com');
    });

    it('should return error if user not found', async () => {
      const payload = { data: { email: 'johndoe@example.com' } };

      User.findOne.mockResolvedValueOnce(null);

      const result = await resendOtp(payload);

      expect(result).toEqual(commonHelper.customError('User not found', 404));
    });
  });

  describe('register', () => {
    it('should return error if gov issue image is missing', async () => {
      const payload = {
        data: {
          name: 'John Doe',
          email: 'johndoe@example.com',
          password: 'password123',
          contact: '1234567890',
          govIssueIdType: 'Aadhar',
          fatherName: 'Father Name',
          motherName: 'Mother Name',
          address: '123 Main St',
        },
        file: null, // Mocking file buffer
      };

      const result = await register(payload);

      expect(result).toEqual(commonHelper.customError('Please add gov_issue_id_image', 400));
    });

    it('should rollback the transaction and throw an error if an exception occurs during registration', async () => {
      const payload = {
        data: {
          name: 'John Doe',
          email: 'johndoe@example.com',
          password: 'password123',
          contact: '1234567890',
          govIssueIdType: 'Aadhar',
          fatherName: 'Father Name',
          motherName: 'Mother Name',
          address: '123 Main St',
        },
        file: { buffer: 'fileBuffer' },
      };

      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      sequelize.transaction.mockResolvedValue(mockTransaction);

      awsHelper.uploadImageToS3.mockRejectedValueOnce(new Error('S3 Upload Error'));

      const result = await register(payload);

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(result).toEqual(new Error('S3 Upload Error'));
    });
  });

  describe('verifyEmail', () => {
    it('should return error if OTP is invalid', async () => {
      const payload = { data: { email: 'johndoe@example.com', otp: 'invalidOtp' } };

      otpHelper.verifyOtp.mockResolvedValueOnce(false);

      const mockUser = { id: 1, email: 'johndoe@example.com', is_verified: false, update: jest.fn() };
      User.findOne.mockResolvedValue(mockUser);

      const result = await verifyEmail(payload);

      expect(result).toEqual(commonHelper.customError('Invalid OTP', 400));
      expect(mockUser.update).not.toHaveBeenCalled();
    });
  });

  describe('resendOtp', () => {
    it('should return error if user is not found', async () => {
      const payload = { data: { email: 'johndoe@example.com' } };

      User.findOne.mockResolvedValueOnce(null); // Simulating user not found

      const result = await resendOtp(payload);

      expect(result).toEqual(commonHelper.customError('User not found', 404));
    });
  });
});
