const {
  assign,
  create,
  index,
  view,
  update,
  deallocate,
} = require('../../src/controllers/lockers.controller');
const { UserApplication, Branch, Locker, User, Role, UserLocker, sequelize } = require('../../src/models');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const userHelper = require('../../src/helpers/users.helper');
const notificationHelper = require('../../src/helpers/notifications.helper');
const { ROLES, APPLICATION_TYPES, LOCKER_STATUS, STATUS } = require('../../src/constants/constants');

// Mock everything
jest.mock('../../src/models', () => ({
  UserApplication: { findOne: jest.fn() },
  Branch: { findOne: jest.fn(), count: jest.fn() },
  Locker: {
    findOne: jest.fn(),
    bulkCreate: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    findAndCountAll: jest.fn(),
  },
  User: { findOne: jest.fn() },
  Role: { findOne: jest.fn() },
  UserLocker: { findOne: jest.fn(), create: jest.fn(), update: jest.fn() },
  sequelize: { transaction: jest.fn() },
}));

jest.mock('../../src/helpers/commonFunctions.helper', () => ({
  customError: jest.fn(),
  customErrorHandler: jest.fn(), // Add this mock for the customErrorHandler function
}));

jest.mock('../../src/helpers/users.helper', () => ({
  getHighestRole: jest.fn(),
}));

jest.mock('../../src/helpers/notifications.helper', () => ({
  lockerAssignedNotification: jest.fn(),
}));

describe('Locker Controller', () => {
  let mockPayload;
  let mockUser;

  beforeEach(() => {
    mockPayload = {
      data: {
        email: 'customer@example.com',
        lockerSerialNo: '12345',
        numberOfLockers: 5,
        monthlyCharge: 100,
        branchIfscCode: 'IFSC123',
      },
      user: {
        id: 1,
        roles: [{ code: ROLES['102'] }],
      },
    };

    mockUser = {
      id: 1,
      roles: [{ code: ROLES['102'] }],
    };

    jest.clearAllMocks();
  });

  // Test for 'assign' function
  it('should assign a locker to a customer', async () => {
    const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

    sequelize.transaction.mockResolvedValue(mockTransaction);
    User.findOne.mockResolvedValue({ id: 1, Roles: [{ code: ROLES['103'] }] });
    Branch.findOne.mockResolvedValue({ id: 1, total_lockers: 10 });
    UserApplication.findOne.mockResolvedValue({ id: 1 });
    Locker.findOne.mockResolvedValue({ id: 1, serial_no: '12345', status: 'available' });
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

  it('should return error if user does not exist or role is incorrect', async () => {
    User.findOne.mockResolvedValue(null);

    const result = await assign(mockPayload);
    expect(result).toEqual(commonHelper.customError('No user found', 404));
  });

  // Test for 'create' function
  it('should create lockers in a branch', async () => {
    const mockBranch = { id: 1, total_lockers: 10 };
    Branch.findOne.mockResolvedValue(mockBranch);
    Locker.count.mockResolvedValue(5);

    Locker.bulkCreate.mockResolvedValue([{ id: 1, serial_no: '1' }]);

    await create(mockPayload);

    expect(Branch.findOne).toHaveBeenCalledWith({
      where: { ifsc_code: mockPayload.data.branchIfscCode },
    });

    expect(Locker.count).toHaveBeenCalled();
    expect(Locker.bulkCreate).toHaveBeenCalled();
  });

  it('should return error if branch not found', async () => {
    Branch.findOne.mockResolvedValue(null);

    const result = await create(mockPayload);
    expect(result).toEqual(commonHelper.customError('Branch not found', 404));
  });

  // Test for 'index' function
  it('should list lockers based on user role', async () => {
    const mockLockers = { count: 5, rows: [{ id: 1, serial_no: '1' }] };
    Locker.findAndCountAll.mockResolvedValue(mockLockers);

    const result = await index(mockPayload);

    expect(Locker.findAndCountAll).toHaveBeenCalledWith({
      where: { branch_id: 1 },
      include: [{ model: Branch, where: { ifsc_code: 'IFSC123' }, attributes: ['id', 'ifsc_code'] }],
      offset: 0,
      limit: 5,
    });

    expect(result).toEqual({
      totalItems: 5,
      totalPages: 1,
      currentPage: 1,
      lockers: [{ id: 1, serial_no: '1' }],
    });
  });

  it('should return error if no lockers are found', async () => {
    Locker.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const result = await index(mockPayload);

    expect(result).toEqual(commonHelper.customError('No lockers found', 404));
  });

  // Test for 'view' function
  it('should return locker details for an admin user', async () => {
    const mockLocker = { id: 1, serial_no: '12345' };
    Locker.findAndCountAll.mockResolvedValue({ count: 1, rows: [mockLocker] });

    const result = await view({ id: 1, user: mockUser });

    expect(Locker.findAndCountAll).toHaveBeenCalledWith({
      where: { id: 1 },
      include: { model: User },
    });

    expect(result).toEqual({ count: 1, rows: [mockLocker] });
  });

  it('should return error if locker is not found', async () => {
    Locker.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const result = await view({ id: 1, user: mockUser });

    expect(result).toEqual(commonHelper.customError('Locker not found', 404));
  });

  // Test for 'update' function
  it('should update a locker', async () => {
    const mockLocker = { id: 1, serial_no: '12345', monthly_charge: 100 };
    Locker.findOne.mockResolvedValue(mockLocker);
    Locker.update.mockResolvedValue([1]);

    await update(mockPayload);

    expect(Locker.update).toHaveBeenCalledWith(
      { monthly_charge: mockPayload.data.monthlyCharge },
      { where: { id: 1 } }
    );
  });

  it('should return error if locker not found', async () => {
    Locker.findOne.mockResolvedValue(null);

    const result = await update(mockPayload);

    expect(result).toEqual(commonHelper.customError('Locker not found', 404));
  });

  // Test for 'deallocate' function
  it('should deallocate a locker', async () => {
    const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
    sequelize.transaction.mockResolvedValue(mockTransaction);

    const mockLocker = { id: 1, branch_id: 1, status: 'available' };
    const mockUserLocker = { id: 1, status: STATUS.ACTIVE };
    Locker.findOne.mockResolvedValueOnce(mockLocker);
    UserLocker.findOne.mockResolvedValueOnce(mockUserLocker);
    Locker.update.mockResolvedValueOnce([1]);
    UserLocker.update.mockResolvedValueOnce([1]);

    const result = await deallocate({ id: 1, user: mockUser });

    expect(Locker.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(UserLocker.findOne).toHaveBeenCalledWith({
      where: { locker_id: 1, status: STATUS.ACTIVE },
      transaction: mockTransaction,
    });
    expect(Locker.update).toHaveBeenCalledWith(
      { status: LOCKER_STATUS.AVAILABLE },
      { transaction: mockTransaction }
    );
    expect(UserLocker.update).toHaveBeenCalledWith(
      { status: STATUS.INACTIVE },
      { transaction: mockTransaction }
    );
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(result).toEqual({ message: 'Locker deallocated successfully' });
  });

  it('should return error if locker is not assigned', async () => {
    Locker.findOne.mockResolvedValue({ id: 1 });
    UserLocker.findOne.mockResolvedValue(null);

    const result = await deallocate({ id: 1, user: mockUser });

    expect(result).toEqual(commonHelper.customError('Locker is not currently assigned', 400));
  });
});
