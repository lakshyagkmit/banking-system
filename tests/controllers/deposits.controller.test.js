const depositController = require('../../src/controllers/deposits.controller');
const depositService = require('../../src/services/deposits.service');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const { faker } = require('@faker-js/faker');
const redisClient = require('../../src/config/redis');
const constants = require('../../src/constants/constants');

jest.mock('../../src/services/deposits.service');
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

describe('Deposit Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  describe('create', () => {
    it('should successfully create a deposit and return 201', async () => {
      const req = {
        body: {
          type: constants.ACCOUNT_TYPES.FIXED,
          nominee: faker.person.fullName(),
          installmentAmount: faker.number.float({ min: 1000, max: 10000, precision: 0.01 }),
          principleAmount: faker.number.float({ min: 5000, max: 100000, precision: 0.01 }),
        },
        user: { id: faker.string.uuid() },
      };
      const res = { data: null, statusCode: null };
      const next = jest.fn();

      depositService.create.mockResolvedValue(req.body);

      await depositController.create(req, res, next);

      expect(res.data).toEqual(req.body);
      expect(res.statusCode).toBe(201);
      expect(depositService.create).toHaveBeenCalledWith({ data: req.body, user: req.user });
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { body: {}, user: { id: faker.string.uuid() } };
      const res = {};
      const next = jest.fn();
      const err = new Error('Error creating deposit');
      err.statusCode = 400;

      depositService.create.mockRejectedValue(err);

      await depositController.create(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(
        req,
        res,
        'Error creating deposit',
        400,
        err
      );
    });

    it('should handle missing required fields gracefully', async () => {
      const req = {
        body: {
          type: constants.ACCOUNT_TYPES.FIXED,
          nominee: faker.person.fullName(),
        },
        user: { id: faker.string.uuid() },
      };
      const res = {};
      const next = jest.fn();

      const err = new Error('Error creating deposit account');
      err.statusCode = 400;
      depositService.create.mockRejectedValue(err);

      await depositController.create(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(
        req,
        res,
        'Error creating deposit account',
        400,
        err
      );
    });
  });
});
