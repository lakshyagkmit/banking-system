const { requestAccount, requestLocker, index, view } = require('../../src/services/applications.service');
const { faker } = require('@faker-js/faker');
const constants = require('../../src/constants/constants');
const redisClient = require('../../src/config/redis');

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
jest.mock('../../src/models', () => ({
  UserAccount: {
    findOne: jest.fn(),
  },
  Branch: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
  UserApplication: {
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    findOne: jest.fn(),
  },
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
  UserLocker: {
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
  applicationRequestNotification: jest.fn(),
  applicationSuccessNotification: jest.fn(),
}));

const { UserAccount, Branch, UserApplication, User, UserLocker, sequelize } = require('../../src/models');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const notificationHelper = require('../../src/helpers/notifications.helper');
const { STATUS, APPLICATION_TYPES } = require('../../src/constants/constants');

describe('Account Service Tests', () => {
  let mockTransaction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };
    sequelize.transaction.mockResolvedValue(mockTransaction);

    commonHelper.customError.mockImplementation((message, status) => {
      const error = new Error(message);
      error.statusCode = status;
      throw error;
    });
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  describe('requestAccount', () => {
    it('should create a new account request successfully', async () => {
      // Setup mocks
      const mockUser = {
        id: faker.number.int(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
      };

      const mockBranchManager = {
        email: faker.internet.email(),
      };

      const mockBranch = {
        ifsc_code: 'BR123',
        user_id: faker.number.int(),
      };

      UserAccount.findOne.mockResolvedValue(null);
      Branch.findOne.mockResolvedValue(mockBranch);
      User.findOne.mockResolvedValue(mockBranchManager);
      User.findByPk.mockResolvedValue(mockUser);
      UserApplication.create.mockResolvedValue({
        id: faker.number.int(),
        user_id: mockUser.id,
      });

      const payload = {
        branchIfscCode: 'BR123',
        type: APPLICATION_TYPES.ACCOUNT,
        nomineeName: faker.person.fullName(),
      };

      const result = await requestAccount(payload, mockUser);

      expect(result).toBeDefined();
      expect(UserApplication.create).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should throw an error if account already exists', async () => {
      UserAccount.findOne.mockResolvedValue({ id: faker.number.int() });

      const payload = {
        branchIfscCode: 'BR123',
        type: APPLICATION_TYPES.ACCOUNT,
        nomineeName: faker.person.fullName(),
      };

      await expect(requestAccount(payload, { id: faker.number.int() })).rejects.toThrow(
        'Account already exist'
      );
    });
  });

  describe('requestLocker', () => {
    it('should create a new locker request successfully', async () => {
      const mockAccount = {
        id: faker.number.int(),
        branch_id: faker.number.int(),
      };

      const mockBranch = {
        id: faker.number.int(),
        ifsc_code: 'BR123',
        user_id: faker.number.int(),
      };

      UserAccount.findOne.mockResolvedValue(mockAccount);
      Branch.findByPk.mockResolvedValue(mockBranch);
      UserLocker.findOne.mockResolvedValue(null);
      UserApplication.create.mockResolvedValue({ id: faker.number.int() });

      const payload = { type: APPLICATION_TYPES.LOCKER };
      const result = await requestLocker(payload, { id: faker.number.int() });

      expect(result).toBeDefined();
      expect(UserApplication.create).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });
  });

  describe('index', () => {
    it('should return paginated applications', async () => {
      const mockApplications = {
        rows: [{ id: faker.number.int() }],
        count: 1,
      };

      Branch.findOne.mockResolvedValue({ ifsc_code: 'BR123' });
      UserApplication.findAndCountAll.mockResolvedValue(mockApplications);

      const query = { page: 1, limit: 10, requestType: 'accounts' };
      const user = { id: faker.number.int(), role: 'branch_manager' };

      const result = await index(query, user);

      expect(result).toHaveProperty('totalItems', 1);
      expect(result).toHaveProperty('applications');
    });
  });

  describe('view', () => {
    it('should return an application by id', async () => {
      const mockApplication = {
        id: faker.number.int(),
        type: APPLICATION_TYPES.ACCOUNT,
      };

      Branch.findOne.mockResolvedValue({ ifsc_code: 'BR123' });
      UserApplication.findOne.mockResolvedValue(mockApplication);

      const result = await view(mockApplication.id, {
        id: faker.number.int(),
        role: 'branch_manager',
      });

      expect(result).toEqual(mockApplication);
    });

    it('should throw error if application not found', async () => {
      Branch.findOne.mockResolvedValue({ ifsc_code: 'BR123' });
      UserApplication.findOne.mockResolvedValue(null);

      await expect(
        view(faker.number.int(), {
          id: faker.number.int(),
          role: 'branch_manager',
        })
      ).rejects.toThrow('Application not found');
    });
  });
});
