const { faker } = require('@faker-js/faker');
const {
  sequelize,
  User,
  Role,
  Branch,
  UserAccount,
  UserApplication,
  AccountPolicy,
} = require('../../src/models');
const accountsService = require('../../src/services/accounts.service');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const notificationHelper = require('../../src/helpers/notifications.helper');
const accountHelper = require('../../src/helpers/accounts.helper');
const redisClient = require('../../src/config/redis');
const constants = require('../../src/constants/constants');

jest.mock('../../src/models');
jest.mock('../../src/helpers/commonFunctions.helper');
jest.mock('../../src/helpers/notifications.helper');
jest.mock('../../src/helpers/accounts.helper');
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

describe('Accounts Service', () => {
  afterEach(() => {
    jest.clearAllMocks();

    commonHelper.customError.mockImplementation((message, status) => {
      const err = new Error(message);
      err.statusCode = status;
      throw err;
    });
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  describe('create', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully create a new account for a valid application', async () => {
      const transaction = { commit: jest.fn(), rollback: jest.fn() };
      sequelize.transaction.mockResolvedValue(transaction);

      const userId = faker.string.uuid();
      const branchId = faker.string.uuid();
      const customer = { id: userId, Roles: [{ code: constants.ROLES['103'] }] };
      const branch = { id: branchId, ifsc_code: faker.finance.bic() };
      const policy = { id: faker.string.uuid(), interest_rate: faker.number.float({ min: 1, max: 5 }) };
      const application = { destroy: jest.fn() };
      const existingAccount = { id: faker.string.uuid(), type: constants.ACCOUNT_TYPES.SAVINGS };

      User.findOne.mockResolvedValueOnce(customer);
      Branch.findOne.mockResolvedValueOnce(branch);
      UserApplication.findOne.mockResolvedValueOnce(application);
      UserAccount.findOne.mockResolvedValueOnce(existingAccount);
      AccountPolicy.findOne.mockResolvedValueOnce(policy);
      accountHelper.generateAccountNumber.mockReturnValueOnce(faker.finance.accountNumber());
      notificationHelper.accountCreationNotification.mockResolvedValueOnce();

      const payload = {
        userId,
        type: constants.ACCOUNT_TYPES.SAVINGS,
        nominee: faker.person.fullName(),
        branchIfscCode: branch.ifsc_code,
      };

      const user = { role: constants.ROLES['102'] };

      const createdAccount = {
        policy_id: policy.id,
        branch_id: branch.id,
        user_id: userId,
        type: constants.ACCOUNT_TYPES.SAVINGS,
        number: accountHelper.generateAccountNumber(),
        interest_rate: policy.interest_rate,
        nominee: payload.nominee,
      };

      UserAccount.create.mockResolvedValue(createdAccount);

      const result = await accountsService.create(payload, user);

      expect(result).toEqual(createdAccount);
      expect(transaction.commit).toHaveBeenCalled();
      expect(application.destroy).toHaveBeenCalledWith({ transaction });
      expect(notificationHelper.accountCreationNotification).toHaveBeenCalledWith(
        customer.email,
        constants.ACCOUNT_TYPES.SAVINGS,
        createdAccount.number
      );
    });

    it('should throw error if no user found', async () => {
      User.findOne.mockResolvedValue(null);

      const payload = {
        userId: faker.string.uuid(),
        type: constants.ACCOUNT_TYPES.SAVINGS,
        nominee: faker.person.fullName(),
        branchIfscCode: faker.finance.bic(),
      };

      const user = { role: constants.ROLES['102'] };

      await expect(accountsService.create(payload, user)).rejects.toThrow('No user Found');
    });

    it('should throw error if branch is not found', async () => {
      const userId = faker.string.uuid();
      const customer = { id: userId, Roles: [{ code: constants.ROLES['103'] }] };

      User.findOne.mockResolvedValueOnce(customer);
      Branch.findOne.mockResolvedValue(null);

      const payload = {
        userId,
        type: constants.ACCOUNT_TYPES.SAVINGS,
        nominee: faker.person.fullName(),
        branchIfscCode: faker.finance.bic(),
      };

      const user = { role: constants.ROLES['102'] };

      await expect(accountsService.create(payload, user)).rejects.toThrow('No branch Found.');
    });

    it('should throw error if application is not found', async () => {
      const userId = faker.string.uuid();
      const branchId = faker.string.uuid();
      const customer = { id: userId, Roles: [{ code: constants.ROLES['103'] }] };
      const branch = { id: branchId, ifsc_code: faker.finance.bic() };

      User.findOne.mockResolvedValueOnce(customer);
      Branch.findOne.mockResolvedValueOnce(branch);
      UserApplication.findOne.mockResolvedValue(null);

      const payload = {
        userId,
        type: constants.ACCOUNT_TYPES.SAVINGS,
        nominee: faker.person.fullName(),
        branchIfscCode: branch.ifsc_code,
      };

      const user = { role: constants.ROLES['102'] };

      await expect(accountsService.create(payload, user)).rejects.toThrow(
        'No application found, cannot create account to this user'
      );
    });

    it('should throw error if user already has an account of the same type', async () => {
      const userId = faker.string.uuid();
      const branchId = faker.string.uuid();
      const customer = { id: userId, Roles: [{ code: constants.ROLES['103'] }] };
      const branch = { id: branchId, ifsc_code: faker.finance.bic() };
      const existingAccount = { id: faker.string.uuid() };

      User.findOne.mockResolvedValueOnce(customer);
      Branch.findOne.mockResolvedValue(branch);
      UserApplication.findOne.mockResolvedValue({});
      UserAccount.findOne.mockResolvedValue(existingAccount);

      const payload = {
        userId,
        type: constants.ACCOUNT_TYPES.SAVINGS,
        nominee: faker.person.fullName(),
        branchIfscCode: branch.ifsc_code,
      };

      const user = { role: constants.ROLES['102'] };

      await expect(accountsService.create(payload, user)).rejects.toThrow(
        'User already has an account of this type. Cannot create another.'
      );
    });

    it('should throw error if branch manager creates other branch customer account', async () => {
      const userId = faker.string.uuid();
      const branchId = faker.string.uuid();
      const customer = { id: userId, Roles: [{ code: constants.ROLES['103'] }] };
      const branch = { id: branchId, ifsc_code: faker.finance.bic() };

      User.findOne.mockResolvedValueOnce(customer);
      Branch.findOne.mockResolvedValueOnce(branch);
      UserApplication.findOne.mockResolvedValueOnce({});
      UserAccount.findOne.mockResolvedValue(null);
      AccountPolicy.findOne.mockResolvedValue(null);

      const payload = {
        userId,
        type: constants.ACCOUNT_TYPES.SAVINGS,
        nominee: faker.person.fullName(),
        branchIfscCode: branch.ifsc_code,
      };

      const user = { role: constants.ROLES['102'] };

      await expect(accountsService.create(payload, user)).rejects.toThrow(
        'Branch managers can only create accounts in their own branch.'
      );
    });
  });

  describe('index', () => {
    it('should return paginated accounts for an admin', async () => {
      const query = { page: 1, limit: 10 };
      const user = { role: constants.ROLES['101'] };

      const accounts = Array.from({ length: 10 }).map(() => ({
        id: faker.string.uuid(),
        user_id: faker.string.uuid(),
        branch_id: faker.string.uuid(),
        type: constants.ACCOUNT_TYPES.SAVINGS,
        number: faker.finance.accountNumber(),
      }));

      UserAccount.findAndCountAll.mockResolvedValueOnce({
        count: 50,
        rows: accounts,
      });

      const result = await accountsService.index(query, user);

      expect(result).toEqual({
        totalItems: 50,
        totalPages: 5,
        currentPage: 1,
        accounts: accounts,
      });
    });

    it('should throw error if no accounts found', async () => {
      const user = { role: constants.ROLES['101'] };
      UserAccount.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      const query = { page: 1, limit: 10 };

      await expect(accountsService.index(query, user)).rejects.toThrow('No accounts found');
    });
  });

  describe('view', () => {
    it('should return account details for an admin', async () => {
      const accountId = faker.string.uuid();
      const user = { role: constants.ROLES['101'] };

      const account = {
        id: accountId,
        user_id: faker.string.uuid(),
        branch_id: faker.string.uuid(),
        type: constants.ACCOUNT_TYPES.SAVINGS,
        User: { id: faker.string.uuid(), name: faker.person.fullName() },
        Branch: { id: faker.string.uuid(), ifsc_code: faker.finance.bic() },
      };

      UserAccount.findOne.mockResolvedValue(account);

      const result = await accountsService.view(accountId, user);

      expect(result).toEqual(account);
    });

    it('should restrict customer to view only their own accounts', async () => {
      const accountId = faker.string.uuid();
      const user = { role: constants.ROLES['103'], id: faker.string.uuid() };

      const account = {
        id: accountId,
        user_id: user.id,
        type: constants.ACCOUNT_TYPES.SAVINGS,
      };

      UserAccount.findOne.mockResolvedValue(account);

      const result = await accountsService.view(accountId, user);

      expect(result).toEqual(account);
    });
  });

  describe('update', () => {
    it('should successfully update account details', async () => {
      const transaction = { commit: jest.fn(), rollback: jest.fn() };
      sequelize.transaction.mockResolvedValue(transaction);
      const accountId = faker.string.uuid();
      const user = { id: faker.string.uuid() };
      const branch = { id: faker.string.uuid(), user_id: user.id };
      const account = { id: accountId, branch_id: branch.id, update: jest.fn() };

      Branch.findOne.mockResolvedValue(branch);
      UserAccount.findOne.mockResolvedValueOnce(account);
      account.update.mockResolvedValue({ ...account, nominee: 'Updated Nominee' });

      const payload = { nominee: 'Updated Nominee' };

      const result = await accountsService.update(accountId, payload, user);

      expect(result).toEqual({ ...account, nominee: 'Updated Nominee' });
      expect(transaction.commit).toHaveBeenCalled();
      expect(account.update).toHaveBeenCalledWith(payload, { transaction });
    });

    it('should throw error if account not found', async () => {
      const accountId = faker.string.uuid();
      UserAccount.findOne.mockResolvedValue(null);

      await expect(accountsService.update(accountId, {}, {})).rejects.toThrow('Account not found');
    });

    it('should restrict updates to branch accounts only', async () => {
      const accountId = faker.string.uuid();
      const user = { id: faker.string.uuid() };
      const branch = { id: faker.string.uuid() };
      const account = { id: accountId, branch_id: faker.string.uuid() };

      Branch.findOne.mockResolvedValue(branch);
      UserAccount.findOne.mockResolvedValue(account);

      await expect(accountsService.update(accountId, {}, user)).rejects.toThrow(
        'You can only update accounts of customers in your branch'
      );
    });
  });

  describe('remove', () => {
    it('should successfully soft delete an account', async () => {
      const transaction = { commit: jest.fn(), rollback: jest.fn() };
      sequelize.transaction.mockResolvedValue(transaction);
      const accountId = faker.string.uuid();
      const user = { id: faker.string.uuid() };
      const branch = { id: faker.string.uuid() };
      const account = { id: accountId, branch_id: branch.id, destroy: jest.fn() };

      Branch.findOne.mockResolvedValue(branch);
      UserAccount.findOne.mockResolvedValueOnce(account);

      account.destroy.mockResolvedValueOnce();

      await accountsService.remove(accountId, user);

      expect(transaction.commit).toHaveBeenCalled();
      expect(account.destroy).toHaveBeenCalledWith({ transaction });
    });

    it('should throw error if account not found', async () => {
      const accountId = faker.string.uuid();
      UserAccount.findOne.mockResolvedValue(null);

      await expect(accountsService.remove(accountId, {})).rejects.toThrow('Account not found');
    });

    it('should restrict deletes to branch accounts only', async () => {
      const accountId = faker.string.uuid();
      const user = { id: faker.string.uuid() };
      const branch = { id: faker.string.uuid() };
      const account = { id: accountId, branch_id: faker.string.uuid() }; // Account belongs to another branch

      Branch.findOne.mockResolvedValue(branch); // User's branch
      UserAccount.findOne.mockResolvedValue(account); // Account in a different branch

      // Check for the rejection and validate error properties
      await expect(accountsService.remove(accountId, user)).rejects.toMatchObject({
        message: 'You can only delete accounts of customers in your branch',
        statusCode: 403,
      });
    });
  });
});
