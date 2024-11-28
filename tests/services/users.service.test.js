const { User, Role, Branch, UserAccount, sequelize } = require('../../src/models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const awsHelper = require('../../src/helpers/aws.helper');
const userService = require('../../src/services/users.service'); // Assuming your service file is named userService.js
const { ROLES } = require('../../src/constants/constants');

// Mocking required modules and functions
jest.mock('../../src/models');
jest.mock('bcryptjs');
jest.mock('../../src/helpers/commonFunctions.helper');
jest.mock('../../src/helpers/aws.helper');

// Mocks for Sequelize methods
User.create = jest.fn();
User.findOne = jest.fn();
User.findAndCountAll = jest.fn();
Role.findOne = jest.fn();
Branch.findOne = jest.fn();
UserAccount.findOne = jest.fn();
sequelize.transaction = jest.fn(() => ({
  commit: jest.fn(),
  rollback: jest.fn(),
}));

// Test for create user function
describe('create user', () => {
  it('should create a new user', async () => {
    const payload = {
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        contact: '1234567890',
        govIssueIdType: 'passport',
        fatherName: 'Father Name',
        motherName: 'Mother Name',
        address: '123 Main St',
        isVerified: true,
        roleCode: ROLES['103'],
      },
      file: { mimetype: 'image/jpeg' }, // mock file
      user: { roles: [ROLES['101']] },
    };

    const hashedPassword = 'hashedpassword123';
    bcrypt.hash.mockResolvedValue(hashedPassword);
    awsHelper.uploadImageToS3.mockResolvedValue('s3url.com/image.jpg');

    Role.findOne.mockResolvedValue({ code: ROLES['103'] });
    User.create.mockResolvedValue({ id: 1, ...payload.data });

    const result = await userService.create(payload);

    expect(result).toHaveProperty('id');
    expect(result.name).toBe(payload.data.name);
    expect(bcrypt.hash).toHaveBeenCalledWith(payload.data.password, 10);
    expect(awsHelper.uploadImageToS3).toHaveBeenCalledWith(payload.file);
  });

  it('should throw error if user already exists by email', async () => {
    const payload = {
      data: {
        email: 'john@example.com',
        contact: '1234567890',
        password: 'password123',
      },
      file: { mimetype: 'image/jpeg' },
      user: { roles: [ROLES['101']] },
    };

    User.findOne.mockResolvedValue({ email: 'john@example.com' });

    await expect(userService.create(payload)).rejects.toThrowError('User with email already exists');
  });

  it('should throw error if no government ID image is provided', async () => {
    const payload = {
      data: {
        email: 'john@example.com',
        contact: '1234567890',
        password: 'password123',
      },
      file: null,
      user: { roles: [ROLES['101']] },
    };

    await expect(userService.create(payload)).rejects.toThrowError('Please add government id image');
  });

  it('should throw error if role is not allowed', async () => {
    const payload = {
      data: {
        email: 'john@example.com',
        contact: '1234567890',
        password: 'password123',
        roleCode: ROLES['102'],
      },
      file: { mimetype: 'image/jpeg' },
      user: { roles: [ROLES['102']] },
    };

    await expect(userService.create(payload)).rejects.toThrowError(
      'Branch managers can only create customers'
    );
  });
});

// Test for index users function
describe('index users', () => {
  it('should return a paginated list of users for admin', async () => {
    const payload = {
      query: { page: 1, limit: 10 },
      user: { roles: [ROLES['101']] },
    };

    User.findAndCountAll.mockResolvedValue({
      count: 5,
      rows: [{ id: 1, name: 'John Doe' }],
    });

    const result = await userService.index(payload);
    expect(result).toHaveProperty('totalItems');
    expect(result.totalPages).toBe(1);
    expect(result.users.length).toBe(1);
  });

  it('should return customers for branch manager', async () => {
    const payload = {
      query: { page: 1, limit: 10 },
      user: { roles: [ROLES['102']], id: 1 },
    };

    Branch.findOne.mockResolvedValue({ id: 1 });
    User.findAndCountAll.mockResolvedValue({
      count: 2,
      rows: [{ id: 1, name: 'Jane Doe' }],
    });

    const result = await userService.index(payload);
    expect(result).toHaveProperty('totalItems');
    expect(result.totalPages).toBe(1);
    expect(result.users.length).toBe(1);
  });

  it('should throw error if no users found', async () => {
    const payload = {
      query: { page: 1, limit: 10 },
      user: { roles: [ROLES['101']] },
    };

    User.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await expect(userService.index(payload)).rejects.toThrowError('No users found');
  });
});

