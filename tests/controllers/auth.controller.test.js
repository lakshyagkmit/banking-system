const authController = require('../../src/controllers/auth.controller');
const authService = require('../../src/services/auth.service');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const { faker } = require('@faker-js/faker');
const redisClient = require('../../src/config/redis');
const constants = require('../../src/constants/constants');

jest.mock('../../src/services/auth.service');
jest.mock('../../src/helpers/commonFunctions.helper');
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

describe('Auth Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  describe('register', () => {
    it('should successfully register a user and return 201', async () => {
      const req = {
        body: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: faker.internet.password(),
          contact: faker.phone.number('##########'),
          govIssueIdType: faker.helpers.arrayElement([...Object.values(constants.GOV_ISSUE_ID_TYPES)]),
          fatherName: faker.person.fullName(),
          motherName: faker.person.fullName(),
          address: faker.location.streetAddress(),
        },
        file: null, // Assuming file is optional
      };
      const res = { message: null, statusCode: null };
      const next = jest.fn();

      authService.register.mockResolvedValue();

      await authController.register(req, res, next);

      expect(res.message).toBe('User registered successfully');
      expect(res.statusCode).toBe(201);
      expect(authService.register).toHaveBeenCalledWith({
        data: req.body,
        file: req.file,
      });
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { body: {}, file: null };
      const res = {};
      const next = jest.fn();

      const err = new Error('Error registering user');
      err.statusCode = 400;

      authService.register.mockRejectedValue(err);

      await authController.register(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(
        req,
        res,
        'Error registering user',
        400,
        err
      );
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify email and return 200', async () => {
      const req = { body: { email: faker.internet.email(), otp: faker.string.numeric(6) } };
      const res = { message: null, statusCode: null };
      const next = jest.fn();

      authService.verifyEmail.mockResolvedValue();

      await authController.verifyEmail(req, res, next);

      expect(res.message).toBe('Email Verified Successfully');
      expect(res.statusCode).toBe(200);
      expect(authService.verifyEmail).toHaveBeenCalledWith({
        data: req.body,
      });
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { body: { email: 'invalidEmail', otp: '123456' } };
      const res = {};
      const next = jest.fn();

      const err = new Error('Invalid OTP');
      err.statusCode = 400;

      authService.verifyEmail.mockRejectedValue(err);

      await authController.verifyEmail(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(req, res, 'Invalid OTP', 400, err);
    });
  });

  describe('login', () => {
    it('should send OTP on email and return 200', async () => {
      const req = { body: { email: faker.internet.email() } };
      const res = { message: null, statusCode: null };
      const next = jest.fn();

      authService.login.mockResolvedValue();

      await authController.login(req, res, next);

      expect(res.message).toBe('OTP sent on email');
      expect(res.statusCode).toBe(200);
      expect(authService.login).toHaveBeenCalledWith({
        data: req.body,
      });
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { body: { email: 'invalidEmail' } };
      const res = {};
      const next = jest.fn();

      const err = new Error('email not found');
      err.statusCode = 400;

      authService.login.mockRejectedValue(err);

      await authController.login(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(req, res, 'email not found', 400, err);
    });
  });

  describe('verifyOtp', () => {
    it('should successfully verify OTP and return token', async () => {
      const req = { body: { email: faker.internet.email(), otp: faker.string.numeric(6) } };
      const res = { token: null, message: null, statusCode: null };
      const next = jest.fn();

      const mockToken = faker.string.uuid();
      authService.verifyOtp.mockResolvedValue(mockToken);

      await authController.verifyOtp(req, res, next);

      expect(res.token).toBe(mockToken);
      expect(res.message).toBe('OTP sent on email');
      expect(res.statusCode).toBe(200);
      expect(authService.verifyOtp).toHaveBeenCalledWith({
        data: req.body,
      });
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { body: { email: 'invalidEmail', otp: '123456' } };
      const res = {};
      const next = jest.fn();

      const err = new Error('Invalid OTP');
      err.statusCode = 400;

      authService.verifyOtp.mockRejectedValue(err);

      await authController.verifyOtp(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(req, res, 'Invalid OTP', 400, err);
    });
  });

  describe('resendOtp', () => {
    it('should successfully resend OTP and return 200', async () => {
      const req = { body: { email: faker.internet.email() } };
      const res = { message: null, statusCode: null };
      const next = jest.fn();

      authService.resendOtp.mockResolvedValue();

      await authController.resendOtp(req, res, next);

      expect(res.message).toBe('OTP resent to email');
      expect(res.statusCode).toBe(200);
      expect(authService.resendOtp).toHaveBeenCalledWith({
        data: req.body,
      });
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { body: { email: 'invalidEmail' } };
      const res = {};
      const next = jest.fn();

      const err = new Error('Failed to resend OTP');
      err.statusCode = 400;

      authService.resendOtp.mockRejectedValue(err);

      await authController.resendOtp(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(
        req,
        res,
        'Failed to resend OTP',
        400,
        err
      );
    });
  });

  describe('logout', () => {
    it('should log the user out successfully and return 204', async () => {
      const req = {};
      const res = { message: null, statusCode: null };
      const next = jest.fn();

      await authController.logout(req, res, next);

      expect(res.message).toBe('User logged out successfully');
      expect(res.statusCode).toBe(204);
      expect(next).toHaveBeenCalled();
    });
  });
});
