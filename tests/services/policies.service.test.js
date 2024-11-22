const { create, index, view, update, remove } = require('../../src/services/policies.service');
const { Bank, AccountPolicy, UserAccount, sequelize } = require('../../src/models');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
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

describe('Policy Service Tests', () => {
  let fakePolicy, fakeBank, transaction;

  beforeEach(() => {
    fakePolicy = {
      id: 1,
      bank_id: 1,
      account_type: 'Savings',
      initial_amount: 1000,
      interest_rate: 4.5,
      minimum_amount: 500,
      lock_in_period: 12,
      penalty_fee: 50,
      update: jest.fn(),
      destroy: jest.fn(),
    };

    commonHelper.customError.mockImplementation((message, status) => {
      const err = new Error(message);
      err.statusCode = status;
      throw err;
    });

    fakeBank = {
      id: 1,
    };

    transaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    sequelize.transaction = jest.fn().mockResolvedValue(transaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  describe('create', () => {
    it('should create a new policy successfully', async () => {
      Bank.findOne.mockResolvedValue(fakeBank);
      AccountPolicy.findOne.mockResolvedValueOnce(null);
      AccountPolicy.create.mockResolvedValueOnce(fakePolicy);

      const payload = {
        accountType: 'Savings',
        initialAmount: 1000,
        interestRate: 4.5,
        minimumAmount: 500,
        lockInPeriod: 12,
        penaltyFee: 50,
      };

      const result = await create(payload);

      expect(result).toEqual(fakePolicy);
      expect(AccountPolicy.create).toHaveBeenCalledWith(
        expect.objectContaining({
          bank_id: fakeBank.id,
          account_type: payload.accountType,
        }),
        expect.any(Object)
      );
      expect(transaction.commit).toHaveBeenCalled();
    });

    it('should throw an error if the policy already exists', async () => {
      AccountPolicy.findOne.mockResolvedValueOnce(fakePolicy);

      const payload = {
        accountType: 'Savings',
        initialAmount: 1000,
        interestRate: 4.5,
        minimumAmount: 500,
        lockInPeriod: 12,
        penaltyFee: 50,
      };

      await expect(create(payload)).rejects.toThrow('Policy already exists');
    });
  });

  describe('index', () => {
    it('should list all policies with pagination', async () => {
      AccountPolicy.findAndCountAll.mockResolvedValue({
        rows: [fakePolicy],
        count: 1,
      });

      const query = { page: 1, limit: 10 };
      const result = await index(query);

      expect(result).toEqual({
        policies: [fakePolicy],
        totalPolicies: 1,
        currentPage: 1,
        totalPages: 1,
      });
      expect(AccountPolicy.findAndCountAll).toHaveBeenCalledWith({
        offset: 0,
        limit: query.limit,
      });
    });

    it('should throw an error if no policies are found', async () => {
      AccountPolicy.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

      const query = { page: 1, limit: 10 };
      await expect(index(query)).rejects.toThrow('No policies found');
    });
  });

  describe('view', () => {
    it('should return a policy by ID', async () => {
      AccountPolicy.findByPk.mockResolvedValue(fakePolicy);

      const result = await view(fakePolicy.id);

      expect(result).toEqual(fakePolicy);
      expect(AccountPolicy.findByPk).toHaveBeenCalledWith(fakePolicy.id);
    });

    it('should throw an error if the policy is not found', async () => {
      AccountPolicy.findByPk.mockResolvedValue(null);

      await expect(view(fakePolicy.id)).rejects.toThrow('Policy not found');
    });
  });

  describe('update', () => {
    it('should update a policy successfully', async () => {
      AccountPolicy.findByPk.mockResolvedValueOnce(fakePolicy);

      const payload = { interestRate: 5.0, penaltyFee: 100 };
      const result = await update(fakePolicy.id, payload);

      expect(result).toEqual(undefined);
      expect(fakePolicy.update).toHaveBeenCalledWith(
        expect.objectContaining({
          interest_rate: payload.interestRate,
          penalty_fee: payload.penaltyFee,
        }),
        expect.any(Object)
      );
      expect(transaction.commit).toHaveBeenCalled();
    });

    it('should throw an error if the policy is not found', async () => {
      AccountPolicy.findByPk.mockResolvedValue(null);

      const payload = { interestRate: 5.0, penaltyFee: 100 };
      await expect(update(fakePolicy.id, payload)).rejects.toThrow('Policy not found');
    });

    it('should rollback the transaction on error', async () => {
      AccountPolicy.findByPk.mockResolvedValue(fakePolicy);
      fakePolicy.update.mockRejectedValue(new Error('Database error'));

      const payload = { interestRate: 5.0, penaltyFee: 100 };
      await expect(update(fakePolicy.id, payload)).rejects.toThrow('Database error');
      expect(transaction.rollback).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a policy successfully', async () => {
      AccountPolicy.findByPk.mockResolvedValue(fakePolicy);
      UserAccount.findOne.mockResolvedValue(null);

      const result = await remove(fakePolicy.id);

      expect(result).toEqual({ message: 'Policy deleted successfully' });
      expect(fakePolicy.destroy).toHaveBeenCalledWith(expect.any(Object));
      expect(transaction.commit).toHaveBeenCalled();
    });

    it('should throw an error if the policy is not found', async () => {
      AccountPolicy.findByPk.mockResolvedValue(null);

      await expect(remove(fakePolicy.id)).rejects.toThrow('Policy not found');
    });

    it('should throw an error if there is an account associated with the policy', async () => {
      AccountPolicy.findByPk.mockResolvedValue(fakePolicy);
      UserAccount.findOne.mockResolvedValue({ id: 1 });

      await expect(remove(fakePolicy.id)).rejects.toThrow(
        'Account exists with this policy, policy cannot be deleted'
      );
    });

    it('should rollback the transaction on error', async () => {
      AccountPolicy.findByPk.mockResolvedValue(fakePolicy);
      UserAccount.findOne.mockResolvedValue(null);
      fakePolicy.destroy.mockRejectedValue(new Error('Database error'));

      await expect(remove(fakePolicy.id)).rejects.toThrow('Database error');
      expect(transaction.rollback).toHaveBeenCalled();
    });
  });
});
