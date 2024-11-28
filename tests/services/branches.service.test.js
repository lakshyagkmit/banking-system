const branchService = require('../../src/services/branches.service');
const { User, Role, Branch, Bank } = require('../../src/models');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const { ROLES } = require('../../src/constants/constants');

// Mocking dependencies
jest.mock('../../src/models');
jest.mock('../../src/helpers/commonFunctions.helper');

describe('Branch Service', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    mockBranch = {
      update: jest.fn(),
    };

    // Mock the Branch.findByPk method to return the mock branch
    Branch.findByPk = jest.fn().mockResolvedValue(mockBranch);
  });

  describe('create', () => {
    it('should return error if branch manager is not authorized', async () => {
      const payload = {
        data: {
          branchManagerId: 1,
          address: 'Test Address',
          ifscCode: 'TEST123',
          contact: '1234567890',
          totalLockers: 100,
        },
      };

      User.findOne.mockResolvedValueOnce(null); // Simulate user not found

      const result = await branchService.create(payload);

      expect(result).toEqual(
        commonHelper.customError('The specified user is not authorized as a Branch Manager', 403)
      );
    });

    it('should return error if a branch already exists with same ifscCode, contact, or branch manager id', async () => {
      const payload = {
        data: {
          branchManagerId: 1,
          address: 'Test Address',
          ifscCode: 'TEST123',
          contact: '1234567890',
          totalLockers: 100,
        },
      };

      const branchManager = { id: 1 };
      User.findOne.mockResolvedValueOnce(branchManager); // Simulate valid branch manager

      Branch.findOne.mockResolvedValueOnce({
        ifsc_code: 'TEST123',
        contact: '1234567890',
        branch_manager_id: 1,
      }); // Simulate an existing branch

      const result = await branchService.create(payload);

      expect(result).toEqual(commonHelper.customError('Branch with the same ifsc_code already exists', 409));
    });

    it('should create a new branch successfully', async () => {
      const payload = {
        data: {
          branchManagerId: 1,
          address: 'Test Address',
          ifscCode: 'TEST123',
          contact: '1234567890',
          totalLockers: 100,
        },
      };

      const branchManager = { id: 1 };
      const bank = { id: 1 };
      User.findOne.mockResolvedValueOnce(branchManager); // Valid branch manager
      Branch.findOne.mockResolvedValueOnce(null); // No existing branch
      Bank.findOne.mockResolvedValueOnce(bank); // Simulate finding a bank

      Branch.create.mockResolvedValueOnce({
        id: 1,
        ...payload.data,
        bank_id: bank.id,
      }); // Simulate branch creation

      const result = await branchService.create(payload);

      expect(result).toEqual({
        id: 1,
        ...payload.data,
        bank_id: bank.id,
      });
    });
  });

  describe('index', () => {
    it('should return error if no branches are found', async () => {
      const payload = { query: { page: 1, limit: 10 } };
      Branch.findAndCountAll.mockResolvedValueOnce({ count: 0, rows: [] }); // Simulate no branches found

      const result = await branchService.index(payload);

      // Now expect the result to be the object returned by the service with an empty branch list
      expect(result).toEqual({
        branches: [],
        totalBranches: 0,
        currentPage: 1,
        totalPages: 0,
      });
    });

    it('should return paginated list of branches', async () => {
      const payload = { query: { page: 1, limit: 10 } };
      const branches = { count: 1, rows: [{ id: 1, address: 'Test Address' }] };
      Branch.findAndCountAll.mockResolvedValueOnce(branches); // Simulate branches found

      const result = await branchService.index(payload);

      expect(result).toEqual({
        branches: branches.rows,
        totalBranches: branches.count,
        currentPage: payload.query.page,
        totalPages: 1,
      });
    });
  });

  describe('view', () => {
    it('should return error if branch is not found', async () => {
      const branchId = 1;
      Branch.findByPk.mockResolvedValueOnce(null); // Simulate branch not found

      const result = await branchService.view(branchId);

      expect(result).toEqual(commonHelper.customError('Branch not found', 404));
    });

    it('should return the branch details successfully', async () => {
      const branchId = 1;
      const branch = { id: branchId, address: 'Test Address' };
      Branch.findByPk.mockResolvedValueOnce(branch); // Simulate branch found

      const result = await branchService.view(branchId);

      expect(result).toEqual(branch);
    });
  });

  describe('update', () => {
    it('should return error if branch is not found', async () => {
      const payload = { id: 1, data: { branchManagerId: 1, address: 'New Address' } };
      Branch.findByPk.mockResolvedValueOnce(null); // Simulate branch not found

      const result = await branchService.update(payload);

      expect(result).toEqual(commonHelper.customError('Branch not found', 404));
    });

    it('should return error if branch manager is not authorized', async () => {
      const payload = { id: 1, data: { branchManagerId: 2, address: 'New Address' } };
      const branch = { id: 1, branch_manager_id: 1 };
      Branch.findByPk.mockResolvedValueOnce(branch); // Simulate branch found
      User.findOne.mockResolvedValueOnce(null); // Simulate branch manager not found

      const result = await branchService.update(payload);

      expect(result).toEqual(
        commonHelper.customError('The specified user is not authorized as a Branch Manager', 403)
      );
    });

    it('should return error if branch manager is already assigned to another branch', async () => {
      const payload = { id: 1, data: { branchManagerId: 2, address: 'New Address' } };
      const branch = { id: 1, branch_manager_id: 1 };
      const branchManager = { id: 2, Branch: [{ id: 3 }] };
      Branch.findByPk.mockResolvedValueOnce(branch); // Simulate branch found
      User.findOne.mockResolvedValueOnce(branchManager); // Simulate branch manager already assigned

      const result = await branchService.update(payload);

      expect(result).toEqual(
        commonHelper.customError('The specified Branch Manager is already assigned to another branch', 409)
      );
    });

    it('should return error if IFSC code or contact is already in use by another branch', async () => {
      const payload = { id: 1, data: { ifscCode: 'TEST123', contact: '1234567890' } };
      const branch = { id: 1, ifsc_code: 'OLD_CODE', contact: '0987654321' };
      Branch.findByPk.mockResolvedValueOnce(branch); // Simulate branch found
      Branch.findOne.mockResolvedValueOnce({ id: 2, ifsc_code: 'TEST123', contact: '1234567890' }); // Simulate duplicate IFSC and contact

      const result = await branchService.update(payload);

      expect(result).toEqual(
        commonHelper.customError(
          'The specified IFSC code or contact is already in use by another branch',
          409
        )
      );
    });

    it('should return error if same data is provided for branch manager, ifsc code, or contact', async () => {
      const payload = { id: 1, data: { branchManagerId: 1, ifscCode: 'OLD_CODE', contact: '0987654321' } };
      const branch = { id: 1, branch_manager_id: 1, ifsc_code: 'OLD_CODE', contact: '0987654321' }; // Same data
      Branch.findByPk.mockResolvedValueOnce(branch); // Simulate branch found

      const result = await branchService.update(payload);

      expect(result).toEqual(
        commonHelper.customError(
          'Cannot use same data for branch manager id or ifsc code or contact for updation',
          409
        )
      );
    });

    it('should update branch successfully', async () => {
      const payload = {
        id: 1,
        data: {
          branchManagerId: 2,
          address: 'New Address',
          ifscCode: 'NEWIFSC001',
          contact: '1234567890',
          totalLockers: 50,
        },
      };

      // Set up the mock return value for the update method
      mockBranch.update.mockResolvedValue(mockBranch); // Simulate successful update

      const result = await branchService.update(payload);

      // Assert that the update method was called with the correct values
      expect(mockBranch.update).toHaveBeenCalledWith({
        branch_manager_id: payload.data.branchManagerId,
        address: payload.data.address,
        ifsc_code: payload.data.ifscCode,
        contact: payload.data.contact,
        total_lockers: payload.data.totalLockers,
      });

      // Assert that the result is the updated branch
      expect(result).toEqual(mockBranch);
    });
  });
});
