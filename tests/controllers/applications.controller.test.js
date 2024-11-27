const applicationController = require('../../src/controllers/applications.controller');
const applicationService = require('../../src/services/applications.service');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const { faker } = require('@faker-js/faker');
const redisClient = require('../../src/config/redis');
const constants = require('../../src/constants/constants');

jest.mock('../../src/services/applications.service');
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

describe('Application Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  const mockUser = { id: faker.string.uuid() };

  describe('requestAccount', () => {
    it('should successfully request an account and return 201', async () => {
      const req = {
        body: {
          branchIfscCode: faker.string.alpha({ length: 11 }).toUpperCase(),
          type: faker.helpers.arrayElement([
            constants.APPLICATION_TYPES.SAVINGS,
            constants.APPLICATION_TYPES.CURRENT,
          ]),
          nomineeName: faker.person.fullName(),
        },
        user: mockUser,
      };
      const res = { data: null, statusCode: null };
      const next = jest.fn();

      applicationService.requestAccount.mockResolvedValue(req.body);

      await applicationController.requestAccount(req, res, next);

      const expectedPayload = { data: req.body, user: mockUser };
      expect(res.data).toEqual(req.body);
      expect(res.statusCode).toBe(201);
      expect(applicationService.requestAccount).toHaveBeenCalledWith(expectedPayload);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { body: {}, user: mockUser };
      const res = {};
      const next = jest.fn();

      const err = new Error('Error requesting account');
      err.statusCode = 400;

      applicationService.requestAccount.mockRejectedValue(err);

      await applicationController.requestAccount(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(
        req,
        res,
        'Error requesting account',
        400,
        err
      );
    });
  });

  describe('requestLocker', () => {
    it('should successfully request a locker and return 201', async () => {
      const req = {
        body: {
          type: 'LOCKER',
        },
        user: mockUser,
      };
      const res = { data: null, statusCode: null };
      const next = jest.fn();

      applicationService.requestLocker.mockResolvedValue(req.body);

      await applicationController.requestLocker(req, res, next);

      const expectedPayload = { data: req.body, user: mockUser };
      expect(res.data).toEqual(req.body);
      expect(res.statusCode).toBe(201);
      expect(applicationService.requestLocker).toHaveBeenCalledWith(expectedPayload);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { body: {}, user: mockUser };
      const res = {};
      const next = jest.fn();

      const err = new Error('Error requesting locker');
      err.statusCode = 400;

      applicationService.requestLocker.mockRejectedValue(err);

      await applicationController.requestLocker(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(
        req,
        res,
        'Error requesting locker',
        400,
        err
      );
    });
  });

  describe('index', () => {
    it('should return a list of applications', async () => {
      const req = { query: {}, user: mockUser };
      const res = { data: null, statusCode: null };
      const next = jest.fn();

      const mockApplications = Array.from({ length: 3 }, () => ({
        id: faker.string.uuid(),
        type: faker.helpers.arrayElement(['SAVINGS', 'CURRENT', 'LOCKER']),
        branchIfscCode: faker.string.alpha({ length: 11 }).toUpperCase(),
        nomineeName: faker.person.fullName(),
      }));
      applicationService.index.mockResolvedValue(mockApplications);

      await applicationController.index(req, res, next);

      const expectedPayload = { query: req.query, user: mockUser };
      expect(res.data).toEqual(mockApplications);
      expect(res.statusCode).toBe(201);
      expect(applicationService.index).toHaveBeenCalledWith(expectedPayload);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { query: {}, user: mockUser };
      const res = {};
      const next = jest.fn();

      const err = new Error('Applications not found');
      err.statusCode = 404;

      applicationService.index.mockRejectedValue(err);

      await applicationController.index(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(
        req,
        res,
        'Applications not found',
        404,
        err
      );
    });
  });

  describe('view', () => {
    it('should return an application by ID', async () => {
      const applicationId = faker.string.uuid();
      const req = { params: { id: applicationId }, user: mockUser };
      const res = { data: null, statusCode: null };
      const next = jest.fn();

      const mockApplication = {
        id: applicationId,
        type: 'SAVINGS',
        branchIfscCode: faker.string.alpha({ length: 11 }).toUpperCase(),
        nomineeName: faker.person.fullName(),
      };
      applicationService.view.mockResolvedValue(mockApplication);

      await applicationController.view(req, res, next);

      const expectedPayload = { id: applicationId, user: mockUser };
      expect(res.data).toEqual(mockApplication);
      expect(res.statusCode).toBe(201);
      expect(applicationService.view).toHaveBeenCalledWith(expectedPayload);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const applicationId = faker.string.uuid();
      const req = { params: { id: applicationId }, user: mockUser };
      const res = {};
      const next = jest.fn();

      const err = new Error('Error fetching application');
      err.statusCode = 500;

      applicationService.view.mockRejectedValue(err);

      await applicationController.view(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(
        req,
        res,
        'Error fetching application',
        500,
        err
      );
    });
  });
});
