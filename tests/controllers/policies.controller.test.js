const policyController = require('../../src/controllers/policies.controller');
const policyService = require('../../src/services/policies.service');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const { faker } = require('@faker-js/faker');
const redisClient = require('../../src/config/redis');
const constants = require('../../src/constants/constants');

jest.mock('../../src/services/policies.service');
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

describe('Policy Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  describe('create', () => {
    it('should successfully create a policy and return 201', async () => {
      const req = {
        body: {
          accountType: faker.helpers.arrayElement([...Object.values(constants.ACCOUNT_TYPES)]),
          initialAmount: faker.finance.amount(),
          interestRate: faker.number.float({ min: 0, max: 10 }),
          minimumAmount: faker.finance.amount(),
          lockInPeriod: faker.number.int({ min: 0, max: 10 }),
          penaltyFee: faker.number.float({ min: 0, max: 100 }),
        },
      };
      const res = { data: null, statusCode: null };
      const next = jest.fn();

      policyService.create.mockResolvedValue(req.body);

      await policyController.create(req, res, next);

      expect(res.data).toEqual(req.body);
      expect(res.statusCode).toBe(201);
      expect(policyService.create).toHaveBeenCalledWith(req.body);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { body: {} };
      const res = {};
      const next = jest.fn();

      const err = new Error('Error creating policy');
      err.statusCode = 400;
      policyService.create.mockRejectedValue(err);

      await policyController.create(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(
        req,
        res,
        'Error creating policy',
        400,
        err
      );
    });
  });

  describe('index', () => {
    it('should successfully get list of policies and return 200', async () => {
      const req = {
        query: { limit: 10, page: 1 },
      };
      const res = { data: null, statusCode: null };
      const next = jest.fn();

      policyService.index.mockResolvedValue([
        { id: faker.string.uuid(), name: faker.commerce.productName() },
      ]);

      await policyController.index(req, res, next);

      expect(res.data).toBeDefined();
      expect(res.statusCode).toBe(200);
      expect(policyService.index).toHaveBeenCalledWith(req.query);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { query: {} };
      const res = {};
      const next = jest.fn();

      const err = new Error('Error fetching policies');
      err.statusCode = 400;
      policyService.index.mockRejectedValue(err);

      await policyController.index(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(
        req,
        res,
        'Error fetching policies',
        400,
        err
      );
    });
  });

  describe('view', () => {
    it('should successfully view a policy and return 200', async () => {
      const req = {
        params: { id: faker.string.uuid() },
      };
      const res = { data: null, statusCode: null };
      const next = jest.fn();

      policyService.view.mockResolvedValue({ id: req.params.id, name: faker.commerce.productName() });

      await policyController.view(req, res, next);

      expect(res.data).toBeDefined();
      expect(res.statusCode).toBe(200);
      expect(policyService.view).toHaveBeenCalledWith(req.params.id);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { params: { id: faker.string.uuid() } };
      const res = {};
      const next = jest.fn();

      const err = new Error('Policy not found');
      err.statusCode = 404;
      policyService.view.mockRejectedValue(err);

      await policyController.view(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(req, res, 'Policy not found', 404, err);
    });
  });

  describe('update', () => {
    it('should successfully update a policy and return 200', async () => {
      const req = {
        params: { id: faker.string.uuid() },
        body: { interestRate: faker.number.float({ min: 0, max: 10 }) },
      };
      const res = { data: null, statusCode: null };
      const next = jest.fn();

      policyService.update.mockResolvedValue(req.body);

      await policyController.update(req, res, next);

      expect(res.data).toEqual(req.body);
      expect(res.statusCode).toBe(200);
      expect(policyService.update).toHaveBeenCalledWith(req.params.id, req.body);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { params: { id: faker.string.uuid() }, body: {} };
      const res = {};
      const next = jest.fn();

      const err = new Error('Error updating policy');
      err.statusCode = 400;
      policyService.update.mockRejectedValue(err);

      await policyController.update(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(
        req,
        res,
        'Error updating policy',
        400,
        err
      );
    });
  });

  describe('remove', () => {
    it('should successfully remove a policy and return 204', async () => {
      const req = { params: { id: faker.string.uuid() } };
      const res = { message: null, statusCode: null };
      const next = jest.fn();

      policyService.remove.mockResolvedValue();

      await policyController.remove(req, res, next);

      expect(res.message).toBe('policy deleted successfully');
      expect(res.statusCode).toBe(204);
      expect(policyService.remove).toHaveBeenCalledWith(req.params.id);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { params: { id: faker.string.uuid() } };
      const res = {};
      const next = jest.fn();

      const err = new Error('Error deleting policy');
      err.statusCode = 400;
      policyService.remove.mockRejectedValue(err);

      await policyController.remove(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(
        req,
        res,
        'Error deleting policy',
        400,
        err
      );
    });
  });
});
