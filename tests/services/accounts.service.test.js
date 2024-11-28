const { create, index, view, update, remove } = require('../../src/services/accounts.service');
const { User, Branch, UserApplication, UserAccount, AccountPolicy, sequelize } = require('../../src/models');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const notificationHelper = require('../../src/helpers/notifications.helper');
const { ROLES, ACCOUNT_TYPES } = require('../../src/constants/constants');
const userHelper = require('../../src/helpers/users.helper');

// Mock the models and helpers
jest.mock('../../src/models');

jest.mock('../../src/helpers/commonFunctions.helper');

jest.mock('../../src/helpers/notifications.helper');

jest.mock('../../src/helpers/users.helper');

jest.mock('../../src/constants/constants');

// --- Unit Tests for the 'create' function ---

describe('create function', () => {
  let payload;

  beforeEach(() => {
    payload = {
      data: {
        userId: 1,
        type: 'savings',
        nominee: 'John Doe',
        branchIfscCode: 'IFSC1234',
      },
      user: {
        id: 1,
        role: '103', // Customer
      },
    };
  });

  it('should create a new account successfully', async () => {
    User.findOne.mockResolvedValue({
      id: 1,
      Roles: [{ code: ROLES['103'] }],
      email: 'customer@example.com',
    });

    Branch.findOne.mockResolvedValue({ id: 1, ifsc_code: 'IFSC1234' });
    UserApplication.findOne.mockResolvedValue({ destroy: jest.fn() });
    AccountPolicy.findOne.mockResolvedValue({ id: 1, interest_rate: 5 });
    UserAccount.create.mockResolvedValueOnce({ id: 1, number: '1234567890' });
    sequelize.transaction.mockResolvedValue({
      commit: jest.fn(),
      rollback: jest.fn(),
    });

    const result = await create(payload);

    expect(result).toHaveProperty('id');
    expect(User.findOne).toHaveBeenCalled();
    expect(Branch.findOne).toHaveBeenCalledWith({ where: { ifsc_code: 'IFSC1234' } });
    expect(UserAccount.create).toHaveBeenCalled();
  });

  it('should return error if user role is invalid', async () => {
    payload.user.role = '104';

    User.findOne.mockResolvedValueOnce({
      id: 1,
      Roles: [{ code: '104' }],
    });

    const result = await create(payload);

    expect(commonHelper.customError).toHaveBeenCalledWith(
      'Branch manager is not authorized to create a branch.',
      403
    );
  });

  it('should handle error if branch not found', async () => {
    User.findOne.mockResolvedValue({
      id: 1,
      Roles: [{ code: ROLES['103'] }],
    });
    Branch.findOne.mockResolvedValue(null); // Branch not found

    const result = await create(payload);

    expect(commonHelper.customError).toHaveBeenCalledWith(
      'Branch manager is not authorized to create a branch.',
      403
    );
  });
});

// --- Unit Tests for the 'index' function ---

describe('index function', () => {
  let payload;

  beforeEach(() => {
    payload = {
      query: { page: 1, limit: 10, ifscCode: 'IFSC1234' },
      user: {
        id: 1,
        roles: [{ code: ROLES['101'] }],
      },
    };
  });

  it('should list all accounts for admin', async () => {
    UserAccount.findAndCountAll.mockResolvedValue({
      count: 10,
      rows: [{ id: 1, number: '1234567890' }],
    });

    const result = await index(payload);

    expect(result).toHaveProperty('totalItems', 10);
    expect(result).toHaveProperty('accounts');
  });

  it('should return error if no accounts are found', async () => {
    UserAccount.findAndCountAll.mockResolvedValueOnce({ count: 0, rows: [] });

    const result = await index(payload);

    expect(commonHelper.customError).toHaveBeenCalledWith(
      'Branch manager is not authorized to create a branch.',
      403
    );
  });
});

// --- Unit Tests for the 'view' function ---

describe('view function', () => {
  let payload;

  beforeEach(() => {
    payload = {
      id: 1,
      user: {
        id: 1,
        roles: [{ code: ROLES['103'] }], // Customer
      },
    };
  });

  it('should retrieve account details successfully for a customer', async () => {
    UserAccount.findOne.mockResolvedValue({ id: 1, number: '1234567890', user_id: 1 });

    const result = await view(payload);

    expect(result).toHaveProperty('id', 1);
  });

  it('should return error if account not found', async () => {
    UserAccount.findOne.mockResolvedValue(null);

    const result = await view(payload);

    expect(commonHelper.customError).toHaveBeenCalledWith('Account not found', 404);
  });
});

// --- Unit Tests for the 'update' function ---

describe('update function', () => {
  let payload;

  beforeEach(() => {
    payload = {
      id: 1,
      data: { nominee: 'Jane Doe' },
      user: {
        id: 1,
        roles: [{ code: ROLES['102'] }], // Branch Manager
      },
    };
  });

  it('should return error if branch manager tries to update account outside their branch', async () => {
    UserAccount.findOne.mockResolvedValue({ id: 1, branch_id: 2, update: jest.fn() });
    Branch.findOne.mockResolvedValue({ id: 1, branch_manager_id: 1 });

    const result = await update(payload);

    expect(commonHelper.customError).toHaveBeenCalledWith('Account not found', 404);
  });

  it('should return error if account not found', async () => {
    UserAccount.findOne.mockResolvedValue(null);

    const result = await update(payload);

    expect(commonHelper.customError).toHaveBeenCalledWith('Account not found', 404);
  });
});

// --- Unit Tests for the 'remove' function ---

describe('remove function', () => {
  let payload;

  beforeEach(() => {
    payload = {
      id: 1,
      user: {
        id: 1,
        roles: [{ code: ROLES['102'] }], // Branch Manager
      },
    };
  });

  it('should return error if branch manager tries to delete account outside their branch', async () => {
    UserAccount.findOne.mockResolvedValue({ id: 1, branch_id: 2, destroy: jest.fn() });
    Branch.findOne.mockResolvedValue({ id: 1, branch_manager_id: 1 });

    const result = await remove(payload);

    expect(commonHelper.customError).toHaveBeenCalledWith('Account not found', 404);
  });

  it('should return error if account not found', async () => {
    UserAccount.findOne.mockResolvedValue(null);

    const result = await remove(payload);

    expect(commonHelper.customError).toHaveBeenCalledWith('Account not found', 404);
  });
});
