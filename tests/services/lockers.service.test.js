const { assign, create, index, view, update, deallocate } = require('../../src/services/lockers.service');
const { User, Branch, Locker, UserLocker, UserApplication, sequelize } = require('../../src/models');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const notificationHelper = require('../../src/helpers/notifications.helper');
const { ROLES, LOCKER_STATUS, STATUS, APPLICATION_TYPES } = require('../../src/constants/constants');
const userHelper = require('../../src/helpers/users.helper');

jest.mock('../../src/models');
jest.mock('../../src/helpers/commonFunctions.helper', () => ({
  customError: jest.fn(),
  customErrorHandler: jest.fn(),
}));
jest.mock('../../src/helpers/notifications.helper');
jest.mock('../../src/helpers/users.helper');

describe('Locker Service', () => {
  // Test cases for the `assign` method
  describe('assign method', () => {
    const mockPayload = {
      data: {
        email: 'customer@example.com',
        lockerSerialNo: '12345',
      },
      user: { id: 1 },
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should assign a locker to a customer', async () => {
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      sequelize.transaction.mockResolvedValue(mockTransaction);
      User.findOne.mockResolvedValue({ id: 1, Roles: [{ code: ROLES['103'] }] });
      Branch.findOne.mockResolvedValue({ id: 1, total_lockers: 10, ifsc_code: 'IFSC123' });
      UserApplication.findOne.mockResolvedValue({
        id: 1,
        user_id: 1,
        branch_ifsc_code: 'IFSC123',
        type: APPLICATION_TYPES.LOCKER,
      });
      Locker.findOne.mockResolvedValue({ id: 1, serial_no: '12345', status: 'available', branch_id: 1 });
      UserLocker.findOne.mockResolvedValue(null);
      Locker.update.mockResolvedValue([1]);
      UserLocker.create.mockResolvedValue({ id: 1 });

      await assign(mockPayload);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: mockPayload.data.email },
        include: [{ model: Role, attributes: ['code'] }],
      });

      expect(commonHelper.customError).not.toHaveBeenCalled();
      expect(notificationHelper.lockerAssignedNotification).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should throw error if user is not found', async () => {
      User.findOne.mockResolvedValue(null); // User not found

      await expect(assign(mockPayload)).rejects.toThrow('No user found');
    });

    it('should throw error if customer does not have required role', async () => {
      User.findOne.mockResolvedValue({ id: 1, Roles: [{ code: ROLES['101'] }] }); // Different role

      await expect(assign(mockPayload)).rejects.toThrow('No user found');
    });

    it('should throw error if locker is freezed', async () => {
      User.findOne.mockResolvedValue({ id: 1, Roles: [{ code: ROLES['103'] }] });
      Branch.findOne.mockResolvedValue({ id: 1, total_lockers: 10 });
      UserApplication.findOne.mockResolvedValue({ id: 1, user_id: 1 });
      Locker.findOne.mockResolvedValue({ id: 1, serial_no: '12345', status: 'freezed' });

      await expect(assign(mockPayload)).rejects.toThrow('This Locker is freezed');
    });

    it('should throw error if user already has an active locker', async () => {
      User.findOne.mockResolvedValue({ id: 1, Roles: [{ code: ROLES['103'] }] });
      Branch.findOne.mockResolvedValue({ id: 1, total_lockers: 10 });
      UserApplication.findOne.mockResolvedValue({ id: 1, user_id: 1 });
      Locker.findOne.mockResolvedValue({ id: 1, serial_no: '12345', status: 'available' });
      UserLocker.findOne.mockResolvedValue({ id: 1, status: STATUS.ACTIVE });

      await expect(assign(mockPayload)).rejects.toThrow('User can only have one locker at a time');
    });

    it('should rollback transaction on error', async () => {
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      sequelize.transaction.mockResolvedValue(mockTransaction);
      User.findOne.mockResolvedValue({ id: 1, Roles: [{ code: ROLES['103'] }] });
      Branch.findOne.mockResolvedValue({ id: 1, total_lockers: 10 });
      UserApplication.findOne.mockResolvedValue({ id: 1, user_id: 1 });
      Locker.findOne.mockResolvedValue({ id: 1, serial_no: '12345', status: 'available' });
      UserLocker.findOne.mockResolvedValue(null);
      Locker.update.mockResolvedValue([1]);
      UserLocker.create.mockRejectedValue(new Error('DB Error')); // Simulate an error

      await expect(assign(mockPayload)).rejects.toThrow('DB Error');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  // Test cases for the `create` method
  describe('create method', () => {
    const mockPayload = {
      data: { numberOfLockers: 5, monthlyCharge: 100, branchIfscCode: 'IFSC123' },
      user: { id: 1, roles: [{ code: ROLES['102'] }] },
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create new lockers', async () => {
      Branch.findOne.mockResolvedValue({ id: 1, total_lockers: 10, ifsc_code: 'IFSC123' });
      Locker.count.mockResolvedValue(0);
      Locker.bulkCreate.mockResolvedValue([]);

      await create(mockPayload);

      expect(Locker.bulkCreate).toHaveBeenCalled();
    });

    it('should throw error if branch not found', async () => {
      Branch.findOne.mockResolvedValue(null); // Branch not found

      await expect(create(mockPayload)).rejects.toThrow('Branch not found');
    });

    it('should throw error if total lockers exceed limit', async () => {
      Branch.findOne.mockResolvedValue({ id: 1, total_lockers: 10 });
      Locker.count.mockResolvedValue(6); // 6 lockers already exist

      await expect(create(mockPayload)).rejects.toThrow(
        'Cannot create lockers more than assigned total lockers in the branch'
      );
    });
  });

  // Test cases for the `index` method
  describe('index method', () => {
    const mockPayload = {
      query: { page: 1, limit: 10, ifscCode: 'IFSC123' },
      user: { id: 1, roles: [{ code: ROLES['101'] }] },
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return lockers for admin role', async () => {
      Locker.findAndCountAll.mockResolvedValue({
        count: 10,
        rows: [{ id: 1, serial_no: '12345', status: 'available' }],
      });

      const result = await index(mockPayload);

      expect(result.totalItems).toBe(10);
      expect(Locker.findAndCountAll).toHaveBeenCalled();
    });

    it('should throw error if no lockers found', async () => {
      Locker.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await expect(index(mockPayload)).rejects.toThrow('No lockers found');
    });
  });

  // Test cases for the `view` method
  describe('view method', () => {
    const mockPayload = { id: 1, user: { id: 1, roles: [{ code: ROLES['101'] }] } };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return locker details for admin role', async () => {
      Locker.findOne.mockResolvedValue({ id: 1, serial_no: '12345' });

      const result = await view(mockPayload);

      expect(result.id).toBe(1);
      expect(Locker.findOne).toHaveBeenCalled();
    });

    it('should throw error if locker not found', async () => {
      Locker.findOne.mockResolvedValue(null);

      await expect(view(mockPayload)).rejects.toThrow('Locker not found');
    });
  });

  // Test cases for the `update` method
  describe('update method', () => {
    const mockPayload = {
      id: 1,
      data: { monthlyCharge: 200 },
      user: { id: 1, roles: [{ code: ROLES['102'] }] },
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should update locker details', async () => {
      Locker.findOne.mockResolvedValue({ id: 1, serial_no: '12345', update: jest.fn() });

      await update(mockPayload);

      expect(Locker.findOne).toHaveBeenCalled();
      expect(Locker.update).toHaveBeenCalledWith({ monthly_charge: 200 });
    });

    it('should throw error if locker not found', async () => {
      Locker.findOne.mockResolvedValue(null);

      await expect(update(mockPayload)).rejects.toThrow('Locker not found');
    });
  });

  // Test cases for the `deallocate` method
  describe('deallocate method', () => {
    const mockPayload = { id: 1, user: { id: 1, roles: [{ code: ROLES['102'] }] } };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should deallocate locker successfully', async () => {
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      sequelize.transaction.mockResolvedValue(mockTransaction);
      Locker.findOne.mockResolvedValue({ id: 1, status: 'assigned' });
      UserLocker.findOne.mockResolvedValue({ id: 1, status: STATUS.ACTIVE });
      Locker.update.mockResolvedValue([1]);
      UserLocker.update.mockResolvedValue([1]);

      const result = await deallocate(mockPayload);

      expect(result.message).toBe('Locker deallocated successfully');
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should throw error if locker is not assigned', async () => {
      Locker.findOne.mockResolvedValue({ id: 1, status: 'available' });
      UserLocker.findOne.mockResolvedValue(null);

      await expect(deallocate(mockPayload)).rejects.toThrow('Locker is not currently assigned');
    });
  });
});
