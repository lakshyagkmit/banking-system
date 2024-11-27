const { create, index, view, update } = require('../../src/controllers/branches.controller');
const { Branch, User, Role, Bank } = require('../../src/models');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const { ROLES } = require('../../src/constants/constants');
const { Op } = require('sequelize');

jest.mock('../../src/models');
jest.mock('../../src/helpers/commonFunctions.helper');

describe('Branch Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new branch successfully', async () => {
      const mockPayload = {
        data: {
          branchManagerId: 1,
          address: '123 Main Street',
          ifscCode: 'ABC123',
          contact: '1234567890',
          totalLockers: 50,
        },
      };

      const mockBranchManager = { id: 1 };
      const mockBank = { id: 1 };
      const mockCreatedBranch = { id: 1, ...mockPayload.data };

      User.findOne.mockResolvedValue(mockBranchManager);
      Bank.findOne.mockResolvedValue(mockBank);
      Branch.findOne.mockResolvedValueOnce(null); // No duplicate
      Branch.create.mockResolvedValue(mockCreatedBranch);

      const result = await create(mockPayload);

      expect(result).toEqual(mockCreatedBranch);
      expect(User.findOne).toHaveBeenCalledWith({
        where: { id: mockPayload.data.branchManagerId },
        include: {
          model: Role,
          where: { code: ROLES['102'] },
          through: { attributes: [] },
        },
      });
      expect(Bank.findOne).toHaveBeenCalled();
      expect(Branch.create).toHaveBeenCalledWith({
        bank_id: mockBank.id,
        branch_manager_id: mockPayload.data.branchManagerId,
        address: mockPayload.data.address,
        ifsc_code: mockPayload.data.ifscCode,
        contact: mockPayload.data.contact,
        total_lockers: mockPayload.data.totalLockers,
      });
    });

    it('should return error if branch manager is invalid', async () => {
      const mockPayload = { data: { branchManagerId: 999 } };
      User.findOne.mockResolvedValue(null);

      const result = await create(mockPayload);

      expect(result).toEqual(
        commonHelper.customError('The specified user is not authorized as a Branch Manager', 403)
      );
      expect(User.findOne).toHaveBeenCalled();
    });

    it('should return error if duplicate branch exists', async () => {
      const mockPayload = {
        data: {
          branchManagerId: 1,
          address: '123 Main Street',
          ifscCode: 'ABC123',
          contact: '1234567890',
        },
      };
      const mockDuplicateBranch = { ifsc_code: 'ABC123' };

      User.findOne.mockResolvedValue({ id: 1 });
      Branch.findOne.mockResolvedValue(mockDuplicateBranch);

      const result = await create(mockPayload);

      expect(result).toEqual(commonHelper.customError('Branch with the same ifsc_code already exists', 409));
      expect(Branch.findOne).toHaveBeenCalledWith({
        where: {
          [Op.or]: [
            { ifsc_code: mockPayload.data.ifscCode },
            { contact: mockPayload.data.contact },
            { branch_manager_id: mockPayload.data.branchManagerId },
          ],
        },
      });
    });
  });

  describe('index', () => {
    it('should return paginated branches', async () => {
      const mockPayload = { query: { page: 1, limit: 2 } };
      const mockBranches = {
        count: 5,
        rows: [{ id: 1 }, { id: 2 }],
      };

      Branch.findAndCountAll.mockResolvedValueOnce(mockBranches);

      const result = await index(mockPayload);

      expect(result).toEqual(undefined);
    });

    it('should return error if no branches found', async () => {
      Branch.findAndCountAll.mockResolvedValue(null);

      const result = await index({ query: { page: 1, limit: 2 } });

      expect(result).toEqual(commonHelper.customError('No branches found', 404));
    });
  });

  describe('view', () => {
    it('should return a branch by ID', async () => {
      const mockBranch = { id: 1 };
      Branch.findByPk.mockResolvedValueOnce(mockBranch);

      const result = await view(1);

      expect(result).toEqual(undefined);
    });

    it('should return error if branch not found', async () => {
      Branch.findByPk.mockResolvedValue(null);

      const result = await view(999);

      expect(result).toEqual(commonHelper.customError('Branch not found', 404));
    });
  });

  describe('update', () => {
    it('should update a branch successfully', async () => {
      const mockPayload = {
        id: 1,
        data: { address: 'New Address' },
      };
      const mockBranch = { id: 1, update: jest.fn() };
      Branch.findByPk.mockResolvedValue(mockBranch);

      const updatedBranch = { id: 1, address: 'New Address' };
      mockBranch.update.mockResolvedValue(updatedBranch);

      const result = await update(mockPayload);

      expect(result).toEqual(undefined);
    });

    it('should return error if branch not found', async () => {
      Branch.findByPk.mockResolvedValue(null);

      const result = await update({ id: 999, data: {} });

      expect(result).toEqual(commonHelper.customError('Branch not found', 404));
    });

    it('should return error if duplicate IFSC code or contact exists', async () => {
      const mockPayload = {
        id: 1,
        data: { ifscCode: 'DUPLICATE123' },
      };
      const mockBranch = { id: 1, update: jest.fn() };
      Branch.findByPk.mockResolvedValue(mockBranch);
      Branch.findOne.mockResolvedValue({ id: 2 });

      const result = await update(mockPayload);

      expect(result).toEqual(
        commonHelper.customError(
          'The specified IFSC code or contact is already in use by another branch',
          409
        )
      );
    });
  });
});
