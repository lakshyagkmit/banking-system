const branchController = require('../../src/controllers/branches.controller');
const branchService = require('../../src/services/branches.service');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const { faker } = require('@faker-js/faker');
const redisClient = require('../../src/config/redis');

jest.mock('../../src/services/branches.service');
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

describe('Branch Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  describe('create', () => {
    it('should successfully create a branch and return 201', async () => {
      const req = {
        body: {
          address: faker.location.streetAddress(),
          ifscCode: faker.string.alpha({ length: 11 }).toUpperCase(),
        },
      };
      const res = { data: null, statusCode: null };
      const next = jest.fn();

      branchService.create.mockResolvedValue(req.body);

      await branchController.create(req, res, next);

      expect(res.data).toEqual(req.body);
      expect(res.statusCode).toBe(201);
      expect(branchService.create).toHaveBeenCalledWith({ data: req.body });
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { body: {} };
      const res = {};
      const next = jest.fn();

      const err = new Error('Error creating branch');
      err.statusCode = 400;

      branchService.create.mockRejectedValue(err);

      await branchController.create(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(
        req,
        res,
        'Error creating branch',
        400,
        err
      );
    });
  });

  describe('index', () => {
    it('should successfully retrieve a list of branches and return 200', async () => {
      const req = { query: { city: 'New York' } };
      const res = { data: null, statusCode: null };
      const next = jest.fn();

      const branches = [
        { name: 'Branch 1', address: '123 Street', city: 'New York' },
        { name: 'Branch 2', address: '456 Avenue', city: 'New York' },
      ];

      branchService.index.mockResolvedValue(branches);

      await branchController.index(req, res, next);

      expect(res.data).toEqual(branches);
      expect(res.statusCode).toBe(200);
      expect(branchService.index).toHaveBeenCalledWith({ query: req.query });
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { query: {} };
      const res = {};
      const next = jest.fn();

      const err = new Error('Error fetching branches');
      err.statusCode = 500;

      branchService.index.mockRejectedValue(err);

      await branchController.index(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(
        req,
        res,
        'Error fetching branches',
        500,
        err
      );
    });
  });

  describe('view', () => {
    it('should successfully retrieve a single branch by ID and return 200', async () => {
      const req = { params: { id: faker.string.uuid() } };
      const res = { data: null, statusCode: null };
      const next = jest.fn();

      const branch = { name: 'Branch 1', address: '123 Street', city: 'New York' };

      branchService.view.mockResolvedValue(branch);

      await branchController.view(req, res, next);

      expect(res.data).toEqual(branch);
      expect(res.statusCode).toBe(200);
      expect(branchService.view).toHaveBeenCalledWith(req.params.id);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { params: { id: 'invalid-id' } };
      const res = {};
      const next = jest.fn();

      const err = new Error('Error fetching branch');
      err.statusCode = 400;

      branchService.view.mockRejectedValue(err);

      await branchController.view(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(
        req,
        res,
        'Error fetching branch',
        400,
        err
      );
    });
  });

  describe('update', () => {
    it('should successfully update a branch and return 200', async () => {
      const req = {
        params: { id: faker.string.uuid() },
        body: {
          name: 'Updated Branch',
          address: '789 New Street',
          city: 'New York',
          state: 'NY',
          country: 'USA',
        },
      };
      const res = { data: null, message: null, statusCode: null };
      const next = jest.fn();

      const updatedBranch = { ...req.body, id: req.params.id };
      branchService.update.mockResolvedValue(updatedBranch);

      await branchController.update(req, res, next);

      expect(res.data).toEqual(updatedBranch);
      expect(res.message).toBe('Branch updated successfully');
      expect(res.statusCode).toBe(202);
      expect(branchService.update).toHaveBeenCalledWith({
        data: req.body,
        id: req.params.id,
      });
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { params: { id: 'invalid-id' }, body: {} };
      const res = {};
      const next = jest.fn();

      const err = new Error('Error updating branch');
      err.statusCode = 400;

      branchService.update.mockRejectedValue(err);

      await branchController.update(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(
        req,
        res,
        'Error updating branch',
        400,
        err
      );
    });
  });
});
