const branchService = require('../../src/services/branches.service');
const { User, Role, Branch, Bank } = require('../../src/models');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const { ROLES } = require('../../src/constants/constants');
const { Op } = require('sequelize');

jest.mock('../../src/models');
jest.mock('../../src/helpers/commonFunctions.helper');

describe('Branch Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a branch with valid data', async () => {
      const payload = {
        data: {
          branchManagerId: 1,
          address: '123 Street',
          ifscCode: 'IFSC001',
          contact: '1234567890',
          totalLockers: 10,
        },
      };

      const mockBranchManager = { id: 1 };
      const mockBank = { id: 1 };
      const mockBranch = { id: 1, ...payload.data };

      User.findOne.mockResolvedValue(mockBranchManager);
      Branch.findOne.mockResolvedValue(null); // No duplicate found
      Bank.findOne.mockResolvedValue(mockBank);
      Branch.create.mockResolvedValue(mockBranch);

      const result = await branchService.create(payload);

      expect(User.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: payload.data.branchManagerId },
        })
      );
      expect(Branch.findOne).toHaveBeenCalled();
      expect(Bank.findOne).toHaveBeenCalled();
      expect(Branch.create).toHaveBeenCalledWith(
        expect.objectContaining({
          bank_id: mockBank.id,
          branch_manager_id: payload.data.branchManagerId,
          address: payload.data.address,
          ifsc_code: payload.data.ifscCode, // Use database field name
          contact: payload.data.contact,
          total_lockers: payload.data.totalLockers, // Use database field name
        })
      );
      expect(result).toEqual(mockBranch);
    });

    it('should throw an error if the branch manager does not exist', async () => {
      const payload = {
        data: {
          branchManagerId: 99, // Non-existent ID
          address: '123 Street',
          ifscCode: 'IFSC001',
          contact: '1234567890',
          totalLockers: 10,
        },
      };

      // Mock User.findOne to return null (no branch manager found)
      User.findOne.mockResolvedValue(null);

      // Assert that the service throws the expected error
      await expect(branchService.create(payload)).rejects.toEqual(
        commonHelper.customError('The specified user is not authorized as a Branch Manager', 403)
      );

      expect(User.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: payload.data.branchManagerId },
        })
      );
    });

    it('should throw an error if a duplicate branch exists', async () => {
      const payload = {
        data: {
          branchManagerId: 1,
          address: '123 Street',
          ifscCode: 'IFSC001',
          contact: '1234567890',
          totalLockers: 10,
        },
      };

      const mockExistingBranch = { ifsc_code: 'IFSC001', contact: '1234567890' };

      User.findOne.mockResolvedValue({ id: 1 });
      Branch.findOne.mockResolvedValue(mockExistingBranch);

      await expect(branchService.create(payload)).rejects.toEqual(
        commonHelper.customError('Branch with the same ifsc_code already exists', 409)
      );

      expect(User.findOne).toHaveBeenCalled();
      expect(Branch.findOne).toHaveBeenCalled();
      expect(Branch.create).not.toHaveBeenCalled();
    });
  });

  describe('index', () => {
    it('should return a paginated list of branches', async () => {
      const payload = { query: { page: 1, limit: 10 } };
      const mockBranches = {
        rows: [
          { id: 1, name: 'Branch 1' },
          { id: 2, name: 'Branch 2' },
        ],
        count: 2,
      };

      Branch.findAndCountAll.mockResolvedValue(mockBranches);

      const result = await branchService.index(payload);

      expect(Branch.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 0,
          limit: 10,
        })
      );
      expect(result).toEqual({
        branches: mockBranches.rows,
        totalBranches: mockBranches.count,
        currentPage: 1,
        totalPages: 1,
      });
    });

    it('should throw an error if no branches are found', async () => {
      const payload = { query: { page: 1, limit: 10 } };

      Branch.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

      await expect(branchService.index(payload)).rejects.toEqual(
        commonHelper.customError('No branches found', 404)
      );

      expect(Branch.findAndCountAll).toHaveBeenCalled();
    });
  });

  describe('view', () => {
    it('should return a branch by id', async () => {
      const mockBranch = { id: 1, name: 'Branch 1' };

      Branch.findByPk.mockResolvedValue(mockBranch);

      const result = await branchService.view(1);

      expect(Branch.findByPk).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockBranch);
    });

    it('should throw an error if the branch is not found', async () => {
      Branch.findByPk.mockResolvedValue(null);

      await expect(branchService.view(1)).rejects.toEqual(commonHelper.customError('Branch not found', 404));

      expect(Branch.findByPk).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a branch with valid data', async () => {
      // Arrange
      const mockBranch = {
        update: jest.fn().mockResolvedValue({
          address: 'Updated Address',
          branch_manager_id: 2,
          contact: '9876543210',
          ifsc_code: 'NEWIFSC001',
          total_lockers: 15,
        }),
        branch_manager_id: 1,
        ifsc_code: 'OLDIFSC001',
        contact: '1234567890',
      };

      // Mock necessary database calls
      Branch.findByPk.mockResolvedValue(mockBranch); // Return the mock branch
      User.findOne.mockResolvedValue({ id: 2 }); // Valid branch manager
      Branch.findOne.mockResolvedValue(null); // No duplicate branches found

      const payload = {
        id: 1,
        data: {
          address: 'Updated Address',
          branchManagerId: 2,
          contact: '9876543210',
          ifscCode: 'NEWIFSC001',
          totalLockers: 15,
        },
      };

      // Act
      const result = await branchService.update(payload);

      // Assert
      expect(User.findOne).toHaveBeenCalled(); // Validating branch manager
      expect(Branch.findOne).toHaveBeenCalled(); // Checking for duplicates
      expect(mockBranch.update).toHaveBeenCalledWith(
        expect.objectContaining({
          address: payload.data.address,
          branch_manager_id: payload.data.branchManagerId,
          contact: payload.data.contact,
          ifsc_code: payload.data.ifscCode,
          total_lockers: payload.data.totalLockers,
        })
      );
      expect(result).toEqual({
        address: 'Updated Address',
        branch_manager_id: 2,
        contact: '9876543210',
        ifsc_code: 'NEWIFSC001',
        total_lockers: 15,
      });
    });

    it('should throw an error if the branch is not found', async () => {
      const payload = { id: 1, data: {} };

      Branch.findByPk.mockResolvedValue(null);

      await expect(branchService.update(payload)).rejects.toEqual(
        commonHelper.customError('Branch not found', 404)
      );

      expect(Branch.findByPk).toHaveBeenCalled();
    });

    it('should throw an error if a duplicate IFSC code or contact exists', async () => {
      const payload = {
        id: 1,
        data: { ifscCode: 'IFSC001', contact: '1234567890' },
      };

      const mockBranch = { id: 1, ifsc_code: 'OLDIFSC001' };
      const mockDuplicateBranch = { id: 2, ifsc_code: 'IFSC001' };

      Branch.findByPk.mockResolvedValue(mockBranch);
      Branch.findOne.mockResolvedValue(mockDuplicateBranch);

      await expect(branchService.update(payload)).rejects.toEqual(
        commonHelper.customError(
          'The specified IFSC code or contact is already in use by another branch',
          409
        )
      );

      expect(Branch.findByPk).toHaveBeenCalled();
      expect(Branch.findOne).toHaveBeenCalled();
    });
  });
});
