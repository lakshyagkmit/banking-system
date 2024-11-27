const lockerController = require('../../src/controllers/lockers.controller');
const lockerService = require('../../src/services/lockers.service');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const { faker } = require('@faker-js/faker');
const redisClient = require('../../src/config/redis');

jest.mock('../../src/services/lockers.service');
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

describe('Locker Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  describe('assign', () => {
    it('should successfully assign a locker and return 200', async () => {
      const req = {
        body: {
          email: faker.internet.email(),
          lockerSerialNo: faker.number.int({ min: 1, max: 100 }),
        },
        user: { id: faker.string.uuid() },
      };
      const res = { data: null, statusCode: null };
      const next = jest.fn();

      lockerService.assign.mockResolvedValue(req.body);

      await lockerController.assign(req, res, next);

      expect(res.data).toEqual(null);
      expect(res.statusCode).toBe(200);
      expect(lockerService.assign).toHaveBeenCalledWith({ data: req.body, user: req.user });
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { body: {}, user: { id: faker.string.uuid() } };
      const res = {};
      const next = jest.fn();

      const err = new Error('Error assigning locker');
      err.statusCode = 400;
      lockerService.assign.mockRejectedValue(err);

      await lockerController.assign(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(
        req,
        res,
        'Error assigning locker',
        400,
        err
      );
    });
  });

  describe('create', () => {
    it('should successfully create lockers and return 201', async () => {
      const req = {
        body: {
          numberOfLockers: faker.number.int({ min: 1, max: 100 }),
          monthlyCharge: faker.number.float({ min: 50, max: 1000, precision: 0.01 }),
        },
        user: { id: faker.string.uuid() },
      };
      const res = { data: null, statusCode: null };
      const next = jest.fn();

      lockerService.create.mockResolvedValue(req.body);

      await lockerController.create(req, res, next);

      expect(res.data).toEqual(null);
      expect(res.statusCode).toBe(201);
      expect(lockerService.create).toHaveBeenCalledWith({ data: req.body, user: req.user });
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { body: {}, user: { id: faker.string.uuid() } };
      const res = {};
      const next = jest.fn();

      const err = new Error('Error creating locker');
      err.statusCode = 400;
      lockerService.create.mockRejectedValue(err);

      await lockerController.create(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(
        req,
        res,
        'Error creating locker',
        400,
        err
      );
    });
  });

  describe('index', () => {
    it('should successfully get list of lockers and return 200', async () => {
      const req = {
        query: { limit: 10, page: 1 },
        user: { id: faker.string.uuid() },
      };
      const res = { data: null, statusCode: null };
      const next = jest.fn();

      lockerService.index.mockResolvedValue([
        { id: faker.string.uuid(), serialNo: faker.number.int({ min: 1, max: 100 }) },
      ]);

      await lockerController.index(req, res, next);

      expect(res.data).toBeDefined();
      expect(res.statusCode).toBe(200);
      expect(lockerService.index).toHaveBeenCalledWith({ query: req.query, user: req.user });
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { query: {}, user: { id: faker.string.uuid() } };
      const res = {};
      const next = jest.fn();

      const err = new Error('Error fetching lockers');
      err.statusCode = 400;
      lockerService.index.mockRejectedValue(err);

      await lockerController.index(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(
        req,
        res,
        'Error fetching lockers',
        400,
        err
      );
    });
  });

  describe('view', () => {
    it('should successfully view a locker and return 200', async () => {
      const req = {
        params: { id: faker.string.uuid() },
        user: { id: faker.string.uuid() },
      };
      const res = { data: null, statusCode: null };
      const next = jest.fn();

      lockerService.view.mockResolvedValue({
        id: req.params.id,
        serialNo: faker.number.int({ min: 1, max: 100 }),
      });

      await lockerController.view(req, res, next);

      expect(res.data).toBeDefined();
      expect(res.statusCode).toBe(200);
      expect(lockerService.view).toHaveBeenCalledWith({ id: req.params.id, user: req.user });
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { params: { id: faker.string.uuid() }, user: { id: faker.string.uuid() } };
      const res = {};
      const next = jest.fn();

      const err = new Error('Locker not found');
      err.statusCode = 404;
      lockerService.view.mockRejectedValue(err);

      await lockerController.view(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(req, res, 'Locker not found', 404, err);
    });
  });

  describe('update', () => {
    it('should successfully update locker and return 200', async () => {
      const req = {
        body: { monthlyCharge: faker.number.float({ min: 50, max: 1000, precision: 0.01 }) },
        params: { id: faker.string.uuid() },
        user: { id: faker.string.uuid() },
      };
      const res = { data: null, statusCode: null };
      const next = jest.fn();

      lockerService.update.mockResolvedValue(req.body);

      await lockerController.update(req, res, next);

      expect(res.data).toEqual(null);
      expect(res.statusCode).toBe(202);
      expect(lockerService.update).toHaveBeenCalledWith({
        id: req.params.id,
        data: req.body,
        user: req.user,
      });
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { body: {}, params: { id: faker.string.uuid() }, user: { id: faker.string.uuid() } };
      const res = {};
      const next = jest.fn();

      const err = new Error('Error updating locker');
      err.statusCode = 400;
      lockerService.update.mockRejectedValue(err);

      await lockerController.update(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(
        req,
        res,
        'Error updating locker',
        400,
        err
      );
    });
  });

  describe('deallocate', () => {
    it('should successfully deallocate locker and return 204', async () => {
      const req = {
        params: { id: faker.string.uuid() },
        user: { id: faker.string.uuid() },
      };
      const res = { message: null, statusCode: null };
      const next = jest.fn();

      lockerService.deallocate.mockResolvedValue();

      await lockerController.deallocate(req, res, next);

      expect(res.message).toBe('Locker Deallocated successfully');
      expect(res.statusCode).toBe(204);
      expect(lockerService.deallocate).toHaveBeenCalledWith({ id: req.params.id, user: req.user });
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { params: { id: faker.string.uuid() }, user: { id: faker.string.uuid() } };
      const res = {};
      const next = jest.fn();

      const err = new Error('Error deallocating locker');
      err.statusCode = 400;
      lockerService.deallocate.mockRejectedValue(err);

      await lockerController.deallocate(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(
        req,
        res,
        'Error deallocating locker',
        400,
        err
      );
    });
  });
});
