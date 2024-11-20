const userController = require('../../src/controllers/users.controller');
const userService = require('../../src/services/users.service');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const { faker } = require('@faker-js/faker');
const constants = require('../../src/constants/constants');
const redisClient = require('../../src/config/redis');

jest.mock('../../src/services/users.service');
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

describe('User Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  describe('create', () => {
    it('should successfully create a user and return 201', async () => {
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
          isVerified: faker.datatype.boolean(),
        },
        file: {},
        user: { id: faker.string.uuid() },
      };
      const res = { data: null, statusCode: null };
      const next = jest.fn();

      userService.create.mockResolvedValue(req.body);

      await userController.create(req, res, next);

      expect(res.data).toEqual(req.body);
      expect(res.statusCode).toBe(201);
      expect(userService.create).toHaveBeenCalledWith(req.body, req.file, req.user);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = {
        body: {},
        file: {},
        user: { id: faker.string.uuid() },
      };
      const res = {};
      const next = jest.fn();

      const err = new Error('Error creating user');
      err.statusCode = 400;
      userService.create.mockRejectedValue(err);

      await userController.create(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(req, res, 'Error creating user', 400, err);
    });
  });

  describe('index', () => {
    it('should successfully get list of users and return 200', async () => {
      const req = {
        query: { limit: 10, page: 1 },
        user: { id: faker.string.uuid() },
      };
      const res = { data: null, statusCode: null };
      const next = jest.fn();

      userService.index.mockResolvedValue([
        {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          contact: faker.phone.number('##########'),
          govIssueIdType: faker.helpers.arrayElement([...Object.values(constants.GOV_ISSUE_ID_TYPES)]),
        },
      ]);

      await userController.index(req, res, next);

      expect(res.data).toBeDefined();
      expect(res.statusCode).toBe(200);
      expect(userService.index).toHaveBeenCalledWith(req.query, req.user);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { query: {}, user: { id: faker.string.uuid() } };
      const res = {};
      const next = jest.fn();

      const err = new Error('Error fetching users');
      err.statusCode = 400;
      userService.index.mockRejectedValue(err);

      await userController.index(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(
        req,
        res,
        'Error fetching users',
        400,
        err
      );
    });
  });

  describe('view', () => {
    it('should successfully view a user and return 200', async () => {
      const req = {
        params: { id: faker.string.uuid() },
        user: { id: faker.string.uuid() },
      };
      const res = { data: null, statusCode: null };
      const next = jest.fn();

      userService.view.mockResolvedValue({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        contact: faker.phone.number('##########'),
      });

      await userController.view(req, res, next);

      expect(res.data).toBeDefined();
      expect(res.statusCode).toBe(200);
      expect(userService.view).toHaveBeenCalledWith(req.params.id, req.user);
      expect(next).toHaveBeenCalled();
    });

    it('should return 404 if user not found', async () => {
      const req = { params: { id: faker.string.uuid() }, user: { id: faker.string.uuid() } };
      const res = {};
      const next = jest.fn();

      userService.view.mockResolvedValue(null); // Simulate not found

      await userController.view(req, res, next);

      expect(res.message).toBe('User not found');
      expect(res.statusCode).toBe(404);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { params: { id: faker.string.uuid() }, user: { id: faker.string.uuid() } };
      const res = {};
      const next = jest.fn();

      const err = new Error('User not found');
      err.statusCode = 404;
      userService.view.mockRejectedValue(err);

      await userController.view(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(req, res, 'User not found', 404, err);
    });
  });

  describe('update', () => {
    it('should successfully update a user and return 200', async () => {
      const req = {
        params: { id: faker.string.uuid() },
        body: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          contact: faker.phone.number('##########'),
        },
        user: { id: faker.string.uuid() },
      };
      const res = { data: null, statusCode: null };
      const next = jest.fn();

      userService.update.mockResolvedValue(req.body);

      await userController.update(req, res, next);

      expect(res.data).toEqual(req.body);
      expect(res.statusCode).toBe(200);
      expect(userService.update).toHaveBeenCalledWith(req.params.id, req.body, req.user);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = {
        params: { id: faker.string.uuid() },
        body: {},
        user: { id: faker.string.uuid() },
      };
      const res = {};
      const next = jest.fn();

      const err = new Error('Error updating user');
      err.statusCode = 400;
      userService.update.mockRejectedValue(err);

      await userController.update(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(req, res, 'Error updating user', 400, err);
    });
  });

  describe('remove', () => {
    it('should successfully delete a user and return 204', async () => {
      const req = { params: { id: faker.string.uuid() }, user: { id: faker.string.uuid() } };
      const res = { message: null, statusCode: null };
      const next = jest.fn();

      userService.remove.mockResolvedValue();

      await userController.remove(req, res, next);

      expect(res.message).toBe('user deleted successfully');
      expect(res.statusCode).toBe(204);
      expect(userService.remove).toHaveBeenCalledWith(req.params.id, req.user);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = { params: { id: faker.string.uuid() }, user: { id: faker.string.uuid() } };
      const res = {};
      const next = jest.fn();

      const err = new Error('Error deleting user');
      err.statusCode = 400;
      userService.remove.mockRejectedValue(err);

      await userController.remove(req, res, next);

      expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(req, res, 'Error deleting user', 400, err);
    });
  });
});
