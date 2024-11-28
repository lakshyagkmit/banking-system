const { create, index, view, update } = require('../../src/services/transactions.service');
const { UserAccount, Transaction, Branch, User, sequelize } = require('../../src/models');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const notificationHelper = require('../../src/helpers/notifications.helper');
const {
  ACCOUNT_TYPES,
  STATUS,
  ROLES,
  TRANSACTION_STATUS,
  TRANSACTION_TYPES,
} = require('../../src/constants/constants');

// Mocking models and helper functions
jest.mock('../../src/models', () => ({
  UserAccount: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
  },
  Transaction: {
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  },
  Branch: {
    findOne: jest.fn(),
  },
  User: {
    findOne: jest.fn(),
  },
  sequelize: {
    transaction: jest.fn(),
  },
}));

jest.mock('../../src/helpers/commonFunctions.helper', () => ({
  customError: jest.fn(),
}));

jest.mock('../../src/helpers/notifications.helper', () => ({
  transactionNotification: jest.fn(),
  failedTransactionNotification: jest.fn(),
}));

// Tests for create function
describe('Account Service - Create Transaction Tests', () => {
  let payload;
  let mockTransaction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
    payload = {
      accountId: 1,
      data: {
        type: TRANSACTION_TYPES.DEPOSIT,
        amount: '1000',
        fee: '10',
        paymentMethod: 'credit_card',
        accountNo: '12345',
      },
      user: { id: 1, roles: [ROLES['103']] },
    };
  });

  // Test for successful deposit
  test('should create a deposit transaction successfully', async () => {
    const mockAccount = { id: 1, balance: 5000, type: ACCOUNT_TYPES.SAVINGS };
    jest.spyOn(UserAccount, 'findOne').mockResolvedValue(mockAccount);
    jest.spyOn(Transaction, 'create').mockResolvedValue({});
    jest.spyOn(UserAccount, 'update').mockResolvedValue([1]);
    jest.spyOn(sequelize, 'transaction').mockResolvedValue(mockTransaction);

    const result = await create(payload);
    expect(Transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1000,
        fee: 10,
        balance_before: 5000,
        balance_after: 6000,
      })
    );
    expect(result).toBe('Deposit successful');
  });

  // Test for insufficient funds during withdrawal
  test('should return error if insufficient funds during withdrawal', async () => {
    payload.data.type = TRANSACTION_TYPES.WITHDRAWAL;
    const mockAccount = { id: 1, balance: 500, type: ACCOUNT_TYPES.SAVINGS };
    jest.spyOn(UserAccount, 'findOne').mockResolvedValue(mockAccount);

    const result = await create(payload);
    expect(commonHelper.customError).toHaveBeenCalledWith('Insufficient funds for withdrawal', 409);
  });

  // Test for account not found
  test('should return error if account is not found', async () => {
    const mockAccount = null;
    jest.spyOn(UserAccount, 'findOne').mockResolvedValue(mockAccount);

    const result = await create(payload);
    expect(commonHelper.customError).toHaveBeenCalledWith('Account not found', 404);
  });

  // Test for blocked account
  test('should return error if account is inactive during withdrawal or transfer', async () => {
    payload.data.type = TRANSACTION_TYPES.WITHDRAWAL;
    const mockAccount = { id: 1, balance: 1000, status: STATUS.INACTIVE };
    jest.spyOn(UserAccount, 'findOne').mockResolvedValue(mockAccount);

    const result = await create(payload);
    expect(commonHelper.customError).toHaveBeenCalledWith(
      'Account inactive, cannot proceed with transaction',
      400
    );
  });

  // Test for transfer with same source and destination account
  test('should return error if source and destination accounts are the same', async () => {
    payload.data.type = TRANSACTION_TYPES.TRANSFER;
    payload.data.accountNo = '12345'; // Same as source account number
    const mockAccount = { id: 1, balance: 5000, status: STATUS.ACTIVE, number: '12345' };
    jest.spyOn(UserAccount, 'findOne').mockResolvedValue(mockAccount);

    const result = await create(payload);
    expect(commonHelper.customError).toHaveBeenCalledWith(
      'Source and destination accounts cannot be the same',
      409
    );
  });

  // Test for transfer to non-existent account
  test('should return error if destination account does not exist', async () => {
    payload.data.type = TRANSACTION_TYPES.TRANSFER;
    payload.data.accountNo = '67890'; // Non-existent account
    const mockAccount = { id: 1, balance: 5000, status: STATUS.ACTIVE, number: '12345' };
    jest.spyOn(UserAccount, 'findOne').mockResolvedValue(mockAccount);
    jest.spyOn(UserAccount, 'findOne').mockResolvedValueOnce(mockAccount); // for source account
    jest.spyOn(UserAccount, 'findOne').mockResolvedValueOnce(null); // for destination account

    const result = await create(payload);
    expect(commonHelper.customError).toHaveBeenCalledWith('Destination account not found', 400);
  });

  // Test for successful transfer
  test('should transfer funds between accounts successfully', async () => {
    payload.data.type = TRANSACTION_TYPES.TRANSFER;
    payload.data.accountNo = '67890';
    const mockAccount = { id: 1, balance: 5000, status: STATUS.ACTIVE, number: '12345' };
    const mockToAccount = { id: 2, balance: 2000, status: STATUS.ACTIVE, number: '67890' };
    jest.spyOn(UserAccount, 'findOne').mockResolvedValueOnce(mockAccount);
    jest.spyOn(UserAccount, 'findOne').mockResolvedValueOnce(mockToAccount);
    jest.spyOn(UserAccount, 'update').mockResolvedValue([1, 1]);
    jest.spyOn(Transaction, 'create').mockResolvedValue({});
    jest.spyOn(sequelize, 'transaction').mockResolvedValue(mockTransaction);

    const result = await create(payload);
    expect(result).toBe('Transfer successful');
  });
});

