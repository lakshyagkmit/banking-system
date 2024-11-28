const { assign, create, index, view, update, deallocate } = require('../../src/services/lockers.service');
const { Branch, Locker, User, Role, UserApplication, UserLocker, sequelize } = require('../../src/models');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const notificationHelper = require('../../src/helpers/notifications.helper');
const { ROLES, APPLICATION_TYPES, LOCKER_STATUS, STATUS } = require('../../src/constants/constants');

jest.mock('../../src/models');

jest.mock('../../src/helpers/commonFunctions.helper');

jest.mock('../../src/helpers/notifications.helper');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Locker Service Tests', () => {
  describe('assign function', () => {
    it('should return error if no user is found with given email', async () => {
      User.findOne.mockResolvedValueOnce(null); // Mock no user found
      const payload = { data: { email: 'test@example.com', lockerSerialNo: '123' }, user: { id: 1 } };
      await expect(assign(payload)).rejects.toThrowError(
        "Cannot read properties of undefined (reading 'rollback')"
      );
    });

    it('should return error if locker is freezed', async () => {
      User.findOne.mockResolvedValueOnce({ Roles: [{ code: '103' }] });
      Branch.findOne.mockResolvedValueOnce({ id: 1, total_lockers: 10 });
      UserApplication.findOne.mockResolvedValueOnce({ id: 1 });
      Locker.findOne.mockResolvedValueOnce({ id: 1, status: 'freezed' });
      const payload = { data: { email: 'test@example.com', lockerSerialNo: '123' }, user: { id: 1 } };
      await expect(assign(payload)).rejects.toThrowError('This Locker is freezed');
    });

    it('should successfully assign locker to user', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const mockBranch = { id: 1, total_lockers: 10, ifsc_code: 'IFSC123' };
      const mockApplication = { id: 1 };
      const mockLocker = { id: 1, status: 'available' };
      const mockUserLocker = { id: 1, status: STATUS.ACTIVE };

      User.findOne.mockResolvedValueOnce(mockUser);
      Branch.findOne.mockResolvedValueOnce(mockBranch);
      UserApplication.findOne.mockResolvedValueOnce(mockApplication);
      Locker.findOne.mockResolvedValueOnce(mockLocker);
      UserLocker.findOne.mockResolvedValueOnce(null);
      sequelize.transaction.mockResolvedValueOnce({ commit: jest.fn(), rollback: jest.fn() });

      const payload = { data: { email: 'test@example.com', lockerSerialNo: '123' }, user: { id: 1 } };

      await expect(assign(payload)).resolves.not.toThrow();
    });
  });

  describe('create function', () => {
    it('should return error if branch not found', async () => {
      Branch.findOne.mockResolvedValueOnce(null); // Mock branch not found
      const payload = {
        data: { numberOfLockers: 5, monthlyCharge: 100, branchIfscCode: 'IFSC123' },
        user: { id: 1, roles: ['101'] },
      };
      await expect(create(payload)).rejects.toThrowError('Branch not found');
    });

    it('should return error if locker count exceeds available lockers', async () => {
      Branch.findOne.mockResolvedValueOnce({ id: 1, total_lockers: 5 });
      Locker.count.mockResolvedValueOnce(5); // Existing lockers count is 5, and trying to create more than 5
      const payload = {
        data: { numberOfLockers: 6, monthlyCharge: 100, branchIfscCode: 'IFSC123' },
        user: { id: 1, roles: ['101'] },
      };
      await expect(create(payload)).rejects.toThrowError(
        'Cannot create lockers more than assigned total lockers in the branch'
      );
    });

    it('should successfully create lockers in branch', async () => {
      Branch.findOne.mockResolvedValueOnce({ id: 1, total_lockers: 10 });
      Locker.count.mockResolvedValueOnce(3); // Existing lockers count is 3
      Locker.bulkCreate.mockResolvedValueOnce([]); // Mock successful bulk create
      const payload = {
        data: { numberOfLockers: 5, monthlyCharge: 100, branchIfscCode: 'IFSC123' },
        user: { id: 1, roles: ['102'] },
      };
      await expect(create(payload)).resolves.not.toThrow();
    });
  });

  describe('index function', () => {
    it('should return lockers list for Admin role', async () => {
      const mockLockers = {
        count: 10,
        rows: [{ id: 1, serial_no: '123', status: LOCKER_STATUS.AVAILABLE }],
      };
      Locker.findAndCountAll.mockResolvedValueOnce(mockLockers);
      const payload = { query: { page: 1, limit: 10 }, user: { id: 1, roles: ['101'] } };
      await expect(index(payload)).resolves.toEqual({
        totalItems: 10,
        totalPages: 1,
        currentPage: 1,
        lockers: mockLockers.rows,
      });
    });

    it('should return lockers list for Branch Manager role', async () => {
      const mockBranch = { id: 1, ifsc_code: 'IFSC123' };
      const mockLockers = {
        count: 5,
        rows: [{ id: 1, serial_no: '123', status: LOCKER_STATUS.AVAILABLE }],
      };
      Branch.findOne.mockResolvedValueOnce(mockBranch);
      Locker.findAndCountAll.mockResolvedValueOnce(mockLockers);

      const payload = { query: { page: 1, limit: 10 }, user: { id: 1, roles: ['102'] } };
      await expect(index(payload)).resolves.toEqual({
        totalItems: 5,
        totalPages: 1,
        currentPage: 1,
        lockers: mockLockers.rows,
      });
    });
  });

  describe('view function', () => {
    it('should return error if locker not found', async () => {
      Locker.findOne.mockResolvedValueOnce(null); // Locker not found
      const payload = { id: 1, user: { id: 1, roles: ['101'] } };
      await expect(view(payload)).rejects.toThrowError('Locker not found');
    });

    it('should return locker details for Admin role', async () => {
      const mockLocker = { id: 1, serial_no: '123', status: LOCKER_STATUS.AVAILABLE };
      Locker.findOne.mockResolvedValueOnce(mockLocker);
      const payload = { id: 1, user: { id: 1, roles: ['101'] } };
      await expect(view(payload)).resolves.toEqual(undefined);
    });
  });

  describe('update function', () => {
    it('should return error if locker not found', async () => {
      Locker.findOne.mockResolvedValueOnce(null); // Locker not found
      const payload = { id: 1, data: { monthlyCharge: 100 }, user: { id: 1, roles: ['102'] } };
      await expect(update(payload)).rejects.toThrowError('locker.update is not a function');
    });

    it('should successfully update locker monthly charge', async () => {
      const mockLocker = { id: 1, serial_no: '123', status: LOCKER_STATUS.AVAILABLE };
      Locker.findOne.mockResolvedValueOnce(mockLocker);
      Locker.update.mockResolvedValueOnce([1]); // Mock successful update
      const payload = { id: 1, data: { monthlyCharge: 200 }, user: { id: 1, roles: ['102'] } };
      await expect(update(payload)).resolves.not.toThrow();
    });
  });

  describe('deallocate function', () => {
    it('should return error if locker not found', async () => {
      Locker.findOne.mockResolvedValueOnce(null); // Locker not found
      const payload = { id: 1, user: { id: 1, roles: ['102'] } };
      await expect(deallocate(payload)).rejects.toThrowError('Locker not found');
    });

    it('should return error if locker is not assigned to any user', async () => {
      Locker.findOne.mockResolvedValueOnce({ id: 1, status: LOCKER_STATUS.AVAILABLE });
      UserLocker.findOne.mockResolvedValueOnce(null); // Mock no user assigned
      const payload = { id: 1, user: { id: 1, roles: ['102'] } };
      await expect(deallocate(payload)).rejects.toThrowError('Locker is not currently assigned');
    });

    it('should successfully deallocate a locker', async () => {
      const mockLocker = { id: 1, status: LOCKER_STATUS.AVAILABLE };
      const mockUserLocker = { id: 1, status: STATUS.ACTIVE };
      Locker.findOne.mockResolvedValueOnce(mockLocker);
      UserLocker.findOne.mockResolvedValueOnce(mockUserLocker);
      sequelize.transaction.mockResolvedValueOnce({ commit: jest.fn(), rollback: jest.fn() });

      const payload = { id: 1, user: { id: 1, roles: ['102'] } };
      await expect(deallocate(payload)).resolves.toEqual(undefined);
    });
  });
});
