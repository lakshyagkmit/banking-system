const { register, verifyEmail, login, verifyOtp, resendOtp } = require('../../src/services/auth.service');
const { User, Role, UserRole, sequelize } = require('../../src/models');
const { Op } = require('sequelize');
const notificationHelper = require('../../src/helpers/notifications.helper');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const otpHelper = require('../../src/helpers/otps.helper');
const jwtHelper = require('../../src/helpers/jwt.helper');
const awsHelper = require('../../src/helpers/aws.helper');
const { faker } = require('@faker-js/faker');
const redisClient = require('../../src/config/redis');

jest.mock('../../src/models');
jest.mock('../../src/helpers/notifications.helper');
jest.mock('../../src/helpers/commonFunctions.helper');
jest.mock('../../src/helpers/otps.helper');
jest.mock('../../src/helpers/jwt.helper');
jest.mock('../../src/helpers/aws.helper');
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

describe('User Service Tests', () => {
  let fakeUser, fakeRole, fakeFile, fakeOtp;

  beforeEach(() => {
    fakeUser = {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      contact: faker.phone.number('##########'),
      gov_issue_id_type: 'Aadhaar',
      gov_issue_id_image: 'qwertyjhgfdzxcvb.jpg',
      father_name: faker.person.fullName(),
      mother_name: faker.person.fullName(),
      address: faker.location.streetAddress(),
      is_verified: true,
      update: jest.fn(),
    };

    commonHelper.customError.mockImplementation((message, status) => {
      const err = new Error(message);
      err.statusCode = status;
      throw err;
    });

    fakeRole = {
      id: faker.string.uuid(),
      name: 'Customer',
    };

    fakeFile = {
      originalname: 'gov-id.jpg',
      buffer: Buffer.from('file content'),
    };

    fakeOtp = '123456';

    // Mock Sequelize transaction
    sequelize.transaction = jest.fn().mockImplementation(() => ({
      commit: jest.fn(),
      rollback: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  // Test Cases for Register
  describe('register', () => {
    it('should successfully register a new user', async () => {
      User.findOne.mockResolvedValueOnce(null);
      awsHelper.uploadImageToS3.mockResolvedValue(fakeUser.gov_issue_id_image);
      User.create.mockResolvedValue(fakeUser);
      Role.findOne.mockResolvedValue(fakeRole);
      UserRole.create.mockResolvedValue({});
      notificationHelper.sendOtp.mockResolvedValue();

      const result = await register(
        {
          name: fakeUser.name,
          email: fakeUser.email,
          password: fakeUser.password,
          contact: fakeUser.contact,
          govIssueIdType: fakeUser.gov_issue_id_type,
          fatherName: fakeUser.father_name,
          motherName: fakeUser.mother_name,
          address: fakeUser.address,
        },
        fakeFile
      );

      expect(result).toEqual({});
      expect(User.findOne).toHaveBeenCalledWith({
        where: { [Op.or]: [{ email: fakeUser.email }, { contact: fakeUser.contact }] },
      });
      expect(awsHelper.uploadImageToS3).toHaveBeenCalledWith(fakeFile);
      expect(User.create).toHaveBeenCalled();
      expect(notificationHelper.sendOtp).toHaveBeenCalledWith(fakeUser.email);
    });

    it('should throw an error if the email or contact already exists', async () => {
      User.findOne.mockResolvedValue(fakeUser);

      await expect(
        register(
          {
            name: fakeUser.name,
            email: fakeUser.email,
            password: fakeUser.password,
            contact: fakeUser.contact,
          },
          fakeFile
        )
      ).rejects.toThrow('User with email exists, please use another email');
    });

    it('should throw an error if no file is provided', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(
        register(
          {
            name: fakeUser.name,
            email: fakeUser.email,
            password: fakeUser.password,
            contact: fakeUser.contact,
          },
          null
        )
      ).rejects.toThrow('Please add gov_issue_id_image');
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      otpHelper.verifyOtp.mockResolvedValue(true);
      User.findOne.mockResolvedValue(fakeUser);
      otpHelper.deleteOtp.mockResolvedValue();

      await verifyEmail(fakeUser.email, fakeOtp);

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: fakeUser.email } });
      expect(fakeUser.update).toHaveBeenCalledWith({ is_verified: true });
      expect(otpHelper.deleteOtp).toHaveBeenCalledWith(fakeUser.email);
    });

    it('should throw an error for invalid OTP', async () => {
      otpHelper.verifyOtp.mockResolvedValue(false);

      await expect(verifyEmail(fakeUser.email, fakeOtp)).rejects.toThrow('Invalid OTP');
    });
  });

  describe('login', () => {
    it('should send OTP to email for login', async () => {
      User.findOne.mockResolvedValue(fakeUser);
      notificationHelper.sendOtp.mockResolvedValue();

      const result = await login(fakeUser.email);

      expect(result).toEqual(fakeUser);
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: fakeUser.email, is_verified: true } });
      expect(notificationHelper.sendOtp).toHaveBeenCalledWith(fakeUser.email);
    });

    it('should throw an error if user does not exist', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(login(fakeUser.email)).rejects.toThrow(`User with email ${fakeUser.email} does not exist`);
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP and generate JWT token', async () => {
      otpHelper.verifyOtp.mockResolvedValue(true);
      User.findOne.mockResolvedValue({
        ...fakeUser,
        Roles: [{ code: 'CUSTOMER' }],
      });
      jwtHelper.generateToken.mockResolvedValue('fake-jwt-token');
      otpHelper.deleteOtp.mockResolvedValue();

      const result = await verifyOtp(fakeUser.email, fakeOtp);

      expect(result).toBe('fake-jwt-token');
      expect(otpHelper.verifyOtp).toHaveBeenCalledWith(fakeUser.email, fakeOtp);
      expect(jwtHelper.generateToken).toHaveBeenCalledWith({ id: fakeUser.id, role: 'CUSTOMER' });
    });

    it('should throw an error for invalid OTP', async () => {
      otpHelper.verifyOtp.mockResolvedValueOnce(false);

      await expect(verifyOtp(fakeUser.email, fakeOtp)).rejects.toThrow('Invalid OTP');
    });
  });

  describe('resendOtp', () => {
    it('should resend OTP successfully', async () => {
      notificationHelper.sendOtp.mockResolvedValue();

      await resendOtp(fakeUser.email);

      expect(notificationHelper.sendOtp).toHaveBeenCalledWith(fakeUser.email);
    });
  });
});
