const { User, Role, Branch, UserAccount, sequelize } = require('../../src/models');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const awsHelper = require('../../src/helpers/aws.helper');
const { ROLES } = require('../../src/constants/constants');
const bcrypt = require('bcryptjs');
const {
  create,
  index,
  view,
  viewMe,
  update,
  remove,
  updateRoles,
} = require('../../src/services/users.service');

// Mocking the necessary models and helpers
jest.mock('../../src/models');
jest.mock('../../src/helpers/commonFunctions.helper');
jest.mock('../../src/helpers/aws.helper');
jest.mock('bcryptjs');

describe('UserController', () => {
  // Mock setup for bcrypt and AWS helper
  beforeAll(() => {
    bcrypt.hash.mockResolvedValue('hashedpassword');
    awsHelper.uploadImageToS3.mockResolvedValue('s3url');
  });

  // Test Case for 'create' function
  describe('create', () => {
    it('should create a new user and assign the correct role', async () => {
      const payload = {
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          contact: '1234567890',
          govIssueIdType: 'passport',
          fatherName: 'Father Doe',
          motherName: 'Mother Doe',
          address: '123 Street',
          isVerified: true,
          roleCode: ROLES['103'], // customer role
        },
        file: { buffer: 'image' }, // Mock file upload
        user: { roles: [ROLES['101']] }, // Admin user
      };

      User.create.mockResolvedValue({
        id: 1,
        ...payload.data,
        password: 'hashedpassword',
      });
      Role.findOne.mockResolvedValue({ code: ROLES['103'] });
      User.prototype.addRole.mockResolvedValue();

      const result = await create(payload);

      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
      expect(result.password).toBe('hashedpassword');
      expect(awsHelper.uploadImageToS3).toHaveBeenCalled();
    });

    it('should throw error if email or contact already exists', async () => {
      const payload = {
        data: { email: 'john@example.com', contact: '1234567890' },
        file: null,
        user: { roles: [ROLES['101']] },
      };

      User.findOne.mockResolvedValue({ email: 'john@example.com' });

      await expect(create(payload)).rejects.toThrow('User with email already exists');
    });
  });

  // Test Case for 'index' function
  describe('index', () => {
    it('should return users based on admin role', async () => {
      const payload = {
        query: { page: 1, limit: 10, userRole: ROLES['103'] },
        user: { roles: [ROLES['101']] }, // Admin user
      };

      User.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [{ id: 1, name: 'John Doe' }],
      });

      const result = await index(payload);

      expect(result.totalItems).toBe(1);
      expect(result.users[0].name).toBe('John Doe');
    });

    it('should throw error if no users found', async () => {
      const payload = {
        query: { page: 1, limit: 10 },
        user: { roles: [ROLES['101']] }, // Admin user
      };

      User.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await expect(index(payload)).rejects.toThrow('No users found');
    });
  });

  // Test Case for 'viewMe' function
  describe('viewMe', () => {
    it('should return the user profile', async () => {
      const userId = 1;
      User.findOne.mockResolvedValue({
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
      });

      const result = await viewMe(userId);

      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
    });

    it('should throw error if user not found', async () => {
      const userId = 1;
      User.findOne.mockResolvedValue(null);

      await expect(viewMe(userId)).rejects.toThrow('User not found');
    });
  });

  // Test Case for 'view' function
  describe('view', () => {
    it('should return a user profile for admin', async () => {
      const payload = {
        id: 1,
        user: { roles: [ROLES['101']] }, // Admin user
      };

      User.findOne.mockResolvedValue({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      });

      const result = await view(payload);

      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
    });

    it('should throw error if user not found', async () => {
      const payload = { id: 1, user: { roles: [ROLES['101']] } };

      User.findOne.mockResolvedValue(null);

      await expect(view(payload)).rejects.toThrow('User not found');
    });
  });

  // Test Case for 'update' function
  describe('update', () => {
    it('should update the user details', async () => {
      const payload = {
        id: 1,
        data: {
          name: 'John Doe Updated',
          email: 'john.updated@example.com',
          contact: '9876543210',
          fatherName: 'Updated Father',
          motherName: 'Updated Mother',
          address: '456 New Street',
        },
        user: { roles: [ROLES['101']] }, // Admin user
      };

      User.findOne.mockResolvedValue({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        contact: '1234567890',
        update: jest.fn().mockResolvedValue({
          name: 'John Doe Updated',
          email: 'john.updated@example.com',
        }),
      });

      const result = await update(payload);

      expect(result.name).toBe('John Doe Updated');
      expect(result.email).toBe('john.updated@example.com');
    });

    it('should throw error if user not found', async () => {
      const payload = {
        id: 1,
        data: { name: 'Updated Name' },
        user: { roles: [ROLES['101']] }, // Admin user
      };

      User.findOne.mockResolvedValue(null);

      await expect(update(payload)).rejects.toThrow('User not found');
    });
  });

  // Test Case for 'remove' function
  describe('remove', () => {
    it('should delete a user', async () => {
      const userId = 1;

      User.findOne.mockResolvedValue({
        id: userId,
        Roles: [{ code: ROLES['102'] }],
        UserAccounts: [],
        removeRole: jest.fn(),
        destroy: jest.fn(),
      });

      Branch.findOne.mockResolvedValue(null); // No branch manager
      await expect(remove(userId)).resolves.toEqual({ message: 'User removed successfully' });
    });

    it('should throw error if user not found', async () => {
      const userId = 1;

      User.findOne.mockResolvedValue(null);

      await expect(remove(userId)).rejects.toThrow('User not found');
    });
  });

  // Test Case for 'updateRoles' function
  describe('updateRoles', () => {
    it('should update user roles', async () => {
      const payload = {
        id: 1,
        data: {
          rolesToAdd: [ROLES['103']],
          rolesToRemove: [ROLES['102']],
        },
      };

      User.findOne.mockResolvedValue({
        id: 1,
        Roles: [{ code: ROLES['102'] }],
        addRole: jest.fn(),
        removeRole: jest.fn(),
      });

      Role.findOne.mockResolvedValue({ code: ROLES['103'] });
      Branch.findOne.mockResolvedValue(null); // No active branch manager

      await expect(updateRoles(payload)).resolves.toEqual({
        updatedRoles: { added: [ROLES['103']], removed: [ROLES['102']] },
      });
    });

    it('should throw error if user not found', async () => {
      const payload = {
        id: 1,
        data: {
          rolesToAdd: [ROLES['103']],
          rolesToRemove: [ROLES['102']],
        },
      };

      User.findOne.mockResolvedValue(null);

      await expect(updateRoles(payload)).rejects.toThrow('User not found');
    });
  });
});
