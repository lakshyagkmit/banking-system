const { faker } = require('@faker-js/faker');
const accountsController = require('../../src/controllers/accounts.controller');
const accountService = require('../../src/services/accounts.service');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const redisClient = require('../../src/config/redis');
const constants = require('../../src/constants/constants');

jest.mock('../../src/services/accounts.service');
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

const generateFakePayload = () => ({
  type: faker.helpers.arrayElement([constants.ACCOUNT_TYPES.SAVINGS, constants.ACCOUNT_TYPES.CURRENT]),
  nominee: faker.person.fullName(),
  branchIfscCode: faker.string.alpha({ length: 11 }).toUpperCase(),
});

const generateUpdateFakePayload = () => ({
  nominee: faker.person.fullName(),
});

describe('Accounts Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  const mockUser = { id: faker.string.uuid() };

  describe('create', () => {
    it('should create an account and return 201', async () => {
      const req = { body: generateFakePayload(), user: mockUser };
      const res = { data: null, statusCode: null };
      const next = jest.fn();

      const expectedPayload = { data: req.body, user: req.user };

      accountService.create.mockResolvedValue(req.body);

      await accountsController.create(req, res, next);

      expect(res.data).toEqual(req.body);
      expect(res.statusCode).toBe(201);
      expect(accountService.create).toHaveBeenCalledWith(expectedPayload);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { body: {}, user: mockUser };
      const res = {};
      const next = jest.fn();

      const err = new Error('Error creating account');
      err.statusCode = 400;

      accountService.create.mockRejectedValue(err);

      await accountsController.create(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(
        req,
        res,
        'Error creating account',
        400,
        err
      );
    });
  });

  describe('index', () => {
    it('should return a list of accounts', async () => {
      const req = { query: {}, user: mockUser };
      const res = { data: null, statusCode: null };
      const next = jest.fn();

      const mockAccounts = Array.from({ length: 3 }, generateFakePayload);
      const expectedPayload = { query: req.query, user: req.user };

      accountService.index.mockResolvedValue(mockAccounts);

      await accountsController.index(req, res, next);

      expect(res.data).toEqual(mockAccounts);
      expect(res.statusCode).toBe(200);
      expect(accountService.index).toHaveBeenCalledWith(expectedPayload);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { query: {}, user: mockUser };
      const res = {};
      const next = jest.fn();

      const err = new Error('Accounts not found');
      err.statusCode = 404;

      accountService.index.mockRejectedValue(err);

      await accountsController.index(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(req, res, 'Accounts not found', 404, err);
    });
  });

  describe('view', () => {
    it('should return an account by ID', async () => {
      const accountId = faker.string.uuid();
      const req = { params: { id: accountId }, user: mockUser };
      const res = { data: null, statusCode: null };
      const next = jest.fn();

      const mockAccount = generateFakePayload();
      const expectedPayload = { id: accountId, user: req.user };

      accountService.view.mockResolvedValue(mockAccount);

      await accountsController.view(req, res, next);

      expect(res.data).toEqual(mockAccount);
      expect(res.statusCode).toBe(200);
      expect(accountService.view).toHaveBeenCalledWith(expectedPayload);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const accountId = faker.string.uuid();
      const req = { params: { id: accountId }, user: mockUser };
      const res = {};
      const next = jest.fn();

      const err = new Error('Error fetching account');
      err.statusCode = 500;

      accountService.view.mockRejectedValue(err);

      await accountsController.view(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(
        req,
        res,
        'Error fetching account',
        500,
        err
      );
    });
  });

  describe('update', () => {
    it('should update an account successfully', async () => {
      const accountId = faker.string.uuid();
      const req = { params: { id: accountId }, body: generateUpdateFakePayload(), user: mockUser };
      const res = { message: null, data: null, statusCode: null };
      const next = jest.fn();

      const expectedPayload = { id: accountId, data: req.body, user: req.user };

      accountService.update.mockResolvedValue(req.body);

      await accountsController.update(req, res, next);

      expect(res.message).toBe('Account updated successfully');
      expect(res.data).toEqual(req.body);
      expect(res.statusCode).toBe(202);
      expect(accountService.update).toHaveBeenCalledWith(expectedPayload);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const accountId = faker.string.uuid();
      const req = { params: { id: accountId }, body: {}, user: mockUser };
      const res = {};
      const next = jest.fn();

      const err = new Error('Account not found');
      err.statusCode = 404;

      accountService.update.mockRejectedValue(err);

      await accountsController.update(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(req, res, 'Account not found', 404, err);
    });
  });

  describe('remove', () => {
    it('should delete an account successfully', async () => {
      const accountId = faker.string.uuid();
      const req = { params: { id: accountId }, user: mockUser };
      const res = { message: null, statusCode: null };
      const next = jest.fn();

      const expectedPayload = { id: accountId, user: req.user };

      accountService.remove.mockResolvedValue();

      await accountsController.remove(req, res, next);

      expect(res.message).toBe('Account deleted successfully');
      expect(res.statusCode).toBe(204);
      expect(accountService.remove).toHaveBeenCalledWith(expectedPayload);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const accountId = faker.string.uuid();
      const req = { params: { id: accountId }, user: mockUser };
      const res = {};
      const next = jest.fn();

      const err = new Error('Account not found');
      err.statusCode = 404;

      accountService.remove.mockRejectedValue(err);

      await accountsController.remove(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(req, res, 'Account not found', 404, err);
    });
  });
});
