const { create, index, view, update } = require('../../src/services/branches.service');
const { User, Role, Branch, Bank, sequelize } = require('../../src/models');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const { ROLES } = require('../../src/constants/constants');
const { faker } = require('@faker-js/faker');
const redisClient = require('../../src/config/redis');

jest.mock('../../src/models');
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

describe('Branch Service Tests', () => {
  let fakeUser, fakeBranch, fakeBank, fakePayload, transaction;

  beforeEach(() => {
    fakeUser = {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      include: jest.fn(),
      Roles: [{ code: ROLES['102'] }],
    };

    commonHelper.customError.mockImplementation((message, status) => {
      const err = new Error(message);
      err.statusCode = status;
      throw err;
    });

    fakeBranch = {
      id: faker.string.uuid(),
      ifsc_code: faker.finance.bic(),
      contact: faker.phone.number('##########'),
      user_id: fakeUser.id,
      address: faker.location.streetAddress(),
      total_lockers: faker.number.int({ min: 1, max: 50 }),
      bank_id: faker.string.uuid(),
      update: jest.fn(),
    };

    fakeBank = {
      id: faker.string.uuid(),
    };

    fakePayload = {
      userId: fakeUser.id,
      address: faker.location.streetAddress(),
      ifscCode: faker.finance.bic(),
      contact: faker.phone.number('########'),
      totalLockers: faker.number.int({ min: 1, max: 50 }),
    };

    transaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    sequelize.transaction = jest.fn().mockResolvedValue(transaction);
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a branch successfully', async () => {
      User.findOne.mockResolvedValue(fakeUser);
      Branch.findOne.mockResolvedValue(null);
      Bank.findOne.mockResolvedValue(fakeBank);
      Branch.create.mockResolvedValue(fakeBranch);

      const result = await create(fakePayload);

      expect(result).toEqual(fakeBranch);
      expect(User.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: fakePayload.userId },
        })
      );
      expect(Branch.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: fakePayload.userId,
          ifsc_code: fakePayload.ifscCode,
          address: fakePayload.address,
          contact: fakePayload.contact,
          total_lockers: fakePayload.totalLockers,
        }),
        expect.any(Object)
      );
      expect(transaction.commit).toHaveBeenCalled();
    });

    it('should throw an error if user is not authorized as a branch manager', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(create(fakePayload)).rejects.toThrow(
        'The specified user is not authorized as a Branch Manager'
      );
      expect(transaction.rollback).toHaveBeenCalled();
    });

    it('should throw an error if branch data already exists', async () => {
      Branch.findOne.mockResolvedValue(fakeBranch);

      await expect(create(fakePayload)).rejects.toThrow(`Branch with the same user_id already exists`);
      expect(transaction.rollback).toHaveBeenCalled();
    });
  });

  describe('index', () => {
    it('should return paginated branches successfully', async () => {
      const branches = {
        rows: [fakeBranch],
        count: 10,
      };

      Branch.findAndCountAll.mockResolvedValue(branches);

      const result = await index({ page: 1, limit: 5 });

      expect(result).toEqual({
        branches: branches.rows,
        totalBranches: branches.count,
        currentPage: 1,
        totalPages: 2,
      });
      expect(Branch.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 0,
          limit: 5,
        })
      );
    });

    it('should throw an error if no branches are found', async () => {
      Branch.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

      await expect(index({ page: 1, limit: 5 })).rejects.toThrow('No branches found');
    });
  });

  describe('view', () => {
    it('should return a branch by ID', async () => {
      Branch.findByPk.mockResolvedValue(fakeBranch);

      const result = await view(fakeBranch.id);

      expect(result).toEqual(fakeBranch);
      expect(Branch.findByPk).toHaveBeenCalledWith(fakeBranch.id);
    });

    it('should throw an error if branch is not found', async () => {
      Branch.findByPk.mockResolvedValue(null);

      await expect(view(fakeBranch.id)).rejects.toThrow('Branch not found');
    });
  });

  describe('update', () => {
    it('should update a branch successfully', async () => {
      Branch.findByPk.mockResolvedValue(fakeBranch);

      const updatedBranch = {
        ...fakeBranch,
        address: 'Updated Address',
        total_lockers: 60,
      };

      fakeBranch.update.mockResolvedValue(updatedBranch);

      const payload = {
        userId: faker.string.uuid(),
        address: 'Updated Address',
        totalLockers: 60,
      };

      const result = await update(fakeBranch.id, payload);

      expect(result).toEqual(updatedBranch);
      expect(fakeBranch.update).toHaveBeenCalledWith(
        expect.objectContaining({
          address: payload.address,
          total_lockers: payload.totalLockers,
        }),
        expect.any(Object)
      );
      expect(transaction.commit).toHaveBeenCalled();
    });

    it('should throw an error if branch is not found', async () => {
      Branch.findByPk.mockResolvedValue(null);

      await expect(update(fakeBranch.id, fakePayload)).rejects.toThrow('Branch not found');
      expect(transaction.rollback).toHaveBeenCalled();
    });

    it('should throw an error if update data conflicts with existing values', async () => {
      Branch.findByPk.mockResolvedValue(fakeBranch);

      const conflictingPayload = {
        userId: fakeBranch.user_id,
        ifscCode: fakeBranch.ifsc_code,
        contact: fakeBranch.contact,
      };

      await expect(update(fakeBranch.id, conflictingPayload)).rejects.toThrow(
        'Cannot use same data for user id or ifsc code or contact for updation'
      );
      expect(transaction.rollback).toHaveBeenCalled();
    });
  });
});
