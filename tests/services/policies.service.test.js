const { create, index, view, update, remove } = require('../../src/services/policies.service');
const { AccountPolicy, Bank, UserAccount } = require('../../src/models');
const commonHelper = require('../../src/helpers/commonFunctions.helper');

jest.mock('../../src/models', () => ({
  AccountPolicy: {
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  Bank: {
    findOne: jest.fn(),
  },
  UserAccount: {
    findOne: jest.fn(),
  },
}));

jest.mock('../../src/helpers/commonFunctions.helper', () => ({
  customError: jest.fn(),
}));

describe('AccountPolicy Service', () => {
  // Test cases for create function
  describe('create', () => {
    it('should create a new policy successfully', async () => {
      const payload = {
        data: {
          accountType: 'Savings',
          initialAmount: 1000,
          interestRate: 5,
          minimumAmount: 500,
          lockInPeriod: 12,
          penaltyFee: 50,
        },
      };

      Bank.findOne.mockResolvedValue({ id: 1 }); // Mock bank data
      AccountPolicy.findOne.mockResolvedValue(null); // No existing policy
      AccountPolicy.create.mockResolvedValue({ id: 1, ...payload.data }); // Mock policy creation

      const result = await create(payload);

      expect(AccountPolicy.findOne).toHaveBeenCalledWith({
        where: {
          account_type: payload.data.accountType,
          interest_rate: payload.data.interestRate,
          initial_amount: payload.data.initialAmount,
        },
      });
      expect(AccountPolicy.create).toHaveBeenCalledWith({
        bank_id: 1,
        account_type: payload.data.accountType,
        initial_amount: payload.data.initialAmount,
        interest_rate: payload.data.interestRate,
        minimum_amount: payload.data.minimumAmount,
        lock_in_period: payload.data.lockInPeriod,
        penalty_fee: payload.data.penaltyFee,
      });
      expect(result).toEqual({ id: 1, ...payload.data });
    });

    it('should return error if policy already exists', async () => {
      const payload = {
        data: {
          accountType: 'Savings',
          initialAmount: 1000,
          interestRate: 5,
          minimumAmount: 500,
          lockInPeriod: 12,
          penaltyFee: 50,
        },
      };

      AccountPolicy.findOne.mockResolvedValue({ id: 1 }); // Mock existing policy

      await create(payload);

      expect(commonHelper.customError).toHaveBeenCalledWith('Policy already exists', 409);
    });
  });

  // Test cases for index function
  describe('index', () => {
    it('should list all policies', async () => {
      const payload = {
        query: {
          page: 1,
          limit: 10,
        },
      };

      AccountPolicy.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: [
          { id: 1, account_type: 'Savings' },
          { id: 2, account_type: 'Current' },
        ],
      });

      const result = await index(payload);

      expect(AccountPolicy.findAndCountAll).toHaveBeenCalledWith({
        offset: 0,
        limit: 10,
      });
      expect(result).toEqual({
        policies: [
          { id: 1, account_type: 'Savings' },
          { id: 2, account_type: 'Current' },
        ],
        totalPolicies: 2,
        currentPage: 1,
        totalPages: 1,
      });
    });

    it('should return error if no policies found', async () => {
      const payload = {
        query: {
          page: 1,
          limit: 10,
        },
      };

      AccountPolicy.findAndCountAll.mockResolvedValue({
        count: 0,
        rows: [],
      });

      await index(payload);

      expect(commonHelper.customError).toHaveBeenCalledWith('Policy already exists', 409);
    });
  });

  // Test cases for view function
  describe('view', () => {
    it('should return policy by id', async () => {
      const policyId = 1;

      AccountPolicy.findByPk.mockResolvedValue({ id: policyId, account_type: 'Savings' });

      const result = await view(policyId);

      expect(AccountPolicy.findByPk).toHaveBeenCalledWith(policyId);
      expect(result).toEqual({ id: policyId, account_type: 'Savings' });
    });

    it('should return error if policy not found', async () => {
      const policyId = 1;

      AccountPolicy.findByPk.mockResolvedValue(null); // Mock policy not found

      await view(policyId);

      expect(commonHelper.customError).toHaveBeenCalledWith('Policy not found', 404);
    });
  });

  // Test cases for update function
  describe('update', () => {
    it('should return error if policy not found during update', async () => {
      const payload = {
        id: 1,
        data: {
          interestRate: 6,
          penaltyFee: 100,
        },
      };

      AccountPolicy.findByPk.mockResolvedValue(null); // Mock policy not found

      await update(payload);

      expect(commonHelper.customError).toHaveBeenCalledWith('Policy not found', 404);
    });
  });

  // Test cases for remove function
  describe('remove', () => {
    it('should remove a policy successfully', async () => {
      const policyId = 1;

      const policy = { id: policyId, destroy: jest.fn() };
      const userAccount = null; // No account linked to policy

      AccountPolicy.findByPk.mockResolvedValue(policy);
      UserAccount.findOne.mockResolvedValue(userAccount);
      policy.destroy.mockResolvedValue({ message: 'Policy deleted successfully' });

      const result = await remove(policyId);

      expect(AccountPolicy.findByPk).toHaveBeenCalledWith(policyId);
      expect(UserAccount.findOne).toHaveBeenCalledWith({ where: { policy_id: policyId } });
      expect(policy.destroy).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Policy deleted successfully' });
    });

    it('should return error if account exists with this policy', async () => {
      const policyId = 1;

      const policy = { id: policyId };
      const userAccount = { id: 1 }; // Account exists with this policy

      AccountPolicy.findByPk.mockResolvedValue(policy);
      UserAccount.findOne.mockResolvedValue(userAccount);

      await remove(policyId);

      expect(commonHelper.customError).toHaveBeenCalledWith(
        'Account exists with this policy, policy cannot be deleted',
        409
      );
    });

    it('should return error if policy not found during removal', async () => {
      const policyId = 1;

      AccountPolicy.findByPk.mockResolvedValue(null); // Mock policy not found

      await remove(policyId);

      expect(commonHelper.customError).toHaveBeenCalledWith('Policy not found', 404);
    });
  });
});
