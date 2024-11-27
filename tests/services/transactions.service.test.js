const { create, index, view } = require('../../src/services/transactions.service');
const { User, UserAccount, Transaction, Branch } = require('../../src/models');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const notificationHelper = require('../../src/helpers/notifications.helper');
const {
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  ROLES,
  ACCOUNT_TYPES,
  STATUS,
} = require('../../src/constants/constants');
const userHelper = require('../../src/helpers/users.helper');
const sequelize = require('sequelize');

jest.mock('../../src/models', () => ({
  User: {
    findByPk: jest.fn(),
  },
  UserAccount: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
  },
  Transaction: {
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    findOne: jest.fn(),
  },
  Branch: {
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
}));

jest.mock('../../src/helpers/users.helper', () => ({
  getHighestRole: jest.fn(),
}));

describe('Transaction Service', () => {
  describe('create', () => {
    it('should create a withdrawal transaction successfully', async () => {
      const payload = {
        accountId: 1,
        data: {
          type: TRANSACTION_TYPES.WITHDRAWAL,
          amount: 1000,
          fee: 50,
          paymentMethod: 'Cash',
          accountNo: '123456',
        },
        user: { id: 1 },
      };

      User.findByPk.mockResolvedValue({ id: 1, email: 'user@example.com' });
      UserAccount.findByPk.mockResolvedValue({
        id: 1,
        balance: 2000,
        type: ACCOUNT_TYPES.SAVINGS,
        status: STATUS.ACTIVE,
        number: '123456',
        update: jest.fn(),
      });
      sequelize.transaction.mockResolvedValue({
        commit: jest.fn(),
        rollback: jest.fn(),
      });
      Transaction.create.mockResolvedValue({
        id: 1,
        account_id: 1,
        type: TRANSACTION_TYPES.WITHDRAWAL,
        amount: 1000,
        fee: 50,
        status: TRANSACTION_STATUS.COMPLETED,
      });

      const result = await create(payload);

      expect(result).toEqual({ message: 'Withdrawal successful' });
      expect(Transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          account_id: 1,
          type: TRANSACTION_TYPES.WITHDRAWAL,
          amount: 1000,
          fee: 50,
        })
      );
      expect(notificationHelper.transactionNotification).toHaveBeenCalledWith(
        'user@example.com',
        TRANSACTION_TYPES.WITHDRAWAL,
        1000,
        2000,
        950
      );
    });

    it('should return error if account balance is insufficient for withdrawal', async () => {
      const payload = {
        accountId: 1,
        data: {
          type: TRANSACTION_TYPES.WITHDRAWAL,
          amount: 5000,
          fee: 50,
          paymentMethod: 'Cash',
          accountNo: '123456',
        },
        user: { id: 1 },
      };

      UserAccount.findByPk.mockResolvedValue({
        id: 1,
        balance: 1000,
        type: ACCOUNT_TYPES.SAVINGS,
        status: STATUS.ACTIVE,
        number: '123456',
      });

      await create(payload);

      expect(commonHelper.customError).toHaveBeenCalledWith('Insufficient funds for withdrawal', 409);
    });

    it('should create a deposit transaction successfully', async () => {
      const payload = {
        accountId: 1,
        data: {
          type: TRANSACTION_TYPES.DEPOSIT,
          amount: 1000,
          fee: 0,
          paymentMethod: 'Cash',
          accountNo: '123456',
        },
        user: { id: 1 },
      };

      User.findByPk.mockResolvedValue({ id: 1, email: 'user@example.com' });
      UserAccount.findByPk.mockResolvedValue({
        id: 1,
        balance: 1000,
        type: ACCOUNT_TYPES.SAVINGS,
        status: STATUS.ACTIVE,
        number: '123456',
        update: jest.fn(),
      });
      sequelize.transaction.mockResolvedValue({
        commit: jest.fn(),
        rollback: jest.fn(),
      });
      Transaction.create.mockResolvedValue({
        id: 1,
        account_id: 1,
        type: TRANSACTION_TYPES.DEPOSIT,
        amount: 1000,
        fee: 0,
        status: TRANSACTION_STATUS.COMPLETED,
      });

      const result = await create(payload);

      expect(result).toEqual({ message: 'Deposit successful' });
      expect(Transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          account_id: 1,
          type: TRANSACTION_TYPES.DEPOSIT,
          amount: 1000,
          fee: 0,
        })
      );
      expect(notificationHelper.transactionNotification).toHaveBeenCalledWith(
        'user@example.com',
        TRANSACTION_TYPES.DEPOSIT,
        1000,
        1000,
        2000
      );
    });

    it('should create a transfer transaction successfully', async () => {
      const payload = {
        accountId: 1,
        data: {
          type: TRANSACTION_TYPES.TRANSFER,
          amount: 500,
          fee: 50,
          paymentMethod: 'Bank Transfer',
          accountNo: '654321',
        },
        user: { id: 1 },
      };

      User.findByPk.mockResolvedValue({ id: 1, email: 'user@example.com' });
      UserAccount.findByPk.mockResolvedValue({
        id: 1,
        balance: 2000,
        type: ACCOUNT_TYPES.SAVINGS,
        status: STATUS.ACTIVE,
        number: '123456',
      });
      UserAccount.findOne.mockResolvedValue({
        id: 2,
        balance: 1000,
        number: '654321',
        update: jest.fn(),
      });
      Transaction.create.mockResolvedValue({
        id: 1,
        account_id: 1,
        account_no: '654321',
        type: TRANSACTION_TYPES.TRANSFER,
        amount: 500,
        fee: 50,
        status: TRANSACTION_STATUS.COMPLETED,
      });

      const result = await create(payload);

      expect(result).toEqual({ message: 'Transfer successful' });
      expect(Transaction.create).toHaveBeenCalledTimes(2);
      expect(notificationHelper.transactionNotification).toHaveBeenCalledTimes(2);
    });

    it('should return error if source and destination account are the same in transfer', async () => {
      const payload = {
        accountId: 1,
        data: {
          type: TRANSACTION_TYPES.TRANSFER,
          amount: 500,
          fee: 50,
          paymentMethod: 'Bank Transfer',
          accountNo: '123456',
        },
        user: { id: 1 },
      };

      await create(payload);

      expect(commonHelper.customError).toHaveBeenCalledWith(
        'Source account and destination account cannot be same',
        409
      );
    });

    it('should return error if destination account not found in transfer', async () => {
      const payload = {
        accountId: 1,
        data: {
          type: TRANSACTION_TYPES.TRANSFER,
          amount: 500,
          fee: 50,
          paymentMethod: 'Bank Transfer',
          accountNo: '654321',
        },
        user: { id: 1 },
      };

      UserAccount.findByPk.mockResolvedValue({ id: 1, balance: 1000, number: '123456' });
      UserAccount.findOne.mockResolvedValue(null); // Mock destination account not found

      await create(payload);

      expect(commonHelper.customError).toHaveBeenCalledWith('Destination account not found', 400);
    });
  });

  describe('index', () => {
    it('should list transactions for a user with admin role', async () => {
      const payload = {
        accountId: 1,
        query: { page: 1, limit: 10 },
        user: { id: 1, roles: [ROLES['102']] },
      };

      Branch.findOne.mockResolvedValue({ id: 1 });
      Transaction.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: [
          { id: 1, amount: 1000 },
          { id: 2, amount: 500 },
        ],
      });

      const result = await index(payload);

      expect(result).toEqual({
        totalItems: 2,
        totalPages: 1,
        currentPage: 1,
        transactions: [
          { id: 1, amount: 1000 },
          { id: 2, amount: 500 },
        ],
      });
    });

    it('should return error if no transactions are found', async () => {
      const payload = {
        accountId: 1,
        query: { page: 1, limit: 10 },
        user: { id: 1, roles: [ROLES['103']] },
      };

      Transaction.findAndCountAll.mockResolvedValue({
        count: 0,
        rows: [],
      });

      await index(payload);

      expect(commonHelper.customError).toHaveBeenCalledWith('No transactions found', 404);
    });
  });

  describe('view', () => {
    it('should return transaction details for a user with admin role', async () => {
      const payload = {
        params: { accountId: 1, transactionId: 1 },
        user: { id: 1, roles: [ROLES['102']] },
      };

      Transaction.findOne.mockResolvedValue({
        id: 1,
        amount: 1000,
        fee: 50,
        status: TRANSACTION_STATUS.COMPLETED,
      });

      const result = await view(payload);

      expect(result).toEqual({
        id: 1,
        amount: 1000,
        fee: 50,
        status: TRANSACTION_STATUS.COMPLETED,
      });
    });

    it('should return error if transaction not found', async () => {
      const payload = {
        params: { accountId: 1, transactionId: 999 },
        user: { id: 1, roles: [ROLES['102']] },
      };

      Transaction.findOne.mockResolvedValue(null);

      await view(payload);

      expect(commonHelper.customError).toHaveBeenCalledWith('Transaction not found', 404);
    });
  });
});
