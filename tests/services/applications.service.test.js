const { requestAccount, requestLocker, index, view } = require('../../src/services/applications.service');
const { User, UserAccount, Branch, UserApplication, UserLocker } = require('../../src/models');
const notificationHelper = require('../../src/helpers/notifications.helper');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const { STATUS } = require('../../src/constants/constants');
const redisClient = require('../../src/config/redis');

jest.mock('../../src/models');
jest.mock('../../src/helpers/notifications.helper');
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

describe('Application Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  describe('requestAccount', () => {
    it('should create a new account request successfully', async () => {
      const payload = {
        data: {
          branchIfscCode: 'ABC123',
          type: 'SAVINGS',
          nomineeName: 'John Doe',
        },
        user: { id: 1 },
      };

      const mockBranch = { id: 1, branch_manager_id: 2, ifsc_code: 'ABC123' };
      const mockCustomer = { id: 1, name: 'Jane Doe' };
      const mockBranchManager = { id: 2, email: 'manager@example.com' };

      UserAccount.findOne.mockResolvedValueOnce(null);
      Branch.findOne.mockResolvedValue(mockBranch);
      User.findByPk.mockResolvedValueOnce(mockBranchManager).mockResolvedValueOnce(mockCustomer);
      UserApplication.create.mockResolvedValue({ id: 1, user_id: 1 });

      notificationHelper.applicationRequestNotification.mockResolvedValue();
      notificationHelper.applicationSuccessNotification.mockResolvedValue();

      const result = await requestAccount(payload);

      expect(result).toHaveProperty('id', 1);
      expect(notificationHelper.applicationRequestNotification).toHaveBeenCalledWith(
        mockBranchManager.email,
        mockCustomer.name,
        'account'
      );
      expect(notificationHelper.applicationSuccessNotification).toHaveBeenCalledWith(
        mockCustomer.email,
        'account'
      );
    });

    it('should return error if account already exists', async () => {
      const payload = {
        data: { branchIfscCode: 'ABC123', type: 'SAVINGS', nomineeName: 'John Doe' },
        user: { id: 1 },
      };

      const mockAccount = { id: 1 };
      UserAccount.findOne.mockResolvedValue(mockAccount);

      const result = await requestAccount(payload);

      expect(result).toEqual(commonHelper.customError('Account already exist', 409));
    });

    it('should return error if branch not found', async () => {
      const payload = {
        data: { branchIfscCode: 'ABC123', type: 'SAVINGS', nomineeName: 'John Doe' },
        user: { id: 1 },
      };

      UserAccount.findOne.mockResolvedValue(null);
      Branch.findOne.mockResolvedValue(null);

      const result = await requestAccount(payload);

      expect(result).toEqual(commonHelper.customError('No branch Found.', 404));
    });
  });

  describe('requestLocker', () => {
    it('should create a new locker request successfully', async () => {
      const payload = {
        data: { type: 'SMALL' },
        user: { id: 1 },
      };

      const mockAccount = { id: 1, branch_id: 1 };
      const mockBranch = { id: 1, branch_manager_id: 2, ifsc_code: 'ABC123' };
      const mockLocker = null;
      const mockBranchManager = { id: 2, email: 'manager@example.com' };
      const mockCustomer = { id: 1, email: 'customer@example.com' };

      UserAccount.findOne.mockResolvedValueOnce(mockAccount);
      Branch.findByPk.mockResolvedValueOnce(mockBranch);
      UserLocker.findOne.mockResolvedValue(mockLocker);
      User.findByPk.mockResolvedValue(mockBranchManager).mockResolvedValue(mockCustomer);
      UserApplication.create.mockResolvedValue({ id: 1, user_id: 1 });

      notificationHelper.applicationRequestNotification.mockResolvedValue();
      notificationHelper.applicationSuccessNotification.mockResolvedValue();

      const result = await requestLocker(payload);

      expect(result).toHaveProperty('id', 1);
    });

    it('should return error if locker already exists', async () => {
      const payload = {
        data: { type: 'SMALL' },
        user: { id: 1 },
      };

      const mockLocker = { id: 1, status: STATUS.ACTIVE };
      UserAccount.findOne.mockResolvedValue({ id: 1, branch_id: 1 });
      UserLocker.findOne.mockResolvedValue(mockLocker);

      const result = await requestLocker(payload);

      expect(result).toEqual(commonHelper.customError('Locker already exist', 409));
    });

    it('should return error if no account exists', async () => {
      const payload = {
        data: { type: 'SMALL' },
        user: { id: 1 },
      };

      UserAccount.findOne.mockResolvedValue(null);

      const result = await requestLocker(payload);

      expect(result).toEqual(
        commonHelper.customError('Account does not exist, Cannot request for locker', 409)
      );
    });
  });

  describe('index', () => {
    it('should list applications successfully for branch manager', async () => {
      const payload = {
        query: { page: 1, limit: 10, requestType: 'accounts' },
        user: { id: 1 },
      };

      const mockBranch = { id: 1, branch_manager_id: 1, ifsc_code: 'ABC123' };
      Branch.findOne.mockResolvedValue(mockBranch);
      UserApplication.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: [
          { id: 1, user_id: 1, type: 'SAVINGS' },
          { id: 2, user_id: 2, type: 'SAVINGS' },
        ],
      });

      const result = await index(payload);

      expect(result.totalItems).toBe(2);
      expect(result.totalPages).toBe(1);
      expect(result.currentPage).toBe(1);
      expect(result.applications.length).toBe(2);
    });

    it('should return error if no applications found', async () => {
      const payload = {
        query: { page: 1, limit: 10, requestType: 'accounts' },
        user: { id: 1 },
      };

      Branch.findOne.mockResolvedValueOnce({ id: 1 });
      UserApplication.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      const result = await index(payload);

      expect(result).toEqual({ applications: [], currentPage: 1, totalItems: 0, totalPages: 0 });
    });
  });

  describe('view', () => {
    it('should view an application by id successfully', async () => {
      const payload = { id: 1, user: { id: 1 } };
      const mockBranch = { id: 1, branch_manager_id: 1, ifsc_code: 'ABC123' };
      const mockApplication = { id: 1, user_id: 1, type: 'SAVINGS' };
      const mockUser = { id: 1, name: 'Jane Doe' };

      Branch.findOne.mockResolvedValue(mockBranch);
      UserApplication.findOne.mockResolvedValue(mockApplication);
      User.findByPk.mockResolvedValue(mockUser);

      const result = await view(payload);

      expect(result).toHaveProperty('id', 1);
      expect(result.user_id).toBe(1);
    });

    it('should return error if application not found', async () => {
      const payload = { id: 1, user: { id: 1 } };
      Branch.findOne.mockResolvedValueOnce({ id: 1 });
      UserApplication.findOne.mockResolvedValueOnce(null);

      const result = await view(payload);

      expect(result).toEqual(commonHelper.customError('Application not found', 404));
    });
  });

  describe('requestAccount - Additional Test Cases', () => {
    it('should return error if branch manager or customer is not found', async () => {
      const payload = {
        data: {
          branchIfscCode: 'ABC123',
          type: 'SAVINGS',
          nomineeName: 'John Doe',
        },
        user: { id: 1 },
      };

      const mockBranch = { id: 1, branch_manager_id: 2, ifsc_code: 'ABC123' };
      Branch.findOne.mockResolvedValue(mockBranch);
      User.findByPk.mockResolvedValueOnce(null).mockResolvedValueOnce(null); // Branch Manager and Customer not found

      const result = await requestAccount(payload);

      expect(result).toEqual(commonHelper.customError('User not found', 404));
    });
  });

  describe('requestLocker - Additional Test Cases', () => {
    it('should return error if branch is not found', async () => {
      const payload = {
        data: { type: 'SMALL' },
        user: { id: 1 },
      };

      UserAccount.findOne.mockResolvedValue({ id: 1, branch_id: 1 });
      Branch.findByPk.mockResolvedValue(null); // Branch not found

      const result = await requestLocker(payload);

      expect(result).toEqual(commonHelper.customError('No branch Found.', 404));
    });

    it('should return error if branch manager or customer is not found', async () => {
      const payload = {
        data: { type: 'SMALL' },
        user: { id: 1 },
      };

      const mockAccount = { id: 1, branch_id: 1 };
      const mockBranch = { id: 1, branch_manager_id: 2, ifsc_code: 'ABC123' };

      UserAccount.findOne.mockResolvedValue(mockAccount);
      Branch.findByPk.mockResolvedValue(mockBranch);
      UserLocker.findOne.mockResolvedValue(null);
      User.findByPk.mockResolvedValueOnce(null).mockResolvedValueOnce(null); // Branch Manager and Customer not found

      const result = await requestLocker(payload);

      expect(result).toEqual(commonHelper.customError('User not found', 404));
    });
  });

  describe('index - Additional Test Cases', () => {
    it('should return error if applications is null', async () => {
      const payload = {
        query: { page: 1, limit: 10, requestType: 'accounts' },
        user: { id: 1 },
      };

      Branch.findOne.mockResolvedValue({ id: 1, ifsc_code: 'ABC123' });
      UserApplication.findAndCountAll.mockResolvedValue(null); // Applications null

      const result = await index(payload);

      expect(result).toEqual(commonHelper.customError('No applications found', 404));
    });
  });
});
