const { create, index, view } = require('../../src/services/transactions.service');
const { User, Transaction, UserAccount, Branch, sequelize } = require('../../src/models');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const notificationHelper = require('../../src/helpers/notifications.helper');
const {
  ACCOUNT_TYPES,
  STATUS,
  ROLES,
  TRANSACTION_STATUS,
  TRANSACTION_TYPES,
} = require('../../src/constants/constants');
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

describe('Transaction Service Tests', () => {
  let fakeUser, fakeAccount, fakeTransaction, fakeBranch, transaction;

  beforeEach(() => {
    fakeUser = {
      id: 1,
      email: 'test@example.com',
      role: ROLES['103'],
    };

    fakeAccount = {
      id: 1,
      user_id: fakeUser.id,
      type: ACCOUNT_TYPES.SAVINGS,
      balance: 1000,
      status: STATUS.ACTIVE,
      update: jest.fn(),
    };

    fakeTransaction = {
      id: 1,
      account_id: fakeAccount.id,
      type: TRANSACTION_TYPES.DEPOSIT,
      amount: 500,
      fee: 0,
      balance_before: 1000,
      balance_after: 1500,
      status: TRANSACTION_STATUS.COMPLETED,
      update: jest.fn(),
    };

    fakeBranch = {
      id: 1,
      user_id: fakeUser.id,
    };

    transaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    sequelize.transaction = jest.fn().mockResolvedValue(transaction);

    commonHelper.customError.mockImplementation((message, status) => {
      const err = new Error(message);
      err.statusCode = status;
      throw err;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  describe('create', () => {
    it('should handle deposit successfully', async () => {
      User.findByPk.mockResolvedValue(fakeUser);
      UserAccount.findByPk.mockResolvedValue(fakeAccount);
      Transaction.create.mockResolvedValue(fakeTransaction);

      const payload = {
        type: TRANSACTION_TYPES.DEPOSIT,
        amount: 500,
        paymentMethod: 'CASH',
      };

      const result = await create(fakeAccount.id, payload, fakeUser);

      expect(result).toEqual({ message: 'Deposit successful' });
      expect(fakeAccount.update).toHaveBeenCalledWith(
        { balance: 1500, status: STATUS.ACTIVE },
        expect.any(Object)
      );
      expect(Transaction.create).toHaveBeenCalled();
      expect(transaction.commit).toHaveBeenCalled();
    });

    it('should handle withdrawal successfully', async () => {
      User.findByPk.mockResolvedValue(fakeUser);
      UserAccount.findByPk.mockResolvedValue(fakeAccount);
      Transaction.create.mockResolvedValue(fakeTransaction);

      const payload = {
        type: TRANSACTION_TYPES.WITHDRAWAL,
        amount: 500,
        fee: 10,
        paymentMethod: 'CASH',
      };

      fakeAccount.balance = 1000;

      const result = await create(fakeAccount.id, payload, fakeUser);

      expect(result).toEqual({ message: 'Withdrawal successful' });
      expect(fakeAccount.update).toHaveBeenCalledWith({ balance: 490 }, expect.any(Object));
      expect(Transaction.create).toHaveBeenCalled();
      expect(transaction.commit).toHaveBeenCalled();
    });

    it('should handle transfer successfully', async () => {
      const toAccount = {
        id: 2,
        user_id: 2,
        balance: 500,
        status: STATUS.ACTIVE,
        update: jest.fn(),
      };

      User.findByPk.mockResolvedValue(fakeUser);
      UserAccount.findByPk.mockResolvedValue(fakeAccount);
      UserAccount.findOne.mockResolvedValue(toAccount);
      Transaction.create.mockResolvedValue(fakeTransaction);

      const payload = {
        type: TRANSACTION_TYPES.TRANSFER,
        amount: 500,
        fee: 10,
        accountNo: '1234567890',
        paymentMethod: 'ONLINE',
      };

      fakeAccount.balance = 1000;

      const result = await create(fakeAccount.id, payload, fakeUser);

      expect(result).toEqual({ message: 'Transfer successful' });
      expect(fakeAccount.update).toHaveBeenCalledWith({ balance: 490 }, expect.any(Object));
      expect(toAccount.update).toHaveBeenCalledWith(
        { balance: 1000, status: STATUS.ACTIVE },
        expect.any(Object)
      );
      expect(Transaction.create).toHaveBeenCalledTimes(2);
      expect(transaction.commit).toHaveBeenCalled();
    });

    it('should throw an error if account is not found', async () => {
      UserAccount.findByPk.mockResolvedValue(null);

      const payload = { type: TRANSACTION_TYPES.DEPOSIT, amount: 500 };

      await expect(create(fakeAccount.id, payload, fakeUser)).rejects.toThrow('Account not found');
    });

    it('should rollback transaction on error', async () => {
      UserAccount.findByPk.mockResolvedValue(fakeAccount);
      Transaction.create.mockRejectedValue(new Error('Database error'));

      const payload = { type: TRANSACTION_TYPES.DEPOSIT, amount: 500 };

      await expect(create(fakeAccount.id, payload, fakeUser)).rejects.toThrow('Database error');
      expect(transaction.rollback).toHaveBeenCalled();
    });
  });

  describe('index', () => {
    it('should return paginated transactions for customer', async () => {
      UserAccount.findOne.mockResolvedValue(fakeAccount);
      Transaction.findAndCountAll.mockResolvedValue({
        rows: [fakeTransaction],
        count: 1,
      });

      const query = { page: 1, limit: 10 };
      const result = await index(fakeAccount.id, query, fakeUser);

      expect(result).toEqual({
        totalItems: 1,
        totalPages: 1,
        currentPage: 1,
        transactions: [fakeTransaction],
      });
      expect(Transaction.findAndCountAll).toHaveBeenCalledWith({
        where: { account_id: fakeAccount.id },
        offset: 0,
        limit: 10,
        order: [['created_at', 'DESC']],
      });
    });

    it('should throw an error if no transactions are found', async () => {
      Transaction.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

      const query = { page: 1, limit: 10 };
      await expect(index(fakeAccount.id, query, fakeUser)).rejects.toThrow('No transactions found');
    });

    it("should throw an error if user accesses another branch's transactions", async () => {
      UserAccount.findByPk.mockResolvedValue(fakeAccount);
      Branch.findOne.mockResolvedValue(fakeBranch);

      const query = { page: 1, limit: 10 };
      fakeAccount.branch_id = 2;

      await expect(index(fakeAccount.id, query, { id: 2, role: ROLES['102'] })).rejects.toThrow(
        "Cannot access other account's branch transaction history"
      );
    });
  });

  describe('view', () => {
    it('should return a transaction by ID for customer', async () => {
      UserAccount.findByPk.mockResolvedValue(fakeAccount);
      Transaction.findOne.mockResolvedValue(fakeTransaction);

      const result = await view(fakeAccount.id, fakeTransaction.id, fakeUser);

      expect(result).toEqual(fakeTransaction);
      expect(Transaction.findOne).toHaveBeenCalledWith({
        where: { id: fakeTransaction.id, account_id: fakeAccount.id },
      });
    });

    it('should throw an error if transaction is not found', async () => {
      UserAccount.findByPk.mockResolvedValue(fakeAccount);
      Transaction.findOne.mockResolvedValue(null);

      await expect(view(fakeAccount.id, fakeTransaction.id, fakeUser)).rejects.toThrow(
        'Transaction not found'
      );
    });

    it('should throw an error if account is not found', async () => {
      UserAccount.findByPk.mockResolvedValue(null);

      await expect(view(fakeAccount.id, fakeTransaction.id, fakeUser)).rejects.toThrow('Account not found');
    });

    it("should throw an error if user accesses another branch's transaction", async () => {
      UserAccount.findByPk.mockResolvedValue(fakeAccount);
      Branch.findOne.mockResolvedValue(fakeBranch);

      fakeAccount.branch_id = 2;

      await expect(view(fakeAccount.id, fakeTransaction.id, { id: 2, role: ROLES['102'] })).rejects.toThrow(
        "Cannot access other account's branch transaction history"
      );
    });
  });
});