// Test for viewMe function
describe('viewMe function', () => {
  it('should return logged-in user profile', async () => {
    const id = 1;

    User.findOne.mockResolvedValue({ id, name: 'John Doe' });

    const result = await userService.viewMe(id);
    expect(result).toHaveProperty('id', id);
    expect(result.name).toBe('John Doe');
  });

  it('should throw error if user not found', async () => {
    const id = 1;

    User.findOne.mockResolvedValue(null);

    await expect(userService.viewMe(id)).rejects.toThrowError('User not found');
  });
});

// Test for update function
describe('update user', () => {
  it('should update user details', async () => {
    const payload = {
      id: 1,
      data: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        contact: '0987654321',
        fatherName: 'Father Updated',
        motherName: 'Mother Updated',
        address: '456 Street Name',
      },
      user: { roles: [ROLES['101']] },
    };

    User.findOne.mockResolvedValue({ id: 1, name: 'John Doe', update: jest.fn() });

    const result = await userService.update(payload);
    expect(result).toHaveProperty('name', 'Jane Doe');
    expect(User.findOne).toHaveBeenCalledWith({
      where: { id: payload.id },
      include: [{ model: Role, through: { attributes: [] } }],
    });
  });

  it('should throw error if user not found during update', async () => {
    const payload = {
      id: 1,
      data: { email: 'jane@example.com' },
      user: { roles: [ROLES['101']] },
    };

    User.findOne.mockResolvedValue(null);

    await expect(userService.update(payload)).rejects.toThrowError('User not found');
  });
});

// Test for remove user function
describe('remove user', () => {
  it('should remove user successfully', async () => {
    const id = 1;
    const userToDelete = {
      id,
      Roles: [{ code: ROLES['103'] }],
      UserAccounts: [],
      removeRole: jest.fn(),
      destroy: jest.fn(),
    };

    User.findOne.mockResolvedValue(userToDelete);
    Branch.findOne.mockResolvedValue(null);

    const result = await userService.remove(id);
    expect(result.message).toBe('User removed successfully');
  });

  it('should throw error if user not found during removal', async () => {
    const id = 1;

    User.findOne.mockResolvedValue(null);

    await expect(userService.remove(id)).rejects.toThrowError('User not found');
  });

  it('should throw error if trying to delete a branch manager with a branch', async () => {
    const id = 1;
    const userToDelete = {
      id,
      Roles: [{ code: ROLES['102'] }],
      UserAccounts: [],
      removeRole: jest.fn(),
      destroy: jest.fn(),
    };

    User.findOne.mockResolvedValue(userToDelete);
    Branch.findOne.mockResolvedValue({ id: 1 });

    await expect(userService.remove(id)).rejects.toThrowError(
      'Cannot delete a Branch Manager assigned to a branch'
    );
  });

  it('should throw error if trying to delete a customer with active accounts', async () => {
    const id = 1;
    const userToDelete = {
      id,
      Roles: [{ code: ROLES['103'] }],
      UserAccounts: [{ id: 1 }],
      removeRole: jest.fn(),
      destroy: jest.fn(),
    };

    User.findOne.mockResolvedValue(userToDelete);
    Branch.findOne.mockResolvedValue(null);

    await expect(userService.remove(id)).rejects.toThrowError(
      'Cannot delete a customer with an active account'
    );
  });
});

// Test for update roles function
describe('update roles', () => {
  it('should update user roles', async () => {
    const payload = {
      id: 1,
      data: { rolesToAdd: [ROLES['103']], rolesToRemove: [] },
    };

    const user = { Roles: [{ code: ROLES['102'] }], addRole: jest.fn(), removeRole: jest.fn() };
    User.findOne.mockResolvedValue(user);
    Role.findOne.mockResolvedValue({ code: ROLES['103'] });

    const result = await userService.updateRoles(payload);

    expect(result.updatedRoles.added).toEqual([ROLES['103']]);
  });

  it('should throw error if removing a branch manager role while managing a branch', async () => {
    const payload = {
      id: 1,
      data: { rolesToAdd: [], rolesToRemove: [ROLES['102']] },
    };

    const user = { Roles: [{ code: ROLES['102'] }] };
    User.findOne.mockResolvedValue(user);
    Branch.findOne.mockResolvedValue({ id: 1 });

    await expect(userService.updateRoles(payload)).rejects.toThrowError(
      'Cannot remove the branch manager role while the user is assigned to a branch'
    );
  });

  it('should throw error if removing customer role while the user has active accounts', async () => {
    const payload = {
      id: 1,
      data: { rolesToAdd: [], rolesToRemove: [ROLES['103']] },
    };

    const user = { Roles: [{ code: ROLES['103'] }] };
    User.findOne.mockResolvedValue(user);
    UserAccount.findOne.mockResolvedValue({ id: 1 });

    await expect(userService.updateRoles(payload)).rejects.toThrowError(
      'Cannot remove the customer role while the user has active accounts'
    );
  });
});
