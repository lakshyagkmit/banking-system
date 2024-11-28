const policyService = require('../../src/services/policies.service');
const { AccountPolicy, Bank, UserAccount } = require('../../src/models');
const commonHelper = require('../../src/helpers/commonFunctions.helper');

// Mock the models
jest.mock('../../src/models');
jest.mock('../../src/helpers/commonFunctions.helper');

describe('Policy Service', () => {
  let mockBank;
  let mockPolicy;
  let mockAccount;

  beforeEach(() => {
    // Mock the Bank model to return a bank instance
    mockBank = { id: 1 };
    Bank.findOne.mockResolvedValue(mockBank);

    // Mock the AccountPolicy model to return a policy
    mockPolicy = { id: 1, account_type: 'Savings', interest_rate: 5, initial_amount: 1000 };
    AccountPolicy.findByPk.mockResolvedValue(mockPolicy);

    // Mock UserAccount to simulate existing accounts
    mockAccount = { policy_id: 1 };
    UserAccount.findOne.mockResolvedValue(mockAccount);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new policy successfully', async () => {
      const payload = {
        data: {
          accountType: 'Savings',
          initialAmount: 1000,
          interestRate: 5,
          minimumAmount: 500,
          lockInPeriod: 12,
          penaltyFee: 100,
        },
      };

      // Mock AccountPolicy.create to return the new policy
      AccountPolicy.findOne.mockResolvedValueOnce(null); // No existing policy
      AccountPolicy.create.mockResolvedValueOnce(mockPolicy);

      const result = await policyService.create(payload);

      expect(result).toEqual(mockPolicy);
    });

    it('should return error if policy already exists', async () => {
      const payload = {
        data: {
          accountType: 'Savings',
          initialAmount: 1000,
          interestRate: 5,
          minimumAmount: 500,
          lockInPeriod: 12,
          penaltyFee: 100,
        },
      };

      // Mock that a policy already exists
      AccountPolicy.findOne.mockResolvedValueOnce(mockPolicy);

      const result = await policyService.create(payload);

      expect(result).toEqual(commonHelper.customError('Policy already exists', 409));
    });
  });

  describe('index', () => {
    it('should return paginated list of policies', async () => {
      const payload = { query: { page: 1, limit: 10 } };

      const mockPolicies = {
        rows: [mockPolicy],
        count: 1,
      };
      AccountPolicy.findAndCountAll.mockResolvedValue(mockPolicies);

      const result = await policyService.index(payload);

      expect(result.policies).toEqual([mockPolicy]);
      expect(result.totalPolicies).toEqual(1);
      expect(result.totalPages).toEqual(1);
    });

    it('should return error if no policies are found', async () => {
      const payload = { query: { page: 1, limit: 10 } };

      // Mock the response for no policies found
      AccountPolicy.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

      // Expect the result to be the pagination details with empty policies
      const result = await policyService.index(payload);

      expect(result).toEqual({
        policies: [],
        totalPolicies: 0,
        currentPage: 1,
        totalPages: 0,
      });
    });
  });

  describe('view', () => {
    it('should return policy by id', async () => {
      const result = await policyService.view(1);

      expect(result).toEqual(mockPolicy);
      expect(AccountPolicy.findByPk).toHaveBeenCalledWith(1);
    });

    it('should return error if policy not found', async () => {
      AccountPolicy.findByPk.mockResolvedValueOnce(null);

      const result = await policyService.view(1);

      expect(result).toEqual(commonHelper.customError('Policy not found', 404));
    });
  });

  describe('update', () => {
    it('should update policy successfully', async () => {
      const payload = { id: 1, data: { interestRate: 6, penaltyFee: 150 } };

      mockPolicy.update = jest.fn().mockResolvedValue(mockPolicy);

      const result = await policyService.update(payload);

      expect(mockPolicy.update).toHaveBeenCalledWith({
        interest_rate: payload.data.interestRate,
        penalty_fee: payload.data.penaltyFee,
      });
      expect(result).toEqual(mockPolicy);
    });

    it('should return error if policy not found', async () => {
      AccountPolicy.findByPk.mockResolvedValueOnce(null);

      const payload = { id: 1, data: { interestRate: 6, penaltyFee: 150 } };

      const result = await policyService.update(payload);

      expect(result).toEqual(commonHelper.customError('Policy not found', 404));
    });
  });

  describe('remove', () => {
    it('should delete policy successfully', async () => {
      const policyId = 1;

      // Assuming your service function is 'remove'
      const result = await policyService.remove(policyId);

      // Check if the policy's destroy method was called
      expect(AccountPolicy.findByPk).toHaveBeenCalledWith(policyId);

      // Verify the success message
      expect(result).toEqual(undefined);
    });

    it('should return error if policy is associated with an account', async () => {
      const policyToRemove = { id: 1 };
      AccountPolicy.findByPk.mockResolvedValueOnce(policyToRemove);
      UserAccount.findOne.mockResolvedValueOnce(mockAccount); // Account exists with this policy

      const result = await policyService.remove(1);

      expect(result).toEqual(
        commonHelper.customError('Account exists with this policy, policy cannot be deleted', 409)
      );
    });

    it('should return error if policy not found', async () => {
      AccountPolicy.findByPk.mockResolvedValueOnce(null);

      const result = await policyService.remove(1);

      expect(result).toEqual(commonHelper.customError('Policy not found', 404));
    });
  });
});
