const transactionController = require('../../src/controllers/transactions.controller');
const transactionService = require('../../src/services/transactions.service');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const { faker } = require('@faker-js/faker');
const redisClient = require('../../src/config/redis');
const constants = require('../../src/constants/constants');

jest.mock('../../src/services/transactions.service');
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

describe('Transaction Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  describe('create', () => {
    it('should successfully create a transaction and return 201', async () => {
      const req = {
        params: { accountId: faker.string.uuid() },
        body: {
          accountNo: faker.finance.accountNumber(),
          type: faker.helpers.arrayElement([...Object.values(constants.TRANSACTION_TYPES)]),
          paymentMethod: faker.helpers.arrayElement([...Object.values(constants.PAYMENT_METHODS)]),
          amount: parseFloat(faker.finance.amount()),
          fee: parseFloat(faker.finance.amount()),
        },
        user: { id: faker.string.uuid() },
      };
      const res = { data: null, statusCode: null };
      const next = jest.fn();

      transactionService.create.mockResolvedValue(req.body);

      await transactionController.create(req, res, next);

      expect(res.data).toEqual(req.body);
      expect(res.statusCode).toBe(201);
      expect(transactionService.create).toHaveBeenCalledWith({
        accountId: req.params.accountId,
        data: req.body,
        user: req.user,
      });
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully when creating a transaction', async () => {
      const req = {
        params: { accountId: faker.string.uuid() },
        body: {},
        user: { id: faker.string.uuid() },
      };
      const res = {};
      const next = jest.fn();

      const err = new Error('Error creating transaction');
      err.statusCode = 400;
      transactionService.create.mockRejectedValue(err);

      await transactionController.create(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(
        req,
        res,
        'Error creating transaction',
        400,
        err
      );
    });
  });

  describe('index', () => {
    it('should successfully get list of transactions and return 200', async () => {
      const req = {
        params: { accountId: faker.string.uuid() },
        query: { limit: 10, page: 1 },
        user: { id: faker.string.uuid() },
      };
      const res = { data: null, statusCode: null };
      const next = jest.fn();

      transactionService.index.mockResolvedValue([
        {
          accountNo: faker.finance.accountNumber(),
          type: faker.helpers.arrayElement([...Object.values(constants.TRANSACTION_TYPES)]),
          paymentMethod: faker.helpers.arrayElement([...Object.values(constants.PAYMENT_METHODS)]),
          amount: parseFloat(faker.finance.amount()),
          fee: parseFloat(faker.finance.amount()),
        },
      ]);

      await transactionController.index(req, res, next);

      expect(res.data).toBeDefined();
      expect(res.statusCode).toBe(200);
      expect(transactionService.index).toHaveBeenCalledWith({
        accountId: req.params.accountId,
        query: req.query,
        user: req.user,
      });
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully when fetching transactions', async () => {
      const req = {
        params: { accountId: faker.string.uuid() },
        query: {},
        user: { id: faker.string.uuid() },
      };
      const res = {};
      const next = jest.fn();

      const err = new Error('Error fetching transactions');
      err.statusCode = 400;
      transactionService.index.mockRejectedValue(err);

      await transactionController.index(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(
        req,
        res,
        'Error fetching transactions',
        400,
        err
      );
    });
  });

  describe('view', () => {
    it('should successfully view a transaction and return 200', async () => {
      const req = {
        params: {
          accountId: faker.string.uuid(),
          transactionId: faker.string.uuid(),
        },
        user: { id: faker.string.uuid() },
      };
      const res = { data: null, statusCode: null };
      const next = jest.fn();

      transactionService.view.mockResolvedValue({
        accountNo: faker.finance.accountNumber(),
        type: faker.helpers.arrayElement([...Object.values(constants.TRANSACTION_TYPES)]),
        paymentMethod: faker.helpers.arrayElement([...Object.values(constants.PAYMENT_METHODS)]),
        amount: parseFloat(faker.finance.amount()),
        fee: parseFloat(faker.finance.amount()),
      });

      await transactionController.view(req, res, next);

      expect(res.data).toBeDefined();
      expect(res.statusCode).toBe(200);
      expect(transactionService.view).toHaveBeenCalledWith({
        params: req.params,
        user: req.user,
      });
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully when viewing a transaction', async () => {
      const req = {
        params: { accountId: faker.string.uuid(), transactionId: faker.string.uuid() },
        user: { id: faker.string.uuid() },
      };
      const res = {};
      const next = jest.fn();

      const err = new Error('Transaction not found');
      err.statusCode = 404;
      transactionService.view.mockRejectedValue(err);

      await transactionController.view(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(
        req,
        res,
        'Transaction not found',
        404,
        err
      );
    });
  });
});
