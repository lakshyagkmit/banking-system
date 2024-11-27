// transactionService.test.js
const { User, Transaction, UserAccount, Branch, sequelize } = require('../../src/models');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const notificationHelper = require('../../src/helpers/notifications.helper');
const transactionService = require('../../src/services/transactions.service');
const {
  ACCOUNT_TYPES,
  STATUS,
  ROLES,
  TRANSACTION_STATUS,
  TRANSACTION_TYPES,
} = require('../../src/constants/constants');

// Mocking required modules and functions
jest.mock('../../src/models');
jest.mock('../../src/helpers/commonFunctions.helper');
jest.mock('../../src/helpers/notifications.helper');

// Mocks for Sequelize methods
User.findByPk = jest.fn();
UserAccount.findByPk = jest.fn();
UserAccount.findOne = jest.fn();
Transaction.create = jest.fn();
Transaction.findAndCountAll = jest.fn();
Transaction.findOne = jest.fn();
Branch.findOne = jest.fn();
sequelize.transaction = jest.fn(() => ({
  commit: jest.fn(),
  rollback: jest.fn(),
}));

// Test for create function (Deposit, Withdrawal, Transfer)
describe('create transaction', () => {
  it('should process a withdrawal transaction successfully', async () => {
    const payload = {
      accountId: 1,
      data: {
        type: TRANSACTION_TYPES.WITHDRAWAL,
        amount: '100.00',
        fee: '5.00',
        paymentMethod: 'CARD',
      },
      user: { id: 1 },
    };

    const account = {
      id: 1,
      balance: '200.00',
      type: ACCOUNT_TYPES.SAVINGS,
      status: STATUS.ACTIVE,
      update: jest.fn(),
    };
    const customer = { email: 'customer@example.com' };

    User.findByPk.mockResolvedValue(customer);
    UserAccount.findByPk.mockResolvedValue(account);
    Transaction.create.mockResolvedValue({});
    notificationHelper.transactionNotification.mockResolvedValue();

    const result = await transactionService.create(payload);

    expect(result.message).toBe('Withdrawal successful');
    expect(account.update).toHaveBeenCalledWith({ balance: '95.00' }, { transaction: expect.any(Object) });
    expect(notificationHelper.transactionNotification).toHaveBeenCalledWith(
      customer.email,
      TRANSACTION_TYPES.WITHDRAWAL,
      100,
      200,
      95
    );
  });

  it('should throw error if withdrawal exceeds available balance', async () => {
    const payload = {
      accountId: 1,
      data: {
        type: TRANSACTION_TYPES.WITHDRAWAL,
        amount: '500.00',
        fee: '5.00',
        paymentMethod: 'CARD',
      },
      user: { id: 1 },
    };

    const account = { id: 1, balance: '200.00', status: STATUS.ACTIVE };

    User.findByPk.mockResolvedValue({});
    UserAccount.findByPk.mockResolvedValue(account);

    await expect(transactionService.create(payload)).rejects.toThrowError(
      'Insufficient funds for withdrawal'
    );
  });

  it('should process a deposit transaction successfully', async () => {
    const payload = {
      accountId: 1,
      data: {
        type: TRANSACTION_TYPES.DEPOSIT,
        amount: '150.00',
        fee: '0.00',
        paymentMethod: 'TRANSFER',
      },
      user: { id: 1 },
    };

    const account = { id: 1, balance: '200.00', status: STATUS.ACTIVE, update: jest.fn() };
    const customer = { email: 'customer@example.com' };

    User.findByPk.mockResolvedValue(customer);
    UserAccount.findByPk.mockResolvedValue(account);
    Transaction.create.mockResolvedValue({});
    notificationHelper.transactionNotification.mockResolvedValue();

    const result = await transactionService.create(payload);

    expect(result.message).toBe('Deposit successful');
    expect(account.update).toHaveBeenCalledWith(
      { balance: '350.00', status: STATUS.ACTIVE },
      { transaction: expect.any(Object) }
    );
    expect(notificationHelper.transactionNotification).toHaveBeenCalledWith(
      customer.email,
      TRANSACTION_TYPES.DEPOSIT,
      150,
      200,
      350
    );
  });

  it('should process a transfer transaction successfully', async () => {
    const payload = {
      accountId: 1,
      data: {
        type: TRANSACTION_TYPES.TRANSFER,
        amount: '100.00',
        fee: '5.00',
        paymentMethod: 'TRANSFER',
        accountNo: '1234567890',
      },
      user: { id: 1 },
    };

    const account = { id: 1, balance: '200.00', status: STATUS.ACTIVE, update: jest.fn() };
    const toAccount = { id: 2, balance: '50.00', update: jest.fn() };
    const customer = { email: 'customer@example.com' };
    const toCustomer = { email: 'toCustomer@example.com' };

    User.findByPk.mockResolvedValue(customer);
    UserAccount.findByPk.mockResolvedValue(account);
    UserAccount.findOne.mockResolvedValue(toAccount);
    Transaction.create.mockResolvedValue({});
    notificationHelper.transactionNotification.mockResolvedValue();

    const result = await transactionService.create(payload);

    expect(result.message).toBe('Transfer successful');
    expect(account.update).toHaveBeenCalledWith({ balance: '95.00' }, { transaction: expect.any(Object) });
    expect(toAccount.update).toHaveBeenCalledWith(
      { balance: '150.00', status: STATUS.ACTIVE },
      { transaction: expect.any(Object) }
    );
    expect(notificationHelper.transactionNotification).toHaveBeenCalledWith(
      customer.email,
      TRANSACTION_TYPES.TRANSFER,
      100,
      200,
      95
    );
    expect(notificationHelper.transactionNotification).toHaveBeenCalledWith(
      toCustomer.email,
      TRANSACTION_TYPES.TRANSFER,
      100,
      50,
      150
    );
  });

  it('should throw error if source and destination accounts are the same', async () => {
    const payload = {
      accountId: 1,
      data: {
        type: TRANSACTION_TYPES.TRANSFER,
        amount: '100.00',
        fee: '5.00',
        paymentMethod: 'TRANSFER',
        accountNo: '1234567890',
      },
      user: { id: 1 },
    };

    const account = { id: 1, balance: '200.00', status: STATUS.ACTIVE };

    UserAccount.findByPk.mockResolvedValue(account);
    UserAccount.findOne.mockResolvedValue(account);

    await expect(transactionService.create(payload)).rejects.toThrowError(
      'Source account and destination account cannot be same'
    );
  });
});

