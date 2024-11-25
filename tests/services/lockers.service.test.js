const { assign, create, index, view, update, deallocate } = require('../../src/services/lockers.service');
const { UserApplication, Branch, Locker, User, Role, UserLocker, sequelize } = require('../../src/models');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const notificationHelper = require('../../src/helpers/notifications.helper');
const { ROLES, APPLICATION_TYPES, LOCKER_STATUS, STATUS } = require('../../src/constants/constants');
const { faker } = require('@faker-js/faker');
const redisClient = require('../../src/config/redis');

jest.mock('../../src/models');
jest.mock('../../src/helpers/commonFunctions.helper');
jest.mock('../../src/helpers/notifications.helper');
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

describe('Locker Service Tests', () => {
  let fakeBranch, fakeLocker, fakeUser, fakePayload, fakeApplication, transaction;

  beforeEach(() => {
    fakeBranch = {
      id: faker.string.uuid(),
      ifsc_code: faker.finance.bic(),
      total_lockers: 100,
      user_id: faker.string.uuid(),
    };

    commonHelper.customError.mockImplementation((message, status) => {
      const err = new Error(message);
      err.statusCode = status;
      throw err;
    });

    fakeLocker = {
      id: faker.string.uuid(),
      serial_no: faker.number.int(),
      branch_id: fakeBranch.id,
      status: LOCKER_STATUS.AVAILABLE,
      monthly_charge: faker.finance.amount(),
      update: jest.fn(),
    };

    fakeUser = {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      Roles: [{ code: ROLES['103'] }],
    };

    fakeApplication = {
      id: faker.string.uuid(),
      branch_ifsc_code: fakeBranch.ifsc_code,
      type: APPLICATION_TYPES.LOCKER,
      destroy: jest.fn(),
    };

    fakePayload = {
      email: fakeUser.email,
      lockerSerialNo: faker.number.int(),
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

  describe('assign', () => {
    it('should assign a locker to a customer successfully', async () => {
      User.findOne.mockResolvedValueOnce(fakeUser);
      Branch.findOne.mockResolvedValueOnce(fakeBranch);
      UserApplication.findOne.mockResolvedValueOnce(fakeApplication);
      Locker.findOne.mockResolvedValueOnce(fakeLocker);
      UserLocker.findOne.mockResolvedValueOnce(null);
      UserLocker.create.mockResolvedValueOnce({});
      notificationHelper.lockerAssignedNotification.mockResolvedValue();

      const result = await assign(fakePayload, { id: fakeBranch.user_id });

      expect(result).toEqual({ message: 'Locker assigned successfully' });
      expect(UserLocker.create).toHaveBeenCalledWith(
        expect.objectContaining({
          locker_id: fakeLocker.id,
          user_id: fakeUser.id,
        }),
        expect.any(Object)
      );
      expect(fakeLocker.update).toHaveBeenCalledWith({ status: LOCKER_STATUS.FREEZED }, expect.any(Object));
      expect(transaction.commit).toHaveBeenCalled();
    });

    it('should throw an error if the user is not found', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(assign(fakePayload, { id: fakeBranch.user_id })).rejects.toThrow('No user found');
    });

    it('should throw an error if locker is already frozen', async () => {
      User.findOne.mockResolvedValueOnce(fakeUser);
      Locker.findOne.mockResolvedValue({ ...fakeLocker, status: LOCKER_STATUS.FREEZED });

      await expect(assign(fakePayload, { id: fakeBranch.user_id })).rejects.toThrow('Locker not available');
    });
  });

  describe('create', () => {
    it('should create lockers successfully', async () => {
      Branch.findOne.mockResolvedValue(fakeBranch);
      Locker.count.mockResolvedValue(0);
      Locker.bulkCreate.mockResolvedValue();

      const payload = { numberOfLockers: 10, monthlyCharge: 200 };

      const result = await create(payload, { id: fakeBranch.user_id });

      expect(result).toEqual({ message: '10 lockers added successfully' });
      expect(Locker.bulkCreate).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if total lockers exceed branch capacity', async () => {
      Branch.findOne.mockResolvedValue(fakeBranch);
      Locker.count.mockResolvedValue(95);

      const payload = { numberOfLockers: 10, monthlyCharge: 200 };

      await expect(create(payload, { id: fakeBranch.user_id })).rejects.toThrow(
        'Cannot create lockers more than assigned total lockers in the branch'
      );
    });
  });

  describe('index', () => {
    it('should list lockers for a branch manager successfully', async () => {
      Branch.findOne.mockResolvedValue(fakeBranch);
      Locker.findAndCountAll.mockResolvedValue({
        rows: [fakeLocker],
        count: 1,
      });

      const result = await index({ page: 1, limit: 10 }, { id: fakeBranch.user_id, role: ROLES['102'] });

      expect(result).toEqual({
        totalItems: 1,
        totalPages: 1,
        currentPage: 1,
        lockers: [fakeLocker],
      });
    });

    it('should throw an error if no lockers are found', async () => {
      Locker.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

      await expect(
        index({ page: 1, limit: 10 }, { id: fakeBranch.user_id, role: ROLES['102'] })
      ).rejects.toThrow('No lockers found');
    });
  });

  describe('view', () => {
    it('should return a locker by ID for a branch manager', async () => {
      Branch.findOne.mockResolvedValue(fakeBranch);
      Locker.findOne.mockResolvedValue(fakeLocker);

      const result = await view(fakeLocker.id, { id: fakeBranch.user_id, role: ROLES['102'] });

      expect(result).toEqual(fakeLocker);
    });

    it('should throw an error if locker is not found', async () => {
      Branch.findOne.mockResolvedValueOnce(fakeBranch);
      Locker.findOne.mockResolvedValue(null);

      await expect(view(fakeLocker.id, { id: fakeBranch.user_id, role: ROLES['102'] })).rejects.toThrow(
        'Locker not found'
      );
    });
  });

  describe('update', () => {
    it('should update a locker successfully', async () => {
      Branch.findOne.mockResolvedValue(fakeBranch);
      Locker.findOne.mockResolvedValue(fakeLocker);
      fakeLocker.update.mockResolvedValue();

      const result = await update(fakeLocker.id, { monthlyCharge: 300 }, { id: fakeBranch.user_id });

      expect(result).toEqual({ message: 'Locker updated successfully' });
      expect(fakeLocker.update).toHaveBeenCalledWith({ monthly_charge: 300 }, expect.any(Object));
    });

    it('should throw an error if locker is not found', async () => {
      Branch.findOne.mockResolvedValueOnce(fakeBranch);
      Locker.findOne.mockResolvedValue(null);

      await expect(update(fakeLocker.id, { monthlyCharge: 300 }, { id: fakeBranch.user_id })).rejects.toThrow(
        'Locker not found'
      );
    });
  });

  describe('deallocate', () => {
    it('should deallocate a locker successfully', async () => {
      Branch.findOne.mockResolvedValueOnce(fakeBranch);
      Locker.findOne.mockResolvedValue(fakeLocker);
      UserLocker.findOne.mockResolvedValueOnce({
        update: jest.fn(),
      });

      const result = await deallocate(fakeLocker.id, { id: fakeBranch.user_id });

      expect(result).toEqual({ message: 'Locker deallocated successfully' });
      expect(fakeLocker.update).toHaveBeenCalledWith({ status: STATUS.INACTIVE }, expect.any(Object));
    });

    it('should throw an error if locker is not currently assigned', async () => {
      Branch.findOne.mockResolvedValueOnce(fakeBranch);
      Locker.findOne.mockResolvedValueOnce(fakeLocker);
      UserLocker.findOne.mockResolvedValue(null);

      await expect(deallocate(fakeLocker.id, { id: fakeBranch.user_id })).rejects.toThrow(
        'Locker is not currently assigned'
      );
    });
  });
});