// Tests for index function
describe('Account Service - List Transactions Tests', () => {
  let payload;
  beforeEach(() => {
    payload = {
      accountId: 1,
      query: { page: 1, limit: 10 },
      user: { id: 1, roles: [ROLES['103']] },
    };
  });

  // Test for successful transaction list retrieval
  test('should list transactions successfully', async () => {
    const mockAccount = { id: 1 };
    const mockTransactions = { count: 5, rows: [{ id: 1 }, { id: 2 }] };
    jest.spyOn(UserAccount, 'findByPk').mockResolvedValue(mockAccount);
    jest.spyOn(Transaction, 'findAndCountAll').mockResolvedValue(mockTransactions);

    const result = await index(payload);
    expect(result.totalItems).toBe(5);
    expect(result.transactions.length).toBe(2);
  });

  // Test for no transactions found
  test('should return error if no transactions found', async () => {
    const mockAccount = { id: 1 };
    jest.spyOn(UserAccount, 'findByPk').mockResolvedValue(mockAccount);
    jest.spyOn(Transaction, 'findAndCountAll').mockResolvedValue({ count: 0, rows: [] });

    const result = await index(payload);
    expect(commonHelper.customError).toHaveBeenCalledWith(
      'Cannot access other customer transaction history',
      403
    );
  });

  // Test for access control for branch managers
  test('should return error for branch managers accessing other branch accounts', async () => {
    const mockAccount = { id: 1, branch_id: 2 };
    const mockBranch = { id: 1 };
    jest.spyOn(UserAccount, 'findByPk').mockResolvedValue(mockAccount);
    jest.spyOn(Branch, 'findOne').mockResolvedValue(mockBranch);

    const result = await index(payload);
    expect(commonHelper.customError).toHaveBeenCalledWith(
      'Cannot access other customer transaction history',
      403
    );
  });

  // Test for access control for customers
  test('should return error for customers accessing other users transactions', async () => {
    const mockAccount = { id: 1, user_id: 2 };
    jest.spyOn(UserAccount, 'findByPk').mockResolvedValue(mockAccount);

    const result = await index(payload);
    expect(commonHelper.customError).toHaveBeenCalledWith(
      'Cannot access other customer transaction history',
      403
    );
  });
});

// Tests for view function
describe('Account Service - View Transaction Tests', () => {
  let payload;
  beforeEach(() => {
    payload = {
      accountId: 1,
      transactionId: 1,
      user: { id: 1, roles: [ROLES['103']] },
    };
  });

  // Test for successful transaction retrieval
  test('should retrieve transaction details successfully', async () => {
    const mockTransaction = { id: 1, account_id: 1 };
    const mockAccount = { id: 1 };
    jest.spyOn(Transaction, 'findOne').mockResolvedValue(mockTransaction);
    jest.spyOn(UserAccount, 'findByPk').mockResolvedValue(mockAccount);

    const result = await view(payload);
    expect(result).toBe(mockTransaction);
  });

  // Test for transaction not found
  test('should return error if transaction not found', async () => {
    jest.spyOn(Transaction, 'findOne').mockResolvedValue(null);

    const result = await view(payload);
    expect(commonHelper.customError).toHaveBeenCalledWith(
      'Cannot access other customer transaction history',
      403
    );
  });
});

// Tests for update function
describe('Account Service - Update Transaction Tests', () => {
  let payload;
  beforeEach(() => {
    payload = {
      accountId: 1,
      transactionId: 1,
      user: { id: 1, roles: [ROLES['102']] },
    };
  });

  // Test for updating transaction status to failed
  test('should update transaction status to failed successfully', async () => {
    const mockTransaction = { id: 1, account_id: 1, status: TRANSACTION_STATUS.PENDING, update: jest.fn() };
    jest.spyOn(Transaction, 'findOne').mockResolvedValue(mockTransaction);

    const result = await update(payload);
    expect(result).toBe(undefined);
    expect(mockTransaction.update).toHaveBeenCalledWith({ status: TRANSACTION_STATUS.FAILED });
  });

  // Test for failed transaction already failed
  test('should return error if transaction is already failed', async () => {
    const mockTransaction = { id: 1, account_id: 1, status: TRANSACTION_STATUS.FAILED };
    jest.spyOn(Transaction, 'findOne').mockResolvedValue(mockTransaction);

    const result = await update(payload);
    expect(commonHelper.customError).toHaveBeenCalledWith(
      'Cannot access other customer transaction history',
      403
    );
  });

  // Test for non-pending transactions
  test('should return error for non-pending transactions', async () => {
    const mockTransaction = { id: 1, account_id: 1, status: TRANSACTION_STATUS.COMPLETED };
    jest.spyOn(Transaction, 'findOne').mockResolvedValue(mockTransaction);

    const result = await update(payload);
    expect(commonHelper.customError).toHaveBeenCalledWith(
      'Cannot access other customer transaction history',
      403
    );
  });
});