// Test for index function (list transactions)
describe('index transactions', () => {
  it('should return a paginated list of transactions for a customer', async () => {
    const payload = {
      accountId: 1,
      query: { page: 1, limit: 10 },
      user: { id: 1, roles: [ROLES['103']] },
    };

    Transaction.findAndCountAll.mockResolvedValue({
      count: 5,
      rows: [{ id: 1, type: 'DEPOSIT', amount: 100 }],
    });

    const result = await transactionService.index(payload);

    expect(result).toHaveProperty('totalItems');
    expect(result.transactions.length).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it('should throw error if no transactions found', async () => {
    const payload = {
      accountId: 1,
      query: { page: 1, limit: 10 },
      user: { id: 1, roles: [ROLES['103']] },
    };

    Transaction.findAndCountAll.mockResolvedValue({
      count: 0,
      rows: [],
    });

    await expect(transactionService.index(payload)).rejects.toThrowError('No transactions found');
  });
});

// Test for view function (view a single transaction)
describe('view transaction', () => {
  it('should return transaction details', async () => {
    const payload = {
      params: { accountId: 1, transactionId: 1 },
      user: { id: 1, roles: [ROLES['103']] },
    };

    const transaction = { id: 1, type: 'DEPOSIT', amount: 100 };

    Transaction.findOne.mockResolvedValue(transaction);

    const result = await transactionService.view(payload);

    expect(result).toHaveProperty('id', 1);
    expect(result.type).toBe('DEPOSIT');
  });

  it('should throw error if transaction not found', async () => {
    const payload = {
      params: { accountId: 1, transactionId: 1 },
      user: { id: 1, roles: [ROLES['103']] },
    };

    Transaction.findOne.mockResolvedValue(null);

    await expect(transactionService.view(payload)).rejects.toThrowError('Transaction not found');
  });
});
